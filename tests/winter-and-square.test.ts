import { describe, expect, it } from 'vitest';
import { advance, chooseCase, newGame } from '../src/engine/reducer';
import { CONFIG } from '../src/engine/config';
import {
  isWinter,
  squareHasHadEnough,
  trendOf,
  walkOutLine,
  winterMouths,
} from '../src/engine/simulation';
import { computePortrait } from '../src/engine/portrait';
import { CASES } from '../src/content/cases';
import { CASE_VERDICTS } from '../src/content/verdict-words';
import type { GameState } from '../src/engine/types';

/** A place standing on year `turn`, with nothing on the table. */
function at(turn: number, population = 40): GameState {
  const s = newGame(7);
  s.turn = turn;
  s.population = population;
  s.current = null;
  // every dilemma already heard, so a probe year is only arithmetic
  s.shownCases = CASES.map((c) => c.id).filter((id) => id !== 'x_square');
  s.lastWorkTurn = turn;
  return s;
}

describe('the long winter, and the store', () => {
  it('nothing grows in a winter year, whatever the standing trends promise', () => {
    const s = at(9, 60);
    s.buildings.fields = 3; // three floors of plough, all of it economy
    const growing = trendOf(s, 'economy');
    expect(growing).toBeGreaterThan(0);

    const frozen = { ...s, turn: 10 };
    expect(isWinter(frozen.turn)).toBe(true);
    expect(trendOf(frozen, 'economy')).toBeLessThanOrEqual(0);
  });

  it('and the mouths take their share, by how many of them there are', () => {
    const small = { ...at(10, 6) };
    const big = { ...at(10, 240) };
    expect(winterMouths(small)).toBe(0);
    expect(winterMouths(big)).toBeGreaterThan(0);
    expect(trendOf(big, 'economy')).toBeLessThan(trendOf(small, 'economy'));
  });

  it('a winter year leaves the store no better off than it started', () => {
    const s = at(9, 80);
    s.buildings.fields = 3;
    s.stats.economy = 60;
    const after = advance(s); // into year 10, the long winter
    expect(isWinter(after.turn)).toBe(true);
    expect(after.stats.economy).toBeLessThan(60);
  });

  it('and a plain year still fills it', () => {
    const s = at(5, 40);
    s.buildings.fields = 3;
    // and it fills only as far as there is somewhere to put it
    s.buildings.granary = 1;
    s.stats.economy = 40;
    const after = advance(s);
    expect(after.stats.economy).toBeGreaterThan(40);
  });
});

describe('the square, and the end of a reign', () => {
  it('the line is not the bottom of the board', () => {
    expect(CONFIG.walkOut.at).toBeGreaterThan(CONFIG.statMin);
    expect(CONFIG.walkOut.at).toBeLessThan(CONFIG.start.mood);
  });

  it('a watch buys patience, down to a floor and no further', () => {
    const bare = at(6, 40);
    bare.boards = [];
    const watched = at(6, 40);
    watched.boards = ['army'];
    watched.stats.army = 60;
    expect(walkOutLine(watched)).toBeLessThan(walkOutLine(bare));

    const fortress = at(6, 40);
    fortress.boards = ['army'];
    fortress.stats.army = CONFIG.statMax;
    expect(walkOutLine(fortress)).toBe(CONFIG.walkOut.floor);
  });

  it('they come and say it once, in a year that can still be answered', () => {
    const s = at(6, 40);
    s.stats.mood = CONFIG.walkOut.at - 2;
    expect(squareHasHadEnough(s)).toBe(true);
    const after = advance(s);
    expect(after.phase).not.toBe('portrait');
    expect(after.current).toEqual({ kind: 'case', id: 'x_square' });
  });

  it('and the year after that, if it reads the same, the reign is over', () => {
    const s = at(6, 40);
    s.stats.mood = CONFIG.walkOut.at - 2;
    s.shownCases = [...s.shownCases, 'x_square'];
    const after = advance(s);
    expect(after.phase).toBe('portrait');
    expect(after.flags).toContain('square_walked');
    expect(computePortrait(after).headline).toContain('stopped bringing you things');
  });

  it('a square that is merely unhappy is not an ending', () => {
    const s = at(6, 40);
    s.stats.mood = CONFIG.walkOut.at + 10;
    s.shownCases = [...s.shownCases, 'x_square'];
    expect(squareHasHadEnough(s)).toBe(false);
    expect(advance(s).phase).not.toBe('portrait');
  });

  it('answering the deputation is a way back off the line', () => {
    const s = at(6, 40);
    s.stats.mood = CONFIG.walkOut.at - 2;
    s.current = { kind: 'case', id: 'x_square' };
    s.phase = 'case';
    const after = chooseCase(s, 'x_square', 'give_the_list');
    expect(after.stats.mood).toBeGreaterThan(s.stats.mood);
    expect(squareHasHadEnough(after)).toBe(false);
  });
});

describe('the brother', () => {
  const brotherCase = (id: string) => CASES.find((c) => c.id === id)!;

  it('waits on no law at all, only on a few years and a few people', () => {
    const ev = brotherCase('w_brother');
    expect(ev.trigger).not.toBeNull();
    expect(JSON.stringify(ev.trigger)).not.toContain('lawActive');
  });

  it('both open doors lead somewhere, and the closed one does not', () => {
    const ev = brotherCase('w_brother');
    const scheduled = ev.choices.map((c) => c.schedule?.caseId ?? null);
    expect(scheduled).toContain('w_brother_fire');
    expect(scheduled).toContain('w_brother_easel');
    expect(ev.choices.find((c) => c.id === 'turn_him_back')!.schedule).toBeUndefined();
  });

  it('turning him back pleases the square and costs the crown, hard', () => {
    const ev = brotherCase('w_brother');
    const away = ev.choices.find((c) => c.id === 'turn_him_back')!;
    expect(away.effects.mood!).toBeGreaterThan(0);
    expect(away.effects.crownSanity!).toBeLessThan(-20);
    const easy = ev.choices.find((c) => c.id === 'let_him_in')!;
    expect(easy.effects.mood!).toBeLessThan(0);
  });

  it('the fire costs the store whatever is done about him afterwards', () => {
    for (const choice of brotherCase('w_brother_fire').choices) {
      expect(choice.effects.economy!).toBeLessThan(0);
    }
  });

  it('the easel puts a person on the town and songs on the board', () => {
    const paint = brotherCase('w_brother_easel').choices.find((c) => c.id === 'let_him_paint')!;
    expect(paint.cityFlagsOn).toContain('easel_in_the_square');
    expect(paint.effects.culture!).toBeGreaterThan(0);
    expect(paint.setFlags).toContain('brother_paints');
  });

  it('every new caller can still be ruled on in words', () => {
    for (const id of ['x_square', 'w_brother', 'w_brother_fire', 'w_brother_easel']) {
      expect(CASE_VERDICTS[id], id).toBeDefined();
    }
  });
});

describe('the idle hand', () => {
  it('cutting a man off in a place of six is felt by the square', () => {
    const tam = CASES.find((c) => c.id === 'v1_idle_hand')!;
    for (const id of ['no_work_no_bread', 'cut_his_share']) {
      const choice = tam.choices.find((c) => c.id === id)!;
      expect(choice.effects.mood, id).toBeLessThan(0);
    }
    // and the kind answers are not punished for being kind
    expect(tam.choices.find((c) => c.id === 'feed_him')!.effects.mood).toBeUndefined();
  });

  /**
   * The answer the law about owning gives is not a third way of saying "he is
   * cut off". It used to be: same flag as "he eats when he digs", four points
   * apart on every board, and nothing on the card to tell them apart. His
   * field is let to the four and he lives on the rent, which is a settlement
   * the place is quietly relieved by, and the square reads it that way.
   */
  it('renting his field out is not the same answer as cutting him off', () => {
    const tam = CASES.find((c) => c.id === 'v1_idle_hand')!;
    const rent = tam.choices.find((c) => c.id === 'his_own_field')!;
    const cut = tam.choices.find((c) => c.id === 'no_work_no_bread')!;
    expect(rent.effects.mood!).toBeGreaterThan(0);
    expect(cut.effects.mood!).toBeLessThan(0);
    // he is still off the common share, and the fence still comes back to him
    expect(rent.setFlags).toContain('tam_cut');
  });
});
