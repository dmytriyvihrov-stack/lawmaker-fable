import { describe, expect, it } from 'vitest';
import { MOMENTS, MOMENT_SOURCE } from '../src/content/moments';
import { CASE_SPOTS } from '../src/content/meta';
import { CASES } from '../src/content/cases';
import { MOMENTS_PER_YEAR, getMoment, momentTaken, momentsNow, momentsOfYear } from '../src/engine/moments';
import { chooseWork, takeMoment } from '../src/engine/reducer';
import type { GameState, Season } from '../src/engine/types';
import { reignAt } from './helpers';

const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];

function reign(turn = 4): GameState {
  return reignAt({ turn, population: 14 });
}

describe('the small things', () => {
  it('is five, all of them kind, none of them a decision', () => {
    expect(MOMENTS.length).toBe(5);
    expect(new Set(MOMENTS.map((m) => m.id)).size).toBe(5);
    // four gestures over five things: the fifth is a winter one, and the hand
    // that stacks a woodpile is the hand that picks a basket up
    expect(new Set(MOMENTS.map((m) => m.hand)).size, 'two of them feel the same').toBe(4);
    for (const moment of MOMENTS) {
      // no moment may ever be bad: this is the one corner with no cost in it
      const moves = Object.values(moment.effect);
      expect(moves.length, `${moment.id} does nothing`).toBeGreaterThan(0);
      for (const n of moves) expect(n, `${moment.id} takes something`).toBeGreaterThan(0);
      // and none of them is worth playing for
      expect(Math.max(...moves), `${moment.id} is a lever`).toBeLessThanOrEqual(1);
      expect(moment.line.length, `${moment.id} says nothing`).toBeGreaterThan(40);
      /* And the mark left over the spot afterwards is a verb and a number,
         so the verb has to be a verb: one or two words, past tense, not the
         sentence again. */
      const words = moment.done.trim().split(/\s+/);
      expect(words.length, `${moment.id} is a sentence, not a verb`).toBeLessThanOrEqual(2);
      expect(words[0].length, `${moment.id} did nothing`).toBeGreaterThan(2);
      // one board, because the mark says one board
      expect(moves.length, `${moment.id} moves more than one board`).toBe(1);
      // a short word, so the pointer says what it is and gets out of the way
      expect(moment.label.length, `${moment.id} has no name`).toBeGreaterThan(4);
      expect(moment.label.length, `${moment.id} is a sentence, not a name`).toBeLessThan(16);
    }
  });

  it('stands where a card cannot float over it, and off every case marker', () => {
    for (const moment of MOMENTS) {
      // The card floats over the middle of the near meadow, so anything past
      // about 470 has to be well out to one side of it to be seen at all.
      const clearOfTheCard = moment.y < 470 || moment.x < 330 || moment.x > 1120;
      expect(clearOfTheCard, `${moment.id} is behind the card`).toBe(true);
      expect(moment.y, `${moment.id} is off the bottom`).toBeLessThan(700);
      expect(moment.y, `${moment.id} is in the sky`).toBeGreaterThan(200);
      expect(moment.x, `${moment.id} is off the side`).toBeGreaterThan(20);
      expect(moment.x, `${moment.id} is off the side`).toBeLessThan(1420);
      for (const [caseId, spot] of Object.entries(CASE_SPOTS)) {
        const apart = Math.hypot(spot.x - moment.x, spot.y - moment.y);
        expect(apart, `${moment.id} sits on the ${caseId} marker`).toBeGreaterThan(40);
      }
    }
    // and no two of them share a corner of the map either
    for (let i = 0; i < MOMENTS.length; i++) {
      for (let k = i + 1; k < MOMENTS.length; k++) {
        const apart = Math.hypot(MOMENTS[i].x - MOMENTS[k].x, MOMENTS[i].y - MOMENTS[k].y);
        expect(apart, `${MOMENTS[i].id} and ${MOMENTS[k].id}`).toBeGreaterThan(120);
      }
    }
  });

  it('deals one a year, the same one every time that year is asked', () => {
    for (const season of SEASONS) {
      const s = reign();
      const dealt = momentsOfYear(s, season);
      expect(dealt.length, season).toBe(MOMENTS_PER_YEAR);
      expect(momentsOfYear(s, season).map((m) => m.id)).toEqual(dealt.map((m) => m.id));
      // nothing out of season: no fishing through a lid of ice
      for (const moment of dealt) {
        if (moment.seasons) expect(moment.seasons, `${moment.id} in ${season}`).toContain(season);
      }
    }
  });

  it('waits for the thing it is about to exist', () => {
    // there is no dog in this valley until the wolf's litter is under the
    // granary steps, so the one small thing that is a dog waits for the flag
    const dog = MOMENTS.find((m) => m.id === 'dog')!;
    expect(dog.needsFlag).toBe('dogs_kept');
    for (const season of SEASONS) {
      expect(momentsOfYear(reign(), season).map((m) => m.id)).not.toContain('dog');
    }
    // and with it, over the years, the dog turns up like everything else
    const withDogs = () => {
      const s = reign();
      s.flags = [...s.flags, 'dogs_kept'];
      return s;
    };
    const dealt = new Set<string>();
    for (let turn = 3; turn < 24; turn++) {
      const s = withDogs();
      s.turn = turn;
      for (const id of momentsOfYear(s, 'summer').map((m) => m.id)) dealt.add(id);
    }
    expect(dealt.has('dog'), 'the dog never comes round').toBe(true);
  });

  it('has one for the half of the year the rest of them cannot happen in', () => {
    // apples on frozen ground was the one nobody believed
    for (const id of ['spill', 'bite', 'kid']) {
      expect(MOMENTS.find((m) => m.id === id)!.seasons, id).not.toContain('winter');
    }
    const winter = MOMENTS.filter((m) => m.seasons?.includes('winter'));
    expect(winter.length, 'nothing at all happens in the frost').toBeGreaterThan(0);
    for (const m of winter) expect(m.needsFlag, `${m.id} is gated as well`).toBeUndefined();
  });

  it('is not the same one every year', () => {
    const years = new Set(
      [3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((turn) =>
        momentsOfYear(reign(turn), 'summer')
          .map((m) => m.id)
          .sort()
          .join(','),
      ),
    );
    expect(years.size, 'every year deals the same hand').toBeGreaterThan(1);
  });

  it('costs the year nothing at all', () => {
    const before = reign();
    const id = momentsNow(before, 'summer')[0].id;
    const after = takeMoment(before, id);

    // the only thing that moved is the board the moment names, and the ledger
    expect(after.turn).toBe(before.turn);
    expect(after.phase).toBe(before.phase);
    expect(after.current).toEqual(before.current);
    expect(after.pending).toEqual(before.pending);
    expect(after.eventsThisYear).toBe(before.eventsThisYear);
    expect(after.log.length, 'a scratched dog is not a ruling').toBe(before.log.length);

    const moved = getMoment(id)!.effect;
    for (const [stat, by] of Object.entries(moved)) {
      expect(after.stats[stat as keyof typeof after.stats]).toBeGreaterThan(
        before.stats[stat as keyof typeof before.stats] - by,
      );
    }
  });

  it('can be done once, and comes round again next year', () => {
    const s = reign();
    const id = momentsNow(s, 'summer')[0].id;
    const once = takeMoment(s, id);
    expect(momentTaken(once, id)).toBe(true);
    expect(momentsNow(once, 'summer').map((m) => m.id)).not.toContain(id);

    // and doing it again this year is not doing it again
    const twice = takeMoment(once, id);
    expect(twice).toBe(once);
    expect(once.ledger.filter((l) => l.source === `${MOMENT_SOURCE}: ${id}`).length).toBe(1);

    // the year turns and the map has things on it again
    const next = chooseWork(once, 'rest');
    expect(next.turn).toBe(s.turn + 1);
    expect(momentsNow(next, 'summer').length).toBe(MOMENTS_PER_YEAR);
  });
});

describe('everything that can happen has somewhere to happen', () => {
  it('gives every case a spot on the map', () => {
    // A case with no spot opens a card with no thread running up to anything,
    // which is how w_goats shipped in V50.
    for (const event of CASES) {
      expect(CASE_SPOTS[event.id], `${event.id} happens nowhere`).toBeDefined();
    }
    for (const id of Object.keys(CASE_SPOTS)) {
      expect(CASES.some((c) => c.id === id), `a spot for ${id}, which is not a scene`).toBe(true);
    }
  });
});
