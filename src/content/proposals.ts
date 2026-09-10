import type { Proposal } from '../engine/types';

/**
 * Nine laws, in nine acts. Each one is a sentence the whole place can quote,
 * and each one is tested twice by the cases that follow it.
 *
 * The first four are the hamlet's own and wait on nothing but a year or two of
 * the place existing: how the work goes, what the fence is for, what happens on
 * the day somebody dies, and who owns a thing nobody planted. The last five
 * wait on a crowd, because they are arguments a crowd has to be big enough to
 * have.
 *
 * ---
 *
 * The numbers, and the one rule they are all under.
 *
 * No answer in this file is the answer. A player who reads three sentences and
 * adds up the boards under them should not be able to see which one wins,
 * because the moment they can, eight of the nine acts stop being questions and
 * become a lookup, and the game is about what a person would write rather than
 * what a spreadsheet would.
 *
 * So each act is tuned twice, against the engine rather than against a feeling:
 *
 * 1. **At the moment it is read.** The three answers land within a few points
 *    of each other on a one step lookahead - close enough that which one leads
 *    depends on which board the place is short of that spring, and not on the
 *    sentence. The three lead on *different* boards for that reason: the store,
 *    the square, the crown, the well, the watch, the songs. A trend point is
 *    worth five to thirteen times what a point of the seal's cheer is, so an
 *    answer the square loves on the day carries the smaller standing trend, and
 *    an answer it hates carries the larger one. That trade is the shape of
 *    nearly every act here.
 *
 * 2. **Over a whole reign.** Forty seeds played through to the portrait with
 *    each answer forced in turn end within about a tenth of each other on the
 *    reign score. The one deliberate exception is `isBadIdea`, which sits a few
 *    points behind at the moment it is read and further behind at the end -
 *    behind, and never so far behind that it is a wasted act.
 *
 * Two facts about the engine did most of the work and are worth knowing before
 * moving anything here. **Mood is not a board like the others**: it is the
 * growth term (`population.growthPerMood`) and the walk-out clock
 * (`walkOut.at`) at the same time, so a standing point of it compounds for the
 * whole reign and a law that drains two of them every spring from year two is
 * an ending with a delay on it. And **souls are bound by room, not by rate**:
 * `roomFor` is built out of the store, so an answer that fills the store ends
 * up with more people in the place than an answer that brings more of them.
 * That is why the open gate at the fence is priced the way it is.
 */
export const PROPOSALS: Proposal[] = [
  {
    id: 'pv1_work',
    act: 1,
    advisor: 'fool',
    /**
     * Not in the first spring.
     *
     * Nobody who has just walked out of somewhere writes a rule about the work
     * on the first morning; they put a roof up, or somewhere to work, and find
     * out what the place is like. So the first year is the place living and
     * one year of work spent on a house or a cabin, and the seal comes out in
     * the second spring, by which time there is something for it to be about.
     */
    unlockedBy: { kind: 'turn', op: 'gte', value: 2 },
    title: 'Five Pairs of Hands',
    advice: {
      option: 0,
      line: "Share it. The day we start counting whose row is whose is the day somebody stops digging.",
    },
    problem: [
      'A handful of us, open ground, water we have not lined yet, and a seal that somebody has to hold.',
      'Say how the work goes. Everyone will hear you, because everyone is here.',
    ],
    options: [
      {
        subject: 'work',
        action: 'shared',
        label: 'THE WORK OF THIS PLACE IS SHARED ALIKE, AND SO IS THE HARVEST',
        tags: ['egalitarian'],
        /* The gladness of the first spring, paid once. It used to be a mood a
           year, and a standing point of mood is not a mood: it is the growth
           term, compounding, for the whole reign - the shared field ended up
           seventy souls and a hundred points of reign ahead of the other two
           on that one number alone. The cheer is the same size on the day and
           it stops being an engine. */
        effects: { mood: 6 },
        // five pairs of hands on one row eat better and quarrel less, and the
        // seal digs alongside them, which is the one thing it cannot afford to
        perTurn: { economy: 2, health: 1, crownSanity: -1 },
        perTurnTown: { mood: 2, health: 1, economy: -2 },
        /* The first law leaves a mark on the meadow that outlasts everything
           else it does: shared work grazes a shared common, and the goats are
           on it from the second spring. */
        cityFlagsOn: ['goat_parade'],
        cityFlagsOff: ['meadow_fenced'],
        aftermathId: 'am_work_shared',
      },
      {
        subject: 'work',
        action: 'ruled',
        label: 'THE WORK OF THIS PLACE IS ORDERED BY ONE, WHO DOES NOT DIG',
        tags: ['meritocratic', 'communitarian'],
        effects: {},
        /* Somebody who does not dig can see the whole field, which is worth a
           little of everything. What it costs in a hamlet is a pair of hands
           out of five, and it is the town that reads it as an insult - the
           square's patience is what ends a reign, and a law read in year two
           should not be spending it every spring for forty years. */
        perTurn: { crownSanity: 2, economy: 1, health: -1 },
        perTurnTown: { economy: 2, army: 1, mood: -2 },
        isBadIdea: true,
        aftermathId: 'am_work_ruled',
      },
      {
        subject: 'work',
        action: 'owned',
        label: "THE WORK OF THIS PLACE IS EACH ONE'S OWN, AND SO IS WHAT IT BRINGS",
        tags: ['libertarian'],
        effects: {},
        // the fastest store in the game, paid for by the two people it leaves
        // behind: nobody carries anybody, and everybody knows it
        perTurn: { economy: 3, health: -1 },
        perTurnTown: { economy: 3, health: -1, mood: -1 },
        // and what is each one's own gets a line drawn round it
        cityFlagsOn: ['meadow_fenced'],
        cityFlagsOff: ['goat_parade'],
        aftermathId: 'am_work_owned',
      },
    ],
  },

  {
    id: 'pv2_strangers',
    act: 2,
    advisor: 'captain',
    // the first spring is about the five of you and the field; nobody has
    // stopped at the fence yet, because there is barely a fence
    unlockedBy: { kind: 'turn', op: 'gte', value: 2 },
    title: 'The Fence',
    advice: {
      option: 1,
      line: "A year of work first. I have nothing against strangers. I have something against a gate that means nothing.",
    },
    problem: [
      'People walk past on the road. Some of them stop at the fence.',
      'Say what the fence is for.',
    ],
    options: [
      /* Three doors, and none of them is the good one. The open door fills
         the place fastest and is the hardest to hold; the year of work fills
         it slower and fills the store while it does; the closed gate keeps
         every board it has and stays small. Read down the three and every one
         of them costs something on the line under the thing it gives.

         The open door used to pay for itself twice - two off the well in a
         hamlet and one more in a town - and that is why the fastest growing
         answer in the game ended reigns with the fewest people in them.
         `roomFor` is built out of the store, so souls are bound by what the
         place has built and not by how fast anybody arrives: an answer that
         empties the well to bring people in brings nobody. It pays in the
         crown now, which is the honest bill for a gate that is hard to
         govern, and the well is what the town queues at. */
      {
        subject: 'strangers',
        action: 'welcomed',
        label: 'A STRANGER AT THE FENCE IS GIVEN A ROOF AND A SHARE',
        tags: ['communitarian'],
        // the square likes an open gate on the day it is read out
        effects: { mood: 6 },
        // more hands than the store was built for, a gate people are glad to be
        // on the inside of, and nobody at all who agrees with the seal
        perTurn: { economy: 2, mood: 1, crownSanity: -1 },
        // and a town that lets people in hears more songs than one that does
        // not, and queues at the same one well
        perTurnTown: { mood: 2, culture: 1, health: -1 },
        growth: 1.22,
        cityFlagsOff: ['camp_outside'],
        aftermathId: 'am_strangers_welcomed',
      },
      {
        subject: 'strangers',
        action: 'earned',
        label: 'A STRANGER AT THE FENCE WORKS A YEAR BEFORE A SHARE',
        tags: ['meritocratic'],
        // the square neither cheers a year of somebody else's work nor minds it
        effects: {},
        // a year of somebody else's work is worth having, and worth arguing about
        perTurn: { economy: 3, crownSanity: -1 },
        perTurnTown: { army: 1, economy: 2, mood: -1 },
        growth: 1.15,
        aftermathId: 'am_strangers_earned',
      },
      {
        subject: 'strangers',
        action: 'turned_away',
        label: 'A STRANGER AT THE FENCE IS TURNED AWAY BEFORE DARK',
        tags: ['kantian'],
        effects: { mood: -8 },
        /* A gate that means something is cheap to keep: nobody new to feed,
           nobody new to bury, and a seal that is obeyed at the one place
           everybody can see it. What it buys is boards, and what it costs is
           the road - at 1.12 it is exactly the ground on its own, so the law
           does nothing at all for the count and the other two do. It used to
           be 1.05, which is a rule that empties a valley, and a bad idea is
           supposed to be a worse reign and not a shorter one. */
        perTurn: { crownSanity: 2, health: 1, mood: -1 },
        perTurnTown: { crownSanity: 2, economy: 2, mood: -1, culture: -1 },
        growth: 1.12,
        isBadIdea: true,
        /* Turned away before dark is not the same as gone. They stop where the
           road stops being yours, and the place walks past them every day. */
        cityFlagsOn: ['camp_outside'],
        aftermathId: 'am_strangers_turned_away',
      },
    ],
  },


  /**
   * The two the hamlet writes for itself, after the work and the fence and
   * before anybody has mentioned a charter. Neither is about how the place
   * earns: one is about what it does on the worst day it has, and the other
   * about the one thing it did not have to plant. A law gated on a crowd would
   * never reach a place this size, so both wait on nothing but a year or two of
   * the place existing.
   */
  {
    id: 'pv3_dead',
    act: 3,
    advisor: 'healer',
    /* Somebody has to have died before this is a question, and it used to be
       a calendar that decided that: year four, whatever had or had not
       happened by year four. It is the burial that decides it now. The year
       the count first falls, or the first long winter, the healer is at the
       door with this, and it lands on a place that has just carried somebody
       up the far field rather than on one that is being asked to imagine it.
       The year is still there underneath, unchanged, so a place that is living
       well is asked on the same schedule it always was. The flag can only ever
       bring this forward. */
    unlockedBy: {
      kind: 'any',
      conds: [
        { kind: 'flag', flag: 'first_dead' },
        { kind: 'turn', op: 'gte', value: 4 },
      ],
    },
    title: 'The Ground',
    advice: {
      option: 1,
      line: "Let the house carry its own. I have seen a whole place stop for three days over one death, and come out of it with two.",
    },
    problem: [
      'We buried the old man at the top of the far field on Tuesday and it took the whole day, because everybody stopped, because everybody knew him. That was a whole day of every pair of hands we have, in the middle of the sowing.',
      'There will be more of them, and there will be a year when we cannot afford the day. Say now what we do, while it is nobody in particular we are talking about.',
    ],
    options: [
      {
        subject: 'dead',
        action: 'with_a_day',
        label: 'A DEATH IN THIS PLACE STOPS THE WORK, AND ALL OF US STAND IN IT',
        tags: ['communitarian'],
        effects: { mood: 8 },
        // the whole day of every pair of hands, which is the sentence saying
        // out loud what it costs
        perTurn: { mood: 2, economy: -1 },
        // a town cannot stop for every one of them, and stops for the ones it
        // decides count, which is where a calendar of feast days comes from
        perTurnTown: { culture: 2, mood: 1, economy: -3 },
        aftermathId: 'am_dead_with_a_day',
      },
      {
        subject: 'dead',
        action: 'by_the_house',
        label: 'A DEATH IN THIS PLACE IS CARRIED BY THE HOUSE IT HAPPENED IN',
        tags: ['libertarian'],
        effects: { mood: -4 },
        // the sowing does not stop, and one house carries it alone
        perTurn: { economy: 3, mood: -1 },
        perTurnTown: { economy: 3, mood: -2 },
        aftermathId: 'am_dead_by_the_house',
      },
      {
        subject: 'dead',
        action: 'at_the_edge',
        label: 'A DEATH IN THIS PLACE GOES IN THE GROUND AT THE EDGE, THE SAME DAY',
        tags: ['utilitarian'],
        effects: { mood: -6 },
        // nothing stops and nothing sits in the house for three days, which is
        // the healthiest and coldest thing the place could possibly do
        perTurn: { economy: 2, health: 1, mood: -2 },
        perTurnTown: { economy: 3, health: 1, mood: -2, culture: -1 },
        isBadIdea: true,
        cityFlagsOn: ['mourning_ribbons'],
        aftermathId: 'am_dead_at_the_edge',
      },
    ],
  },

  {
    id: 'pv4_mushrooms',
    act: 4,
    advisor: 'fool',
    unlockedBy: { kind: 'turn', op: 'gte', value: 6 },
    title: 'The Ring',
    advice: {
      option: 0,
      line: "Whoever is standing under it. You cannot ration a wood. You can only make people lie about a basket.",
    },
    problem: [
      'There is a thing in the beeches that nobody planted, that comes up in a wet September, that sells in the next valley for more than the barley does. Two people are out there before dawn already and they are not speaking to each other about it.',
      'I should say, since nobody else will, that some of what comes up will kill you, and that telling the difference is a skill three of us have and six of us think we have.',
    ],
    options: [
      {
        subject: 'mushrooms',
        action: 'finders',
        label: 'WHAT GROWS IN THE WOOD BELONGS TO WHOEVER IS UP EARLY ENOUGH TO FIND IT',
        tags: ['libertarian'],
        effects: { mood: -6 },
        // two people out before dawn and not speaking, every September
        perTurn: { economy: 3, health: -1 },
        perTurnTown: { economy: 3, health: -1 },
        aftermathId: 'am_mushrooms_finders',
      },
      {
        subject: 'mushrooms',
        action: 'weighed',
        label: 'WHAT GROWS IN THE WOOD IS PICKED BY THE PLACE, AND WEIGHED, AND SHARED',
        tags: ['egalitarian'],
        /* The one answer that puts anything on the hamlet's worst board, and
           the reason to take it. Health starts at eighteen and the well is
           years away, so a standing point of it is worth more than the third
           the store gets next door - which is why the cheer for it is small:
           a weighed basket is fair rather than popular. */
        effects: { mood: 2 },
        perTurn: { health: 1, mood: 1, economy: -1 },
        perTurnTown: { health: 2, mood: 1, economy: -2 },
        aftermathId: 'am_mushrooms_weighed',
      },
      {
        subject: 'mushrooms',
        action: 'for_the_cart',
        label: 'WHAT GROWS IN THE WOOD GOES ON THE CART, AND NOBODY HERE EATS IT',
        tags: ['meritocratic'],
        effects: { mood: -6 },
        // the best price in the game for the thing nobody planted, and the
        // six who think they can tell the difference eat the rest of it
        perTurn: { economy: 3, health: -2 },
        perTurnTown: { economy: 4, health: -1, mood: -1 },
        isBadIdea: true,
        cityFlagsOn: ['share_stalls'],
        aftermathId: 'am_mushrooms_for_the_cart',
      },
    ],
  },

  {
    id: 'p1_trade',
    act: 5,
    advisor: 'treasurer',
    // a market is an argument you can have at twenty people, and they are having it
    unlockedBy: { kind: 'souls', op: 'gte', value: 18 },
    title: 'The Market',
    advice: {
      option: 1,
      line: "A tenth to the crown. Free trade fills somebody's pocket, and this is the only room where it fills ours.",
    },
    problem: [
      'There is no law about trade in this place. There never has been, and until this spring there was nothing to trade.',
      'Free it, tax it, or give it to the Guild.',
    ],
    options: [
      {
        subject: 'trade',
        action: 'free',
        label: 'ALL TRADE IN THIS PLACE IS FREE, AND PAYS NOTHING',
        tags: ['libertarian'],
        /* Sixteen was the loudest cheer any sentence in the game got, and it
           settled this act on its own: a tenth of it is on the boards the day
           the seal comes down, and no trend the other two carry catches up
           with that inside the years a player is looking ahead. Ten still
           reads as the square's favourite law. It is no longer the answer. */
        effects: { mood: 10 },
        // it fills every pocket in the square, and it brings every cart and every
        // cough on the road in with it
        perTurn: { economy: 3, health: -1 },
        cityFlagsOn: ['tavern_rowdy'],
        cityFlagsOff: ['tavern_shuttered'],
        aftermathId: 'am_trade_free',
      },
      {
        subject: 'trade',
        action: 'taxed',
        label: 'ALL TRADE IN THIS PLACE PAYS THE CROWN A TENTH',
        tags: ['utilitarian'],
        // a tenth of everything is the one law here that pays the crown, and
        // the square counts it out loud every market day
        effects: { mood: -6 },
        perTurn: { crownSanity: 2, economy: 1, mood: -1 },
        cityFlagsOn: ['exam_desk'],
        cityFlagsOff: ['tavern_shuttered'],
        aftermathId: 'am_trade_taxed',
      },
      {
        subject: 'trade',
        action: 'licensed',
        label: 'ALL TRADE IN THIS PLACE BELONGS TO THE GUILD ALONE',
        tags: ['communitarian', 'meritocratic'],
        effects: { mood: -6 },
        // the Guild keeps a quiet market and its own men on the door
        perTurn: { economy: 3, army: 1, mood: -2 },
        isBadIdea: true,
        /* A house that sells drink without the Guild's leave is a house
           selling without leave, so it boards up, and the lanterns move into
           the back lanes where the trade went. */
        cityFlagsOn: ['baron_banner', 'smuggler_lanterns', 'tavern_shuttered'],
        cityFlagsOff: ['tavern_rowdy'],
        aftermathId: 'am_trade_licensed',
      },
    ],
  },

  {
    id: 'p2_lives',
    act: 6,
    advisor: 'captain',
    unlockedBy: { kind: 'stage', stage: 'town' },
    title: 'The Levers',
    advice: {
      option: 2,
      line: "Draw for it. I have done the counting before and the counting is the part that stays with you.",
    },
    problem: [
      'Every loaded cart in this town comes down one hill, and where a brake fails there is a man at a lever who decides which way it goes.',
      'They are not asking what is right. They are asking what happens to them afterwards.',
    ],
    options: [
      {
        subject: 'lives',
        action: 'by_count',
        label: 'WHEN A DEATH CANNOT BE AVOIDED, THE GREATER NUMBER IS SAVED',
        tags: ['utilitarian'],
        effects: { mood: -6 },
        // the carts get through and the men at the levers stop hesitating
        perTurn: { army: 2, economy: 1, mood: -2 },
        isBadIdea: true,
        cityFlagsOn: ['war_banners'],
        aftermathId: 'am_lives_by_count',
      },
      {
        subject: 'lives',
        action: 'untouchable',
        label: 'WHEN A DEATH CANNOT BE AVOIDED, NO HAND MAY CHOOSE WHO DIES',
        tags: ['kantian'],
        effects: { mood: 4 },
        // nobody's hand on it, and a hill full of carts nobody will touch
        perTurn: { mood: 2, health: -1 },
        aftermathId: 'am_lives_untouchable',
      },
      {
        subject: 'lives',
        action: 'by_lot',
        label: 'WHEN A DEATH CANNOT BE AVOIDED, THE LOT DECIDES',
        tags: ['egalitarian'],
        effects: { mood: 2 },
        // the lot is the one answer the square can repeat to itself afterwards,
        // and it is repeated, which is where half the songs come from
        perTurn: { mood: 1, culture: 1, army: -1 },
        aftermathId: 'am_lives_by_lot',
      },
    ],
  },

  {
    id: 'p3_truth',
    act: 7,
    advisor: 'fool',
    unlockedBy: { kind: 'stage', stage: 'town' },
    title: 'The Word',
    advice: {
      option: 1,
      line: "Let it be kind. Somewhere that demands the whole truth is somewhere nobody says anything after the first winter.",
    },
    problem: [
      'The Healer has begun answering the dying with dates. The town is not sure it wanted to know.',
      'Whatever you write here, you are under it as well. Ask me what I do for a living.',
    ],
    options: [
      {
        subject: 'truth',
        action: 'mandatory',
        label: 'A WORD SPOKEN IN THIS TOWN MUST BE TRUE',
        tags: ['kantian'],
        effects: { mood: -2 },
        /* A town that cannot lie is the only kind a seal can actually govern,
           and the Healer's dates are worth having. It is the one answer here
           that moves two boards up, which is what pays for the square hating
           it: the kind lie is cheered on the day and does less every year
           after, and neither of them is the answer twice running. */
        perTurn: { crownSanity: 2, health: 1, mood: -2 },
        aftermathId: 'am_truth_mandatory',
      },
      {
        subject: 'truth',
        action: 'kind_lies',
        label: 'A WORD SPOKEN IN THIS TOWN MAY BE KIND INSTEAD OF TRUE',
        tags: ['communitarian'],
        // the loudest cheer in the act, and the least under it
        effects: { mood: 14 },
        // the kindest board in the game to hold, and the one nobody can check
        perTurn: { mood: 2, health: -1 },
        aftermathId: 'am_truth_kind_lies',
      },
      {
        subject: 'truth',
        action: 'licensed',
        label: 'A WORD SPOKEN IN THIS TOWN MAY LIE ONLY BY BOUGHT LICENCE',
        tags: ['libertarian', 'meritocratic'],
        effects: { mood: -6 },
        /* The licence is sold, so it earns, and it was the only trend in the
           game that took two off the crown a year: at a town's weight that is
           nine points a spring against a drift of one and a half, which is not
           a bad idea, it is an ending with a delay on it. It costs one now,
           and the square carries the other half. */
        perTurn: { economy: 3, mood: -2 },
        isBadIdea: true,
        cityFlagsOn: ['quack_row', 'share_stalls'],
        aftermathId: 'am_truth_licensed',
      },
    ],
  },
  {
    id: 'p4_crime',
    act: 8,
    advisor: 'captain',
    // theft needs enough people that you cannot simply ask everyone
    unlockedBy: { kind: 'souls', op: 'gte', value: 30 },
    title: 'The Crossroads',
    advice: {
      option: 1,
      line: "Pay it back twice. A rope buys a quiet lane full of people who will not open a door to you.",
    },
    problem: [
      'Things go missing now. In a hamlet of five that was a conversation; here it is a job for somebody.',
      'Say what happens to a hand that takes. Say it before you know whose hand it is.',
    ],
    options: [
      {
        subject: 'crime',
        action: 'forgiven',
        label: 'A HAND THAT TAKES WHAT IS NOT ITS OWN IS FED, AND ASKED WHY',
        tags: ['communitarian'],
        /* Ten was the whole act. The square cheers a fed thief more than it
           cheers being paid back, and at a town's weight that cheer was worth
           more than the store the other sentence puts in every year for the
           rest of the reign. Six still makes it the popular one. */
        effects: { mood: 6 },
        // fed, and asked why, out of the same store the hand took from
        perTurn: { mood: 2, economy: -1 },
        perTurnWatch: { mood: 3, army: -2 },
        aftermathId: 'am_crime_forgiven',
      },
      {
        subject: 'crime',
        action: 'repaid',
        label: 'A HAND THAT TAKES WHAT IS NOT ITS OWN PAYS BACK TWICE, AND IS DONE WITH IT',
        tags: ['egalitarian', 'utilitarian'],
        effects: { mood: -2 },
        // twice back is the one sentence in the act that puts anything in,
        // and a lane that settles its own scores keeps the watch small
        perTurn: { economy: 2, army: -1 },
        perTurnWatch: { economy: 2, mood: -1 },
        aftermathId: 'am_crime_repaid',
      },
      {
        subject: 'crime',
        action: 'hanged',
        label: 'A HAND THAT TAKES WHAT IS NOT ITS OWN IS HANGED AT THE CROSSROADS',
        tags: ['kantian', 'meritocratic'],
        effects: { mood: -6 },
        // a rope buys a quiet lane, and a quiet lane is cheap to keep
        perTurn: { army: 3, economy: 1, mood: -2 },
        perTurnWatch: { army: 3, economy: 2, mood: -2, culture: -2 },
        isBadIdea: true,
        cityFlagsOn: ['gates_closed'],
        aftermathId: 'am_crime_hanged',
      },
    ],
  },
  {
    id: 'p5_song',
    act: 9,
    advisor: 'fool',
    // a town has a square, and a square on fair day has two hats going round
    unlockedBy: { kind: 'stage', stage: 'town' },
    title: 'The Two Hats',
    advice: {
      option: 1,
      line: "Let the crowd count. The hall knows what is good; the crowd knows what it will stand in the rain for.",
    },
    problem: [
      'On fair day the square has the players and their tragedy at one end and a man who eats worms for coppers at the other, and a hat going round for each. The worm hat comes back heavier. It always does.',
      'Say what the town pays for, out of the fair purse. I have a hat of my own, so I will not pretend this is not about me.',
    ],
    options: [
      {
        subject: 'song',
        action: 'worthy',
        label: 'A SONG SUNG IN THIS TOWN IS PAID FOR IF THE HALL CALLS IT WORTHY',
        tags: ['meritocratic'],
        effects: { mood: 4 },
        // the hall sits on Thursdays, and sitting costs, and the square is not
        // asked; what it buys is the only real run of songs in the game
        perTurn: { culture: 3, mood: -1, economy: -1 },
        aftermathId: 'am_song_worthy',
      },
      {
        subject: 'song',
        action: 'by_crowd',
        label: 'A SONG SUNG IN THIS TOWN IS PAID FOR BY THE SIZE OF ITS CROWD',
        tags: ['utilitarian'],
        effects: { mood: 4 },
        // the square gets what it will stand in the rain for, and pays for it
        perTurn: { mood: 2, culture: -1 },
        aftermathId: 'am_song_by_crowd',
      },
      {
        subject: 'song',
        action: 'by_hat',
        label: 'A SONG SUNG IN THIS TOWN IS PAID FOR BY ITS OWN HAT, OR NOT AT ALL',
        tags: ['libertarian'],
        effects: { mood: -2 },
        // the purse stays shut, and the songs go where the purses are open
        perTurn: { economy: 3, culture: -1, mood: -1 },
        isBadIdea: true,
        aftermathId: 'am_song_by_hat',
      },
    ],
  },
];
