/**
 * The reign simulator: play whole reigns through the real engine with no
 * browser and no tokens, and print what happened year by year.
 *
 *   npm run reign                              every player, twelve seeds, one table
 *   npm run reign -- --player best --seed 100  one reign, year by year
 *   npm run reign -- --player human --seeds 1-30 --moments half
 *   npm run reign -- --player best,random --seeds 20 --no-timeline
 *
 * The same thing has a page: the Reign tab of `node tools/console.mjs`, which
 * runs this file and draws what it returns. The page is the one to reach for
 * after a balance edit; this command line is the one to reach for in a script.
 *
 * Players (--player, comma separated, default all):
 *   best         one step lookahead through the engine: every answer is tried
 *                on a copy of the state and the one that leaves the boards most
 *                level is taken. A careful player who knows the numbers.
 *   comfortable  the same lookahead, judged the other way: the kindest answer
 *                every time. It reads how the place lives (mood, health, who is
 *                still here) and what the answer does to the person standing
 *                there, and it never counts the cost to the crown, because
 *                paying that cost yourself is what the kind answer is.
 *   human        `best`, but a share of the time (--mistake, default 0.3) some
 *                other answer is taken instead. Errors and human decisions.
 *   random       every answer drawn from a hat.
 *   first        always the first answer offered  (the golden runs in tests/)
 *   middle       always the middle one
 *   last         always the last one
 *
 * The small things on the map (--moments): all, half, none. A profile has its
 * own default (comfortable and best take all, human and random half, the golden
 * three none) and the flag overrides it for every profile in the run. They are
 * taken in autumn, at the year of work, which is where a player actually sits
 * and looks at the place.
 *
 * Time: an estimate of minutes at the table, from the season wheel in
 * `CONFIG.idle` at --speed (1, 2 or 4) plus a reading budget per card that
 * --read scales (1 is the default budget, 0.5 a fast reader).
 *
 * This file is a development tool. It imports the engine and touches nothing.
 */
import { CONFIG } from '../src/engine/config';
import { momentsNow } from '../src/engine/moments';
import {
  advance,
  chooseCase,
  chooseLaw,
  buildEarly,
  chooseWork,
  continueYear,
  newGame,
  takeMoment,
} from '../src/engine/reducer';
import { allCases, getCase, getProposal } from '../src/engine/registry';
import { activeStats, canBuild, seasonOf, trendsOf, worksFor } from '../src/engine/simulation';
import type { CaseChoice, GameState, StatId, WorkId } from '../src/engine/types';
import { availableRulings } from '../src/engine/verdict';

/* ------------------------------------------------------------------ args */

export type Player = 'best' | 'comfortable' | 'human' | 'random' | 'first' | 'middle' | 'last';
export type Moments = 'all' | 'half' | 'none';
export const PLAYERS: Player[] = [
  'best', 'comfortable', 'human', 'random', 'first', 'middle', 'last',
];
const DEFAULT_MOMENTS: Record<Player, Moments> = {
  best: 'all', comfortable: 'all', human: 'half', random: 'half',
  first: 'none', middle: 'none', last: 'none',
};
/** Which way a player judges an answer, when it judges at all. */
const JUDGES: Partial<Record<Player, 'balance' | 'kind'>> = {
  best: 'balance', human: 'balance', comfortable: 'kind',
};

export interface Args {
  players: Player[];
  seeds: number[];
  moments: Moments | null;
  mistake: number;
  speed: number;
  read: number;
  timeline: boolean;
  compare: boolean;
  json: boolean;
  /** Let a reign grow past a town, the way the dev door does. */
  kingdom: boolean;
}

const HELP = `reign: play whole reigns through the engine and print what happened.

  --player ${PLAYERS.join(',')}
                               (default: all)
  --seed 100 | --seeds 20 | --seeds 5-40          (default: 1-12)
  --moments all|half|none      override every profile's default
  --mistake 0.3                how often "human" takes a wrong answer
  --speed 1|2|4                the wheel speed the time estimate assumes
  --read 1                     reading budget multiplier for the estimate
  --timeline | --no-timeline   year by year lines (default: on for one reign)
  --compare                    the summary table even for one reign
  --json                       one JSON blob instead of the printed report
  --kingdom                    open the road past a town, so a big reign is crowned

The same thing with buttons: node tools/console.mjs, the Reign tab.
`;

export function parseArgs(argv: string[]): Args {
  const get = (name: string): string | undefined => {
    const at = argv.indexOf(`--${name}`);
    return at === -1 ? undefined : argv[at + 1];
  };
  const has = (name: string): boolean => argv.includes(`--${name}`);
  if (has('help') || has('h')) {
    console.log(HELP);
    process.exit(0);
  }

  const playerArg = get('player') ?? get('players');
  const players = playerArg
    ? (playerArg.split(',').map((p) => p.trim()) as Player[])
    : [...PLAYERS];
  for (const p of players) {
    if (!PLAYERS.includes(p)) {
      console.error(`unknown player "${p}"; one of ${PLAYERS.join(', ')}`);
      process.exit(1);
    }
  }

  let seeds: number[];
  const seedOne = get('seed');
  const seedMany = get('seeds');
  if (seedOne !== undefined) {
    seeds = [Number(seedOne)];
  } else if (seedMany !== undefined && seedMany.includes('-')) {
    const [a, b] = seedMany.split('-').map(Number);
    seeds = [];
    for (let i = a; i <= b; i++) seeds.push(i);
  } else if (seedMany !== undefined) {
    seeds = [];
    for (let i = 1; i <= Number(seedMany); i++) seeds.push(i);
  } else {
    seeds = [];
    for (let i = 1; i <= 12; i++) seeds.push(i);
  }

  const momentsArg = get('moments');
  if (momentsArg !== undefined && !['all', 'half', 'none'].includes(momentsArg)) {
    console.error('--moments takes all, half or none');
    process.exit(1);
  }

  const single = players.length === 1 && seeds.length === 1;
  return {
    players,
    seeds,
    moments: (momentsArg as Moments | undefined) ?? null,
    mistake: Number(get('mistake') ?? 0.3),
    speed: Number(get('speed') ?? 1),
    read: Number(get('read') ?? 1),
    timeline: has('no-timeline') ? false : has('timeline') || single,
    compare: !single || has('compare'),
    json: has('json'),
    kingdom: has('kingdom'),
  };
}

/* ------------------------------------------------------------------- rng */

/** A small seeded generator for the tool own choices; the game keeps its own. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* --------------------------------------------------------------- judging */

/**
 * How well a state is doing, read off one the engine has already produced.
 * The weakest board counts most, a board near the floor is punished hard, the
 * yearly trend is worth a few years of itself, a building that stands is worth
 * the store it cost (a one step look sees the bill and not the years of trend
 * behind it, so it has to be told), and a reign that just ended is the worst
 * state there is.
 */
function balanceScore(s: GameState): number {
  if (s.phase === 'portrait') return -10000;
  const boards = activeStats(s);
  const trend = trendsOf(s);
  let total = 0;
  let weakest = 100;
  for (const b of boards) {
    const v = s.stats[b];
    weakest = Math.min(weakest, v);
    total += v;
    if (v < 20) total -= (20 - v) * 3;
    total += (trend[b] ?? 0) * 3;
  }
  let standing = 0;
  for (const level of Object.values(s.buildings)) standing += level;
  // souls are not a board: a place that grows past what its health can carry
  // is not doing well, so the count is not rewarded here at all
  return total + weakest * 2 + standing * 8;
}

/**
 * The same look at a state, judged the way the kind answer judges it.
 *
 * How the place feels and how it lives, the people still standing in it, and
 * the trend on both, and nothing else. The store counts only near the floor,
 * because a place with an empty granary is nobody idea of a kind one; the
 * crown does not count at all, because what the kind answer costs is paid by
 * the person holding the seal, and that is the whole point of it.
 */
function kindScore(s: GameState): number {
  if (s.phase === 'portrait') return -10000;
  const trend = trendsOf(s);
  const boards = activeStats(s);
  let out = 0;
  for (const b of ['mood', 'health'] as StatId[]) {
    if (!boards.includes(b)) continue;
    out += s.stats[b] * 2 + (trend[b] ?? 0) * 4;
  }
  if (s.stats.economy < 12) out -= (12 - s.stats.economy) * 4;
  return out + s.population * 0.4;
}

/**
 * And the answer itself, which two boards cannot always tell apart.
 *
 * Nothing in the content marks an answer as the kind one, so this reads the
 * three things that always mean it: who lives (`souls`), whether the sentence
 * is a conviction, and whether the answer bends a law of yours in favour of
 * the person standing in front of you, which costs you the crown and is the
 * kindest thing the bench can do.
 */
function choiceKindness(choice: CaseChoice): number {
  let out = 0;
  if (choice.souls) out += choice.souls * 3;
  if (choice.exceptionToLaw) out += 12;
  if (choice.verdict === 'guilty') out -= 8;
  if (choice.verdict === 'innocent') out += 8;
  for (const [stat, value] of Object.entries(choice.effects)) {
    if (stat === 'mood' || stat === 'health') out += (value ?? 0) * 1.5;
  }
  return out;
}

/* ---------------------------------------------------------------- driver */

export interface YearRow {
  turn: number;
  events: string[];      // 'LAW pv1_work>shared', 'CASE v1_idle_hand>feed_him'
  work: string | null;
  moments: string[];
  stats: Record<StatId, number>;
  boards: StatId[];
  population: number;
  heavy: number;
  mid: number;
  warm: number;
}

export interface Run {
  seed: number;
  player: Player;
  moments: Moments;
  years: YearRow[];
  laws: number;
  cases: number;
  heavy: number;
  mid: number;
  warm: number;
  emptyYears: number;
  momentsTaken: number;
  momentPoints: number;
  ending: string;
  finalStats: Record<StatId, number>;
  finalBoards: StatId[];
  finalPopulation: number;
  lowest: { stat: StatId; value: number; turn: number };
  minutes: number;
}

const STAT_SHORT: Record<StatId, string> = {
  crownSanity: 'C', mood: 'M', health: 'H', economy: 'E', army: 'W', culture: 'K',
};

/** How heavy a scene is, by the band the scheduler files it in. */
function bandOf(caseId: string): 'heavy' | 'mid' | 'warm' {
  const c = getCase(caseId);
  if (!c) return 'mid';
  if (c.priority <= CONFIG.urgentPriority) return 'heavy';
  if (c.priority >= 12) return 'warm';
  return 'mid';
}

/** Reading budget per card, in seconds, before --read scales it. */
const READ = { law: 45, case: 50, aftermath: 15, works: 20, moment: 4 };

function pickIndex<T>(
  list: T[],
  player: Player,
  rnd: () => number,
  rank: (i: number) => number,
  mistake: number,
): number {
  if (list.length === 1) return 0;
  if (player === 'first') return 0;
  if (player === 'last') return list.length - 1;
  if (player === 'middle') return Math.floor((list.length - 1) / 2);
  if (player === 'random') return Math.floor(rnd() * list.length);
  let best = 0;
  let bestScore = -Infinity;
  for (let i = 0; i < list.length; i++) {
    const v = rank(i);
    if (v > bestScore) {
      bestScore = v;
      best = i;
    }
  }
  if (player === 'human' && rnd() < mistake) {
    const others = list.map((_, i) => i).filter((i) => i !== best);
    return others[Math.floor(rnd() * others.length)];
  }
  return best;
}

export function play(seed: number, player: Player, moments: Moments, args: Args): Run {
  const judge = JUDGES[player] ?? 'balance';
  const stateScore = judge === 'kind' ? kindScore : balanceScore;
  const rnd = mulberry32(seed * 7919 + PLAYERS.indexOf(player) * 104729 + 1);
  let s = newGame(seed);
  // the crown is not on the growth ladder yet: a reign only reaches it if the
  // run was asked for it, which is exactly what the dev door does on screen
  if (args.kingdom) s = { ...s, flags: [...s.flags, 'kingdom_open'] };
  const years: YearRow[] = [];
  const rowFor = (turn: number): YearRow => {
    let row = years[years.length - 1];
    if (!row || row.turn !== turn) {
      row = {
        turn, events: [], work: null, moments: [], stats: { ...s.stats },
        boards: activeStats(s), population: s.population, heavy: 0, mid: 0, warm: 0,
      };
      years.push(row);
    }
    return row;
  };

  let seconds = 0;
  let momentsTaken = 0;
  let momentPoints = 0;
  let lowest = { stat: 'crownSanity' as StatId, value: 100, turn: 1 };
  const watchLowest = (): void => {
    for (const b of activeStats(s)) {
      if (s.stats[b] < lowest.value) lowest = { stat: b, value: s.stats[b], turn: s.turn };
    }
  };
  let lastTurnSeen = 0;
  const wheel = (): void => {
    // the wheel between decisions, as App.tsx runs it: none in year one,
    // four steps into a new year, two between two events of one year
    if (s.turn <= 1) return;
    const steps = s.turn !== lastTurnSeen ? 4 : 2;
    seconds += ((steps - 1) * CONFIG.idle.seasonMs + CONFIG.idle.holdMs) / 1000 / args.speed;
  };

  /* The year of work, wherever in the year it is taken.

     The year used to stop on the shelf and wait, so this ran at `phase ===
     'works'` and that was the whole of it. It stops there now only when the
     year has nothing else in it AND the store can pay for something: the shelf
     is open in every season and a player who wants a building opens it during
     the year and takes one. So this runs at the first aftermath of a year as
     well, through `buildEarly`, which is the same spend without the turning of
     the year. A year already spent does nothing here, which is what "one thing
     in a year" means.

     And a year the store cannot pay for anything in is spent on nothing. There
     used to be a year of rest on the shelf, free and always takeable, so no
     driver ever met that year; it is gone (`content/works.ts`). */
  const spendTheYear = (): void => {
    if (s.lastWorkTurn === s.turn) return;
    const row = rowFor(s.turn);
    // autumn: the small things on the map, if this player stops for them
    if (moments !== 'none') {
      for (const m of momentsNow(s, seasonOf('works', s.turn))) {
        if (moments === 'half' && rnd() < 0.5) continue;
        const before = { ...s.stats };
        s = takeMoment(s, m.id);
        const gained = (Object.keys(s.stats) as StatId[]).reduce(
          (sum, k) => sum + (s.stats[k] - before[k]), 0,
        );
        momentsTaken += 1;
        momentPoints += gained;
        row.moments.push(m.id);
        seconds += READ.moment * args.read;
      }
    }
    const open = worksFor(s).filter((w) => canBuild(s, w.id));
    if (open.length === 0) return;
    /* Ranked a year ahead and taken today. `chooseWork` is the spend plus the
       turning of the year, and a building is worth what its trend pays, so a
       lookahead that stopped at the spend priced every work at its own cost
       and nothing else. The score reads the year; the state takes the spend
       alone when the year is still running. */
    const shelf = s.phase === 'works';
    const at = pickIndex(
      open, player, rnd, (i) => stateScore(chooseWork(s, open[i].id)), args.mistake,
    );
    const work = open[at];
    row.work = work.id;
    row.stats = { ...s.stats };
    row.boards = activeStats(s);
    row.population = s.population;
    seconds += READ.works * args.read;
    s = shelf ? chooseWork(s, work.id) : buildEarly(s, work.id);
    watchLowest();
  };

  for (let guard = 0; guard < 1000 && s.phase !== 'portrait'; guard++) {
    if (s.phase === 'intro') {
      s = advance(s);
      continue;
    }

    /* The one stop the shelf has left: a year with nobody at the door, and the
       first spring, and only where something on it can be paid for. The break
       below can no longer fire for that reason and is left as a guard: a shelf
       stop with nothing takeable on it would be a reign with no way forward,
       which is what the user reported as the game freezing. */
    if (s.phase === 'works') {
      spendTheYear();
      if (s.phase === 'works') break;
      continue;
    }

    if (s.phase === 'aftermath') {
      seconds += READ.aftermath * args.read;
      spendTheYear();
      s = continueYear(s);
      continue;
    }

    const ev = s.current;
    if (!ev) break;
    wheel();
    if (s.turn !== lastTurnSeen) lastTurnSeen = s.turn;
    const row = rowFor(s.turn);

    if (ev.kind === 'proposal') {
      const options = getProposal(ev.id)!.options;
      const at = pickIndex(
        options, player, rnd,
        (i) => stateScore(chooseLaw(s, ev.id, i, options[i].label)),
        args.mistake,
      );
      row.events.push(`LAW ${ev.id}>${options[at].action}`);
      seconds += READ.law * args.read;
      s = chooseLaw(s, ev.id, at, options[at].label);
    } else {
      const c = getCase(ev.id)!;
      const rulings = availableRulings(ev.id, s);
      const allowed = rulings.length > 0 ? new Set(rulings.map((r) => r.choiceId)) : null;
      let choices = allowed ? c.choices.filter((ch) => allowed.has(ch.id)) : c.choices;
      if (choices.length === 0) choices = c.choices;
      const at = pickIndex(
        choices, player, rnd,
        (i) =>
          stateScore(chooseCase(s, ev.id, choices[i].id)) +
          (judge === 'kind' ? choiceKindness(choices[i]) * 4 : 0),
        args.mistake,
      );
      let next = chooseCase(s, ev.id, choices[at].id);
      let chosen = choices[at].id;
      if (next.phase !== 'aftermath') {
        // the engine refused that one; take the first it accepts
        for (const ch of c.choices) {
          next = chooseCase(s, ev.id, ch.id);
          chosen = ch.id;
          if (next.phase === 'aftermath') break;
        }
      }
      row[bandOf(ev.id)] += 1;
      row.events.push(`CASE ${ev.id}>${chosen}`);
      seconds += READ.case * args.read;
      s = next;
    }
    watchLowest();
  }

  let ending: string;
  if (s.defeat) ending = `defeat:${s.defeat}`;
  else if (s.flags.includes('own_rope')) ending = 'own rope';
  else if (s.flags.includes('square_walked')) ending = 'walked out';
  else if (s.turn >= CONFIG.hardCapTurn) ending = 'cap';
  else ending = 'spent';
  if (s.stage === 'kingdom') ending += '+crown';

  return {
    seed, player, moments, years,
    laws: years.reduce((n, y) => n + y.events.filter((e) => e.startsWith('LAW')).length, 0),
    cases: years.reduce((n, y) => n + y.events.filter((e) => e.startsWith('CASE')).length, 0),
    heavy: years.reduce((n, y) => n + y.heavy, 0),
    mid: years.reduce((n, y) => n + y.mid, 0),
    warm: years.reduce((n, y) => n + y.warm, 0),
    emptyYears: years.filter((y) => y.events.length === 0).length,
    momentsTaken, momentPoints, ending,
    finalStats: { ...s.stats },
    finalBoards: activeStats(s),
    finalPopulation: s.population,
    lowest,
    minutes: seconds / 60,
  };
}

/** Every reign the arguments ask for, in one list. */
export function playAll(args: Args): Run[] {
  const runs: Run[] = [];
  for (const player of args.players) {
    const moments = args.moments ?? DEFAULT_MOMENTS[player];
    for (const seed of args.seeds) runs.push(play(seed, player, moments, args));
  }
  return runs;
}

/** Scenes that never came up in any of these reigns. */
export function neverReached(runs: Run[]): string[] {
  const seen = new Set<string>();
  for (const r of runs) {
    for (const y of r.years) {
      for (const e of y.events) if (e.startsWith('CASE ')) seen.add(e.slice(5).split('>')[0]);
    }
  }
  return allCases().map((c) => c.id).filter((id) => !seen.has(id));
}

/* ---------------------------------------------------------------- output */

function statsLine(
  stats: Record<StatId, number>, boards: StatId[], population: number,
): string {
  const parts = boards.map((b) => `${STAT_SHORT[b]}${String(Math.round(stats[b])).padStart(2)}`);
  return `${parts.join(' ')}  P${population}`;
}

function printTimeline(run: Run, args: Args): void {
  console.log(
    `\n=== seed ${run.seed} - ${run.player} - moments ${run.moments}` +
    `   ${run.years.length} years, ${run.laws} laws, ${run.cases} cases` +
    ` (${run.heavy} heavy / ${run.mid} mid / ${run.warm} warm), ${run.emptyYears} empty` +
    `, ${run.momentsTaken} small things (+${run.momentPoints})` +
    `, ~${run.minutes.toFixed(0)} min at ${args.speed}x` +
    `\n    ending: ${run.ending}   lowest: ${run.lowest.stat} ${run.lowest.value}` +
    ` in y${run.lowest.turn}` +
    `   final: ${statsLine(run.finalStats, run.finalBoards, run.finalPopulation)}`,
  );
  for (const y of run.years) {
    const mark = y.events.length === 0 ? '.' : y.heavy > 0 ? '!' : ' ';
    const ev = y.events.length ? y.events.join('   ') : '(nobody at the door)';
    const mo = y.moments.length ? `   +${y.moments.join(' +')}` : '';
    console.log(
      `  ${mark} y${String(y.turn).padStart(2)}  ${statsLine(y.stats, y.boards, y.population)}  ` +
      `${ev}   WORK ${y.work ?? '-'}${mo}`,
    );
  }
}

export function mean(list: number[]): number {
  return list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0;
}

/** One row of the comparison, so the page and the terminal agree on the numbers. */
export interface Summary {
  key: string;
  player: Player;
  moments: Moments;
  runs: number;
  years: number;
  laws: number;
  cases: number;
  heavy: number;
  warm: number;
  empty: number;
  momentsTaken: number;
  momentPoints: number;
  minutes: number;
  endings: string;
  lowest: string;
  final: Record<string, number>;
}

export function summarise(runs: Run[]): Summary[] {
  const groups = new Map<string, Run[]>();
  for (const r of runs) {
    const key = `${r.player}/${r.moments}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  const tally = (list: string[]): string => {
    const counts = new Map<string, number>();
    for (const item of list) counts.set(item, (counts.get(item) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([e, n]) => `${e} ${n}`)
      .join(', ');
  };
  return [...groups.entries()].map(([key, list]) => ({
    key,
    player: list[0].player,
    moments: list[0].moments,
    runs: list.length,
    years: mean(list.map((r) => r.years.length)),
    laws: mean(list.map((r) => r.laws)),
    cases: mean(list.map((r) => r.cases)),
    heavy: mean(list.map((r) => r.heavy)),
    warm: mean(list.map((r) => r.warm)),
    empty: mean(list.map((r) => r.emptyYears)),
    momentsTaken: mean(list.map((r) => r.momentsTaken)),
    momentPoints: mean(list.map((r) => r.momentPoints)),
    minutes: mean(list.map((r) => r.minutes)),
    endings: tally(list.map((r) => r.ending)),
    lowest: tally(list.map((r) => r.lowest.stat)),
    final: Object.fromEntries(
      (Object.keys(STAT_SHORT) as StatId[]).map((b) => [
        b, mean(list.map((r) => r.finalStats[b])),
      ]),
    ),
  }));
}

function printCompare(runs: Run[], args: Args): void {
  const head = [
    'player/moments', 'runs', 'years', 'laws', 'cases', 'heavy', 'warm', 'empty',
    'small+', 'min', 'endings', 'lowest board', 'final C M H E',
  ];
  const rows: string[][] = [head];
  for (const s of summarise(runs)) {
    rows.push([
      s.key,
      String(s.runs),
      s.years.toFixed(1),
      s.laws.toFixed(1),
      s.cases.toFixed(1),
      s.heavy.toFixed(1),
      s.warm.toFixed(1),
      s.empty.toFixed(1),
      `${s.momentsTaken.toFixed(1)} (+${s.momentPoints.toFixed(1)})`,
      s.minutes.toFixed(0),
      s.endings,
      s.lowest,
      `${Math.round(s.final.crownSanity)} ${Math.round(s.final.mood)}` +
      ` ${Math.round(s.final.health)} ${Math.round(s.final.economy)}`,
    ]);
  }
  const widths = head.map((_, i) => Math.max(...rows.map((r) => r[i].length)));
  console.log(
    `\nseeds ${args.seeds[0]}..${args.seeds[args.seeds.length - 1]}` +
    `, minutes at speed ${args.speed}x and reading x${args.read}` +
    `, human mistake ${args.mistake}`,
  );
  for (const [i, r] of rows.entries()) {
    console.log('  ' + r.map((c, j) => c.padEnd(widths[j])).join('  '));
    if (i === 0) console.log('  ' + widths.map((w) => '-'.repeat(w)).join('  '));
  }
  console.log(
    '\n  heavy = scenes the scheduler files at or under the urgent line' +
    ` (priority <= ${CONFIG.urgentPriority}); warm = priority 12 and up; mid = the rest.` +
    '\n  small+ = the small things on the map taken, and the points they gave.',
  );
}

/* ------------------------------------------------------------------ main */

/* Run as a command. The console does not import this file, it spawns it, so
   there is nothing here to guard against. */
{
  const args = parseArgs(process.argv.slice(2));
  const runs = playAll(args);
  if (args.json) {
    console.log(JSON.stringify({
      args, runs, summary: summarise(runs), never: neverReached(runs),
    }));
  } else {
    if (args.timeline) for (const r of runs) printTimeline(r, args);
    if (args.compare) printCompare(runs, args);
    const never = neverReached(runs);
    if (args.compare && never.length > 0) {
      console.log(`\n  never reached in these reigns: ${never.join(', ')}`);
    }
  }
}
