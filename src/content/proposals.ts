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
 */
export const PROPOSALS: Proposal[] = [
  {
    id: 'pv1_work',
    act: 1,
    advisor: 'fool',
    title: 'Five Pairs of Hands',
    advice: {
      option: 0,
      line: "Share it. The day we start counting whose row is whose is the day somebody stops digging.",
    },
    problem: [
      'A handful of us, one field, one well, and a seal that somebody has to hold.',
      'Say how the work goes. Everyone will hear you, because everyone is here.',
    ],
    options: [
      {
        subject: 'work',
        action: 'shared',
        label: 'THE WORK OF THIS PLACE IS SHARED ALIKE, AND SO IS THE HARVEST',
        tags: ['egalitarian'],
        effects: {},
        perTurn: { economy: 2, health: 1, crownSanity: -1 },
        perTurnTown: { mood: 2, economy: -2 },
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
        perTurn: { crownSanity: 2, economy: -1 },
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
        perTurn: { economy: 2, health: -1 },
        perTurnTown: { economy: 2, mood: -2 },
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
         the place fastest and makes it sickest; the year of work fills it
         slower and keeps it standing; the closed gate is safe, and nobody
         comes. Read down the three and every one of them costs something on
         the line under the thing it gives. */
      {
        subject: 'strangers',
        action: 'welcomed',
        label: 'A STRANGER AT THE FENCE IS GIVEN A ROOF AND A SHARE',
        tags: ['communitarian'],
        effects: {},
        // more hands than the store was built for, and more coughs than the well was
        perTurn: { economy: 2, health: -2 },
        // and a town that lets people in hears more songs than one that does not
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
        effects: { mood: -4 },
        // a year of somebody else's work is worth having, and worth arguing about
        perTurn: { economy: 1, crownSanity: -1 },
        perTurnTown: { army: 1, mood: -1 },
        growth: 1.15,
        aftermathId: 'am_strangers_earned',
      },
      {
        subject: 'strangers',
        action: 'turned_away',
        label: 'A STRANGER AT THE FENCE IS TURNED AWAY BEFORE DARK',
        tags: ['kantian'],
        effects: {},
        perTurn: { crownSanity: 1, economy: -1 },
        perTurnTown: { mood: -2, culture: -1 },
        growth: 1.05,
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
    // somebody has to have died before this is a question, and in a place of
    // nine that takes a year or two of being a place
    unlockedBy: { kind: 'turn', op: 'gte', value: 4 },
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
        effects: { mood: 12 },
        perTurn: { mood: 2, economy: -1 },
        // a town cannot stop for every one of them, and stops for the ones it
        // decides count, which is where a calendar of feast days comes from
        perTurnTown: { culture: 2, mood: 1, economy: -2 },
        aftermathId: 'am_dead_with_a_day',
      },
      {
        subject: 'dead',
        action: 'by_the_house',
        label: 'A DEATH IN THIS PLACE IS CARRIED BY THE HOUSE IT HAPPENED IN',
        tags: ['libertarian'],
        effects: { mood: -6 },
        perTurn: { economy: 1, mood: -1 },
        perTurnTown: { economy: 2, mood: -2 },
        aftermathId: 'am_dead_by_the_house',
      },
      {
        subject: 'dead',
        action: 'at_the_edge',
        label: 'A DEATH IN THIS PLACE GOES IN THE GROUND AT THE EDGE, THE SAME DAY',
        tags: ['utilitarian'],
        effects: { mood: -16 },
        perTurn: { economy: 2, health: 1, mood: -3 },
        perTurnTown: { economy: 2, health: 1, mood: -3, culture: -1 },
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
        effects: { mood: -4 },
        perTurn: { economy: 2, mood: -1 },
        perTurnTown: { economy: 2, health: -1 },
        aftermathId: 'am_mushrooms_finders',
      },
      {
        subject: 'mushrooms',
        action: 'weighed',
        label: 'WHAT GROWS IN THE WOOD IS PICKED BY THE PLACE, AND WEIGHED, AND SHARED',
        tags: ['egalitarian'],
        effects: { mood: 6 },
        perTurn: { health: 1, mood: 1, economy: -1 },
        perTurnTown: { health: 1, mood: 1, economy: -2 },
        aftermathId: 'am_mushrooms_weighed',
      },
      {
        subject: 'mushrooms',
        action: 'for_the_cart',
        label: 'WHAT GROWS IN THE WOOD GOES ON THE CART, AND NOBODY HERE EATS IT',
        tags: ['meritocratic'],
        effects: { mood: -8 },
        perTurn: { economy: 3, health: -2 },
        perTurnTown: { economy: 3, health: -2, mood: -1 },
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
        effects: { mood: 16 },
        perTurn: { economy: 2, army: -1 },
        cityFlagsOn: ['tavern_rowdy'],
        cityFlagsOff: ['tavern_shuttered'],
        aftermathId: 'am_trade_free',
      },
      {
        subject: 'trade',
        action: 'taxed',
        label: 'ALL TRADE IN THIS PLACE PAYS THE CROWN A TENTH',
        tags: ['utilitarian'],
        effects: { mood: -8 },
        perTurn: { army: 1, mood: -1 },
        cityFlagsOn: ['exam_desk'],
        cityFlagsOff: ['tavern_shuttered'],
        aftermathId: 'am_trade_taxed',
      },
      {
        subject: 'trade',
        action: 'licensed',
        label: 'ALL TRADE IN THIS PLACE BELONGS TO THE GUILD ALONE',
        tags: ['communitarian', 'meritocratic'],
        effects: { mood: -16 },
        perTurn: { economy: 1, mood: -2 },
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
      'Eleven men in this town stand next to levers on the ore road, and a runaway cart goes wherever the lever sends it.',
      'They are not asking what is right. They are asking what happens to them afterwards.',
    ],
    options: [
      {
        subject: 'lives',
        action: 'by_count',
        label: 'WHEN A DEATH CANNOT BE AVOIDED, THE GREATER NUMBER IS SAVED',
        tags: ['utilitarian'],
        effects: {},
        perTurn: { army: 1, mood: -2 },
        isBadIdea: true,
        cityFlagsOn: ['war_banners'],
        aftermathId: 'am_lives_by_count',
      },
      {
        subject: 'lives',
        action: 'untouchable',
        label: 'WHEN A DEATH CANNOT BE AVOIDED, NO HAND MAY CHOOSE WHO DIES',
        tags: ['kantian'],
        effects: {},
        perTurn: { mood: 2, health: -1 },
        aftermathId: 'am_lives_untouchable',
      },
      {
        subject: 'lives',
        action: 'by_lot',
        label: 'WHEN A DEATH CANNOT BE AVOIDED, THE LOT DECIDES',
        tags: ['egalitarian'],
        effects: { mood: 8 },
        perTurn: { mood: 1, army: -1 },
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
        effects: {},
        perTurn: { health: 1, mood: -2 },
        aftermathId: 'am_truth_mandatory',
      },
      {
        subject: 'truth',
        action: 'kind_lies',
        label: 'A WORD SPOKEN IN THIS TOWN MAY BE KIND INSTEAD OF TRUE',
        tags: ['communitarian'],
        effects: {},
        perTurn: { mood: 2, health: -1 },
        aftermathId: 'am_truth_kind_lies',
      },
      {
        subject: 'truth',
        action: 'licensed',
        label: 'A WORD SPOKEN IN THIS TOWN MAY LIE ONLY BY BOUGHT LICENCE',
        tags: ['libertarian', 'meritocratic'],
        effects: { mood: -16 },
        perTurn: { economy: 2, crownSanity: -2 },
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
        effects: { mood: 10 },
        perTurn: { mood: 2, economy: -1 },
        perTurnWatch: { mood: 3, army: -2 },
        aftermathId: 'am_crime_forgiven',
      },
      {
        subject: 'crime',
        action: 'repaid',
        label: 'A HAND THAT TAKES WHAT IS NOT ITS OWN PAYS BACK TWICE, AND IS DONE WITH IT',
        tags: ['egalitarian', 'utilitarian'],
        effects: { mood: -4 },
        perTurn: { economy: 2, mood: -1 },
        perTurnWatch: { economy: 2, mood: -2 },
        aftermathId: 'am_crime_repaid',
      },
      {
        subject: 'crime',
        action: 'hanged',
        label: 'A HAND THAT TAKES WHAT IS NOT ITS OWN IS HANGED AT THE CROSSROADS',
        tags: ['kantian', 'meritocratic'],
        effects: { mood: -14 },
        perTurn: { army: 2, mood: -3 },
        perTurnWatch: { army: 2, mood: -2, culture: -2 },
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
        effects: { mood: -6 },
        // the hall sits on Thursdays, and sitting costs, and the square is not asked
        perTurn: { culture: 2, mood: -1, economy: -1 },
        aftermathId: 'am_song_worthy',
      },
      {
        subject: 'song',
        action: 'by_crowd',
        label: 'A SONG SUNG IN THIS TOWN IS PAID FOR BY THE SIZE OF ITS CROWD',
        tags: ['utilitarian'],
        effects: { mood: 12 },
        // the square gets what it will stand in the rain for, and pays for it
        perTurn: { mood: 2, culture: -1, economy: -1 },
        aftermathId: 'am_song_by_crowd',
      },
      {
        subject: 'song',
        action: 'by_hat',
        label: 'A SONG SUNG IN THIS TOWN IS PAID FOR BY ITS OWN HAT, OR NOT AT ALL',
        tags: ['libertarian'],
        effects: {},
        // the purse stays shut, and the songs go where the purses are open
        perTurn: { economy: 2, culture: -2, mood: -1 },
        isBadIdea: true,
        aftermathId: 'am_song_by_hat',
      },
    ],
  },
];
