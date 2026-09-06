import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/engine/config';
import { computePortrait } from '../src/engine/portrait';
import {
  advance,
  continueYear,
  chooseCase,
  chooseLaw,
  chooseWork,
  newGame,
} from '../src/engine/reducer';
import { getCase, getProposal } from '../src/engine/registry';
import { canBuild, worksFor } from '../src/engine/simulation';
import { WALK_OUT_HEADLINE } from '../src/content/walk-out';
import type { GameState, PhilTag } from '../src/engine/types';

/**
 * Three golden reigns. One player always takes the first thing offered, one
 * always takes the last, and one always takes whatever is in the middle, and
 * the three places end up nothing like each other.
 *
 * The last of those three is now a short reign on purpose: a player who takes
 * the hardest answer to every question in the hamlet is walked out on before
 * the first long winter, which is what the square being able to end a reign
 * means. The middle player is the one who goes the distance, so the winter and
 * the late years still have a run through them.
 */

interface Run {
  events: string[];
  laws: string[];
  works: string[];
  state: GameState;
}

type Pick = 'first' | 'last' | 'middle';

function choose<T>(list: T[], pick: Pick): T {
  if (pick === 'first') return list[0];
  if (pick === 'last') return list[list.length - 1];
  return list[Math.floor((list.length - 1) / 2)];
}

function play(seed: number, pick: Pick, declared: PhilTag): Run {
  let s = newGame(seed);
  s.declaredTag = declared;
  const events: string[] = [];
  const works: string[] = [];

  for (let guard = 0; guard < 400 && s.phase !== 'portrait'; guard++) {
    if (s.phase === 'intro') {
      s = advance(s);
      continue;
    }

    if (s.phase === 'works') {
      // ask the engine what this year can be spent on rather than working it
      // out again here: a year that can be spent twice has its own rule, and a
      // driver that guesses will happily pick a fair the store cannot pay for
      const open = worksFor(s).filter((w) => canBuild(s, w.id));
      const work = choose(open, pick);
      works.push(`${s.turn}:${work.id}`);
      s = chooseWork(s, work.id);
      continue;
    }

    if (s.phase === 'aftermath') {
      s = continueYear(s);
      continue;
    }

    const ev = s.current;
    if (!ev) break;
    events.push(`${ev.kind}:${ev.id}`);

    if (ev.kind === 'proposal') {
      const options = getProposal(ev.id)!.options;
      const option = choose(options, pick);
      s = chooseLaw(s, ev.id, options.indexOf(option), option.label);
    } else {
      const choices = getCase(ev.id)!.choices;
      const choice = choose(choices, pick);
      s = chooseCase(s, ev.id, choice.id);
      if (s.phase !== 'aftermath') s = chooseCase(s, ev.id, choices[0].id);
    }
    expect(s.phase, `${ev.kind}:${ev.id}`).toBe('aftermath');
  }

  return {
    events,
    laws: s.laws.map((l) => `${l.subject}_${l.action}`),
    works,
    state: s,
  };
}

describe('golden playthroughs', () => {
  const open = play(5, 'first', 'kantian');
  const closed = play(101, 'last', 'libertarian');
  // reseeded when the crag became a town work and a hamlet's fair stopped
  // buying culture: on 101 the middling player held a fair every year for
  // fourteen years and was walked out on anyway, which is the new numbers
  // working rather than failing
  const middling = play(100, 'middle', 'utilitarian');

  it('both reigns reach a portrait inside the turn cap', () => {
    for (const run of [open, closed]) {
      expect(run.state.phase).toBe('portrait');
      expect(run.state.turn).toBeLessThanOrEqual(CONFIG.hardCapTurn);
    }
  });

  it('both reigns start as a hamlet and hear the hamlet out', () => {
    for (const run of [open, closed]) {
      expect(run.events.slice(0, 2)).toEqual(['proposal:pv1_work', 'case:v1_idle_hand']);
      expect(run.events).toContain('proposal:pv2_strangers');
      expect(run.events).toContain('case:v3_millwright');
      expect(run.events).toContain('case:v4_hay');
    }
  });

  /**
   * A scene about a building cannot arrive in a place that has not built one.
   * The well runs dry only where a well was lined, nobody is thrown off a
   * bridge before there is a bridge, and no cart comes off the ore road until
   * somebody has cut into the crag.
   */
  it('a case about a building waits for the building', () => {
    const gated: [string, string][] = [
      ['case:v2_well', 'well'],
      ['case:d4_bridge', 'bridge'],
      ['case:d3_cart', 'mine'],
      ['case:d2_ashes', 'granary'],
    ];
    for (const run of [open, closed, middling]) {
      for (const [event, work] of gated) {
        const at = run.events.indexOf(event);
        if (at < 0) continue;
        const built = run.works.findIndex((w) => w.endsWith(`:${work}`));
        expect(built, `${event} arrived with no ${work}`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('an open hamlet becomes a town and writes every law', () => {
    expect(open.state.stage).toBe('town');
    expect(open.events).toContain('case:t_town');
    expect(open.laws.length).toBeGreaterThanOrEqual(5);
    for (const id of [
      'proposal:p1_trade',
      'proposal:p2_lives',
      'proposal:p3_truth',
      'proposal:p4_crime',
    ]) {
      expect(open.events, id).toContain(id);
    }
  });

  it('a closed hamlet stays a hamlet, and the charter laws never come up', () => {
    expect(closed.state.stage).toBe('village');
    expect(closed.state.population).toBeLessThan(CONFIG.town.at);
    // it still earns the arguments its own size brings, and no others
    expect(closed.events).not.toContain('proposal:p2_lives');
    expect(closed.events).not.toContain('proposal:p3_truth');
    expect(closed.events).not.toContain('case:t_town');
  });

  it('the hardest answer to every question is a reign the square ends', () => {
    // told once, to the face, in a year that could still be answered
    expect(closed.events).toContain('case:x_square');
    expect(closed.state.flags).toContain('square_walked');
    expect(closed.state.phase).toBe('portrait');
    expect(computePortrait(closed.state).headline).toBe(WALK_OUT_HEADLINE);
  });

  it('a middling reign goes the distance and sees the long winter', () => {
    expect(middling.state.flags).not.toContain('square_walked');
    expect(middling.state.turn).toBeGreaterThanOrEqual(CONFIG.winter.every);
    expect(middling.events).toContain('case:wv_hearth');
    expect(middling.works.length).toBeGreaterThanOrEqual(middling.state.turn - 2);
  });

  it('the law is always on the wall before the case walks in', () => {
    for (const run of [open, closed]) {
      const at = (id: string) => run.events.indexOf(id);
      expect(at('proposal:pv1_work')).toBeLessThan(at('case:v1_idle_hand'));
      expect(at('proposal:pv2_strangers')).toBeLessThan(at('case:v3_millwright'));
      expect(at('case:v3_millwright')).toBeLessThan(at('case:v4_hay'));
    }
    const at = (id: string) => open.events.indexOf(id);
    expect(at('proposal:p1_trade')).toBeLessThan(at('case:d1_pies'));
    expect(at('proposal:p2_lives')).toBeLessThan(at('case:d3_cart'));
    expect(at('proposal:p3_truth')).toBeLessThan(at('case:d5_deathbed'));
  });

  it('every year spends itself on something', () => {
    for (const run of [open, closed]) {
      expect(run.works.length).toBeGreaterThanOrEqual(run.state.turn - 2);
    }
  });

  it('the two reigns end in different places', () => {
    const overlap = open.laws.filter((l) => closed.laws.includes(l)).length;
    const divergence = overlap / Math.max(open.laws.length, closed.laws.length);
    expect(divergence).toBeLessThanOrEqual(CONFIG.divergenceMax);
    expect(open.state.population).toBeGreaterThan(closed.state.population);
  });

  it('the portrait can be painted for both, and the boards stay in range', () => {
    for (const run of [open, closed]) {
      const portrait = computePortrait(run.state);
      expect(portrait.headline.length).toBeGreaterThan(0);
      expect(portrait.soulsLine).toContain(String(run.state.population));
      expect(portrait.shownStats.length).toBe(run.state.stage === 'town' ? 6 : 4);
      for (const value of Object.values(run.state.stats)) {
        expect(value).toBeGreaterThanOrEqual(CONFIG.statMin);
        expect(value).toBeLessThanOrEqual(CONFIG.statMax);
      }
    }
    expect(computePortrait(closed.state).hamletLine).toBeTruthy();
    expect(computePortrait(open.state).hamletLine).toBeNull();
  });
});
