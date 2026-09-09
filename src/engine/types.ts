export type PhilTag =
  | 'utilitarian' | 'libertarian' | 'egalitarian'
  | 'meritocratic' | 'kantian' | 'communitarian';

/**
 * Six boards, 0..100. A new settlement has four: a monarch far away, a mood, a
 * store, and the conditions people are living in. The watch and the songs are
 * not things a place of nine has; they are things it decides to become, one at
 * a time, once there are enough of it to have the argument.
 */
export type StatId =
  | 'crownSanity' | 'mood' | 'health' | 'economy' | 'army' | 'culture';
export type AdvisorId = 'treasurer' | 'healer' | 'captain' | 'fool';

/** Nine subjects: four for the hamlet, five for the town. */
export type SubjectId =
  | 'work' | 'strangers' | 'dead' | 'mushrooms'
  | 'trade' | 'lives' | 'truth' | 'crime' | 'song';
export type ActionId =
  | 'shared' | 'ruled' | 'owned'
  | 'welcomed' | 'earned' | 'turned_away'
  | 'with_a_day' | 'by_the_house' | 'at_the_edge'
  | 'finders' | 'weighed' | 'for_the_cart'
  | 'free' | 'taxed' | 'licensed'
  | 'by_count' | 'by_lot' | 'untouchable'
  | 'mandatory' | 'kind_lies'
  | 'forgiven' | 'repaid' | 'hanged'
  | 'worthy' | 'by_crowd' | 'by_hat';
export type LawId = `${SubjectId}_${ActionId}`;

/**
 * Five souls, five hundred, or a place with neighbours. The argument between
 * the three is scale, the same argument three times.
 *
 * Every rule written before there was a third stage asks only one question:
 * is this bigger than a hamlet? `stageRule` in `simulation.ts` answers that
 * for a kingdom, which is why a kingdom keeps every town rule it grew up
 * with. Only the rules that are actually about a kingdom read `stage`.
 */
export type Stage = 'village' | 'town' | 'kingdom';

/**
 * Where a year can go. Most of these stand afterwards and are counted in
 * levels. The last two are years that can be spent the same way again: the
 * fair, which the store pays for every time, and rest, which is a year spent
 * on nothing, on purpose.
 */
export type WorkId =
  /** The two a first year chooses between, before there is any law at all. */
  | 'house' | 'woodcutter'
  | 'fields' | 'well' | 'fence' | 'mine'
  | 'granary' | 'watch_house' | 'long_room' | 'hall'
  | 'road' | 'bridge'
  | 'fair' | 'rest';

/**
 * Works that only make sense one after the other, shown together and built in
 * order. A track has to be worn before a road is metalled, and a bridge over
 * the river is worth nothing with no road running at it.
 */
export type WorkGroup = 'infrastructure';

/**
 * The slow half of the reign: what the place works out for itself. Two
 * branches. The field branch is paid for out of the surplus; the crowd branch
 * needs people in one place before anybody thinks of it at all.
 */
/* TODO(architect): `muster` was dropped and `fair_day` added in V66, at the
   user's word: the muster roll at forty souls came off the ladder, and the
   fair stopped being a thing a valley of five already knows how to hold. Two
   members of an id union, no field added, renamed or removed. */
/* TODO(architect): twelve members were added to `TechId` in T-TECH-2, at the
   user's word: the tree became three spheres of two or three paths each, and
   a thing the player can point at. No member was renamed or removed, so every
   save written before it loads and reads as a place that knew nine things. */
export type TechId =
  | 'plough' | 'cistern' | 'ledger' | 'physician'
  | 'fair_day' | 'rota' | 'ballads' | 'press' | 'scribes'
  | 'three_fields' | 'mill' | 'lidded_store' | 'fold' | 'dairy'
  | 'drain' | 'herb_garden' | 'quarantine' | 'chimney' | 'slate'
  | 'letters' | 'school';

/** The three questions a place works things out about. */
export type SphereId = 'ground' | 'body' | 'word';

/** A chain inside a sphere. The second step waits on the first. */
export type PathId =
  | 'field' | 'store' | 'herd'
  | 'water' | 'healer' | 'roof'
  | 'book' | 'song' | 'school';

export interface SphereDef {
  id: SphereId;
  name: string;
  emoji: string;
  line: string;
}

export interface PathDef {
  id: PathId;
  sphere: SphereId;
  name: string;
  line: string;
}

export interface TechDef {
  id: TechId;
  /** Which of the three this grew out of. */
  sphere: SphereId;
  /** And which chain inside it. Content is written first step first. */
  path: PathId;
  /** 1, 2, 3: the row of the tree it sits in. */
  era: number;
  name: string;
  line: string;
  cost: number;             // points, taken out of the pot when it is worked out
  trend: Effects;           // what it adds to every year, for good
  /** What has to be worked out first. Empty means it grows from the place itself. */
  requires?: TechId[];
  /** Nobody works this out in a hamlet: it wants this many souls in one place. */
  needsSouls?: number;
  /** Souls the valley can hold on top of what it was found with. `roomFor`. */
  room?: number;
  /** Souls the crowding term stops counting, the way a roof does. */
  answers?: number;
  /** Percent points off what the long winter takes. */
  shelter?: number;
}

/**
 * How somebody feels about the person holding the seal, on the only scale a
 * place this size has words for. Nobody here says seventy one percent
 * favourable: they say she cannot stand you, or that you are all right.
 *
 * Two is the top of it and it is not friendship. A place where the lawmaker is
 * loved by somebody in it is a different place to rule, which is the whole
 * reason the last rung is there.
 */
export type BondLevel = -2 | -1 | 0 | 1 | 2;

/** What stands between you and one person who has been in front of you. */
export interface Bond {
  level: BondLevel;
  /** The year you last put something in their hands. One every other year. */
  giftTurn?: number;
  /** The year it stopped being a good opinion of you. */
  loverSince?: number;
  /**
   * TODO(architect): `kissTurn` is needed because the one you took can come
   * and see you, once every other year, and the visit has to remember when it
   * last happened. `giftTurn` is the gift's clock and cannot be shared: a
   * lawmaker who spent one on the other would be choosing between a present
   * and an afternoon, which is not the choice being modelled. Optional and
   * additive, so every save written before it reads as never having had one.
   */
  kissTurn?: number;
}

/**
 * A piece of ground a building can be put on.
 *
 * A year of work used to land its building on one spot and no other, which
 * made the picture a receipt. These are the pieces of ground the place has,
 * and a year is now spent on what goes up and on where it goes, in that order.
 */
export type PlotId =
  | 'north_gate'
  | 'east_rise'
  | 'cart_ground'
  | 'square_west'
  | 'well_side'
  | 'west_strip'
  /**
   * TODO(architect): the last three are needed because six pieces of ground
   * and five things that can stand on one is not a decision, it is a queue.
   * They open with the charter: a town has cleared and walked more of the
   * valley than a hamlet has, and `plotsFor()` in `plots.ts` is what holds
   * that true. Additive only, so every save written before them reads the
   * same and every reign that never charters never sees one.
   */
  | 'north_field'
  | 'mill_end'
  | 'stone_row';

export type IvaStep = 'met' | 'helped' | 'wronged' | 'advocate';
export type Phase =
  | 'title' | 'intro' | 'composer' | 'case' | 'aftermath' | 'works' | 'portrait';

/** Decoration only: the year turns through them so time is visible. */
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

/** -30..+30 for effects, -6..+6 for trends. The validator checks it. */
export type Effects = Partial<Record<StatId, number>>;

/** Closed list of story flags. A new flag means: add it here, then use it. */
export type StoryFlag =
  | 'basket_burned' | 'girl_spared'
  | 'miller_capped' | 'miller_stands'
  | 'lever_praised' | 'lever_condemned'
  | 'pusher_freed' | 'pusher_condemned'
  | 'kind_lie_pardoned' | 'kind_lie_punished'
  | 'cellar_doctrine'
  | 'tam_fed' | 'tam_cut'
  | 'well_shared' | 'well_lots' | 'well_cut'
  | 'marta_kept' | 'marta_moved'
  | 'fugitive_hidden' | 'fugitive_given'
  | 'wolf_kept' | 'wolf_driven' | 'wolf_eaten' | 'dogs_kept'
  /**
   * The first year this place put somebody in the ground. Set by the engine,
   * the way `became_town` is, the first year the count actually falls or the
   * first long winter, whichever comes first. The law about the dead waits on
   * it: a rule for burying people, written in a place where nobody has died
   * yet, is a form somebody filled in.
   */
  | 'first_dead'
  /** The ground, the wood, and the one nobody could carry. */
  | 'ground_kept' | 'ground_cut' | 'road_buried' | 'road_refused'
  | 'wood_shut' | 'wood_open' | 'corner_carried' | 'corner_left'
  /** The fair purse, the ballad, the race and the swarm: taste, and a bet. */
  | 'players_paid' | 'worms_paid' | 'ballad_silenced'
  | 'race_cart' | 'bees_kept' | 'hives_kept'
  /** The reign ended at the crossroads, under the reigning lawmaker's own decree. */
  | 'own_rope'
  /** The square stopped bringing you things, and the seal was on the table by spring. */
  | 'square_walked'
  /** The brother on the road, and what a year of him turned into. */
  | 'brother_kept' | 'brother_carried' | 'brother_driven'
  | 'store_burned' | 'brother_paints'
  | 'became_town'
  /** This reign may grow past a town. Set by the dev door only, for now. */
  | 'kingdom_open'
  /** The crown, and the five neighbours who had been there all along. */
  | 'became_kingdom';

/** City layers. One flag equals exactly one visible SVG layer. */
export type CityFlag =
  | 'tavern_shuttered' | 'tavern_rowdy' | 'bread_queue' | 'baron_banner'
  | 'share_stalls' | 'gates_closed' | 'camp_outside' | 'exam_desk'
  | 'meadow_fenced' | 'goat_parade' | 'dragon_roost' | 'bunting'
  | 'quack_row' | 'war_banners' | 'mourning_ribbons' | 'smuggler_lanterns'
  | 'wolf_at_the_edge' | 'dogs_about'
  /** Somebody stands in the square all day painting it, and is not stopped. */
  | 'easel_in_the_square'
  /**
   * Where you said to put them. A ruling on the dead is the only one that
   * leaves a mark on the place that cannot be spent, repealed or built over,
   * so the stones stand in the picture from the year they go in.
   */
  | 'graves_at_the_edge' | 'graves_in_the_yards';

export type Condition =
  | { kind: 'always' }
  | { kind: 'lawActive'; subject?: SubjectId; action?: ActionId } // at least one field
  | { kind: 'lawEver';   subject?: SubjectId; action?: ActionId } // replaced laws count too
  | { kind: 'stat'; stat: StatId; op: 'lte' | 'gte'; value: number }
  | { kind: 'stage'; stage: Stage }
  /** Souls in the place. An argument arrives when there are enough people to have it. */
  | { kind: 'souls'; op: 'lte' | 'gte'; value: number }
  | { kind: 'flag'; flag: StoryFlag }
  /**
   * The place has actually built the thing this scene is about. A well that
   * runs dry needs a well; a bridge that a man is thrown off needs a bridge.
   * `level` defaults to 1, which is "it stands at all".
   */
  | { kind: 'built'; work: WorkId; level?: number }
  | { kind: 'caseShown'; caseId: string }
  /**
   * Years since a scene was ruled on, which is the only clock a person coming
   * back can be hung on.
   *
   * Tam and Marta wait on a plain year because the scenes they come back about
   * happen in the second or third spring of every reign. Nothing else does:
   * the girl with the pies arrives anywhere between year eleven and year
   * twenty five, so "year sixteen" is four years after her scene in one reign
   * and twenty years before it in another. A schedule cannot do this either,
   * because a scheduled scene is served before the year's decree, which is
   * exactly what the keen band was built to stop.
   */
  | { kind: 'since'; caseId: string; years: number }
  | { kind: 'turn'; op: 'lte' | 'gte'; value: number }
  | { kind: 'not'; cond: Condition }
  | { kind: 'all'; conds: Condition[] }
  | { kind: 'any'; conds: Condition[] };

export interface LawOption {
  subject: SubjectId;
  action: ActionId;
  /** The decree in CAPITALS, one sentence the town can quote. */
  label: string;
  tags: PhilTag[];               // 1-2
  effects: Effects;              // applied once, when the law is sealed
  perTurn?: Effects;             // the yearly trend while the law stands
  /** Yearly trend once the place is a town. When absent, perTurn applies in
   *  both stages. Village laws use it to turn sour at scale. */
  perTurnTown?: Effects;
  /** Yearly trend once the place keeps a watch, by watch house or by numbers.
   *  A law about wrongdoing is a different law once somebody carries a pike. */
  perTurnWatch?: Effects;
  /** Village growth multiplier while this law stands (strangers laws only). */
  growth?: number;
  isBadIdea?: boolean;           // exactly one per Proposal
  cityFlagsOn?: CityFlag[];
  cityFlagsOff?: CityFlag[];
  aftermathId: string;           // reference to AftermathScene.id
}

export interface Proposal {
  id: string;                    // 'p1_trade'
  /** Story act 1..5. Acts run in strict order. */
  act: number;
  advisor: AdvisorId;
  unlockedBy?: Condition;
  title: string;
  /** What the advisor would do, and why. Shown beside the drafting table. */
  advice?: Advice;
  problem: string[];             // 1-3 paragraphs, the advisor speaking
  options: LawOption[];          // 2-3
}

export interface CaseChoice {
  id: string;
  text: string;                  // button text
  result: string;                // the "what happened at once" paragraph
  tags: PhilTag[];
  effects: Effects;
  /** One time change to the count of souls, in percent of the current count. */
  souls?: number;
  /** Marks an exception to your own law. The engine ADDS a cost on top. */
  exceptionToLaw?: LawId;
  beneficiary?: string;          // required together with exceptionToLaw
  /** On a trial: what this answer says about the person standing there. */
  verdict?: Verdict;
  setFlags?: StoryFlag[];
  setIva?: IvaStep;
  schedule?: { caseId: string; inTurns: number };  // delayed consequence
  enactLaw?: LawOption;          // a royal decree that bypasses the player
  cityFlagsOn?: CityFlag[];
  cityFlagsOff?: CityFlag[];
  /**
   * What this answer does to what the person in front of you thinks of you,
   * when the answer is about them rather than about a policy. Left off, the
   * engine reads the answer's own weight instead, so most scenes need nothing
   * here.
   */
  bond?: number;
}

/** What the bench decided about a person, not about a policy. */
export type Verdict = 'guilty' | 'innocent';

/**
 * A trial the place ruled on. The truth is never stored: it is recomputed from
 * the seed by truthOf(), so a save file cannot spoil its own ending.
 */
export interface VerdictRecord {
  caseId: string;
  year: number;
  ruled: Verdict;
  /** true once the place has been shown that this ruling was wrong. */
  surfaced: boolean;
}

export interface CaseEvent {
  id: string;
  /** null means it only arrives through a schedule */
  trigger: Condition | null;
  /** Lower is more important. 5 or lower is urgent and overrides the turn slot. */
  priority: number;
  character?: string;            // 'iva' | 'widow' | 'monarch' | ...
  /** Present on a trial: who stands accused, and of what. */
  accused?: { name: string; charge: string };
  /**
   * The season this happens in. Frozen ground is a thing that happens in
   * winter, and a scene about it arriving under a summer sun is the picture
   * calling the words a liar. Left off, the phase decides as it always did.
   */
  season?: Season;
  title: string;
  /** Paragraphs. Templates {{law:<LawId>}} and {{casualty}} are supported. */
  scene: string[];
  choices: CaseChoice[];         // 3 that always stand, plus the law gated ones
  /** The whole dilemma in one line, above the scene. */
  question?: string;
}

/**
 * Which way the advisor who brought a question leans, and the one line they
 * would say if you asked. They are not neutral and never were: the Captain
 * wants a watch and the Fool wants a holiday, and hearing that before you seal
 * is the difference between a decision and a guess.
 */
export interface Advice {
  /** Index into the proposal's own options. */
  option: number;
  line: string;
}

export interface AftermathScene {
  id: string;
  paragraphs: string[];
  /** Law by law combo: the paragraph is added when the condition holds. */
  extra?: { when: Condition; paragraph: string }[];
}

/** One line of the ledger behind a dial: what moved it, and by how much. */
export interface LedgerEntry {
  turn: number;
  stat: StatId;
  delta: number;
  /** A short label from content. Never free text from the engine. */
  source: string;
  /** True when this line is the yearly trend rather than a one time move. */
  every?: boolean;
}

export interface WorkDef {
  id: WorkId;
  stage: Stage | 'both';
  /** Buildable early, once the place has opened the board it serves. */
  needsBoard?: StatId;
  /**
   * Locked until a law on this subject stands. A day nobody works is not a
   * building, it is a permission, and the place does not have it until it has
   * written one down. Repeal the law and the year stops being spendable that
   * way, which is the point of tying it to one.
   */
  needsLaw?: SubjectId;
  /**
   * Locked until an earlier work in the same direction stands. This is what
   * makes a group a chain rather than a shelf: the bridge is not on the list
   * until there is a road to put it on.
   */
  needsWork?: { id: WorkId; level: number };
  /** The direction this belongs to, when it belongs to one. */
  group?: WorkGroup;
  name: string;
  line: string;                 // one sentence, what it does, in words
  cost: number;                 // economy, paid once; 0 for rest
  maxLevel: number;             // 1..3, rest has 0 and never levels
  /** Trend per level per year while the building stands. */
  trend: Effects;
  /** Applied once, on the year it is chosen (rest uses this). */
  once?: Effects;
  /**
   * What the same year costs and buys once the place is a town. A fair in a
   * hamlet is nine people and a fiddle; a fair in a town is a fair. Both are
   * the same entry on the list, and neither is the same day.
   */
  townCost?: number;
  townOnce?: Effects;
  /** Percent points of the winter loss this building spares, per level. */
  winterShelter?: number;
}

export interface EnactedLaw {
  subject: SubjectId; action: ActionId; label: string;
  turn: number;
  status: 'active' | 'replaced' | 'repealed';
}

export interface ExceptionRecord { law: LawId; beneficiary: string; turn: number; }

export interface ChoiceLog {
  turn: number;
  kind: 'law' | 'case' | 'work';
  refId: string;
  choiceId: string;
  tags: PhilTag[];
}

export type CurrentEvent =
  | { kind: 'proposal'; id: string }
  | { kind: 'case'; id: string };

export interface PendingEvent { onTurn: number; caseId: string; seq: number; }

/**
 * One people of the kingdom, as a share of the count.
 *
 * A hamlet has five names and a town has a crowd; a kingdom has parts of a
 * crowd that can be told apart, and who came through which gate is the first
 * thing that tells them apart. Nothing rules on a people yet: they are what a
 * ruling on a group would be about, and they are counted now so that the
 * material can be read before it is written.
 */
export interface People {
  id: 'founders' | 'comers' | 'trades' | 'river';
  share: number;        // 0..1, and the four of them sum to 1
  mood: number;         // 0..100
}

/** What a neighbour wants, while it still wants it. */
export interface WorldAsk {
  board: 'economy' | 'health';
  since: number;        // the year it was raised
}

/**
 * A kingdom that is not yours.
 *
 * The same shape whether it was drawn from a table or taken from a real
 * reign: `fromReign` makes one out of any `GameState`, and that is the whole
 * contract a later online layer would need. Nothing here reaches a network.
 */
export interface ForeignState {
  id: string;           // 'k1'..'k5'
  name: string;
  kind: 'bot' | 'player';
  seed: number;
  tag: PhilTag;         // how they rule, in the word the portrait would use
  stage: Stage;
  population: number;
  stats: Record<StatId, number>;
  laws: EnactedLaw[];   // active only, two to four
  /** How they feel about you, -3 (hostile) to 3 (sworn). */
  stance: number;
  /** Where they sit on the small map, in map units, with you at 0,0. */
  position: { x: number; y: number };
  ask: WorldAsk | null;
}

/** Everything outside your own walls, once there is an outside. */
export interface World {
  peoples: People[];
  states: ForeignState[];
}

export interface GameState {
  version: 1;
  seed: number;                          // created on New Game, lives in the save
  turn: number;                          // starts at 1
  phase: Phase;
  stats: Record<StatId, number>;         // 0..100
  /** Souls in the place. Five at the start, and every one of them counted. */
  population: number;
  stage: Stage;
  townSince: number | null;              // the year the hamlet became a town
  /** What the place is called, once somebody has decided. Null until then. */
  townName: string | null;
  /** Boards the place has opened by growing into them and choosing them. */
  boards: StatId[];
  buildings: Record<WorkId, number>;     // levels, all 0 at start
  ledger: LedgerEntry[];                 // last CONFIG.ledgerKeep entries
  reopening: string | null;              // proposal id being reopened this year
  eventsThisYear: number;                // people heard so far this year
  research: number;                      // points in the pot, spent on the next tech
  techs: TechId[];                       // what the place has worked out, in order
  /**
   * TODO(architect): `techFocus` is needed because the tree became a choice in
   * T-TECH-2 and the reign has to remember what was pointed at. Optional, so a
   * save written before it reads as a place nobody has directed, which is the
   * old behaviour exactly: the pot buys the cheapest thing anybody could start
   * on. Null and absent mean the same thing.
   */
  techFocus?: TechId | null;
  /**
   * TODO(architect): `techProgress` is needed because points already spent on
   * a thing are kept when the focus moves, so changing your mind costs the
   * years and not the work. Absent reads as nothing started.
   */
  techProgress?: Partial<Record<TechId, number>>;
  lastLawTurn: number;                   // the year the last decree was sealed
  lastWorkTurn: number;                  // the year that already spent its work
  /**
   * What that year was spent on. A building does not appear the afternoon it
   * is paid for: for the year it is raised there is a frame on the ground and
   * two people at it with tools, and the thing itself the year after.
   */
  lastWork: WorkId | null;
  /** Effects on the hidden boards that a hamlet could not take yet, paid out
   *  the year the charter arrives. */
  pendingTownBonus: Effects;
  declaredTag: PhilTag | null;           // answer to the opening question
  laws: EnactedLaw[];                    // full history, in sealing order
  exceptions: ExceptionRecord[];
  usedProposals: string[];
  shownCases: string[];
  pending: PendingEvent[];
  flags: StoryFlag[];
  cityFlags: CityFlag[];
  iva: IvaStep[];                        // cumulative: ['met','wronged',...]
  /** Every trial ruled on, in order. The truth is not in here. */
  verdicts: VerdictRecord[];
  log: ChoiceLog[];
  current: CurrentEvent | null;
  /** Assembled text for the Aftermath screen: paragraphs plus stat deltas. */
  lastAftermath: { paragraphs: string[]; deltas: Effects } | null;
  /**
   * The year each board first went to the floor and stayed there. Cleared the
   * moment it comes back up, so a board that dips and recovers has no memory
   * of it. Absent on a save written before reigns could end this way, which
   * reads the same as nothing being on the floor.
   */
  floored?: Partial<Record<StatId, number>>;
  /**
   * How everybody you have met feels about you, keyed the way the register is.
   * Absent on a save written before the place kept track of it, which reads
   * the same as nobody having an opinion yet.
   */
  bonds?: Record<string, Bond>;
  /** The one of them you took, if you took one. */
  lover?: string | null;
  /**
   * Where each building was put. A work with nothing here stands on the ground
   * the picture always gave it, which is what every save written before the
   * year of work asked the question does.
   */
  placements?: Partial<Record<WorkId, PlotId>>;
  /** The board that ended the reign, if one did. */
  defeat?: StatId;
  /**
   * The year the crown arrived. Absent on every save written before there was
   * a third stage, which reads the same as never having reached one.
   */
  kingdomSince?: number | null;
  /**
   * The peoples of the kingdom and the kingdoms around it, made the year the
   * crown arrives and carried in the save from then on. Absent means there is
   * no outside yet, which is what a hamlet and a town both are.
   */
  world?: World;
}
