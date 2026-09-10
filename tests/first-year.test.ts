import { describe, expect, it } from 'vitest';
import { WORKS } from '../src/content/works';
import { CONFIG } from '../src/engine/config';
import { chooseCase, chooseDeclared, chooseLaw, chooseWork, continueYear, newGame, openProposals } from '../src/engine/reducer';
import { getProposal } from '../src/engine/registry';
import { worksFor } from '../src/engine/simulation';
import { pickEvent } from '../src/engine/scheduler';
import type { GameState } from '../src/engine/types';

/** A reign on the morning after the founding, before anything has happened. */
function opened(): GameState {
  return chooseDeclared(newGame(11), 'utilitarian');
}

describe('the first year', () => {
  it('has no law in it at all', () => {
    const s = opened();
    expect(s.turn).toBe(1);
    expect(openProposals(s), 'the seal comes out in the first spring').toEqual([]);
    // and nothing knocks either: every dilemma waits on a law of its chain
    expect(pickEvent(s, { lawAllowed: true }), 'somebody is at the door in year one').toBeNull();
  });

  it('and the seal comes out in the second', () => {
    const s = opened();
    s.turn = 2;
    expect(openProposals(s)).toContain('pv1_work');
  });

  /**
   * And the second year holds both halves of the same argument.
   *
   * A decree used to spend the year's one dilemma as well as its slot, so the
   * first person the first law lands on could not be heard until the third
   * spring, and the whole written arc sat a year behind the reign that was
   * paying for it. The drafting table is not somebody at the door: a year that
   * seals a law can still hear the one person it lands on, and then it is
   * full, because the count of slots has not changed.
   */
  it('seals the first law and hears the first person it lands on in the same year', () => {
    let s = chooseWork(opened(), 'house');
    expect(s.turn, 'the second spring').toBe(2);
    expect(s.current, 'the seal opens the year').toEqual({ kind: 'proposal', id: 'pv1_work' });

    const p = getProposal('pv1_work')!;
    s = chooseLaw(s, 'pv1_work', 0, p.options[0].label);
    s = continueYear(s);
    expect(s.turn, 'still the same year').toBe(2);
    expect(s.current, 'and the man the law is about is at the door').toEqual({
      kind: 'case',
      id: 'v1_idle_hand',
    });

    // and that is the year full: two things, and the rest belongs to the place
    s = continueYear(chooseCase(s, 'v1_idle_hand', 'feed_him'));
    expect(s.phase).toBe('works');
    expect(s.turn).toBe(2);
  });

  it('offers a roof or somewhere to work, and only those two to start with', () => {
    const s = opened();
    const open = worksFor(s).map((w) => w.id);
    expect(open, 'no roof on offer').toContain('house');
    expect(open, 'no cabin on offer').toContain('woodcutter');
    // and nothing else: a granary is not a thing five people decide about in
    // the first spring, and neither is going back to bed. The first year is
    // the one with no law and no caller in it, so the shelf is the whole of
    // the decision and resting would empty the screen.
    expect(open.sort()).toEqual(['house', 'woodcutter']);
    expect(open, 'the first year can be slept through').not.toContain('rest');
    // the store holds one building and not two, so the first year is a choice
    // of exactly one of them and the other waits for a better year
    const price = (id: string) => WORKS.find((w) => w.id === id)!.cost;
    expect(s.stats.economy, 'neither can be afforded at all').toBeGreaterThanOrEqual(price('house'));
    expect(
      s.stats.economy,
      'both could go up in the same year',
    ).toBeLessThan(price('house') + price('woodcutter'));
  });

  it('leaves the one not chosen on the list for later', () => {
    const s = opened();
    s.stats.economy = 40;
    const after = chooseWork(s, 'house');
    expect(after.buildings.house).toBe(1);
    expect(worksFor(after).map((w) => w.id), 'the cabin is gone for good').toContain('woodcutter');
  });

  it('gives the two of them different jobs, and the house is why health is low', () => {
    const house = WORKS.find((w) => w.id === 'house')!;
    const cabin = WORKS.find((w) => w.id === 'woodcutter')!;
    expect(house.trend.mood!).toBeGreaterThan(0);
    expect(house.trend.health!).toBeGreaterThan(0);
    expect(cabin.trend.economy!).toBe(1.5);
    expect(cabin.trend.mood, 'the cabin is not a comfort').toBeUndefined();
    // both are a village year, and neither is dearer than a village year is
    for (const w of [house, cabin]) {
      expect(w.stage).toBe('village');
      expect(w.cost).toBeLessThanOrEqual(CONFIG.works.costVillage);
    }
    // and the cabin is the dearer of the two, which is what makes the first
    // choice a choice rather than a preference
    expect(cabin.cost).toBeGreaterThan(CONFIG.works.costFirstYear);
    // the roof matters because a hamlet starts unwell, and it starts unwell
    expect(CONFIG.start.health).toBeLessThan(20);
  });
});
