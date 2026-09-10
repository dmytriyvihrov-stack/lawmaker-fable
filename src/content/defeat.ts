import type { StatId } from '../engine/types';

/**
 * The ways a reign ends badly, and what the card says when it does.
 *
 * A board on the floor is not a defeat on the day it lands there: the collapse
 * scene comes first, at zero, and it is a dilemma like any other. The defeat is
 * the year after, if the board is still on the floor. So every one of these is
 * something the player was told about, in a scene, with a year to answer it.
 *
 * Two sentences each, a mark, and the face upstairs at its worst. Anything
 * longer is a reign being explained to somebody who just lost one.
 */
export interface Defeat {
  /** The mark for the thing that did it: the sickness, the empty bowl, the crown. */
  icon: string;
  headline: string;
  desc: string;
}

export const DEFEATS: Record<'health' | 'economy' | 'crownSanity', Defeat> = {
  health: {
    icon: '🤒',
    headline: 'The sickness got ahead of you.',
    desc: 'It went through the houses twice while the water stayed exactly as it was. By spring there were not enough standing hands to carry the ones that had stopped.',
  },
  economy: {
    icon: '🥣',
    headline: 'The store was empty for a whole year.',
    desc: 'Nothing came in that the winter had not already eaten, and nothing was put by for the next one. People do not stay where the bowl is empty, and they did not.',
  },
  /* Nobody takes the seal off you: you are the one wearing the crown, and
     there is no one above you to send for it. What ends here is you. */
  crownSanity: {
    icon: '👑',
    headline: 'You stopped coming down.',
    desc: 'A year of holding it and there was nothing left to hold it with. The seal sat where you put it, and after a while the place stopped bringing things to a door that never opened.',
  },
};

/** The boards that can end a reign this way. The square has its own ending. */
export const DEFEAT_STATS: StatId[] = ['health', 'economy', 'crownSanity'];

/** The mark on the card for the endings that are not one of the boards. */
export const OWN_ROPE_ICON = '🪢';
export const WALK_OUT_ICON = '🚶';
