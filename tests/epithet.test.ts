import { describe, expect, it } from 'vitest';
import { EPITHETS } from '../src/content/epithets';
import { MONARCHS } from '../src/content/monarchs';
import { epithetOf } from '../src/engine/epithet';
import { monarchAge, monarchOf } from '../src/engine/monarch';
import { nameTown, newGame } from '../src/engine/reducer';
import { CONFIG } from '../src/engine/config';
import { TECHS } from '../src/content/techs';
import { growthLadder, nextRung, yearsToRung } from '../src/engine/growth';
import type { GameState } from '../src/engine/types';

function reign(): GameState {
  return newGame(7);
}

describe('the name the place gives you', () => {
  it('is not handed out at the start', () => {
    expect(epithetOf(reign())).toBeNull();
  });

  it('is earned by bending your own law more than once', () => {
    const s = reign();
    s.exceptions = [
      { law: 'work_shared', beneficiary: 'the miller', turn: 2 },
      { law: 'work_shared', beneficiary: 'Iva', turn: 4 },
    ];
    expect(epithetOf(s)?.id).toBe('open_hand');
  });

  it('one bent law is not a reputation', () => {
    const s = reign();
    s.exceptions = [{ law: 'work_shared', beneficiary: 'Iva', turn: 4 }];
    expect(epithetOf(s)).toBeNull();
  });

  it('is earned by three laws that were never opened for anybody', () => {
    const s = reign();
    s.laws = [1, 2, 3].map((turn) => ({
      subject: 'work' as const,
      action: 'shared' as const,
      label: 'THE WORK OF THIS PLACE IS SHARED',
      turn,
      status: 'active' as const,
    }));
    expect(epithetOf(s)?.id).toBe('unbending');
  });

  it('bending one of them takes it away again', () => {
    const s = reign();
    s.laws = [1, 2, 3].map((turn) => ({
      subject: 'work' as const,
      action: 'shared' as const,
      label: 'THE WORK OF THIS PLACE IS SHARED',
      turn,
      status: 'active' as const,
    }));
    s.exceptions = [{ law: 'work_shared', beneficiary: 'Iva', turn: 4 }];
    expect(epithetOf(s)).toBeNull();
  });

  it('is earned by two years spent on things that stand', () => {
    const s = reign();
    s.buildings.well = 1;
    s.buildings.fields = 1;
    expect(epithetOf(s)?.id).toBe('builder');
  });

  it('a year of rest builds nothing and is named for nothing', () => {
    const s = reign();
    s.buildings.rest = 4;
    expect(epithetOf(s)).toBeNull();
  });

  it('every epithet in content is reachable and described', () => {
    for (const e of EPITHETS) {
      expect(e.name.length, e.id).toBeGreaterThan(0);
      expect(e.line.length, e.id).toBeGreaterThan(0);
      expect(e.aside.length, e.id).toBeGreaterThan(0);
    }
    expect(new Set(EPITHETS.map((e) => e.id)).size).toBe(EPITHETS.length);
  });
});

describe('the monarch upstairs', () => {
  it('starts young and gains a year for every year of the reign', () => {
    const start = monarchOf(7).age;
    expect(start).toBeLessThan(30);
    expect(monarchAge(7, 0)).toBe(start);
    expect(monarchAge(7, 1)).toBe(start);
    expect(monarchAge(7, 12)).toBe(start + 11);
  });

  it('carries no epithet in the name, so the reign can earn one', () => {
    for (const m of MONARCHS) {
      expect(m.name, m.id).not.toMatch(/\bthe\b/i);
      expect(m.age, m.id).toBeGreaterThan(0);
    }
  });
});

describe('naming the place', () => {
  it('starts with no name at all', () => {
    expect(reign().townName).toBeNull();
    expect(CONFIG.townName.fromYear).toBeGreaterThan(0);
  });

  it('takes the two words it is given and moves nothing else', () => {
    const before = reign();
    const after = nameTown(before, 'Crooked Ditch');
    expect(after.townName).toBe('Crooked Ditch');
    expect(before.townName).toBeNull();
    expect(after.stats).toEqual(before.stats);
    expect(after.turn).toBe(before.turn);
  });
});

describe('the ladder the place climbs by filling up', () => {
  it('is built out of the rules, so it can never drift from them', () => {
    const s = reign();
    const ladder = growthLadder(s);
    const counts = ladder.map((step) => step.at);

    // sorted, and every count appears exactly once
    expect([...counts].sort((a, b) => a - b)).toEqual(counts);
    expect(new Set(counts).size).toBe(counts.length);

    // the three the config owns are on it, and the rumour of the cog is not:
    // nothing opens at `hintFrom`, so it is not a rung (T-LADDER-1)
    for (const at of [CONFIG.research.openAt, CONFIG.town.at, CONFIG.kingdom.at]) {
      expect(counts, String(at)).toContain(at);
    }
    expect(counts).not.toContain(CONFIG.research.hintFrom);
    // and every rung carries the short word the bar draws under its tick
    for (const step of ladder) expect(step.short.length, String(step.at)).toBeGreaterThan(0);

    // and so is every crowd a thing on the tree is waiting for
    for (const tech of TECHS) {
      if (tech.needsSouls === undefined) continue;
      expect(counts, tech.id).toContain(tech.needsSouls);
    }
  });

  it('offers the two boards one at a time, and the first one is a choice', () => {
    const ladder = growthLadder(reign());
    const withBoards = ladder.filter((step) => step.boards.length > 0);
    expect(withBoards.map((s) => s.at)).toEqual([CONFIG.boards.firstAt, CONFIG.boards.secondAt]);
    expect(withBoards[0].choose, 'the first rung is an either/or').toBe(true);
    expect([...withBoards[0].boards].sort()).toEqual(['army', 'culture']);
    expect(CONFIG.boards.firstAt).toBeLessThan(CONFIG.boards.secondAt);
    expect(CONFIG.boards.secondAt).toBeLessThan(CONFIG.town.at);
  });

  it('and the second rung shows only what is actually left to pick', () => {
    const s = reign();
    s.boards = ['army'];
    const second = growthLadder(s).find((step) => step.at === CONFIG.boards.secondAt)!;
    expect(second.boards).toEqual(['culture']);
  });

  it('marks what the place has passed and what it is walking towards', () => {
    const s = reign();
    s.population = CONFIG.town.at - 1;
    const ladder = growthLadder(s);
    expect(ladder.filter((step) => step.reached).every((step) => step.at <= s.population)).toBe(
      true,
    );
    const next = nextRung(s);
    expect(next?.at).toBe(CONFIG.town.at);
  });

  it('runs out of rungs once the place is bigger than the fable', () => {
    const s = reign();
    s.population = 10_000;
    expect(nextRung(s)).toBeNull();
    expect(growthLadder(s).every((step) => step.reached)).toBe(true);
  });

  it('a place that is not growing has no answer for how long it will take', () => {
    const s = reign();
    s.population = 20;
    s.stats.health = 0;
    s.stats.mood = 0;
    const next = nextRung(s)!;
    expect(next).toBeDefined();
    expect(yearsToRung(s, next)).toBeNull();
  });
});
