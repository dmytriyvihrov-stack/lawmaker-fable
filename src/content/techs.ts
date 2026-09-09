import type { TechDef } from '../engine/types';

/**
 * What the place works out for itself while you are busy ruling. Nothing here
 * is chosen: the surplus of a good year goes into the pot, the pot pays for the
 * cheapest thing anybody could start on, and then it is simply true.
 *
 * Two branches. The field grows out of the field, and needs only a good year.
 * The crowd grows out of the crowd, and needs a crowd: nobody drills a watch or
 * writes a ballad for eleven people, however rich the eleven are.
 *
 * And almost nothing here is free. A thing that is worked out changes who is
 * needed, who is watched and who is quoted, and most of those changes cost
 * somebody something. Only the first plough and the last fair copy are clean.
 */
export const TECHS: TechDef[] = [
  // ---- the field ----
  {
    id: 'plough',
    era: 1,
    name: 'The turning plough',
    line: 'One ox does what two did. The field gets longer every spring.',
    cost: 12,
    trend: { economy: 1 },
  },
  {
    id: 'cistern',
    era: 2,
    name: 'The cistern',
    line: 'Rain kept from the roofs. Nobody drinks the mud any more.',
    cost: 18,
    requires: ['plough'],
    // clean water, and a thing that has to be kept clean
    trend: { health: 1, economy: -1 },
  },
  {
    id: 'ledger',
    era: 2,
    name: 'Double entry',
    line: 'The Treasurer finds a way to write the same coin twice, honestly.',
    cost: 26,
    requires: ['cistern'],
    // the Treasurer can now see exactly who owes what, and so can everybody else
    trend: { economy: 2, mood: -1 },
  },
  {
    id: 'physician',
    era: 3,
    name: 'The trained physician',
    line: 'Somebody who has read about it, as well as done it.',
    cost: 34,
    requires: ['ledger'],
    // he is very good, and he does not do it for the love of it
    trend: { health: 1, economy: -1 },
  },

  // ---- the crowd ----
  /**
   * The first thing this branch ever works out, and the only one that hands a
   * year of the reign back a way to spend itself.
   *
   * A fair used to be on the shelf from the first spring, which made the one
   * thing a hamlet can do about its own mood a thing it had always known how
   * to do. Nobody in a valley of five knows how to hold a fair. Somebody works
   * out that a day nobody works is worth more than the day's work, writes down
   * who brings what, and after that the place has a fair in it forever.
   *
   * It is also where the branch starts: the list of who brings what on the day
   * is the first written list this place ever keeps, and the watch's rota and
   * the ballad both come off the back of it.
   */
  {
    id: 'fair_day',
    era: 1,
    name: 'The day off',
    line: 'Somebody works out that a day nobody works is worth more than the day of work. A fair can be held from now on.',
    cost: 8,
    // the day itself is a year of work and pays for itself there; this is only
    // the knowing how, and the songs it leaves behind
    trend: { culture: 1 },
  },
  {
    id: 'rota',
    era: 2,
    name: 'The written rota',
    line: 'Who stands where, on paper, for the whole month. The watch stops arguing.',
    cost: 24,
    requires: ['fair_day'],
    needsSouls: 90,
    trend: { army: 1, mood: -1 },
  },
  {
    id: 'ballads',
    era: 2,
    name: 'The travelling ballad',
    line: 'Somebody sets your worst year to a tune, and the tune is very good.',
    cost: 22,
    requires: ['fair_day'],
    needsSouls: 100,
    // somebody sets your worst year to a tune, and the tune travels
    trend: { culture: 2, crownSanity: -1 },
  },
  {
    id: 'press',
    era: 3,
    name: 'The letter press',
    line: 'Your laws, printed. The town can now misquote you accurately.',
    cost: 30,
    requires: ['ballads'],
    needsSouls: 120,
    trend: { culture: 2, mood: 1, crownSanity: -1 },
  },
  {
    id: 'scribes',
    era: 3,
    name: 'The fair copy',
    line: 'Clerks who can copy a law out clean. Opening one again becomes paperwork instead of a scandal.',
    cost: 40,
    requires: ['press'],
    needsSouls: 140,
    trend: { culture: 1, crownSanity: 1 },
  },
];
