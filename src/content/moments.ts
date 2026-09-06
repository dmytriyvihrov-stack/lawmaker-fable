import type { Effects, Season } from '../engine/types';

/**
 * The four small things, which cost a year nothing.
 *
 * Everything else in this game is a decision with a bill attached. These are
 * not: a dog leans on your leg, somebody goes down with a full basket, a rod
 * bends double, a kid gets through the hurdles into the young corn. You can
 * walk past every one of them and the reign is the same reign.
 *
 * They exist because a place you only ever touch to rule on it is a place you
 * never touch at all. Two of them turn up in any year, faintly lit, and the
 * pointer changes over each one so the hand knows before the head does. What
 * they give is one point, once, which is small enough that nobody will play
 * for it and large enough that stopping was not nothing.
 *
 * The rule they are written to: no moment may ever be bad. There is no trick
 * here and no cost hidden in the second sentence. This is the one corner of
 * the game where the answer to "should I?" is just yes.
 */
export interface Moment {
  id: string;
  /** What the pointer says it is, before you have done anything about it. */
  label: string;
  /** Where in the picture, in the town's own 1440 by 820 box. */
  x: number;
  y: number;
  /** What the pointer turns into over it. One class in `index.css` each. */
  hand: 'pet' | 'lift' | 'pull' | 'catch';
  /** What happened, said once, afterwards. */
  line: string;
  /** Small on purpose. This is attention, not a lever. */
  effect: Effects;
  /** Left off, it can happen in any weather. */
  seasons?: Season[];
}

export const MOMENTS: Moment[] = [
  {
    id: 'dog',
    label: 'A dog, leaning',
    x: 560,
    y: 356,
    hand: 'pet',
    line: 'It leans on your leg with its whole weight, which is a great deal more weight than it looks like it has, and it does not move until you do.',
    effect: { mood: 1 },
  },
  {
    id: 'spill',
    label: 'A basket, and everything that was in it',
    x: 868,
    y: 262,
    hand: 'lift',
    line: 'You get down and pick apples out of the ruts with her for a minute. She talks about her sister the entire time and neither of you mentions who you are.',
    effect: { mood: 1 },
  },
  {
    id: 'bite',
    label: 'A rod bent double',
    x: 1246,
    y: 404,
    hand: 'pull',
    line: 'Two of you on one rod, and the thing comes up like a boot with fins on it. It is enormous. He will tell it wrong by Sunday and you will let him.',
    effect: { economy: 1 },
    // the boat is up on the bank and the river has a lid on it
    seasons: ['spring', 'summer', 'autumn'],
  },
  {
    id: 'kid',
    label: 'A kid, in the young corn',
    x: 444,
    y: 300,
    hand: 'catch',
    line: 'It is a great deal faster than you and a great deal less clever, so it takes both of you and a hurdle. It goes back the way it came, and then looks at you.',
    effect: { mood: 1 },
    seasons: ['spring', 'summer', 'autumn'],
  },
];

/** What the ledger calls a minute spent on something that was not a ruling. */
export const MOMENT_SOURCE = 'A minute of your day';
