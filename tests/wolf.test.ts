import { describe, expect, it } from 'vitest';
import { CASES } from '../src/content/cases';
import { CASE_SPOTS, CITY_LABELS, characterMeta } from '../src/content/meta';
import { CASE_VERDICTS } from '../src/content/verdict-words';
import { chooseCase, continueYear, newGame } from '../src/engine/reducer';
import { computePortrait } from '../src/engine/portrait';
import { OWN_ROPE_DESC, OWN_ROPE_HEADLINE } from '../src/content/own-rope';
import { evaluate } from '../src/engine/conditions';
import { animalKeep, trendOf } from '../src/engine/simulation';
import { DOGS_KEPT, WOLF_FED } from '../src/content/animals';
import type { CaseEvent, GameState } from '../src/engine/types';

const wolf = CASES.find((c) => c.id === 'w_wolf') as CaseEvent;
const litter = CASES.find((c) => c.id === 'w_wolf_dog') as CaseEvent;
const back = CASES.find((c) => c.id === 'w_wolf_back') as CaseEvent;

/** A reign far enough along that the thing at the woodpile could turn up. */
function years(n: number, souls: number): GameState {
  const s = newGame(11);
  s.turn = n;
  s.population = souls;
  s.current = { kind: 'case', id: 'w_wolf' };
  return s;
}

describe('the thing at the woodpile', () => {
  it('waits for a few years and a few people, and for no law at all', () => {
    expect(wolf).toBeDefined();
    expect(wolf.trigger).not.toBeNull();
    expect(evaluate(wolf.trigger!, years(1, 5))).toBe(false);
    expect(evaluate(wolf.trigger!, years(4, 5))).toBe(false);
    expect(evaluate(wolf.trigger!, years(4, 8))).toBe(true);
  });

  it('offers exactly the three answers: keep it, send it away, eat it', () => {
    expect(wolf.choices.map((c) => c.id)).toEqual(['feed_it', 'drive_it_off', 'kill_it']);
    const [keep, send, eat] = wolf.choices;
    // feeding a wolf costs food and buys nothing at all on the night
    expect(keep.effects.economy!).toBeLessThan(0);
    expect(keep.effects.mood, 'the wolf is a bet, not a purchase').toBeUndefined();
    // sending it away costs and gains nothing anybody can eat
    expect(send.effects.economy).toBeUndefined();
    expect(send.effects.mood).toBeUndefined();
    // and a wolf is meat
    expect(eat.effects.economy!).toBeGreaterThan(0);
    expect(eat.effects.mood!).toBeLessThan(0);
  });

  it('the two answers that leave it alive both come back, and eating it does not', () => {
    const scheduled = new Map(
      wolf.choices.filter((c) => c.schedule).map((c) => [c.id, c.schedule!]),
    );
    expect([...scheduled.keys()]).toEqual(['feed_it', 'drive_it_off']);
    // the bowl grows into a litter
    expect(scheduled.get('feed_it')!.caseId).toBe('w_wolf_dog');
    expect(scheduled.get('feed_it')!.inTurns).toBe(2);
    // and the pots only put the same evening off for three years, because the
    // trees were where it lived before anybody banged anything
    expect(scheduled.get('drive_it_off')!.caseId).toBe('w_wolf_back');
    expect(scheduled.get('drive_it_off')!.inTurns).toBe(3);
    expect(litter.trigger, 'the litter arrives by schedule and no other way').toBeNull();
    expect(back.trigger, 'and so does the one that was sent away').toBeNull();
  });

  it('the one that was sent away takes something on its way back in', () => {
    const after = chooseCase(years(4, 9), 'w_wolf', 'drive_it_off');
    expect(after.flags).toContain('wolf_driven');
    expect(after.pending.map((p) => p.caseId)).toContain('w_wolf_back');
    // it is not at the edge of the light: it is in the trees, where it was sent
    expect(after.cityFlags).not.toContain('wolf_at_the_edge');

    const cornered = years(7, 14);
    cornered.current = { kind: 'case', id: 'w_wolf_back' };
    cornered.flags = ['wolf_driven'];

    // hunting it settles it for good and nothing is booked after that
    const hunted = chooseCase(cornered, 'w_wolf_back', 'hunt_it_down');
    expect(hunted.flags).toContain('wolf_eaten');
    expect(hunted.pending.map((p) => p.caseId)).not.toContain('w_wolf_dog');

    // feeding it three years late is still feeding it, litter and all
    const fed = chooseCase(cornered, 'w_wolf_back', 'put_the_bowl_out');
    expect(fed.flags).toContain('wolf_kept');
    expect(fed.cityFlags).toContain('wolf_at_the_edge');
    expect(fed.pending.map((p) => p.caseId)).toContain('w_wolf_dog');

    // and sitting up with the pens decides nothing a third time, on purpose
    const watched = chooseCase(cornered, 'w_wolf_back', 'pen_them_at_night');
    expect(watched.flags).toContain('wolf_driven');
    expect(watched.cityFlags).not.toContain('wolf_at_the_edge');
  });

  it('every answer at the woodpile costs the place something in the end', () => {
    const free = wolf.choices.filter(
      (c) => c.schedule === undefined && Object.keys(c.effects).length === 0,
    );
    expect(free, 'an answer that costs nothing and books nothing').toHaveLength(0);
  });

  it('feeding it puts one wolf on the town and books the return', () => {
    const after = chooseCase(years(4, 9), 'w_wolf', 'feed_it');
    expect(after.flags).toContain('wolf_kept');
    expect(after.cityFlags).toContain('wolf_at_the_edge');
    expect(after.cityFlags).not.toContain('dogs_about');
    expect(after.pending.map((p) => p.caseId)).toContain('w_wolf_dog');
  });

  it('eating it books nothing and leaves the edge of the light empty', () => {
    const after = chooseCase(years(4, 9), 'w_wolf', 'kill_it');
    expect(after.flags).toContain('wolf_eaten');
    expect(after.cityFlags).not.toContain('wolf_at_the_edge');
    expect(after.pending.map((p) => p.caseId)).not.toContain('w_wolf_dog');
  });

  it('keeping the litter fills the yards, and the wolf itself never leaves', () => {
    const kept = years(7, 24);
    kept.current = { kind: 'case', id: 'w_wolf_dog' };
    kept.cityFlags = ['wolf_at_the_edge'];
    kept.flags = ['wolf_kept'];

    for (const id of ['every_house', 'to_the_flock']) {
      const after = chooseCase(kept, 'w_wolf_dog', id);
      expect(after.flags, id).toContain('dogs_kept');
      expect(after.cityFlags, id).toContain('dogs_about');
      // it was fed for two years: it is not going anywhere, ever
      expect(after.cityFlags, id).toContain('wolf_at_the_edge');
    }

    const gone = chooseCase(kept, 'w_wolf_dog', 'back_to_the_trees');
    expect(gone.flags).not.toContain('dogs_kept');
    expect(gone.cityFlags).not.toContain('dogs_about');
    expect(gone.cityFlags, 'the litter went, the mother stayed').toContain('wolf_at_the_edge');
  });

  it('is dressed for the screen like every other caller', () => {
    for (const id of ['w_wolf', 'w_wolf_dog', 'w_wolf_back']) {
      expect(CASE_SPOTS[id], id).toBeDefined();
      expect(CASE_VERDICTS[id], id).toBeDefined();
    }
    expect(characterMeta('wolf').label).toBe('The Wolf');
    expect(CITY_LABELS.wolf_at_the_edge).toBeDefined();
    expect(CITY_LABELS.dogs_about).toBeDefined();
  });
});

describe('the rope you wrote', () => {
  /** A reign with the crossroads decree standing and the coat case in hand. */
  function underTheRope(): GameState {
    const s = newGame(3);
    s.turn = 9;
    s.population = 60;
    s.laws = [
      {
        subject: 'crime',
        action: 'hanged',
        label: 'A HAND THAT TAKES WHAT IS NOT ITS OWN IS HANGED AT THE CROSSROADS',
        turn: 6,
        status: 'active',
      },
    ];
    s.current = { kind: 'case', id: 'c1_lark' };
    s.phase = 'case';
    return s;
  }

  it('applying your own law to a child is a ruling like any other', () => {
    const after = chooseCase(underTheRope(), 'c1_lark', 'whipped');
    expect(after.flags).not.toContain('own_rope');
    expect(after.phase).toBe('aftermath');
    expect(continueYear(after).phase).not.toBe('portrait');
  });

  it('a soft way round it is also survivable', () => {
    // the coat goes back, which satisfies the decree without hanging anybody
    const after = chooseCase(underTheRope(), 'c1_lark', 'coat_back');
    expect(after.flags).not.toContain('own_rope');
    expect(continueYear(after).phase).not.toBe('portrait');
  });

  it('breaking it outright ends the reign at the crossroads', () => {
    const after = chooseCase(underTheRope(), 'c1_lark', 'spare_the_child');
    expect(after.flags).toContain('own_rope');
    expect(after.exceptions.map((e) => e.law)).toContain('crime_hanged');
    // the walk to the crossroads is in the scene you read before it ends
    expect(after.lastAftermath!.paragraphs.length).toBeGreaterThan(2);
    expect(after.phase).toBe('aftermath');
    const done = continueYear(after);
    expect(done.phase).toBe('portrait');
    expect(done.current).toBeNull();
  });

  it('and the portrait opens on that afternoon, not on a philosophy', () => {
    const after = chooseCase(underTheRope(), 'c1_lark', 'spare_the_child');
    const p = computePortrait(continueYear(after));
    expect(p.headline).toBe(OWN_ROPE_HEADLINE);
    expect(p.description).toBe(OWN_ROPE_DESC);
  });

  it('the same breach with the decree already replaced is only a breach', () => {
    const s = underTheRope();
    s.laws[0].status = 'replaced';
    const after = chooseCase(s, 'c1_lark', 'spare_the_child');
    expect(after.exceptions).toHaveLength(1);
    expect(after.flags).not.toContain('own_rope');
  });

  it('no other law in the game carries the rope', () => {
    const breaches = CASES.flatMap((c) => c.choices)
      .map((ch) => ch.exceptionToLaw)
      .filter((l) => l !== undefined);
    expect(breaches).toContain('crime_hanged');
    expect(breaches.filter((l) => l === 'crime_hanged')).toHaveLength(1);
  });
});

describe('what the animals cost every year', () => {
  it('a wolf eats and gives nothing back', () => {
    const s = newGame(5);
    s.flags = ['wolf_kept'];
    expect(animalKeep(s)).toBe(WOLF_FED);
    expect(trendOf(s, 'economy')).toBeLessThan(trendOf(newGame(5), 'economy'));
    expect(WOLF_FED.every.mood, 'a wolf is not a comfort').toBeUndefined();
    expect(WOLF_FED.every.economy!).toBeLessThan(0);
  });

  it('and what it turns into is plainly worth more than its bowl', () => {
    const s = newGame(5);
    s.flags = ['wolf_kept', 'dogs_kept'];
    expect(animalKeep(s)).toBe(DOGS_KEPT);
    // it still eats, and what it gives back is bigger than what it eats
    expect(DOGS_KEPT.every.economy!).toBeLessThan(0);
    expect(DOGS_KEPT.every.mood!).toBeGreaterThan(-DOGS_KEPT.every.economy!);
  });

  it('a wolf that was driven off or eaten costs nothing after the night', () => {
    for (const flag of ['wolf_driven', 'wolf_eaten'] as const) {
      const s = newGame(5);
      s.flags = [flag];
      expect(animalKeep(s), flag).toBeNull();
    }
  });
});
