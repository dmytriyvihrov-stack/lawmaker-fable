import { describe, expect, it } from 'vitest';
import { agoWords, renderTemplate, yearsSince } from '../src/engine/format';
import { chooseCase, newGame } from '../src/engine/reducer';
import { getCase } from '../src/engine/registry';
import { pickEvent } from '../src/engine/scheduler';
import type { GameState, StoryFlag } from '../src/engine/types';

/**
 * The people who come back.
 *
 * Tam said his back in the first spring; what you said to him is the fence
 * the valley has four autumns later. Marta was on the plot by the stream when
 * the mill-wright came; whether she still is decides how she answers the day
 * the place wants ground again. Each return is gated on the flag the first
 * scene left, and says out loud what you did and how long ago.
 */

/** A reign that met somebody in year one and did something to them. */
function after(caseId: string, choiceId: string, flag: StoryFlag, turn: number): GameState {
  const s = newGame(11);
  s.turn = 1;
  s.log.push({ turn: 1, kind: 'case', refId: caseId, choiceId, tags: [] });
  s.shownCases.push(caseId);
  // family comes first when two urgent callers share an autumn, so the
  // brother has already been and gone in these reigns
  s.shownCases.push('w_brother');
  s.flags.push(flag);
  s.turn = turn;
  s.population = 12;
  return s;
}

describe('how long ago it was, in words', () => {
  it('spells the years out the way a person says them', () => {
    expect(agoWords(0)).toBe('this year');
    expect(agoWords(1)).toBe('last year');
    expect(agoWords(4)).toBe('four years ago');
    expect(agoWords(7)).toBe('seven years ago');
    expect(agoWords(23)).toBe('23 years ago');
    expect(agoWords(null)).toBe('some years ago');
  });

  it('reads the year off the log, and admits it when there is nothing there', () => {
    const s = after('v1_idle_hand', 'feed_him', 'tam_fed', 5);
    expect(yearsSince(s, 'v1_idle_hand')).toBe(4);
    expect(yearsSince(s, 'v3_millwright')).toBeNull();
    expect(renderTemplate('You fed Tam {{ago:v1_idle_hand}}.', s)).toBe('You fed Tam four years ago.');
    expect(renderTemplate('{{ago:v3_millwright}}', s)).toBe('some years ago');
  });
});

describe('Tam, and the fence, four autumns on', () => {
  it('comes back the way you left him, and only that way', () => {
    const fed = after('v1_idle_hand', 'feed_him', 'tam_fed', 5);
    expect(pickEvent(fed, { lawAllowed: false })).toEqual({ kind: 'case', id: 'r1_tam_fed' });
    const cut = after('v1_idle_hand', 'no_work_no_bread', 'tam_cut', 5);
    expect(pickEvent(cut, { lawAllowed: false })).toEqual({ kind: 'case', id: 'r1_tam_cut' });
  });

  it('never pushes a decree back a year, and never loses the lottery to a wanderer', () => {
    // a law is due and open: the law comes first, and Tam takes the next slot
    const fed = after('v1_idle_hand', 'feed_him', 'tam_fed', 5);
    const first = pickEvent(fed, { lawAllowed: true });
    expect(first?.kind).toBe('proposal');
    // the wolf and the corner are both eligible in this year and lose to him
    const second = pickEvent(fed, { lawAllowed: false });
    expect(second).toEqual({ kind: 'case', id: 'r1_tam_fed' });
  });

  it('does not come back before its years, or to a place that never decided about him', () => {
    const early = after('v1_idle_hand', 'feed_him', 'tam_fed', 3);
    const picked = pickEvent(early, { lawAllowed: false });
    expect(picked?.kind === 'case' ? picked.id : null).not.toBe('r1_tam_fed');
    const nobody = newGame(11);
    nobody.turn = 6;
    nobody.population = 12;
    const other = pickEvent(nobody, { lawAllowed: false });
    expect(other?.kind === 'case' ? other.id : null).not.toMatch(/^r\d/);
  });

  it('tells him what you did and when, in the scene itself', () => {
    const s = after('v1_idle_hand', 'no_work_no_bread', 'tam_cut', 6);
    s.current = { kind: 'case', id: 'r1_tam_cut' };
    const scene = getCase('r1_tam_cut')!.scene.map((p) => renderTemplate(p, s)).join(' ');
    expect(scene).toContain('five years ago');
    expect(scene).not.toContain('{{');
  });

  it('is a ruling like any other once he is at the door', () => {
    const s = after('v1_idle_hand', 'no_work_no_bread', 'tam_cut', 6);
    s.current = { kind: 'case', id: 'r1_tam_cut' };
    const asked = chooseCase(s, 'r1_tam_cut', 'ask_him_yourself');
    expect(asked.phase).toBe('aftermath');
    expect(asked.shownCases).toContain('r1_tam_cut');
    // and the fence comes back once: a shown return is not eligible again
    const again = pickEvent({ ...asked, turn: 8, current: null }, { lawAllowed: false });
    expect(again?.kind === 'case' ? again.id : null).not.toBe('r1_tam_cut');
  });
});

describe('Marta, and the ground, years on', () => {
  it('remembers which way the plot went', () => {
    const kept = after('v3_millwright', 'marta_keeps', 'marta_kept', 8);
    expect(pickEvent(kept, { lawAllowed: false })).toEqual({ kind: 'case', id: 'r2_marta_kept' });
    const moved = after('v3_millwright', 'plot_to_the_mill', 'marta_moved', 8);
    expect(pickEvent(moved, { lawAllowed: false })).toEqual({ kind: 'case', id: 'r2_marta_moved' });
  });

  it('says how long she has been waiting', () => {
    const s = after('v3_millwright', 'plot_to_the_mill', 'marta_moved', 8);
    s.current = { kind: 'case', id: 'r2_marta_moved' };
    const scene = getCase('r2_marta_moved')!.scene.map((p) => renderTemplate(p, s)).join(' ');
    expect(scene).toContain('gave her plot to the mill seven years ago');
  });

  it('the split at the stream leaves her on her ground, and the mill-wright who stays anyway does too', () => {
    const base = newGame(3);
    base.current = { kind: 'case', id: 'v3_millwright' };
    expect(chooseCase(base, 'v3_millwright', 'share_the_stream').flags).toContain('marta_kept');
    expect(chooseCase(base, 'v3_millwright', 'stays_anyway').flags).toContain('marta_kept');
    expect(chooseCase(base, 'v3_millwright', 'plot_to_the_mill').flags).toContain('marta_moved');
  });

  it('the easy compromise costs the store now, and taking her last strip costs souls', () => {
    const mill = getCase('v3_millwright')!;
    const split = mill.choices.find((c) => c.id === 'share_the_stream')!;
    expect(split.effects.economy).toBeLessThan(0);
    const s = after('v3_millwright', 'plot_to_the_mill', 'marta_moved', 8);
    s.current = { kind: 'case', id: 'r2_marta_moved' };
    const taken = chooseCase(s, 'r2_marta_moved', 'take_it_as_before');
    expect(taken.population).toBeLessThan(s.population);
  });
});
