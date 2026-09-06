import type { Effects, StatId } from '../engine/types';

/**
 * The monarch on the throne while you hold the seal.
 * Picked from the seed at New Game, so a seed always gives the same monarch,
 * and the save carries it for free. Each one bends one rule of the game.
 */
export interface MonarchTrait {
  /** Every economy gain is this much larger. */
  economyGainBonus?: number;
  /** Every health loss is this much softer. */
  healthLossRelief?: number;
  /** Mood effects grow by this much, in whichever direction they already point. */
  moodAmplify?: number;
  /** Replaces CONFIG.exceptionSanityCost for this reign. */
  exceptionSanityCost?: number;
  /**
   * What having this person upstairs costs, or gives, every single year you
   * hold the seal. A trait that only bends arithmetic you rarely see is a
   * label; this is the part of them you live with. Every one of them gives
   * with one hand and takes with the other, like every law in the game.
   */
  yearly?: Effects;
}

export interface MonarchDef {
  id: string;
  /**
   * The name and nothing else. The epithet used to be welded on from the
   * first screen, which gave away the whole person before they had done
   * anything; what a reign is called is earned in it, not printed on it.
   */
  name: string;
  emoji: string;
  traitName: string;
  /** One line, shown wherever the monarch appears. Short: it is read in a rail. */
  traitLine: string;
  /** The closing line on the portrait. */
  portraitLine: string;
  trait: MonarchTrait;
  /** Which board the trait touches, for the small tag in the UI. */
  touches: StatId;
  /**
   * Years old on the day you take the seal, and a year older every year after.
   * They start young on purpose: a reign of twenty years is a whole life on
   * the throne, and the number changing is the clearest thing on the screen
   * that says the game is made of time.
   */
  age: number;
}

export const MONARCHS: MonarchDef[] = [
  {
    id: 'marigold',
    name: 'Queen Marigold',
    emoji: '🪙',
    traitName: 'Frugal',
    traitLine: 'She turns out her own pockets after every audience. Coin comes in heavier and leaves colder.',
    portraitLine:
      'Queen Marigold outlived your reign and three of your laws. She still counts the vault herself, on Sundays, out loud.',
    trait: { economyGainBonus: 4, yearly: { economy: 1, mood: -1 } },
    touches: 'economy',
    age: 24,
  },
  {
    id: 'aldous',
    name: 'King Aldous',
    emoji: '🍮',
    traitName: 'Fond',
    traitLine: 'He announces your exceptions himself, warmly, as kindnesses. The town takes them the same way.',
    portraitLine:
      'King Aldous told visitors you were his favourite lawmaker, which he also said about the previous one, warmly, at the same table.',
    trait: { exceptionSanityCost: 0, yearly: { mood: 1, economy: -1 } },
    touches: 'mood',
    age: 22,
  },
  {
    id: 'ottiline',
    name: 'Queen Ottiline',
    emoji: '🔍',
    traitName: 'Attentive',
    traitLine: 'She reads every ruling twice and asks who it was for. Bending your own law costs you double.',
    portraitLine:
      'Queen Ottiline remembers your reign ruling by ruling, and remembers best the ones you made for somebody in particular.',
    trait: { exceptionSanityCost: 16, yearly: { crownSanity: 1, mood: -1 } },
    touches: 'mood',
    age: 20,
  },
  {
    id: 'corvin',
    name: 'King Corvin',
    emoji: '🕯️',
    traitName: 'Grim',
    traitLine: 'He reads the sick lists himself, out loud, at breakfast. Whatever hurts the place hurts it less.',
    portraitLine:
      'King Corvin kept every sick list of your reign in one drawer. He has read them more recently than you have.',
    trait: { healthLossRelief: 4, yearly: { health: 1, culture: -1 } },
    touches: 'health',
    age: 27,
  },
  {
    /**
     * The one who was not born here. She arrived over the water with a claim
     * nobody could read, a braid to her waist, and a map with something drawn
     * on it that does not live anywhere. She has never seen a dragon. She is
     * certain about them anyway, and the store pays for the certainty every
     * year, which is also why nobody comes near a place that hunts them.
     */
    id: 'vaelis',
    name: 'Queen Vaelis',
    emoji: '🐉',
    traitName: 'Dreaming',
    traitLine:
      'She is certain there are dragons and funds the search out of the store. Nobody comes near a place that goes looking.',
    portraitLine:
      'Queen Vaelis never found one. She is still certain, still not from here, and the fourth expedition leaves in the spring.',
    trait: { yearly: { army: 2, economy: -2 } },
    touches: 'army',
    age: 21,
  },
  {
    id: 'beatrix',
    name: 'Queen Beatrix',
    emoji: '📣',
    traitName: 'Loud',
    traitLine: 'Whatever the square feels, she says first and louder. Good moods and bad ones both run further.',
    portraitLine:
      'Queen Beatrix announced your best law from the balcony and your worst one from the same balcony, at the same volume.',
    trait: { moodAmplify: 4, yearly: { culture: 1, crownSanity: -1 } },
    touches: 'mood',
    age: 19,
  },
];
