import type { BondLevel } from '../engine/types';

/**
 * What the people you have had in front of you think of you, in the words a
 * place of this size actually uses.
 *
 * The five rungs are not a percentage with a face on it. They are the whole of
 * what anybody here would say if you asked them in the lane: she cannot stand
 * you, she would rather you did not, she has no view, she is glad it is you,
 * and the last one, which nobody says out loud and everybody has noticed.
 *
 * The mark matters as much as the word. A register of thirty faces is read at
 * a glance or not at all, and the glance has to land on how they feel before
 * it lands on their name.
 */
export interface BondWord {
  level: BondLevel;
  word: string;
  mark: string;
  /** One line, in the town's voice, for the pointer and the register. */
  line: string;
}

export const BOND_WORDS: BondWord[] = [
  {
    level: -2,
    word: 'hates you',
    mark: '🖤',
    line: 'Crosses the lane rather than pass you. It was a ruling, and they remember which one.',
  },
  {
    level: -1,
    word: 'dislikes you',
    mark: '💢',
    line: 'Civil, and no further. You are a thing that happened to them once.',
  },
  {
    level: 0,
    word: 'is all right with you',
    mark: '·',
    line: 'No opinion worth the walk. Most of a place is this, most of the time.',
  },
  {
    level: 1,
    word: 'likes you',
    mark: '🙂',
    line: 'Glad it is you holding it, and says so where you can hear.',
  },
  {
    level: 2,
    word: 'loves you',
    mark: '❤️',
    line: 'Everybody in the place has worked this out, and nobody has said it to either of you.',
  },
];

export function bondWord(level: BondLevel): BondWord {
  return BOND_WORDS.find((b) => b.level === level) ?? BOND_WORDS[2];
}

/**
 * The two things a lawmaker can actually do about how somebody feels.
 *
 * A gift is small, cheap and slow: two off the store, one rung, and not again
 * for two years, which is exactly long enough that you cannot buy a place that
 * loves you inside one reign. Taking somebody is not a purchase at all: it is
 * only open at the top rung, where it has already happened and the two of you
 * are the last to say so.
 */
export const BOND_UI = {
  heading: 'Where you stand with them',
  giftLabel: 'Give them something',
  giftLine: 'Costs the store two. They think one step better of you. Not the same person twice in two years.',
  giftWait: 'Not again until year {n}.',
  giftPoor: 'The store cannot spare it.',
  giftTop: 'There is no rung above this one.',
  giftGone: 'Not here any more.',
  giftDone: 'Given, year {n}.',
  loverLabel: 'Take them',
  loverLine: 'Costs the store three. The place stops pretending it had not noticed.',
  loverNeeds: 'Only from the top rung, and only if it is already true.',
  loverChild: 'They are a child. Not while that is true.',
  loverHas: 'You have somebody.',
  loverIs: 'Yours',
  loverMark: '💗',
  loverSince: 'since year {n}',
  /** What the ledger calls the one steady thing in a reign. */
  loverSanity: 'Somebody who is glad you came home',
  /** Said on the card when the person standing there is the one you took. */
  loverAtTheDoor: 'This is the one you took. Whatever you say now, you say to them.',
  /** And on each answer, so the cost is legible before it is paid. */
  loverChoice: 'lands on somebody you love',
};
