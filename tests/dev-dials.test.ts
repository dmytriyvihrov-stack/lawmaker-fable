import { describe, expect, it } from 'vitest';
import { beginAt } from '../src/engine/chapters';
import { CONFIG } from '../src/engine/config';
import { dialCeiling, dialValue, isCount, turnDial, type DialId } from '../src/engine/dev';
import { advance, continueYear, newGame } from '../src/engine/reducer';
import { activeStats, storeCap } from '../src/engine/simulation';
import type { GameState, Stage, StatId } from '../src/engine/types';

/**
 * The dev dials, which are a hand on the arithmetic and not a second set of
 * rules for it.
 *
 * The whole value of the panel is that what it does to a board is exactly what
 * a bad year does to it: held between nought and a hundred, under the store's
 * lid, refused on a board the place has not opened, and written down in the
 * ledger. A dial that quietly set a field would be a tool that lies about the
 * game it is a tool for, so this is where that is held true.
 */

const ALL: DialId[] = [
  'crownSanity', 'mood', 'health', 'economy', 'army', 'culture',
  'population', 'research', 'turn',
];

describe('the dev dials', () => {
  it('moves a board and says in the ledger that a hand did it', () => {
    const s = beginAt('town', 7);
    const up = turnDial(s, 'mood', 5);
    expect(up.stats.mood).toBe(s.stats.mood + 5);
    const line = up.ledger[up.ledger.length - 1];
    expect(line.stat).toBe('mood');
    expect(line.delta).toBe(5);
    expect(line.source).not.toBe('');
    // and the reign it came from is untouched
    expect(s.stats.mood).toBe(dialValue(s, 'mood'));
  });

  it('stops where the engine stops, at both ends', () => {
    const s = beginAt('town', 7);
    expect(turnDial(s, 'mood', 999).stats.mood).toBe(CONFIG.statMax);
    expect(turnDial(s, 'mood', -999).stats.mood).toBe(CONFIG.statMin);
  });

  it('the store is held under its own lid, and the panel can say where it is', () => {
    const s = beginAt('village', 7);
    const lid = storeCap(s);
    expect(lid).toBeLessThan(CONFIG.statMax);
    expect(dialCeiling(s, 'economy')).toBe(lid);
    expect(turnDial(s, 'economy', 999).stats.economy).toBe(lid);
  });

  it('refuses a board the place has not opened yet', () => {
    const s = beginAt('village', 7);
    expect(activeStats(s)).not.toContain('army');
    const pushed = turnDial(s, 'army', 20);
    expect(pushed).toBe(s);
    expect(pushed.ledger).toHaveLength(s.ledger.length);
  });

  it('a delta of nothing is nothing, and hands the same reign back', () => {
    const s = beginAt('town', 7);
    for (const dial of ALL) expect(turnDial(s, dial, 0)).toBe(s);
  });

  it('the counts are whole and never go under nought', () => {
    const s = newGame(3);
    expect(turnDial(s, 'population', 4).population).toBe(s.population + 4);
    expect(turnDial(s, 'population', -9999).population).toBe(0);
    expect(turnDial(s, 'research', -1).research).toBe(0);
    expect(turnDial(s, 'turn', 8).turn).toBe(s.turn + 8);
    expect(turnDial(s, 'turn', -50).turn).toBe(0);
    // a count is not a board: nothing about it is written in the ledger
    expect(turnDial(s, 'population', 4).ledger).toHaveLength(s.ledger.length);
    for (const dial of ALL) expect(isCount(dial)).toBe(!(dial in s.stats));
  });

  it('leaves a reign the engine can still play on', () => {
    for (const chapter of ['village', 'town', 'kingdom'] as Stage[]) {
      let s: GameState = beginAt(chapter, 5);
      for (const dial of ALL) s = turnDial(s, dial, dial === 'turn' ? 1 : 7);
      for (const stat of Object.keys(s.stats) as StatId[]) {
        expect(s.stats[stat], `${chapter}: ${stat}`).toBeGreaterThanOrEqual(CONFIG.statMin);
        expect(s.stats[stat], `${chapter}: ${stat}`).toBeLessThanOrEqual(CONFIG.statMax);
      }
      const on = s.phase === 'aftermath' ? continueYear(s) : advance(s);
      expect(on.turn, chapter).toBeGreaterThanOrEqual(s.turn);
    }
  });
});
