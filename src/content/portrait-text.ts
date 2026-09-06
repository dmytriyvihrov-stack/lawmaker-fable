import type { LawId, PhilTag, StoryFlag } from '../engine/types';

export const TAG_LABEL: Record<PhilTag, string> = {
  utilitarian: 'a utilitarian',
  libertarian: 'a libertarian',
  egalitarian: 'an egalitarian',
  meritocratic: 'a meritocrat',
  kantian: 'a rule keeper',
  communitarian: 'a communitarian',
};

/** Shown when the declared tag and the revealed tag are the same. */
export const SAME: Record<PhilTag, string> = {
  utilitarian: 'You said it. You did it. The sums add up and you slept fine. Rare.',
  libertarian: 'You said it. You did it. You kept your hands off, all the way to the end. Rare.',
  egalitarian: 'You said it. You did it. Everyone got the same, including you. Rare.',
  meritocratic: 'You said it. You did it. You measured people and you never looked away. Rare.',
  kantian: 'You said it. You did it. The rule held, even the week it hurt. Rare.',
  communitarian: 'You said it. You did it. You asked the square first, every time. Rare.',
};

export const MISMATCH_TEMPLATE = 'You called yourself {declared}. Your rulings say {revealed}.';

export const REVEALED_DESC: Record<PhilTag, string> = {
  utilitarian:
    'You counted. Every ruling you gave traded a few people for a lot of people, and the arithmetic was almost always right. The ones who were subtracted have names, and the ledger does not carry them.',
  libertarian:
    'You let it run. When the town asked you to hold something back you told it that it was free to arrange itself, and it did arrange itself, mostly around the strongest arm in the room.',
  egalitarian:
    'You cut everything into equal pieces, including the pieces that did not divide well. The town is level now. It is also slower, and it does not thank you out loud.',
  meritocratic:
    'You built ladders and you made them fair, in the sense that the same rungs were available to everyone standing in the same place. Not everyone was standing in the same place.',
  kantian:
    'You kept the rule. You kept it on the good weeks and on the week it cost you, and the town knows exactly where it stands with you, which is a gift and a cold one.',
  communitarian:
    'You governed by asking the room. Your rulings were slow, your squares were loud, and the decisions stuck because everyone had already argued about them.',
};

export const EXCEPTIONS_NONE_CLEAN =
  'You never once broke your own law. The law is grateful.';
export const EXCEPTIONS_NONE_WIDOW =
  'You never once broke your own law. The law is grateful. The bread queue is not.';
/** {n} and {names} get substituted. */
export const EXCEPTIONS_SOME =
  'You broke your own law {n} times, for: {names}.';
/** One is not "1 times". {name} gets substituted. */
export const EXCEPTIONS_ONCE =
  'You broke your own law once, for {name}.';

export const IVA_ADVOCATE =
  'Iva speaks for people at the small court now. She learned the sentence from you, at the door, and she has never once used it badly.';
export const IVA_HELPED =
  'Iva still sells pies by the gate. She waves at the palace. You, presumably.';
export const IVA_LEFT =
  'Iva left in spring. She did not say goodbye. The wardens still look at the gate.';
export const IVA_MET_ONLY =
  'You met Iva once. You do not remember. She does.';

export const FLAG_LINES: Partial<Record<StoryFlag, string>> = {
  basket_burned: 'You burned a basket in a full square and the town has not once brought it up to your face.',
  girl_spared: 'A nine year old was the first person your court let alone. It set the tone more than anything you sealed.',
  miller_capped: 'The miller still trades, at a price that was set for him, and mentions it to strangers.',
  miller_stands: 'The miller was allowed his price and has since bought the building next door.',
  lever_praised: 'Nobody works the old siding now. The lever is oiled every month, by rota, by men who will not discuss it.',
  lever_condemned: 'The eleven levers have eleven men on them who know that whatever happens, it will not be their doing.',
  pusher_freed: 'The cooper was let go and has not been on the market bridge since.',
  pusher_condemned: 'The cooper paid, and the five he saved paid the fine between them, quietly, at the door.',
  kind_lie_pardoned: 'The Healer kept her voice, and used it on you, once, near the end.',
  kind_lie_punished: 'The Healer says yes now, in corridors, to everybody. She is very good at it and it costs her.',
  cellar_doctrine: 'Half the houses in this town have a room that is legally somewhere else.',
  tam_fed: 'Tam mended fences sitting down for the rest of his life, and they were good fences.',
  tam_cut: 'Tam dug until the frost and did not speak to you again. He did not have to.',
  well_shared: 'The dry week is still told as the week everyone drank thin and nobody died.',
  well_lots: 'There is still a hat by the well with five pebbles in it, kept for luck.',
  well_cut: 'The dry week is not told at all.',
  marta_kept: 'Marta still farms the plot on the stream. The mill is downstream, and slow.',
  marta_moved: 'The mill feeds the town. Marta did not plant again.',
  fugitive_hidden: 'The riders have not been back. The hay is still behind the house.',
  fugitive_given: 'The riders took him at dusk. Supper was quiet for a month, and then it was not.',
  wolf_kept: 'You fed a wolf out of a store that could not spare it, for two years, for nothing anybody could name at the time.',
  wolf_driven: 'A wolf came to the woodpile and was sent back to the trees, and that is the whole of what became of it.',
  wolf_eaten: 'A wolf came to the woodpile and fed the place for a week. Nobody has mentioned it since, which is its own kind of mention.',
  dogs_kept: 'There are dogs in every yard here, and all of them are descended from one thin animal you decided to feed.',
  own_rope: 'The decree is still on the post. Nobody has taken it down, and nobody has broken it since.',
  square_walked:
    'The square came and told you once, in daylight, with everybody there. The year after that it stopped coming.',
  brother_kept:
    'You let your brother in over the advice of everybody who had met him, and the place made room, and mentioned it for years.',
  brother_carried:
    'Your brother was kept, and looked after, out of a store that had other plans for the money. Nobody ever called it charity to your face.',
  brother_driven:
    'You turned your own brother back at the fence in front of the whole place. They respected it. You did not sleep well again.',
  store_burned:
    'The store went up in one night with your brother asleep beside it, and everybody was too kind to say the obvious thing.',
  brother_paints:
    'There is a man in the square with a board on three legs who has painted this place in every season, badly at first, and he is your brother.',
  became_town: 'A clerk drew a circle on a map and made you spell it. You still have the pen.',
  players_paid: 'The players still play, to a full square, because the purse said so once and the square got into the habit.',
  worms_paid: 'The worm man has a stall now, and a sign, and an apprentice. The players left in the spring.',
  ballad_silenced: 'The ballad is still sung outside the wall. You have heard it from the window, and you know the fifth verse.',
  race_cart: 'Wat rides the stretches between the stones every spring, and has won twice, and nobody argues about it any more.',
  bees_kept: 'You left a swarm in the eaves out of nothing but curiosity, and were stung for it, and did not smoke them out.',
  hives_kept: 'There are hives on nine roofs and the place smells of honey in August. It began with a swarm nobody wanted.',
};

/** The closing paragraph about the town's mouth, keyed by the truth law you ended on. */
export const TAVERN_LINES: Partial<Record<LawId, string>> = {
  truth_mandatory:
    'They still open the market under {{law:truth_mandatory}}, and the fish is described accurately, and nobody buys the fish.',
  truth_kind_lies:
    'Under {{law:truth_kind_lies}} the market is a warm place full of excellent fish, and everyone knows exactly how much of that to believe.',
  truth_licensed:
    'The licence stalls are still by the fountain under {{law:truth_licensed}}. The dearest one says NO LIMIT and there is a waiting list.',
};

export const PORTRAIT_UI = {
  heading: 'The Lawmaker',
  lawsLine: '{active} standing, {replaced} replaced, {repealed} repealed',
  lawsHeading: 'Your laws',
  reignHeading: 'The reign, counted',
};

/**
 * The bench, counted, at the only point in the reign where counting is allowed.
 * Whether you ever found out is not the same question as whether it happened,
 * and this is where the two get put next to each other.
 */
export const BENCH_NONE =
  'Nobody ever stood in front of you accused of anything. That is either luck or a small place.';
export const BENCH_CLEAN =
  'You ruled on {n}, and you were right about all of them. You did not know that at the time, and you did not know it yesterday.';
export const BENCH_WRONG_ONE =
  'You ruled on {n}. One of them was telling the truth and you did not believe them.';
export const BENCH_WRONG_MANY =
  'You ruled on {n}. {w} of them were telling the truth and you did not believe any of them.';
export const BENCH_UNSEEN =
  'You never found out about {u} of those. Neither did the place. It went on being a quiet enough spot to live in.';
