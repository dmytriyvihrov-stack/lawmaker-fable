/**
 * The word bank the place gets named out of.
 *
 * The same idea as the drafting table: two lists, one word from each, and
 * whatever comes out is what is on the milestone from that evening on. Nothing
 * here is grand. Every real name on a road was two ordinary words that somebody
 * said once and nobody bothered to argue with.
 */

export interface NameWord {
  id: string;
  text: string;
}

/** What the place is like, or was like on the day somebody said it. */
export const FIRST_WORDS: NameWord[] = [
  { id: 'green', text: 'Green' },
  { id: 'crooked', text: 'Crooked' },
  { id: 'salt', text: 'Salt' },
  { id: 'merry', text: 'Merry' },
  { id: 'bramble', text: 'Bramble' },
  { id: 'nine', text: 'Nine' },
  { id: 'cold', text: 'Cold' },
  { id: 'honey', text: 'Honey' },
];

/** And what it is. A hollow, a crossing, a hill with one thing on it. */
export const SECOND_WORDS: NameWord[] = [
  { id: 'meadow', text: 'Meadow' },
  { id: 'hollow', text: 'Hollow' },
  { id: 'crossing', text: 'Crossing' },
  { id: 'barrow', text: 'Barrow' },
  { id: 'ditch', text: 'Ditch' },
  { id: 'bottom', text: 'Bottom' },
  { id: 'gate', text: 'Gate' },
  { id: 'mill', text: 'Mill' },
];

/** Two words and a space. There is no third part, and there does not need to be. */
export function joinTownName(first: string, second: string): string {
  return `${first} ${second}`;
}
