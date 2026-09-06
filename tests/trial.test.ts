import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/engine/config';
import { chooseCase, newGame } from '../src/engine/reducer';
import { computePortrait } from '../src/engine/portrait';
import { renderTemplate } from '../src/engine/format';
import { getCase } from '../src/engine/registry';
import { truthOf, wrongfulConvictions } from '../src/engine/verdict';
import { monarchOf } from '../src/engine/monarch';
import { TRIAL_LEANS } from '../src/content/trials';
import type { GameState, Verdict } from '../src/engine/types';

const TRIAL = 'tr_accused';

/** A seed on which the person in the dock did, or did not, do it. */
function seedWhere(truth: Verdict): number {
  for (let n = 1; n < 200; n++) if (truthOf(n, TRIAL) === truth) return n;
  throw new Error('no seed');
}

function standing(seed: number): GameState {
  return { ...newGame(seed), turn: 12, current: { kind: 'case', id: TRIAL } };
}

describe('the bench, blind', () => {
  it('gives the same seed the same truth, every run', () => {
    expect(truthOf(42, TRIAL)).toBe(truthOf(42, TRIAL));
    const truths = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((n) => truthOf(n, TRIAL)));
    expect(truths.size, 'every reign convicts the same person').toBe(2);
  });

  it('never writes the truth into the save', () => {
    const s = newGame(42);
    expect(JSON.stringify(s)).not.toContain('guilty');
    expect(JSON.stringify(s)).not.toContain('innocent');
    expect(s.verdicts).toEqual([]);
  });

  it('leans the scene one way, and reads the same length either way', () => {
    const pair = TRIAL_LEANS[TRIAL];
    expect(pair.guilty).not.toBe(pair.innocent);
    // both versions are the same kind of fact, so neither reads as the answer
    const ratio = pair.guilty.length / pair.innocent.length;
    expect(ratio).toBeGreaterThan(0.7);
    expect(ratio).toBeLessThan(1.4);
    for (const text of [pair.guilty, pair.innocent]) {
      expect(text.toLowerCase()).not.toContain('guilty');
      expect(text.toLowerCase()).not.toContain('innocent');
    }
  });

  it('puts the leaning detail into the scene the player reads', () => {
    const scene = getCase(TRIAL)!.scene;
    expect(scene.join(' ')).toContain('{{lean}}');
    const readings = new Set(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((seed) =>
        scene.map((p) => renderTemplate(p, standing(seed))).join(' '),
      ),
    );
    for (const text of readings) expect(text).not.toContain('{{');
    expect(readings.size, 'one reading for the guilty, one for the innocent').toBe(2);
  });

  it('a wrong conviction reads exactly like a right one, on the day', () => {
    // the same throne, so nothing but the truth is different between the two
    let pair: [number, number] | null = null;
    for (let a = 1; a < 200 && !pair; a++) {
      if (truthOf(a, TRIAL) !== 'guilty') continue;
      for (let b = 1; b < 200; b++) {
        if (truthOf(b, TRIAL) !== 'innocent') continue;
        if (monarchOf(a).id !== monarchOf(b).id) continue;
        pair = [a, b];
        break;
      }
    }
    expect(pair, 'no two reigns share a throne and differ on the truth').not.toBeNull();
    const [guiltySeed, innocentSeed] = pair!;

    const right = chooseCase(standing(guiltySeed), TRIAL, 'convict');
    const wrong = chooseCase(standing(innocentSeed), TRIAL, 'convict');
    expect(wrong.lastAftermath?.paragraphs).toEqual(right.lastAftermath?.paragraphs);
    expect(wrong.lastAftermath?.deltas).toEqual(right.lastAftermath?.deltas);
    expect(wrong.stats).toEqual(right.stats);
  });

  it('lets the first wrong conviction of a reign catch up with it', () => {
    const s = chooseCase(standing(seedWhere('innocent')), TRIAL, 'convict');
    expect(s.verdicts).toHaveLength(1);
    expect(s.verdicts[0].ruled).toBe('guilty');
    expect(wrongfulConvictions(s)).toBe(1);
    expect(s.pending.map((p) => p.caseId)).toContain(`${TRIAL}_wrong`);
    expect(s.pending[0].onTurn).toBe(12 + CONFIG.trial.wrongSurfacesIn);
  });

  it('leaves nothing behind when the conviction was right', () => {
    const s = chooseCase(standing(seedWhere('guilty')), TRIAL, 'convict');
    expect(wrongfulConvictions(s)).toBe(0);
    expect(s.pending.map((p) => p.caseId)).not.toContain(`${TRIAL}_wrong`);
  });

  it('sends the guilty one you let walk back down the same path', () => {
    const s = chooseCase(standing(seedWhere('guilty')), TRIAL, 'acquit');
    expect(s.pending.map((p) => p.caseId)).toContain(`${TRIAL}_again`);
  });

  it('records nothing at all when you refuse to say which it was', () => {
    const s = chooseCase(standing(seedWhere('innocent')), TRIAL, 'no_verdict');
    expect(s.verdicts).toHaveLength(0);
    expect(s.pending).toHaveLength(0);
  });

  it('closes the ruling when the truth is finally shown', () => {
    let s = chooseCase(standing(seedWhere('innocent')), TRIAL, 'convict');
    s = { ...s, current: { kind: 'case', id: `${TRIAL}_wrong` } };
    s = chooseCase(s, `${TRIAL}_wrong`, 'read_it_out');
    expect(s.verdicts[0].surfaced).toBe(true);
  });

  it('counts the bench on the portrait, including what was never shown', () => {
    const empty = computePortrait(newGame(3));
    expect(empty.benchLines).toHaveLength(1);

    const wrong = chooseCase(standing(seedWhere('innocent')), TRIAL, 'convict');
    const p = computePortrait(wrong);
    expect(p.benchLines.join(' ')).toContain('1');
    // it has not surfaced in play yet, so the portrait is the first anyone hears
    expect(p.benchLines).toHaveLength(2);
  });
});
