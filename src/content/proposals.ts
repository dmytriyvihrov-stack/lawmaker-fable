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
    title: 'Seven Pairs of Hands',
    advice: {
      option: 0,
      line: "The day we start counting whose row is whose is the day somebody stops digging.",
    },
    problem: [
      'To survive, we have to decide how the work is split, and who gets what it brings.',
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
        /* Three at a town, and not two. Ordered work and owned work both paid
           the town two and cost it two of the square's temper, and ordering it
           also raised a watch, so there was nothing on the card that owning it
           was the best answer for and no reason a player would ever write it.
           A market is what a place of five hundred does with owned work, and a
           market outproduces an administration: that is the one number that
           says so. */
        perTurnTown: { economy: 3, mood: -2 },
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
    /* The first spring is about the seven of you and the field; nobody has
       stopped at the fence yet, because there is barely a fence.

       And the fence waits for the work as well. Both of these used to open in
       the second spring together, so the first seal of a reign was a choice
       between what the work is and what the gate is for, offered to somebody
       who had been ruling for one year and had written nothing yet. The first
       law of a reign is about the work, always: it is the one every other law
       here is read against, and the four fences in the meadow and the herd on
       the common are drawn from it. Asked for by the user. */
    unlockedBy: {
      kind: 'all',
      conds: [
        { kind: 'turn', op: 'gte', value: 2 },
        { kind: 'lawActive', subject: 'work' },
      ],
    },
    title: 'The Fence',
    advice: {
      option: 1,
      line: "A year of work first. I have nothing against strangers. I have something against a gate that means nothing.",
    },
    problem: [
      'People walk past on the road. Some of them stop at your village.',
      'Say how you treat them.',
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
        /* The square, on the day it is read out.

           Four strangers at a table laid for five is a thing the five have an
           opinion about, and the answer used to cost them nothing at all. It
           lands once, here, and not every year: how the square feels is one
           of the terms that decides who moves in, so a standing grievance of
           this size is an open door that closes itself over about fifteen
           years, and the one thing this answer is for is that it does not.
           Asked for by the user. */
        effects: { mood: -8 },
        /**
         * The open door pays in people and in nothing else.
         *
         * It used to pay the store two a year as well, on top of the fastest
         * growth in the game and the only law that raises the square's temper
         * and its songs at once, against one cost: the well and the roof. Read
         * down the card there was nothing to weigh, which is the one thing a
         * law in this game may not be. A stranger given a roof and a share
         * eats a share, so the store is where it does not show, and what the
         * place gets for it is the twenty two percent and the two boards a
         * town feels. More hands than the store was built for, and more coughs
         * than the well was.
         */
        /* And the crown, every year of it. An open gate is the fastest
           growth in the game and it was paid for on one line, the conditions,
           which reads as a place that is only ever more crowded. It is also a
           monarch who has stopped being able to name the people in the
           square, and that is a thing that goes on happening. */
        perTurn: { health: -2, crownSanity: -1 },
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
        /* A year of somebody else's work is worth having, and worth arguing
           about, and the arguing is the line the square feels. This is the
           one board no other answer to the fence costs anything on: an open
           door upsets the square once, on the day it is read, and a closed
           gate never upsets it at all, but a place with two kinds of person
           in it has the same conversation every spring. */
        perTurn: { economy: 1, crownSanity: -1, mood: -1 },
        perTurnTown: { army: 1, mood: -1 },
        /* A year of work first is a gate, and a gate is heard about on the
           road. It was fifteen percent, three quarters of the open door, for
           an answer meant to be the middle one and not the cheap version of
           the first: ten, against twenty two and five, puts it where it
           reads. Asked for by the user. */
        growth: 1.1,
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
        effects: { mood: 12 },
        perTurn: { mood: 2, economy: -1 },
        // a town cannot stop for every one of them, and stops for the ones it
        // decides count, which is where a calendar of feast days comes from
        perTurnTown: { culture: 2, mood: 1, economy: -2 },
        /* The strip at the edge, on this answer and the one under it.

           Both of them put the body in the ground at the edge of the place;
           what they argue about is who stops work for it. So the stones go up
           on the strip either way, and the map says so the year the law is
           sealed rather than waiting for a case to mention it. Asked for by
           the user. */
        cityFlagsOn: ['graves_at_the_edge'],
        aftermathId: 'am_dead_with_a_day',
      },
      {
        subject: 'dead',
        action: 'by_the_house',
        label: 'A DEATH IN THIS PLACE IS CARRIED BY THE HOUSE IT HAPPENED IN',
        tags: ['libertarian'],
        effects: { mood: -6 },
        /* The crown, because this is the only one of the three that never
           reaches the seal: a house buries its own and nobody asks the room
           upstairs what a death is worth. It was the invisible middle of this
           law, best at nothing and worst at nothing, and a player reading the
           card had no reason to pick it over either neighbour. */
        /* And what it costs is the songs, not the store.

           It paid the store a point a year, for a law whose whole content is
           that the place does not turn out: a household with a spade is not a
           harvest, and the card read as thrift with no downside. What a place
           that buries its own quietly actually loses is the thing everybody
           used to be standing in. Asked for by the user, twice: once to take
           the coin off it and once because the middle answer of this law was
           the one nobody could find a reason to pick. */
        perTurn: { crownSanity: 1, mood: -1, culture: -1 },
        /* And at a town it is also how a place stops noticing: the ones with
           nobody to carry them are carried by nobody. */
        perTurnTown: { crownSanity: 1, mood: -2, health: -1, culture: -1 },
        cityFlagsOn: ['graves_at_the_edge'],
        aftermathId: 'am_dead_by_the_house',
      },
      {
        subject: 'dead',
        /* The id is the old one and the answer is not.

           This slot used to be the strip at the edge, which is what the two
           answers above it now do on their own: with the stones going up
           either way there was nothing left here to choose, so the third door
           is the one that puts nobody in the ground at all. The `ActionId` is
           a closed list and a save holds the law by it, so it keeps the name
           it was sealed under. Asked for by the user. */
        action: 'at_the_edge',
        label: 'A DEATH IN THIS PLACE GOES INTO THE RIVER, THE SAME DAY',
        tags: ['utilitarian'],
        effects: { mood: -16 },
        /* What it saves and what it costs: no ground, no morning, no box, and
           a river everybody downstream of you drinks out of. */
        perTurn: { economy: 2, health: -1, mood: -3 },
        perTurnTown: { economy: 2, health: -2, mood: -3, culture: -1 },
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
        /* The crown, on the same argument as the law about the dead: a wood
           that belongs to whoever is up early is a wood nobody brings to the
           seal, and this was the answer with nothing on the card of its own.
           The cart pays better and the weighing feeds better; what this one
           does is leave the room upstairs alone. */
        perTurn: { crownSanity: 1, economy: 2, mood: -1 },
        perTurnTown: { crownSanity: 1, economy: 2, health: -1 },
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
        /**
         * Free trade fills somebody's pocket, and the store is not it.
         *
         * The three answers here had the money on the wrong one: trade that
         * paid nothing paid the crown two a year and lifted the square sixteen
         * points on the day, and the tenth to the crown paid the crown no
         * money at all. So the best answer was the free one on every line of
         * the card except a single point of watch, which is the treasurer
         * being ignored by arithmetic. The tenth is the money now, and what
         * free trade gives is what it actually gives: a square that likes you
         * and a market nobody is counting.
         */
        perTurn: { mood: 2, economy: -1, army: -1 },
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
        /* A tenth of everything, which is the only line in this law that puts
           anything in the store, and a year of arguing about what a tenth of a
           cartload is, which is what it costs the room upstairs. */
        perTurn: { economy: 2, army: 1, crownSanity: -1 },
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
        /* And the Guild's one gift, which is the reason anybody ever signs it:
           one body to deal with, one letter a year, and the seal never hears
           about a barrow of turnips again. It is a bad idea that has to look
           like a rest. */
        perTurn: { economy: 1, mood: -2, crownSanity: 1 },
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
        /* Twice of what, and says who. This was the answer with a gain on
           every line and a cost on none, and what it actually costs is the
           room upstairs: every theft in the place becomes a valuation, and
           the valuation comes to you. */
        perTurn: { crownSanity: -1, economy: 2, mood: -1 },
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
        /* The square gets what it will stand in the rain for, and pays for it,
           and it is dearer than the hall is: what draws a crowd needs a stage,
           a barrel and somebody to sweep up after it. It was the answer with
           twelve points of temper on the day and no line of its own to lose. */
        perTurn: { mood: 2, culture: -1, economy: -2 },
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
