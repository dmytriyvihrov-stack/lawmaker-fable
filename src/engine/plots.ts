import type { GameState, PlotId, WorkId } from './types';

/**
 * Where a building goes.
 *
 * A year of work used to have one answer and the picture only ever confirmed
 * it: the granary went on the granary's ground, forever, in every reign. The
 * ground is a decision now. There are six pieces of it, five things that can
 * stand on one, and no way to move anything once it is up, which is the whole
 * of the interest: the good ground near the square is spent on whatever you
 * put there first.
 *
 * Everything else a year can be spent on is tied to the country rather than to
 * the place. A fence follows the fence line, a road follows the feet, a bridge
 * crosses where the river is narrow and the cut goes into the crag, because
 * that is where the crag is.
 */
export const PLOT_IDS: PlotId[] = [
  'north_gate',
  'east_rise',
  'cart_ground',
  'square_west',
  'well_side',
  'west_strip',
  'north_field',
  'mill_end',
  'stone_row',
];

/**
 * The ground a hamlet has, which is the six pieces it found.
 *
 * A place of five has walked as much of this valley as five people can. What
 * a charter is, among other things, is the year the rest of it stops being
 * somewhere nobody has been: the high ground over the gate, the bend where
 * the road comes down to the water, and the strip between the furrows and the
 * roofs are all ground a town has cleared and a hamlet has not.
 */
const HAMLET_PLOTS = 6;

/** The pieces of ground a place of this size actually has. */
export function plotsFor(s: GameState): PlotId[] {
  return s.stage === 'village' ? PLOT_IDS.slice(0, HAMLET_PLOTS) : PLOT_IDS;
}

/** The works the place gets to choose the ground for. */
export const PLACEABLE: WorkId[] = ['well', 'granary', 'watch_house', 'long_room', 'hall'];

/**
 * Where each of them went before anybody was asked.
 *
 * Two things read this. A reign loaded from a save written before the question
 * existed has no placements at all and has to keep the town it earned, and a
 * caller that does not answer the question (a test walking a golden reign, a
 * prototype entry) still has to leave the ground consistent, or two buildings
 * end up on one footprint later. Either way the answer is the same one the
 * picture always gave.
 */
export const DEFAULT_PLOT: Record<string, PlotId> = {
  well: 'well_side',
  granary: 'cart_ground',
  watch_house: 'north_gate',
  long_room: 'east_rise',
  hall: 'square_west',
};

/** The ground a work takes when nobody chose any: its own, or whatever is left. */
export function fallbackPlot(s: GameState, id: WorkId): PlotId | null {
  const mine = DEFAULT_PLOT[id];
  const taken = mine === undefined ? null : occupantOf(s, mine);
  if (mine !== undefined && (taken === null || taken === id)) return mine;
  return freePlots(s)[0] ?? null;
}

export function isPlaceable(id: WorkId): boolean {
  return PLACEABLE.includes(id);
}

/** The ground a work stands on, or null when nobody has chosen any. */
export function plotOf(s: GameState, id: WorkId): PlotId | null {
  return s.placements?.[id] ?? null;
}

/**
 * What is standing on a piece of ground, if anything is.
 *
 * A recorded placement is the answer when there is one. When there is not and
 * the building is nonetheless standing, the answer is still not "nothing":
 * `siteOf` draws that building on its default ground, so the ground is taken
 * in the picture whether or not anybody wrote it down. Reading only the
 * record put every plot on offer in a town whose well, granary and hall were
 * plainly standing on three of them, and a year of work could then be spent
 * putting the watch house on top of the granary.
 */
export function occupantOf(s: GameState, plot: PlotId): WorkId | null {
  const placed = s.placements ?? {};
  for (const id of PLACEABLE) {
    if (placed[id] === plot) return id;
    const standing = (s.buildings[id] ?? 0) > 0;
    if (standing && placed[id] === undefined && DEFAULT_PLOT[id] === plot) return id;
  }
  return null;
}

/** The ground nothing is standing on yet, at the size this place has grown to. */
export function freePlots(s: GameState): PlotId[] {
  return plotsFor(s).filter((plot) => occupantOf(s, plot) === null);
}

/**
 * Whether this year has to ask where the thing goes. Only the first floor of a
 * building is a question: the second storey goes on top of the first one, and
 * a building already standing on chosen ground keeps it.
 */
export function needsPlacement(s: GameState, id: WorkId): boolean {
  if (!isPlaceable(id)) return false;
  if (plotOf(s, id) !== null) return false;
  return (s.buildings[id] ?? 0) === 0;
}

/** Whether a piece of ground can take this work this year. */
export function canPlace(s: GameState, id: WorkId, plot: PlotId): boolean {
  if (!isPlaceable(id) || !plotsFor(s).includes(plot)) return false;
  const taken = occupantOf(s, plot);
  return taken === null || taken === id;
}
