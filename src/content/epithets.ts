/**
 * What the place has started calling you.
 *
 * Nothing here is handed out at the start. A name of this kind is a verdict,
 * and a verdict wants something to have happened first: a law bent for
 * somebody with a face, a law that was never bent for anybody, a couple of
 * years spent on things that are still standing. The engine reads this list in
 * order and stops at the first one that holds, so the strongest claim on you
 * goes at the top.
 */

export type EpithetId = 'open_hand' | 'unbending' | 'builder';

export interface EpithetDef {
  id: EpithetId;
  /** What goes after your name, in the words the criers use. */
  name: string;
  /** What earned it. One line, said plainly. */
  line: string;
  /** What the place makes of it, which is not the same as approval. */
  aside: string;
}

export const EPITHETS: EpithetDef[] = [
  {
    id: 'open_hand',
    name: 'the Open Hand',
    line: 'You have bent your own law more than once, each time for somebody standing in front of you.',
    aside: 'It is said warmly. It is also said by people working out how to be standing in front of you.',
  },
  {
    id: 'unbending',
    name: 'the Unbending',
    line: 'Three laws sealed, and not one of them opened again for anybody, on any week.',
    aside: 'Said with respect, at a distance. Nobody has yet said it while smiling.',
  },
  {
    id: 'builder',
    name: 'the Builder',
    line: 'Two of your years went into things that are still standing when you walk past them.',
    aside: 'They point at the well when strangers ask who is in charge here.',
  },
];
