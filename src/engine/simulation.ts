import { CONFIG } from './config';
import { loverOf } from './bonds';
import { monarchOf } from './monarch';
import { allTechs, allWorks, findLawOption, getWork } from './registry';
import { BOND_UI } from '../content/bonds';
import { DOGS_KEPT, HERD_HIS, HERD_WALKED, WOLF_FED, type AnimalKeep } from '../content/animals';
import type {
  Effects,
  TechDef,
  TechId,
  GameState,
  LawOption,
  Phase,
  Season,
  StatId,
  SubjectId,
  WorkDef,
  WorkId,
} from './types';

/**
 * The year: how it turns, what it grows, what it takes, and which boards the
 * place is big enough to have. Pure arithmetic, no content, no dice.
 */

const ALL_STATS: StatId[] = ['crownSanity', 'mood', 'health', 'economy', 'army', 'culture'];
const VILLAGE_STATS: StatId[] = ['crownSanity', 'mood', 'health', 'economy'];

/** The two a place chooses, one at a time, as it grows into them. */
export const OPENABLE_BOARDS: StatId[] = ['army', 'culture'];

/** Everything `activeStats` needs to know, so tests and previews can fake it. */
export type Place = Pick<GameState, 'stage' | 'boards'>;

/**
 * Every rule in this file older than the crown asks one question: is this a
 * hamlet, or is it bigger than one? A kingdom is bigger, so it answers "town"
 * to all of them and keeps every town rule it grew up with: the charter's six
 * boards, the town prices, the town works, the crown's yearly drift.
 *
 * Only the rules that are actually about a kingdom read `s.stage` itself.
 * Without this, adding a third stage would have quietly turned a kingdom back
 * into a hamlet in nine places at once.
 */
export function stageRule(s: Place): 'village' | 'town' {
  return s.stage === 'village' ? 'village' : 'town';
}

/**
 * A settlement of nine has no watch and no fiddle. It does have a mood, a store
 * and a set of conditions people are living in, and those four are the whole
 * board until the place is big enough to decide it wants more. The other two
 * are not handed over by a charter any more: they are picked, one at a count,
 * and the charter only guarantees whatever is still missing.
 */
export function activeStats(s: Place): StatId[] {
  if (stageRule(s) === 'town') return ALL_STATS;
  const opened = s.boards ?? [];
  return ALL_STATS.filter((id) => VILLAGE_STATS.includes(id) || opened.includes(id));
}

export function isActiveStat(s: Place, stat: StatId): boolean {
  return activeStats(s).includes(stat);
}

/** What the place could open next, if it is big enough to be asked. */
export function openableBoard(s: GameState): StatId | 'both' | null {
  if (stageRule(s) === 'town') return null;
  const left = OPENABLE_BOARDS.filter((b) => !s.boards.includes(b));
  if (left.length === 0) return null;
  const at = left.length === OPENABLE_BOARDS.length ? CONFIG.boards.firstAt : CONFIG.boards.secondAt;
  if (s.population < at) return null;
  return left.length > 1 ? 'both' : left[0];
}

/**
 * What a crowd does to the conditions it lives in, every year, everywhere.
 * This is the whole reason conditions are not a store: they do not fill up,
 * they are pushed on, and the thing pushing hardest is simply how many of you
 * there are sharing one well.
 */
export function crowdingOnHealth(s: GameState): number {
  return -Math.floor(s.population / CONFIG.crowdHealthEvery);
}

/** The long winter comes every tenth year and holds for that year. */
export function isWinter(turn: number): boolean {
  return turn > 0 && turn % CONFIG.winter.every === 0;
}

/**
 * What the long winter costs the store past simply not filling it. Nobody is
 * carting anything and nobody is sowing anything, so the only arithmetic left
 * in a winter year is how many mouths are open. A hamlet has too few for this
 * to come to anything; a town has plenty.
 */
export function winterMouths(s: GameState): number {
  return Math.floor(s.population / CONFIG.winter.mouthsPer);
}

/**
 * How far against you the square is allowed to get before it stops being a
 * mood. A watch lowers the line, because a watch is what holds a place that
 * has stopped agreeing with you together, and no watch lowers it past the
 * floor. A place with no watch board open has the line it started with.
 */
export function walkOutLine(s: GameState): number {
  const W = CONFIG.walkOut;
  const watch = isActiveStat(s, 'army') ? Math.floor(s.stats.army / W.armyPer) : 0;
  return Math.max(W.floor, W.at - watch);
}

/** Whether the square has gone past the line this year. */
export function squareHasHadEnough(s: GameState): boolean {
  return isActiveStat(s, 'mood') && s.stats.mood <= walkOutLine(s);
}

/** Years until the frost, for the town crier. 0 means it is here. */
export function yearsToWinter(turn: number): number {
  if (isWinter(turn)) return 0;
  return CONFIG.winter.every - (turn % CONFIG.winter.every);
}

/**
 * Seasons are decoration with a job: they make a year feel like a year. The
 * decision is taken in spring, its consequence lands in summer, the year's work
 * is done in autumn, and the turning of the year is winter. In a long winter
 * year, every one of them is winter.
 */
export function seasonOf(phase: Phase, turn: number, scene?: Season): Season {
  if (isWinter(turn)) return 'winter';
  // a scene that knows when it happens outranks the phase it happens in
  if (scene) return scene;
  switch (phase) {
    /* Five of you walked out of the old place in the spring, which the opening
       says out loud. The picture is the whole screen now, so a snowfield behind
       that sentence is the game calling itself a liar. */
    case 'intro':
    case 'composer':
    case 'case':
      return 'spring';
    case 'aftermath':
      return 'summer';
    case 'works':
      return 'autumn';
    default:
      return 'winter';
  }
}

/**
 * Content writes what a thing is worth in plain units; these turn that into
 * what the place actually feels. Anything worth something at all stays worth at
 * least one point, so no scene ever quietly does nothing.
 */
export function scaleEffects(effects: Effects | undefined, factor: number): Effects | undefined {
  if (!effects) return effects;
  const out: Effects = {};
  for (const [key, raw] of Object.entries(effects)) {
    if (raw === undefined || raw === 0) continue;
    /**
     * Kept to a tenth of a point rather than a whole one.
     *
     * A whole point was a coarse unit to scale into: a case worth six at the
     * case scale rounded to two, so content writing five, six and seven all
     * landed on the same two, and a store of eighteen could only ever be
     * eighteen. Tenths keep the difference content wrote, and they make the
     * store readable as what it is, which is a percentage.
     */
    const scaled = Math.round(Math.abs(raw) * factor * 10) / 10;
    out[key as StatId] = Math.sign(raw) * Math.max(0.1, scaled);
  }
  return out;
}

/**
 * How much the place can actually keep. Everything above this is a good year
 * with nowhere to put it, which is the whole argument for the granary: it does
 * not earn, it holds. Two of them and the shelf is the width of the board.
 */
export function storeCap(s: GameState): number {
  const built = s.buildings.granary ?? 0;
  return Math.min(CONFIG.statMax, CONFIG.store.cap + built * CONFIG.store.perGranary);
}

/**
 * How heavily one sentence lands, by the number of people under it. A decree
 * read over five heads is advice; the same sentence over five hundred is
 * weather.
 */
export function lawWeight(s: GameState): number {
  const extra = Math.floor(s.population / CONFIG.law.weightPer);
  return 1 + Math.min(CONFIG.law.maxWeight - 1, extra);
}

/**
 * How hard the long winter lands. A hamlet of five puts everybody in one room
 * for a month; a town of four hundred queues for firewood in the dark.
 */
export function winterWeight(s: GameState): number {
  const extra = Math.floor(s.population / CONFIG.winter.weightPer);
  return 1 + Math.min(CONFIG.winter.maxWeight - 1, extra);
}

/** Whether anybody in this place carries a pike for a living. */
export function keepsWatch(s: GameState): boolean {
  if ((s.buildings.watch_house ?? 0) > 0) return true;
  return isActiveStat(s, 'army') && s.stats.army >= CONFIG.law.watchAt;
}

/**
 * The yearly trend of one standing law, as the place feels it. Which of the
 * three trends a law uses is a fact about the place, not about the law: a town
 * reads a village law differently, and a place that keeps a watch reads a law
 * about wrongdoing differently again.
 */
export function lawTrend(s: GameState, option: LawOption): Effects {
  const base =
    option.perTurnWatch && keepsWatch(s)
      ? option.perTurnWatch
      : stageRule(s) === 'town' && option.perTurnTown
        ? option.perTurnTown
        : option.perTurn;
  return scaleEffects(base, lawWeight(s) * CONFIG.law.trendScale) ?? {};
}

/**
 * What a law about strangers does to the count of people, as a percent a year,
 * in the place actually reading it. Two laws that both bring "more of them"
 * are not the same law, and the drafting table has no business saying they are.
 * A charter is a wall as well as a welcome, so a town feels only a share of it.
 */
export function growthPercentOf(s: GameState, option: LawOption): number | null {
  if (option.growth === undefined) return null;
  const P = CONFIG.population;
  const base =
    s.stage === 'village'
      ? option.growth
      : P.townBase + (option.growth - 1) * P.townShareOfLaw;
  return Math.round((base - 1) * 100);
}

/** How many souls the year adds or takes. Deterministic. */
export function yearlyChange(s: GameState): number {
  if (isWinter(s.turn)) {
    const { base, healthWeight, economyWeight } = CONFIG.winter.loss;
    const shelter = shelterOf(s);
    const percent = Math.max(
      0,
      base - s.stats.health * healthWeight - s.stats.economy * economyWeight - shelter,
    );
    return -Math.round((s.population * percent) / 100);
  }

  const P = CONFIG.population;

  // who comes: the law about strangers, or nobody in particular
  const law = s.laws.find((l) => l.status === 'active' && l.subject === 'strangers');
  const option = law ? findLawOption(law.subject, law.action, law.label) : undefined;
  const base =
    s.stage === 'village'
      ? (option?.growth ?? CONFIG.village.growthNoLaw)
      : P.townBase + (option ? (option.growth ?? 1) - 1 : 0) * P.townShareOfLaw;

  // who stays: health is the ledger of who is still here next spring
  const deaths = Math.max(0, P.deathFrom - s.stats.health) * P.deathPerPoint;

  // and a place people want to live in fills up faster than one they endure
  const cheer = isActiveStat(s, 'mood')
    ? (s.stats.mood - P.moodNeutral) * P.growthPerMood
    : 0;

  const rate = base - 1 + cheer - deaths;
  const births = s.stage === 'village' ? CONFIG.village.births : 0;
  return Math.round(s.population * rate + births);
}

/**
 * Why the count of people is doing what it is doing, itemised, in percent a
 * year. Growth is the one number on screen that nothing on the boards obviously
 * explains, and a player who cannot see why a place is emptying cannot do
 * anything about it. Labels come from content; the caller names the kinds.
 */
export function growthSourcesOf(
  s: GameState,
): { kind: 'winter' | 'law' | 'ground' | 'health' | 'mood' | 'births'; label: string; percent: number }[] {
  const out: { kind: 'winter' | 'law' | 'ground' | 'health' | 'mood' | 'births'; label: string; percent: number }[] = [];
  const pct = (n: number): number => Math.round(n * 1000) / 10;

  if (isWinter(s.turn)) {
    const { base, healthWeight, economyWeight } = CONFIG.winter.loss;
    const loss = Math.max(
      0,
      base - s.stats.health * healthWeight - s.stats.economy * economyWeight - shelterOf(s),
    );
    out.push({ kind: 'winter', label: '', percent: -Math.round(loss * 10) / 10 });
    return out;
  }

  const P = CONFIG.population;
  const law = s.laws.find((l) => l.status === 'active' && l.subject === 'strangers');
  const option = law ? findLawOption(law.subject, law.action, law.label) : undefined;

  if (s.stage === 'village') {
    out.push({ kind: 'ground', label: '', percent: pct(CONFIG.village.growthNoLaw - 1) });
    if (option) {
      out.push({
        kind: 'law',
        label: law!.label,
        percent: pct((option.growth ?? CONFIG.village.growthNoLaw) - CONFIG.village.growthNoLaw),
      });
    }
  } else {
    out.push({ kind: 'ground', label: '', percent: pct(P.townBase - 1) });
    if (option) {
      out.push({
        kind: 'law',
        label: law!.label,
        percent: pct(((option.growth ?? 1) - 1) * P.townShareOfLaw),
      });
    }
  }

  const deaths = Math.max(0, P.deathFrom - s.stats.health) * P.deathPerPoint;
  if (deaths > 0) out.push({ kind: 'health', label: '', percent: -pct(deaths) });

  if (isActiveStat(s, 'mood')) {
    const cheer = (s.stats.mood - P.moodNeutral) * P.growthPerMood;
    if (cheer !== 0) out.push({ kind: 'mood', label: '', percent: pct(cheer) });
  }

  if (s.stage === 'village' && CONFIG.village.births > 0) {
    out.push({ kind: 'births', label: '', percent: 0 });
  }

  return out;
}

/** Percent points of the winter loss the granary spares. */
export function shelterOf(s: GameState): number {
  let out = 0;
  for (const work of allWorks()) {
    if (!work.winterShelter) continue;
    out += work.winterShelter * (s.buildings[work.id] ?? 0);
  }
  return out;
}

/**
 * What the long winter would take if it landed on the place as it stands now.
 *
 * The same arithmetic the reducer does on the winter turn, run against today's
 * numbers, so a warning two years out is a bill rather than a mood. Every line
 * of it moves if the place moves, which is the entire reason for reading it
 * out while there are still two years to do something about it.
 */
export function winterBill(s: GameState): {
  drain: Effects;
  mouths: number;
  soulsPercent: number;
  shelter: number;
  weight: number;
} {
  const { base, healthWeight, economyWeight } = CONFIG.winter.loss;
  const shelter = shelterOf(s);
  const loss = Math.max(
    0,
    base - s.stats.health * healthWeight - s.stats.economy * economyWeight - shelter,
  );
  return {
    drain: scaleEffects(CONFIG.winter.drain, winterWeight(s)) ?? {},
    mouths: winterMouths(s),
    soulsPercent: -Math.round(loss * 10) / 10,
    shelter,
    weight: winterWeight(s),
  };
}

/**
 * What is being fed, and what it gives back. Only one of these is ever true at
 * once: the wolf stops being a wolf the year the litter is kept.
 */
export function animalKeep(s: GameState): AnimalKeep | null {
  if (s.flags.includes('dogs_kept')) return DOGS_KEPT;
  if (s.flags.includes('wolf_kept')) return WOLF_FED;
  return null;
}

/**
 * The herd on the common, and which way it went.
 *
 * Read off the log rather than off a flag, the way the town reads what
 * everybody is doing: the scene is the record, and a ruling that has been made
 * cannot be unmade, so there is nothing to keep in the save. It stacks with
 * whatever is at the woodpile, because goats and a dog are not the same
 * animal and the place feeds both.
 */
export function herdKeep(s: GameState): AnimalKeep | null {
  for (let i = s.log.length - 1; i >= 0; i--) {
    const entry = s.log[i];
    if (entry.kind !== 'case' || entry.refId !== 'w_goats') continue;
    if (entry.choiceId === 'split_them') return null;
    return entry.choiceId === 'his_herd' || entry.choiceId === 'by_the_law_owned'
      ? HERD_HIS
      : HERD_WALKED;
  }
  return null;
}

/** What the boards do every year on their own, before anything happens. */
export function trendOf(s: GameState, stat: StatId): number {
  if (!isActiveStat(s, stat)) return 0;
  let out = 0;

  for (const law of s.laws) {
    if (law.status !== 'active') continue;
    const option = findLawOption(law.subject, law.action, law.label);
    if (!option) continue;
    out += lawTrend(s, option)[stat] ?? 0;
  }

  for (const work of allWorks()) {
    const level = s.buildings[work.id] ?? 0;
    if (level === 0) continue;
    out += (work.trend[stat] ?? 0) * level;
  }

  for (const tech of allTechs()) {
    if (!s.techs.includes(tech.id)) continue;
    out += tech.trend[stat] ?? 0;
  }

  // the crowd, on the one board a crowd is always bad for
  if (stat === 'health') out += crowdingOnHealth(s);

  // whatever is being fed at the back door, which is a yearly fact like any other
  out += animalKeep(s)?.every[stat] ?? 0;

  // and the person upstairs, who is a fact about every year of the reign
  out += monarchOf(s.seed).trait.yearly?.[stat] ?? 0;

  // and the person downstairs, who is the only steady thing pulling the other
  // way on the one board that otherwise only ever falls
  if (stat === 'crownSanity' && loverOf(s) !== null) out += CONFIG.bond.loverSanity;

  if (stageRule(s) === 'town' && stat === 'crownSanity') out += CONFIG.town.crownDrift;

  // and the one year the store is not a trend at all. Everything above is a
  // promise about a growing season, and there is not one this year: the best a
  // winter can do for a store is leave it alone, and it does not do that
  // either, because everybody still eats.
  if (stat === 'economy' && isWinter(s.turn)) return Math.min(0, out) - winterMouths(s);

  return out;
}

/** Who is pulling on a board. The screen names the ones with no label. */
export type TrendKind =
  | 'law' | 'work' | 'tech' | 'monarch' | 'animals' | 'crowd' | 'drift' | 'winter' | 'lover';

/**
 * The same sum as `trendOf`, itemised. Every standing law is listed even when
 * it does nothing to this board: a law that leaves a board alone is an answer
 * too, and the player asked the question by hovering. Labels come from content
 * (the decree as it was sealed, the name of the work, the name of the thing
 * worked out); the drift has no label and the screen names it.
 */
export function trendSourcesOf(
  s: GameState,
  stat: StatId,
): { kind: TrendKind; label: string; delta: number }[] {
  const out: { kind: TrendKind; label: string; delta: number }[] = [];
  if (!isActiveStat(s, stat)) return out;

  for (const law of s.laws) {
    if (law.status !== 'active') continue;
    const option = findLawOption(law.subject, law.action, law.label);
    if (!option) continue;
    out.push({ kind: 'law', label: law.label, delta: lawTrend(s, option)[stat] ?? 0 });
  }

  for (const work of allWorks()) {
    const level = s.buildings[work.id] ?? 0;
    if (level === 0) continue;
    const delta = (work.trend[stat] ?? 0) * level;
    if (delta !== 0) out.push({ kind: 'work', label: work.name, delta });
  }

  for (const tech of allTechs()) {
    if (!s.techs.includes(tech.id)) continue;
    const delta = tech.trend[stat] ?? 0;
    if (delta !== 0) out.push({ kind: 'tech', label: tech.name, delta });
  }

  if (stat === 'health') {
    const crowd = crowdingOnHealth(s);
    if (crowd !== 0) out.push({ kind: 'crowd', label: '', delta: crowd });
  }

  const kept = animalKeep(s);
  const keepDelta = kept?.every[stat] ?? 0;
  if (kept && keepDelta !== 0) out.push({ kind: 'animals', label: kept.label, delta: keepDelta });

  const crown = monarchOf(s.seed);
  const royal = crown.trait.yearly?.[stat] ?? 0;
  if (royal !== 0) out.push({ kind: 'monarch', label: crown.name, delta: royal });

  if (stat === 'crownSanity' && loverOf(s) !== null) {
    out.push({ kind: 'lover', label: BOND_UI.loverSanity, delta: CONFIG.bond.loverSanity });
  }

  if (stageRule(s) === 'town' && stat === 'crownSanity') {
    out.push({ kind: 'drift', label: '', delta: CONFIG.town.crownDrift });
  }

  // In a winter year the list above is a list of things that are not happening.
  // Say so, once, instead of leaving five hopeful lines under an arrow that
  // points the other way.
  if (stat === 'economy' && isWinter(s.turn)) {
    const promised = out.reduce((sum, src) => sum + src.delta, 0);
    const held = Math.min(0, promised) - promised;
    const winter: typeof out = [];
    if (held !== 0) winter.push({ kind: 'winter', label: '', delta: held });
    const mouths = winterMouths(s);
    if (mouths > 0) winter.push({ kind: 'crowd', label: '', delta: -mouths });
    return [...out, ...winter];
  }

  return out;
}

/**
 * How far the workshops have come out of the dark, 0..1. Nothing at all while
 * the place is tiny, then a rumour that thickens, and at `openAt` souls the
 * tree is a screen you can open. A ramp, not a switch.
 */
export function techOpening(s: GameState): number {
  const { hintFrom, openAt } = CONFIG.research;
  if (s.population >= openAt) return 1;
  if (s.population <= hintFrom) return 0;
  return (s.population - hintFrom) / (openAt - hintFrom);
}

/** Points the year puts in the pot, before the surplus is counted. */
export function researchGain(s: GameState): number {
  const R = CONFIG.research;
  return (
    Math.floor(s.stats.economy / R.perEconomy) + Math.floor(s.stats.culture / R.perCulture)
  );
}

/**
 * Whether the place is anywhere near thinking of this at all. The field branch
 * only wants the branch before it; the crowd branch wants a crowd.
 */
export function techReachable(s: GameState, tech: TechDef, have: TechId[] = s.techs): boolean {
  for (const need of tech.requires ?? []) {
    if (!have.includes(need)) return false;
  }
  if (tech.needsSouls !== undefined && s.population < tech.needsSouls) return false;
  return true;
}

/** Everything the place could work out next, in content order. */
export function openTechs(s: GameState): TechDef[] {
  return allTechs().filter((t) => !s.techs.includes(t.id) && techReachable(s, t));
}

/** The next thing the place is working out, and how far along it is. */
export function nextTech(s: GameState): { tech: TechDef; have: number; need: number } | null {
  const open = openTechs(s);
  if (open.length === 0) return null;
  // the cheapest thing anybody could start on, because that is the one that lands first
  let best = open[0];
  for (const t of open) if (t.cost < best.cost) best = t;
  return { tech: best, have: s.research, need: best.cost };
}

/** The yearly trend of every active board, for the ledger popover. */
export function trendsOf(s: GameState): Effects {
  const out: Effects = {};
  for (const stat of activeStats(s)) {
    const value = trendOf(s, stat);
    if (value !== 0) out[stat] = value;
  }
  return out;
}

/**
 * What this year's work costs. A second floor is dearer than the first and a
 * third is dearer again, because the easy half of any building is the first
 * one. A full vault pays half of it and no more: the surplus is a subsidy, not
 * a blank cheque.
 */
/** What this work asks for, in the place it is being asked in. */
export function workPrice(s: GameState, work: WorkDef): number {
  return stageRule(s) === 'town' && work.townCost !== undefined ? work.townCost : work.cost;
}

/** What it pays out on the day, in the place it is being held in. */
export function workOnce(s: GameState, work: WorkDef): Effects | undefined {
  return stageRule(s) === 'town' && work.townOnce !== undefined ? work.townOnce : work.once;
}

export function workCost(s: GameState, work: WorkDef): number {
  const asked = workPrice(s, work);
  if (asked === 0) return 0;
  // a year that can be spent again has no floors to be dearer than, so it
  // costs what it says, in a hamlet and in a town, full and every time
  if (work.maxLevel === 0) return asked;
  const base = s.stage === 'village' ? CONFIG.works.costVillage : CONFIG.works.costTown;
  const level = s.buildings[work.id] ?? 0;
  const full = base + CONFIG.works.perLevel * level;
  return s.stats.economy >= CONFIG.works.freeAbove ? Math.ceil(full / 2) : full;
}

/** Whether the store is paying part of this year's work for you. */
export function workSubsidised(s: GameState): boolean {
  return s.stats.economy >= CONFIG.works.freeAbove;
}

/**
 * The first year is a choice of two, and it is the only year that is.
 *
 * Five people who walked out of somewhere last month are not choosing between
 * a granary, a bridge and a fair. They are deciding whether the first thing
 * they put up is somewhere to sleep or somewhere to work, and the store holds
 * exactly one of them. Everything else arrives in the second spring along with
 * the seal, and whichever of these two was not picked is on that list.
 */
export const FIRST_YEAR_WORKS: WorkId[] = ['house', 'woodcutter', 'rest'];

/** The works this place can build at all, in content order. */
export function worksFor(s: GameState): WorkDef[] {
  const lawStands = (subject: SubjectId): boolean =>
    s.laws.some((l) => l.status === 'active' && l.subject === subject);
  if (s.turn <= 1) return allWorks().filter((w) => FIRST_YEAR_WORKS.includes(w.id));
  return allWorks().filter((w) => {
    // a year that is a permission rather than a building is not on the list
    // until the permission is written down and still standing
    if (w.needsLaw !== undefined && !lawStands(w.needsLaw)) return false;
    // a chain is built in order: the second thing is not on the list until the
    // first one stands
    if (w.needsWork !== undefined && (s.buildings[w.needsWork.id] ?? 0) < w.needsWork.level)
      return false;
    return (
      w.stage === 'both' ||
      w.stage === stageRule(s) ||
      // a place that has decided it keeps a watch can raise the watch house,
      // charter or no charter: the board is the permission, not the paperwork
      (w.needsBoard !== undefined && s.boards.includes(w.needsBoard))
    );
  });
}

export function canBuild(s: GameState, id: WorkId): boolean {
  const work = getWork(id);
  if (!work) return false;
  // rest is always available; the fair is available whenever the store can pay
  if (work.maxLevel === 0) return s.stats.economy >= workPrice(s, work);
  if ((s.buildings[id] ?? 0) >= work.maxLevel) return false;
  return s.stats.economy >= workCost(s, work);
}
