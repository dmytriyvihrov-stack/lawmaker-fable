import type { WorkDef } from '../engine/types';

/**
 * Where a year goes. One of these every year, and it stands for the rest of the
 * reign: a law says what the place believes, a building says what it can do.
 */
export const WORKS: WorkDef[] = [
  /**
   * The first year, and the two things a place with no law can do about
   * itself.
   *
   * Nobody writes a rule in the first spring. Five people who have just walked
   * out of somewhere put up a roof or they put up somewhere to work, and which
   * of the two they pick is the first thing about this reign that is true. The
   * one not picked is not gone: it goes back on the list with everything else,
   * and most reigns build both eventually.
   */
  {
    id: 'house',
    stage: 'village',
    name: 'Raise a house',
    line: 'A roof with a hearth under it. People sleep warm, and somebody sick has somewhere to be sick.',
    cost: 10,
    maxLevel: 3,
    trend: { mood: 2, health: 1 },
  },
  {
    /**
     * Not the wood: a place to work the wood. The trees were always there and
     * anybody could go and cut one, which is exactly why the cabin is worth a
     * year: it is the difference between a man with an axe and a place that
     * expects wood on a Tuesday.
     */
    id: 'woodcutter',
    stage: 'village',
    name: "Put up a woodcutter's cabin",
    line: 'A saw pit and a store at the edge of the trees. The wood comes in steadily instead of when somebody thinks of it.',
    cost: 10,
    maxLevel: 3,
    trend: { economy: 1.5 },
  },
  {
    id: 'fields',
    stage: 'village',
    name: 'Clear another field',
    line: 'More ground under the plough. The store grows a little every year after.',
    cost: 10,
    maxLevel: 3,
    trend: { economy: 2 },
  },
  {
    id: 'well',
    stage: 'village',
    name: 'Line the well',
    line: 'Clean water, and fewer coughs in the wet months.',
    cost: 10,
    maxLevel: 2,
    trend: { health: 3 },
  },
  {
    id: 'fence',
    stage: 'village',
    name: 'Raise a fence, and a gate',
    line: 'A gate to shut at night. When the place keeps a watch, this is where it starts.',
    cost: 10,
    maxLevel: 2,
    trend: { crownSanity: 1 },
    once: { army: 10 },
  },
  {
    /**
     * The crag has been on the left of every picture since the first spring.
     * This is the year somebody finally goes into it: stone now, and a hole
     * that gets deeper, and backs that do not come home straight.
     */
    id: 'mine',
    stage: 'town',
    name: 'Cut into the crag',
    line: 'Stone for the walls now, and whatever is under the stone later. It costs backs.',
    cost: 14,
    maxLevel: 2,
    trend: { economy: 2, health: -1 },
  },
  {
    /**
     * The one building that does not earn. What it does is raise the shelf a
     * good year has to land on, and ask a little back every year for the
     * privilege of standing there: a granary is a building, and a building
     * eats a little of what it holds. That small drag is what keeps a run of
     * good years from becoming one number climbing forever. There is no third
     * one worth drawing.
     */
    id: 'granary',
    stage: 'both',
    name: 'Build up the granary',
    line: 'Somewhere to put a good year. The store can hold far more, the long winter takes less, and nothing rots that did not have to.',
    cost: 10,
    townCost: 14,
    maxLevel: 2,
    /* It used to eat a point a year for the privilege of standing there, which
       made the one thing that lifts the lid on the store the least attractive
       thing on a list nobody can afford one item from. A granary is a lid and
       a floor: what it keeps is what would otherwise have gone bad, so it pays
       for itself slowly and never quickly. */
    trend: { economy: 1 },
    winterShelter: 5,
  },
  {
    id: 'watch_house',
    stage: 'town',
    needsBoard: 'army',
    name: 'Raise a watch house',
    line: 'Men with pikes, and somewhere to keep them.',
    cost: 14,
    maxLevel: 3,
    trend: { army: 2 },
  },
  {
    id: 'long_room',
    stage: 'town',
    name: 'Build the long room',
    line: 'Beds for the sick, and a Healer who sleeps.',
    cost: 14,
    maxLevel: 3,
    trend: { health: 2 },
  },
  {
    id: 'hall',
    stage: 'town',
    needsBoard: 'culture',
    name: 'Raise a hall, and a bell',
    line: 'Somewhere to sing, argue and be counted.',
    cost: 14,
    maxLevel: 3,
    trend: { culture: 3, mood: 1 },
  },
  {
    /**
     * The first link of the one chain in this list.
     *
     * Nobody arrives on a road. They arrive on whatever the feet before them
     * wore into the grass, and the year somebody cuts and beds that line is
     * the year the carts can use it. The bridge is not on the list until this
     * stands, because a bridge with nothing running at it is a folly.
     */
    id: 'road',
    stage: 'both',
    group: 'infrastructure',
    name: 'Cut the road through',
    line: 'The track the feet wore, cut and bedded, so a cart can use it. Carts bring a little more than they take, every year.',
    cost: 10,
    townCost: 14,
    maxLevel: 2,
    /* The road is the link that earns, and it is the only one. A cart on a
       bedded track is worth a point a year and not two: the money in this
       chain is in having a road at all, not in how far it goes. */
    trend: { economy: 1 },
  },
  {
    id: 'bridge',
    stage: 'both',
    group: 'infrastructure',
    needsWork: { id: 'road', level: 1 },
    name: 'Throw a bridge over the river',
    line: 'The far bank stops being a day away and starts being the far bank. Nothing is carted over it that was not carted round, and people build on that side now.',
    cost: 10,
    townCost: 14,
    maxLevel: 2,
    /* And the bridge is the link that does not earn. Nothing is carted over
       it that was not carted round by the ford; what changes is that the
       morning is no longer a day, which is a thing people are glad about and
       not a thing the store ever sees. It also brings whatever the far bank
       has, which is why the Healer is against it.

       What it does do, and what it was missing for the three times anybody
       chose it in nine hundred years of play, is open ground: the far bank is
       somewhere to live once there is a way over the water, and `room.bridge`
       in the config is the largest single thing a year of work can add to how
       many people this valley holds. */
    trend: { mood: 2, health: -1 },
  },
  {
    /**
     * The only year that can be spent the same way twice and leave nothing
     * standing. Everything else here is a building; this is a day nobody
     * works, and the square is glad about it, and the store pays for the
     * gladness every single time.
     */
    id: 'fair',
    stage: 'both',
    /* Not tied to a law yet, and the reason is worth keeping: this is the only
       thing a hamlet can do about its own mood. Gate it behind any decree and
       the first three acts have no lever at all, and a middling reign is
       walked out on every time. The gate wants a cheap hamlet day off written
       first, with the real fair as the thing the law unlocks. */
    name: 'Hold a fair',
    line: 'A day nobody works, with a fiddle if there is one. It can be held again next year, and it costs the store every time.',
    // A hamlet cannot hold a fair. It can hold a day off, cheaply, and be glad
    // of it; there is nobody to come and nothing to come to. A town can hold
    // the real thing, and pays for it, and gets something that lasts.
    cost: 4,
    townCost: 10,
    maxLevel: 0,
    trend: {},
    once: { mood: 8, health: -1 },
    townOnce: { mood: 10, culture: 6, health: -1 },
  },
  {
    id: 'rest',
    stage: 'both',
    name: 'Rest. The year passes.',
    line: 'Nothing is built. The monarch sleeps better for it.',
    cost: 0,
    maxLevel: 0,
    trend: {},
    once: { crownSanity: 4, health: 2 },
  },
];
