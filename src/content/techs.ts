import type { PathDef, SphereDef, TechDef } from '../engine/types';

/**
 * What the place works out while you are busy ruling, and which of it you can
 * point at.
 *
 * Three spheres, and each of them answers a different question. The ground is
 * how many the valley can hold; the body is who is still here in the spring;
 * the word is what the place writes down, sings and teaches. Each sphere holds
 * two or three paths, and each path is a short chain: the second step is not
 * thinkable until the first is known. Nothing on one path closes another. What
 * closes a path is the years, because one thing is worked out at a time and a
 * reign is not long. A reign of forty years reaches about a third of this.
 *
 * The surplus of a good year still goes in the pot, and the pot still buys the
 * cheapest thing anybody could start on if nobody has said otherwise, so a
 * player who never opens the screen has the game they always had. The moment
 * one card is pointed at, every point goes there instead, and the place is
 * working on the thing you asked for rather than the thing that was nearest.
 *
 * Four things a step can do besides its yearly trend, and each of them is a
 * number that already existed in the engine, reached from a new direction:
 *
 *   room      souls the valley can feed and put up, on top of what it was
 *             found with, the same ceiling a cleared field and a lined well
 *             lift. This is the ground's whole argument.
 *   answers   souls the crowding term stops counting, the same way a roof and
 *             a well answer for the people under them. This is the body's.
 *   shelter   percent points off what the long winter takes.
 *   the trend the boards, every year, for good.
 *
 * And almost nothing here is free. A thing that is worked out changes who is
 * needed, who is watched and who is quoted, and most of those changes cost
 * somebody something. Only the plough, the herb garden and the fair copy are
 * clean.
 */

export const SPHERES: SphereDef[] = [
  {
    id: 'ground',
    name: 'The ground',
    emoji: '🌾',
    line: 'What the valley feeds, and how many of them.',
  },
  {
    id: 'body',
    name: 'The body',
    emoji: '⚕️',
    line: 'Who is still here in the spring, and what a crowd costs them.',
  },
  {
    id: 'word',
    name: 'The word',
    emoji: '📜',
    line: 'What the place writes down, sings, and teaches to the next lot.',
  },
];

export const PATHS: PathDef[] = [
  { id: 'field', sphere: 'ground', name: 'The field', line: 'More out of the same ground.' },
  { id: 'store', sphere: 'ground', name: 'The store', line: 'A good year, kept.' },
  { id: 'herd', sphere: 'ground', name: 'The herd', line: 'Animals, doing the work of a wall.' },

  { id: 'water', sphere: 'body', name: 'The water', line: 'Clean in, dirty out.' },
  { id: 'healer', sphere: 'body', name: 'The healer', line: 'Somebody who knows what it was.' },
  { id: 'roof', sphere: 'body', name: 'The roof', line: 'A house that keeps the weather outside it.' },

  { id: 'book', sphere: 'word', name: 'The book', line: 'Written down, so nobody has to remember it.' },
  { id: 'song', sphere: 'word', name: 'The song', line: 'What travels further than a cart.' },
  { id: 'school', sphere: 'word', name: 'The school', line: 'The clever ones, kept until they are useful.' },
];

/**
 * Written path by path, first step first. The validator insists a thing comes
 * after whatever it grows from, and the screen reads the order as the chain.
 */
export const TECHS: TechDef[] = [
  // ---------------- the ground ----------------
  {
    id: 'plough',
    sphere: 'ground',
    path: 'field',
    era: 1,
    name: 'The turning plough',
    line: 'One ox does what two did, and complains about it rather less.',
    cost: 18,
    trend: { economy: 1 },
    room: 18,
  },
  {
    id: 'three_fields',
    sphere: 'ground',
    path: 'field',
    era: 2,
    name: 'Three fields',
    line: 'One field rests while two work, and everybody argues about whose turn it is to rest.',
    cost: 40,
    requires: ['plough'],
    trend: { economy: 2, mood: -1 },
    room: 28,
  },
  {
    id: 'mill',
    sphere: 'ground',
    path: 'field',
    era: 3,
    name: 'The mill',
    line: 'The river grinds what forty arms ground. The miller takes a tenth, and is not loved for it.',
    cost: 70,
    requires: ['three_fields'],
    trend: { economy: 3, mood: -1 },
    room: 34,
  },

  {
    id: 'lidded_store',
    sphere: 'ground',
    path: 'store',
    era: 1,
    name: 'The lidded store',
    line: 'A good year kept in a jar, instead of eaten by November.',
    cost: 18,
    trend: { economy: 1, culture: -1 },
    shelter: 4,
  },
  {
    id: 'ledger',
    sphere: 'ground',
    path: 'store',
    era: 2,
    name: 'Double entry',
    line: 'The Treasurer finds a way to write the same coin twice, honestly.',
    cost: 40,
    requires: ['lidded_store'],
    // he can now see exactly who owes what, and so can everybody else
    trend: { economy: 2, mood: -1 },
  },

  {
    id: 'fold',
    sphere: 'ground',
    path: 'herd',
    era: 1,
    name: 'The fold',
    line: 'The goats sleep behind a wall now. The wolf has read the wall and is thinking about it.',
    cost: 18,
    trend: { economy: 1, health: -1 },
    shelter: 2,
  },
  {
    id: 'dairy',
    sphere: 'ground',
    path: 'herd',
    era: 2,
    name: 'The dairy',
    line: 'Cheese, which is milk that has learned to wait.',
    cost: 40,
    requires: ['fold'],
    trend: { economy: 2, health: 1 },
    room: 22,
  },

  // ---------------- the body ----------------
  {
    id: 'cistern',
    sphere: 'body',
    path: 'water',
    era: 1,
    name: 'The cistern',
    line: 'Rain kept off the roofs. Nobody drinks the mud any more.',
    cost: 18,
    // clean water, and a thing that has to be kept clean
    trend: { health: 1, economy: -1 },
    answers: 30,
  },
  {
    id: 'drain',
    sphere: 'body',
    path: 'water',
    era: 2,
    name: 'The drain',
    line: 'The street runs downhill on purpose now, and the well is upstream of where it runs to.',
    cost: 40,
    requires: ['cistern'],
    trend: { health: 2, economy: -1 },
    room: 18,
    answers: 40,
  },

  {
    id: 'herb_garden',
    sphere: 'body',
    path: 'healer',
    era: 1,
    name: 'The herb garden',
    line: 'Somebody\'s aunt, with a fence round what she knows.',
    cost: 18,
    trend: { health: 1 },
    answers: 20,
  },
  {
    id: 'physician',
    sphere: 'body',
    path: 'healer',
    era: 2,
    name: 'The trained physician',
    line: 'Somebody who has read about it, as well as done it.',
    cost: 40,
    requires: ['herb_garden'],
    // he is very good, and he does not do it for the love of it
    trend: { health: 1, economy: -1 },
    answers: 30,
  },
  {
    id: 'quarantine',
    sphere: 'body',
    path: 'healer',
    era: 3,
    name: 'The forty days',
    line: 'The sick wait outside the gate for the length of a season, and the gate is very polite about it.',
    cost: 70,
    requires: ['physician'],
    trend: { health: 2, mood: -2 },
    answers: 40,
    shelter: 4,
  },

  {
    id: 'chimney',
    sphere: 'body',
    path: 'roof',
    era: 1,
    name: 'The chimney',
    line: 'The smoke leaves the house by the hole it was given. Breakfast stops being a cough.',
    cost: 18,
    trend: { health: 1, economy: -1 },
    room: 14,
    answers: 20,
  },
  {
    id: 'slate',
    sphere: 'body',
    path: 'roof',
    era: 2,
    name: 'The slate roof',
    line: 'A roof that does not burn, on a street that had rather got used to it.',
    cost: 40,
    requires: ['chimney'],
    trend: { health: 1, mood: 1, economy: -1 },
    room: 14,
    answers: 20,
    shelter: 3,
  },

  // ---------------- the word ----------------
  /**
   * The first thing this place ever works out, and the only one that hands a
   * year of the reign back a way to spend itself.
   *
   * A fair used to be on the shelf from the first spring, which made the one
   * thing a hamlet can do about its own mood a thing it had always known how
   * to do. Nobody in a valley of five knows how to hold a fair. Somebody works
   * out that a day nobody works is worth more than the day's work, writes down
   * who brings what, and after that the place has a fair in it forever. The
   * list of who brings what is also the first written list this place keeps,
   * which is why the rota and the fair copy come off the back of it.
   */
  {
    id: 'fair_day',
    sphere: 'word',
    path: 'book',
    era: 1,
    name: 'The day off',
    line: 'Somebody works out that a day nobody works is worth more than the day of work. A fair can be held from now on.',
    cost: 14,
    // the day itself is a year of work and pays for itself there; this is only
    // the knowing how, and the songs it leaves behind
    trend: { culture: 1 },
  },
  {
    id: 'rota',
    sphere: 'word',
    path: 'book',
    era: 2,
    name: 'The written rota',
    line: 'Who stands where, on paper, for the whole month. The watch stops arguing and starts sulking.',
    cost: 40,
    requires: ['fair_day'],
    needsSouls: 90,
    trend: { army: 1, mood: -1 },
    shelter: 2,
  },
  {
    id: 'scribes',
    sphere: 'word',
    path: 'book',
    era: 3,
    name: 'The fair copy',
    line: 'Clerks who can copy a law out clean. Opening one again becomes paperwork instead of a scandal.',
    cost: 70,
    requires: ['rota'],
    needsSouls: 140,
    trend: { culture: 1, crownSanity: 1 },
  },

  {
    id: 'ballads',
    sphere: 'word',
    path: 'song',
    era: 1,
    name: 'The travelling ballad',
    line: 'Somebody sets your worst year to a tune, and the tune is very good.',
    cost: 18,
    needsSouls: 40,
    trend: { culture: 2, crownSanity: -1 },
  },
  {
    id: 'press',
    sphere: 'word',
    path: 'song',
    era: 2,
    name: 'The letter press',
    line: 'Your laws, printed. The town can now misquote you accurately.',
    cost: 40,
    requires: ['ballads'],
    needsSouls: 120,
    trend: { culture: 2, mood: 1, crownSanity: -1 },
  },

  {
    id: 'letters',
    sphere: 'word',
    path: 'school',
    era: 1,
    name: 'Letters',
    line: 'Eleven children and one alphabet between them. By spring it is the other way round.',
    cost: 18,
    needsSouls: 40,
    trend: { culture: 1 },
  },
  {
    id: 'school',
    sphere: 'word',
    path: 'school',
    era: 2,
    name: 'The school',
    line: 'A room where the clever ones are kept until they are useful, and fed in the meantime.',
    cost: 40,
    requires: ['letters'],
    needsSouls: 120,
    trend: { culture: 2, economy: -1 },
  },
];
