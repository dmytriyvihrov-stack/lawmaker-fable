import { CONFIG } from './config';
import { computePortrait } from './portrait';
import { rand01 } from './rng';
import { allCases, allProposals } from './registry';
import { NEIGHBOUR_NAMES, PEOPLE_IDS } from '../content/world';
import { UI } from '../content/ui-strings';
import type {
  EnactedLaw,
  ForeignState,
  GameState,
  LawOption,
  People,
  PhilTag,
  StatId,
  World,
  WorldAsk,
} from './types';

/**
 * The world outside the walls: who lives in your kingdom, and who lives over
 * the hill.
 *
 * Everything here is arithmetic on a seed. Nothing in this file touches a
 * network, and nothing in it moves a board: a tick and an action both return
 * the new world plus a list of moves, and the reducer is the only thing that
 * ever puts a number on a dial, because the ledger has to be able to say why.
 * That also keeps this file out of the reducer's import cycle.
 */

/** One move on one of the player's boards, with the line the ledger will keep. */
export interface WorldMove {
  stat: StatId;
  delta: number;
  source: string;
}

/** What a tick or an action leaves behind: a new world, and what it did to you. */
export interface WorldOutcome {
  world: World;
  moves: WorldMove[];
}

export type WorldAction = 'ask' | 'send' | 'raid';

const STANCE_MIN = -3;
const STANCE_MAX = 3;
/** No people of a kingdom is smaller than this share of it. */
const PEOPLE_FLOOR = 0.1;

function clampStat(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function clampStance(v: number): number {
  return Math.max(STANCE_MIN, Math.min(STANCE_MAX, v));
}

/** A whole number in [lo, hi], drawn off the seed and the salts. */
function pick(seed: number, lo: number, hi: number, ...salts: (string | number)[]): number {
  return lo + Math.floor(rand01(seed, ...salts) * (hi - lo + 1));
}

/** Fills the one marker the ledger lines about neighbours carry. */
function named(line: string, name: string): string {
  return line.replace('{{name}}', name);
}

/* --------------------------------------------------------------- the laws */

/** Every law anybody could be living under, with whether a hamlet could have it. */
function optionPool(): { option: LawOption; townOnly: boolean }[] {
  const out: { option: LawOption; townOnly: boolean }[] = [];
  for (const p of allProposals()) {
    const townOnly = p.unlockedBy?.kind === 'stage' && p.unlockedBy.stage === 'town';
    for (const option of p.options) out.push({ option, townOnly });
  }
  for (const c of allCases()) {
    for (const ch of c.choices) if (ch.enactLaw) out.push({ option: ch.enactLaw, townOnly: false });
  }
  return out;
}

/** The laws a place of that size could actually be living under. */
function poolFor(stage: ForeignState['stage']): LawOption[] {
  const hamlet = stage === 'village';
  return optionPool()
    .filter((o) => !(hamlet && o.townOnly))
    .map((o) => o.option);
}

/**
 * What a law does to a store, every year, in the place reading it.
 *
 * A neighbour is read at its own scale and nothing else: no weight from your
 * population, no watch of yours. The number is the one content wrote.
 */
function lawDrift(option: LawOption, stage: ForeignState['stage']): number {
  const per = stage === 'village' ? option.perTurn : (option.perTurnTown ?? option.perTurn);
  return per?.economy ?? 0;
}

/** The word a reign of these laws would be given, by the laws it kept. */
function leanOf(options: LawOption[], seed: number): PhilTag {
  const counts = new Map<PhilTag, number>();
  for (const o of options) for (const t of o.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  let best: PhilTag = 'communitarian';
  let bestCount = -1;
  for (const [tag, count] of [...counts].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (count > bestCount || (count === bestCount && rand01(seed, 'lean', tag) > 0.5)) {
      best = tag;
      bestCount = count;
    }
  }
  return best;
}

/* ------------------------------------------------------------ the peoples */

/**
 * Who lives here, as four shares of the count.
 *
 * The share who came through the gate is your own law on strangers, read back
 * to you: a place that welcomed them is nearly half made of them, a place that
 * turned them away is a tenth. The other three divide what is left, none of
 * them under a tenth of the whole.
 */
function openPeoples(s: GameState): People[] {
  const strangers = s.laws.find((l) => l.status === 'active' && l.subject === 'strangers');
  const comers =
    strangers?.action === 'welcomed' ? 0.4 : strangers?.action === 'turned_away' ? 0.1 : 0.25;

  const rest = PEOPLE_IDS.filter((id) => id !== 'comers');
  const free = 1 - comers - PEOPLE_FLOOR * rest.length;
  const weights = rest.map((id) => 1 + rand01(s.seed, 'people', id) * 2);
  const total = weights.reduce((a, b) => a + b, 0);

  const shares = new Map<People['id'], number>([['comers', comers]]);
  rest.forEach((id, i) => {
    shares.set(id, PEOPLE_FLOOR + (free * weights[i]) / total);
  });

  // rounded to whole points of a percent, with the drift given to the largest,
  // so the four of them always add up to the whole kingdom and not to 0.99
  const rounded = PEOPLE_IDS.map((id) => ({ id, share: Math.round(shares.get(id)! * 100) / 100 }));
  const drift = 1 - rounded.reduce((a, p) => a + p.share, 0);
  const biggest = rounded.reduce((a, b) => (b.share > a.share ? b : a));
  biggest.share = Math.round((biggest.share + drift) * 100) / 100;

  return rounded.map((p) => ({ id: p.id, share: p.share, mood: Math.round(s.stats.mood) }));
}

/* ---------------------------------------------------------- the neighbours */

function drawState(s: GameState, i: number, name: string): ForeignState {
  const salt = ['state', i];
  const seed = s.seed + i * 7919;
  const stage: ForeignState['stage'] = i < 2 ? 'town' : 'kingdom';
  const population =
    stage === 'town' ? pick(seed, 100, 280, ...salt, 'pop') : pick(seed, 300, 900, ...salt, 'pop');

  // two to four laws, never two on one subject: a place contradicting itself
  // in writing is a joke this game has not earned yet
  const want = pick(seed, 2, 4, ...salt, 'lawcount');
  const taken: LawOption[] = [];
  const subjects = new Set<string>();
  const order = poolFor(stage)
    .map((option, at) => ({ option, key: rand01(seed, ...salt, 'law', at) }))
    .sort((a, b) => a.key - b.key);
  for (const { option } of order) {
    if (taken.length >= want) break;
    if (subjects.has(option.subject)) continue;
    subjects.add(option.subject);
    taken.push(option);
  }

  const laws: EnactedLaw[] = taken.map((option, at) => ({
    subject: option.subject,
    action: option.action,
    label: option.label,
    turn: pick(seed, 1, Math.max(1, s.turn), ...salt, 'lawturn', at),
    status: 'active',
  }));

  const stats = {} as Record<StatId, number>;
  for (const stat of ['crownSanity', 'mood', 'health', 'economy', 'army', 'culture'] as StatId[]) {
    stats[stat] = pick(seed, 30, 80, ...salt, 'stat', stat);
  }
  // a place is worth what its laws have been doing to it for years
  const drift = taken.reduce((sum, o) => sum + lawDrift(o, stage), 0);
  stats.economy = clampStat(stats.economy + drift * 5);

  // somebody always has a grievance, and somebody always owes you nothing and
  // is pleasant about it anyway
  const stance = i === 0 ? -1 : i === 1 ? 1 : 0;

  const angle = ((i * 72 + pick(seed, -15, 15, ...salt, 'angle')) * Math.PI) / 180;
  const radius = 0.8 + rand01(seed, ...salt, 'radius') * 0.35;

  return {
    id: `k${i + 1}`,
    name,
    kind: 'bot',
    seed,
    tag: leanOf(taken, seed),
    stage,
    population,
    stats,
    laws,
    stance,
    position: { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius },
    ask: null,
  };
}

/** The year the crown arrives, the map gets edges. Pure, and the same per seed. */
export function openWorld(s: GameState): World {
  const names = [...NEIGHBOUR_NAMES]
    .map((name, i) => ({ name, key: rand01(s.seed, 'name', i) }))
    .sort((a, b) => a.key - b.key)
    .map((n) => n.name);

  const states: ForeignState[] = [];
  for (let i = 0; i < CONFIG.kingdom.states; i++) states.push(drawState(s, i, names[i]));
  return { peoples: openPeoples(s), states };
}

/**
 * Any reign, read as somebody else's kingdom.
 *
 * This is the whole contract a later online layer would need: a real save goes
 * in, a neighbour comes out, and nothing downstream can tell which of the two
 * it is looking at. Nothing in the game calls it yet.
 */
export function fromReign(s: GameState, id: string, kind: ForeignState['kind']): ForeignState {
  return {
    id,
    name: s.townName ?? UI.world.you,
    kind,
    seed: s.seed,
    tag: computePortrait(s).revealedTag,
    stage: s.stage,
    population: Math.round(s.population),
    stats: { ...s.stats },
    laws: s.laws.filter((l) => l.status === 'active'),
    stance: 0,
    position: { x: 0, y: 0 },
    ask: null,
  };
}

/* ------------------------------------------------------------------ a year */

/** The option behind one of a neighbour's laws, for its yearly drift. */
function optionFor(law: EnactedLaw): LawOption | undefined {
  return optionPool().find(
    (o) => o.option.subject === law.subject && o.option.action === law.action,
  )?.option;
}

/**
 * A year abroad, which happens whether or not you looked.
 *
 * Their stores move on their own laws, a grievance cools with time, a place
 * that is running out asks, an ask nobody answered is remembered as a no, and
 * a neighbour who has had enough and has the men for it comes and takes.
 */
export function tickWorld(s: GameState): WorldOutcome | null {
  if (!s.world) return null;
  const K = CONFIG.kingdom;
  const moves: WorldMove[] = [];

  const states = s.world.states.map((state) => {
    const next: ForeignState = { ...state, stats: { ...state.stats } };

    const drift = next.laws.reduce((sum, law) => {
      const option = optionFor(law);
      return sum + (option ? lawDrift(option, next.stage) : 0);
    }, 0);
    next.stats.economy = clampStat(next.stats.economy + drift);

    // a grievance is not forever, and neither is a favour
    if (s.turn % K.stanceDecay === 0 && next.stance !== 0) {
      next.stance += next.stance > 0 ? -1 : 1;
    }

    if (next.ask === null) {
      const board: WorldAsk['board'] | null =
        next.stats.economy < K.askBelow
          ? 'economy'
          : next.stats.health < K.askBelow
            ? 'health'
            : null;
      if (board !== null) next.ask = { board, since: s.turn };
    } else if (s.turn - next.ask.since >= K.askExpires) {
      // nobody said no out loud, and it was still a no
      next.ask = null;
      next.stance = clampStance(next.stance - 1);
    }

    return next;
  });

  // one raid a year at most, and it is the one with the oldest grudge
  const raiders = states
    .filter((k) => k.stance <= -2 && k.stats.army > s.stats.army)
    .sort((a, b) => a.stance - b.stance);
  if (raiders.length > 0) {
    const raider = raiders[0];
    moves.push(
      { stat: 'economy', delta: -K.raided.economy, source: named(UI.ledger.raided, raider.name) },
      { stat: 'mood', delta: -K.raided.mood, source: named(UI.ledger.raided, raider.name) },
    );
    // they came, they took, and for now they have no further business with you
    raider.stance = -1;
  }

  return { world: { peoples: s.world.peoples, states }, moves };
}

/* --------------------------------------------------------------- an action */

/** Whether the year is still free to be spent on somebody else's kingdom. */
export function canActAbroad(s: GameState): boolean {
  return s.stage === 'kingdom' && s.phase === 'works' && s.lastWorkTurn < s.turn;
}

/** Why a particular action is not on offer, or null when it is. */
export function blockedReason(s: GameState, action: WorldAction): string | null {
  if (!canActAbroad(s)) return UI.world.notNow;
  if (action === 'send' && s.stats.economy < CONFIG.kingdom.send.cost) {
    return UI.world.cannot.store;
  }
  if (action === 'raid' && s.stats.army < CONFIG.kingdom.raid.needsArmy) {
    return UI.world.cannot.watch;
  }
  return null;
}

/**
 * A year of work spent abroad.
 *
 * The three of them are one shape: it costs the year, it lands as one line on
 * one board, and the answer is theirs rather than yours. Asking is free and
 * may bring nothing back, which is the point of it; ordering the watch out
 * costs the crown whether it works or not, which is the same rule that makes
 * bending your own law expensive.
 */
export function actAbroad(
  s: GameState,
  action: WorldAction,
  target: string,
): WorldOutcome | null {
  if (!s.world || blockedReason(s, action) !== null) return null;
  const at = s.world.states.findIndex((k) => k.id === target);
  if (at < 0) return null;

  const K = CONFIG.kingdom;
  const them: ForeignState = {
    ...s.world.states[at],
    stats: { ...s.world.states[at].stats },
  };
  const moves: WorldMove[] = [];
  const salt = [s.turn, them.id, action];

  if (action === 'ask') {
    const strangers = them.laws.find((l) => l.subject === 'strangers');
    const lean =
      strangers?.action === 'welcomed' ? 1 : strangers?.action === 'turned_away' ? -1 : 0;
    const roll = rand01(s.seed, ...salt) > 0.5 ? 1 : 0;
    const yes = them.stance + (them.stats.economy > 50 ? 1 : 0) + lean + roll >= 1;
    if (yes) {
      them.stats.economy = clampStat(them.stats.economy - K.ask.gain);
      them.stance = clampStance(them.stance + K.ask.debt);
      them.ask = null;
      moves.push({
        stat: 'economy',
        delta: K.ask.gain,
        source: named(UI.ledger.askYes, them.name),
      });
    } else {
      // nothing moves, and the year is still gone
      moves.push({ stat: 'economy', delta: 0, source: named(UI.ledger.askNo, them.name) });
    }
  }

  if (action === 'send') {
    const answered = them.ask !== null;
    them.stats.economy = clampStat(them.stats.economy + K.send.cost);
    them.stance = clampStance(them.stance + K.send.stance);
    them.ask = null;
    const line = named(answered ? UI.ledger.sentAsked : UI.ledger.sent, them.name);
    moves.push(
      { stat: 'economy', delta: -K.send.cost, source: line },
      { stat: 'crownSanity', delta: K.send.crown, source: line },
    );
  }

  if (action === 'raid') {
    const won = s.stats.army + rand01(s.seed, ...salt) * K.raid.roll > them.stats.army + K.raid.edge;
    const line = named(won ? UI.ledger.raidWon : UI.ledger.raidLost, them.name);
    if (won) {
      them.stats.economy = clampStat(them.stats.economy - K.raid.win);
      moves.push(
        { stat: 'economy', delta: K.raid.win, source: line },
        { stat: 'army', delta: -K.raid.armyWin, source: line },
      );
    } else {
      moves.push(
        { stat: 'army', delta: -K.raid.armyLose, source: line },
        { stat: 'mood', delta: -K.raid.moodLose, source: line },
      );
    }
    them.stance = clampStance(them.stance - K.raid.stance);
    moves.push({
      stat: 'crownSanity',
      delta: -K.raid.crown,
      source: named(UI.ledger.raidOrdered, them.name),
    });
  }

  // word travels: everybody hears that the watch went out, not only the place
  // it went out to
  const states = s.world.states.map((k, i) => {
    if (i === at) return them;
    if (action !== 'raid') return k;
    return { ...k, stance: clampStance(k.stance - K.raid.others) };
  });

  return { world: { peoples: s.world.peoples, states }, moves };
}
