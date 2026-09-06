/**
 * One type scale, for the two screens a player reads rather than plays.
 *
 * The first screen had ten type styles in it (26, 20, 15, 14, 13, 11 and 10
 * pixels, two of them italic, three of them uppercase at three different
 * letter spacings) and the law card had eight more, down to nine pixels. None
 * of it was wrong on its own and all of it together was noise: with that many
 * steps nothing is louder than anything else, so the eye has nowhere to land
 * and the screen reads as a wall.
 *
 * Five steps, each with one job:
 *
 *   display  the one thing on the screen that is the point of the screen
 *   title    a heading, or the thing the screen is assembling
 *   body     anything a person reads as a sentence
 *   note     a sentence that is beside the point rather than the point
 *   label    an overline naming the part of the screen under it
 *
 * Sizes only, on purpose: line height belongs to the block it is set on, and a
 * heading in a narrow margin does not want the leading a paragraph wants. Two
 * letter spacings exist and no more, and the only italic left in either screen
 * is the advisor, because that one is somebody actually talking.
 */
export const TYPE = {
  display: 'text-[26px] tracking-wide',
  title: 'text-[19px]',
  body: 'text-[15px]',
  note: 'text-[13px]',
  label: 'text-[11px] uppercase tracking-[0.18em]',
} as const;
