import { describe, expect, it } from 'vitest';
import { evaluate } from '../src/engine/conditions';
import { CONFIG } from '../src/engine/config';
import {
  advance,
  continueYear,
  chooseCase,
  chooseLaw,
  chooseWork,
  newGame,
  reopenLaw,
} from '../src/engine/reducer';
import { traitOf } from '../src/engine/monarch';
import {
  isWinter,
  seasonOf,
  storeCap,
  trendOf,
  workCost,
  worksFor,
} from '../src/engine/simulation';
import { getProposal } from '../src/engine/registry';
import type { GameState } from '../src/engine/types';

/** A state parked on a given year, without going through the UI. */
function at(seed: number, turn = 1): GameState {
  const s = newGame(seed);
  s.turn = turn;
  return s;
}

/** Seal a law without caring about the drafting table. */
function seal(s: GameState, proposalId: string, idx: number): GameState {
  const proposal = getProposal(proposalId)!;
  return chooseLaw(s, proposalId, idx, proposal.options[idx].label);
}

describe('the hamlet', () => {
  it('starts at five souls with three boards, and hides the other three', () => {
    const s = newGame(1);
    expect(s.population).toBe(CONFIG.population.start);
    expect(s.stage).toBe('village');
    expect(s.stats.crownSanity).toBe(CONFIG.start.crownSanity);
    expect(s.stats.mood).toBe(CONFIG.start.mood);
    expect(s.buildings.fields).toBe(0);
    expect(s.ledger).toHaveLength(0);
  });

  it('does not move a board it is too small to have', () => {
    // A hamlet has a mood: five people who resent you resent you to your face.
    // What it does not have is a watch or a fiddle, and those two are banked.
    let s = at(5);
    const moodBefore = s.stats.mood;
    s = chooseCase(s, 't_town', 'square_first'); // mood +10, culture +6, army -4
    expect(s.stats.mood).not.toBe(moodBefore);
    expect(s.pendingTownBonus.culture).toBeDefined();
    expect(s.pendingTownBonus.army).toBeDefined();
    expect(s.ledger.filter((e) => e.stat === 'culture')).toHaveLength(0);
  });

  it('a stat condition on a hidden board is never true', () => {
    const s = at(5);
    s.stats.culture = 0;
    expect(evaluate({ kind: 'stat', stat: 'culture', op: 'lte', value: 0 }, s)).toBe(false);
    expect(evaluate({ kind: 'stage', stage: 'village' }, s)).toBe(true);
    s.stage = 'town';
    expect(evaluate({ kind: 'stat', stat: 'culture', op: 'lte', value: 0 }, s)).toBe(true);
  });
});

describe('what a year leaves standing', () => {
  it('a building is a frame with people at it for the year it is raised', () => {
    let s = at(5);
    s = { ...s, phase: 'works', stats: { ...s.stats, economy: 90 } };
    s = chooseWork(s, 'well');
    // the year it is paid for, the state says what is going up
    expect(s.buildings.well).toBe(1);
    expect(s.lastWork).toBe('well');
    // and the year after, it is simply standing there
    expect(s.lastWorkTurn).toBeLessThan(s.turn);
  });

  it('a year that leaves nothing standing raises nothing', () => {
    let s = at(5);
    s = { ...s, phase: 'works', stats: { ...s.stats, economy: 90 } };
    s = chooseWork(s, 'rest');
    expect(s.lastWork).toBeNull();
  });
});

describe('the ledger', () => {
  it('records what moved a board, and clamps to 0..100', () => {
    // A decree is a standing rule, so the only thing it pays out on the day is
    // the square's reaction to it. The store, the well and the throne it moves
    // every year, in the trend, where a law belongs.
    let s = seal(at(5), 'pv1_work', 0);
    for (const line of s.ledger.filter((e) => !e.every)) {
      expect(line.stat, `${line.source} paid a lump on the day`).toBe('mood');
    }
    expect(s.stats.health).toBe(CONFIG.start.health);

    // a case still pays on the day, and the boards still stop at the ends.
    // The store's end is the lid the granaries lift, not the width of the board.
    s.buildings.granary = 2;
    s.stats.economy = storeCap(s) - 2;
    s = chooseCase(s, 'v2_well', 'sell_the_bucket');
    expect(s.stats.economy).toBe(storeCap(s));
    const line = s.ledger.find((e) => e.stat === 'economy' && !e.every);
    expect(line).toBeDefined();
  });

  it('an exception to your own law costs the place, and says so', () => {
    let s = seal(at(5), 'pv1_work', 0);
    const before = s.stats.crownSanity;
    s = chooseCase(s, 'v1_idle_hand', 'cut_his_share');
    const cost = traitOf(s.seed).exceptionSanityCost ?? CONFIG.exceptionCost;
    expect(s.exceptions).toHaveLength(1);
    // in a hamlet there is no public mood, so the crown takes it
    expect(s.stats.crownSanity).toBe(before - cost);
    expect(s.ledger.some((e) => e.source.includes('bent'))).toBe(true);
  });
});

describe('the years', () => {
  it('a law sets a trend, and a building adds to it', () => {
    // perTurn economy +2, at a hamlet's weight of one. A standing law is the
    // one thing that never stops working, so a year of it carries its own
    // scale on top of the weight; a building is just the building.
    const law = 2 * CONFIG.law.trendScale;
    let s = seal(at(5), 'pv1_work', 0);
    expect(trendOf(s, 'economy')).toBe(law);
    s.buildings.fields = 2; // +2 each, and not scaled
    expect(trendOf(s, 'economy')).toBe(law + 4);
    // the same sentence over a town of five hundred is weather
    s.population = 500;
    expect(trendOf(s, 'economy')).toBe(law * CONFIG.law.maxWeight + 4);
  });

  it('the long winter comes every tenth year and not in between', () => {
    expect(isWinter(10)).toBe(true);
    expect(isWinter(20)).toBe(true);
    expect(isWinter(15)).toBe(false);
    expect(isWinter(1)).toBe(false);
  });

  it('the seasons turn with the phases of a year, and never twice', () => {
    expect(seasonOf('composer', 3)).toBe('spring');
    /* The bench used to be spring as well, which left the wheel between a law
       and the man who came to test it with nowhere to go but all the way round
       to spring again: four seasons of drift and the same season line twice in
       one year, to arrive back where it started. */
    expect(seasonOf('case', 3)).toBe('summer');
    expect(seasonOf('aftermath', 3)).toBe('summer');
    expect(seasonOf('works', 3)).toBe('autumn');
    expect(seasonOf('case', 10)).toBe('winter');
    // and the four of them walk forward round the wheel, never back
    const wheel = ['spring', 'summer', 'autumn', 'winter'];
    const order = (['composer', 'case', 'aftermath', 'works'] as const).map((phase) =>
      wheel.indexOf(seasonOf(phase, 3)),
    );
    for (let i = 1; i < order.length; i++) expect(order[i]).toBeGreaterThanOrEqual(order[i - 1]);
  });

  it('a hamlet that looks after its water fills up, a closed one never does', () => {
    // The high water mark, not the count on the last year of the loop. A long
    // winter takes a fifth of a place in one go, so a run that happens to stop
    // on year 20 is reading the frost rather than the reign.
    const grow = (idx: number, years: number, well = false): number => {
      let s = seal(at(5, 0), 'pv2_strangers', idx);
      if (well) s.buildings.well = 2; // the first thing a year is worth spending on
      let peak = s.population;
      for (let i = 0; i < years; i++) {
        s.current = null;
        s.shownCases = ['v1_idle_hand', 'v2_well', 'v3_millwright', 'v4_hay'];
        s = advance(s);
        s.lastWorkTurn = s.turn;
        peak = Math.max(peak, s.population);
        if (s.phase === 'portrait') break;
      }
      return peak;
    };
    expect(grow(0, 20, true)).toBeGreaterThanOrEqual(CONFIG.town.at); // welcomed, and watered
    expect(grow(0, 20)).toBeLessThan(grow(0, 20, true)); // the same door, no well
    expect(grow(2, 30, true)).toBeLessThan(CONFIG.town.at); // turned away, whatever it builds
  });

  it('the charter reveals the hidden boards and pays what was owed', () => {
    let s = seal(at(5, 6), 'pv2_strangers', 0);
    s.population = CONFIG.town.at - 2;
    s.pendingTownBonus = { army: 10 };
    s.shownCases = ['v1_idle_hand', 'v2_well', 'v3_millwright', 'v4_hay'];
    s = advance(s);
    expect(s.stage).toBe('town');
    expect(s.townSince).toBe(s.turn);
    expect(s.flags).toContain('became_town');
    expect(s.stats.army).toBe(CONFIG.start.army + 10);
    expect(s.current).toEqual({ kind: 'case', id: 't_town' });
  });
});

describe('the year of work', () => {
  it('pays for a building, raises its level, and refuses at the top', () => {
    let s = at(5);
    s.phase = 'works';
    // a hamlet starts well under the cost of its own first field, on purpose
    s.stats.economy = CONFIG.works.costVillage;
    const before = s.stats.economy;
    s = chooseWork(s, 'fields');
    expect(s.buildings.fields).toBe(1);
    expect(s.stats.economy).toBeLessThan(before);
    expect(s.lastWorkTurn).toBeGreaterThan(0);
    expect(s.log.some((l) => l.kind === 'work')).toBe(true);

    const full = at(5);
    full.buildings.well = 2; // the well tops out at two
    expect(chooseWork(full, 'well')).toBe(full);
  });

  it('is half paid by the surplus, and the surplus is what the place learns with', () => {
    const s = at(5);
    // a surplus is only a thing a place with somewhere to put it can have
    s.buildings.granary = 2;
    s.stats.economy = CONFIG.works.freeAbove + 5;
    const half = Math.ceil(CONFIG.works.costVillage / 2);
    const after = chooseWork(s, 'fields');
    expect(after.buildings.fields).toBe(1);
    // half the price, the surplus leaves the store on top of it, and the new
    // field is already earning by the end of the same year
    const earns = worksFor({ ...s, turn: 5 }).find((w) => w.id === 'fields')!.trend.economy ?? 0;
    // the two granaries holding the surplus up are themselves a trend
    const held = (worksFor({ ...s, turn: 5 }).find((w) => w.id === 'granary')!.trend.economy ?? 0) * 2;
    expect(after.stats.economy).toBe(
      CONFIG.works.freeAbove + 5 - half - CONFIG.works.surplusSpend + earns + held,
    );
    // and the surplus went into the pot, which either holds it or has spent it
    expect(after.research + after.techs.length).toBeGreaterThan(0);
  });

  it('every floor after the first costs more than the one under it', () => {
    const s = at(5);
    s.stats.economy = 60; // under freeAbove, so nothing is subsidised
    const fields = worksFor({ ...s, turn: 5 }).find((w) => w.id === 'fields')!;
    const first = workCost(s, fields);
    s.buildings.fields = 1;
    const second = workCost(s, fields);
    s.buildings.fields = 2;
    expect(second).toBeGreaterThan(first);
    expect(workCost(s, fields)).toBeGreaterThan(second);
  });

  it('the pot fills and the next thing gets worked out', () => {
    let s = at(5);
    s.stats.economy = CONFIG.works.freeAbove + 5;
    s.research = 0;
    for (let i = 0; i < 3 && s.techs.length === 0; i++) {
      s.stats.economy = CONFIG.works.freeAbove + 5;
      s.lastWorkTurn = 0;
      s.shownCases = ['v1_idle_hand', 'v2_well', 'v3_millwright', 'v4_hay'];
      s = chooseWork(s, 'rest');
    }
    expect(s.techs[0]).toBe('plough');
    expect(trendOf(s, 'economy')).toBeGreaterThan(0);
  });

  it('a year that already spent its work goes straight on', () => {
    const s = at(5);
    s.lastWorkTurn = s.turn;
    s.shownCases = ['v1_idle_hand', 'v2_well', 'v3_millwright', 'v4_hay'];
    const after = continueYear(s);
    expect(after.turn).toBe(s.turn + 1);
  });
});

describe('reopening a law', () => {
  it('replaces the standing law and charges the crown and the square', () => {
    let s = seal(at(5, 1), 'pv1_work', 0);
    s.stage = 'town';
    s.turn = 6;
    const crownBefore = s.stats.crownSanity;
    s = reopenLaw(s, 'pv1_work');
    expect(s.reopening).toBe('pv1_work');
    expect(s.phase).toBe('composer');
    s = seal(s, 'pv1_work', 2);
    expect(s.reopening).toBeNull();
    expect(s.laws.map((l) => l.status)).toEqual(['replaced', 'active']);
    expect(s.stats.crownSanity).toBeLessThan(crownBefore);
    expect(s.ledger.some((e) => e.source.includes('reopened'))).toBe(true);
  });
});
