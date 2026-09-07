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
  /* The store starts with one building in it and not two. That is the whole
     first year: five people, a shelf holding fourteen of a possible fifteen,
     and a roof or a cabin to spend it on. Whichever they pick, the store still
     has something in it in the spring, and the other one waits for a better
     year.

     It held twelve, and the first year of a reign left it on nothing. Twelve,
     less what the crown spends on itself over the winter, is ten, and a roof
     cost ten: every reign in the game opened by emptying its own store to the
     last point and then watching a year go by with nothing to spend and
     nothing to spend it on. A first roof is a week of five people and a
     first year should not be a hole, so the shelf starts fuller and the two
     things that year can buy are priced at what they actually are. */
  start: { crownSanity: 66, health: 18, economy: 14, mood: 50, army: 18, culture: 8 },

  /**
   * The store is the one board that is a store. The others are how the place
   * lives right now and have no lid worth naming; this one is a shelf, and a
   * shelf has an end. A hamlet's shelf holds fifteen, and starts well under
   * that, same as every other board. What the granary lifts is the shelf
   * itself, not what is on it: it is not a trend, it is the lid coming off.
   * Two of them and the shelf is most of the board.
   */
  /* The shelf a hamlet has before anybody builds a lid for it.
     It was 15, and `works.perLevel` is 7, so the second floor of anything cost
     17: over the shelf, in every year of every hamlet reign, which is a shelf
     that says no rather than a price that is dear. A playthrough found eight
     years in a row where the only two things a year could be spent on were
     resting and a fair, and the reign table agrees - `economy` was the lowest
     board for all seven players and killed `best` in five reigns of twelve. At
     20 a second floor is holdable and the store has room to save toward one;
     nothing got cheaper. Table after: `best` 27.6 to 29.0 years with
     `defeat:economy` 5 to 2, `human` 27.5 to 27.9, `random` walked out 3 to 1,
     `comfortable` and `last` unchanged in kind. */
  store: { cap: 20, perGranary: 35 },

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
  /**
   * What a crowd is, and what answers one.
   *
   * The old rule was one point of health a year for every thirty souls, on the
   * whole count, forever. At nine hundred souls that is minus thirty a year
   * against a long room at its top floor paying six, which is not a difficulty
   * curve, it is a wall: a reign that did the thing the game asks for - keep
   * the square happy, and it fills up - died of health in nine reigns of
   * twelve, and the winning move was to keep everybody miserable.
   *
   * Two changes, and both of them are the same idea. A roof answers for the
   * people under it, so what is felt is the count the place has *not* housed;
   * and past `bendsAt` the line bends, because the difference between four
   * hundred and five hundred strangers is not the difference between four and
   * a hundred and four.
   */
  crowd: {
    /** Souls per point of health a year, on the part of the count nothing answers for. */
    healthEvery: 30,
    /** Past this many unanswered souls, the next ones cost half as much. */
    bendsAt: 240,
    /** And what a floor of each of these answers for, in souls. */
    answers: { house: 40, well: 60, long_room: 90 },
  },

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
    /**
     * And how long one of the scenes that come round stays away before it can
     * be asked again. Four of those against two slots a year gives roughly two
     * full years and then two quiet ones, which is the shape a place actually
     * has: a run of years with somebody at the door most springs, and then a
     * couple where nothing in particular happens. What it stops is the six
     * years running of nothing that a thirty year reign used to end on.
     */
    recurAfter: 5,
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

  /**
   * The third stage: a place with neighbours.
   *
   * A kingdom keeps every town rule it grew up with and adds one thing, which
   * is that it is no longer the only place on the map. The year of work can be
   * spent abroad instead of at home, and the neighbours go on living whether
   * or not it is.
   */
  kingdom: {
    at: 300,            // souls: a town becomes a kingdom at this count
    years: 10,          // a reign that runs out of laws still gets this long with them
    states: 5,          // neighbours drawn the year the crown arrives
    askBelow: 25,       // a board under this is a neighbour asking for help
    askExpires: 3,      // years an ask stands before silence is taken as a no
    stanceDecay: 3,     // every this many years a stance moves one step toward civil
    ask:  { gain: 10, debt: 1 },
    send: { cost: 10, crown: 2, stance: 2 },
    raid: { needsArmy: 30, roll: 20, edge: 10, win: 15, armyWin: 5,
            armyLose: 10, moodLose: 5, crown: 6, stance: 3, others: 1 },
    raided: { economy: 8, mood: 3 },
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
     * How many people the valley can actually feed and put up.
     *
     * Growth used to be a bare multiplier with nothing on the other end of it:
     * at a mood of ninety seven the count doubled every four and a half years
     * and went on doubling, which is how a reign arrived at nine hundred souls
     * in a place with three fields. Ground fed by nobody feeds nobody. Growth
     * slows as the count comes up on this number and stops at it, and the only
     * way to raise it is to build: cleared ground, roofs, somewhere to keep a
     * good year, a road, and the bridge that turns the far bank from a day
     * away into the far bank.
     *
     * The base is a valley nobody has improved: enough to reach the charter at
     * a hundred and become a town, and nowhere near the three hundred a crown
     * needs. A reign that spends every year resting can still be a town. It
     * cannot be a kingdom, and it can see exactly why on the ladder.
     */
    room: { base: 150, fields: 50, house: 30, well: 36, granary: 40, road: 24, bridge: 48 },
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
  /* `rest` is how many years must pass before the place is allowed to change
     its mind about what to call you. It was nothing, and the Fool arrived in
     year seven with one name and year eight with another. */
  epithet: { fromYear: 6, toYear: 8, rest: 3 },

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
    /**
     * And the first year, which is the one year the place is choosing between
     * two things it could raise with its own hands. A hut and a saw pit are
     * not a granary: they cost the store less than a full year of work does,
     * and what is left over is the difference between a reign that starts and
     * a reign that starts broke.
     */
    costFirstYear: 8,
    /** And every floor after the first costs this much more than the last. */
    perLevel: 7,
    /**
     * Economy at or above this: the surplus pays half the year.
     *
     * This was a dead rule and is not one any more, and nothing about it was
     * changed to fix that. It never fired in nine hundred years of played
     * reign because the granary - the one thing that lifts the lid off the
     * store - carried a trend of minus one and was therefore the last thing
     * anybody bought, and because a reign that grew unchecked died of health
     * before a store could fill. With the granary earning its keep and the
     * count answerable, the store now sits at or above this in about one
     * played year in eleven across best, human and comfortable, and peaks at
     * the two-granary lid of eighty five. Left where it was, on purpose.
     */
    freeAbove: 70,
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
    /**
     * How long a season sits there before the next one comes.
     *
     * This is the game's only pure watching, and it was too short: a player
     * asked for at least five seconds between one decision and the next, and
     * at 5200 plus 3400 the drift was over before the eye had found what had
     * changed. The season alone is now over six seconds and the beat before
     * somebody knocks is another five and a half, so nothing arrives while the
     * last thing is still being read.
     */
    seasonMs: 6400,
    /** The beat between the last season and the knock, long enough to see the
     *  mark arrive on the town rather than only to see that it has. */
    holdMs: 5600,
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
  /**
   * `loverAge` is the one number here that is not a balance decision. The
   * register knows how old everybody is, because it has known since the year
   * they walked in, and three of the people who come to the door are children:
   * Iva is nine, Wat is eleven, Lark is twelve. Nothing else in the game reads
   * that number before offering to take somebody, and it has to.
   */
  bond: { giftCost: 2, giftEvery: 2, loverCost: 3, loverSanity: 1, loverAge: 18 },

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
