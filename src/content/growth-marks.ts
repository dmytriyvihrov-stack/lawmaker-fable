/**
 * The other half of what a place works out: the half that is not paid for out
 * of a good harvest but simply arrives, because there are more of you than
 * there were.
 *
 * Nothing on this ladder can be bought, hurried or refused. A hamlet of eleven
 * does not drill a watch however rich it is, and a place of two hundred has a
 * watch whether or not anybody wanted one. The three marks below are the ones
 * the rules of the game own; every other rung is a thing somebody finally has
 * the people to think of, and takes its name from the thing itself.
 */

export interface GrowthMark {
  title: string;
  line: string;
  /** The same rung at the width of a tick on the bar: two or three words. */
  short: string;
}

export const GROWTH_MARKS: Record<'open' | 'first' | 'second' | 'charter' | 'crown', GrowthMark> = {
  open: {
    short: 'The workshops',
    title: 'The place starts working things out',
    line: 'Nobody is told to. It happens between harvests, in the evenings, and then it is simply true and you find out afterwards.',
  },
  first: {
    short: 'One more board',
    title: 'The place can carry one more thing',
    line: 'Thirty of you is enough that something has to be organised and not everything can be. Pick the one the place gets first: somebody who keeps a watch, or somebody who keeps the songs.',
  },
  second: {
    short: 'The other board',
    title: 'And then the other one',
    line: 'Enough of you now for the half you did not pick. It arrives late, which is a fact about this place that people will notice for years.',
  },
  charter: {
    short: 'The charter',
    title: 'The charter, and a town',
    line: 'The hamlet becomes a town. A clerk draws a circle on a map, anything the place never got round to choosing turns up in the post, and a year of work costs what a town pays.',
  },
  /* The last rung, and it was on nobody's ladder: the screen that says what a
     count opens went as far as the charter and stopped, in a game with a third
     stage in it. */
  crown: {
    short: 'The crown',
    title: 'The crown, and a state',
    line: 'The town becomes a kingdom, which is to say it stops being the only place on the map. Five neighbours with their own stores and their own laws, and a year of work that can be spent abroad instead of at home.',
  },
};

/** What the count is doing right now, said in one line under the bar. */
export const GROWTH_STATE = {
  next: 'Next at {n}: {what}. About {years} away at the rate the place is filling.',
  nextSoon: 'Next at {n}: {what}. The place is nearly there.',
  nextNever: 'Next at {n}: {what}. The place is not walking towards it this year.',
  top: 'There is nothing above this. The place is as big as this fable gets.',
  years: '{n} years',
};

/**
 * The other colour on the ladder: what a count costs.
 *
 * Every rung above says what more people open. None of them said what more
 * people take, and what they take is the steadiest pressure in the game: a
 * point off the conditions for every so many souls, every year, for as long
 * as they are here, and past the charter a point off the square as well. A
 * ladder that only lists gifts is a ladder that lies about the climb.
 */
export const GROWTH_COST = {
  heading: 'And what every rung costs',
  /* One line. It was three, on the densest screen in the game, under a ladder
     of five rungs that were two lines each. `{n}` is `CONFIG.crowd.healthEvery`
     and `{town}` is `CONFIG.town.crowdEvery`; what a house, a well and the long
     room answer for is under the pointer. */
  line: 'Every {n} of you with no roof is a point off the conditions a year; past the charter, every {town} more is one off the square as well.',
  /** The half of it that is under the pointer. */
  answered: 'A house, a lined well and the long room each answer for a share of the count, so the part that is felt is the part nothing has been built for.',
  /** How much the crowd is already costing this year. {n} is a whole number of points. */
  now: 'This year the crowd costs the conditions {n}.',
  nowNothing: 'This year the crowd costs the conditions nothing yet.',
  /**
   * And the third thing a count costs, which is the one the store feels.
   *
   * It is on the same line and not a paragraph of its own, for the reason the
   * line above was cut to one in the first place: this is the densest screen in
   * the game. What the two boards do about it is under the pointer, because it
   * is the answer and not the problem, and a player only looks for an answer
   * once they have seen the number.
   */
  crimeNow: ' And {n} percent of what the year makes never reaches the store.',
  crimeLine:
    'Past {free} of you, a point of that for every {per} more. The songs take one back off for every {culture} of them, and the watch one for every {watch}, so a place that keeps both up keeps its harvest.',
};
