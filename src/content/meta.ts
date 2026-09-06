import type {
  ActionId,
  AdvisorId,
  CityFlag,
  PlotId,
  Season,
  StatId,
  SubjectId,
  WorkId,
} from '../engine/types';

export const SUBJECTS: { id: SubjectId; label: string; emoji: string }[] = [
  { id: 'work', label: 'Work', emoji: '🌾' },
  { id: 'strangers', label: 'Strangers', emoji: '🚶' },
  { id: 'dead', label: 'The dead', emoji: '🪦' },
  { id: 'mushrooms', label: 'The wood', emoji: '🍄' },
  { id: 'trade', label: 'Trade', emoji: '🧺' },
  { id: 'lives', label: 'Lives', emoji: '⚖️' },
  { id: 'truth', label: 'Truth', emoji: '🗣️' },
  { id: 'crime', label: 'Wrongdoing', emoji: '🧹' },
  { id: 'song', label: 'Songs', emoji: '🎶' },
];

export const ACTIONS: { id: ActionId; label: string; emoji: string }[] = [
  { id: 'shared', label: 'Shared', emoji: '🤝' },
  { id: 'ruled', label: 'Ruled', emoji: '👆' },
  { id: 'owned', label: 'Owned', emoji: '🏠' },
  { id: 'welcomed', label: 'Welcomed', emoji: '🚪' },
  { id: 'earned', label: 'Earned', emoji: '⏳' },
  { id: 'turned_away', label: 'Turned away', emoji: '⛔' },
  { id: 'with_a_day', label: 'With a day', emoji: '🕯️' },
  { id: 'by_the_house', label: 'By the house', emoji: '🏠' },
  { id: 'at_the_edge', label: 'At the edge', emoji: '🌾' },
  { id: 'finders', label: 'Finders', emoji: '🧺' },
  { id: 'weighed', label: 'Weighed', emoji: '⚖️' },
  { id: 'for_the_cart', label: 'For the cart', emoji: '🛒' },
  { id: 'free', label: 'Free', emoji: '🕊️' },
  { id: 'taxed', label: 'Taxed', emoji: '🪙' },
  { id: 'licensed', label: 'Licensed', emoji: '📋' },
  { id: 'by_count', label: 'By the count', emoji: '🔢' },
  { id: 'by_lot', label: 'By lot', emoji: '🎲' },
  { id: 'untouchable', label: 'Untouchable', emoji: '🚫' },
  { id: 'mandatory', label: 'Mandatory', emoji: '📏' },
  { id: 'kind_lies', label: 'Kind lies', emoji: '🕯️' },
  { id: 'forgiven', label: 'Forgiven', emoji: '🍞' },
  { id: 'repaid', label: 'Repaid twice', emoji: '⚖️' },
  { id: 'hanged', label: 'Hanged', emoji: '🪵' },
  { id: 'worthy', label: 'Worthy', emoji: '🎻' },
  { id: 'by_crowd', label: 'By the crowd', emoji: '👏' },
  { id: 'by_hat', label: 'By the hat', emoji: '🎩' },
];

export const ADVISORS: Record<AdvisorId, { label: string; emoji: string }> = {
  treasurer: { label: 'The Treasurer', emoji: '🧮' },
  healer: { label: 'The Healer', emoji: '🌡️' },
  captain: { label: 'The Captain', emoji: '🛡️' },
  fool: { label: 'The Fool', emoji: '🃏' },
};

export const CHARACTERS: Record<string, { label: string; emoji: string }> = {
  monarch: { label: 'The Monarch', emoji: '👑' },
  iva: { label: 'Iva', emoji: '🧺' },
  widow: { label: 'The Widow', emoji: '🕯️' },
  miller: { label: 'The Miller', emoji: '🌾' },
  lever: { label: 'The Lever Man', emoji: '🕹️' },
  pusher: { label: 'The Cooper', emoji: '🛢️' },
  chaplain: { label: 'The Chaplain', emoji: '⛪' },
  clerk: { label: 'The Clerk', emoji: '🖋️' },
  tam: { label: 'Tam', emoji: '🧓' },
  marta: { label: 'Marta', emoji: '🌱' },
  millwright: { label: 'The Mill-Wright', emoji: '⚙️' },
  riders: { label: 'The Riders', emoji: '🐎' },
  charter: { label: 'The Crown Clerk', emoji: '📜' },
  treasurer: { label: 'The Treasurer', emoji: '🧮' },
  healer: { label: 'The Healer', emoji: '🌡️' },
  captain: { label: 'The Captain', emoji: '🛡️' },
  fool: { label: 'The Fool', emoji: '🃏' },
  crowd: { label: 'The Square', emoji: '🔥' },
  lark: { label: 'Lark', emoji: '🧥' },
  ferrier: { label: 'The Ferrier', emoji: '🛶' },
  wolf: { label: 'The Wolf', emoji: '🐺' },
  players: { label: 'The Players', emoji: '🎭' },
  singer: { label: 'The Singer', emoji: '🪕' },
  runner: { label: 'Wat', emoji: '🏇' },
  brother: { label: 'Your Brother', emoji: '🍶' },
  aunt: { label: 'Nell', emoji: '🛏️' },
  digger: { label: 'The Digger', emoji: '⛏️' },
  odo: { label: 'Odo', emoji: '🐐' },
};

export const STATS: { id: StatId; label: string; emoji: string }[] = [
  { id: 'crownSanity', label: 'Monarch', emoji: '👑' },
  { id: 'mood', label: 'Mood', emoji: '😊' },
  { id: 'health', label: 'Health', emoji: '⚕️' },
  { id: 'economy', label: 'Economy', emoji: '💰' },
  { id: 'army', label: 'The watch', emoji: '🛡️' },
  { id: 'culture', label: 'Culture', emoji: '🎻' },
];

/**
 * The square has a face, and it is the only board that does. Three of them:
 * sour, even, and pleased. The face is read before anything else on the header
 * is, so it has to be the reading and not a decoration next to one.
 */
export const MOOD_FACES: { upTo: number; emoji: string }[] = [
  { upTo: 33, emoji: '🙁' },
  { upTo: 66, emoji: '😊' },
  { upTo: 100, emoji: '😄' },
];

/** Which face the square is wearing at that value. */
export function moodFace(value: number): string {
  for (const face of MOOD_FACES) {
    if (value <= face.upTo) return face.emoji;
  }
  return MOOD_FACES[MOOD_FACES.length - 1].emoji;
}

/** The wheel of the year, in the order it turns. */
export const SEASONS: { id: Season; label: string; emoji: string }[] = [
  { id: 'spring', label: 'Spring', emoji: '🌱' },
  { id: 'summer', label: 'Summer', emoji: '☀️' },
  { id: 'autumn', label: 'Autumn', emoji: '🍂' },
  { id: 'winter', label: 'Winter', emoji: '❄️' },
];

export function seasonMeta(id: Season) {
  return SEASONS.find((s) => s.id === id)!;
}

export function subjectMeta(id: SubjectId) {
  return SUBJECTS.find((s) => s.id === id)!;
}

export function actionMeta(id: ActionId) {
  return ACTIONS.find((a) => a.id === id)!;
}

export function characterMeta(id: string | undefined) {
  if (!id) return CHARACTERS.monarch;
  return CHARACTERS[id] ?? CHARACTERS.monarch;
}

/**
 * Where in the place each case is happening.
 *
 * The mark on the town is what turns a dilemma from a story into an address,
 * so every one of these is the spot the scene actually describes: the gate,
 * the well, the steps of the hall, the strip at the edge where the ground is
 * iron. The numbers are in the picture's own box, 1440 by 820.
 *
 * They all sit above the near meadow on purpose. The card that carries the
 * scene comes up from the bottom of the window and floats over that meadow, so
 * a mark placed down there is a mark under the card that is pointing at it.
 */
export const CASE_SPOTS: Record<string, { x: number; y: number }> = {
  /* the fence, where a man who cannot dig sits and mends it */
  v1_idle_hand: { x: 604, y: 258 },
  v2_well: { x: 790, y: 448 },
  v3_millwright: { x: 900, y: 336 },
  /* the near meadow, where the hay is */
  v4_hay: { x: 322, y: 438 },
  wv_hearth: { x: 690, y: 452 },
  /* a charter is read from the steps */
  t_town: { x: 709, y: 417 },
  /* Iva, at the north gate, which is where the road comes through the fence */
  d1_pies: { x: 756, y: 248 },
  d2_ashes: { x: 1008, y: 358 },
  d3_cart: { x: 906, y: 392 },
  d4_bridge: { x: 1052, y: 452 },
  d5_deathbed: { x: 546, y: 440 },
  d6_door: { x: 700, y: 452 },
  w_grain: { x: 1014, y: 356 },
  w_cold: { x: 650, y: 278 },
  x_revolt: { x: 770, y: 424 },
  x_plague: { x: 1052, y: 268 },
  x_ruin: { x: 1014, y: 356 },
  /* the milestone that points at the capital */
  x_abdication: { x: 1206, y: 524 },
  x_flight: { x: 1252, y: 534 },
  c1_lark: { x: 706, y: 436 },
  c2_toll: { x: 1150, y: 462 },
  /* out past the last roof, at the edge of the wood */
  w_wolf: { x: 1156, y: 262 },
  w_wolf_dog: { x: 618, y: 438 },
  /* not the woodpile this time: the pens, which is closer in than it was */
  w_wolf_back: { x: 900, y: 440 },
  s1_worms: { x: 738, y: 430 },
  s2_ballad: { x: 806, y: 412 },
  w_race: { x: 966, y: 420 },
  /* the top of the common, above the goats and clear of the beeches */
  w_goats: { x: 170, y: 436 },
  w_bees: { x: 248, y: 452 },
  w_honey: { x: 248, y: 452 },
  w_pot: { x: 548, y: 428 },
  x_square: { x: 770, y: 424 },
  w_brother: { x: 1046, y: 292 },
  w_brother_fire: { x: 1014, y: 356 },
  w_brother_easel: { x: 736, y: 440 },
  /* the strip at the edge, which is the ground that will not break */
  v5_winter_ground: { x: 318, y: 448 },
  v6_road_dead: { x: 872, y: 376 },
  v7_beeches: { x: 1306, y: 512 },
  v8_long_night: { x: 704, y: 440 },
  w_corner: { x: 500, y: 430 },
  /* the ones who come back: Tam at the gap in the fence by the gate, Marta on
     the strip along the stream, on the town side of the water */
  r1_tam_fed: { x: 640, y: 262 },
  r1_tam_cut: { x: 640, y: 262 },
  r2_marta_kept: { x: 1000, y: 452 },
  r2_marta_moved: { x: 1000, y: 452 },
  /* the trials, which are heard where a decree is read */
  tr_accused: { x: 709, y: 417 },
  tr_accused_wrong: { x: 709, y: 417 },
  tr_accused_again: { x: 709, y: 417 },
};

/**
 * What the place calls the things it has built, written on the picture beside
 * them in the same hand the ghost of a building writes its own name. A work
 * with no name here is one that leaves nothing standing to be named.
 */
/**
 * One mark per thing a year can be spent on.
 * 
 * The year of work is a shelf of cards that all open with the same weight of
 * prose, and picking the road out of them meant reading six sentences. A mark
 * in front of the name is read before the name is: the eye finds the axe, the
 * bridge or the bell first and only then asks what it costs.
 */
export const WORK_ICONS: Record<WorkId, string> = {
  fields: '🌾',
  well: '💧',
  fence: '🚧',
  mine: '⛏️',
  granary: '🧺',
  watch_house: '🗼',
  long_room: '🛏️',
  hall: '🔔',
  road: '🛣️',
  bridge: '🌉',
  fair: '🎪',
  rest: '🌙',
};

/**
 * What the place calls each piece of ground it can build on.
 *
 * Nobody in a hamlet says "plot four". They say it is going up by the gate, or
 * on the cart ground, or under the crag, and a year later that is where
 * everybody says it is. The line under each name is what you are giving up by
 * spending it, because that is the only reason the choice is a choice.
 */
export const PLOT_NAMES: Record<PlotId, { label: string; line: string }> = {
  north_gate: {
    label: 'By the gate',
    line: 'Where the road comes in. Whatever stands here is the first thing a stranger sees.',
  },
  east_rise: {
    label: 'The east rise',
    line: 'Above the water, out of the wet, and a walk from everybody who would use it.',
  },
  cart_ground: {
    label: 'The cart ground',
    line: 'Flat, hard and wide enough to turn on. The only ground here a loaded cart can reach.',
  },
  square_west: {
    label: 'West of the square',
    line: 'In the middle of it all. Anything here is somewhere people already are.',
  },
  well_side: {
    label: 'By the well',
    line: 'The busiest ground in the place, and the wettest. People queue here anyway.',
  },
  west_strip: {
    label: 'Under the crag',
    line: 'The strip the furrows gave back. Quiet, stony, and a long way from the square.',
  },
};

export const PLACE_NAMES: Partial<Record<WorkId, string>> = {
  watch_house: 'watch house',
  long_room: 'long room',
  granary: 'granary',
  hall: 'the hall',
  well: 'the well',
  bridge: 'the bridge',
  mine: 'the cut',
};

/** The two places on the far bank that were there before anybody was. */
/** Where a decree happens: on the steps of the hall, in the middle of it all. */
export const LAW_SPOT = { x: 709, y: 417 };

/** Where a year of work is chosen from, which is the square it is argued in. */
export const WORKS_SPOT = { x: 770, y: 424 };

/** What each city layer means, in one line. Shown when a scene switches it on or off. */
export const CITY_LABELS: Record<CityFlag, { on: string; off: string; emoji: string }> = {
  tavern_shuttered: { on: 'The tavern boards up', off: 'The tavern opens its shutters', emoji: '🍺' },
  tavern_rowdy: { on: 'The market spills into the street', off: 'The market pulls back to the square', emoji: '🎺' },
  bread_queue: { on: 'A bread queue forms at dawn', off: 'The bread queue thins out', emoji: '🍞' },
  baron_banner: { on: 'The Guild hangs its banner over the market', off: 'The Guild banner comes down', emoji: '🏴' },
  share_stalls: { on: 'Licence stalls open on the market row', off: 'The licence stalls close', emoji: '📋' },
  gates_closed: { on: 'The gates close', off: 'The gates open', emoji: '🚪' },
  camp_outside: { on: 'A camp grows outside the wall', off: 'The camp outside breaks up', emoji: '⛺' },
  exam_desk: { on: 'A desk appears at the gate', off: 'The desk at the gate is gone', emoji: '📝' },
  meadow_fenced: { on: 'A fence goes up on the meadow', off: 'The fence comes down', emoji: '🚧' },
  goat_parade: { on: 'Goats spread over the common', off: 'The goats are moved off', emoji: '🐐' },
  dragon_roost: { on: 'Something large settles on the roof', off: 'The roof is empty again', emoji: '🐉' },
  bunting: { on: 'Bunting goes up across the square', off: 'The bunting comes down', emoji: '🎉' },
  quack_row: { on: 'Licence sellers line the fountain', off: 'The licence sellers pack up', emoji: '⚗️' },
  war_banners: { on: 'The scales are raised on both gates', off: 'The scales come down', emoji: '⚖️' },
  mourning_ribbons: { on: 'Mourning ribbons on the doors', off: 'The ribbons are taken down', emoji: '🎗️' },
  smuggler_lanterns: { on: 'Lanterns appear in the back lanes', off: 'The back lanes go dark', emoji: '🏮' },
  wolf_at_the_edge: { on: 'Something grey keeps to the edge of the light', off: 'The edge of the light is empty again', emoji: '🐺' },
  dogs_about: { on: 'There are dogs underfoot everywhere', off: 'The dogs are gone from the yards', emoji: '🐕' },
  easel_in_the_square: { on: 'Somebody is painting the place, in the middle of it', off: 'The board on three legs is gone from the square', emoji: '🖼️' },
  graves_at_the_edge: { on: 'Stones go up on the strip at the edge', off: 'The strip at the edge is bare ground again', emoji: '🪦' },
  graves_in_the_yards: { on: 'A stone stands in three of the yards', off: 'The stones are gone from the yards', emoji: '🪦' },
};

/**
 * A mark for each kind of thing that pulls on a board, so every card that
 * explains a trend explains it in the same shape.
 */
export const SOURCE_ICONS: Record<string, string> = {
  law: '📜',
  work: '🪵',
  tech: '⚙️',
  monarch: '👑',
  drift: '👑',
  crowd: '🚶',
  winter: '❄️',
  health: '⚕️',
  mood: '😊',
  ground: '🌾',
  births: '👶',
  animals: '🐕',
  lover: '💗',
  other: '•',
};
