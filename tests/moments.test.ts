import { describe, expect, it } from 'vitest';
import { MOMENTS, MOMENT_SOURCE } from '../src/content/moments';
import { CASE_SPOTS } from '../src/content/meta';
import { CASES } from '../src/content/cases';
import { MOMENTS_PER_YEAR, getMoment, momentTaken, momentsNow, momentsOfYear } from '../src/engine/moments';
import { chooseWork, newGame, takeMoment } from '../src/engine/reducer';
import type { GameState, Season } from '../src/engine/types';

const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];

function reign(turn = 4): GameState {
  const s = newGame(11);
  s.turn = turn;
  s.population = 14;
  return s;
}

describe('the four small things', () => {
  it('is four, all of them kind, none of them a decision', () => {
    expect(MOMENTS.length).toBe(4);
    expect(new Set(MOMENTS.map((m) => m.id)).size).toBe(4);
    expect(new Set(MOMENTS.map((m) => m.hand)).size, 'two of them feel the same').toBe(4);
    for (const moment of MOMENTS) {
      // no moment may ever be bad: this is the one corner with no cost in it
      const moves = Object.values(moment.effect);
      expect(moves.length, `${moment.id} does nothing`).toBeGreaterThan(0);
      for (const n of moves) expect(n, `${moment.id} takes something`).toBeGreaterThan(0);
      // and none of them is worth playing for
      expect(Math.max(...moves), `${moment.id} is a lever`).toBeLessThanOrEqual(1);
      expect(moment.line.length, `${moment.id} says nothing`).toBeGreaterThan(40);
      expect(moment.label.length, `${moment.id} has no name`).toBeGreaterThan(4);
    }
  });

  it('stands where a card cannot float over it, and off every case marker', () => {
    for (const moment of MOMENTS) {
      // the card owns the near meadow, which is everything past about 500
      expect(moment.y, `${moment.id} is under the card`).toBeLessThan(470);
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

  it('deals two a year, the same two every time that year is asked', () => {
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

  it('is not the same two every year', () => {
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
