/**
 * The tree as a choice: what the bench has on it.
 *
 * Three spheres, each with two or three paths, each path a short chain of
 * two or three things the place can work out. Nothing on one path closes
 * another; what closes a path is the years, because one thing is worked out
 * at a time and a reign is not long. The ids that already exist in the game
 * (`plough`, `cistern`, `ledger`, `physician`, `fair_day`, `rota`, `ballads`,
 * `press`, `scribes`) are the same things here and keep their names, so
 * that if this tree ever replaces the game's the ids do not move.
 *
 * Four things a step can do, and the bench shows every one of them at the
 * top of the screen: `room` is how many the valley can hold, `growth` is
 * percent a year on the count while there is room, `minds` is points a year
 * on top of what the count already gives, and `shelter` is percent taken off
 * what the long winter takes.
 */

export type SphereId = 'ground' | 'body' | 'word';

export type PathId =
  | 'plough' | 'store' | 'herd'
  | 'water' | 'healer' | 'roof'
  | 'book' | 'song' | 'school';

export type TechId =
  | 'plough' | 'three_fields' | 'mill'
  | 'lidded_store' | 'ledger'
  | 'fold' | 'dairy'
  | 'cistern' | 'drain'
  | 'herb_garden' | 'physician' | 'quarantine'
  | 'chimney' | 'slate'
  | 'fair_day' | 'rota' | 'scribes'
  | 'ballads' | 'press'
  | 'letters' | 'school';

export interface Effect {
  /** Souls the valley can hold, on top of what it held when it was found. */
  room?: number;
  /** Percent a year on the count, while there is room for it. */
  growth?: number;
  /** Points a year, on top of what the count gives. */
  minds?: number;
  /** Percent taken off what the long winter takes. */
  shelter?: number;
}

export interface SphereDef {
  id: SphereId;
  name: string;
  emoji: string;
  line: string;
}

export interface PathDef {
  id: PathId;
  sphere: SphereId;
  name: string;
  line: string;
}

export interface TechDef {
  id: TechId;
  path: PathId;
  name: string;
  line: string;
  /** Points. The step before it on the same path has to be known first. */
  cost: number;
  effect: Effect;
}

export const SPHERES: SphereDef[] = [
  { id: 'ground', name: 'The ground', emoji: '🌾', line: 'What the valley feeds, and how many of them.' },
  { id: 'body', name: 'The body', emoji: '⚕️', line: 'Who is still here in the spring.' },
  { id: 'word', name: 'The word', emoji: '📜', line: 'What the place writes down, sings, and teaches.' },
];

export const PATHS: PathDef[] = [
  { id: 'plough', sphere: 'ground', name: 'The field', line: 'More out of the same ground.' },
  { id: 'store', sphere: 'ground', name: 'The store', line: 'A good year, kept.' },
  { id: 'herd', sphere: 'ground', name: 'The herd', line: 'Animals doing the work of a wall and a winter.' },

  { id: 'water', sphere: 'body', name: 'The water', line: 'Clean in, dirty out.' },
  { id: 'healer', sphere: 'body', name: 'The healer', line: 'Somebody who knows what it was.' },
  { id: 'roof', sphere: 'body', name: 'The roof', line: 'A house that keeps the weather where it belongs.' },

  { id: 'book', sphere: 'word', name: 'The book', line: 'Things written down, so nobody has to remember them.' },
  { id: 'song', sphere: 'word', name: 'The song', line: 'What travels further than a cart.' },
  { id: 'school', sphere: 'word', name: 'The school', line: 'The clever ones, kept until they are useful.' },
];

/** Written path by path, first step first: the order is the chain. */
export const TECHS: TechDef[] = [
  // ---- the ground: the field ----
  {
    id: 'plough',
    path: 'plough',
    name: 'The turning plough',
    line: 'One ox does what two did, and complains about it less.',
    cost: 16,
    effect: { room: 30 },
  },
  {
    id: 'three_fields',
    path: 'plough',
    name: 'Three fields',
    line: 'One field rests while two work, and the resting one is not idle, it is thinking.',
    cost: 40,
    effect: { growth: 2 },
  },
  {
    id: 'mill',
    path: 'plough',
    name: 'The mill',
    line: 'The river grinds what forty arms ground, and has never once asked for a day off.',
    cost: 72,
    effect: { room: 60, minds: 1 },
  },

  // ---- the ground: the store ----
  {
    id: 'lidded_store',
    path: 'store',
    name: 'The lidded store',
    line: 'A good year kept in a jar, instead of eaten by November.',
    cost: 16,
    effect: { shelter: 5 },
  },
  {
    id: 'ledger',
    path: 'store',
    name: 'Double entry',
    line: 'The Treasurer finds a way to write the same coin twice, honestly.',
    cost: 42,
    effect: { minds: 1 },
  },

  // ---- the ground: the herd ----
  {
    id: 'fold',
    path: 'herd',
    name: 'The fold',
    line: 'The goats sleep behind a wall now, and the wolf has read the wall.',
    cost: 16,
    effect: { growth: 1, shelter: 3 },
  },
  {
    id: 'dairy',
    path: 'herd',
    name: 'The dairy',
    line: 'Cheese, which is milk that has learned to wait.',
    cost: 40,
    effect: { room: 40 },
  },

  // ---- the body: the water ----
  {
    id: 'cistern',
    path: 'water',
    name: 'The cistern',
    line: 'Rain kept from the roofs. Nobody drinks the mud any more.',
    cost: 16,
    effect: { growth: 2 },
  },
  {
    id: 'drain',
    path: 'water',
    name: 'The drain',
    line: 'The street runs downhill on purpose now, and the well is upstream of it.',
    cost: 40,
    effect: { room: 40 },
  },

  // ---- the body: the healer ----
  {
    id: 'herb_garden',
    path: 'healer',
    name: 'The herb garden',
    line: 'Somebody\'s aunt, with a fence round what she knows.',
    cost: 16,
    effect: { shelter: 4 },
  },
  {
    id: 'physician',
    path: 'healer',
    name: 'The trained physician',
    line: 'Somebody who has read about it, as well as done it.',
    cost: 44,
    effect: { growth: 2, shelter: 4 },
  },
  {
    id: 'quarantine',
    path: 'healer',
    name: 'The forty days',
    line: 'The sick wait at the gate, and the gate is polite about it.',
    cost: 72,
    effect: { shelter: 8 },
  },

  // ---- the body: the roof ----
  {
    id: 'chimney',
    path: 'roof',
    name: 'The chimney',
    line: 'The smoke leaves the house by the door it was given, and breakfast stops being a cough.',
    cost: 16,
    effect: { room: 30 },
  },
  {
    id: 'slate',
    path: 'roof',
    name: 'The slate roof',
    line: 'A roof that does not burn, on a street that had got used to it.',
    cost: 40,
    effect: { room: 30, shelter: 5 },
  },

  // ---- the word: the book ----
  {
    id: 'fair_day',
    path: 'book',
    name: 'The day off',
    line: 'Somebody works out that a day nobody works is worth more than the day of work.',
    cost: 14,
    effect: { growth: 1, minds: 1 },
  },
  {
    id: 'rota',
    path: 'book',
    name: 'The written rota',
    line: 'Who stands where, on paper, for the whole month. The watch stops arguing.',
    cost: 40,
    effect: { shelter: 3, minds: 1 },
  },
  {
    id: 'scribes',
    path: 'book',
    name: 'The fair copy',
    line: 'Clerks who can copy a law out clean, so it can be read by somebody who was not there.',
    cost: 72,
    effect: { minds: 2 },
  },

  // ---- the word: the song ----
  {
    id: 'ballads',
    path: 'song',
    name: 'The travelling ballad',
    line: 'Somebody sets your worst year to a tune, and people come to see where it happened.',
    cost: 16,
    effect: { growth: 2 },
  },
  {
    id: 'press',
    path: 'song',
    name: 'The letter press',
    line: 'Your laws, printed. The town can now misquote you accurately.',
    cost: 44,
    effect: { minds: 1, growth: 1 },
  },

  // ---- the word: the school ----
  {
    id: 'letters',
    path: 'school',
    name: 'Letters',
    line: 'Eleven children and one alphabet between them, and by spring it is the other way round.',
    cost: 18,
    effect: { minds: 1 },
  },
  {
    id: 'school',
    path: 'school',
    name: 'The school',
    line: 'A room where the clever ones are kept until they are useful, and fed in the meantime.',
    cost: 40,
    effect: { minds: 2 },
  },
];

/** The bench's own chrome. Everything the screen says is here and nowhere else. */
export const TREE_UI = {
  title: 'THE TREE AS A CHOICE',
  kicker: 'A bench, not the game: three spheres, one thing worked out at a time, and a count that grows on its own.',
  year: 'Year {n}',
  souls: '{n} of you',
  stage: { hamlet: 'a hamlet', town: 'a town', kingdom: 'a kingdom' },
  stageEmoji: { hamlet: '🏘️', town: '🏰', kingdom: '👑' },
  room: 'room for {n}',
  roomLine: 'How many the valley can feed and put up. The ground and the roof lift it; nothing else does.',
  growth: '{n}% a year',
  growthLine: 'How fast the count grows while there is room, slowing to nothing as it comes up on the room.',
  minds: '{n} points a year',
  mindsLine:
    '{base} for the year itself, one more for every {per} of you, and past {bendsAt} one for every {perPast}. This is the whole reason a bigger place thinks faster.',
  pot: '{n} in the pot',
  potLine: 'Points nobody is spending. They pour into the next thing you pick.',
  focusNone: 'Nobody is working anything out. Pick a card.',
  focusOn: 'Working out: {name}',
  progress: '{have} of {need}',
  years: 'about {n} years',
  oneYear: 'next spring',
  /** A card that could be started on, and how long it would take from here. */
  open: 'could start now, {when}',
  after: 'after {name}',
  known: 'worked out in year {n}',
  cost: '{n} points',
  effects: {
    room: 'room for {n} more',
    growth: '{n}% growth',
    minds: '{n} a year to think with',
    shelter: '{n} off the winter',
  },
  controls: {
    pause: 'Pause',
    play: 'Play',
    step: 'One year',
    speed: 'x{n}',
    anew: 'Begin anew',
    hand: 'the hand bench',
  },
  log: {
    heading: 'What happened',
    learned: 'Year {year}. {name}. {line}',
    winter: 'Year {year}. The long winter took {lost} of {had}.',
    winterNone: 'Year {year}. The long winter came, and the place was ready for it.',
    town: 'Year {year}. The charter: the hamlet is a town.',
    kingdom: 'Year {year}. The crown: the town is a kingdom.',
    empty: 'Nothing has happened yet. Pick a card and let the years run.',
  },
  rules: [
    'One thing is worked out at a time. Points go to it every spring, and what is left over waits in the pot.',
    'Every path is a chain: the second step opens when the first is known. Nothing on one path closes another. What closes it is the years.',
    'The count grows on its own toward the room, and the room is built. A place that never works out the ground can be a town and never a kingdom.',
    'Every tenth year is a long winter, which takes a share of the count unless something on the tree shelters it.',
  ],
};
