import { describe, expect, it } from 'vitest';
import { MOMENTS, MOMENT_SOURCE } from '../src/content/moments';
import { CASE_SPOTS } from '../src/content/meta';
import { momentsNow } from '../src/engine/moments';
import { newGame, takeMoment } from '../src/engine/reducer';
import { ACTION_SECONDS, canAnswer, chooseJob, followVisitor, newJourney, queueErrand, requestVisit, skipJourney, tickJourney } from '../src/ui/journey/model';
import { along, atCrossing, distance, HOME, inWater, onFoot, pathLength, route } from '../src/ui/journey/routes';
import type { Journey } from '../src/ui/journey/model';

const errand = (id: string) => ({ key: `11:4:${id}`, turn: 4, moment: MOMENTS.find((m) => m.id === id)! });
const visit = { key: '11:4:d1_pies', id: 'd1_pies', character: 'iva', at: CASE_SPOTS.d1_pies };
const finishLeg = (s: Journey) => tickJourney(s, 1000);

describe('a person comes to find the ruler', () => {
  it('walks to the current ruler, waits to speak, then leads the ruler to the event', () => {
    let s = chooseJob(newJourney(), 'fields');
    s = tickJourney(s, 1);
    const foundAt = s.at;
    s = requestVisit(s, visit);
    expect(s.mode).toBe('caller');
    expect(canAnswer(s, visit.key)).toBe(false);
    s = tickJourney(s, .1);
    expect(s.at).toEqual(foundAt);
    expect(s.callerAt).not.toEqual(visit.at);
    s = finishLeg(s);
    expect(s.mode).toBe('briefing');
    expect(distance(s.callerAt!, foundAt)).toBeLessThan(25);
    expect(canAnswer(s, visit.key)).toBe(false);
    expect(tickJourney(s, 1000)).toBe(s);
    s = followVisitor(s);
    expect(s.mode).toBe('event-walk');
    expect(canAnswer(s, visit.key)).toBe(false);
    s = finishLeg(s);
    expect(s.at).toEqual(visit.at);
    expect(canAnswer(s, visit.key)).toBe(true);
    expect(canAnswer(s, 'another-case')).toBe(false);
  });
  it('dev skipping reaches the scene but never chooses an answer', () => {
    let s = requestVisit(newJourney(), visit);
    s = skipJourney(s);
    expect(s.mode).toBe('briefing');
    s = skipJourney(s);
    expect(s.mode).toBe('arrived');
    expect(s.completed).toEqual([]);
  });
  it('a replacement visit closes the old answers and starts from the current location', () => {
    const arrived = skipJourney(skipJourney(requestVisit(newJourney(), visit)));
    const next = requestVisit(arrived, { ...visit, key: 'next', at: CASE_SPOTS.w_goats });
    expect(next.at).toEqual(arrived.at);
    expect(canAnswer(next, visit.key)).toBe(false);
    expect(next.mode).toBe('caller');
  });
});

describe('the golden things wait for a promised walk', () => {
  it('credits nothing until the ruler arrives and finishes the physical action', () => {
    let s = queueErrand(newJourney(), errand('spill'));
    expect(s.completed).toEqual([]);
    s = finishLeg(s);
    expect(s.mode).toBe('collect-work');
    expect(s.completed).toEqual([]);
    s = tickJourney(s, ACTION_SECONDS - .1);
    expect(s.completed).toEqual([]);
    s = tickJourney(s, .2);
    expect(s.completed.map((e) => e.moment.id)).toEqual(['spill']);
  });
  it('finishes a queued autumn catch after winter removes its unclaimed marker', () => {
    const game = { ...newGame(11), turn: 4 };
    expect(momentsNow(game, 'winter').some((m) => m.id === 'bite')).toBe(false);
    let s = queueErrand(newJourney(), errand('bite'));
    s = finishLeg(finishLeg(s));
    expect(s.completed[0].moment.id).toBe('bite');
    const rewarded = takeMoment(game, s.completed[0].moment.id);
    expect(rewarded.ledger.filter((l) => l.source === `${MOMENT_SOURCE}: bite`)).toHaveLength(1);
    expect(takeMoment(rewarded, 'bite')).toBe(rewarded);
  });
  it('does not restart or duplicate a walk on repeated clicks, and completes a queue before a caller', () => {
    let s = queueErrand(newJourney(), errand('dog'));
    s = tickJourney(s, .2);
    expect(queueErrand(s, errand('dog'))).toBe(s);
    s = queueErrand(s, errand('spill'));
    s = requestVisit(s, visit);
    expect(s.mode).toBe('collect-walk');
    for (let i = 0; i < 4; i++) s = finishLeg(s);
    expect(s.completed.map((e) => e.moment.id)).toEqual(['dog', 'spill']);
    expect(s.mode).toBe('caller');
    expect(queueErrand(s, errand('dog'))).toBe(s);
  });
  it('changing an ordinary job does not abandon a promised collection', () => {
    const s = queueErrand(newJourney(), errand('kid'));
    const changed = chooseJob(s, 'wood');
    expect(changed.errands).toEqual(s.errands);
    expect(changed.path).toBe(s.path);
    expect(changed.job).toBe('wood');
  });
});

describe('walkable map geometry', () => {
  it('gets to all four small things without stepping in the river', () => {
    for (const m of MOMENTS) {
      const walk = route(HOME, m);
      expect(walk.length, m.id).toBeGreaterThan(1);
      expect(along(walk, pathLength(walk))).toEqual({ x: m.x, y: m.y });
      for (let step = 0; step <= pathLength(walk); step += 3) {
        const at = along(walk, step);
        expect(inWater(at) && !atCrossing(at), `${m.id} at ${at.x},${at.y}`).toBe(false);
      }
    }
  });
  it('uses the crossing to reach the woods on the far bank', () => {
    const walk = route(HOME, CASE_SPOTS.v7_beeches);
    expect(walk).toContainEqual({ x: 1090, y: 482 });
    expect(walk[walk.length - 1]).toEqual(CASE_SPOTS.v7_beeches);
  });
  it('reaches every case on foot, crossing water only on the existing crossing', () => {
    for (const [id, pin] of Object.entries(CASE_SPOTS)) {
      const target = onFoot(pin), walk = route(HOME, target);
      expect(walk.length, id).toBeGreaterThan(1);
      expect(walk[walk.length - 1], id).toEqual(target);
      for (let step = 0; step <= pathLength(walk); step += 6) {
        const at = along(walk, step);
        expect(inWater(at) && !atCrossing(at), `${id} at ${at.x},${at.y}`).toBe(false);
      }
    }
  });
});
