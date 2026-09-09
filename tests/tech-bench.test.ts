import { describe, expect, it } from 'vitest';
import { PATHS, SPHERES, TECHS } from '../src/minigames/tech/content';
import type { TechId } from '../src/minigames/tech/content';
import {
  BENCH,
  advanceYear,
  isOpen,
  mindsOf,
  newTechState,
  openTechs,
  pathTechs,
  roomOf,
  setFocus,
  shelterOf,
  spherePaths,
  techOf,
  tierOf,
} from '../src/minigames/tech/model';
import type { TechState } from '../src/minigames/tech/model';

/**
 * The tree as a choice, on the bench: the content is a legal tree, and the
 * years do what the rules at the foot of the screen say they do.
 */

const RAW = import.meta.glob('../src/minigames/tech/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** Play years, always working out the cheapest thing that is open. */
function greedy(s: TechState, years: number): TechState {
  for (let i = 0; i < years; i++) {
    if (s.focus === null) {
      const open = openTechs(s).sort((a, b) => a.cost - b.cost);
      if (open.length > 0) s = setFocus(s, open[0].id);
    }
    s = advanceYear(s);
  }
  return s;
}

/** Play years with a fixed order of things to work out, then the cheapest. */
function along(s: TechState, order: TechId[], years: number): TechState {
  for (let i = 0; i < years; i++) {
    if (s.focus === null) {
      const next = order.find((id) => isOpen(s, id));
      if (next) s = setFocus(s, next);
      else {
        const open = openTechs(s).sort((a, b) => a.cost - b.cost);
        if (open.length > 0) s = setFocus(s, open[0].id);
      }
    }
    s = advanceYear(s);
  }
  return s;
}

/** Years with no long winter in them: the count only ever grows. */
function quietYears(s: TechState, years: number): TechState {
  for (let i = 0; i < years; i++) {
    s = advanceYear(s);
    if ((s.year + 1) % BENCH.winter.every === 0) s = { ...s, year: s.year + 1 };
  }
  return s;
}

describe('the tree as a choice: the content', () => {
  it('every sphere has one to three paths, and every path two to four steps', () => {
    expect(SPHERES.length).toBe(3);
    for (const sphere of SPHERES) {
      const paths = spherePaths(sphere.id);
      expect(paths.length, sphere.id).toBeGreaterThanOrEqual(1);
      expect(paths.length, sphere.id).toBeLessThanOrEqual(3);
      for (const path of paths) {
        const chain = pathTechs(path.id);
        expect(chain.length, path.id).toBeGreaterThanOrEqual(2);
        expect(chain.length, path.id).toBeLessThanOrEqual(4);
      }
    }
    for (const path of PATHS) {
      expect(SPHERES.map((s) => s.id), `${path.id} hangs off no sphere`).toContain(path.sphere);
    }
  });

  it('every name is used once, and every step knows its place in the chain', () => {
    expect(new Set(TECHS.map((t) => t.id)).size).toBe(TECHS.length);
    expect(new Set(PATHS.map((p) => p.id)).size).toBe(PATHS.length);
    expect(new Set(SPHERES.map((s) => s.id)).size).toBe(SPHERES.length);
    for (const tech of TECHS) {
      expect(PATHS.map((p) => p.id), `${tech.id} walks no path`).toContain(tech.path);
      expect(tierOf(tech.id)).toBeGreaterThanOrEqual(0);
    }
    // a later step costs more than the one before it, on every path
    for (const path of PATHS) {
      const chain = pathTechs(path.id);
      for (let i = 1; i < chain.length; i++) {
        expect(chain[i].cost, `${chain[i].id} is cheaper than ${chain[i - 1].id}`).toBeGreaterThan(
          chain[i - 1].cost,
        );
      }
    }
  });

  it('every step costs something and does something', () => {
    for (const tech of TECHS) {
      expect(tech.cost, tech.id).toBeGreaterThan(0);
      const doing = Object.values(tech.effect).filter((v) => v !== undefined && v !== 0);
      expect(doing.length, `${tech.id} does nothing`).toBeGreaterThan(0);
      expect(tech.name.length, tech.id).toBeGreaterThan(0);
      expect(tech.line.length, tech.id).toBeGreaterThan(0);
    }
  });

  it('the forbidden words and long dashes appear nowhere on the bench', () => {
    expect(Object.keys(RAW).length).toBeGreaterThan(0);
    for (const [name, text] of Object.entries(RAW)) {
      expect(/justice|sandel/i.test(text), name).toBe(false);
      expect(/[–—]/.test(text), name).toBe(false);
    }
  });
});

describe('the tree as a choice: the years', () => {
  it('the count grows on its own, and never past the room', () => {
    let s = newTechState();
    expect(s.souls).toBe(BENCH.start);
    s = quietYears(s, 8);
    expect(s.souls).toBeGreaterThan(BENCH.start);
    s = quietYears(s, 200);
    expect(s.souls).toBeLessThanOrEqual(roomOf(s));
    expect(s.souls).toBeGreaterThan(roomOf(s) - 2);
  });

  it('a hamlet becomes a town with nothing worked out, and never a kingdom', () => {
    let s = newTechState();
    s = quietYears(s, 120);
    expect(s.known).toEqual([]);
    expect(s.stage).toBe('town');
    expect(roomOf(s)).toBeLessThan(BENCH.kingdom);
  });

  it('the first step of every path is open on day one and the second is not', () => {
    const s = newTechState();
    for (const path of PATHS) {
      const chain = pathTechs(path.id);
      expect(isOpen(s, chain[0].id), chain[0].id).toBe(true);
      expect(isOpen(s, chain[1].id), chain[1].id).toBe(false);
    }
    expect(openTechs(s).length).toBe(PATHS.length);
  });

  it('a focus fills, lands in a spring, and the next step on its path takes over', () => {
    let s = setFocus(newTechState(), 'plough');
    expect(s.focus).toBe('plough');
    expect(s.known).toEqual([]);
    let springs = 0;
    while (!s.known.includes('plough') && springs < 30) {
      s = advanceYear(s);
      springs += 1;
    }
    expect(s.known).toEqual(['plough']);
    expect(s.learnedIn.plough).toBe(s.year);
    expect(s.focus).toBe('three_fields');
    expect(s.log.some((l) => l.kind === 'learned' && l.tech === 'plough')).toBe(true);
    // and what it did: the room is bigger by what the card says
    expect(roomOf(s)).toBe(BENCH.room + (techOf('plough').effect.room ?? 0));
    // a first thing lands in the first few years, not the first few decades
    expect(springs).toBeLessThanOrEqual(6);
  });

  it('a thing that is not open cannot be picked, and the pick itself lands nothing', () => {
    const s = newTechState();
    expect(setFocus(s, 'mill')).toBe(s);
    const picked = setFocus({ ...s, pot: 100 }, 'plough');
    expect(picked.known).toEqual([]);
    expect(advanceYear(picked).known).toEqual(['plough']);
  });

  it('the pot waits for a focus and pours into it', () => {
    let s = newTechState();
    s = advanceYear(advanceYear(s));
    expect(s.pot).toBe(mindsOf(newTechState()) + mindsOf(advanceYear(newTechState())));
    const before = s.pot;
    s = advanceYear(setFocus(s, 'fair_day'));
    expect(s.pot).toBeLessThan(before);
    expect((s.progress.fair_day ?? 0) > 0 || s.known.includes('fair_day')).toBe(true);
  });

  it('progress is kept when the focus moves', () => {
    let s = setFocus(newTechState(), 'scribes' as TechId);
    expect(s.focus).toBeNull();
    s = advanceYear(setFocus(s, 'quarantine' as TechId));
    expect(s.focus).toBeNull();
    s = advanceYear(setFocus(newTechState(), 'mill' as TechId));
    expect(s.known).toEqual([]);
    s = advanceYear(setFocus(newTechState(), 'letters'));
    const had = s.progress.letters ?? 0;
    expect(had).toBeGreaterThan(0);
    s = advanceYear(setFocus(s, 'ballads'));
    expect(s.progress.letters).toBe(had);
    expect(s.progress.ballads ?? 0).toBeGreaterThan(0);
  });

  it('points a year rise with the count, and bend past a hundred', () => {
    const at = (souls: number) => mindsOf({ ...newTechState(), souls });
    expect(at(5)).toBe(BENCH.minds.base);
    expect(at(30)).toBeGreaterThan(at(5));
    expect(at(100)).toBeGreaterThan(at(30));
    expect(at(300)).toBeGreaterThan(at(100));
    expect(at(200) - at(100)).toBeLessThan(at(100) - at(0));
  });

  it('the long winter takes a share, and shelter keeps it', () => {
    const cold = { ...newTechState(), year: BENCH.winter.every - 1, souls: 100 };
    const bare = advanceYear(cold);
    expect(bare.souls).toBe(100 - Math.round(100 * (BENCH.winter.loss / 100)));
    expect(bare.log.some((l) => l.kind === 'winter' && l.lost > 0)).toBe(true);

    const everyShelter = TECHS.filter((t) => t.effect.shelter).map((t) => t.id);
    const kept = advanceYear({ ...cold, known: everyShelter });
    expect(shelterOf(kept)).toBeGreaterThanOrEqual(BENCH.winter.loss);
    expect(kept.souls).toBe(100);
    expect(kept.log.some((l) => l.kind === 'winter' && l.lost === 0)).toBe(true);
  });

  it('forty years of the cheapest focus leaves something unlearned', () => {
    const s = greedy(newTechState(), 40);
    expect(s.known.length).toBeGreaterThan(5);
    expect(s.known.length).toBeLessThan(TECHS.length);
  });

  it('a place that works out the ground wears a crown, eventually', () => {
    const ground: TechId[] = ['plough', 'three_fields', 'mill', 'chimney', 'slate', 'dairy', 'drain'];
    // the herd and the water have to be opened first for their second steps
    const order: TechId[] = ['plough', 'three_fields', 'mill', 'chimney', 'slate', 'fold', 'dairy', 'cistern', 'drain'];
    const s = along(newTechState(), order, 90);
    for (const id of ground) expect(s.known, id).toContain(id);
    expect(roomOf(s)).toBeGreaterThanOrEqual(BENCH.kingdom);
    expect(s.stage).toBe('kingdom');
  });

  it('the log keeps the last few lines only, newest last', () => {
    const s = greedy(newTechState(), 80);
    expect(s.log.length).toBeLessThanOrEqual(BENCH.logKeep);
    for (let i = 1; i < s.log.length; i++) {
      expect(s.log[i].year).toBeGreaterThanOrEqual(s.log[i - 1].year);
    }
  });
});
