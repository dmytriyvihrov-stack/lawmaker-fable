import type { Verdict } from '../engine/types';

/**
 * The hint budget of the bench.
 *
 * A trial scene writes {{lean}} where its one leaning detail goes. The engine
 * fills it with the version that matches the truth, which is decided by the
 * seed and never shown. The two versions are the same kind of fact about the
 * same person: a debt, a door, an hour. One leans against them and one leans
 * for them, and neither is proof of anything.
 *
 * Rules for writing a pair:
 * - same subject, same length, same tone;
 * - no confession, no eyewitness, no physical certainty;
 * - the innocent version must still be the kind of thing a suspicious person
 *   would call suspicious.
 */
export const TRIAL_LEANS: Record<string, Record<Verdict, string>> = {
  tr_accused: {
    guilty:
      'His slate at the alehouse was cleared on the Friday, all of it at once. He says the money came from his sister down the valley. His sister has been dead two years and half the room knows it.',
    innocent:
      'His slate at the alehouse is longer than it was on the Friday, and he has been drinking on it in the open. The woman who keeps the slate says so without being asked, twice, in the voice of somebody who is owed.',
  },
};
