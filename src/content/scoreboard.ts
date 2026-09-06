import type { FolkLook } from './folk';

/**
 * The other seals, and what they are counted against.
 *
 * A reign in this game is not won, and the game does not tell you so at the
 * end. But a number is a thing to argue with, and three other places down the
 * same road, each with somebody who also held a seal and also had to answer
 * the door, is the cheapest way to say "that is one way to do it" without the
 * game itself saying which way was right.
 *
 * They are fixed on purpose: the same three every reign, so the number you got
 * this time means something next to the number you got last time. Their scores
 * are set so a careless reign lands under Corva, a decent one lands between
 * her and Ansel, and a place that came through the long winter fat and full of
 * people goes past Marden, which is what should take some doing.
 */

export interface Rival {
  id: string;
  name: string;
  /** The place they held, which is half of who somebody is around here. */
  town: string;
  score: number;
  /** One line: what they are remembered for, and what it cost. */
  line: string;
  look: FolkLook;
}

export const RIVALS: Rival[] = [
  {
    id: 'corva',
    name: 'Corva of the Ford',
    town: 'Nethergate',
    score: 210,
    line: 'Wrote four laws, kept all four, and lost half the place to a winter she had been warned about twice.',
    look: { r: 9.5, y: 26, hair: 'kerchief', prop: 'ledger', cloth: 'work', doing: 'counting' },
  },
  {
    id: 'ansel',
    name: 'Ansel the Patient',
    town: 'Two Mills',
    score: 430,
    line: 'Never bent a law for anybody, including himself, and was disliked for it for thirty years by people who kept voting for him.',
    look: { r: 10, y: 26, hair: 'cap', prop: 'quill', specs: true, cloth: 'work', doing: 'writing' },
  },
  {
    id: 'marden',
    name: 'Marden Longyear',
    town: 'Hallowdean',
    score: 690,
    line: 'Held the seal for forty one years. Nobody can name one of her laws and everybody can name the road, the bridge and the granary.',
    look: { r: 9.5, y: 26, hair: 'hood', prop: 'spade', seal: true, cloth: 'rich', doing: 'building' },
  },
];

/**
 * You, on your own board.
 *
 * Drawn the same way the other three are rather than with the crown's face:
 * the monarch upstairs is not you, they are the person you send the returns
 * to, and borrowing their portrait here would say the reign was theirs. A
 * figure with the seal, at a desk, is what the job actually was.
 */
export const YOU_LOOK: FolkLook = {
  r: 10,
  y: 26,
  hair: 'crop',
  prop: 'quill',
  seal: true,
  cloth: 'rich',
  doing: 'writing',
};

/** How the number is arrived at, said plainly, because a number nobody can check is a boast. */
export const SCORE_UI = {
  heading: 'The Reckoning',
  /** The one line above the board. */
  standing: 'Held the seal {years} years, and the road remembers it this way.',
  yourRow: 'You',
  total: 'in all',
  parts: {
    souls: 'the people in it',
    years: 'years held',
    boards: 'how it was living',
    laws: 'laws still standing',
    works: 'what got built',
    exceptions: 'laws bent for somebody',
  },
};

/** What the ranking says about where you came, in the game's own voice. */
export const PLACING_LINES: Record<1 | 2 | 3 | 4, string> = {
  1: 'They will be measured against you now, which is a thing to have done and a thing to have to keep doing.',
  2: 'Close enough that the difference is one winter, and everybody down this road knows which one.',
  3: 'A place that is still here, still fed, and not yet spoken of. Most of them are.',
  4: 'Nobody down this road is going to name a bridge after it. The people in it are alive, which is the part that counts and the part nobody counts.',
};
