import type { Effects } from '../engine/types';

/**
 * What the animals do to the boards every year, for as long as they are here.
 *
 * The wolf is a bet, and it is written as one. On the night you decide to feed
 * it, it gives the place nothing at all: it is a thin animal at the edge of the
 * light that has to be fed, and it eats out of the store every year whether or
 * not anybody is glad about it. Nobody is glad about it yet. Two years later it
 * has stopped being a wolf, and from then on what it gives is plainly worth
 * more than what it takes, every year, for the rest of the reign.
 *
 * That shape is the whole point: the only decision in the game whose payoff is
 * not on the card you read when you make it.
 */
export interface AnimalKeep {
  /** What the ledger calls it. */
  label: string;
  /** Every year, while it is here. */
  every: Effects;
}

/** A wolf that is still a wolf. It eats. That is the entire arrangement. */
export const WOLF_FED: AnimalKeep = {
  label: 'The wolf at the woodpile',
  every: { economy: -1 },
};

/** And what it turned into, which earns its bowl and then some. */
export const DOGS_KEPT: AnimalKeep = {
  label: 'The dogs',
  every: { economy: -1, mood: 3 },
};

/**
 * The herd on the common, once somebody has said whose it is.
 *
 * The other half of the wolf's shape, turned the right way up. The wolf is a
 * cost now and a gift later; the herd is the answer that pays most on the day
 * paying least afterwards. Split between the houses it gives two weeks of
 * goodwill and then nothing at all, which is why it has no entry here: a goat
 * in a yard is a goat in a yard, and there is nothing standing to count.
 *
 * Kept whole it is a small number that never stops. Twelve years of it beats
 * anything the split ever paid, and no card ever says so.
 */
export const HERD_WALKED: AnimalKeep = {
  label: 'The herd on the common',
  every: { economy: 1, mood: 1 },
};

/** The same animals, owned. More coin, and the ones who carried water know it. */
export const HERD_HIS: AnimalKeep = {
  label: "Odo's herd",
  every: { economy: 2, mood: -1 },
};
