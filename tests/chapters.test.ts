import { describe, expect, it } from 'vitest';
import { beginAt } from '../src/engine/chapters';
import { CONFIG } from '../src/engine/config';
import {
  advance,
  chooseCase,
  chooseLaw,
  chooseWork,
  continueYear,
  newGame,
} from '../src/engine/reducer';
import { getCase, getProposal } from '../src/engine/registry';
import { activeStats, canBuild, storeCap, worksFor } from '../src/engine/simulation';
import { loadGame, SAVE_KEY } from '../src/engine/save';
import type { GameState, Stage } from '../src/engine/types';

const CHAPTERS: Stage[] = ['village', 'town', 'kingdom'];

/**
 * The save's own shape test, which is the strictest thing in the engine about
 * what a legal state is. It is not exported, so it is reached the way the game
 * reaches it: write the state and read it back.
 */
function survivesTheSave(s: GameState): boolean {
  const store: Record<string, string> = {};
  const stub = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
  };
  const had = (globalThis as { localStorage?: unknown }).localStorage;
  (globalThis as { localStorage?: unknown }).localStorage = stub;
  try {
    // the key the game writes under, taken from a state it certainly accepts
    const key = SAVE_KEY;
    store[key] = JSON.stringify(s);
    return loadGame() !== null;
  } finally {
    (globalThis as { localStorage?: unknown }).localStorage = had;
  }
}

/** Plays a fabricated reign on with the simplest possible player. */
function playOn(start: GameState, years: number): GameState {
  let s = start;
  for (let guard = 0; guard < years * 6 && s.phase !== 'portrait'; guard++) {
    if (s.phase === 'intro') {
      s = advance(s);
      continue;
    }
    if (s.phase === 'aftermath') {
      s = continueYear(s);
      continue;
    }
    if (s.phase === 'works') {
      const open = worksFor(s).filter((w) => canBuild(s, w.id));
      s = chooseWork(s, open[0].id);
      continue;
    }
    const ev = s.current;
    if (!ev) break;
    if (ev.kind === 'proposal') {
      const options = getProposal(ev.id)!.options;
      s = chooseLaw(s, ev.id, 0, options[0].label);
    } else {
      const choice = getCase(ev.id)!.choices[0];
      s = chooseCase(s, ev.id, choice.id);
    }
    if (s.turn >= start.turn + years) break;
  }
  return s;
}

describe('the chapter door', () => {
  it('opens a legal state at every chapter', () => {
    for (const chapter of CHAPTERS) {
      const s = beginAt(chapter, 4242);
      expect(s.stage, chapter).toBe(chapter);
      expect(survivesTheSave(s), `${chapter} is not a state the game would load`).toBe(true);
      expect(activeStats(s).length, chapter).toBeGreaterThan(0);
      expect(worksFor(s).length, `nothing to spend a year on in ${chapter}`).toBeGreaterThan(0);
    }
  });

  it('never starts a store over its own lid', () => {
    // the store has a ceiling that the granary lifts, and `bump` clamps to it.
    // A fixture that opens above that ceiling is snapped down by whatever
    // happens to touch the store first, and that thing wears the whole drop in
    // the ledger: the first year abroad read "grain went to Corrow: -16" for a
    // gift of ten. A fabricated reign has to be a state the engine would allow.
    for (const chapter of CHAPTERS) {
      const s = beginAt(chapter, 4242);
      expect(s.stats.economy, `${chapter} opens over its store cap`).toBeLessThanOrEqual(
        storeCap(s),
      );
    }
  });

  it('is the same reign for one seed and a different one for another', () => {
    expect(JSON.stringify(beginAt('town', 7))).toBe(JSON.stringify(beginAt('town', 7)));
    expect(JSON.stringify(beginAt('town', 7))).not.toBe(JSON.stringify(beginAt('town', 8)));
  });

  it('leaves the road past a town open at every chapter', () => {
    for (const chapter of CHAPTERS) {
      expect(beginAt(chapter, 3).flags, chapter).toContain('kingdom_open');
    }
  });

  it('starts the hamlet exactly where a new reign starts', () => {
    const fresh = newGame(99);
    const door = beginAt('village', 99);
    expect({ ...door, flags: [] }).toEqual({ ...fresh, flags: [] });
  });

  it('opens the town chartered, in the autumn, with laws standing', () => {
    const s = beginAt('town', 11);
    expect(s.phase).toBe('works');
    expect(s.townName, 'a chartered town with no name').toBeTruthy();
    expect(s.laws.filter((l) => l.status === 'active').length).toBeGreaterThanOrEqual(3);
    expect(activeStats(s), 'the charter did not open the boards').toHaveLength(6);
  });

  it('opens the kingdom with a world in it', () => {
    const s = beginAt('kingdom', 11);
    expect(s.kingdomSince).toBe(20);
    expect(s.world?.states).toHaveLength(CONFIG.kingdom.states);
    expect(s.world?.peoples).toHaveLength(4);
    expect(s.flags).toContain('became_kingdom');
    expect(activeStats(s), 'a kingdom reading as a hamlet').toHaveLength(6);
  });

  it('plays on from each of them without throwing', () => {
    for (const chapter of CHAPTERS) {
      const start = beginAt(chapter, 21);
      const after = playOn(start, 6);
      expect(after.turn, chapter).toBeGreaterThanOrEqual(start.turn);
      expect(after.stats.economy, chapter).toBeGreaterThanOrEqual(0);
    }
  });

  it('grows a town into a kingdom the year the count passes', () => {
    const town = beginAt('town', 5);
    const big: GameState = {
      ...town,
      population: CONFIG.kingdom.at - 1,
      phase: 'aftermath',
    };
    // one year, and the count carries it over the line
    const after = advance(big);
    expect(after.population).toBeGreaterThanOrEqual(CONFIG.kingdom.at);
    expect(after.stage).toBe('kingdom');
    expect(after.turn).toBeLessThan(CONFIG.hardCapTurn);
  });

  it('gives a crowned reign its ten years even when every law is written', () => {
    const s = beginAt('kingdom', 6);
    const done: GameState = {
      ...s,
      kingdomSince: s.turn,
      usedProposals: ['everything'],
      phase: 'aftermath',
    };
    // the drafting table is empty and the reign is not over: there are still
    // neighbours, and they are the reason the crown is not the last screen
    expect(advance(done).phase).not.toBe('portrait');
  });
});
