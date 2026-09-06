import type { PhilTag } from '../engine/types';

/** All UI chrome lives here. Not one string of it in the components. */
export const UI = {
  title: {
    name: 'Lawmaker Fable',
    tagline: 'Five people, one field, and a seal. Write the law before the place is big enough to need it.',
    newGame: 'Begin a reign',
    continueGame: 'Continue your reign',
    confirmNew: 'This burns your current reign. There is no second copy. Begin anew?',
  },

  intro: {
    speaker: 'The Monarch',
    question: 'Who is a good ruler?',
    /**
     * The one place the game says what it is, and it now says it in four
     * lines instead of six paragraphs.
     *
     * A first screen is read once, standing up, by somebody who does not yet
     * care. It used to open with three paragraphs of a monarch nobody had met
     * about a place nobody had seen, and the answers were below the fold. So:
     * a picture of the five of you and two sentences about them, a picture of
     * the crown and two sentences about this one in particular, the job in a
     * line, and then the question. Everything cut from here is said again by
     * something that happens: the long winter has its own warning, and what
     * the seal costs is learned the first time it is spent.
     */
    brief: {
      heading: 'The founding',
      kicker: 'Spring. Five of you, and nothing written down anywhere.',
      caption:
        'You walked out of the old place together and stopped here, for the water. On the second night the others voted in a field with their hands up, and the seal is yours.',
      charge:
        'Look after them, settle what they bring to your door, and raise this place into a town.',
    },
    lead: [
      'A rider has come up from the capital with a stick of wax and one question.',
    ],
    footnote: 'Nothing binds you to this answer. It will be remembered anyway.',
    answers: [
      { tag: 'utilitarian' as PhilTag, text: 'One who leaves the most people better off.' },
      { tag: 'egalitarian' as PhilTag, text: 'One who weighs every neck the same.' },
      { tag: 'libertarian' as PhilTag, text: 'One who rules least, and is felt least.' },
      { tag: 'kantian' as PhilTag, text: 'One who holds to their own rule on the day it costs them.' },
    ],
  },

  court: {
    turn: 'Year',
    openCodex: 'Codex',
    /** The chrome is icons now: the word stays, as the label a reader hears. */
    codexIcon: '📖',
    people: 'people',
    /** The count of people is a picture of a person, at the width of one. */
    peopleIcon: '🧍',
    hamlet: 'a hamlet',
    town: 'a town',
    hamletIcon: '🏡',
    townIcon: '🏰',
    winterNear: 'Winter is close. The woodpiles are being counted.',
    /** The other clock. It runs whether or not anybody is looking at it. */
    winterIn: 'The long winter in {n} years.',
    winterNext: 'The long winter next year.',
    winterHere: 'The long winter. It holds the whole year.',
    /** The same clock at the width of the header: a mark and a count. */
    frostIn: 'in {n} years',
    frostNext: 'next year',
    frostHere: 'this year',
  },

  /** The one control on this screen that is about the game and not the place. */
  menu: {
    icon: '☰',
    open: 'Menu',
    heading: 'This reign',
    anew: 'Begin a new reign',
    anewLine: 'A different monarch, a different valley, from the first spring.',
    anewWarning: 'This reign ends here, unfinished, and is not kept. Nobody writes it down.',
    anewYes: 'BEGIN ANEW',
    anewNo: 'Not yet',
  },

  /**
   * How fast the years are allowed to go past.
   *
   * The wheel between decisions is the one stretch of this game that is purely
   * watched, and how long anybody wants to watch it is a fact about them and
   * not about the reign. One button, three notches, and it remembers.
   */
  speed: {
    label: 'How fast the years go',
    marks: ['▸', '▸▸', '▸▸▸'],
    names: ['A year at a time', 'Quicker', 'Get on with it'],
  },

  seasons: {
    spring: 'Spring',
    summer: 'Summer',
    autumn: 'Autumn',
    winter: 'Winter',
    yearTurns: 'The year turns',
  },

  works: {
    heading: 'The year of work',
    prompt: 'One thing gets built this year, or nothing does.',
    cost: 'costs {n} from the store',
    free: 'a full store pays half of it: {n} from the store',
    moves: 'What it changes',
    atOnce: 'at once',
    cannotPay: 'The store cannot pay for it this year.',
    /**
     * Not the same sentence as the one above it. A store that cannot pay
     * this year may pay next year; a store whose shelf ends below the price
     * will not pay in any year of the reign, and saying "this year" to
     * somebody in that position leaves them waiting on a number that has
     * already stopped.
     */
    overShelf: 'The store cannot hold {n}. Build a granary and it can.',
    maxed: 'Already the biggest in the county.',
    level: 'level {n} of {max}',
    /** A run of works that only make sense one after the other. */
    groupInfrastructure: 'What the place is built on',
    groupLine: 'One after the other. Each one opens the next.',
    /** Shown on a step of a chain that cannot be started yet. */
    needsFirst: 'Not until {name} stands.',
    reopenHeading: 'Or open a law again',
    /** The fold, so four standing laws do not push the year off the screen. */
    reopenToggle: 'Open a law again ({n} standing)',
    reopen: 'Reopen the law on {subject}',
    reopenLine: 'The place remembers the first law. Writing a second costs the crown and the square.',
    choose: 'SPEND THE YEAR',
    /**
     * The second half of a year of work: not what goes up, but where.
     *
     * Only asked once per building and only for the ones that stand in the
     * settlement rather than on the country. A road follows the feet and a cut
     * goes into the crag, and neither of those is a decision anybody has.
     */
    whereHeading: 'And where does it go?',
    whereLine: 'Six pieces of ground. Nothing moves once it is up. Click a peg on the town, or pick from this list.',
    whereNone: 'There is no ground left to build on. Nothing here can be moved to make room.',
    whereTaken: '{name} stands here',
    /* Both of these are the button itself, so they are in the button's voice.
       The ground is named after a colon rather than run into the sentence:
       half these names are prepositions already ("by the gate", "under the
       crag") and half are not ("the cart ground"), and no one sentence takes
       both. */
    wherePick: 'PICK THE GROUND FIRST',
    whereOn: 'SPEND THE YEAR: {where}',
  },

  techs: {
    heading: 'What the place is working out',
    open: 'Technology',
    openIcon: '⚙️',
    close: 'Close',
    points: 'in the pot',
    yearly: '{n} a year',
    unknown: 'not thought of yet',
    glimpsed: 'somebody has half an idea',
    done: 'There is nothing left that anybody here knows how to want.',
    waitingForSouls: 'Nobody here has the next idea yet. A bigger place would.',
    worked: 'Worked out',
    workedKicker: 'Nobody voted for this either',
    root: 'The place itself',
    rootLine: 'Nobody here was asked to work anything out. They do it between harvests, and then it is simply true.',
    working: 'being worked out',
    orderHint: 'Number {n} in the order this place works things out',
    progress: '{have} of {need}',
    eraLabel: 'Era {n}',
    locked: 'A hamlet works nothing out. Wait until there are {n} of you.',
    /** Shut is a picture. The number beside it says what it is waiting for. */
    lockedIcon: '🔒',
    soulsToGo: '{n} more souls to open',
    /** One is not "1 more souls". */
    oneSoulToGo: 'one more soul to open',
    wantsSouls: 'nobody thinks of this under {n} of them',
    wantsFirst: 'after {name}',
    branchField: 'Out of the field',
    branchCrowd: 'Out of the crowd',
    /** The ladder the place climbs by getting bigger, and nothing else. */
    growthHeading: 'What the place opens by filling up',
    growthKicker: 'Nothing here is bought. Two rungs are chosen, and the rest simply arrive.',
    growthSouls: '{n} of you',
    growthBoards: 'a board of its own',
    growthPick: 'one of these, and the other later',
    growthOpens: 'thinkable from here',
    growthReached: 'passed',
    growthNext: 'next',
    /** A trend on a board the place has not opened yet is banked, not lost. */
    banked: 'waits for that board',
    /** The crowd branch is gated on people, not on a good year. Say so, on top. */
    crowdGate: 'The crowd thinks of nothing under {n} of you.',
    /**
     * The rungs already behind you.
     *
     * A ladder of six full cards, five of them saying PASSED, was most of this
     * screen and none of its news. What is behind you is one line, and it
     * opens if you want to read your own history.
     */
    growthBehind: '{n} behind you',
    growthBehindOne: 'one rung behind you',
    growthShow: 'show them',
    growthHide: 'hide them',
    /** What a rung that was a decision turned out to be, after the decision. */
    growthTook: 'you took',
    growthTookFirst: 'first',
    growthTookLate: 'and late, the other one',
  },

  /**
   * Two of the six boards are not quantities, they are how somebody feels about
   * you. A number invites arithmetic; a place on a line between "against you"
   * and "with you" invites the question the game is actually about.
   */
  feeling: {
    squareLow: 'against you',
    squareHigh: 'with you',
    crownLow: 'out of patience',
    crownHigh: 'behind you',
    /** Health is how the place is living, not how much of it it has saved up. */
    healthLow: 'the sick beds are full',
    healthHigh: 'everyone upright',
    slightUp: 'lifts a little',
    up: 'rises',
    bigUp: 'rises hard',
    slightDown: 'dips a little',
    down: 'falls',
    bigDown: 'falls hard',
    holds: 'holds',
  },

  /** The switch for the drone and the notes falling into it. */
  music: {
    on: 'Play the music',
    off: 'Stop the music',
  },

  /** Why the count of people is doing what it is doing. */
  growth: {
    heading: 'Who comes, and who does not, every year',
    ground: 'The place itself',
    winter: 'The long winter',
    health: 'What the sickness takes',
    mood: 'A place people want to live in',
    births: 'Children, one a year, whatever you do',
    perYear: '{n}%',
    net: 'Next spring',
    /** What the count is actually for: the next thing it unlocks. */
    opensAt: 'At {n}: {what}',
  },

  trend: {
    heading: 'Every year, and why',
    rising: 'rising',
    falling: 'falling',
    flat: 'holding',
    noEffect: 'leaves it alone',
    none: 'Nothing is pulling on it yet.',
    lawsHeading: 'Your laws',
    otherHeading: 'The place itself',
    /** What to call a pull that has no name of its own. */
    sources: {
      drift: 'The crown',
      monarch: 'The crown',
      crowd: 'Too many of you for one well',
      winter: 'The long winter',
      health: 'How well people are',
      mood: 'How the square feels',
      ground: 'The ground itself',
      births: 'Children',
      animals: 'What is underfoot',
      other: 'The place itself',
    } as Record<string, string>,
  },

  composer: {
    heading: 'The drafting table',
    subjectsLabel: 'The subject',
    actionsLabel: 'What the law does',
    blankSubject: '__________',
    blankPredicate: '__________',
    pickPrompt: 'Pick what the law is about, then what it says. That is the whole law.',
    manyLaws: 'More than one law is open this year. The subject you pick is the law you write.',
    locked: 'Not on the table today.',
    pickSubjectFirst: 'Pick the subject first, and the predicates follow.',
    seal: 'SEAL IT',
    effectsLabel: 'What moves',
    reopenLine: 'The law is opened again. The place remembers the first one.',
    reopenCost: 'Reopening costs the crown {crown} and the square {mood}.',
    standing: 'standing now',
  },

  caseScreen: {
    breaks: 'This breaks your own law:',
    /**
     * The grey answer. The law is not broken so much as not applied, and the
     * crown pays half of what an exception costs for it. Nothing goes in the
     * Codex. The square still noticed.
     */
    bends: 'This goes round your own law:',
    questionLabel: 'The question',
    /** What an answer costs, before you give it. */
    moves: 'What this answer does',
    movesNothing: 'Nothing on the boards moves. It still happened.',
    souls: 'Souls in the place',
    /** Bending your own law is a cost like any other, so it is priced like one. */
    exceptionCost: 'Your own law, bent',
  },

  /**
   * What an answer does that a row of numbers cannot say: that somebody is
   * coming back about it, that the place itself changes, that it will be read
   * out at the end. It says the kind of consequence and never the consequence.
   * Knowing that this one has a person attached to it is information a
   * lawmaker would have; knowing who, and when, and what they will want is
   * the dilemma, and that stays shut.
   */
  consequence: {
    ask: '?',
    label: 'What else this sets in motion',
    later: 'This one is not finished. Somebody comes back about it, in a later year.',
    changes: 'The place itself changes. You will be able to see it in the window above.',
    remembered: 'The place remembers this answer. It is read back to you at the end of the reign.',
    souls: 'The count of souls moves on the day, and not only the boards.',
    bent: 'A standing law of yours bends for this, in front of the square.',
    stretched: 'A standing law of yours is not applied here. The square notices, and the Codex does not.',
    law: 'A law on {subject} gets written by somebody who is not you, and it counts as yours.',
  },

  /**
   * Said once, by the advisor who brought the first law, on the screen where
   * the first law has just landed. Four lines: what a count of souls is made
   * of, what the store is made of, what the store buys, and what happens if
   * any of it is allowed to run out. Nobody wants a lecture; they want to know
   * which way the arrows point.
   */
  /**
   * The one time the game explains itself, on the first law, in four rows and
   * two sentences. Marks rather than paragraphs: the same marks that are in the
   * header, so the next time they are seen they are already known.
   */
  wiring: {
    heading: 'While the seal is still warm',
    lead: 'Four dials up there, and this is the whole of what they do.',
    boards: [
      {
        stat: 'health',
        line: 'Sickness. It decides how many of you are still here next spring.',
      },
      {
        stat: 'mood',
        line: 'The square. People come to a place they are glad in and leave one they endure.',
      },
      {
        stat: 'economy',
        line: 'The store. It is what a year can be built with, and it only holds so much.',
      },
      {
        stat: 'crownSanity',
        line: 'You. Ruling the way your own laws read steadies it; ruling against them does not.',
      },
    ],
    floor: 'Let any one of them sit on the floor for a whole year and the reign ends there.',
  },

  advisor: {
    heading: 'Advisor',
    leans: 'They would seal',
    expected: 'Expected',
  },

  bench: {
    heading: 'The bench',
    rulingLabel: 'Your ruling reads',
    verbsLabel: 'What the bench does',
    blankVerb: '__________',
    readsAs: 'The clerk writes it down as',
    pickPrompt: 'Pick a word. The sentence above is your ruling.',
    notWritable: 'The clerk cannot write that down. Try other words.',
    pronounce: 'PRONOUNCE IT',
    youRule: 'You rule:',
    lawWordsHint: 'Words marked with an L exist only because that law of yours is standing.',
    /** The two marks a law puts on a word that was always there. */
    breaksMark: 'breaks',
    bendsMark: 'goes round',
  },

  /**
   * How a scene says when the earlier scene was, through `{{ago:caseId}}`.
   *
   * A person who comes back years later says what you did to them and when,
   * and the when is spelled out the way they would say it: not year three,
   * seven years ago. The list is indexed by the count of years.
   */
  ago: {
    thisYear: 'this year',
    lastYear: 'last year',
    years: '{n} years ago',
    unknown: 'some years ago',
    numbers: [
      'no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
      'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
      'eighteen', 'nineteen', 'twenty',
    ],
  },

  aftermath: {
    heading: 'What happened',
    continueButton: 'Continue',
    noChange: 'Nothing moved on the boards.',
    whatBecameOf: 'What became of them',
  },

  ledger: {
    heading: 'What moved it',
    every: 'every year',
    once: 'once',
    trend: 'Every year: {n}',
    noTrend: 'Every year: nothing',
    thisYear: 'This year: {n}',
    empty: 'Nothing has moved it yet.',
    law: 'Law {n}',
    crown: 'The crown, nervous about a town',
    crowding: 'Too many people for the place',
    culture: 'More people than songs',
    winter: 'The long winter',
    /** A year with no growing season in it, said as the store feels it. */
    winterStill: 'Nothing grows in a winter like this one',
    winterMouths: 'Mouths, all winter, and no harvest behind them',
    surplus: 'The surplus, spent on the place',
    exception: 'Your own law, bent',
    /** The grey answer: not broken, not applied either. */
    stretched: 'Your own law, gone round',
    reopen: 'A law reopened',
    charter: 'The charter, and everything it found waiting',
    hidden: 'Not counted in a hamlet.',
  },

  codex: {
    heading: 'The Codex',
    close: 'Close',
    empty: 'No laws sealed yet. There are only the cases you have heard.',
    sealedOn: 'sealed year',
    replaced: 'replaced',
    repealed: 'repealed',
    exceptionLine: 'broken for {who}, year {turn}',
  },

  /** Every face that has stood in front of you, and what you did about it. */
  register: {
    heading: 'Who You Have Known',
    /** The half of the register that is not history: what they think of you. */
    standingHeading: 'Where you stand',
    openLabel: 'Register',
    close: 'Close',
    empty: 'Nobody has come to the door yet.',
    metOn: 'first, year {turn}',
    aged: 'aged {n}',
  },

  portrait: {
    heading: 'Your Portrait',
    share: 'Share as image',
    beginAnew: 'Begin anew',
    confirmAnew: 'Begin anew? This reign is erased.',
    shareFallback: 'The browser blocked the download. Long press the card below to save it.',
    shareWorking: 'Painting...',
    exceptionsHeading: 'Exceptions',
    benchHeading: 'The bench',
    ivaHeading: 'Iva',
    soulsLine: 'You took the seal in a hamlet of {from} people and left {what} of {to}.',
    hamletLine: 'The map still does not know it is there.',
    worksHeading: 'What you built',
    worksNone: 'Nothing. The years went into the field.',
  },

  story: {
    becauseOf: 'Because of your law',
    townChanged: 'In the town',
    chronicleHeading: 'The chain so far',
    causedNothingYet: 'no scenes yet',
    caused: 'brought to the throne',
    opens: 'What this law will bring',
    opensNothing: 'Nothing is waiting on this one. Yet.',
    movesNothing: 'It moves nothing at all. Some laws are like that.',
    whoComes: 'Who comes to live here',
    growthRate: '{n}% a year',
    watchNote: 'It reads differently once somebody here carries a pike.',
    opened: 'This law has opened',
    laterDecree: 'a later decree',
  },

  monarch: {
    heading: 'On the throne',
    /** What the gauge is called on the page, and what it is called underneath. */
    gaugeName: 'Mood',
    gaugeIcon: '👑',
    gauge: 'Sanity',
    town: 'The town',
    traitLabel: 'Trait',
    servedUnder: 'You served under',
    /** Nobody up there is getting any younger, and the year says so. */
    age: 'aged {n}',
  },

  /**
   * What the place has started calling you. It is never there at the start:
   * a name of this kind is a verdict, and a verdict wants something to have
   * happened first.
   */
  epithet: {
    /** Who brings it. Gossip about the throne is a fool's trade, not a
     *  treasurer's. */
    speaker: 'The Fool',
    heading: 'They have a name for you',
    kicker: 'Nobody put it to a vote',
    calledYou: 'The place calls you {name}.',
    portraitHeading: 'What they called you',
    none: 'The place never settled on a name for you. Some reigns are like that.',
  },

  /**
   * The moment a settlement decides what else it is going to be. Nothing is
   * paid and nothing is refused: the only question is which one comes first.
   */
  boards: {
    heading: 'The place is big enough for one more thing',
    kicker: '{n} of you, and one pair of hands to spare',
    lead: 'Up to now every hand here has been in the field. Now there are enough of you to spare one pair for something else. One pair, and no more.',
    second: 'And now the other one',
    secondLead: 'There are enough of you at last for the half you did not pick. It arrives late, which people here will mention for years.',
    take: 'TAKE IT ON',
    choose: 'Pick one. The other comes later, when there are more of you.',
    army: 'Somebody keeps a watch',
    armyLine: 'A rota, a gate that is shut at night, and one person whose job is to notice things. The place stops being open to whatever walks up.',
    culture: 'Somebody keeps the songs',
    cultureLine: 'A bell, a fair day, and somebody who remembers the words. The place stops being only the work it does.',
    opens: 'And you can build for it',
  },

  /** The year the place stops being "the place" and starts being somewhere. */
  townName: {
    heading: 'The place wants a name',
    kicker: 'Three years in, and the carters still ask which turning',
    lead: 'Nobody agrees, so it comes to you, like everything else. Two words. That is how every name on the road got made.',
    firstLabel: 'The first word',
    secondLabel: 'And the second',
    blank: '________',
    reads: 'The place will be called',
    confirm: 'NAME IT',
    pickBoth: 'Pick both words. A place with one word in its name sounds like a warning.',
    named: 'It is on the milestone by the evening. Nobody ever calls it anything else.',
  },

  /**
   * The chrome of the card that opens over the town. It is the same card three
   * times: somebody at the door, a law being written, and a year being spent,
   * so what it calls its own parts is written once.
   */
  popup: {
    standingBeforeYou: 'Standing before you',
    aCase: 'A case',
    firstTime: 'first time here',
    seenBefore: 'here before, in year {n}',
    aged: 'aged {n}',
    draftingTable: 'The drafting table',
    inTheMargin: 'In the margin',
    lawWillRead: 'The law will read',
    yourRulingReads: 'Your ruling reads',
    whatItDoes: 'And so',
    /** The line the card puts under a season, so the year reads in one place. */
    ofYear: '{season}, year {n}',
  },

  /** The laws that are standing, as the town would list them. */
  standing: {
    heading: 'Standing',
    headingIcon: '📖',
    none: 'Nothing is written down yet.',
    writingNow: 'being written now',
    /** Why there is a word on the bench that is not one of the usual three. */
    fromHere: 'the extra words come from here',
  },

  city: {
    label: 'The town',
    whoIsHere: 'Who is in front of you',
    answerMarker: 'Go and see what it is',
    mood: 'The square',
  },

  /** The years with nobody at the door, and the knock that ends them. */
  idle: {
    heading: 'The years go by',
    kicker: 'Nothing needs you yet',
    passing: 'The field is worked. The seasons come round. Nobody has asked you for anything.',
    waitingHeading: 'Somebody is at the door',
    waiting: 'Somebody is waiting for you. Click the mark on the town, or the button here.',
    waitingLawHeading: 'The year comes round to a decision',
    waitingLaw: 'Nobody is asking you for anything in particular. That is exactly when a law gets written.',
    open: 'GO AND SEE',
    /** Nothing cuts a season short except the person watching it. */
    skip: 'Skip ahead',
  },

  /**
   * Said once a reign, two years out, by the person who keeps the store. The
   * long winter is the biggest single thing that happens to the place and the
   * only one you can prepare for, and it used to be announced in one line of
   * small red text under the header, which is exactly where a reader has
   * learned to look for nothing.
   */
  winter: {
    heading: 'The Treasurer',
    title: 'The long winter, in year {n}',
    lead: [
      'It comes every tenth year, it has always come every tenth year, and it is two harvests away. The old ones have started saying so out loud, which is how everybody knows it is two and not three.',
      'Nothing is asked of you today. But anything you want standing before the frost must be built this year or next, and the store must be filled by then.',
    ],
    billLabel: 'What it takes, at the numbers you have now',
    mouths: 'And {n} off the store for the mouths, because nothing is sown and nothing is carted.',
    weight: 'A place this size feels it {n} times over. A hamlet huddles; a town queues.',
    shelter: 'What you have built already spares {n} points of the loss.',
    advice: 'Health and a full store are the two things that decide how many are still here in the spring. A granary spares the rest.',
    dismiss: 'Click anywhere to carry on',
  },

  /** The moment a decree becomes a fact, held long enough to read twice. */
  seal: {
    heading: 'Sealed',
    reads: 'The law now reads',
    andSo: 'And so',
    everyYear: 'every year',
    once: 'at once',
    /** A board the place has not opened yet. It is banked, not thrown away. */
    whenTown: 'kept for when the place has that board',
    /* When a move lands, as a mark. The words were the same two words down
       every column of every list in the game; the mark is read once and then
       recognised, and the words are still there under the pointer. */
    everyYearIcon: '🔁',
    onceIcon: '⚡',
    whenTownIcon: '⏳',
  },

  dev: {
    label: 'dev',
    on: 'dev mode',
    heading: 'Under the table',
    raw: 'as written',
    felt: 'as felt',
    scaleLaw: 'decree scale',
    scaleCase: 'case scale',
    weight: 'law weight',
    watch: 'keeps a watch',
    pot: 'in the pot',
    growth: 'souls next year',
    yes: 'yes',
    no: 'no',
  },

  stats: {
    crownSanity: 'Sanity of the monarch',
    mood: 'Mood of the people',
    health: 'Health',
    economy: 'Economy',
    army: 'The watch',
    culture: 'Culture',
  },
};
