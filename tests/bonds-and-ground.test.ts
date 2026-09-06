import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/engine/config';
import {
  bondFromChoice,
  bondLevel,
  giftBlock,
  isLover,
  loverBlock,
  loverOf,
  nudgeBond,
} from '../src/engine/bonds';
import { chooseCase, chooseWork, giveGift, newGame, takeLover } from '../src/engine/reducer';
import { agesNow } from '../src/engine/folk';
import { growthLadder } from '../src/engine/growth';
import { DEFAULT_PLOT, freePlots, needsPlacement, occupantOf } from '../src/engine/plots';
import { trendOf, trendSourcesOf } from '../src/engine/simulation';
import { WORKS } from '../src/content/works';
import { PLOT_NAMES } from '../src/content/meta';
import { PLOT_MARK, PLOT_SITES } from '../src/ui/components/town/sites';
import type { CaseChoice, GameState } from '../src/engine/types';

/**
 * A reign far enough along to have met somebody and to afford a bowl.
 *
 * The granary is not decoration. The store is the one board with a lid on it,
 * and the lid is fifteen until somebody builds one: a fixture that simply
 * writes forty into the store has its first spend clamp the whole thing back
 * down to the shelf, and then nothing about a price can be tested at all.
 */
function reign(): GameState {
  const s = newGame(7);
  s.turn = 6;
  s.population = 30;
  s.buildings.granary = 1;
  s.placements = { granary: 'cart_ground' };
  s.stats.economy = 40;
  return s;
}

describe('what one person thinks of you', () => {
  it('starts at nothing and never leaves the five rungs', () => {
    const s = reign();
    expect(bondLevel(s, 'tam')).toBe(0);
    nudgeBond(s, 'tam', 9);
    expect(bondLevel(s, 'tam')).toBe(2);
    nudgeBond(s, 'tam', -9);
    expect(bondLevel(s, 'tam')).toBe(-2);
  });

  it('is not a thing the square, the crown or an animal can have', () => {
    const s = reign();
    for (const who of ['crowd', 'monarch', 'wolf']) {
      nudgeBond(s, who, 2);
      expect(bondLevel(s, who), who).toBe(0);
    }
  });

  /**
   * The engine reads an answer when content has not written one in, so the
   * whole cast has an opinion without every scene in the game being edited.
   */
  it('reads an answer the way the person standing there would', () => {
    const base: CaseChoice = { id: 'x', text: '', result: '', tags: [], effects: {} };
    expect(bondFromChoice({ ...base, bond: -2 })).toBe(-2);
    expect(bondFromChoice({ ...base, verdict: 'guilty' })).toBe(-1);
    expect(bondFromChoice({ ...base, verdict: 'innocent' })).toBe(1);
    // and bending your own law says nothing on its own: half the exceptions in
    // this game are bent against the person standing there
    expect(
      bondFromChoice({ ...base, exceptionToLaw: 'work_shared', beneficiary: 'Tam' }),
    ).toBe(0);
    expect(bondFromChoice({ ...base, effects: { mood: 6 } })).toBe(1);
    expect(bondFromChoice({ ...base, effects: { mood: -6 } })).toBe(-1);
    expect(bondFromChoice({ ...base, effects: { economy: 6 } })).toBe(0);
  });

  it('moves when you answer the person who brought it', () => {
    const s = reign();
    s.current = { kind: 'case', id: 'v1_idle_hand' };
    const fed = chooseCase(s, 'v1_idle_hand', 'feed_him');
    const cut = chooseCase(s, 'v1_idle_hand', 'cut_his_share');
    expect(bondLevel(fed, 'tam')).toBeGreaterThan(bondLevel(cut, 'tam'));
  });
});

describe('the two things you can spend on a person', () => {
  it('a gift costs the store, buys one rung, and then waits two years', () => {
    const s = reign();
    const before = s.stats.economy;
    const given = giveGift(s, 'tam');
    expect(given.stats.economy).toBe(before - CONFIG.bond.giftCost);
    expect(bondLevel(given, 'tam')).toBe(1);

    // not to the same person again inside the wait
    expect(giftBlock(given, 'tam')).toBe('waiting');
    expect(giveGift(given, 'tam')).toBe(given);

    const later = { ...given, turn: given.turn + CONFIG.bond.giftEvery };
    expect(giftBlock(later, 'tam')).toBeNull();
    expect(bondLevel(giveGift(later, 'tam'), 'tam')).toBe(2);
  });

  it('a gift is refused at the top rung and with an empty store', () => {
    const top = reign();
    nudgeBond(top, 'tam', 2);
    expect(giftBlock(top, 'tam')).toBe('top');

    const poor = reign();
    poor.stats.economy = CONFIG.bond.giftCost - 1;
    expect(giftBlock(poor, 'tam')).toBe('poor');
    expect(giveGift(poor, 'tam')).toBe(poor);
  });

  it('somebody can only be taken from the top rung, and only one of them', () => {
    const s = reign();
    expect(loverBlock(s, 'tam')).toBe('needs');
    expect(takeLover(s, 'tam')).toBe(s);

    nudgeBond(s, 'tam', 2);
    nudgeBond(s, 'iva', 2);
    const took = takeLover(s, 'tam');
    expect(took.lover).toBe('tam');
    expect(isLover(took, 'tam')).toBe(true);
    expect(took.stats.economy).toBe(s.stats.economy - CONFIG.bond.loverCost);
    expect(took.bonds!.tam.loverSince).toBe(took.turn);

    // and there is only ever one
    expect(loverBlock(took, 'iva')).toBe('taken');
    expect(takeLover(took, 'iva')).toBe(took);
  });

  it('steadies the crown every year, and only while it is true', () => {
    const s = reign();
    nudgeBond(s, 'tam', 2);
    const took = takeLover(s, 'tam');
    expect(trendOf(took, 'crownSanity') - trendOf(s, 'crownSanity')).toBe(
      CONFIG.bond.loverSanity,
    );
    expect(trendSourcesOf(took, 'crownSanity').some((x) => x.kind === 'lover')).toBe(true);

    // a bond that falls back off the top rung is not a lover any more
    const cooled = { ...took };
    nudgeBond(cooled, 'tam', -1);
    expect(cooled.lover).toBeNull();
    expect(loverOf(cooled)).toBeNull();
    expect(trendOf(cooled, 'crownSanity')).toBe(trendOf(s, 'crownSanity'));
  });
});

describe('where a building goes', () => {
  it('asks only for the first floor of a thing that stands in the settlement', () => {
    const s = reign();
    expect(needsPlacement(s, 'well')).toBe(true);
    expect(needsPlacement(s, 'hall')).toBe(true);
    // the country decides these, not the place
    expect(needsPlacement(s, 'road')).toBe(false);
    expect(needsPlacement(s, 'bridge')).toBe(false);
    expect(needsPlacement(s, 'fields')).toBe(false);
    expect(needsPlacement(s, 'fence')).toBe(false);
    expect(needsPlacement(s, 'mine')).toBe(false);
    expect(needsPlacement(s, 'rest')).toBe(false);
  });

  it('puts it where it was told, and never asks about that building again', () => {
    const s = reign();
    const built = chooseWork(s, 'well', 'north_gate');
    expect(built.placements!.well).toBe('north_gate');
    expect(occupantOf(built, 'north_gate')).toBe('well');
    expect(freePlots(built)).not.toContain('north_gate');
    // the second floor goes on top of the first one
    expect(needsPlacement(built, 'well')).toBe(false);
  });

  it('will not put two things on one footprint', () => {
    const s = reign();
    const first = chooseWork(s, 'well', 'square_west');
    const second = chooseWork(first, 'long_room', 'square_west');
    // the ground was taken, so it goes on ground that is not
    expect(second.placements!.long_room).not.toBe('square_west');
    expect(occupantOf(second, 'square_west')).toBe('well');
  });

  /**
   * A caller that does not answer still has to leave the ground consistent:
   * an old save, a golden playthrough, a prototype entry.
   */
  it('falls back to the ground the picture always gave it', () => {
    const s = reign();
    const built = chooseWork(s, 'hall');
    expect(built.placements!.hall).toBe(DEFAULT_PLOT.hall);
    expect(built.buildings.hall).toBe(1);
  });

  it('every plot is named, drawn and marked, and no two share a footprint', () => {
    const ids = Object.keys(PLOT_SITES) as (keyof typeof PLOT_SITES)[];
    for (const id of ids) {
      expect(PLOT_NAMES[id], id).toBeDefined();
      expect(PLOT_MARK[id], id).toBeDefined();
      // nothing is drawn in the sky or down in the meadow the card floats over
      expect(PLOT_SITES[id].y, id).toBeGreaterThan(200);
      expect(PLOT_MARK[id].y, id).toBeLessThan(560);
    }
    const seen = new Set(ids.map((id) => `${PLOT_SITES[id].x},${PLOT_SITES[id].y}`));
    expect(seen.size).toBe(ids.length);
  });
});

describe('the two links of the one chain', () => {
  it('the road is the one that earns and the bridge is the one that does not', () => {
    const road = WORKS.find((w) => w.id === 'road')!;
    const bridge = WORKS.find((w) => w.id === 'bridge')!;
    expect(road.trend.economy).toBe(1);
    expect(bridge.trend.economy).toBeUndefined();
    // and it is still worth a year, or it would not be on the list
    expect(Object.keys(bridge.trend).length).toBeGreaterThan(0);
    expect(bridge.trend.mood!).toBeGreaterThan(0);
  });
});

describe('the ladder the place climbs by filling up', () => {
  it('asks which board first, and afterwards says which one you took', () => {
    const s = reign();
    s.population = CONFIG.boards.secondAt + 10;

    const asking = growthLadder(s).find((step) => step.at === CONFIG.boards.firstAt)!;
    expect(asking.choose).toBe(true);
    expect(asking.boards).toHaveLength(2);

    s.boards = ['culture', 'army'];
    const ladder = growthLadder(s);
    const first = ladder.find((step) => step.at === CONFIG.boards.firstAt)!;
    const second = ladder.find((step) => step.at === CONFIG.boards.secondAt)!;
    expect(first.choose).toBe(false);
    expect(first.taken).toBe(true);
    expect(first.boards).toEqual(['culture']);
    expect(second.taken).toBe(true);
    expect(second.boards).toEqual(['army']);
  });
});

/**
 * The register knows how old everybody is. Until now, nothing asked it before
 * offering to take somebody, and three of the people who come to the door are
 * children: Iva is nine, Wat eleven, Lark twelve.
 */
describe('who can be taken', () => {
  function met(character: string, caseId: string, year: number): GameState {
    const s = newGame(11);
    s.turn = year;
    s.log = [{ turn: 1, kind: 'case', refId: caseId, choiceId: 'x', tags: [] }];
    s.bonds = { [character]: { level: 2 } };
    s.stats.economy = 40;
    return s;
  }

  it('never offers a child, whatever the rung says', () => {
    for (const [character, caseId] of [
      ['iva', 'd1_pies'],
      ['lark', 'c1_lark'],
      ['runner', 'w_race'],
      ['odo', 'w_goats'],
    ] as const) {
      const s = met(character, caseId, 1);
      expect(bondLevel(s, character), character).toBe(2);
      expect(loverBlock(s, character), character).toBe('child');
    }
  });

  it('and stops saying so on the year it stops being true', () => {
    // Iva is nine the year she walks in, so the reign has to be long enough
    const young = met('iva', 'd1_pies', 5);
    expect(loverBlock(young, 'iva')).toBe('child');
    const grown = met('iva', 'd1_pies', 14);
    expect(agesNow(grown).get('iva')).toBe(22);
    expect(loverBlock(grown, 'iva')).toBeNull();
  });

  it('leaves the grown ones exactly as they were', () => {
    const s = met('tam', 'v1_idle_hand', 3);
    expect(loverBlock(s, 'tam')).toBeNull();
    // and the rung still decides everything else
    s.bonds = { tam: { level: 1 } };
    expect(loverBlock(s, 'tam')).toBe('needs');
  });
});
