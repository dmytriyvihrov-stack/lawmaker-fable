import { describe, expect, it } from 'vitest';
import { AGES } from '../src/content/folk';
import { bondLevel } from '../src/engine/bonds';
import { agesNow, doingsNow } from '../src/engine/folk';
import { agoWords, renderTemplate, yearsSince } from '../src/engine/format';
import { chooseCase, newGame, seeFaces } from '../src/engine/reducer';
import { getCase } from '../src/engine/registry';
import { evaluate } from '../src/engine/conditions';
import { pickEvent } from '../src/engine/scheduler';
import { metCharacters, newFaces } from '../src/engine/story';
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

/**
 * A reign that met somebody in year one and did something to them.
 *
 * With a fence up, because the two autumns Tam comes back in are about a
 * night of wind taking every post in the valley, and since the user asked for
 * that connection to be real those scenes wait for one to have been raised.
 */
function after(caseId: string, choiceId: string, flag: StoryFlag, turn: number): GameState {
  const s = newGame(11);
  s.buildings.fence = 1;
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
    /* In the consequence slot, which is where somebody coming back about a
       ruling of yours belongs: a year holds one fresh dilemma and one of
       these, and this is the one of these. */
    const fed = after('v1_idle_hand', 'feed_him', 'tam_fed', 5);
    expect(pickEvent(fed, { lawAllowed: false, consequencesOnly: true })).toEqual({
      kind: 'case',
      id: 'r1_tam_fed',
    });
    const cut = after('v1_idle_hand', 'no_work_no_bread', 'tam_cut', 5);
    expect(pickEvent(cut, { lawAllowed: false, consequencesOnly: true })).toEqual({
      kind: 'case',
      id: 'r1_tam_cut',
    });
  });

  it('never pushes a decree back a year, and has a slot of its own to come back in', () => {
    // a law is due and open: the law comes first, and Tam takes the next slot
    const fed = after('v1_idle_hand', 'feed_him', 'tam_fed', 5);
    const first = pickEvent(fed, { lawAllowed: true });
    expect(first?.kind).toBe('proposal');
    /* The wolf and the corner are both eligible in this year. In the
       consequence slot they are not even read, and in the dilemma slot one
       of them may have the year - but Tam is still the last thing that slot
       falls back on, so he is never lost, only ever put off. */
    const second = pickEvent(fed, { lawAllowed: false, consequencesOnly: true });
    expect(second).toEqual({ kind: 'case', id: 'r1_tam_fed' });
    expect(pickEvent(fed, { lawAllowed: false })?.kind).toBe('case');
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

/**
 * The scene about Marta's plot is brought by the man who wants it, so for four
 * versions the register learned about the Mill-Wright and never about her: a
 * reign that took her field moved his opinion of you upward, because the
 * answer was good for the store, and hers not at all. She came into the book
 * eight years later as a stranger with a grievance.
 */
/**
 * The five who come back next, and the clock they come back on.
 *
 * Tam and Marta wait on a plain year of the reign because the scenes they are
 * about happen in the second or third spring of every reign. None of these do:
 * the girl with the pies arrives anywhere between year eleven and year twenty
 * five, so these wait on years since their own first scene instead.
 */
describe('the second wave', () => {
  const WAVE: [string, string, string, number][] = [
    ['d1_pies', 'reward', 'r3_iva_stall', 6],
    ['d1_pies', 'barred', 'r3_iva_basket', 6],
    ['d5_deathbed', 'thank_her', 'r4_healer_kept', 5],
    ['d5_deathbed', 'pays', 'r4_healer_yes', 5],
    ['w_race', 'rides', 'r8_wat_ponies', 5],
  ];

  /** A reign that answered the first scene in year `at`, and is now in `now`. */
  function reign(firstCase: string, choiceId: string, at: number, now: number): GameState {
    const s = newGame(11);
    s.turn = at;
    s.current = { kind: 'case', id: firstCase };
    const after = chooseCase(s, firstCase, choiceId);
    return { ...after, turn: now, current: null, phase: 'case' };
  }

  it('waits the years out from its own first scene, not from the first spring', () => {
    for (const [firstCase, choiceId, back, years] of WAVE) {
      const trigger = getCase(back)!.trigger!;
      // late in a long reign, and the scene it is about happened last year
      const tooSoon = reign(firstCase, choiceId, 20, 20 + years - 1);
      expect(evaluate(trigger, tooSoon), `${back} came back early`).toBe(false);
      const due = reign(firstCase, choiceId, 20, 20 + years);
      expect(evaluate(trigger, due), `${back} never comes back`).toBe(true);
      // and a reign that never met them never hears from them
      const nobody = { ...newGame(11), turn: 30 };
      expect(evaluate(trigger, nobody), `${back} came to a stranger`).toBe(false);
    }
  });

  it('comes back the way you left them, and only that way', () => {
    for (const [firstCase, choiceId, back, years] of WAVE) {
      const due = reign(firstCase, choiceId, 20, 20 + years);
      for (const [, otherChoice, otherBack] of WAVE) {
        if (otherBack === back || otherChoice === choiceId) continue;
        const trigger = getCase(otherBack)!.trigger!;
        if (getCase(otherBack)!.character !== getCase(back)!.character) continue;
        expect(evaluate(trigger, due), `${otherBack} arrived instead of ${back}`).toBe(false);
      }
    }
  });

  it('says what you did, and how old they are, with nothing left over', () => {
    for (const [firstCase, choiceId, back, years] of WAVE) {
      const due = reign(firstCase, choiceId, 20, 20 + years);
      const scene = getCase(back)!.scene.map((p) => renderTemplate(p, due)).join(' ');
      expect(scene, `${back} leaves a template on the screen`).not.toContain('{{');
      expect(scene, `${back} never says when it was`).toContain('years ago');
    }
  });

  it('is keen, never urgent: it takes a slot and never a decree', () => {
    for (const [, , back] of WAVE) {
      const event = getCase(back)!;
      expect(event.priority, `${back} can be crowded out for ever`).toBeLessThanOrEqual(6);
      expect(event.priority, `${back} would push a decree back a year`).toBeGreaterThan(5);
    }
  });
});

describe('the woman the scene was about', () => {
  function afterMill(choiceId: string): GameState {
    const base = newGame(3);
    base.turn = 4;
    base.current = { kind: 'case', id: 'v3_millwright' };
    return chooseCase(base, 'v3_millwright', choiceId);
  }

  /**
   * And the book says when somebody new is in it.
   *
   * The mark on the register is the same idea as the one on the shelf, read
   * the other way round: a shelf nobody has opened is not news, and a book
   * nobody has opened is nothing but news, because everybody in it got there
   * by standing in front of you. Asked for by the user.
   */
  it('carries a mark for a face that was not in it last time it was opened', () => {
    const taken = afterMill('plot_to_the_mill');
    expect(newFaces(taken).sort()).toEqual(['marta', 'millwright']);

    const read = seeFaces(taken);
    expect(newFaces(read), 'the book has been opened').toEqual([]);
    expect(seeFaces(read), 'and nothing changes when nothing is new').toBe(read);

    // and the next person to stand there is the only one that lights it
    const next = { ...read, log: [...read.log, { turn: 9, kind: 'case' as const, refId: 'v1_idle_hand', choiceId: 'feed_him', tags: [] }] };
    expect(newFaces(next)).toEqual(['tam']);
  });

  it('puts her in the register the year it happened, not eight years later', () => {
    const taken = afterMill('plot_to_the_mill');
    const met = metCharacters(taken).map((m) => m.character);
    expect(met).toContain('marta');
    expect(met).toContain('millwright');
    const marta = metCharacters(taken).find((m) => m.character === 'marta')!;
    expect(marta.entries[0].turn).toBe(4);
    expect(marta.entries[0].title).toBe('The Mill-Wright');
  });

  it('knows how old she is from that year on', () => {
    const taken = afterMill('plot_to_the_mill');
    expect(agesNow(taken).get('marta')).toBe(AGES.marta);
    expect(agesNow({ ...taken, turn: taken.turn + 6 }).get('marta')).toBe(AGES.marta + 6);
  });

  it('moves her opinion of you, and not only his', () => {
    const taken = afterMill('plot_to_the_mill');
    expect(bondLevel(taken, 'marta')).toBe(-1);
    expect(bondLevel(taken, 'millwright')).toBe(1);

    const kept = afterMill('marta_keeps');
    expect(bondLevel(kept, 'marta')).toBe(1);
  });

  it('leaves her doing what the ruling left her doing, not what he is doing', () => {
    const taken = afterMill('plot_to_the_mill');
    expect(doingsNow(taken).get('marta')).toBe('resting');
    expect(doingsNow(taken).get('millwright')).toBe('building');
  });
});

describe('Marta, and the ground, years on', () => {
  it('remembers which way the plot went', () => {
    const kept = after('v3_millwright', 'marta_keeps', 'marta_kept', 8);
    expect(pickEvent(kept, { lawAllowed: false, consequencesOnly: true })).toEqual({
      kind: 'case',
      id: 'r2_marta_kept',
    });
    const moved = after('v3_millwright', 'plot_to_the_mill', 'marta_moved', 8);
    expect(pickEvent(moved, { lawAllowed: false, consequencesOnly: true })).toEqual({
      kind: 'case',
      id: 'r2_marta_moved',
    });
  });

  it('says how long she has been waiting', () => {
    const s = after('v3_millwright', 'plot_to_the_mill', 'marta_moved', 8);
    s.current = { kind: 'case', id: 'r2_marta_moved' };
    const scene = getCase('r2_marta_moved')!.scene.map((p) => renderTemplate(p, s)).join(' ');
    expect(scene).toContain('gave her field to the mill seven years ago');
  });

  it('the wheel the place owns leaves her on her ground, and the mill-wright who stays anyway does too', () => {
    const base = newGame(3);
    base.current = { kind: 'case', id: 'v3_millwright' };
    expect(chooseCase(base, 'v3_millwright', 'the_mill_is_ours').flags).toContain('marta_kept');
    expect(chooseCase(base, 'v3_millwright', 'stays_anyway').flags).toContain('marta_kept');
    expect(chooseCase(base, 'v3_millwright', 'plot_to_the_mill').flags).toContain('marta_moved');
  });

  it('there is no free way out at the stream, and taking her last strip costs souls', () => {
    /* The compromise that cost nobody anything is gone. What is left is her
       ground or the mill, and the answers the three laws grant. */
    const mill = getCase('v3_millwright')!;
    expect(mill.choices.map((c) => c.id)).not.toContain('share_the_stream');
    const s = after('v3_millwright', 'plot_to_the_mill', 'marta_moved', 8);
    s.current = { kind: 'case', id: 'r2_marta_moved' };
    const taken = chooseCase(s, 'r2_marta_moved', 'take_it_as_before');
    expect(taken.population).toBeLessThan(s.population);
  });
});
