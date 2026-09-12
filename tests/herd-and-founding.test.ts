import { describe, expect, it } from 'vitest';
import { HERD_HIS, HERD_WALKED } from '../src/content/animals';
import { CASES } from '../src/content/cases';
import { CASE_DOING, CHOICE_DOING, DOING_LINES, STATIONS } from '../src/content/folk';
import { CHARACTERS } from '../src/content/meta';
import { VOICE_OF } from '../src/content/sound';
import { CASE_VERDICTS } from '../src/content/verdict-words';
import { evaluate } from '../src/engine/conditions';
import { doingsNow, foundingLooks, townFolk } from '../src/engine/folk';
import { advance, chooseCase, newGame } from '../src/engine/reducer';
import { reignAt, withCase } from './helpers';
import { herdKeep } from '../src/engine/simulation';
import type { CaseEvent, GameState } from '../src/engine/types';

const goats = CASES.find((c) => c.id === 'w_goats') as CaseEvent;

/** A reign far enough along that somebody could have been up there all summer. */
function years(n: number, souls: number): GameState {
  return withCase(reignAt({ turn: n, population: souls }), 'w_goats');
}

describe('the herd on the common', () => {
  it('waits for a few years and enough people to argue about it, and for no law', () => {
    expect(goats).toBeDefined();
    expect(goats.trigger).not.toBeNull();
    expect(evaluate(goats.trigger!, years(2, 14))).toBe(false);
    expect(evaluate(goats.trigger!, years(6, 9))).toBe(false);
    expect(evaluate(goats.trigger!, years(6, 14))).toBe(true);
  });

  it('is the warm one: not one answer takes anything off anybody', () => {
    // Three that always stand, and every one of them is somebody being given
    // something. A reign of nothing but damage control is a different game.
    const open = goats.choices.filter((c) => !c.id.startsWith('by_the_law'));
    expect(open.map((c) => c.id)).toEqual(['split_them', 'his_herd', 'he_walks_them']);
    for (const choice of open) {
      const gains = Object.values(choice.effects).filter((n) => n > 0);
      expect(gains.length, `${choice.id} gives nobody anything`).toBeGreaterThan(0);
      expect(choice.effects.health, `${choice.id} hurts somebody`).toBeUndefined();
      expect(choice.souls, `${choice.id} costs souls`).toBeUndefined();
    }
  });

  it('puts the work law on the bench when there is one, and takes nothing off it', () => {
    const grammar = CASE_VERDICTS.w_goats;
    const granted = grammar.rulings.filter((r) => r.needsLaw !== undefined);
    expect(granted.map((r) => r.needsLaw)).toEqual(['work_shared', 'work_owned']);
    // a granted word is a grant: it never doubles as a breach of the same law
    for (const ruling of grammar.rulings) expect(ruling.against).toBeUndefined();
  });

  it('pays most on the day and least afterwards, or the other way round', () => {
    const state = years(6, 14);
    const split = chooseCase(state, 'w_goats', 'split_them');
    const walked = chooseCase(state, 'w_goats', 'he_walks_them');

    // sharing it out is the biggest number on the card
    const today = (s: GameState) => s.lastAftermath!.deltas;
    expect(today(split).mood!).toBeGreaterThan(today(walked).mood!);

    // and the only one of the three with nothing standing behind it
    expect(herdKeep(split)).toBeNull();
    expect(herdKeep(walked)).toBe(HERD_WALKED);
    expect(herdKeep(chooseCase(state, 'w_goats', 'his_herd'))).toBe(HERD_HIS);
    expect(herdKeep(chooseCase(state, 'w_goats', 'by_the_law_shared'))).toBe(HERD_WALKED);
    expect(herdKeep(chooseCase(state, 'w_goats', 'by_the_law_owned'))).toBe(HERD_HIS);
    expect(herdKeep(newGame(11))).toBeNull();

    // ten years of the herd kept whole beats the fortnight of goodwill
    const perYear = (keep: typeof HERD_WALKED) =>
      Object.values(keep.every).reduce((sum, n) => sum + n, 0);
    expect(perYear(HERD_WALKED) * 10).toBeGreaterThan(
      Object.values(today(split)).reduce((sum, n) => sum + n, 0),
    );
    // and neither of them is a free lunch: the owned herd costs the goodwill
    expect(HERD_HIS.every.mood!).toBeLessThan(0);
  });

  it('is paid into the ledger every year, under its own name', () => {
    // a year spent on nothing in particular is still a year the goats are out
    const walked = advance(chooseCase(years(6, 14), 'w_goats', 'he_walks_them'));
    expect(walked.turn, 'the year never turned').toBe(7);
    const named = walked.ledger.filter((e) => e.source === HERD_WALKED.label);
    expect(named.length, 'the herd paid nothing anybody can read').toBe(2);
    // and it is booked as a standing thing, not as something that happened
    for (const line of named) {
      expect(line.every, 'the herd is not a one off').toBe(true);
      expect(line.turn).toBe(7);
    }

    // and a reign that never had the scene in it pays nothing at all
    const quiet = advance(years(6, 14));
    expect(quiet.ledger.some((e) => e.source === HERD_WALKED.label)).toBe(false);
  });

  it('leaves somebody up on the common afterwards, being followed', () => {
    expect(CASE_DOING.w_goats).toBe('herding');
    expect(DOING_LINES.herding.length).toBeGreaterThan(10);
    expect(STATIONS.herding.span, 'a herder who does not walk is a statue').toBeGreaterThan(0);
    expect(CHARACTERS.odo).toBeDefined();
    expect(VOICE_OF.odo).toBeDefined();

    const walked = chooseCase(years(6, 14), 'w_goats', 'he_walks_them');
    expect(doingsNow(walked).get('odo')).toBe('herding');
    expect(townFolk(walked).some((pin) => pin.character === 'odo')).toBe(true);
    // and in the winter he is carrying fodder to them instead
    expect(doingsNow(walked, 'winter').get('odo')).toBe('hauling');

    // split between the houses there is no herd to walk, and he has his basket
    expect(CHOICE_DOING['w_goats:split_them']).toBe('foraging');
    const split = chooseCase(years(6, 14), 'w_goats', 'split_them');
    expect(doingsNow(split).get('odo')).toBe('foraging');
  });
});

describe('the five who walked out', () => {
  it('is a different five every reign, and you are the one with the seal', () => {
    const a = foundingLooks(11);
    const b = foundingLooks(4242);
    expect(a.others.length).toBe(4);
    expect(a.you.seal).toBe(true);
    for (const look of a.others) expect(look.seal, 'two seals in one hamlet').toBeUndefined();
    // the same seed is the same five, every time it is asked
    expect(foundingLooks(11)).toEqual(a);
    const shape = (five: typeof a) =>
      JSON.stringify([five.you, ...five.others].map((l) => [l.r, l.y, l.hair, l.prop]));
    expect(shape(a), 'two reigns walked out of the old place wearing one face').not.toBe(shape(b));
  });

  it('gives all five their own head, their own hair and their own hands', () => {
    for (const seed of [1, 7, 11, 99, 4242, 65535]) {
      const { you, others } = foundingLooks(seed);
      const five = [you, ...others];
      expect(new Set(five.map((l) => l.hair)).size, `hair, seed ${seed}`).toBe(5);
      expect(new Set(five.map((l) => `${l.r}:${l.y}`)).size, `heads, seed ${seed}`).toBe(5);
      // the four carry four different things, and you carry the seal
      expect(new Set(others.map((l) => l.prop)).size, `hands, seed ${seed}`).toBe(4);
      expect(you.prop, 'the one holding the seal is not also holding a spade').toBeUndefined();
      for (const look of others) {
        expect(look.cloth, `seed ${seed}: nobody walks out of anywhere rich`).not.toBe('rich');
        expect(DOING_LINES[look.doing], `seed ${seed}`).toBeTruthy();
      }
    }
  });
});
