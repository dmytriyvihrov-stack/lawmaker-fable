export const CONFIG = {
  statMin: 0, statMax: 100,
  effectMin: -30, effectMax: 30,
  trendMin: -6, trendMax: 6,

  /** Where every board starts. mood, army and culture sit hidden at these
   *  values until the hamlet becomes a town.
   *
   *  A hamlet of five is poor and unwell, and both of those are the point: the
   *  store is a shelf, and the medicine is somebody's aunt. There is nowhere to
   *  go from here but up, slowly, or down, quickly. Economy starts well under
   *  its own shelf, same as every other board starts well under its own end. */
  start: { crownSanity: 66, health: 24, economy: 6, mood: 50, army: 18, culture: 8 },

  /**
   * The store is the one board that is a store. The others are how the place
   * lives right now and have no lid worth naming; this one is a shelf, and a
   * shelf has an end. A hamlet's shelf holds fifteen, and starts well under
   * that, same as every other board. What the granary lifts is the shelf
   * itself, not what is on it: it is not a trend, it is the lid coming off.
   * Two of them and the shelf is most of the board.
   */
  store: { cap: 15, perGranary: 35 },

  /**
   * The two boards a place decides to grow. Neither is free and neither is
   * automatic: at the first count the place can carry one of them, at the
   * second it can carry the other, and the choice is which order a settlement
   * becomes a thing with a watch and a thing with songs.
   */
  boards: { firstAt: 30, secondAt: 60 },

  /**
   * Conditions are not a store. Nothing accumulates in them: they are how the
   * place lives right now, and the one thing that pushes on them always and
   * everywhere is how many of you there are. One point a year for every this
   * many souls, at every stage, forever. A well, a long room and a physician
   * push back. Nothing else does.
   */
  crowdHealthEvery: 30,

  /** Bending your own law costs the square's trust; in a hamlet, the crown's. */
  exceptionCost: 8,
  /**
   * And the grey answer, the one that does not break a standing law so much
   * as decline to apply it, costs this share of that. Nothing is written in
   * the Codex for it; the crown simply notices.
   */
  bendShare: 0.5,

  /**
   * The bench, when the person standing there may not have done it. The truth
   * comes off the seed and is never stored; these are the only numbers in it.
   */
  trial: {
    guiltyChance: 0.65,
    wrongSurfacesIn: 4,        // the first wrong conviction of a reign comes back
    acquittedReturnIn: 3,      // and so does the guilty one you let walk
  },

  urgentPriority: 5,
  /**
   * The band under the urgent line that still does not draw lots. A scene
   * about somebody the reign has already decided about (Tam and the fence,
   * Marta and the ground) must not be lost in the lottery with the wolf and
   * the swarm, and must not push a decree back a year either: it takes the
   * first free slot in a year and no more than that.
   */
  keenPriority: 6,
  hardCapTurn: 40,

  /** The shape of a year: a law now and then, a case or two, and one decision
   *  about the place itself. */
  year: {
    lawEvery: 2,          // a decree at most this often, in years
    dilemmasPerYear: 2,   // at most this many people in front of you a year
  },

  /**
   * How hard a law lands. One sentence read over five heads is advice; the same
   * sentence over five hundred is weather. Content writes the small honest
   * number and these turn it into what the place actually feels.
   */
  law: {
    sealScale: 0.4,       // the day it is sealed, a decree moves a board this much of what it says
    /** And every year after, on top of the weight below. A standing law is the
     *  one thing in the game that never stops working, up or down, so a year of
     *  it should be felt in the hamlet that wrote it and not only in the town
     *  it grows into. */
    trendScale: 1.5,
    weightPer: 100,       // every this many souls adds one to the yearly weight
    maxWeight: 3,         // and it never weighs more than this
    /** A place keeps a watch once it has a watch house, or this much army. */
    watchAt: 55,
  },

  /** A person standing in front of you moves a board by a unit or two. */
  caseScale: 0.3,

  town: {
    at: 100,              // souls: the hamlet becomes a town at this count
    crownDrift: -1.6,     // crownSanity per year once it is a town
    cultureDrift: -1,     // songs spread slower than people do
    /** Every this many souls past the charter costs the town one mood and one health a year. */
    crowdEvery: 100,
  },

  village: {
    growthNoLaw: 1.12,    // yearly multiplier before any strangers law
    births: 1,            // added every year on top of the multiplier
  },

  population: {
    start: 5,
    /** A town of strangers still grows, slowly, on its own. */
    townBase: 1.03,
    /** How much of the hamlet's open door a town still feels. A charter is a
     *  wall as well as a welcome: the road stops being the whole story. */
    townShareOfLaw: 0.15,
    /** Health is the ledger of who is still here next spring: under this many
     *  points, every point costs the place this share of itself a year. A
     *  hamlet starts well under it, which is why the well is the first thing
     *  worth a year. */
    deathFrom: 45, deathPerPoint: 0.002,
    /**
     * A place people want to live in grows faster than one they endure, and it
     * empties when they stop wanting to. This used to be a rounding error next
     * to the ground rate; it is a driver now, because how the square feels is
     * the first thing anybody deciding whether to stay actually weighs.
     */
    moodNeutral: 50, growthPerMood: 0.0028,
  },

  /** A board on the floor ends the reign, but never on the day it lands there.
   *  The collapse scene fires at the floor and is answerable; this is the year
   *  after, when the answer did not work or was not given. */
  defeat: { floor: 0, graceYears: 1 },

  /**
   * The one look the Fool gives you at what the place has started calling
   * you, delivered once, in the years just before the first long winter and
   * never before them: a name earned in the first year is not yet a name
   * anybody outside your own head is using. If nothing has stuck by the last
   * of these years, the Fool has nothing to report and says nothing.
   */
  epithet: { fromYear: 6, toYear: 8 },

  winter: {
    every: 10,            // years 10, 20, ...
    /** Years out that somebody comes and says it to your face, once. The last
     *  year in which a work can be finished in time, plus one to store. */
    warnAt: 2,
    /** The long winter takes something off every board there is. Nothing is
     *  spared: the crown sits in the cold too, and nobody sings in it. */
    drain: { health: -10, economy: -10, mood: -6, crownSanity: -4, army: -4, culture: -5 },
    /** And it takes more from a bigger place: every this many souls adds one
     *  to the weight of it, up to `maxWeight`. A hamlet huddles; a town queues. */
    weightPer: 120, maxWeight: 3,
    /** Percent of souls lost = base - health*hw - economy*ew - shelter, floor 0. */
    loss: { base: 40, healthWeight: 0.3, economyWeight: 0.2 },
    /**
     * A long winter is not a bad year for the store, it is a year the store
     * does not have. Nothing is sown, nothing is carted, and no law anybody
     * ever wrote makes grain in February, so whatever the standing trends
     * promise, the store gains nothing between the frost and the thaw. What it
     * loses past that is the mouths: one point a year for every this many
     * souls, which is nothing at all in a hamlet and a real bill in a town.
     */
    mouthsPer: 12,
  },

  /**
   * How far the square is allowed to go against you before it stops being a
   * mood and becomes an ending. Not the bottom of the board: a place walks out
   * of a reign long before there is nobody left in it. They say it to your face
   * once, and if the year after that reads the same, they stop saying it.
   *
   * A watch buys patience, because a watch is exactly what a place that has
   * stopped agreeing with you is held together by: every this many points of it
   * lowers the line by one, down to the floor and no further. Nothing buys a
   * place that has gone all the way down.
   */
  walkOut: { at: 26, armyPer: 6, floor: 10 },

  works: {
    costVillage: 10,
    costTown: 14,
    /** And every floor after the first costs this much more than the last. */
    perLevel: 7,
    freeAbove: 70,        // economy at or above this: the surplus pays half the year
    surplusSpend: 10,     // and the surplus leaves the store anyway
  },

  /** What the place learns while it is busy living. The surplus goes here, and
   *  so does a share of the market and the songs. */
  research: {
    perEconomy: 25,       // one point a year for every this much economy
    perCulture: 30,       // and one for every this much culture
    surplusShare: 1,      // the whole surplus turns into points, at this rate
    /** The tree is not a switch. The rumour of it starts at `hintFrom` souls
     *  and fades in until `openAt`, where the screen actually opens. */
    hintFrom: 8,
    openAt: 15,
  },

  /** The year the place stops being "the place" and gets a name of its own:
   *  the spring after the first long winter. A place names itself once it has
   *  survived something together, and naming it in year three was naming a
   *  field nobody had buried anybody in yet. Keep it one past `winter.every`. */
  townName: { fromYear: 11 },

  reopen: { crownSanity: -10, mood: -8 },
  /** Once the clerks can copy a law out fair, opening one again is paperwork. */
  reopenWithScribes: { crownSanity: -3, mood: -2 },

  /**
   * The years between decisions. The place is watched, not waited on: the whole
   * wheel turns in the same window, at the speed of somebody looking at it, and
   * only then is there anybody at the door. Nothing cuts a season short. The
   * knock is the end of the timing, never an interruption of it.
   */
  idle: {
    seasonMs: 5200,
    /** The beat between the last season and the knock, long enough to see the
     *  mark arrive on the town rather than only to see that it has. */
    holdMs: 3400,
  },

  /**
   * What a lawmaker can spend on one person rather than on the place.
   *
   * A gift is deliberately too small and too slow to buy a reign with: two off
   * the store moves one person one rung, and not the same person again inside
   * two years, so a place that loves you took most of a reign to get there.
   * The one you take is not bought at all, only paid for on the day, and what
   * it gives back is the one steady thing in the whole game: somebody who is
   * glad you came home, every year, for as long as they are here.
   */
  bond: { giftCost: 2, giftEvery: 2, loverCost: 3, loverSanity: 1 },

  /**
   * How fast the years are allowed to go past.
   *
   * The wheel between decisions is the game's one piece of pure watching, and
   * how long a player wants to watch it is not something the game knows. The
   * numbers above are what one notch is worth; these multiply it.
   */
  speeds: [1, 2, 4] as const,

  ledgerKeep: 40,
  divergenceMax: 0.5,
} as const;
