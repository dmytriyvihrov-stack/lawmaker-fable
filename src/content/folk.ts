/**
 * Who the people of this place are, as a shape rather than a name.
 *
 * One table serves three drawings: the portrait that stands in front of you
 * during a scene, the figure that goes on living in the town afterwards, and
 * the mark beside their name in the register. They are the same person at
 * three sizes, which only works if the things that identify them (what is on
 * their head, what is in their hands, and whether they carry the seal) are
 * written down once.
 *
 * The rule for a look is that it has to survive being eight pixels tall. A
 * face does not. A red hood does, a basket does, and a spade stuck in the
 * ground beside somebody does.
 */

export type FolkHair = 'crop' | 'long' | 'bald' | 'hood' | 'cap' | 'kerchief';

export type FolkProp =
  | 'basket'
  | 'stick'
  | 'spade'
  | 'pike'
  | 'ledger'
  | 'bottle'
  | 'bell'
  | 'quill'
  | 'reins';

/**
 * What a person is doing with their year, once you have met them.
 *
 * Every one of these is something somebody actually did in a scene, and the
 * town draws it afterwards: the point of the register is not that you met the
 * Digger, it is that there is somebody out on the edge strip with a spade and
 * you know why.
 */
export type Doing =
  | 'foraging'
  | 'trading'
  | 'milling'
  | 'digging'
  | 'tending'
  | 'preaching'
  | 'writing'
  | 'watching'
  | 'hauling'
  | 'pouring'
  | 'playing'
  | 'riding'
  | 'painting'
  | 'mourning'
  | 'resting'
  | 'mending'
  | 'running'
  | 'ferrying'
  | 'counting'
  | 'building'
  | 'prowling'
  /** Up on the common, being followed by animals that decided about you. */
  | 'herding'
  | 'gone';

export interface FolkLook {
  /** Head radius and how high it sits, in the portrait's 64 unit box. */
  r: number;
  y: number;
  hair?: FolkHair;
  prop?: FolkProp;
  /** The people whose job is reading things wear something to read them with. */
  specs?: boolean;
  /** Whether they carry the one colour in this picture that is not earth. */
  seal?: boolean;
  /** What they have on in the town band, where a coat is all there is room for. */
  cloth: 'poor' | 'work' | 'rich';
  /** What they are doing on any year nothing in particular has happened. */
  doing: Doing;
}

export const FOLK: Record<string, FolkLook> = {
  iva: { r: 9, y: 26, hair: 'long', prop: 'basket', seal: true, cloth: 'poor', doing: 'foraging' },
  tam: { r: 10, y: 27, hair: 'bald', prop: 'stick', cloth: 'work', doing: 'mending' },
  marta: { r: 9.5, y: 26, hair: 'kerchief', prop: 'spade', cloth: 'work', doing: 'tending' },
  millwright: {
    r: 10,
    y: 26,
    hair: 'cap',
    prop: 'spade',
    seal: true,
    cloth: 'work',
    doing: 'building',
  },
  riders: { r: 9, y: 25, hair: 'cap', prop: 'reins', seal: true, cloth: 'rich', doing: 'riding' },
  charter: {
    r: 9,
    y: 26,
    specs: true,
    hair: 'crop',
    prop: 'quill',
    cloth: 'rich',
    doing: 'writing',
  },
  miller: { r: 10.5, y: 27, hair: 'cap', prop: 'ledger', cloth: 'work', doing: 'milling' },
  lever: { r: 9.5, y: 27, hair: 'crop', prop: 'stick', cloth: 'work', doing: 'hauling' },
  pusher: { r: 11, y: 27, hair: 'crop', prop: 'bottle', cloth: 'work', doing: 'hauling' },
  healer: {
    r: 9.5,
    y: 26,
    specs: true,
    hair: 'kerchief',
    prop: 'bottle',
    seal: true,
    cloth: 'work',
    doing: 'tending',
  },
  widow: { r: 9.5, y: 26, hair: 'hood', prop: 'bell', cloth: 'poor', doing: 'mourning' },
  chaplain: {
    r: 9.5,
    y: 26,
    hair: 'hood',
    prop: 'bell',
    seal: true,
    cloth: 'work',
    doing: 'preaching',
  },
  clerk: { r: 9, y: 26, specs: true, hair: 'crop', prop: 'quill', cloth: 'work', doing: 'writing' },
  treasurer: {
    r: 9.5,
    y: 26,
    specs: true,
    hair: 'crop',
    prop: 'ledger',
    seal: true,
    cloth: 'rich',
    doing: 'counting',
  },
  captain: {
    r: 10,
    y: 26,
    specs: true,
    hair: 'cap',
    prop: 'pike',
    cloth: 'work',
    doing: 'watching',
  },
  fool: {
    r: 9.5,
    y: 26,
    specs: true,
    hair: 'crop',
    prop: 'bell',
    seal: true,
    cloth: 'rich',
    doing: 'playing',
  },
  crowd: { r: 9, y: 26, hair: 'crop', prop: 'stick', seal: true, cloth: 'work', doing: 'watching' },
  monarch: { r: 10, y: 26, hair: 'crop', prop: 'bell', seal: true, cloth: 'rich', doing: 'watching' },
  lark: { r: 8, y: 29, hair: 'crop', prop: 'stick', cloth: 'poor', doing: 'resting' },
  ferrier: {
    r: 10,
    y: 27,
    hair: 'cap',
    prop: 'ledger',
    seal: true,
    cloth: 'work',
    doing: 'ferrying',
  },
  players: {
    r: 9.5,
    y: 26,
    hair: 'hood',
    prop: 'bell',
    seal: true,
    cloth: 'rich',
    doing: 'playing',
  },
  singer: { r: 9.5, y: 26, hair: 'long', prop: 'bell', cloth: 'work', doing: 'playing' },
  runner: { r: 8, y: 29, hair: 'crop', prop: 'reins', seal: true, cloth: 'poor', doing: 'running' },
  brother: { r: 10, y: 27, hair: 'crop', prop: 'bottle', cloth: 'work', doing: 'pouring' },
  aunt: { r: 9, y: 27, hair: 'kerchief', prop: 'bell', cloth: 'poor', doing: 'resting' },
  digger: { r: 10, y: 26, hair: 'cap', prop: 'spade', cloth: 'work', doing: 'digging' },
  /** Small head, low on the shoulders, a stick and nothing else: he is sixteen. */
  odo: { r: 8, y: 29, hair: 'crop', prop: 'stick', cloth: 'poor', doing: 'herding' },
  wolf: { r: 10, y: 26, cloth: 'work', doing: 'prowling' },
};

export function folkLook(character: string | undefined): FolkLook {
  return FOLK[character ?? ''] ?? FOLK.clerk;
}

/**
 * You, and the four who walked out of the old place with you.
 *
 * These are not in `FOLK` on purpose. Nobody in this list ever comes to the
 * door, appears in the register or stands about in the town: they exist for
 * the one picture at the top of the first screen, which is the founding, and
 * that picture is drawn in exactly the same ink as every face after it so the
 * reign opens looking like the thing it is.
 *
 * You carry the seal, because on the second night the others voted and it was
 * you. The four behind you carry what people carry when they are leaving
 * somewhere for good: a spade, a basket, a stick, a bottle.
 *
 * Which five, though, is the reign's own. These are the tables the seed picks
 * out of, so two reigns do not walk out of the old place wearing each other's
 * faces, and the head you are given at the founding is the head on your own
 * row at the reckoning forty years later. The picking is
 * `foundingLooks()` in `engine/folk.ts`, because a seed going in and a shape
 * coming out is arithmetic and belongs there, not here.
 */

/** Head size and how high it sits. Five different people, not five sizes of one. */
export const FOUNDING_HEADS: readonly (readonly [number, number])[] = [
  [9, 25], [9.5, 26], [10, 26], [10.5, 27], [9, 27], [10, 27.5],
];

/** Six heads of hair for five people, so nobody is left with the last one. */
export const FOUNDING_HAIR: readonly FolkHair[] = [
  'crop', 'long', 'bald', 'hood', 'cap', 'kerchief',
];

/** What people carry when they are leaving somewhere for good. */
export const LEAVING_KIT: readonly FolkProp[] = [
  'basket', 'spade', 'stick', 'bottle', 'bell', 'reins',
];

/** What the thing in their hands says they will be doing by the second spring. */
export const KIT_DOING: Record<string, Doing> = {
  basket: 'foraging',
  spade: 'digging',
  stick: 'hauling',
  bottle: 'tending',
  bell: 'preaching',
  reins: 'riding',
};

/**
 * What each scene leaves a person doing afterwards.
 *
 * This is the whole trick: the Digger came to the door about ground that was
 * too hard to break, and from that year on there is somebody out on the edge
 * strip with a spade. The scene does not end when the card does. It moves into
 * the picture at the top of the screen and stays there.
 */
export const CASE_DOING: Record<string, Doing> = {
  v1_idle_hand: 'mending',
  v2_well: 'playing',
  v3_millwright: 'building',
  v4_hay: 'riding',
  t_town: 'writing',
  wv_hearth: 'tending',
  d1_pies: 'trading',
  d2_ashes: 'milling',
  d3_cart: 'hauling',
  d4_bridge: 'hauling',
  d5_deathbed: 'tending',
  d6_door: 'mourning',
  w_grain: 'counting',
  w_cold: 'tending',
  v5_winter_ground: 'digging',
  v6_road_dead: 'preaching',
  v7_beeches: 'foraging',
  v8_long_night: 'tending',
  w_corner: 'resting',
  x_plague: 'tending',
  x_ruin: 'counting',
  c1_lark: 'resting',
  c2_toll: 'ferrying',
  s1_worms: 'playing',
  s2_ballad: 'playing',
  w_race: 'running',
  w_bees: 'tending',
  w_honey: 'counting',
  w_pot: 'counting',
  w_brother: 'pouring',
  w_brother_fire: 'pouring',
  w_brother_easel: 'painting',
  tr_accused: 'mending',
  tr_accused_wrong: 'writing',
  tr_accused_again: 'mending',
  w_goats: 'herding',
  w_wolf: 'prowling',
  w_wolf_dog: 'prowling',
  w_wolf_back: 'prowling',
  // the ones who come back: the fence is Tam's whatever you said to him the
  // first time, and Marta is on whatever ground she has left
  r1_tam_fed: 'mending',
  r1_tam_cut: 'digging',
  r2_marta_kept: 'tending',
  r2_marta_moved: 'resting',
};

/**
 * The handful of answers that change what somebody does with the rest of their
 * life, keyed by scene and answer together. Everything not in here leaves the
 * person doing what the scene left them doing, which is the usual case: most
 * rulings change a number and not a day.
 */
export const CHOICE_DOING: Record<string, Doing> = {
  // Tam is the first person anybody meets, and what he does for the rest of
  // the reign is the plainest example of the whole idea: fed, he mends the
  // fence sitting down; given half a share, he works half days; cut off, he
  // is out on the ground doing what a back that hurts should not
  'v1_idle_hand:feed_him': 'mending',
  'v1_idle_hand:half_share': 'digging',
  'v1_idle_hand:no_work_no_bread': 'digging',
  'v1_idle_hand:cut_his_share': 'digging',
  'v1_idle_hand:his_own_field': 'digging',
  // the one answer that gives him a job rather than a verdict
  'v1_idle_hand:headman_decides': 'building',
  // a goat in every yard is a goat in every yard, and the boy who walked them
  // has his basket back and the beeches to take it to
  'w_goats:split_them': 'foraging',
  // the basket burns at noon, so she is back out in the beeches by autumn
  'd1_pies:barred': 'foraging',
  'd1_pies:fine_anyway': 'foraging',
  'd1_pies:guild': 'milling',
  // she asked for the door open and the window open, and lasted until the frost
  'w_corner:she_is_asked': 'gone',
  // the board goes behind the long house and he is in the field by the Monday
  'w_brother_easel:back_to_the_field': 'tending',
  // the wind: a fence going up is a man pointing at where the posts go, and a
  // man paid like a stranger or asked at the gap is at the fence again
  'r1_tam_fed:tam_says_where': 'building',
  'r1_tam_cut:ask_him_yourself': 'building',
  'r1_tam_cut:pay_him_like_a_stranger': 'building',
  // the ground: taken from her a second time, she goes down the road; taken
  // from her the once, she has a chair by the long house
  'r2_marta_kept:kept_once_not_forever': 'resting',
  'r2_marta_kept:the_half_she_offers': 'tending',
  'r2_marta_kept:other_ground': 'tending',
  'r2_marta_moved:take_it_as_before': 'gone',
  'r2_marta_moved:her_price': 'tending',
  'r2_marta_moved:the_mill_pays': 'tending',
};


/**
 * What the cold does to a day's work.
 *
 * Three seasons out of four, somebody does the thing the scene left them
 * doing. The fourth is the one where the beeches are bare, the ground is iron
 * and the boat is up on the bank, and a person drawn picking mushrooms in a
 * snowfield is a person drawn wrong.
 *
 * Only the work moves. Whoever sat down has sat down, and no weather changes
 * that: resting, pouring and mending are absent from this table on purpose,
 * and so is the one who is not here any more.
 */
export const WINTER_DOING: Partial<Record<Doing, Doing>> = {
  // nothing grows in the wood, but there is wood in it
  foraging: 'hauling',
  // the whole of the frozen ground dilemma is that you cannot
  digging: 'mending',
  // nothing goes up in a frost
  building: 'mending',
  // the boat comes out of the water
  ferrying: 'mending',
  // the roads are shut, so the horse stays in and the gate gets watched
  riding: 'watching',
  running: 'hauling',
  // a market row in a blizzard is two boards and nobody
  trading: 'milling',
  // the goats are in, and somebody still has to carry fodder to them
  herding: 'hauling',
};

/**
 * How old they were the year they first stood in front of you.
 *
 * The three the scenes say out loud are the three the scenes say: Iva is nine,
 * Lark is twelve, Nell is seventy one and entirely herself. The rest are set
 * here, once, and then simply get older, the way the crown upstairs does. A
 * register that says a girl of nine came to the door in year three, and it is
 * now year twenty, is telling you something the log cannot.
 */
export const AGES: Record<string, number> = {
  iva: 9,
  lark: 12,
  aunt: 71,
  tam: 58,
  marta: 34,
  millwright: 41,
  riders: 30,
  charter: 47,
  miller: 52,
  lever: 36,
  pusher: 44,
  healer: 49,
  widow: 63,
  chaplain: 55,
  clerk: 38,
  treasurer: 57,
  captain: 43,
  fool: 29,
  ferrier: 46,
  players: 33,
  singer: 26,
  runner: 11,
  brother: 40,
  digger: 48,
  odo: 16,
  crowd: 0,
  monarch: 0,
  wolf: 0,
};

/** What the register says they are up to now, in the words the town would use. */
export const DOING_LINES: Record<Doing, string> = {
  foraging: 'Out in the beeches with a basket.',
  trading: 'Behind a board on the market row.',
  milling: 'Carrying sacks across the yard.',
  digging: 'On the strip at the edge, with a spade.',
  tending: 'Going door to door with the bottle.',
  preaching: 'Out where the road comes in, with the bell.',
  writing: 'At the desk, writing it all down.',
  watching: 'Standing at the gate, watching the road.',
  hauling: 'On the road home under a load.',
  pouring: 'Sat outside the long room with a bottle.',
  playing: 'Making a noise in the square.',
  riding: 'Somewhere out on the road, on a horse.',
  painting: 'Looking at the place, and painting it.',
  mourning: 'Out at the stones, most evenings.',
  resting: 'Sitting down, in the sun if there is any.',
  mending: 'Mending the fence, sitting down.',
  running: 'Running somewhere, as usual.',
  ferrying: 'Out on the water with the pole.',
  counting: 'Counting something that has been counted already.',
  building: 'Up a frame, with a hammer.',
  prowling: 'Out past the last roof, moving.',
  herding: 'Up on the common, with the goats behind him.',
  gone: 'Not here any more. The window was left open.',
};

/**
 * Where in the picture each of those happens.
 *
 * Tied to the doing rather than to the person, so nobody ends up fishing on a
 * roof: the water is the river on the right, the beeches are the far bank, the
 * market row is the square, and the strip at the edge is the ground west of
 * the furrows. The span is how far they walk: the band takes them from the
 * spot to the spot plus the span and back, so the ground somebody covers is x
 * to x plus span rather than either side of x. It is nought for the ones who
 * have sat down.
 *
 * The numbers are in the picture's own box, 1440 by 820, and a foot is where
 * the y is. Nothing is stationed on the near meadow below 560, because that is
 * the strip the popup floats over and a person under a card is a person
 * nobody can see.
 */
export const STATIONS: Record<Doing, { x: number; y: number; span: number }> = {
  foraging: { x: 1268, y: 548, span: 54 },
  trading: { x: 716, y: 432, span: 22 },
  milling: { x: 996, y: 380, span: 26 },
  digging: { x: 306, y: 468, span: 24 },
  tending: { x: 636, y: 442, span: 44 },
  preaching: { x: 772, y: 274, span: 12 },
  writing: { x: 618, y: 402, span: 8 },
  watching: { x: 736, y: 262, span: 12 },
  hauling: { x: 924, y: 414, span: 74 },
  pouring: { x: 1064, y: 288, span: 0 },
  playing: { x: 792, y: 402, span: 30 },
  riding: { x: 1176, y: 514, span: 84 },
  painting: { x: 700, y: 462, span: 0 },
  mourning: { x: 430, y: 500, span: 10 },
  resting: { x: 596, y: 482, span: 0 },
  mending: { x: 592, y: 258, span: 0 },
  running: { x: 962, y: 442, span: 116 },
  ferrying: { x: 1148, y: 508, span: 52 },
  counting: { x: 1030, y: 362, span: 8 },
  building: { x: 896, y: 332, span: 14 },
  prowling: { x: 1180, y: 250, span: 76 },
  // the top of the common, above the goats and well clear of the card
  herding: { x: 206, y: 556, span: 46 },
  gone: { x: 0, y: 0, span: 0 },
};
