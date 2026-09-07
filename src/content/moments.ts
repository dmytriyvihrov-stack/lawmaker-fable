import type { Effects, Season, StoryFlag } from '../engine/types';

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
 * One of them a year, not two: they are a change of pace and not a shift, and
 * a map with two of them lit at once reads as a list of chores. And a thing
 * only exists in the year the place actually has it. There is no dog in this
 * valley until the animal at the woodpile turns out to have been a she.
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
  /**
   * What the card says while it is being done, when the gesture's own words
   * are the wrong ones. Two things are lifted in this game and only one of
   * them is a basket of apples.
   */
  task?: string;
  /**
   * What happened, said once, afterwards.
   *
   * It is no longer a card over the town: a paragraph floating on the meadow
   * for something that cost the reign nothing was the loudest thing on the
   * screen for the smallest thing in the game. The sentence is under the
   * pointer on the mark instead, for the reader who wants it.
   */
  line: string;
  /**
   * The same thing in one or two words, past tense, which is what the mark
   * over the spot actually says. A verb and a number: you did this, it was
   * worth that.
   */
  done: string;
  /** Small on purpose. This is attention, not a lever. */
  effect: Effects;
  /** Left off, it can happen in any weather. */
  seasons?: Season[];
  /**
   * Left off, it is there from the first spring. Named, the thing has to have
   * arrived in the reign first: nobody scratches a dog in a place that has
   * never had one.
   */
  needsFlag?: StoryFlag;
}

export const MOMENTS: Moment[] = [
  {
    id: 'dog',
    label: 'The dog',
    // it comes and stands in the yards, where the people are
    x: 560,
    y: 356,
    hand: 'pet',
    // there are no dogs here until the wolf's litter is under the granary
    needsFlag: 'dogs_kept',
    line: 'It leans on your leg with its whole weight, which is a great deal more weight than it looks like it has, and it does not move until you do.',
    done: 'Scratched',
    effect: { mood: 1 },
  },
  {
    id: 'spill',
    label: 'The apples',
    // under the orchard above the field, which is where the apples came from
    x: 388,
    y: 250,
    hand: 'lift',
    line: 'You get down and pick them out of the grass with her for a minute. She talks about her sister the entire time and neither of you mentions who you are.',
    done: 'Gathered',
    effect: { mood: 1 },
    // apples come off a tree in the warm half of the year. A basket of them
    // spilled on frozen ground was the one thing here nobody believed.
    seasons: ['summer', 'autumn'],
  },
  {
    id: 'bite',
    label: 'The rod',
    // the first seat on the bank, where somebody is fishing anyway
    x: 1128,
    y: 392,
    hand: 'pull',
    line: 'Two of you on one rod, and the thing comes up like a boot with fins on it. It is enormous. He will tell it wrong by Sunday and you will let him.',
    done: 'Landed it',
    effect: { economy: 1 },
    // the boat is up on the bank and the river has a lid on it
    seasons: ['spring', 'summer', 'autumn'],
  },
  {
    /**
     * The one that is only ever there in the frost.
     *
     * Three of the four below are warm weather things, and once the apples
     * stopped turning up on frozen ground there was nothing at all on the map
     * between the first snow and the thaw - which is the half of the year the
     * place most wants something in it that is not a decision.
     */
    id: 'stack',
    label: 'The woodpile',
    // between the yards and the lane, where the roofs are
    x: 700,
    y: 350,
    hand: 'lift',
    task: 'Stacking the wood back up',
    line: 'Half a winter of somebody\u2019s firewood is across the path under a foot of snow, and the two of you have it back up inside a quarter of an hour. She puts a cup of something into your hands and stands in the doorway until you are out of sight.',
    done: 'Stacked',
    effect: { mood: 1 },
    seasons: ['winter'],
  },
  {
    id: 'kid',
    label: 'The kid',
    // out on the near meadow with the rest of them, by the hay
    x: 258,
    y: 604,
    hand: 'catch',
    line: 'It is a great deal faster than you and a great deal less clever, so it takes both of you and a hurdle. It goes back the way it came, and then looks at you.',
    done: 'Caught it',
    effect: { mood: 1 },
    seasons: ['spring', 'summer', 'autumn'],
  },
];

/** What the ledger calls a minute spent on something that was not a ruling. */
export const MOMENT_SOURCE = 'A minute of your day';
