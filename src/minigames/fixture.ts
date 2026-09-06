import { PROPOSALS } from '../content/proposals';
import { CASE_VERDICTS } from '../content/verdict-words';
import { newGame } from '../engine/reducer';
import type { ActionId, EnactedLaw, GameState, SubjectId } from '../engine/types';

/**
 * A reign that never happened, set up so the three cases the prototype
 * covers can be walked into one after another. Three laws stand, one to a
 * subject, because the fourth word on the bench comes from a law and the
 * prototype wants that word on the table.
 *
 * A fixture, not a playthrough: nothing here is evidence about the rules.
 */
export interface LawPick {
  work: 'shared' | 'ruled' | 'owned';
  trade: 'free' | 'taxed' | 'licensed';
  dead: 'with_a_day' | 'by_the_house' | 'at_the_edge';
}

export const LAW_CHOICES: { [K in keyof LawPick]: LawPick[K][] } = {
  work: ['shared', 'ruled', 'owned'],
  trade: ['free', 'taxed', 'licensed'],
  dead: ['with_a_day', 'by_the_house', 'at_the_edge'],
};

export const DEFAULT_LAWS: LawPick = { work: 'shared', trade: 'free', dead: 'with_a_day' };

/** The cases that have a scene, in the order they are walked into. */
export const FORCED_CASES = ['v1_idle_hand', 'v2_well', 'd1_pies', 'v6_road_dead'];

function law(subject: SubjectId, action: ActionId, turn: number): EnactedLaw {
  const option = PROPOSALS.flatMap((p) => p.options).find(
    (o) => o.subject === subject && o.action === action,
  );
  return {
    subject,
    action,
    label: option?.label ?? `${subject} ${action}`.toUpperCase(),
    turn,
    status: 'active',
  };
}

/* Year eleven: the first long winter is behind the place and the next is nine years off. */
export function fixture(caseId: string, laws: LawPick, turn = 11): GameState {
  const base = newGame(20260905);
  return {
    ...base,
    turn,
    phase: 'case',
    current: { kind: 'case', id: caseId },
    stats: { crownSanity: 60, mood: 58, health: 52, economy: 48, army: 30, culture: 30 },
    population: 28,
    declaredTag: 'communitarian',
    laws: [law('work', laws.work, 2), law('trade', laws.trade, 5), law('dead', laws.dead, 7)],
    lastLawTurn: 7,
    lastWorkTurn: 7,
    eventsThisYear: 1,
    /* the well is standing, because the case about it cannot happen without one */
    buildings: { ...base.buildings, fields: 1, well: 1, fence: 1, granary: 1 },
  };
}

/**
 * Every answer this case has, on the bench at once.
 *
 * In the game three words are always there and the rest are on the table only
 * because a law of yours is standing, so one reign sees four of the six. A
 * prototype for trying the hand out wants all six, so the laws that grant the
 * other words are stood up as well, for the card and for the rail that lists
 * them. Nothing else reads this state: what the answer costs still comes from
 * the reign the player is actually in.
 */
export function standEveryAnswer(s: GameState, caseId: string): GameState {
  const grammar = CASE_VERDICTS[caseId];
  if (!grammar) return s;
  const have = new Set(
    s.laws.filter((l) => l.status === 'active').map((l) => `${l.subject}_${l.action}`),
  );
  const extra: EnactedLaw[] = [];
  for (const ruling of grammar.rulings) {
    const id = ruling.needsLaw;
    if (!id || have.has(id)) continue;
    have.add(id);
    const option = PROPOSALS.flatMap((p) => p.options).find(
      (o) => `${o.subject}_${o.action}` === id,
    );
    if (!option) continue;
    extra.push({
      subject: option.subject,
      action: option.action,
      label: option.label,
      /* A year of its own for each. The card that lists the laws keys a row
         by subject and year, because in the game one subject cannot be ruled
         on twice in a year; a bench that stands three of them at once can,
         and two rows with one key leave a stale law on the screen. */
      turn: Math.max(1, s.turn - 1 - extra.length),
      status: 'active',
    });
  }
  return extra.length === 0 ? s : { ...s, laws: [...s.laws, ...extra] };
}

/** The next of the three, as a new year, with the rest of the reign as it was. */
export function forceCase(s: GameState, caseId: string): GameState {
  return {
    ...s,
    turn: s.turn + 1,
    phase: 'case',
    current: { kind: 'case', id: caseId },
    lastAftermath: null,
    eventsThisYear: 1,
  };
}
