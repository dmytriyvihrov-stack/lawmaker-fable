import { BOND_UI } from '../content/bonds';
import {
  bondFromChoice,
  giftBlock,
  isPerson,
  loverBlock,
  loverOf,
  nudgeBond,
} from './bonds';
import { canPlace, fallbackPlot, needsPlacement } from './plots';
import { CONFIG } from './config';
import { evaluate } from './conditions';
import { monarchOf, traitOf } from './monarch';
import { renderTemplate, roman } from './format';
import { pickEvent } from './scheduler';
import { breachFor, truthOf, wrongfulConvictions } from './verdict';
import { actAbroad, openWorld, tickWorld, type WorldAction } from './world';
import {
  activeStats,
  animalKeep,
  herdKeep,
  crowdingOnHealth,
  isActiveStat,
  isWinter,
  lawTrend,
  storeCap,
  winterWeight,
  openTechs,
  researchGain,
  scaleEffects,
  squareHasHadEnough,
  stageRule,
  trendOf,
  winterMouths,
  workCost,
  yearlyChange,
  workOnce,
} from './simulation';
import {
  allProposals,
  allTechs,
  findLawOption,
  getAftermath,
  getCase,
  getProposal,
  getWork,
} from './registry';
import { UI } from '../content/ui-strings';
import { DEFEAT_STATS } from '../content/defeat';
import { OWN_ROPE_SCENE, OWN_ROPE_SCENES } from '../content/own-rope';
import { MOMENT_SOURCE } from '../content/moments';
import { getMoment, momentTaken } from './moments';
import type {
  CityFlag,
  Effects,
  GameState,
  LawId,
  LawOption,
  PhilTag,
  PlotId,
  StatId,
  WorkId,
} from './types';

const STAT_IDS: StatId[] = ['crownSanity', 'mood', 'health', 'economy', 'army', 'culture'];

function clone(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s)) as GameState;
}

/** A tenth of a point, which is the unit every board is written in. */
function tenths(v: number): number {
  return Math.round(v * 10) / 10;
}

/**
 * A board is held to a tenth of a point and rounded there on every write.
 *
 * Tenths are the unit the boards are scaled in, and adding one tenth to
 * another in binary hands back a number with seventeen digits on the end of
 * it. Rounding at the one place a board is ever written keeps that out of the
 * save file, out of the ledger and off the screen.
 */
function clamp(v: number, ceiling: number = CONFIG.statMax): number {
  return Math.max(CONFIG.statMin, Math.min(ceiling, tenths(v)));
}

/**
 * The only way a board ever moves. Boards the place is too small to have are
 * not moved at all, and every move leaves a line in the ledger saying who did
 * it, so a dial can always answer the question "why".
 */
export function bump(
  draft: GameState,
  stat: StatId,
  delta: number,
  source: string,
  every = false,
): void {
  if (delta === 0) return;
  if (!isActiveStat(draft, stat)) return;
  const before = draft.stats[stat];
  // the store is the one board with a lid, and the lid is what the granary
  // lifts: everything over it is a good year with nowhere to put it
  const after = clamp(before + delta, stat === 'economy' ? storeCap(draft) : CONFIG.statMax);
  if (after === before) return;
  draft.stats[stat] = after;
  draft.ledger.push({ turn: draft.turn, stat, delta: tenths(after - before), source, every });
  if (draft.ledger.length > CONFIG.ledgerKeep) {
    draft.ledger = draft.ledger.slice(draft.ledger.length - CONFIG.ledgerKeep);
  }
}

/** The monarch on the throne bends one rule of the arithmetic. */
/**
 * A line in the ledger for a year in which nothing moved.
 *
 * `bump` refuses a delta of zero, and it is right to: a dial that did not move
 * has nothing to explain. But a year can be spent on something that comes back
 * with nothing (asking a neighbour for grain and being refused), and a spent
 * year with no record of what it was spent on is the one thing worse than a
 * bad outcome. This writes the line and moves no dial.
 */
function noteLine(draft: GameState, stat: StatId, source: string): void {
  draft.ledger.push({ turn: draft.turn, stat, delta: 0, source });
  if (draft.ledger.length > CONFIG.ledgerKeep) {
    draft.ledger = draft.ledger.slice(draft.ledger.length - CONFIG.ledgerKeep);
  }
}

function applyEffects(
  draft: GameState,
  effects: Effects | undefined,
  source: string,
  every = false,
): void {
  if (!effects) return;
  const trait = traitOf(draft.seed);
  for (const id of STAT_IDS) {
    const raw = effects[id];
    if (raw === undefined) continue;
    let delta = raw;
    if (id === 'economy' && delta > 0 && trait.economyGainBonus) {
      delta += trait.economyGainBonus;
    }
    if (id === 'health' && delta < 0 && trait.healthLossRelief) {
      delta = Math.min(0, delta + trait.healthLossRelief);
    }
    if (id === 'mood' && delta !== 0 && trait.moodAmplify) {
      delta += delta > 0 ? trait.moodAmplify : -trait.moodAmplify;
    }
    // a hamlet cannot feel this yet, but it will remember it
    if (!isActiveStat(draft, id)) {
      draft.pendingTownBonus[id] = (draft.pendingTownBonus[id] ?? 0) + delta;
      continue;
    }
    bump(draft, id, delta, source, every);
  }
}

function diffStats(before: Record<StatId, number>, after: Record<StatId, number>): Effects {
  const out: Effects = {};
  for (const id of STAT_IDS) {
    const d = after[id] - before[id];
    if (d !== 0) out[id] = d;
  }
  return out;
}

function addFlags(list: CityFlag[], on?: CityFlag[]): CityFlag[] {
  if (!on || on.length === 0) return list;
  const set = new Set(list);
  for (const f of on) set.add(f);
  return [...set];
}

function removeFlags(list: CityFlag[], off?: CityFlag[]): CityFlag[] {
  if (!off || off.length === 0) return list;
  return list.filter((f) => !off.includes(f));
}

export { findLawOption };

/** The label a ledger line uses for a law: its number in the Codex. */
/**
 * Whether this exception is the one the town cannot let stand: a breach of a
 * standing decree that names the rope. Every other law in the game describes an
 * arrangement, and an arrangement can carry an exception. This one describes a
 * sentence, and a sentence with an exception in it is not a sentence.
 */
function breaksTheRope(draft: GameState, law: LawId): boolean {
  if (law !== 'crime_hanged') return false;
  return draft.laws.some(
    (l) => l.status === 'active' && `${l.subject}_${l.action}` === 'crime_hanged',
  );
}

function lawSource(draft: GameState, option: LawOption): string {
  const idx = draft.laws.findIndex(
    (l) => l.subject === option.subject && l.action === option.action && l.status === 'active',
  );
  return UI.ledger.law.replace('{n}', roman(idx >= 0 ? idx + 1 : draft.laws.length + 1));
}

/** Steps 1 to 3 of chooseLaw: replace, seal, apply effects and city layers. */
function sealLaw(draft: GameState, option: LawOption, labelOverride?: string): void {
  // 1. the previous active law on this subject steps down
  for (const law of draft.laws) {
    if (law.status === 'active' && law.subject === option.subject) {
      law.status = 'replaced';
      const old = findLawOption(law.subject, law.action, law.label);
      const keep = option.cityFlagsOn ?? [];
      const drop = (old?.cityFlagsOn ?? []).filter((f) => !keep.includes(f));
      draft.cityFlags = removeFlags(draft.cityFlags, drop);
    }
  }

  // 2. seal the new one
  draft.laws.push({
    subject: option.subject,
    action: option.action,
    label: labelOverride ?? option.label,
    turn: draft.turn,
    status: 'active',
  });

  // 3. effects and city layers. A decree lands as hard as CONFIG.law says.
  applyEffects(draft, scaleEffects(option.effects, CONFIG.law.sealScale), lawSource(draft, option));
  draft.cityFlags = addFlags(draft.cityFlags, option.cityFlagsOn);
  draft.cityFlags = removeFlags(draft.cityFlags, option.cityFlagsOff);
}

export function newGame(seed: number): GameState {
  return {
    version: 1,
    seed: seed >>> 0,
    turn: 0,
    phase: 'intro',
    stats: {
      crownSanity: CONFIG.start.crownSanity,
      mood: CONFIG.start.mood,
      health: CONFIG.start.health,
      economy: CONFIG.start.economy,
      army: CONFIG.start.army,
      culture: CONFIG.start.culture,
    },
    population: CONFIG.population.start,
    stage: 'village',
    townSince: null,
    townName: null,
    boards: [],
    buildings: {
      house: 0,
      woodcutter: 0,
      fields: 0,
      well: 0,
      fence: 0,
      mine: 0,
      granary: 0,
      watch_house: 0,
      long_room: 0,
      hall: 0,
      road: 0,
      bridge: 0,
      fair: 0,
      rest: 0,
    },
    ledger: [],
    verdicts: [],
    reopening: null,
    eventsThisYear: 0,
    research: 0,
    techs: [],
    lastLawTurn: -99,
    lastWorkTurn: 0,
    lastWork: null,
    pendingTownBonus: {},
    declaredTag: null,
    laws: [],
    exceptions: [],
    usedProposals: [],
    shownCases: [],
    pending: [],
    flags: [],
    cityFlags: [],
    iva: [],
    log: [],
    current: null,
    lastAftermath: null,
    bonds: {},
    lover: null,
    placements: {},
  };
}

/**
 * Something is put in somebody's hands.
 *
 * Two off the store buys one rung and nothing else: no board moves, the square
 * does not hear about it, and the same person cannot be given anything again
 * for two years. That last rule is the whole design of it. A lawmaker who
 * could give every year would simply buy a place that loved them by year six,
 * and what is being modelled here is not a shop.
 */
export function giveGift(s: GameState, character: string): GameState {
  if (giftBlock(s, character) !== null) return s;
  const draft = clone(s);
  bump(draft, 'economy', -CONFIG.bond.giftCost, BOND_UI.giftLabel);
  nudgeBond(draft, character, 1);
  const bonds = draft.bonds ?? {};
  const now = bonds[character] ?? { level: 0 as const };
  draft.bonds = { ...bonds, [character]: { ...now, giftTurn: draft.turn } };
  return draft;
}

/**
 * The one thing on this list that is not bought.
 *
 * It is only open at the top rung, where the whole place has already worked it
 * out and the two of you are the last to say so, and what it costs is the day
 * itself. What it gives back is in `trendOf`: the only steady pull upwards on
 * a board that otherwise only ever falls.
 */
export function takeLover(s: GameState, character: string): GameState {
  if (loverBlock(s, character) !== null) return s;
  if (s.lover === character) return s;
  const draft = clone(s);
  bump(draft, 'economy', -CONFIG.bond.loverCost, BOND_UI.loverLabel);
  draft.lover = character;
  const bonds = draft.bonds ?? {};
  const now = bonds[character] ?? { level: 2 as const };
  draft.bonds = { ...bonds, [character]: { ...now, loverSince: draft.turn } };
  return draft;
}

/**
 * The place is given a name. It changes nothing on any board: what it changes
 * is that from here on the carters know which turning, and so does the header.
 */
export function nameTown(s: GameState, name: string): GameState {
  const draft = clone(s);
  draft.townName = name;
  return draft;
}

/**
 * The place decides it is going to be a thing with a watch, or a thing with
 * songs. Nothing is paid for it: the board simply exists from now on, at the
 * value it has been quietly sitting at, and everything that ever promised it
 * something pays out at once.
 */
export function openBoard(s: GameState, board: StatId): GameState {
  if (s.boards.includes(board)) return s;
  const draft = clone(s);
  draft.boards.push(board);
  // whatever was banked against this board while the place could not feel it
  const owed = draft.pendingTownBonus[board];
  if (owed) {
    delete draft.pendingTownBonus[board];
    bump(draft, board, owed, UI.ledger.charter);
  }
  return draft;
}

export function chooseDeclared(s: GameState, tag: PhilTag): GameState {
  const draft = clone(s);
  draft.declaredTag = tag;
  return advance(draft);
}

/**
 * labelOverride carries the wording the player assembled at the drafting table.
 * It changes the text of the decree only: the option still decides the rules.
 */
export function chooseLaw(
  s: GameState,
  proposalId: string,
  optionIdx: number,
  labelOverride?: string,
): GameState {
  const proposal = getProposal(proposalId);
  if (!proposal) return s;
  const option = proposal.options[optionIdx];
  if (!option) return s;

  const draft = clone(s);
  const before = { ...draft.stats };
  const wasReopening = draft.reopening === proposal.id;

  sealLaw(draft, option, labelOverride);

  // a second opinion in public costs the crown and the square, unless the
  // clerks have worked out how to copy a law out fair
  if (wasReopening) {
    const cost = draft.techs.includes('scribes') ? CONFIG.reopenWithScribes : CONFIG.reopen;
    applyEffects(draft, cost, UI.ledger.reopen);
    draft.reopening = null;
  }

  draft.log.push({
    turn: draft.turn,
    kind: 'law',
    refId: proposal.id,
    choiceId: `${option.subject}_${option.action}`,
    tags: option.tags,
  });
  if (!draft.usedProposals.includes(proposal.id)) draft.usedProposals.push(proposal.id);
  draft.lastLawTurn = draft.turn;

  const scene = getAftermath(option.aftermathId);
  const paragraphs: string[] = [];
  if (scene) {
    paragraphs.push(...scene.paragraphs);
    for (const ex of scene.extra ?? []) {
      if (evaluate(ex.when, draft)) paragraphs.push(ex.paragraph);
    }
  }
  draft.lastAftermath = {
    paragraphs: paragraphs.map((p) => renderTemplate(p, draft)),
    deltas: diffStats(before, draft.stats),
  };

  draft.phase = 'aftermath';
  return draft;
}

/**
 * `ruling` is the sentence the player wrote at the bench. It is prepended to the
 * aftermath so the scene follows the player's own words. It changes no rules.
 */
export function chooseCase(
  s: GameState,
  caseId: string,
  choiceId: string,
  ruling?: string,
): GameState {
  const ev = getCase(caseId);
  if (!ev) return s;
  const choice = ev.choices.find((c) => c.id === choiceId);
  if (!choice) return s;

  const draft = clone(s);
  const before = { ...draft.stats };

  // 1. effects. One person in front of you is a unit or two, never a fifth.
  applyEffects(draft, scaleEffects(choice.effects, CONFIG.caseScale), ev.title);

  // 2. an exception to your own law costs the square's trust
  const trait = traitOf(draft.seed);
  const exceptionCost = trait.exceptionSanityCost ?? CONFIG.exceptionCost;
  const breakLaw = (law: LawId, beneficiary: string): void => {
    draft.exceptions.push({ law, beneficiary, turn: draft.turn });
    // bending your own law is a thing you do to yourself first
    bump(draft, 'crownSanity', -exceptionCost, UI.ledger.exception);
    // and one law in this game does not have a "first" about it. A decree that
    // names the rope names no exceptions, because you wrote none into it, and
    // the town has been taught all reign to read a decree exactly as it stands.
    if (breaksTheRope(draft, law) && !draft.flags.includes('own_rope')) {
      draft.flags.push('own_rope');
    }
  };
  if (choice.exceptionToLaw) {
    breakLaw(choice.exceptionToLaw as LawId, choice.beneficiary ?? 'someone');
  }

  // 2b. And the words that were always on the bench, read under a law that
  // came after them. A law of yours standing today can make one of the three
  // plain answers a breach (the same act as above, written down the same way)
  // or a grey answer, which the crown notices and the Codex does not.
  const breach = choice.exceptionToLaw ? null : breachFor(ev.id, choice.id, draft);
  if (breach?.how === 'breaks') breakLaw(breach.law, breach.beneficiary);
  if (breach?.how === 'bends') {
    bump(draft, 'crownSanity', -Math.round(exceptionCost * CONFIG.bendShare), UI.ledger.stretched);
  }

  // 3. souls the ruling itself buries or brings in, as a share of the place
  if (choice.souls) {
    draft.population = Math.max(1, Math.round(draft.population * (1 + choice.souls / 100)));
  }

  // 4. flags, Iva, city layers
  for (const f of choice.setFlags ?? []) {
    if (!draft.flags.includes(f)) draft.flags.push(f);
  }
  if (choice.setIva) draft.iva.push(choice.setIva);
  draft.cityFlags = addFlags(draft.cityFlags, choice.cityFlagsOn);
  draft.cityFlags = removeFlags(draft.cityFlags, choice.cityFlagsOff);

  // 5. a decree that bypasses the player
  if (choice.enactLaw) sealLaw(draft, choice.enactLaw);

  // 5b. and what the person standing there now thinks of the person who said
  // it. A ruling is a policy to the place and a morning to them.
  if (isPerson(ev.character)) nudgeBond(draft, ev.character, bondFromChoice(choice));

  // 6. a delayed consequence
  const schedule = (caseId: string, inTurns: number): void => {
    if (!getCase(caseId)) return;
    const seq = draft.pending.reduce((m, p) => Math.max(m, p.seq), 0) + 1;
    draft.pending.push({ onTurn: draft.turn + inTurns, caseId, seq });
  };
  if (choice.schedule) schedule(choice.schedule.caseId, choice.schedule.inTurns);

  // A trial: the ruling is written down, and the truth is left to catch up with
  // it. Convicting the wrong person feels exactly like convicting the right one
  // on the day, which is the whole of the mechanic.
  if (choice.verdict) {
    draft.verdicts.push({
      caseId: ev.id,
      year: draft.turn,
      ruled: choice.verdict,
      surfaced: false,
    });
    const truth = truthOf(draft.seed, ev.id);
    if (choice.verdict === 'guilty' && truth === 'innocent') {
      // the first wrong conviction of a reign always surfaces, later ones never
      if (wrongfulConvictions(draft) === 1) {
        schedule(`${ev.id}_wrong`, CONFIG.trial.wrongSurfacesIn);
      }
    }
    if (choice.verdict === 'innocent' && truth === 'guilty') {
      schedule(`${ev.id}_again`, CONFIG.trial.acquittedReturnIn);
    }
  }

  // a reveal scene closes the ruling it belongs to
  if (ev.id.endsWith('_wrong')) {
    const ruled = ev.id.slice(0, -'_wrong'.length);
    for (const record of draft.verdicts) {
      if (record.caseId === ruled) record.surfaced = true;
    }
  }

  // 7. mark it shown, log it
  if (!draft.shownCases.includes(ev.id)) draft.shownCases.push(ev.id);
  draft.log.push({
    turn: draft.turn,
    kind: 'case',
    refId: ev.id,
    choiceId: choice.id,
    tags: choice.tags,
  });

  // 8. aftermath
  const spoken = ruling ? [ruling] : [];
  const ending = draft.flags.includes('own_rope') && !s.flags.includes('own_rope');
  draft.lastAftermath = {
    paragraphs: [
      ...spoken,
      renderTemplate(choice.result, draft),
      // what the place made of a plain answer given under a law it crosses
      ...(breach ? [renderTemplate(breach.result, draft)] : []),
      // the one ending the player writes themselves, told from the bench it came from
      ...(ending ? (OWN_ROPE_SCENES[ev.id] ?? OWN_ROPE_SCENE) : []),
    ],
    deltas: diffStats(before, draft.stats),
  };
  draft.phase = 'aftermath';
  return draft;
}

/**
 * After a ruling: a year holds one or two people. When it has heard them all,
 * the rest of the year belongs to the place itself.
 */
export function continueYear(s: GameState): GameState {
  // the rest of the year happens; you are simply not at it
  if (s.flags.includes('own_rope')) {
    const done = clone(s);
    done.current = null;
    done.phase = 'portrait';
    return done;
  }
  if (s.lastWorkTurn === s.turn) return advance(s);
  const draft = clone(s);

  if (draft.eventsThisYear < CONFIG.year.dilemmasPerYear) {
    const next = pickEvent(draft, { lawAllowed: false });
    if (next) {
      draft.eventsThisYear += 1;
      draft.current = next;
      draft.phase = 'case';
      draft.lastAftermath = null;
      return draft;
    }
  }

  draft.current = null;
  draft.phase = 'works';
  return draft;
}

/**
 * A minute of your day, spent on something that is not a ruling.
 *
 * The one action in this game that does not move the year, does not open a
 * card and cannot go wrong. It applies one point, writes the line that says it
 * happened, and hands the state straight back: the phase, the turn, the
 * pending events and everything else are exactly as they were, which is the
 * whole point of it.
 *
 * Taking the same one twice in one year does nothing, and the ledger is what
 * says so, so a save reloaded mid year cannot be farmed for it either.
 */
export function takeMoment(s: GameState, id: string): GameState {
  const moment = getMoment(id);
  if (!moment || momentTaken(s, id)) return s;
  const draft = clone(s);
  applyEffects(draft, moment.effect, `${MOMENT_SOURCE}: ${id}`, false);
  return draft;
}

/**
 * The year is spent on one thing. Usually that thing stands for the rest of
 * the reign, and the store pays for one more floor of it. A year that can be
 * spent again (the fair) leaves nothing standing and is paid for every time,
 * so the price is charged for anything that has one, and only a thing with
 * floors gains a floor.
 */
export function chooseWork(s: GameState, id: WorkId, plot?: PlotId): GameState {
  const work = getWork(id);
  if (!work) return s;

  /* A building that has never stood anywhere needs somewhere to stand.

     The year of work always asks, and the answer arrives here. A caller that
     does not answer is not refused: it gets the ground the picture always gave
     that building, or whatever is left if somebody else took it. Refusing
     would make the engine's contract stricter than the screen's, and the
     ground still has to end up consistent either way, because two buildings on
     one footprint is a drawing nobody can read. */
  const ground = needsPlacement(s, id)
    ? plot !== undefined && canPlace(s, id, plot)
      ? plot
      : fallbackPlot(s, id)
    : null;

  const draft = clone(s);

  if (work.maxLevel > 0 && (draft.buildings[id] ?? 0) >= work.maxLevel) return s;
  const cost = workCost(draft, work);
  if (draft.stats.economy < cost) return s;
  if (cost > 0) bump(draft, 'economy', -cost, work.name);
  if (work.maxLevel > 0) draft.buildings[id] = (draft.buildings[id] ?? 0) + 1;
  if (ground !== null) draft.placements = { ...(draft.placements ?? {}), [id]: ground };

  applyEffects(draft, workOnce(draft, work), work.name);

  draft.lastWorkTurn = draft.turn;
  // a fair and a rest leave nothing standing, so nothing is being raised
  draft.lastWork = work.maxLevel > 0 ? id : null;
  draft.log.push({ turn: draft.turn, kind: 'work', refId: id, choiceId: id, tags: [] });
  return advance(draft);
}

/**
 * The year is spent on somebody else's kingdom instead of on your own.
 *
 * It is a year of work like any other: it costs the year, it leaves one or two
 * lines in the ledger, and then the year turns. Nothing is built, so nothing
 * goes up in the picture and nothing goes into the log of works.
 */
export function sendAbroad(s: GameState, action: WorldAction, target: string): GameState {
  const outcome = actAbroad(s, action, target);
  if (!outcome) return s;

  const draft = clone(s);
  draft.world = outcome.world;
  for (const move of outcome.moves) {
    if (move.delta === 0) noteLine(draft, move.stat, move.source);
    else bump(draft, move.stat, move.delta, move.source);
  }
  draft.lastWorkTurn = draft.turn;
  draft.lastWork = null;
  return advance(draft);
}

/** The year is spent reopening a law instead of building anything. */
export function reopenLaw(s: GameState, proposalId: string): GameState {
  const proposal = getProposal(proposalId);
  if (!proposal) return s;
  const draft = clone(s);
  draft.reopening = proposalId;
  draft.current = { kind: 'proposal', id: proposalId };
  draft.lastWorkTurn = draft.turn;
  draft.lastWork = null;
  draft.phase = 'composer';
  return draft;
}

/** Laws sealed in an earlier year, which the drafting table can take up again. */
/**
 * The laws that are open to be written this year. Early on there is one thing
 * a hamlet can even have an opinion about; later there are several, and the
 * drafting table is a choice of subject as well as of predicate.
 */
export function openProposals(s: GameState): string[] {
  return allProposals()
    .filter(
      (p) =>
        !s.usedProposals.includes(p.id) &&
        (p.unlockedBy === undefined || evaluate(p.unlockedBy, s)),
    )
    .map((p) => p.id);
}

export function reopenableProposals(s: GameState): string[] {
  const out: string[] = [];
  if (s.turn - s.lastLawTurn < CONFIG.year.lawEvery) return out;
  for (const law of s.laws) {
    if (law.status !== 'active') continue;
    if (law.turn >= s.turn) continue;
    const proposal = allProposals().find((p) =>
      p.options.some((o) => o.subject === law.subject),
    );
    if (proposal && !out.includes(proposal.id)) out.push(proposal.id);
  }
  return out;
}

export function advance(s: GameState): GameState {
  const draft = clone(s);

  // 1. a new year
  draft.turn += 1;
  draft.lastAftermath = null;
  draft.eventsThisYear = 0;

  // 2. the yearly trend: every standing law, then every building
  const storeBefore = draft.stats.economy;
  for (const law of draft.laws) {
    if (law.status !== 'active') continue;
    const option = findLawOption(law.subject, law.action, law.label);
    if (!option) continue;
    applyEffects(draft, lawTrend(draft, option), lawSource(draft, option), true);
  }
  for (const [id, level] of Object.entries(draft.buildings)) {
    if (level <= 0) continue;
    const work = getWork(id);
    if (!work) continue;
    for (const stat of STAT_IDS) {
      const per = work.trend[stat];
      if (per) bump(draft, stat, per * level, work.name, true);
    }
  }
  for (const tech of allTechs()) {
    if (!draft.techs.includes(tech.id)) continue;
    applyEffects(draft, tech.trend, tech.name, true);
  }
  // whatever is being fed at the back door: a thin year for the store while it
  // is still a wolf, and plainly worth it once it is not
  {
    const kept = animalKeep(draft);
    if (kept) applyEffects(draft, kept.every, kept.label, true);
    // and whatever is up on the common, which is a separate animal and a
    // separate arrangement: the one that pays quietly, every year, for good
    const herd = herdKeep(draft);
    if (herd) applyEffects(draft, herd.every, herd.label, true);
  }
  // and the person upstairs, whose habits are a fact about every year of a reign
  {
    const crown = monarchOf(draft.seed);
    if (crown.trait.yearly) applyEffects(draft, crown.trait.yearly, crown.name, true);
  }
  // and the person downstairs, if there is one, which is the only thing in the
  // whole game that steadies a crown year after year without being paid again
  if (loverOf(draft) !== null) {
    bump(draft, 'crownSanity', CONFIG.bond.loverSanity, BOND_UI.loverSanity, true);
  }

  // and the crowd itself, on the one board a crowd is always bad for. This is
  // the whole reason conditions are not a store: they do not fill up, they are
  // leaned on, and the thing leaning is how many of you share one well.
  bump(draft, 'health', crowdingOnHealth(draft), UI.ledger.crowding, true);

  // Nothing above happens in a long winter, as far as the store is concerned.
  // Every trend on it is a promise about a growing season and there is not one
  // this year, so whatever the year put in comes straight back out, and then
  // the mouths take their share on top. A hamlet has too few mouths for that
  // second part to come to anything; a town queues for it.
  if (isWinter(draft.turn)) {
    const grown = draft.stats.economy - storeBefore;
    if (grown > 0) bump(draft, 'economy', -grown, UI.ledger.winterStill, true);
    bump(draft, 'economy', -winterMouths(draft), UI.ledger.winterMouths, true);
  }

  // 3. a town is a bigger thing to be responsible for, and it gets bigger
  if (stageRule(draft) === 'town') {
    bump(draft, 'crownSanity', CONFIG.town.crownDrift, UI.ledger.crown, true);
    bump(draft, 'culture', CONFIG.town.cultureDrift, UI.ledger.culture, true);
    // health is leaned on above, at every size; a town leans on the mood too
    const crowding = Math.floor((draft.population - CONFIG.town.at) / CONFIG.town.crowdEvery);
    if (crowding > 0) bump(draft, 'mood', -crowding, UI.ledger.crowding, true);
  }

  // 4. the long winter takes its share and brings its own scenes
  if (isWinter(draft.turn)) {
    applyEffects(
      draft,
      scaleEffects(CONFIG.winter.drain, winterWeight(draft)),
      UI.ledger.winter,
    );
    const seq = draft.pending.reduce((m, p) => Math.max(m, p.seq), 0);
    if (draft.stage === 'village') {
      if (!draft.shownCases.includes('wv_hearth')) {
        draft.pending.push({ onTurn: draft.turn, caseId: 'wv_hearth', seq: seq + 1 });
      }
    } else {
      if (!draft.shownCases.includes('w_grain')) {
        draft.pending.push({ onTurn: draft.turn, caseId: 'w_grain', seq: seq + 1 });
      }
      if (!draft.shownCases.includes('w_cold')) {
        draft.pending.push({ onTurn: draft.turn, caseId: 'w_cold', seq: seq + 2 });
      }
    }
  }

  // 5. a rich place puts its surplus into working things out
  let points = researchGain(draft);
  if (draft.stats.economy >= CONFIG.works.freeAbove) {
    bump(draft, 'economy', -CONFIG.works.surplusSpend, UI.ledger.surplus);
    points += CONFIG.works.surplusSpend * CONFIG.research.surplusShare;
  }
  draft.research += points;
  // the cheapest thing anybody could start on is the one that gets finished
  const open = openTechs(draft).sort((a, b) => a.cost - b.cost);
  for (const tech of open) {
    if (draft.research < tech.cost) break;
    draft.research -= tech.cost;
    draft.techs.push(tech.id);
    break;
  }

  // 6. the count, and the charter that follows it
  draft.population = Math.max(1, draft.population + yearlyChange(draft));
  if (draft.stage === 'village' && draft.population >= CONFIG.town.at) {
    draft.stage = 'town';
    draft.townSince = draft.turn;
    if (!draft.flags.includes('became_town')) draft.flags.push('became_town');
    // the boards a hamlet could not have, with everything it had put aside
    const owed = draft.pendingTownBonus;
    draft.pendingTownBonus = {};
    applyEffects(draft, owed, UI.ledger.charter);
    const seq = draft.pending.reduce((m, p) => Math.max(m, p.seq), 0) + 1;
    draft.pending.push({ onTurn: draft.turn, caseId: 't_town', seq });
  }

  // 6a. the crown, which is the charter again at the next scale up.
  //
  // A town answers to the capital; a kingdom is answered to. Nothing new is
  // handed over on the day, because there is nothing a kingdom has that a town
  // did not: what arrives is an outside, and the map that goes with it.
  if (
    draft.stage === 'town' &&
    draft.flags.includes('kingdom_open') &&
    draft.population >= CONFIG.kingdom.at
  ) {
    draft.stage = 'kingdom';
    draft.kingdomSince = draft.turn;
    if (!draft.flags.includes('became_kingdom')) draft.flags.push('became_kingdom');
    draft.world = openWorld(draft);
    noteLine(draft, 'crownSanity', UI.ledger.crownArrives);
  }

  // 6a2. and then a year passes out there, whether or not anybody looked
  {
    const abroad = tickWorld(draft);
    if (abroad) {
      draft.world = abroad.world;
      for (const move of abroad.moves) bump(draft, move.stat, move.delta, move.source);
    }
  }

  // 6b. The square, which is the one board that can end a reign on its own.
  //
  // Not at the bottom of it: a place stops being yours long before there is
  // nobody left in it, and the line it stops at is lower the more of a watch
  // there is to hold it together. The first year past that line they come and
  // say so, to your face, and it is a dilemma like any other. The year after
  // that, if it still reads the same, they do not come. They simply stop
  // bringing you things, and the seal is on the table by the spring.
  if (squareHasHadEnough(draft)) {
    if (draft.shownCases.includes('x_square')) {
      if (!draft.flags.includes('square_walked')) draft.flags.push('square_walked');
      draft.current = null;
      draft.phase = 'portrait';
      return draft;
    }
    const seq = draft.pending.reduce((m, p) => Math.max(m, p.seq), 0) + 1;
    if (!draft.pending.some((p) => p.caseId === 'x_square')) {
      draft.pending.push({ onTurn: draft.turn, caseId: 'x_square', seq });
    }
  }

  // 6c. A board on the floor, a year after it got there.
  //
  // The collapse scene already fired the year it landed: the sickness, the
  // empty store, the crown that has stopped writing. That scene is answerable
  // and most of them are answered. This is the year after, for the ones that
  // were not, and it is the only place in the game where a number ends a
  // reign. The square is not in this list because the square has its own
  // ending, one line up, with its own deputation first.
  {
    const floored = draft.floored ?? {};
    draft.floored = floored;
    for (const stat of DEFEAT_STATS) {
      if (!isActiveStat(draft, stat)) {
        delete floored[stat];
        continue;
      }
      if (draft.stats[stat] > CONFIG.defeat.floor) {
        delete floored[stat];
        continue;
      }
      const since = floored[stat];
      if (since === undefined) {
        floored[stat] = draft.turn;
      } else if (draft.turn - since >= CONFIG.defeat.graceYears) {
        draft.defeat = stat;
        draft.current = null;
        draft.phase = 'portrait';
        return draft;
      }
    }
  }

  // 7. what is on the table this year. A decree comes round every other year.
  const lawAllowed = draft.turn - draft.lastLawTurn >= CONFIG.year.lawEvery;
  const ev = pickEvent(draft, { lawAllowed });
  const allLawsUsed = draft.usedProposals.length >= allProposals().length;
  // nothing left that can happen: every law written, or a hamlet that has
  // stopped growing and so will never see the charter or the laws behind it
  const stalled = stageRule(draft) === 'village' && yearlyChange(draft) <= 0;
  // a kingdom that has written every law it can still has neighbours, and they
  // are the reason it is not finished the year the drafting table empties
  const youngCrown =
    draft.stage === 'kingdom' &&
    draft.turn < (draft.kingdomSince ?? draft.turn) + CONFIG.kingdom.years;
  const spent = ev === null && draft.turn >= 12 && (allLawsUsed || stalled) && !youngCrown;
  const over = draft.turn >= CONFIG.hardCapTurn || spent;
  if (over) {
    draft.current = null;
    draft.phase = 'portrait';
    return draft;
  }

  // 8. an empty year is still a year, and it still gets its work
  if (ev === null) {
    draft.current = null;
    draft.phase = 'works';
    return draft;
  }

  draft.current = ev;
  draft.eventsThisYear = 1;
  draft.phase = ev.kind === 'proposal' ? 'composer' : 'case';
  return draft;
}

export { activeStats, trendOf };
