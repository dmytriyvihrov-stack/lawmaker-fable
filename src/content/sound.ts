/**
 * Nothing in this file is played any more.
 *
 * The whole effects layer went with the toggle that carried it: the cues under
 * the hand, the click on the river, the murmur at the door, and the switch in
 * the corner that turned them on and off. What the game makes is music or it
 * is silence, and that was asked for in those words. The tables below stay
 * because they are readings and not sounds: `HUSHED_CASES` still says which
 * scenes the music drops under, and the two voices are what a caller would
 * sound like on the day anybody records one.
 */

/**
 * Two voices.
 *
 * There used to be twenty eight, one authored pitch and vowel per caller, and
 * the difference between the Cooper and the Ferryman was nine hertz that
 * nobody has ever named out loud. What a player actually hears at the door is
 * whether the person standing there is a man or a woman, so that is what is
 * left: one low voice, one high one, and the hush that grave scenes already
 * ask for. Fewer things, each of them audible.
 *
 * The reading is in `VOICE_OF`. The Monarch is not in it, because who is
 * upstairs is a function of the seed: `monarchOf(seed).voice` answers that
 * one, and `Soundscape` asks.
 */
export type VoiceKind = 'man' | 'woman';

/** Pitch in hertz, the vowel the formant sits on, and the pace of a syllable. */
export const VOICES: Record<VoiceKind, readonly [number, number, number]> = {
  man: [124, 620, .15],
  woman: [228, 1080, .125],
};

/**
 * Who is at the door. Everyone in `CHARACTERS` except the Monarch, and the
 * validator holds that: a caller with no line here is a silent caller.
 *
 * The four that are not one person take the low voice, because a crowd, a
 * troupe, a column of riders and a wolf all read as weight rather than pitch.
 */
export const VOICE_OF: Record<string, VoiceKind> = {
  iva: 'woman', widow: 'woman', marta: 'woman', healer: 'woman', aunt: 'woman',
  tam: 'man', miller: 'man', lever: 'man', pusher: 'man', chaplain: 'man',
  clerk: 'man', millwright: 'man', charter: 'man', treasurer: 'man',
  captain: 'man', fool: 'man', lark: 'man', ferrier: 'man', singer: 'man',
  runner: 'man', brother: 'man', digger: 'man', odo: 'man', fugitive: 'man',
  riders: 'man', crowd: 'man', players: 'man', wolf: 'man',
};

/**
 * Which voice answers for whoever is at the door. A caller who is not in the
 * table gets the low one rather than silence, so a new case is never mute
 * while somebody is deciding what it sounds like.
 */
export function voiceOf(character: string | undefined, monarch: VoiceKind): VoiceKind {
  if (character === 'monarch') return monarch;
  return (character && VOICE_OF[character]) || 'man';
}

/** Keep arrivals restrained around death, punishment and collapse. */
export const HUSHED_CASES = new Set([
  'd1_pies', 'd2_ashes', 'd3_cart', 'd4_bridge', 'd5_deathbed', 'd6_door',
  'v4_hay', 'v5_winter_ground', 'v6_road_dead', 'v8_long_night',
  'wv_hearth', 'w_grain', 'w_cold', 'w_brother_fire', 'r1_tam_cut', 'r2_marta_moved',
  'c1_lark', 'c2_toll', 'tr_accused', 'tr_accused_wrong', 'tr_accused_again',
  'x_revolt', 'x_plague', 'x_ruin', 'x_abdication', 'x_flight', 'x_square',
]);

