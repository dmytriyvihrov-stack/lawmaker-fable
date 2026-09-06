import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/engine/config';
import { traitOf } from '../src/engine/monarch';
import { chooseCase, chooseLaw, newGame } from '../src/engine/reducer';
import { getProposal } from '../src/engine/registry';
import { availableVerbs, breachFor, parseVerdict } from '../src/engine/verdict';
import type { GameState } from '../src/engine/types';

/**
 * The three plain words on a bench were written before any law was, and a law
 * of yours changes what they mean. "Tam eats" is a kindness in a place with no
 * rule about work, a grey answer under one law and a breach under another.
 * These sit a reign down in front of the bench and read the bill back.
 */

function reign(seed = 5): GameState {
  const s = newGame(seed);
  s.turn = 3;
  s.current = { kind: 'case', id: 'v1_idle_hand' };
  return s;
}

function under(s: GameState, proposalId: string, idx: number): GameState {
  const p = getProposal(proposalId)!;
  const sealed = chooseLaw(s, proposalId, idx, p.options[idx].label);
  return { ...sealed, current: { kind: 'case', id: 'v1_idle_hand' }, phase: 'case' };
}

const cost = (s: GameState) => traitOf(s.seed).exceptionSanityCost ?? CONFIG.exceptionCost;

describe('a plain word under a law that came after it', () => {
  it('costs nothing in a place that has written no law about it', () => {
    const s = reign();
    expect(breachFor('v1_idle_hand', 'feed_him', s)).toBeNull();
    const verbs = availableVerbs('v1_idle_hand', s);
    expect(verbs.every((v) => v.against === undefined)).toBe(true);
    const fed = chooseCase(s, 'v1_idle_hand', 'feed_him');
    expect(fed.exceptions).toHaveLength(0);
    expect(fed.lastAftermath?.paragraphs).toHaveLength(1);
  });

  it('is a breach under a law it crosses: written down, paid for, and said', () => {
    // each one's own, and Tam eats out of four other harvests
    const s = under(reign(), 'pv1_work', 2);
    const breach = breachFor('v1_idle_hand', 'feed_him', s);
    expect(breach?.how).toBe('breaks');
    expect(breach?.law).toBe('work_owned');

    const before = s.stats.crownSanity;
    const fed = chooseCase(s, 'v1_idle_hand', 'feed_him');
    expect(fed.exceptions).toHaveLength(1);
    expect(fed.exceptions[0].law).toBe('work_owned');
    expect(fed.exceptions[0].beneficiary).toBe('Tam');
    // the same bill as an answer that carries its own exception
    expect(fed.stats.crownSanity).toBeCloseTo(before - cost(s) + 0, 5);
    // and the place says what it made of it, after the answer's own line
    expect(fed.lastAftermath?.paragraphs).toHaveLength(2);
    expect(fed.lastAftermath?.paragraphs[1]).toContain("each one's own");
  });

  it('is a grey answer under a law it goes round: half the bill, nothing written', () => {
    // shared alike, and Tam gets half a share
    const s = under(reign(), 'pv1_work', 0);
    expect(breachFor('v1_idle_hand', 'half_share', s)?.how).toBe('bends');

    const before = s.stats.crownSanity;
    const half = chooseCase(s, 'v1_idle_hand', 'half_share');
    expect(half.exceptions).toHaveLength(0);
    // the answer itself moves no crown, so the whole move is the grey bill
    expect(before - half.stats.crownSanity).toBeCloseTo(Math.round(cost(s) * CONFIG.bendShare), 5);
    expect(half.ledger.some((e) => e.source.includes('gone round'))).toBe(true);
    expect(half.lastAftermath?.paragraphs).toHaveLength(2);
  });

  it('is read the same way by the bench and by the bill', () => {
    const s = under(reign(), 'pv1_work', 0);
    const verbs = availableVerbs('v1_idle_hand', s);
    const eatsWhenHeDigs = verbs.find((v) => v.id === 'eats_when_he_digs');
    expect(eatsWhenHeDigs?.against?.how).toBe('breaks');
    expect(eatsWhenHeDigs?.against?.index).toBe(1);
    const half = verbs.find((v) => v.id === 'gets_half');
    expect(half?.against?.how).toBe('bends');
    const eats = verbs.find((v) => v.id === 'eats');
    expect(eats?.against).toBeUndefined();

    const parsed = parseVerdict('v1_idle_hand', 'eats_when_he_digs', null, s);
    expect(parsed?.against?.law).toBe('work_shared');
    expect(breachFor('v1_idle_hand', parsed!.choiceId, s)?.law).toBe('work_shared');
  });

  it('never charges an answer that already carries its own exception twice', () => {
    const s = under(reign(), 'pv1_work', 0);
    const before = s.stats.crownSanity;
    const cut = chooseCase(s, 'v1_idle_hand', 'cut_his_share');
    expect(cut.exceptions).toHaveLength(1);
    // the answer itself moves no crown either, so one bill and one only
    expect(before - cut.stats.crownSanity).toBeCloseTo(cost(s), 5);
  });

  it('leaves the rope to the one answer that names it out loud', () => {
    // the coat case under the rope: keeping the coat goes round the law and
    // does not end the reign; only saying the rope is not for a child does
    let s = newGame(9);
    s.turn = 14;
    s.stage = 'town';
    s.population = 120;
    const p = getProposal('p4_crime')!;
    s = chooseLaw(s, 'p4_crime', 2, p.options[2].label);
    s = { ...s, current: { kind: 'case', id: 'c1_lark' }, phase: 'case' };
    expect(breachFor('c1_lark', 'let_him_keep', s)?.how).toBe('bends');
    const kept = chooseCase(s, 'c1_lark', 'let_him_keep');
    expect(kept.flags).not.toContain('own_rope');
    expect(kept.exceptions).toHaveLength(0);
    const spared = chooseCase(s, 'c1_lark', 'spare_the_child');
    expect(spared.flags).toContain('own_rope');
  });

  it('reaches the rope from the toll box too, and tells that ending from that bench', () => {
    // the box is short, everybody agrees who took it, and nobody counts it
    // again: under the crossroads law that is the coat all over again, and the
    // scene that follows is about a ferry and not about a coat
    let s = newGame(9);
    s.turn = 15;
    s.stage = 'town';
    s.population = 120;
    const p = getProposal('p4_crime')!;
    s = chooseLaw(s, 'p4_crime', 2, p.options[2].label);
    s = { ...s, current: { kind: 'case', id: 'c2_toll' }, phase: 'case' };
    expect(breachFor('c2_toll', 'let_it_go', s)?.how).toBe('breaks');
    // the lesser sentence is still only grey
    expect(breachFor('c2_toll', 'pays_the_short', s)?.how).toBe('bends');
    const forgotten = chooseCase(s, 'c2_toll', 'let_it_go');
    expect(forgotten.flags).toContain('own_rope');
    expect(forgotten.exceptions.map((e) => e.beneficiary)).toContain('the Ferrier');
    const told = forgotten.lastAftermath?.paragraphs.join(' ') ?? '';
    expect(told).toContain('Ferrier rows the boat back');
    expect(told).not.toContain('the boy keeps the coat');
    // and the coat still tells its own
    const lark = { ...s, current: { kind: 'case' as const, id: 'c1_lark' } };
    const coat = chooseCase(lark, 'c1_lark', 'spare_the_child');
    expect(coat.lastAftermath?.paragraphs.join(' ')).toContain('the boy keeps the coat');
  });
});
