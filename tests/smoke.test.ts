import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/engine/config';
import { monarchOf, traitOf } from '../src/engine/monarch';
import { newGame } from '../src/engine/reducer';
import { availableVerbs, parseVerdict } from '../src/engine/verdict';
import { activeStats, worksFor } from '../src/engine/simulation';
import { MONARCHS } from '../src/content/monarchs';
import type { GameState } from '../src/engine/types';

describe('smoke', () => {
  it('config is sane', () => {
    expect(CONFIG.statMin).toBeLessThan(CONFIG.statMax);
    expect(CONFIG.effectMin).toBeLessThan(CONFIG.effectMax);
    expect(CONFIG.trendMin).toBeLessThan(CONFIG.trendMax);
    for (const value of Object.values(CONFIG.start)) {
      expect(value).toBeGreaterThan(CONFIG.statMin);
      expect(value).toBeLessThan(CONFIG.statMax);
    }
  });

  it('a new game is a hamlet with nothing built and nothing written', () => {
    const s = newGame(42);
    expect(s.turn).toBe(0);
    expect(s.laws).toHaveLength(0);
    expect(s.stage).toBe('village');
    expect(s.townSince).toBeNull();
    // crown, mood, health, store. The watch and the fiddle wait for a town.
    expect(activeStats(s)).toHaveLength(4);
    expect(Object.values(s.buildings).every((n) => n === 0)).toBe(true);
    expect(s.seed).toBe(42);
  });

  it('a hamlet is offered hamlet work, a town is offered town work', () => {
    const s = newGame(1);
    // The first spring is a choice of two and nothing else, resting included:
    // it is the one year with no law and no caller in it. The list proper
    // opens in the second, along with the seal.
    expect(worksFor(s).map((w) => w.id).sort()).toEqual(['house', 'woodcutter']);
    s.turn = 2;
    const village = worksFor(s).map((w) => w.id);
    expect(village).toContain('fields');
    // the granary is the lid on the store, and a hamlet is the place that most
    // needs it lifted, so it is on the list from the first year
    expect(village).toContain('granary');
    expect(village).not.toContain('long_room');
    expect(village).toContain('rest');

    const town: GameState = { ...s, stage: 'town' };
    const townWorks = worksFor(town).map((w) => w.id);
    expect(townWorks).toContain('granary');
    expect(townWorks).not.toContain('fields');
  });

  it('the same seed always crowns the same monarch', () => {
    for (const seed of [1, 5, 77, 101, 9999]) {
      expect(monarchOf(seed).id).toBe(monarchOf(seed).id);
      expect(MONARCHS.map((m) => m.id)).toContain(monarchOf(seed).id);
      expect(traitOf(seed)).toEqual(monarchOf(seed).trait);
    }
  });
});

describe('the bench', () => {
  const withLaw = (action: 'shared' | 'ruled' | 'owned'): GameState => {
    const s = newGame(5);
    s.laws = [
      { subject: 'work', action, label: 'THE WORK, SOMEHOW', turn: 1, status: 'active' },
    ];
    return s;
  };

  it('parses one word into an outcome', () => {
    const s = withLaw('shared');
    expect(parseVerdict('v1_idle_hand', 'eats', null, s)?.choiceId).toBe('feed_him');
    expect(parseVerdict('v1_idle_hand', 'gets_half', null, s)?.choiceId).toBe('half_share');
    expect(parseVerdict('v1_idle_hand', 'share_is_cut', null, s)?.sentence).toBe(
      'TAM HAS HIS SHARE CUT',
    );
  });

  it('gives every law its own word, and only its own', () => {
    const ids = (s: GameState) => availableVerbs('v1_idle_hand', s).map((v) => v.id);

    expect(ids(withLaw('shared'))).toContain('share_is_cut');
    expect(ids(withLaw('shared'))).not.toContain('mends_tools');
    expect(ids(withLaw('ruled'))).toContain('mends_tools');
    expect(ids(withLaw('owned'))).toContain('his_own_field');
    expect(ids(newGame(5))).toHaveLength(3);
  });

  it('badges the law given word with the number of the law', () => {
    const cut = availableVerbs('v1_idle_hand', withLaw('shared')).find(
      (v) => v.id === 'share_is_cut',
    );
    expect(cut?.grantedBy?.law).toBe('work_shared');
    expect(cut?.grantedBy?.index).toBe(1);
  });

  it('refuses a sentence the clerk cannot write down', () => {
    const s = newGame(5);
    expect(parseVerdict('v1_idle_hand', 'share_is_cut', null, s)).toBeNull();
    expect(parseVerdict('v1_idle_hand', null, null, s)).toBeNull();
  });
});
