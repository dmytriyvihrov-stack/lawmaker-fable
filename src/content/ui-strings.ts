import type { PhilTag } from '../engine/types';

/** All UI chrome lives here. Not one string of it in the components. */
export const UI = {
  title: {
    /** There is a reign in the slot and this version cannot open it. */
    staleSave:
      'There is a reign saved here that this version of the game cannot open. Beginning a new one will write over it.',
    name: 'Lawmaker Fable',
    tagline: 'Five people, open ground, and a seal. Write the law before the place is big enough to need it.',
    newGame: 'Begin a reign',
    /** The dev door: start a reign already grown, to read a later stage. */
    beginAt: 'Begin at',
    continueGame: 'Continue your reign',
    confirmNew: 'This burns your current reign. There is no second copy. Begin anew?',
  },

  intro: {
    /* The rider and the wax used to be a block of their own above the crown's
       portrait, which is a wrapper round a question that reads the same
       without it. It is half a sentence in front of the question now. */
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
      kicker: 'Spring. Five of you.',
      caption:
        'You walked out of the old place together and stopped here, for the water. On the second night the others voted in a field with their hands up, and the seal is yours.',
      /* Two blocks went out of here. `charge` said "look after them, settle
         what they bring to your door, and raise this place into a town",
         which is the tagline on the title screen said again in longer words;
         and `lead` wrapped the question in a rider with a stick of wax, and
         the question reads the same without the wrapper, so half of it moved
         into the question itself. Eight blocks of text down to six. */
    },
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
    kingdom: 'a kingdom',
    hamletIcon: '🏡',
    townIcon: '🏰',
    kingdomIcon: '👑',
    openWorld: 'The world',
    winterNear: 'Winter is close. The woodpiles are being counted.',
    /** The other clock. It runs whether or not anybody is looking at it. */
    winterIn: 'The long winter in {n} years.',
    winterNext: 'The long winter next year.',
    winterHere: 'The long winter. It holds the whole year.',
    /** The same clock at the width of the header: a mark and a count. */
    /* The number of winters, and nothing else. The whole sentence is under
       the pointer; on the row it is one fact among six and was the widest of
       them. */
    frostIn: '{n}',
    frostNext: '1',
    frostHere: 'now',
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
    /* The name of the screen and the rule of the screen are the same six
        words, so it is said once, in the head, and the line that used to sit
        under it saying "one thing, or nothing" is gone with it. */
    heading: 'One thing in a year',
    /**
     * A price against the shelf it comes off. "costs 10 from the store" was
     * true and told a player nothing they could act on: ten out of what? The
     * number that decides whether a thing is worth a year is the one after
     * the minus, so both are here, in the store's own mark.
     */
    /* Just the number. It used to read "{n} of {have}", to price a thing
       against the shelf it comes off, and the shelf is a float in the engine:
       "10 of 0.8" and "17 of 4.7" went out on every card of every year. What
       is in the store is said once now, over the shelf, and only when nothing
       on it is within reach. */
    /* Signed, and in a box of its own. On a work card the store's mark
       appears twice: once for what the thing pays every year and once for
       what it takes to build, and both used to be a bare figure next to the
       same coin. "+1.5" and "6" are not the same kind of number and were the
       same shape of number. The price is the one with a minus on it. */
    cost: '-{n}',
    free: 'half: -{n}',
    costLabel: 'from the store',
    moves: 'What it changes',
    atOnce: 'at once',
    /**
     * The one sentence about the store that is still worth saying, and it is
     * not about this year. A store that cannot pay this year may pay next
     * year, and the card says so already by dimming the work and leaving the
     * price on it; a store whose shelf ends below the price will not pay in
     * any year of the reign, and that is a fact no amount of waiting fixes.
     */
    overShelf: 'Needs a granary before the store can hold it.',
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
    /** The year the cog in the bar stops being a locked shape. */
    opened: 'The workshops',
    /* Two sentences. It was four, and the fourth made a promise a hamlet
       cannot keep: a point in the pot comes off every 25 in the store, and a
       hamlet with a store under 25 sat at "0 of 12" for six years running
       after being told it would work something out every few years. What is
       true is that the place does this on its own account, whenever it does. */
    openedLine:
      'There are enough of us now that somebody has time to be clever in. From this spring the place will work something out on its own account, and nobody will have voted for that either.',
    openedWhere: 'It is under the cog, at the top of the screen.',
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

    /**
     * The half of the screen that became a decision.
     *
     * Everything above this line was written while the tree worked itself
     * out in the corner of the reign and nobody could touch it. It can be
     * pointed at now: one card at a time, and the whole pot goes there.
     * Pointed at nothing, the place carries on buying the cheapest thing it
     * can, which is the game exactly as it was.
     */
    pick: 'WORK ON THIS',
    picked: 'THE PLACE IS ON IT',
    pickHint: 'Point the place at one thing and every point in the pot goes there.',
    nobodyPicked: 'Nobody has been asked to work on anything in particular, so the place is doing the nearest thing.',
    /** What the year puts in the pot, and the one honest reason it is that. */
    rate: '{n} a year',
    rateLine: 'What a year of this many people works out between harvests: {base} for the year itself, one more for every {per} of you, one for every {past} past {bend}, and one for every {culture} of culture. A bigger place thinks faster. That is the whole rule.',
    /** How long the thing being worked on has left, at this year rate. */
    inYears: 'about {n} years',
    nextSpring: 'next spring',
    couldStart: 'could be started now',
    waitsFor: 'after {name}',
    /* Not the year: nothing in the reign records the year a thing was worked
       out, and the number to hand is the order, which read as a year and was
       a lie on every card. The colour of the card already says it is known. */
    knownIn: 'worked out here',
    costPoints: '{n} points',
    /** What a step does besides its trend, in the three the engine already had. */
    room: 'room for {n} more',
    answers: 'answers for {n} of the crowd',
    winter: '{n} off the long winter',
    /** The three questions a place works things out about. */
    sphereHint: 'Three spheres, and each of them answers a different question. Every path is a chain: the second step is not thinkable until the first is known. Nothing here closes anything else. The years do that.',
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
    /* One line in the head of the card, and the second form of it for the
       years when more than one law is open. It was two lines a card apart
       saying the same thing: "pick the subject, then what it says" under the
       effects, and "the subject you pick is the law you write" at the foot of
       the margin. */
    pickPrompt: 'Pick the subject, then what it says. That is the whole law.',
    locked: 'Not on the table today.',
    pickSubjectFirst: 'Pick the subject first, and what it can say follows.',
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
    /* The same two, by number, for the line under the sentence being written.
       The law itself is in the Standing panel beside the card and in the
       Codex, and quoting it in capitals over a card already too tall for the
       window was the third time a player had read it in one screen. */
    breaksShort: 'Breaks {law}, and the crown pays for it.',
    bendsShort: 'Goes round {law}. The crown pays half, and nothing is written down.',
    aLaw: 'your own law',
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
  /* The one lecture in the game, and it is a screen of its own now, standing
     before the first year rather than stapled to the bottom of the first
     seal.

     Where it used to be is the second spring: a player had already spent a
     whole year choosing between four marks nobody had named, and then read
     what they meant while a stamp came down over the top of it. Two jobs on
     one screen and the wrong one first. And each line says what the board
     DOES rather than what it is, because "sickness decides how many of you
     are here next spring" is a riddle with the answer left out: people die,
     strangers stop coming, the store cannot pay. */
  /* And it is four rows of one clause each now, with what each board pulls on
     drawn as a mark rather than said in a sentence. A player asked for less
     reading and for the connections themselves: which dial moves which. The
     `to` mark is what this board does to something else, the `from` mark is
     what moves this one, and the arrow between them is the whole lesson. */
  wiring: {
    heading: 'Before the first year',
    lead: 'Four things are kept in the corner of the screen. Nothing else is counted, and each one pulls on something.',
    boards: [
      {
        stat: 'health',
        title: 'How well people are',
        to: 'people',
        line: 'Low, and people die over the winter and the count falls with them.',
      },
      {
        stat: 'mood',
        title: 'What it is like to live here',
        to: 'people',
        line: 'High, and strangers arrive. Low, and the people here walk out over the hill.',
      },
      {
        stat: 'economy',
        title: 'What is in the store',
        to: 'work',
        line: 'Every building is paid out of it, and it only holds so much.',
      },
      {
        stat: 'crownSanity',
        title: 'How steadily you hold it',
        from: 'law',
        line: 'Ruling the way your own laws read steadies you. Ruling against them does not.',
      },
    ],
    /** The three things on the other end of those arrows. */
    marks: {
      people: { icon: '🧍', label: 'how many of you there are' },
      work: { icon: '🔨', label: 'what a year can be spent on' },
      law: { icon: '📜', label: 'the laws you have sealed' },
    },
    floor: 'Any one of the four on the floor for a whole year ends the reign. That is the only way to lose.',
    /* And the shape of a year, because the first screen a player meets is a
       shelf of eight buildings with nothing on it to say why there is only
       room for one of them. */
    yearHeading: 'And a year is one year',
    /* It said "a year is one decision" and "never two", and a year has held
       two people in it for a long time: somebody at the door, and something
       coming back off an answer you already gave. Now that a year can also
       seal a law and hear the one person it lands on, the line was simply
       untrue. What is still true, and what this screen exists to say, is that
       the shelf of buildings underneath it has room for one. */
    year: 'A law when one is due, somebody at your door, and one thing the whole year is spent on. One building a year, and nothing is ever taken back.',
    go: 'BEGIN THE REIGN',
  },

  /**
   * The second thing said once, on the first day somebody is actually at the
   * door, and not a moment before it.
   *
   * The primer above teaches the four boards, which is what a player needs
   * before they spend a year. It cannot also teach what a dilemma is, because
   * on the day it is read there has not been one, and a rule about a thing
   * nobody has seen is a rule nobody keeps. This waits until the first one is
   * standing there and says the three things a player otherwise works out by
   * losing: that this pays once and a law pays forever, that nothing warned
   * them and nothing will, and that the words on the bench are not the same
   * words for every reign.
   *
   * Three lines, because the person is already at the door and the game has
   * just made them wait through a lecture.
   */
  door: {
    heading: 'Somebody is at the door',
    lines: [
      'A law pays out every year you keep it. This is not a law. What you answer here lands once, and then the day is over.',
      'Nothing warns you who is coming. There is no saving for the person at the door, only having something in the store when one arrives.',
      'Your sealed laws are on the bench with you. Each hands you a word marked with an L, and makes the plain words dearer when you rule against your own writing.',
    ],
    go: 'HEAR THEM OUT',
  },

  /**
   * And the one small thing, named the first time one is out there.
   *
   * It is a tag on the map beside the thing itself and not a card, for the
   * reason written at the top of `content/moments.ts`: a paragraph floating on
   * the meadow made the smallest thing in the game the loudest thing on the
   * screen. Two short lines, over the spot, gone when the thing is taken.
   */
  smallThing: {
    heading: 'You can stop for this',
    line: 'It costs the year nothing, and one board goes up a point. Leave it and the year turns and it is gone.',
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
    /** What the answer came to, in the units the boards are in. Said after the
     *  ruling and never before it: a dilemma keeps its weight a secret until
     *  it has been answered, and then it owes the player the number. */
    moved: 'What it came to',
    /* Once, for the whole row. Every mark used to carry its own "at once",
       which is four words repeated four times to say one thing. */
    allAtOnce: 'all at once',
    /** When a scene came out of a law the register can no longer name. */
    aLaw: 'one of your laws',
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
    /** The crown, and the year the map got edges. */
    crownArrives: 'The crown, and five neighbours who had been there all along',
    askYes: '{{name}} sent what was asked, and remembers it',
    askNo: '{{name}} sent nothing',
    sent: 'Grain went to {{name}}, and word of it went further',
    sentAsked: '{{name}} asked, and was answered',
    raidWon: 'The watch came back from {{name}} with carts',
    raidLost: 'The watch came back from {{name}} with fewer',
    raidOrdered: 'The order to ride on {{name}}',
    raided: 'Riders from {{name}} took what they could carry',
  },

  codex: {
    heading: 'The Codex',
    close: 'Close',
    empty: 'No laws sealed yet. There are only the cases you have heard.',
    sealedOn: 'sealed year',
    replaced: 'replaced',
    repealed: 'repealed',
    exceptionLine: 'broken for {who}, year {turn}',
    /**
     * What the law is doing to the place right now, which is the one thing a
     * book of laws is for and the one thing it did not say.
     *
     * It used to list what had happened under each law instead: the four
     * people who came to the door because of it, by name and year. That is
     * the register's job and the chronicle's, and reading it here answered a
     * question nobody opens the Codex with. What a reader wants off this page
     * is what they are still paying for a sentence they wrote nine years ago.
     */
    paysHeading: 'What it does, every year',
    paysNothing: 'Nothing the place can feel, at this size.',
    /** A law that no longer stands does nothing at all, and says so. */
    paysGone: 'Nothing. It no longer stands.',
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
    /** A scene this law opens that is waiting on a building. */
    whenBuilt: 'once {what} stands',
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
    /* Under the year it arrives in. `townName.fromYear` is 11, and this said
       "three years in" for as long as it has existed. */
    kicker: 'Ten winters in, and the carters still ask which turning',
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
    seenBefore: 'here before, in year {n}',
    aged: 'aged {n}',
    /* What you are here to do, not the furniture you are doing it at. It is
        the whole head of the card now: the line under it said "pick the
        subject, then what it says", which is what the two rows of tiles
        directly beneath it are visibly for. */
    draftingTable: 'Create the law',
    inTheMargin: 'In the margin',
    yourRulingReads: 'Your ruling reads',
    whatItDoes: 'And so',
    /** The line the card puts under a season, so the year reads in one place. */
    ofYear: '{season}, year {n}',
  },

  /** The laws that are standing, as the town would list them. */
  /**
   * The world outside the walls, which a hamlet and a town do not have and a
   * kingdom cannot stop having.
   */
  world: {
    icon: '🌍',
    heading: 'Beyond the borders',
    atlas: 'The royal atlas',
    closeMark: '×',
    actionIcons: { ask: '🌾', send: '🎁', raid: '⚔' },
    close: 'Close',
    you: 'Your kingdom',
    yours: 'you',
    askMark: '!',
    asks: {
      economy: 'They are asking for grain',
      health: 'They are asking for a physician',
    },
    stance: {
      '-3': 'hostile', '-2': 'cold', '-1': 'wary', '0': 'civil',
      '1': 'warm', '2': 'friendly', '3': 'sworn',
    },
    style: 'Rules as',
    laws: 'Their laws',
    lawsNone: 'Nothing is written down there.',
    boards: 'Their boards',
    souls: 'souls',
    pick: 'Point at a place to read it.',
    ask: 'Ask for grain',
    send: 'Send grain',
    raid: 'Send the watch',
    costs: {
      ask: 'Costs the year. May bring nothing.',
      send: 'Costs the year and {n} from the store. The crown sits easier.',
      raid: 'Costs the year and {n} of the crown, won or lost.',
    },
    /**
     * And what it does to everybody who is watching, which is the half of a
     * foreign policy that was not on the screen.
     *
     * The three buttons said what the year and the store would pay and stopped
     * there, while the engine quietly moved a stance on the place you acted on
     * and, for the watch, on every other crown as well. Word travels: that is
     * the rule, and it was invisible. The numbers are filled from `CONFIG`, so
     * a line here cannot go stale against the thing it describes.
     */
    stanceHeading: 'And afterwards',
    effects: {
      ask: 'If they say yes, they are owed one: {n} warmer toward you.',
      send: 'They warm to you by {n}. Nobody else is watching this closely.',
      raid: 'They turn against you by {n}, and every other crown by {o}. Word travels.',
    },
    /** The three words a stance is read as at a glance, over the country. */
    stanceMark: { friendly: '🤝', civil: '🕊', hostile: '⚔' },
    /** What is on the roads this year, which is not always your doing. */
    traffic: {
      asking: 'A rider is coming with their asking',
      raiding: 'Armed men, and they can afford to come',
    },
    notNow: 'Next autumn, in the year of work',
    cannot: {
      store: 'The store cannot spare it',
      watch: 'The watch is not enough to send',
    },
    peoples: {
      heading: 'Who lives here',
      founders: 'The old families',
      comers: 'The ones who came through the gate',
      trades: 'The trades',
      river: 'The quarter by the river',
    },
    chapters: { village: 'the hamlet', town: 'the town', kingdom: 'the kingdom' },
    kind: { bot: 'drawn', player: 'a real reign' },
  },

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
    /* One paragraph. It was two, and then a bill, and then three notes under
       the bill, and then a line of advice that said the bill again in words.
       What a warning has to do is name the date and say what can still be done
       about it. */
    lead: [
      'It comes every tenth year and it is two harvests away. Anything you want standing before the frost must be built this year or next, and the store filled by then.',
    ],
    billLabel: 'What it takes, at the numbers you have now',
    /* The mouths used to be a sentence under the bill, holding a number the
       bill was already about. It is inside the store's own figure now. */
    weight: 'A place this size feels it {n} times over. A hamlet huddles; a town queues.',
    /* And what standing buildings spare, joined to what would spare more. */
    shelter: 'What you have built already spares {n} of that. A granary spares more.',
    /** How many walk out of the frost, in words, because a tenth of a person
     *  is not a thing and "-23.8%" was on a card that has no other number
     *  with a decimal point on it. */
    soulsShare: 'about {share} of you',
    shares: ['hardly any', 'a few', 'about a tenth', 'about a fifth', 'about a quarter', 'about a third', 'nearly half'],
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
    /* The two switches on the strip. Neither is a fact about the reign, so
       they sit apart from the six that are. */
    editText: 'edit any text',
    editTextOn: 'Click any line to rewrite it, cut it, or leave a note. The game takes no other click while this is on.',
    wipe: 'clear history',
    wipeHint: 'Forget the saved reign, the pending edits and every setting, and open a fresh one.',
    wiped: 'cleared',

    /* The panel that drops out of the strip: the dials, and the reigns to jump
       into. Both are things done to a reign rather than facts about one, which
       is why they are behind a button and not on the strip itself. */
    dials: 'dials',
    dialsHint: 'Raise and lower every board, the count, the pot and the year, while the reign is running.',
    dialsHeading: 'Turn it by hand',
    /** The line a turned dial leaves in the ledger, so the Codex still answers "why". */
    hand: 'A hand on the dial',
    step: 'step',
    stepHint: 'How far one press moves a dial.',
    souls: 'souls',
    potDial: 'the pot',
    yearDial: 'the year',
    yearHint: 'Moves the calendar and nothing else: no year is lived through, so nothing is paid out for the ones skipped.',
    lid: 'lid',
    lidHint: 'The store stops here until a granary lifts it.',
    openBoard: 'open it',
    openBoardHint: 'The place decides it is a thing with this board, at the value it has been quietly sitting at.',

    /* The thumbs, on everything that happens. Not a switch of their own: they
       are the one dev mark that is left while somebody is still playing, and a
       switch to find first is a mark nobody makes. */
    likeMark: '👍',
    dislikeMark: '👎',
    likeHint: 'This one landed. Marked for whoever writes the content next.',
    dislikeHint: 'This one did not. Marked for whoever writes the content next.',
    markWhy: 'why',
    markNote: 'why, in a line',
    marksHeading: 'Marked',
    editsHeading: 'Rewritten',
    markDrop: 'Take this mark back.',

    statesHeading: 'Jump to',
    statesHint: 'A reign that never happened, opened at that stage. This one is thrown away.',
    samePlace: 'this place',
    samePlaceHint: 'Keep the seed, so the same valley, the same crown and the same name come back one stage on. Off, and it is somewhere else entirely.',
    sure: 'Sure?',
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
