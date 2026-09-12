import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/engine/config';
import { computePortrait } from '../src/engine/portrait';
import {
  advance,
  continueYear,
  chooseCase,
  chooseLaw,
  buildEarly,
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
  /** The years the store could not pay for one single thing on the shelf. */
  poor: number;
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
  const poor = new Set<number>();

  for (let guard = 0; guard < 400 && s.phase !== 'portrait'; guard++) {
    if (s.phase === 'intro') {
      s = advance(s);
      continue;
    }

    /* Spend the year, wherever in the year we are standing.

       The year stops on the shelf only when there is nothing else in it and
       the store can pay for something (the first spring, and the odd year with
       nobody at the door); every other year runs on past it, and a player who
       wants a building opens the shelf during the year and takes one. So does
       this: the same pick, through `buildEarly` when the year is still running
       and `chooseWork` when the shelf is the year.

       A year the store cannot pay for anything in is spent on nothing at all.
       There used to be a year of rest on the shelf, free and always takeable,
       so there was no such year and every year of every reign here ended with
       something in `works`. It is counted instead of being taken.

       Ask the engine what this year can be spent on rather than working it
       out again here: a year that can be spent twice has its own rule, and a
       driver that guesses will happily pick a fair the store cannot pay for. */
    const spendTheYear = () => {
      if (s.lastWorkTurn === s.turn || s.turn <= 0) return;
      const open = worksFor(s).filter((w) => canBuild(s, w.id));
      if (open.length === 0) {
        poor.add(s.turn);
        return;
      }
      const work = choose(open, pick);
      works.push(`${s.turn}:${work.id}`);
      s = s.phase === 'works' ? chooseWork(s, work.id) : buildEarly(s, work.id);
    };

    if (s.phase === 'works') {
      spendTheYear();
      if (s.phase === 'works') break; // nothing on the shelf and no way forward
      continue;
    }

    if (s.phase === 'aftermath') {
      spendTheYear();
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
    poor: poor.size,
    state: s,
  };
}

describe('golden playthroughs', () => {
  const open = play(5, 'first', 'kantian');
  /* Reseeded when the year of rest left the shelf. This driver takes the LAST
     thing on the list, and the year of rest was the last row in `works.ts`, so
     for as long as it was there the harshest player in the suite answered every
     year by sitting down. With it gone it builds, and on 101 that is a hamlet
     that limps to a portrait instead of one the square walks out of. 102 is the
     same reign as 101 was meant to be: nine years, thirteen souls, the
     deputation to your face and then the empty square. */
  const closed = play(102, 'last', 'libertarian');
  /* Reseeded twice. First when the crag became a town work and a hamlet's
     fair stopped buying culture: on 101 the middling player held a fair every
     year for fourteen years and was walked out on anyway, which is the new
     numbers working rather than failing.
     
     And again when resting left the first year. This driver picks the middle
     of the list, so a shelf of three became a shelf of two and the middle of
     it moved from the woodcutter's cabin to the house: on 100 that one
     substitution is a reign of six years, because a player who never builds
     anything that earns has one early engine and it is the cabin. Nothing
     else moved with it - `best` 34.6 to 34.8 years, `human` 32.4 to 35.7,
     `first` and `last` identical to the digit - so what this seed was showing
     was an index, not a difficulty. */
  const middling = play(121, 'middle', 'utilitarian');

  it('both reigns reach a portrait inside the turn cap', () => {
    for (const run of [open, closed]) {
      expect(run.state.phase).toBe('portrait');
      expect(run.state.turn).toBeLessThanOrEqual(CONFIG.hardCapTurn);
    }
  });

  it('both reigns start as a hamlet and hear the hamlet out', () => {
    for (const run of [open, closed]) {
      /* The glade first, which is the first spring and waits on nothing,
         then the work and the man the work lands on, both in the second. */
      expect(run.events.slice(0, 3)).toEqual([
        'case:w_ring',
        'proposal:pv1_work',
        'case:v1_idle_hand',
      ]);
      expect(run.events).toContain('proposal:pv2_strangers');
      /* Not the mill-wright: his year waits on a field to want, so which
         year he walks in is a fact about what the reign has built. What is
         true of every hamlet that writes a law on strangers is the hay. */
      expect(run.events).toContain('case:v4_hay');
    }
  });

  /**
   * A scene about a building cannot arrive in a place that has not built one.
   * Nobody is thrown off a bridge before there is a bridge, no cart comes off
   * the ore road until somebody has cut into the crag, and nothing burns in a
   * granary that was never raised.
   *
   * The well is not in this list and used to be. The place has a well in the
   * first sentence of the game: the year of work *lines* it, and an unlined
   * well is exactly the one that gives four buckets and then mud. Waiting on
   * the work put the dry week in year fifteen or in no year at all, in 24
   * reigns of 36. The mill is not in it either, because a mill wants mouths
   * as much as it wants broken ground, and its trigger now says so.
   */
  it('a case about a building waits for the building', () => {
    const gated: [string, string][] = [
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

  /* Not "is a town": is chartered. A hamlet that opens its fence grows past a
     hundred and gets three more boards, and a reign long enough can grow past
     three hundred as well and get a crown, which every new game has been
     allowed to do since `kingdom_open` stopped being the dev door's alone.
     This one now does: seed 5 taking the first answer to everything ends at
     326 souls in year 40. What the test is about is the charter. */
  it('an open hamlet becomes a chartered place and writes every law', () => {
    expect(open.state.stage).not.toBe('village');
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
    expect(middling.works.length + middling.poor).toBeGreaterThanOrEqual(middling.state.turn - 2);
  });

  /**
   * Over every chain in the game, in all three reigns, rather than over three
   * hand-picked pairs in one of them.
   *
   * The old version named `d3_cart` and asserted it turned up, which is not
   * the invariant: that case waits on a mine as well as on the law, and
   * whether the golden player ever builds a mine is an accident of what it
   * could afford in a given year. One balance edit and the test failed for a
   * reason that had nothing to do with the order of anything. What is actually
   * true, and is worth holding, is the conditional: no case of a chain may
   * walk in before the law of that chain is on the wall.
   */
  it('the law is always on the wall before the case walks in', () => {
    const chains: [string, string[]][] = [
      ['pv1_work', ['v1_idle_hand', 'v2_well']],
      ['pv2_strangers', ['v3_millwright', 'v4_hay']],
      ['pv3_dead', ['v5_winter_ground', 'v6_road_dead']],
      ['pv4_mushrooms', ['v7_beeches', 'v8_long_night']],
      ['p1_trade', ['d1_pies', 'd2_ashes']],
      ['p2_lives', ['d3_cart', 'd4_bridge']],
      ['p3_truth', ['d5_deathbed', 'd6_door']],
      ['p4_crime', ['c1_lark', 'c2_toll']],
      ['p5_song', ['s1_worms', 's2_ballad']],
    ];
    let seen = 0;
    for (const run of [open, closed, middling]) {
      const at = (id: string) => run.events.indexOf(id);
      for (const [law, cases] of chains) {
        for (const id of cases) {
          const walked = at(`case:${id}`);
          if (walked < 0) continue;
          seen += 1;
          const sealed = at(`proposal:${law}`);
          expect(sealed, `${id} walked in with no ${law} on the wall`).toBeGreaterThanOrEqual(0);
          expect(sealed, `${id} walked in before ${law}`).toBeLessThan(walked);
        }
      }
    }
    // and the three reigns between them do actually reach a fair few of them
    expect(seen, 'no chain case walked in at all').toBeGreaterThan(12);
    /* The mill-wright used to be asserted as arriving before the hay, and he
       no longer does: his year waits on a field, and the hay does not, so the
       order between them is now whatever the reign built and when. What is
       still true is that he arrives at all somewhere in the three. */
    expect(
      [open, closed, middling].some((run) => run.events.includes('case:v3_millwright')),
      'the mill-wright never walked in at all',
    ).toBe(true);
  });

  it('every year the store can pay for something spends itself on it', () => {
    for (const run of [open, closed]) {
      expect(run.works.length + run.poor).toBeGreaterThanOrEqual(run.state.turn - 2);
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
      /* Six boards for anywhere that has been chartered, three of which a
         hamlet does not have and a kingdom keeps. */
      expect(portrait.shownStats.length).toBe(run.state.stage === 'village' ? 4 : 6);
      for (const value of Object.values(run.state.stats)) {
        expect(value).toBeGreaterThanOrEqual(CONFIG.statMin);
        expect(value).toBeLessThanOrEqual(CONFIG.statMax);
      }
    }
    expect(computePortrait(closed.state).hamletLine).toBeTruthy();
    expect(computePortrait(open.state).hamletLine).toBeNull();
  });
});
