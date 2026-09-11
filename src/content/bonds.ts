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
 * it lands on their name. So the mark is the whole of it on the page and the
 * word is under the pointer, and the five marks are five of one thing rather
 * than a black heart, a cross, a dot, a smile and a red heart: a row of five
 * different kinds of picture is five things to learn, and one row of hearts
 * going from dark to red is a scale anybody can read once. Asked for by the
 * user.
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
    mark: '💔',
    line: 'Civil, and no further. You are a thing that happened to them once.',
  },
  {
    level: 0,
    word: 'is all right with you',
    mark: '🤍',
    line: 'No opinion worth the walk. Most of a place is this, most of the time.',
  },
  {
    level: 1,
    word: 'likes you',
    mark: '💛',
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
 * What a ruling does to the person it was about, when they were not the one
 * doing the talking.
 *
 * The engine reads the weight of an answer to work out what the person at the
 * door made of it, which is right for them and says nothing about anybody
 * else in the room. Taking Marta's field is a good year for the store and a
 * good day for the Mill-Wright, and the only person it is actually about is
 * standing in the field.
 *
 * Keyed `case:answer`, in rungs, the same scale the register is on.
 */
export const CHOICE_BOND_OTHERS: Record<string, Record<string, number>> = {
  'v3_millwright:marta_keeps': { marta: 1 },
  'v3_millwright:share_the_stream': { marta: 1 },
  'v3_millwright:plot_to_the_mill': { marta: -1 },
  'v3_millwright:a_year_first': { marta: 1 },
  'v7_beeches:the_strip_owns': { marta: 1 },
  'v7_beeches:the_child_keeps': { marta: -1 },
  'v7_beeches:up_first_wins': { marta: -1 },
  'v7_beeches:split_them': { marta: -1 },
};

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
  giftLine: 'Costs the store {n}. They think one step better of you. Not the same person twice in two years.',
  giftWait: 'Not again until year {n}.',
  giftPoor: 'The store cannot spare it.',
  giftTop: 'There is no rung above this one.',
  giftGone: 'Not here any more.',
  giftDone: 'Given, year {n}.',
  loverLabel: 'Take them',
  /**
   * And the same two buttons in the words the thing at the woodpile gets.
   * Nobody takes a wolf; a wolf stays, or it does not, and the difference
   * between the two is four winters of somebody leaving a bowl out.
   */
  wolfGiftLabel: 'Put something out',
  wolfTakeLabel: 'Let it stay',
  wolfTakeLine: 'Costs the store {n}. It stops keeping to the edge of the light, and the crown is {c} steadier every year it is here.',
  wolfKissLabel: 'Walk out to it',
  loverLine: 'Costs the store {n}. The place stops pretending it had not noticed, and the crown is {c} steadier every year they are here.',
  loverNeeds: 'Only from the top rung, and only if it is already true.',
  loverChild: 'They are a child. Not while that is true.',
  loverHas: 'You have somebody.',
  loverIs: 'Yours',
  loverMark: '💗',
  loverSince: 'since year {n}',
  /**
   * The chip on the button: what the crown gets out of it, in the crown's own
   * mark, beside what the store pays. A player asked to be able to see that
   * without reading a sentence for it.
   */
  crownGain: 'and the crown is {n} better for it',
  /** What the ledger calls the one steady thing in a reign. */
  loverSanity: 'Somebody who is glad you came home',
  /** Said on the card when the person standing there is the one you took. */
  loverAtTheDoor: 'This is the one you took. Whatever you say now, you say to them.',
  /** And on each answer, so the cost is legible before it is paid. */
  loverChoice: 'lands on somebody you love',
  /**
   * The visit. The only thing on this page that is not bought and does not
   * cost the place anything at all: they walk up to the house, and the rest of
   * the year is easier to be in.
   */
  kissLabel: 'Ask them up',
  kissMark: '💋',
  kissLine: 'Costs nothing. They come up to the house and the crown is {c} better for the rest of the year. Not again for two years.',
  kissWait: 'Not again until year {n}.',
  kissNotYours: 'Only the one you took.',
  /** What the ledger calls the afternoon. */
  kissLedger: 'An afternoon with somebody',
  /** The moment itself, when the two of them are actually in the room. */
  kissHeading: 'They came up to the house',
  kissAside: 'Nothing was decided. The seal sat on the table the whole afternoon and nobody looked at it.',
};
