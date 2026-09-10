import type { PlotId, WorkId } from '../../../engine/types';

/**
 * The place, drawn 1:1 in this box.
 *
 * Everything laid on top of the picture is aimed at these numbers: where a
 * building stands, where a case is happening, where somebody you have met is
 * standing about. The settlement lives in the top two thirds; the bottom is
 * the near meadow, which the popup floats over and never eats.
 */
export const MAP = { w: 1440, h: 820 };

/**
 * The two edges of the country as a fraction of the height, so a thing that
 * belongs to the ground is never drawn into the sky.
 */
export const HORIZON = 200;

/**
 * Where each thing a year can be spent on stands.
 *
 * The anchor is the top left of the drawing, the way the mockup laid them out,
 * and `label` is where a ghost writes its own name. A work with no entry here
 * leaves nothing standing: a fair is a day, and rest is a year off.
 */
export const WORK_SITES: Partial<
  Record<
    WorkId,
    {
      x: number;
      y: number;
      scale: number;
      label: { x: number; y: number };
      /**
       * Where the frame stands while the thing is being raised, and how big it
       * is. A scaffold has to stand round the building rather than beside it,
       * and a granary is twice the width of a well: this is the foot of the
       * frame in the building's own coordinates, and the size it is built at.
       */
      frame?: { x: number; y: number; s: number };
    }
  >
> = {
  watch_house: { x: 566, y: 262, scale: 0.8, label: { x: 30, y: -14 }, frame: { x: 30, y: 54, s: 1.05 } },
  long_room: { x: 1004, y: 250, scale: 0.86, label: { x: 66, y: -12 }, frame: { x: 68, y: 48, s: 1.8 } },
  /* Clear of the wood on purpose: the beeches were standing on the roof of
     it, and a granary in a wood is a granary nobody can get a cart to. */
  granary: { x: 936, y: 330, scale: 1, label: { x: 56, y: -12 }, frame: { x: 56, y: 60, s: 1.7 } },
  hall: { x: 640, y: 345, scale: 1.05, label: { x: 66, y: -44 }, frame: { x: 66, y: 66, s: 2 } },
  well: { x: 790, y: 442, scale: 1, label: { x: 0, y: -40 }, frame: { x: 0, y: 11, s: 0.8 } },
  bridge: { x: 1090, y: 482, scale: 1, label: { x: 0, y: -52 } },
  /* The road has no footprint: this is only where its name and its ghost go. */
  road: { x: 940, y: 404, scale: 1, label: { x: 0, y: -18 } },
  fence: { x: 560, y: 250, scale: 1, label: { x: 220, y: -18 } },
  fields: { x: 300, y: 300, scale: 1, label: { x: 160, y: -12 } },
  mine: { x: 114, y: 344, scale: 1, label: { x: 0, y: 44 } },
  /* At the trees, because that is the whole idea of it: the cabin stands where
     the wood is, clear of the front rank the cutters work. Out of them now,
     though, and a little way back down the slope towards the roofs: standing
     inside the front rank it was a roof among trunks that read as one more
     dark shape in the wood, and the whole point of a saw pit is that the wood
     comes down to the place rather than the place going up into the wood. */
  woodcutter: { x: 1166, y: 350, scale: 0.9, label: { x: 34, y: -16 }, frame: { x: 34, y: 46, s: 1.1 } },
  /* A house goes up among the other roofs and not on its own. This is the
     ground for the first one; the rest arrive as roofs with the count. */
  house: { x: 610, y: 402, scale: 0.92, label: { x: 28, y: -14 }, frame: { x: 28, y: 44, s: 1 } },
};

/**
 * The pieces of ground a building can be put on: six a hamlet has, and three
 * more the charter opens.
 *
 * Five of the first six are where the picture always stood those buildings, so
 * a reign that puts everything where it used to go looks exactly like the reign
 * before placement existed. The sixth is the strip under the crag, which only
 * became ground anybody could use when the furrows stopped running halfway
 * across the valley. `plotsFor()` in `plots.ts` says which of them a place of
 * this size has.
 *
 * Position and depth come from the plot; what a building calls itself and how
 * big its frame is come from the building, because those are facts about the
 * thing and not about the field it is standing in.
 */
export const PLOT_SITES: Record<PlotId, { x: number; y: number; scale: number }> = {
  north_gate: { x: 566, y: 262, scale: 0.8 },
  east_rise: { x: 1004, y: 250, scale: 0.86 },
  cart_ground: { x: 936, y: 330, scale: 1 },
  square_west: { x: 640, y: 345, scale: 1.05 },
  well_side: { x: 790, y: 442, scale: 1 },
  west_strip: { x: 176, y: 398, scale: 0.9 },
  /* The three a charter opens. None of them is ground a hamlet had any reason
     to walk: the high shoulder over the gate, the bend where the road comes
     down to the water, and the strip between the last furrow and the first
     roof. Placed off the map's own numbers rather than off a screenshot, and
     checked against every hut, every work site and the river. */
  north_field: { x: 706, y: 214, scale: 0.72 },
  mill_end: { x: 1046, y: 392, scale: 0.94 },
  stone_row: { x: 506, y: 388, scale: 0.9 },
};

/** Where the marker for an empty plot sits, so a dot lands on its ground. */
export const PLOT_MARK: Record<PlotId, { x: number; y: number }> = {
  north_gate: { x: 590, y: 300 },
  east_rise: { x: 1050, y: 292 },
  cart_ground: { x: 990, y: 374 },
  square_west: { x: 700, y: 396 },
  well_side: { x: 790, y: 462 },
  west_strip: { x: 216, y: 442 },
  north_field: { x: 730, y: 250 },
  mill_end: { x: 1096, y: 430 },
  stone_row: { x: 540, y: 424 },
};

/**
 * The roofs, in the order they go up.
 *
 * A place of five has one hut and a fire in it; a place of two hundred has the
 * whole of this list. The order is the order somebody would actually build in,
 * and it starts high in the picture on purpose: the card that opens over the
 * town covers the near meadow, so the first roof a new reign has has to stand
 * where it can be seen.
 */
export interface HutSite {
  x: number;
  y: number;
  scale: number;
  kind: 0 | 1;
}

export const HUT_SITES: HutSite[] = [
  { x: 816, y: 378, scale: 1, kind: 0 },
  { x: 650, y: 272, scale: 0.84, kind: 1 },
  { x: 846, y: 266, scale: 0.84, kind: 0 },
  { x: 748, y: 300, scale: 0.8, kind: 1 },
  { x: 560, y: 332, scale: 0.86, kind: 0 },
  { x: 896, y: 318, scale: 0.8, kind: 1 },
  { x: 952, y: 424, scale: 1, kind: 0 },
  { x: 700, y: 466, scale: 1.14, kind: 1 },
  { x: 542, y: 448, scale: 1.14, kind: 0 },
  { x: 872, y: 480, scale: 1.06, kind: 1 },
  { x: 620, y: 508, scale: 1.16, kind: 0 },
  { x: 462, y: 512, scale: 1.2, kind: 1 },
];

/**
 * The far bank, once there is a way over the water.
 *
 * The bridge's own line says it: the far bank stops being a day away, and
 * people build on that side now. These are the two pieces of ground over
 * there a roof can stand on, one above the road on the shoulder by the big
 * trees and one below it on the top of the far meadow, and they are opened
 * only while a bridge stands. They come after the near sites rather than
 * among them, because the picture has no memory: a site that took its turn
 * earlier would move a roof that was already standing across the river the
 * year the bridge was paid for. So the far bank fills last, in a place big
 * enough to have filled the near bank, and everybody living there walks to
 * work over the bridge (`homeDoor`, `walkOver` in `paths.ts`).
 *
 * Checked against the water: the river at x 1296 runs at about y 403 and
 * its bank reaches 441; the road at level two passes under the first site at
 * about y 538, and over the second at about y 528. Neither site touches
 * either.
 */
export const FAR_SITES: HutSite[] = [
  { x: 1296, y: 460, scale: 0.86, kind: 1 },
  { x: 1188, y: 600, scale: 0.9, kind: 0 },
];

/** Where a roof can go this reign: the near bank, and the far bank once bridged. */
export function hutSites(bridged: boolean): HutSite[] {
  return bridged ? [...HUT_SITES, ...FAR_SITES] : HUT_SITES;
}

/**
 * Where a work actually stands in this reign.
 *
 * Position and depth come from the ground it was put on; what it calls itself
 * and how big a frame goes round it while it is being raised come from the
 * building, because those are facts about the thing and not about the field.
 * A work nobody chose ground for stands where the picture always put it, which
 * is what every save written before the year of work asked the question does.
 */
export function siteOf(
  id: WorkId,
  placements?: Partial<Record<WorkId, PlotId>>,
): (typeof WORK_SITES)[WorkId] {
  const base = WORK_SITES[id];
  const plot = placements?.[id];
  if (base === undefined || plot === undefined) return base;
  const ground = PLOT_SITES[plot];
  return { ...base, x: ground.x, y: ground.y, scale: ground.scale };
}

/** Which chimneys are smoking, in the order they light up as the cold comes on. */
export const SMOKE_ORDER = [0, 2, 1, 4, 3, 5];

/**
 * The square, which is where a crowd is a crowd.
 *
 * People are scattered over it and along the lanes off it by a fixed rule, so
 * the same count of souls always draws the same street and nobody teleports
 * between two renders of the same year.
 */
export const SQUARE = { x: 770, y: 424, rx: 168, ry: 66 };

/** The lane out of the square, north to the gate and south to the meadow path. */
export const LANE = [
  { x: 756, y: 260 },
  { x: 764, y: 320 },
  { x: 770, y: 380 },
  { x: 700, y: 448 },
  { x: 640, y: 490 },
  { x: 850, y: 452 },
  { x: 920, y: 404 },
  { x: 600, y: 420 },
];

/** The furrows, where the work is in the three growing seasons. */
export const FIELD_BAND = { x: 288, y: 306, w: 190, h: 176 };

/**
 * Where the work of a year actually happens, which is what everybody out
 * there is doing.
 *
 * Nobody in this place is milling about. A patch here is one kind of work, and
 * a figure standing in it is doing that work: the furrows are dug, the wood is
 * cut, the road is walked under a load, the square is where an argument is,
 * the yards are swept and the well is drawn from. Which patches exist at all
 * depends on what has been built, so a place with no fields has nobody in the
 * furrows, and that is the point.
 */
export type CrowdJob =
  | 'field'
  | 'wood'
  | 'haul'
  | 'fish'
  | 'road'
  | 'square'
  /** With the animals on the near meadow, which is the one job a hamlet has. */
  | 'pen'
  | 'yard'
  | 'water'
  | 'site'
  /**
   * The camp, which is the whole of the settlement until there is a roof.
   *
   * Before the first house the yards and the lane are both a name for open
   * grass: a soul posted to either stood in a field, bowed at nothing, and
   * strolled eighteen pixels back and forth doing it. Two tents and a fire is
   * the one place five people who arrived last month actually are.
   */
  | 'camp'
  /**
   * The camp's chores, which is where the rest of the camp actually is.
   *
   * Two tents and a fire is where five people sleep, not where they spend the
   * day: for as long as the settlement was the camp, two of them stood at the
   * fire from the first spring to the first roof, warming their hands in June
   * and going nowhere. One keeps the fire. The others go down to the water
   * with a bucket, because there is no well yet and somebody has to, and come
   * back up the slope with it full. It is the one walk a camp has, and it is
   * walked from the tents rather than from a door, because there is no door.
   */
  | 'fetch'
  /**
   * And the six a place has to earn. Each of them is posted only while the
   * thing that makes it exist stands: a hole in the crag, three apple trees,
   * a board that has songs on it, a watch, and the cold.
   */
  | 'mine'
  | 'orchard'
  | 'music'
  | 'paint'
  | 'guard'
  | 'warm'
  /**
   * The beeches on the far bank, which is a job the bridge makes.
   *
   * Nothing over the water was ever walked to: the far bank was a day away
   * round by the ford and the picture drew nobody on it. With a bridge
   * standing it is a morning, so somebody goes over with an empty basket and
   * comes home with a full one, every day, across the deck.
   */
  | 'far';

export const CROWD_SPOTS: Record<CrowdJob, { x: number; y: number; w: number; h: number }> = {
  field: { x: 298, y: 318, w: 168, h: 152 },
  /* A woodcutter stands at a tree, not on a patch. This is only the fallback
     for a count of cutters past the number of trunks in WOOD_TRUNKS. */
  wood: { x: 1150, y: 366, w: 200, h: 14 },
  haul: { x: 0, y: 0, w: 26, h: 18 },
  fish: { x: 0, y: 0, w: 10, h: 10 },
  road: { x: 800, y: 330, w: 250, h: 96 },
  square: { x: SQUARE.x - 140, y: SQUARE.y - 48, w: 280, h: 96 },
  /* Yards, not meadow. This box used to be 380 by 120 of open grass in front
     of the huts, so in a hamlet with nothing built the people posted to it
     stood about in a field bowing at nothing, which is exactly what it looked
     like. A yard is the ground beside somebody's house, so the box now sits
     over the hut cluster and a bent back in it is a bent back at a door. */
  yard: { x: 592, y: 300, w: 372, h: 176 },
  /* The animals are drawn on the near meadow in every season but winter, and
     from here on somebody is with them. */
  pen: { x: 344, y: 590, w: 118, h: 36 },
  water: { x: 762, y: 424, w: 58, h: 34 },
  site: { x: 0, y: 0, w: 60, h: 34 },
  /* The fallback for a camp with more people round it than the ring holds.
     The tents themselves are at 810 and 844, so this is the ground below. */
  camp: { x: 800, y: 432, w: 76, h: 26 },
  /* Not a patch: the water is fetched from `CAMP_WATER` below. This is only
     the fallback for a second bucket, a little way along the same bank. */
  fetch: { x: 872, y: 518, w: 40, h: 10 },
  /* At the mouth of the cut, which is where the spoil comes out. The crag
     itself is at x 114 and nobody stands inside it. */
  mine: { x: 148, y: 366, w: 76, h: 34 },
  /* Under the apple trees, which stand at 352, 400 and 438. */
  orchard: { x: 344, y: 266, w: 100, h: 26 },
  /* Where the songs are: the west side of the square, clear of the well. */
  music: { x: 662, y: 404, w: 78, h: 30 },
  /* And where somebody can see the whole place at once and put it on a board. */
  paint: { x: 876, y: 424, w: 66, h: 30 },
  /* The fallback for a watch bigger than the gate has posts for. */
  guard: { x: 640, y: 250, w: 150, h: 22 },
  /* The fallback for a crowd bigger than the ring round the fire. */
  warm: { x: 668, y: 388, w: 96, h: 40 },
  /* The edge of the beeches on the far bank, just under the road and above
     the far meadow: the river is a hundred and thirty units up from here,
     the road's lower edge is at about 545, and the far roof at 1188,600 is
     under it. Clear of the beeches scene at 1306,512 and of the two crisis
     spots at 1206,524 and 1252,534. */
  far: { x: 1176, y: 550, w: 74, h: 24 },
};

/**
 * Where a pike actually stands: at the gate, on the line the fence runs.
 *
 * A watch scattered over a box is a crowd loitering. Three posts, in the order
 * they get filled, and anybody past the third stands off the line in the box
 * above.
 */
export const GATE_POSTS = [
  { x: 700, y: 258 },
  { x: 742, y: 250 },
  { x: 660, y: 264 },
];

/**
 * The winter fire, and the backs round it.
 *
 * Placed off the map's own numbers: this is the point in the settlement band
 * with the most clear ground round it (60 units to the nearest roof, 82 to the
 * well), which is what a town square is for. The ring is offsets from the
 * fire, so moving the fire moves everybody standing at it.
 */
/**
 * The camp fire, and where the five of them sit round it.
 *
 * Taken off the camp's own drawing rather than guessed: the group is put down
 * at `HUT_SITES[0]` shifted by (-6, +12) and scaled 0.78, and the bonfire
 * inside it is at (38, 40), which lands here. Move the camp and this has to
 * move with it, which is why the arithmetic is written down.
 */
export const CAMP_FIRE = { x: HUT_SITES[0].x - 6 + 38 * 0.78, y: HUT_SITES[0].y + 12 + 40 * 0.78 };
export const CAMP_RING = [
  { x: -30, y: 10 },
  { x: 28, y: 12 },
  { x: -14, y: 24 },
  { x: 34, y: -6 },
  { x: -34, y: -8 },
];

/**
 * Where the camp's day starts and where its water is.
 *
 * The door is the mouth of the nearer tent, a step to the left of the fire,
 * so somebody setting out with a bucket comes out from between the tents and
 * not out of the flames. The water is the nearest piece of the near bank to
 * the camp that is actually dry to stand on: forty-four units from the middle
 * of the river, clear of every rod on `FISH_SPOTS`, and reached by a straight
 * walk down the slope that never touches the water. Found by searching the
 * bank rather than by eye, and checked in `town-life.test.ts`.
 */
export const CAMP_DOOR = { x: CAMP_FIRE.x - 22, y: CAMP_FIRE.y + 4 };
export const CAMP_WATER = { x: 892, y: 522 };

/**
 * The mill, and the piece of bank it had to be found on.
 *
 * A mill is the one building in this valley that cannot stand anywhere: the
 * house has to be dry the whole way under it and the wheel has to be in the
 * water, and the near bank falls away to the south east, so there is exactly
 * one shoulder where both are true and nothing else is standing. Searched
 * against `waterDistance()` rather than placed off a screenshot, and the
 * three constants below are what `town-life.test.ts` reads: the walls sit 58
 * to 114 units out from the middle of the water and the foot of the wheel
 * sits 15, which is inside it. Clear of the rods, of the ground a charter
 * opens at the mill end (x 1046 and east of it), of the granary above and of
 * the bridge below.
 *
 * `MILL_SITE` is where `Mill` in `parts.tsx` is drawn from; the other two
 * are that drawing's own numbers in map units, so a change to either has to
 * move both and the test says so.
 */
export const MILL_SITE = { x: 968, y: 392 };
export const MILL_WALLS = { x: 968, y: 414, w: 64, h: 32 };
export const MILL_WHEEL = { x: 1048, y: 468, r: 19 };

export const WINTER_FIRE = { x: 716, y: 408 };
export const FIRE_RING = [
  { x: -34, y: 8 },
  { x: 33, y: 6 },
  { x: -19, y: -16 },
  { x: 24, y: -14 },
  { x: 2, y: 26 },
  { x: -38, y: -8 },
  { x: 40, y: -20 },
];

/**
 * The track the cut wood comes down, from the edge of the trees to the yards.
 *
 * A wood is felled at one end of a walk and burned at the other, and the walk
 * is the half of the job that can actually be seen from up here: somebody
 * comes out of the trees under a log, goes down the slope to the granary side
 * of the place, and walks back up for the next one.
 */
export const WOOD_HAUL = { x: 1172, y: 368, dx: -176, dy: 40 };

/**
 * The trees that are actually being cut: the front rank of the right hand
 * wood, the ones with a trunk you can see, nearest the town.
 *
 * Each entry is the foot of one trunk in the picture's own coordinates (the
 * stand from `woods.ts`, moved by RIGHT_WOOD_SHIFT, plus the trunk's own
 * height at that stand's scale). A cutter stands a body's width to the left of
 * it, facing it, so the axe crosses the trunk and not the air beside it.
 */
export const WOOD_TRUNKS: { x: number; y: number }[] = [
  { x: 1161, y: 372 },
  { x: 1198, y: 374 },
  { x: 1237, y: 378 },
  { x: 1277, y: 379 },
  { x: 1318, y: 381 },
];

/** How far to the left of a trunk a cutter plants their feet. */
export const CUTTER_STANDOFF = 11;

/**
 * Where a day's work starts from: a door.
 *
 * Nobody in this place materialises at the river with a rod. The ones whose
 * work is a walk away (the bank, the trees, a building site) come out of a
 * hut, cross the ground, do the work and walk home, and the door they use is
 * decided by their number so the same soul always leaves the same house.
 */
export function homeDoor(nth: number, homes: HutSite[]): { x: number; y: number } {
  const h = homes[nth % Math.max(1, homes.length)] ?? HUT_SITES[0];
  return { x: h.x + 30 * h.scale, y: h.y + 57 * h.scale };
}

/**
 * Where the river is worth standing at, on the town side of the water.
 *
 * The river was scenery for nine acts. These are the four spots on the near
 * bank where it is deep enough to be worth a morning, and somebody is on each
 * of them in every season the water is not a lid.
 */
export const FISH_SPOTS = [
  /* Downstream of the trees. The first seat used to sit under the front rank
     of the wood, which put a rod and an axe on the same square yard. */
  { x: 1128, y: 410 },
  { x: 1070, y: 436 },
  { x: 1010, y: 462 },
  /* Two more seats on the same line, upstream and down, for a place with more
     mouths than three rods can feed. Derived from the step between the three
     above (-59, +26) rather than placed by eye, and hit-tested against the
     river stroke in the running build. */
  { x: 1187, y: 384 },
  { x: 951, y: 488 },
];

/**
 * Points along the road, for whoever is on it under a load.
 *
 * A road is a line and not a patch: somebody working it is walking it, and
 * scattering them over a rectangle put half of them in the corn beside it.
 */
export const ROAD_WALK = [
  { x: 762, y: 268 },
  { x: 790, y: 320 },
  { x: 842, y: 360 },
  { x: 900, y: 390 },
  { x: 958, y: 416 },
  { x: 1016, y: 442 },
  { x: 1062, y: 464 },
];

/**
 * How far the right hand wood was pushed off the town.
 *
 * The beeches were standing on the granary and the granary was standing in the
 * beeches, and neither of them could be read. The hand placed numbers are
 * kept: what moves is the whole wood, in one transform, which is also what
 * makes it sit back a rank further than it did.
 */
export const RIGHT_WOOD_SHIFT = { x: 120, y: -8 };

/**
 * The road, walked.
 *
 * Whoever was on the road used to stand at one of the steps above and
 * stroll twenty units either side of it under a sack, which is a man
 * pacing, not a road in use. A road is a line between the place and
 * everywhere else, so the people on it go the whole way: in from the hills
 * at the top of the picture, down through the gate to the granary side of
 * the square, and back out again. And once there is a bridge, on from the
 * square over the deck to the far bank and back. Two trips, and the carts
 * take the same two once the road is wide enough for one.
 *
 * `ROAD_IN` starts just under the horizon, on the first bend of the track,
 * and ends where the cart ground is. `ROAD_OVER` picks up at the same bend
 * of the square, follows the steps down to the water, crosses on the deck
 * (`DECK` in `paths.ts`, the same three points the ruler's walk uses) and
 * stops on the far bank short of the map's edge.
 */
export const ROAD_IN = [
  { x: 766, y: 210 },
  { x: 756, y: 248 },
  { x: 790, y: 320 },
  { x: 842, y: 360 },
  { x: 900, y: 390 },
  { x: 914, y: 396 },
];

export const ROAD_OVER = [
  { x: 900, y: 390 },
  { x: 958, y: 416 },
  { x: 1016, y: 442 },
  { x: 1040, y: 440 },
  { x: 1090, y: 482 },
  { x: 1150, y: 530 },
  { x: 1230, y: 530 },
];

/**
 * The yards, lived in.
 *
 * Three of the people who come to the door in this game are children, and
 * until now none were ever in the picture. Two run the lane between the
 * roofs once there are enough souls for some of them to be small: across the
 * top of the square under the third roof, and across the doorstep of the
 * first one. The runs are the ground they cover, from x to x plus span.
 */
export const KID_RUNS = [
  { x: 688, y: 388, span: 44 },
  { x: 836, y: 440, span: 34 },
];

/** The foot of the fifth roof, where the hens are, once there is a yard to keep them in. */
export const HEN_YARD = { x: 556, y: 392 };

/** Two pairs in the square, in the year of the fair. */
export const DANCE_PAIRS = [
  { x: 734, y: 408 },
  { x: 806, y: 438 },
];
