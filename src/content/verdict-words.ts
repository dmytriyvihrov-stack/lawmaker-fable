import type { LawId } from '../engine/types';

/**
 * The bench. A ruling is the case in front of you plus one verb:
 *
 *   THE GIRL GOES FREE
 *   THE COOPER IS CONVICTED
 *
 * Three of the verbs are always on the table and pull against each other. The
 * rest are on the table only because a law of yours is standing, and they carry
 * its number. Nothing here is decoration: every word changes the outcome.
 */

export interface WordTile {
  id: string;
  text: string;
}

/**
 * A sentence that goes against a law of yours that happens to be standing.
 *
 * The three words that are always on a bench were written before any law was,
 * and a law changes what they mean. "He eats" is a kindness in a place with
 * no rule about work and a breach in a place that wrote each one's own; "the
 * coat goes back on the peg" is a ruling under one law about wrongdoing and a
 * refusal to apply another. This is that reading: which law the word crosses,
 * how hard, and what the place says about it afterwards.
 *
 * Two grades. `breaks` is an exception in the full sense: it is written into
 * the Codex against the law, it costs the crown what every exception costs,
 * and it is the same act as the answers that carry `exceptionToLaw`. `bends`
 * is the grey answer: the law is not broken so much as not applied, the crown
 * pays half, and nothing is written down. The square notices both.
 */
export interface Against {
  law: LawId;
  how: 'breaks' | 'bends';
  /** Who the law was set aside for, in the words the Codex uses. Breaks need one. */
  beneficiary?: string;
  /** One line of what the place made of it, added to the aftermath. */
  result: string;
}

export interface Ruling {
  verb: string;
  /** Reserved: a second word, when a case genuinely needs one. */
  object?: string;
  choiceId: string;
  /** The bench only has this word while that law is active. */
  needsLaw?: LawId;
  /**
   * What this sentence is, under each law of the subject that could be
   * standing. A subject has one standing law at a time, so at most one entry
   * ever applies. A word with nothing here means the same thing under any law.
   */
  against?: Against[];
}

export interface CaseVerdict {
  /** The fixed opening of the sentence, so the ruling reads as a ruling. */
  subject: string;
  verbs: string[];
  objects: string[];
  rulings: Ruling[];
}

export const VERDICT_VERBS: WordTile[] = [
  { id: 'did_it', text: 'DID IT' },
  { id: 'is_not_proven', text: 'IS NOT PROVEN' },
  { id: 'works_the_loss_off', text: 'WORKS THE LOSS OFF' },
  { id: 'is_read_out', text: 'IS READ OUT IN THE SQUARE' },
  { id: 'is_shelved', text: 'IS SHELVED' },
  { id: 'goes_down_the_road', text: 'GOES DOWN THE ROAD' },
  { id: 'is_kept_in_sight', text: 'IS KEPT IN SIGHT' },
  // the hamlet
  { id: 'eats', text: 'EATS' },
  { id: 'gets_half', text: 'GETS HALF A SHARE' },
  { id: 'eats_when_he_digs', text: 'EATS WHEN HE DIGS' },
  { id: 'share_is_cut', text: 'HAS HIS SHARE CUT' },
  { id: 'mends_tools', text: 'MENDS TOOLS, THE HEADMAN SAYS' },
  { id: 'his_own_field', text: 'EATS WHAT HIS OWN FIELD GIVES' },
  { id: 'is_shared_thin', text: 'IS SHARED THIN, ALL WEEK' },
  { id: 'is_drawn_by_lot', text: 'IS DRAWN BY LOT EACH MORNING' },
  { id: 'goes_to_the_diggers', text: 'GOES TO THE DIGGERS' },
  { id: 'diggers_first_once', text: 'GOES TO THE DIGGERS, THIS ONCE' },
  { id: 'headman_last', text: 'IS DRUNK LAST BY THE HEADMAN' },
  { id: 'is_sold', text: 'GOES TO WHOEVER PAYS' },
  { id: 'stays_with_marta', text: 'STAYS WITH MARTA' },
  { id: 'is_split', text: 'IS SPLIT, MILL AND FIELD' },
  { id: 'goes_to_the_mill', text: 'GOES TO THE MILL' },
  { id: 'is_his_share', text: 'IS HIS SHARE, BY THE LAW' },
  { id: 'waits_a_year', text: 'WAITS A YEAR' },
  { id: 'gets_a_mill_anyway', text: 'GETS A MILL ANYWAY' },
  { id: 'is_hidden', text: 'IS HIDDEN' },
  { id: 'is_warned', text: 'IS WARNED, AND LEFT TO CHOOSE' },
  { id: 'is_handed_over', text: 'IS HANDED OVER' },
  { id: 'keeps_his_roof', text: 'KEEPS HIS ROOF' },
  { id: 'owes_a_year', text: 'OWES A YEAR FIRST' },
  { id: 'was_never_here', text: 'WAS NEVER HERE' },
  { id: 'gets_a_square', text: 'GETS A SQUARE FIRST' },
  { id: 'is_counted', text: 'IS COUNTED AND SENT' },
  { id: 'gets_a_wall', text: 'GETS A WALL FIRST' },
  { id: 'one_house', text: 'IS ONE HOUSE UNTIL MARCH' },
  { id: 'three_houses', text: 'IS THREE COLD HOUSES' },
  { id: 'sends_two', text: 'SENDS TWO TO THE HALL OF THE LORD' },

  // the thing at the woodpile, and what it turned into
  { id: 'is_fed_and_kept', text: 'IS FED, AND KEPT' },
  { id: 'is_driven_to_the_trees', text: 'IS DRIVEN BACK TO THE TREES' },
  { id: 'is_killed_and_eaten', text: 'IS KILLED, AND EATEN' },
  { id: 'goes_to_every_house', text: 'GOES TO EVERY HOUSE THAT WANTS ONE' },
  { id: 'works_the_flock', text: 'WORKS THE FLOCK AND THE GATE' },
  { id: 'goes_back_to_the_trees', text: 'GOES BACK TO THE TREES' },
  // and the same animal a third time, once banging pots turned out to be a
  // way of putting the question off rather than answering it
  { id: 'is_hunted_down', text: 'IS HUNTED DOWN AT FIRST LIGHT' },
  { id: 'is_fed_after_all', text: 'IS FED, AFTER ALL' },
  { id: 'is_shut_out_nightly', text: 'IS SHUT OUT, NIGHT AFTER NIGHT' },

  // the herd on the common, and the boy it decided about
  { id: 'is_split_between_houses', text: 'IS SPLIT, A GOAT TO EVERY HOUSE' },
  { id: 'is_the_boys', text: 'IS HIS, AND SO IS THE MILK' },
  { id: 'stays_whole_he_walks_it', text: 'STAYS WHOLE, AND HE WALKS IT' },
  { id: 'is_everybodys_by_law', text: "IS EVERYBODY'S, AND SO IS HIS DAY" },
  { id: 'is_his_by_law', text: 'IS HIS, BY THE LAW OF THE WORK' },

  // the coat, and the toll box
  { id: 'gives_it_back', text: 'GIVES THE COAT BACK' },
  { id: 'keeps_it', text: 'KEEPS THE COAT' },
  { id: 'takes_three', text: 'TAKES THREE STROKES' },
  { id: 'is_asked_why', text: 'IS FED, AND ASKED WHY' },
  { id: 'owes_two_coats', text: 'OWES TWO COATS' },
  { id: 'not_at_twelve', text: 'IS NOT HANGED, BEING TWELVE' },
  { id: 'box_forgotten', text: 'IS LET ALONE, AND THE BOX FORGOTTEN' },
  { id: 'pays_the_short', text: 'PAYS BACK WHAT IS SHORT' },
  { id: 'loses_the_ferry', text: 'LOSES THE BOX AND THE FERRY' },
  { id: 'counts_with_a_witness', text: 'COUNTS IT WITH A WITNESS' },
  { id: 'pays_it_twice', text: 'PAYS IT BACK TWICE' },
  { id: 'hangs_for_coins', text: 'HANGS FOR COINS, AT THE CROSSING' },

  // the girl
  { id: 'is_given_the_stall', text: 'IS GIVEN THE GATE STALL' },
  { id: 'goes_free', text: 'GOES FREE' },
  { id: 'is_barred', text: 'IS BARRED, AND THE BASKET BURNED' },
  { id: 'pays_anyway', text: 'PAYS ANYWAY' },
  { id: 'pays_the_toll', text: 'PAYS THE TOLL' },
  { id: 'is_apprenticed', text: 'IS APPRENTICED TO THE GUILD' },

  // the price
  { id: 'is_bought_out', text: 'IS BOUGHT OUT BY THE CROWN' },
  { id: 'stands', text: 'STANDS' },
  { id: 'is_shamed', text: 'IS NAILED UP BESIDE THE OLD ONE' },
  { id: 'is_capped', text: 'IS FIXED WHERE IT WAS' },
  { id: 'is_tithed', text: 'IS TITHED TO THE CROWN' },
  { id: 'is_set_by_the_guild', text: 'IS SET BY THE GUILD' },

  // the lever man
  { id: 'is_pardoned', text: 'IS PARDONED' },
  { id: 'is_dismissed', text: 'IS DISMISSED FROM THE HILL' },
  { id: 'the_mine_pays', text: 'IS NOT MENTIONED; THE MINE PAYS' },
  { id: 'should_have_pulled', text: 'SHOULD HAVE PULLED IT' },
  { id: 'was_right', text: 'WAS RIGHT TO STAND STILL' },
  { id: 'should_have_drawn', text: 'SHOULD HAVE DRAWN A LOT' },

  // the cooper
  { id: 'is_honoured', text: 'IS HONOURED' },
  { id: 'is_convicted', text: 'IS CONVICTED' },
  { id: 'is_honoured_and_fined', text: 'IS HONOURED AND FINED' },
  { id: 'counted_right', text: 'COUNTED CORRECTLY' },
  { id: 'is_forgiven_the_rule', text: 'IS FORGIVEN THE RULE' },
  { id: 'skipped_the_cup', text: 'SKIPPED THE CUP' },

  // the healer
  { id: 'is_thanked', text: 'IS THANKED' },
  { id: 'pays_the_estate', text: 'PAYS THE ESTATE' },
  { id: 'is_replaced_by_a_clerk', text: 'IS REPLACED BY A CLERK' },
  { id: 'is_forgiven_the_word', text: 'IS FORGIVEN THE WORD' },
  { id: 'was_within_the_law', text: 'WAS WITHIN THE LAW' },
  { id: 'is_sold_a_licence', text: 'IS SOLD A LICENCE' },

  // the widow
  { id: 'the_hunter_is_asked', text: 'IS BELIEVED, AND THE HUNTER IS ASKED THE SAME' },
  { id: 'is_asked_again', text: 'IS ASKED AGAIN, WITHOUT THE CELLAR' },
  { id: 'is_licensed_backdated', text: 'IS LICENSED, DATED SUNDAY' },

  // the winter
  { id: 'is_opened_to_all', text: 'IS OPENED TO EVERYONE' },
  { id: 'is_rationed', text: 'IS RATIONED, GUARDS AT THE DOOR' },
  { id: 'is_left_to_the_market', text: 'IS LEFT TO THE MARKET' },
  { id: 'hall_opened', text: 'IS SPENT IN THE GUILD HALL, TOGETHER' },
  { id: 'fences_burned', text: 'IS FED THE FENCES AND THE STALLS' },
  { id: 'wood_guarded', text: 'IS WATCHED BY MEN ON THE WOODPILES' },

  // the collapse
  { id: 'is_faced_alone', text: 'IS FACED ALONE' },
  { id: 'is_bought_back', text: 'IS BOUGHT BACK, BY THE HEAD' },
  { id: 'is_let_burn', text: 'IS LET TO BURN' },
  { id: 'is_sealed_off', text: 'IS SEALED OFF, PEOPLE INSIDE' },
  { id: 'buys_physicians', text: 'BUYS EVERY PHYSICIAN ON THE ROADS' },
  { id: 'borrows_from_guild', text: 'BORROWS FROM THE GUILD' },
  { id: 'sells_the_plate', text: 'SELLS THE LANDS AND THE PLATE' },
  { id: 'is_carried_upstairs', text: 'IS CARRIED UPSTAIRS BY HAND' },
  { id: 'is_read_in_the_square', text: 'IS READ ALOUD IN THE SQUARE' },
  { id: 'is_forgiven_a_year', text: 'IS FORGIVEN A YEAR OF DUES' },
  { id: 'is_shut', text: 'IS SHUT' },

  // the fair purse, and the ballad
  { id: 'goes_to_the_players', text: 'GOES TO THE PLAYERS' },
  { id: 'goes_to_the_worm_eater', text: 'GOES TO THE WORM EATER' },
  { id: 'is_split_one_stage', text: 'IS SPLIT, AND THERE IS ONE STAGE' },
  { id: 'goes_where_the_hall_says', text: 'GOES WHERE THE HALL SAYS WORTH IS' },
  { id: 'follows_the_count', text: 'FOLLOWS THE COUNT OF THE CROWD' },
  { id: 'pays_the_players_anyway', text: 'PAYS THE PLAYERS ANYWAY' },
  { id: 'is_paid_and_thanked', text: 'IS PAID, AND THANKED FROM THE STEPS' },
  { id: 'sings_on', text: 'SINGS IT, AND NOBODY SAYS A WORD' },
  { id: 'sings_outside', text: 'SINGS IT OUTSIDE THE WALL, OR NOT AT ALL' },
  { id: 'is_judged_worthy', text: 'IS JUDGED WORTHY BY THE HALL' },
  { id: 'is_paid_by_the_head', text: 'IS PAID BY THE HEAD OF THE CROWD' },
  { id: 'has_his_hat_bought', text: 'HAS HIS HAT BOUGHT BY THE CROWN' },

  // the race, the swarm, and the honey
  { id: 'rides_between_the_stones', text: 'RIDES BETWEEN THE STONES' },
  { id: 'runs_on_his_legs', text: 'RUNS IT ON HIS OWN LEGS' },
  { id: 'runs_the_second_race', text: 'RUNS THE SECOND RACE, WITH THE PONY' },
  { id: 'is_left_in_the_eaves', text: 'IS LEFT IN THE EAVES' },
  { id: 'is_smoked_out', text: 'IS SMOKED OUT TONIGHT' },
  { id: 'is_sold_boxed', text: 'IS SOLD TO THE NEXT VALLEY, BOX AND ALL' },
  { id: 'goes_a_jar_to_every_house', text: 'GOES A JAR TO EVERY HOUSE' },
  { id: 'is_sold_at_the_gate', text: 'IS SOLD AT THE GATE' },
  { id: 'is_cut_into_hives', text: 'IS CUT INTO HIVES FOR EVERY ROOF' },

  // the frozen ground, and the man at the gatepost
  { id: 'burns_the_ground_open', text: 'IS BURNED OPEN, ALL WEEK IF IT TAKES IT' },
  { id: 'waits_in_the_barn', text: 'WAITS IN THE BARN UNTIL THE THAW' },
  { id: 'goes_under_stones', text: 'GOES UNDER STONES, ABOVE THE FROST' },
  { id: 'is_dug_by_all_of_us', text: 'IS DUG BY ALL OF US, TWO DAYS' },
  { id: 'is_each_house_its_own', text: 'IS EACH HOUSE ITS OWN HOLE' },
  { id: 'goes_to_the_edge_today', text: 'GOES TO THE EDGE, TODAY' },
  { id: 'is_ours_now', text: 'IS OURS NOW, AND GOES IN HERE' },
  { id: 'waits_for_an_answer', text: 'WAITS WHILE THE NAME GOES DOWN THE ROAD' },
  { id: 'goes_past_the_boundary', text: 'GOES OVER THE BOUNDARY' },
  { id: 'stops_the_work_the_same', text: 'STOPS THE WORK, THE SAME AS ONE OF OURS' },
  { id: 'has_no_house_here', text: 'HAS NO HOUSE HERE, AND SO NO ONE TO CARRY HIM' },
  { id: 'goes_to_the_edge_the_same_day', text: 'GOES TO THE EDGE, THE SAME DAY, LIKE ANY OF US' },

  // the ring in the beeches, and the long night
  { id: 'is_the_childs', text: "IS THE CHILD'S, WHO WAS UP FIRST" },
  { id: 'is_tipped_out_and_split', text: 'IS TIPPED OUT AND SPLIT IN TWO' },
  { id: 'belongs_to_the_strip', text: 'BELONGS TO THE STRIP IT GREW ON' },
  { id: 'goes_to_whoever_found_it', text: 'GOES TO WHOEVER FOUND IT, BY THE DECREE' },
  { id: 'goes_on_the_scale', text: 'GOES ON THE SCALE, LIKE EVERYTHING ELSE' },
  { id: 'goes_in_the_box', text: 'GOES IN THE BOX, ON THE CART' },
  { id: 'is_shut_every_september', text: 'IS SHUT EVERY SEPTEMBER' },
  { id: 'is_taught_every_autumn', text: 'IS TAUGHT, EVERY AUTUMN, TO EVERYBODY' },
  { id: 'is_their_own_lookout', text: 'IS THEIR OWN LOOKOUT' },
  { id: 'is_first_come_and_wrong_is_wrong', text: 'IS FIRST COME, AND WRONG IS WRONG' },
  { id: 'passes_the_healer_first', text: 'PASSES THE HEALER BEFORE ANY POT' },
  { id: 'settles_it_for_the_cart', text: 'SETTLES IT: IT ALL GOES ON THE CART' },

  // the corner
  { id: 'is_carried_by_the_nine_of_us', text: 'IS CARRIED, BY ALL OF US' },
  { id: 'has_the_afternoons', text: 'HAS THE AFTERNOONS, AND THE FIELD THE MORNINGS' },
  { id: 'is_asked_herself', text: 'IS ASKED WHAT SHE WANTS' },

  // the deputation in the yard
  { id: 'is_taken_entire', text: 'IS GIVEN EVERY ITEM, THIS YEAR' },
  { id: 'is_answered_in_three', text: 'IS ANSWERED ON THREE OF NINE' },
  { id: 'is_sent_home', text: 'IS SENT HOME' },

  // the brother, and the two years after him
  { id: 'walks_in', text: 'WALKS IN LIKE ANYBODY ELSE' },
  { id: 'is_kept_and_watched', text: 'IS KEPT, AND WATCHED' },
  { id: 'is_turned_at_the_fence', text: 'IS TURNED BACK AT THE FENCE' },
  { id: 'is_let_be', text: 'IS LET BE, AND NOTHING IS SAID' },
  { id: 'rebuilds_it', text: 'REBUILDS IT, BOARD BY BOARD' },
  { id: 'is_on_the_road_by_morning', text: 'IS ON THE ROAD BY MORNING' },
  { id: 'stays_where_he_stands', text: 'PAINTS, AND IS LEFT TO IT' },
  { id: 'paints_for_the_cart', text: 'PAINTS FOR THE CART' },
  { id: 'goes_back_to_the_field', text: 'GOES BACK TO THE FIELD' },

  // the pot on the boundary
  { id: 'is_split_four_coins', text: 'IS SPLIT, FOUR COINS A HOUSE' },
  { id: 'goes_to_the_finder', text: 'GOES TO THE ONE WHO DUG IT UP' },
  { id: 'goes_to_the_store', text: 'GOES INTO THE STORE UNTIL THE HEDGE IS WALKED' },

  // the ones who come back: Tam and the fence, Marta and the ground
  { id: 'goes_up_where_tam_says', text: 'GOES UP WHERE TAM SAYS' },
  { id: 'is_each_house_its_run', text: 'IS EACH HOUSE ITS OWN RUN, TONIGHT' },
  { id: 'waits_for_spring', text: 'WAITS FOR SPRING' },
  { id: 'is_asked_at_the_gap', text: 'IS ASKED, AT THE GAP, BY YOU' },
  { id: 'is_paid_like_a_stranger', text: 'IS PAID LIKE A STRANGER' },
  { id: 'is_not_asked', text: 'IS NOT ASKED' },
  { id: 'is_half_given', text: 'IS HALF GIVEN, AND HALF KEPT' },
  { id: 'is_taken_kept_or_not', text: 'IS TAKEN, KEPT ONCE OR NOT' },
  { id: 'is_left_and_other_ground_paid_for', text: 'IS LEFT ALONE, AND OTHER GROUND PAID FOR' },
  { id: 'names_her_price', text: 'NAMES HER PRICE, AND IT IS PAID' },
  { id: 'loses_it_as_before', text: 'LOSES IT, AS BEFORE' },
  { id: 'is_paid_by_the_mill', text: 'IS PAID BY THE MILL' },
];

/** No tone words. A word on this bench either changes the ruling or is not here. */
export const VERDICT_OBJECTS: WordTile[] = [];

export const CASE_VERDICTS: Record<string, CaseVerdict> = {
  v1_idle_hand: {
    subject: 'TAM',
    verbs: ['eats', 'gets_half', 'eats_when_he_digs'],
    objects: [],
    rulings: [
      {
        verb: 'eats',
        choiceId: 'feed_him',
        against: [
          {
            law: 'work_ruled',
            how: 'bends',
            result:
              'The law says one of you does not dig. Tam makes two, and the four in the field have counted.',
          },
          {
            law: 'work_owned',
            how: 'breaks',
            beneficiary: 'Tam',
            result:
              "He eats out of four other harvests under a law that says each one's own. The four say nothing, and the law says less than it did.",
          },
        ],
      },
      {
        verb: 'gets_half',
        choiceId: 'half_share',
        against: [
          {
            law: 'work_shared',
            how: 'bends',
            result:
              'Half a share is not a share alike, and everybody can do that sum. Nobody says so. Nobody forgets it either.',
          },
          {
            law: 'work_owned',
            how: 'bends',
            result:
              'Half a share off four other fields is a kindness the law has no word for, and the field with the best yield notices first.',
          },
        ],
      },
      {
        verb: 'eats_when_he_digs',
        choiceId: 'no_work_no_bread',
        against: [
          {
            law: 'work_shared',
            how: 'breaks',
            beneficiary: 'the four who dig',
            result:
              'It is the plainest sentence anybody has said against the law on the post, and you said it. The four who dig go quiet at the well for a month.',
          },
        ],
      },
      { verb: 'share_is_cut', choiceId: 'cut_his_share', needsLaw: 'work_shared' },
      { verb: 'mends_tools', choiceId: 'headman_decides', needsLaw: 'work_ruled' },
      { verb: 'his_own_field', choiceId: 'his_own_field', needsLaw: 'work_owned' },
    ],
  },

  v2_well: {
    subject: 'THE WATER',
    verbs: ['is_shared_thin', 'is_drawn_by_lot', 'goes_to_the_diggers'],
    objects: [],
    rulings: [
      {
        verb: 'is_shared_thin',
        choiceId: 'share_thin',
        against: [
          {
            law: 'work_owned',
            how: 'breaks',
            beneficiary: 'the ones with no bucket of their own',
            result:
              "Four buckets shared out level under a law that says each one's own. The one who lined the well asks whose well it is, and is not answered.",
          },
        ],
      },
      {
        verb: 'is_drawn_by_lot',
        choiceId: 'draw_lots',
        against: [
          {
            law: 'work_ruled',
            how: 'bends',
            result:
              'The law put the deciding on one who does not dig, and the one who does not dig put it in a hat. The hat is talked about.',
          },
          {
            law: 'work_owned',
            how: 'bends',
            result:
              'A pebble in a hat is a fair way to lose what the law says is yours, and two people say so, out loud, on the fourth morning.',
          },
        ],
      },
      {
        verb: 'goes_to_the_diggers',
        choiceId: 'weakest_waits',
        against: [
          {
            law: 'work_shared',
            how: 'breaks',
            beneficiary: 'the diggers',
            result:
              'The weakest waits in front of a post that says alike, and reads it while she waits. By the rain nobody here says the word alike without looking at her.',
          },
        ],
      },
      { verb: 'diggers_first_once', choiceId: 'diggers_first', needsLaw: 'work_shared' },
      { verb: 'headman_last', choiceId: 'headman_drinks_last', needsLaw: 'work_ruled' },
      { verb: 'is_sold', choiceId: 'sell_the_bucket', needsLaw: 'work_owned' },
    ],
  },

  v3_millwright: {
    subject: 'THE PLOT ON THE STREAM',
    verbs: ['stays_with_marta', 'is_split', 'goes_to_the_mill'],
    objects: [],
    rulings: [
      {
        verb: 'stays_with_marta',
        choiceId: 'marta_keeps',
        against: [
          {
            law: 'strangers_welcomed',
            how: 'bends',
            result:
              'A roof and a share, the law says. He got a roof and the slow water, and he knows what a share is, and so does the road.',
          },
        ],
      },
      {
        verb: 'is_split',
        choiceId: 'share_the_stream',
        against: [
          {
            law: 'strangers_earned',
            how: 'bends',
            result:
              'He has the bank by autumn, and the law said a year first. The two who did their year before a share say so to each other.',
          },
          {
            law: 'strangers_turned_away',
            how: 'breaks',
            beneficiary: 'the mill-wright',
            result:
              'Turned away before dark, the gate says, and by dark he is measuring the bank. The gate is read differently from that week on, by everybody who reaches it.',
          },
        ],
      },
      {
        verb: 'goes_to_the_mill',
        choiceId: 'plot_to_the_mill',
        against: [
          {
            law: 'strangers_earned',
            how: 'breaks',
            beneficiary: 'the mill-wright',
            result:
              'The best plot on the stream, on the day he arrived, under a law that asks a year of everybody else. The ones who gave their year work it out on their fingers.',
          },
          {
            law: 'strangers_turned_away',
            how: 'breaks',
            beneficiary: 'the mill-wright',
            result:
              'A stranger given the best ground in the place, under a law that turns strangers away before dark. Three more try the fence that summer, and one of them has a trade.',
          },
        ],
      },
      { verb: 'is_his_share', choiceId: 'a_roof_and_a_plot', needsLaw: 'strangers_welcomed' },
      { verb: 'waits_a_year', choiceId: 'a_year_first', needsLaw: 'strangers_earned' },
      { verb: 'gets_a_mill_anyway', choiceId: 'stays_anyway', needsLaw: 'strangers_turned_away' },
    ],
  },

  v4_hay: {
    subject: 'THE MAN IN THE HAY',
    verbs: ['is_hidden', 'is_warned', 'is_handed_over'],
    objects: [],
    rulings: [
      {
        verb: 'is_hidden',
        choiceId: 'hide_him',
        against: [
          {
            law: 'strangers_earned',
            how: 'bends',
            result:
              'One of us now, after four months, under a law that counts a year. The two who did their whole year keep count for him, out loud.',
          },
          {
            law: 'strangers_turned_away',
            how: 'breaks',
            beneficiary: 'the man in the hay',
            result:
              'A stranger kept behind the house under a law that turns strangers away before dark. The riders know the law, because it is painted on the gate.',
          },
        ],
      },
      {
        verb: 'is_warned',
        choiceId: 'let_him_choose',
        against: [
          {
            law: 'strangers_welcomed',
            how: 'bends',
            result:
              'He was given a roof, the law says, and a roof is not a head start. He runs with a loaf, and nobody says the word roof for a year.',
          },
          {
            law: 'strangers_turned_away',
            how: 'bends',
            result:
              'Warned and let go by dark is nearly turned away before dark. The gate is read again, by people who can count the months since April.',
          },
        ],
      },
      {
        verb: 'is_handed_over',
        choiceId: 'hand_him_over',
        against: [
          {
            law: 'strangers_welcomed',
            how: 'breaks',
            beneficiary: 'the riders',
            result:
              'A roof and a share, the law said, and the roof is handed over at dusk with the man under it. Nobody at the fence reads the law aloud after that.',
          },
        ],
      },
      { verb: 'keeps_his_roof', choiceId: 'he_has_a_roof', needsLaw: 'strangers_welcomed' },
      { verb: 'owes_a_year', choiceId: 'his_year_is_owed', needsLaw: 'strangers_earned' },
      { verb: 'was_never_here', choiceId: 'never_here', needsLaw: 'strangers_turned_away' },
    ],
  },

  t_town: {
    subject: 'THE TOWN',
    verbs: ['gets_a_square', 'is_counted', 'gets_a_wall'],
    objects: [],
    rulings: [
      { verb: 'gets_a_square', choiceId: 'square_first' },
      { verb: 'is_counted', choiceId: 'count_them' },
      { verb: 'gets_a_wall', choiceId: 'wall_first' },
    ],
  },

  wv_hearth: {
    subject: 'THE WINTER',
    verbs: ['one_house', 'three_houses', 'sends_two'],
    objects: [],
    rulings: [
      { verb: 'one_house', choiceId: 'one_house' },
      { verb: 'three_houses', choiceId: 'each_their_own' },
      { verb: 'sends_two', choiceId: 'send_two' },
    ],
  },

  d1_pies: {
    subject: 'THE GIRL',
    verbs: ['is_given_the_stall', 'goes_free', 'is_barred'],
    objects: [],
    rulings: [
      {
        verb: 'is_given_the_stall',
        choiceId: 'reward',
        against: [
          {
            law: 'trade_free',
            how: 'bends',
            result:
              'A stall given by the crown is a licence with a bow on it, under a law that says trade is free. The bakers ask where theirs is.',
          },
          {
            law: 'trade_taxed',
            how: 'bends',
            result:
              'A stall and no word about the tenth, under a law that takes a tenth from everybody. The man at the desk writes her name down and waits.',
          },
          {
            law: 'trade_licensed',
            how: 'breaks',
            beneficiary: 'Iva',
            result:
              'The crown gives a stall the Guild alone may give, under its own law, to a child. The Guild sends a letter. The letter is polite, and it is not the last one.',
          },
        ],
      },
      {
        verb: 'goes_free',
        choiceId: 'nothing',
        against: [
          {
            law: 'trade_taxed',
            how: 'breaks',
            beneficiary: 'Iva',
            result:
              'Nothing, under a law that takes a tenth from every basket at the gate. Three bakers ask for their nothing, in writing.',
          },
          {
            law: 'trade_licensed',
            how: 'bends',
            result:
              'A child trading without the Guild, and nothing said. The Guild says nothing either, loudly, for a month.',
          },
        ],
      },
      {
        verb: 'is_barred',
        choiceId: 'barred',
        against: [
          {
            law: 'trade_free',
            how: 'breaks',
            beneficiary: 'the bakers',
            result:
              'A trader barred from the market under a law that says all trade is free and pays nothing. The row watches the basket burn and reads the post afterwards.',
          },
        ],
      },
      { verb: 'pays_anyway', choiceId: 'fine_anyway', needsLaw: 'trade_free' },
      { verb: 'pays_the_toll', choiceId: 'toll', needsLaw: 'trade_taxed' },
      { verb: 'is_apprenticed', choiceId: 'guild', needsLaw: 'trade_licensed' },
    ],
  },

  d2_ashes: {
    subject: 'THE PRICE',
    verbs: ['is_bought_out', 'stands', 'is_shamed'],
    objects: [],
    rulings: [
      {
        verb: 'is_bought_out',
        choiceId: 'buy_out',
        against: [
          {
            law: 'trade_free',
            how: 'breaks',
            beneficiary: 'the bread queue',
            result:
              'The crown in the flour market with a purse, setting a price, under a law that says trade pays nothing and answers to nobody. Every trader on the row learns what free means.',
          },
          {
            law: 'trade_taxed',
            how: 'bends',
            result:
              'The crown buying back flour it had already taken a tenth of, under its own law. The Treasurer does the sum twice and does not read it out.',
          },
          {
            law: 'trade_licensed',
            how: 'breaks',
            beneficiary: 'the bread queue',
            result:
              "The crown trading in flour under a law that gives all trade to the Guild alone. The Guild asks for its share of the crown's sales, in writing.",
          },
        ],
      },
      { verb: 'stands', choiceId: 'let_stand' },
      {
        verb: 'is_shamed',
        choiceId: 'shame',
        against: [
          {
            law: 'trade_free',
            how: 'bends',
            result:
              "A crown board beside a trader's board, under a law that keeps the crown out of the market. It is only a board. He sells nothing for eleven days.",
          },
          {
            law: 'trade_licensed',
            how: 'bends',
            result:
              "The crown's board on the Guild's row, without the Guild's leave. The Guild takes it down at night, and puts up its own.",
          },
        ],
      },
      { verb: 'is_capped', choiceId: 'cap', needsLaw: 'trade_free' },
      { verb: 'is_tithed', choiceId: 'tithe', needsLaw: 'trade_taxed' },
      { verb: 'is_set_by_the_guild', choiceId: 'guild_price', needsLaw: 'trade_licensed' },
    ],
  },

  d3_cart: {
    subject: 'THE LEVER MAN',
    verbs: ['is_pardoned', 'is_dismissed', 'the_mine_pays'],
    objects: [],
    rulings: [
      {
        verb: 'is_pardoned',
        choiceId: 'pardon',
        against: [
          {
            law: 'lives_by_count',
            how: 'breaks',
            beneficiary: 'the lever man',
            result:
              'Five died where one could have, and the man who did not count is pardoned, under a law that says the number is the law. The chalked sum under the gate is rubbed out by morning.',
          },
          {
            law: 'lives_by_lot',
            how: 'bends',
            result:
              'No cup came out on the hillside, and no cup is mentioned in the pardon. The mine keeps its stones where the brandy was, and nobody looks at them.',
          },
        ],
      },
      {
        verb: 'is_dismissed',
        choiceId: 'dismiss',
        against: [
          {
            law: 'lives_untouchable',
            how: 'breaks',
            beneficiary: 'the mine',
            result:
              'A man put off the hill for not choosing, under a law that says no hand may choose. The eleven on the levers hear that not choosing is survivable, but not paid.',
          },
        ],
      },
      {
        verb: 'the_mine_pays',
        choiceId: 'blame_the_mine',
        against: [
          {
            law: 'lives_by_count',
            how: 'bends',
            result:
              'A ruling about a brake, under a law that is about the lever. Everybody in the room knows which of the two you did not mention.',
          },
          {
            law: 'lives_untouchable',
            how: 'bends',
            result:
              'The mine pays and the hand is not mentioned, under a law that is about the hand. The Chaplain reads the law out anyway, in the chapel, without a name in it.',
          },
          {
            law: 'lives_by_lot',
            how: 'bends',
            result:
              'The brake is fined and the cup is not mentioned, under a law that says the cup decides. The cup stays in the drawer.',
          },
        ],
      },
      { verb: 'should_have_pulled', choiceId: 'should_have_pulled', needsLaw: 'lives_by_count' },
      { verb: 'was_right', choiceId: 'was_right', needsLaw: 'lives_untouchable' },
      { verb: 'should_have_drawn', choiceId: 'should_have_drawn', needsLaw: 'lives_by_lot' },
    ],
  },

  d4_bridge: {
    subject: 'THE COOPER',
    verbs: ['is_honoured', 'is_convicted', 'is_honoured_and_fined'],
    objects: [],
    rulings: [
      {
        verb: 'is_honoured',
        choiceId: 'honour',
        against: [
          {
            law: 'lives_untouchable',
            how: 'breaks',
            beneficiary: 'the cooper',
            result:
              'A medal for a hand that chose, under a law that says no hand may. The eleven lever men come to the ceremony, stand at the back, and do not clap.',
          },
          {
            law: 'lives_by_lot',
            how: 'bends',
            result:
              'Honoured for a push with no cup in it, under a law that says the cup decides. Nobody asks how you draw lots on a collapsing bridge, and nobody stops thinking it.',
          },
        ],
      },
      {
        verb: 'is_convicted',
        choiceId: 'convict',
        against: [
          {
            law: 'lives_by_count',
            how: 'breaks',
            beneficiary: 'Odo',
            result:
              'He saved five for one and is convicted for it, under a law that says the greater number is saved. The five pay his fine at the door and read the gate on the way out.',
          },
        ],
      },
      {
        verb: 'is_honoured_and_fined',
        choiceId: 'both',
        against: [
          {
            law: 'lives_by_count',
            how: 'bends',
            result:
              'Fined for the arithmetic the law told him to do, and given a medal for doing it. The town cannot decide what he is, and the law cannot either.',
          },
          {
            law: 'lives_untouchable',
            how: 'bends',
            result:
              'A medal for a chosen death, under a law that forbids choosing, with a fine to make it look like a ruling. The Chaplain reads the law, then the medal, and stops.',
          },
        ],
      },
      { verb: 'counted_right', choiceId: 'counted_right', needsLaw: 'lives_by_count' },
      { verb: 'is_forgiven_the_rule', choiceId: 'forgiven', needsLaw: 'lives_untouchable' },
      { verb: 'skipped_the_cup', choiceId: 'skipped_the_cup', needsLaw: 'lives_by_lot' },
    ],
  },

  d5_deathbed: {
    subject: 'THE HEALER',
    verbs: ['is_thanked', 'pays_the_estate', 'is_replaced_by_a_clerk'],
    objects: [],
    rulings: [
      {
        verb: 'is_thanked',
        choiceId: 'thank_her',
        against: [
          {
            law: 'truth_mandatory',
            how: 'breaks',
            beneficiary: 'the Healer',
            result:
              'A kind lie thanked in open court, a month after a law that says every word must be true. The Chaplain asks which of the two the town should remember, and is not answered.',
          },
          {
            law: 'truth_licensed',
            how: 'breaks',
            beneficiary: 'the Healer',
            result:
              'An unbought lie thanked from the bench, under a law that sells them by the season. The horse dealer with a paid licence asks what he paid for.',
          },
        ],
      },
      {
        verb: 'pays_the_estate',
        choiceId: 'pays',
        against: [
          {
            law: 'truth_kind_lies',
            how: 'breaks',
            beneficiary: 'the estate',
            result:
              'A kind word fined, under a law that says a word may be kind instead of true. She reads the law on the post, twice, and goes back to saying yes.',
          },
          {
            law: 'truth_licensed',
            how: 'bends',
            result:
              'She pays the estate and not the licence fee, which is the fine for the wrong thing, and the stall by the fountain notices.',
          },
        ],
      },
      {
        verb: 'is_replaced_by_a_clerk',
        choiceId: 'clerk',
        against: [
          {
            law: 'truth_mandatory',
            how: 'bends',
            result:
              'The law is kept by a satchel and a form, and not by her. The dying get the truth from a stranger, which the law did not ask for and did not forbid.',
          },
          {
            law: 'truth_kind_lies',
            how: 'bends',
            result:
              'A clerk with a form for the dying, under a law that allows a kind word. The kind word is still allowed. Nobody in the corridor is allowed to say it.',
          },
        ],
      },
      { verb: 'is_forgiven_the_word', choiceId: 'forgiven_word', needsLaw: 'truth_mandatory' },
      { verb: 'was_within_the_law', choiceId: 'within_the_law', needsLaw: 'truth_kind_lies' },
      { verb: 'is_sold_a_licence', choiceId: 'sold_a_licence', needsLaw: 'truth_licensed' },
    ],
  },

  d6_door: {
    subject: 'THE WIDOW',
    verbs: ['goes_free', 'is_convicted', 'the_hunter_is_asked'],
    objects: [],
    rulings: [
      {
        verb: 'goes_free',
        choiceId: 'acquit',
        against: [
          {
            law: 'truth_mandatory',
            how: 'bends',
            result:
              'Every word true and the meaning false, under a law that says a word must be true. Half the town looks up where its cellar is, and the Chaplain looks up the word must.',
          },
          {
            law: 'truth_licensed',
            how: 'bends',
            result:
              'A lie by the letter and nothing paid for it, under a law that sells them. The dealers with licences ask why they bothered.',
          },
        ],
      },
      {
        verb: 'is_convicted',
        choiceId: 'convict',
        against: [
          {
            law: 'truth_kind_lies',
            how: 'breaks',
            beneficiary: 'the hunter',
            result:
              'A woman convicted of a kind word to a man with a warrant, under a law that says a word may be kind. The brother is taken on Friday, and the law is not read out again that year.',
          },
        ],
      },
      { verb: 'the_hunter_is_asked', choiceId: 'ask_the_hunter' },
      { verb: 'is_asked_again', choiceId: 'asked_again', needsLaw: 'truth_mandatory' },
      { verb: 'is_licensed_backdated', choiceId: 'backdated', needsLaw: 'truth_licensed' },
    ],
  },

  w_grain: {
    subject: 'THE GRANARY',
    verbs: ['is_opened_to_all', 'is_rationed', 'is_left_to_the_market'],
    objects: [],
    rulings: [
      { verb: 'is_opened_to_all', choiceId: 'open_stores' },
      { verb: 'is_rationed', choiceId: 'ration' },
      { verb: 'is_left_to_the_market', choiceId: 'let_market' },
    ],
  },

  x_revolt: {
    subject: 'THE SQUARE',
    verbs: ['is_faced_alone', 'is_bought_back', 'is_let_burn'],
    objects: [],
    rulings: [
      { verb: 'is_faced_alone', choiceId: 'walk_out' },
      { verb: 'is_bought_back', choiceId: 'buy_them' },
      { verb: 'is_let_burn', choiceId: 'let_it_burn' },
    ],
  },

  x_plague: {
    subject: 'THE EAST LANE',
    verbs: ['is_sealed_off', 'buys_physicians'],
    objects: [],
    rulings: [
      { verb: 'is_sealed_off', choiceId: 'close_the_lane' },
      { verb: 'buys_physicians', choiceId: 'open_the_vault' },
    ],
  },

  x_ruin: {
    subject: 'THE CROWN',
    verbs: ['borrows_from_guild', 'sells_the_plate'],
    objects: [],
    rulings: [
      { verb: 'borrows_from_guild', choiceId: 'borrow' },
      { verb: 'sells_the_plate', choiceId: 'sell_the_crown' },
    ],
  },

  x_abdication: {
    subject: 'THE SEAL',
    verbs: ['is_carried_upstairs', 'is_read_in_the_square'],
    objects: [],
    rulings: [
      { verb: 'is_carried_upstairs', choiceId: 'go_up' },
      { verb: 'is_read_in_the_square', choiceId: 'call_the_square' },
    ],
  },

  x_flight: {
    subject: 'THE TOWN',
    verbs: ['is_forgiven_a_year', 'is_shut'],
    objects: [],
    rulings: [
      { verb: 'is_forgiven_a_year', choiceId: 'a_year_free' },
      { verb: 'is_shut', choiceId: 'close_the_gate' },
    ],
  },

  w_wolf: {
    subject: 'THE WOLF',
    verbs: ['is_fed_and_kept', 'is_driven_to_the_trees', 'is_killed_and_eaten'],
    objects: [],
    rulings: [
      { verb: 'is_fed_and_kept', choiceId: 'feed_it' },
      { verb: 'is_driven_to_the_trees', choiceId: 'drive_it_off' },
      { verb: 'is_killed_and_eaten', choiceId: 'kill_it' },
    ],
  },

  w_wolf_dog: {
    subject: 'THE LITTER',
    verbs: ['goes_to_every_house', 'works_the_flock', 'goes_back_to_the_trees'],
    objects: [],
    rulings: [
      { verb: 'goes_to_every_house', choiceId: 'every_house' },
      { verb: 'works_the_flock', choiceId: 'to_the_flock' },
      { verb: 'goes_back_to_the_trees', choiceId: 'back_to_the_trees' },
    ],
  },

  w_wolf_back: {
    subject: 'THE WOLF',
    verbs: ['is_hunted_down', 'is_fed_after_all', 'is_shut_out_nightly'],
    objects: [],
    rulings: [
      { verb: 'is_hunted_down', choiceId: 'hunt_it_down' },
      { verb: 'is_fed_after_all', choiceId: 'put_the_bowl_out' },
      { verb: 'is_shut_out_nightly', choiceId: 'pen_them_at_night' },
    ],
  },

  w_cold: {
    subject: 'THE WINTER',
    verbs: ['hall_opened', 'fences_burned', 'wood_guarded'],
    objects: [],
    rulings: [
      { verb: 'hall_opened', choiceId: 'open_hall' },
      { verb: 'fences_burned', choiceId: 'burn_fences' },
      { verb: 'wood_guarded', choiceId: 'guard_wood' },
    ],
  },
  c1_lark: {
    subject: 'THE BOY',
    verbs: ['gives_it_back', 'keeps_it', 'takes_three'],
    objects: [],
    rulings: [
      {
        verb: 'gives_it_back',
        choiceId: 'coat_back',
        against: [
          {
            law: 'crime_forgiven',
            how: 'bends',
            result:
              'Not fed, not asked, and sent home cold, under a law that says a hand that takes is fed and asked why. The stove that does not draw is not written down.',
          },
          {
            law: 'crime_repaid',
            how: 'bends',
            result:
              'Once back, under a law that says twice. The woman with the peg counts to one and says nothing about the other one.',
          },
        ],
      },
      {
        verb: 'keeps_it',
        choiceId: 'let_him_keep',
        against: [
          {
            law: 'crime_repaid',
            how: 'breaks',
            beneficiary: 'Lark',
            result:
              'Nothing paid back at all, under a law that says twice, and the owner asked to be the bigger person. She is, and she reads the law on the way home.',
          },
          {
            law: 'crime_hanged',
            how: 'bends',
            result:
              'The rope is not mentioned, the boy keeps the coat, and the post at the crossroads is not read out. Everybody knows what it says.',
          },
        ],
      },
      {
        verb: 'takes_three',
        choiceId: 'whipped',
        against: [
          {
            law: 'crime_forgiven',
            how: 'breaks',
            beneficiary: 'the woman who owns the coat',
            result:
              'Three strokes in the square under a law that says a hand that takes is fed and asked why. Nobody asks why. The square goes back to work without looking at the post.',
          },
          {
            law: 'crime_hanged',
            how: 'bends',
            result:
              'Three strokes instead of the crossroads, and the decree not read. It is a mercy, and it is a mercy against your own sentence, and the Captain notices both.',
          },
        ],
      },
      { verb: 'is_asked_why', choiceId: 'asked_why', needsLaw: 'crime_forgiven' },
      { verb: 'owes_two_coats', choiceId: 'two_coats', needsLaw: 'crime_repaid' },
      { verb: 'not_at_twelve', choiceId: 'spare_the_child', needsLaw: 'crime_hanged' },
    ],
  },

  tr_accused: {
    subject: 'TAM',
    verbs: ['did_it', 'is_not_proven', 'works_the_loss_off'],
    objects: [],
    rulings: [
      { verb: 'did_it', choiceId: 'convict' },
      { verb: 'is_not_proven', choiceId: 'acquit' },
      { verb: 'works_the_loss_off', choiceId: 'no_verdict' },
    ],
  },

  tr_accused_wrong: {
    subject: 'THE COLUMN',
    verbs: ['is_read_out', 'is_shelved'],
    objects: [],
    rulings: [
      { verb: 'is_read_out', choiceId: 'read_it_out' },
      { verb: 'is_shelved', choiceId: 'close_the_book' },
    ],
  },

  tr_accused_again: {
    subject: 'TAM',
    verbs: ['goes_down_the_road', 'is_kept_in_sight'],
    objects: [],
    rulings: [
      { verb: 'goes_down_the_road', choiceId: 'out_for_good' },
      { verb: 'is_kept_in_sight', choiceId: 'kept_in_sight' },
    ],
  },

  c2_toll: {
    subject: 'THE FERRIER',
    verbs: ['box_forgotten', 'pays_the_short', 'loses_the_ferry'],
    objects: [],
    rulings: [
      {
        verb: 'box_forgotten',
        choiceId: 'let_it_go',
        against: [
          {
            law: 'crime_forgiven',
            how: 'bends',
            result:
              'Let alone and not asked why, under a law whose whole point is the asking. The question sits in the box with the missing coin.',
          },
          {
            law: 'crime_repaid',
            how: 'breaks',
            beneficiary: 'the Ferrier',
            result:
              'Nothing paid back, under a law that says twice, for a man everybody agrees took it. The ledger by the fountain has a blank line, and people point at it.',
          },
          /* The second bench the rope can be reached from. Every lesser sentence
             on this case is a grey answer under the crossroads law; this one is
             not a sentence at all, for a man everybody agrees took it, and the
             town reads the post the way it was taught to. The screen warns
             before the word is said, the same as it does for the coat. */
          {
            law: 'crime_hanged',
            how: 'breaks',
            beneficiary: 'the Ferrier',
            result:
              'A winter of grain gone from the box, a man everybody agrees took it, and no sentence at all, under a decree that names the crossroads and no exceptions.',
          },
        ],
      },
      {
        verb: 'pays_the_short',
        choiceId: 'pays_the_short',
        against: [
          {
            law: 'crime_repaid',
            how: 'bends',
            result:
              'Once, under a law that says twice. He pays it in fish, the second half is never mentioned, and the ledger has a column that does not add up.',
          },
          {
            law: 'crime_hanged',
            how: 'bends',
            result:
              'Repayment for a hand that took, under a law that names the crossroads. Nobody on the ferry mentions the post. Everybody on the ferry has read it.',
          },
        ],
      },
      {
        verb: 'loses_the_ferry',
        choiceId: 'loses_the_ferry',
        against: [
          {
            law: 'crime_forgiven',
            how: 'breaks',
            beneficiary: 'the new ferrier',
            result:
              'House, boat and box taken from a man, under a law that feeds him and asks why. Nobody asked. The river takes the new man twice that winter.',
          },
        ],
      },
      { verb: 'counts_with_a_witness', choiceId: 'counted_with', needsLaw: 'crime_forgiven' },
      { verb: 'pays_it_twice', choiceId: 'pays_it_twice', needsLaw: 'crime_repaid' },
      { verb: 'hangs_for_coins', choiceId: 'hangs_for_coins', needsLaw: 'crime_hanged' },
    ],
  },

  s1_worms: {
    subject: 'THE FAIR PURSE',
    verbs: ['goes_to_the_players', 'goes_to_the_worm_eater', 'is_split_one_stage'],
    objects: [],
    rulings: [
      {
        verb: 'goes_to_the_players',
        choiceId: 'players',
        against: [
          {
            law: 'song_by_crowd',
            how: 'breaks',
            beneficiary: 'the players',
            result:
              'The purse to eleven against two hundred, under a law that pays by the crowd. The worm man counts his crowd aloud and reads the law to it.',
          },
        ],
      },
      {
        verb: 'goes_to_the_worm_eater',
        choiceId: 'worms',
        against: [
          {
            law: 'song_worthy',
            how: 'breaks',
            beneficiary: 'the worm eater',
            result:
              'The purse to a man the hall never called worthy, under a law that says the hall decides. The hall sits the next Thursday and decides about you.',
          },
          {
            law: 'song_by_hat',
            how: 'breaks',
            beneficiary: 'the worm eater',
            result:
              'A purse the law shut, opened for a man whose hat was already heavy. The players leave in the spring anyway, and say why.',
          },
        ],
      },
      {
        verb: 'is_split_one_stage',
        choiceId: 'split',
        against: [
          {
            law: 'song_worthy',
            how: 'bends',
            result:
              'Half a purse to something the hall never judged, under a law that says the hall judges. The hall judges the interval, later, in writing.',
          },
          {
            law: 'song_by_crowd',
            how: 'bends',
            result:
              'Half to a crowd of eleven, under a law that counts crowds. The arithmetic is done in the square, and it does not come out to half.',
          },
          {
            law: 'song_by_hat',
            how: 'bends',
            result:
              'A shut purse, half opened, under a law that says the hat or nothing. Half of nothing is argued about for a year.',
          },
        ],
      },
      { verb: 'goes_where_the_hall_says', choiceId: 'hall_judges', needsLaw: 'song_worthy' },
      { verb: 'follows_the_count', choiceId: 'counted', needsLaw: 'song_by_crowd' },
      { verb: 'pays_the_players_anyway', choiceId: 'purse_anyway', needsLaw: 'song_by_hat' },
    ],
  },

  s2_ballad: {
    subject: 'THE SINGER',
    verbs: ['is_paid_and_thanked', 'sings_on', 'sings_outside'],
    objects: [],
    rulings: [
      {
        verb: 'is_paid_and_thanked',
        choiceId: 'pay_him',
        against: [
          {
            law: 'song_worthy',
            how: 'breaks',
            beneficiary: 'the singer',
            result:
              'Paid from the purse before the hall ever sat, under a law that says the hall decides worth. The hall sits anyway, finds it worthy, and asks why it was asked.',
          },
          {
            law: 'song_by_crowd',
            how: 'bends',
            result:
              'Paid from the steps, not by the head, under a law that counts the crowd. Nobody counted, the crowd was the whole town, and the sum would have been larger.',
          },
          {
            law: 'song_by_hat',
            how: 'breaks',
            beneficiary: 'the singer',
            result:
              'The purse the law shut, opened for a song about your worst year. The Treasurer melts the purse the following week, on purpose, in public.',
          },
        ],
      },
      { verb: 'sings_on', choiceId: 'let_it' },
      {
        verb: 'sings_outside',
        choiceId: 'silence',
        against: [
          {
            law: 'song_worthy',
            how: 'bends',
            result:
              'Silenced inside the wall before the hall could call it anything, under a law that says the hall calls it. The hall puts it in the book anyway, from outside.',
          },
          {
            law: 'song_by_crowd',
            how: 'breaks',
            beneficiary: 'the Captain',
            result:
              'The largest crowd the square has held, sent outside the wall, under a law that pays a song by its crowd. It is paid nothing, and sung by more.',
          },
          {
            law: 'song_by_hat',
            how: 'bends',
            result:
              'The crown with no purse and no say, under its own law, saying where a song may be sung. The hat goes round outside the wall and comes back heavy.',
          },
        ],
      },
      { verb: 'is_judged_worthy', choiceId: 'judged_worthy', needsLaw: 'song_worthy' },
      { verb: 'is_paid_by_the_head', choiceId: 'by_the_crowd', needsLaw: 'song_by_crowd' },
      { verb: 'has_his_hat_bought', choiceId: 'buy_the_hat', needsLaw: 'song_by_hat' },
    ],
  },

  w_race: {
    subject: 'WAT',
    verbs: ['rides_between_the_stones', 'runs_on_his_legs', 'runs_the_second_race'],
    objects: [],
    rulings: [
      { verb: 'rides_between_the_stones', choiceId: 'rides' },
      { verb: 'runs_on_his_legs', choiceId: 'legs' },
      { verb: 'runs_the_second_race', choiceId: 'two_races' },
    ],
  },

  w_bees: {
    subject: 'THE SWARM',
    verbs: ['is_left_in_the_eaves', 'is_smoked_out', 'is_sold_boxed'],
    objects: [],
    rulings: [
      { verb: 'is_left_in_the_eaves', choiceId: 'keep' },
      { verb: 'is_smoked_out', choiceId: 'smoke' },
      { verb: 'is_sold_boxed', choiceId: 'sell' },
    ],
  },

  w_goats: {
    subject: 'THE HERD',
    verbs: ['is_split_between_houses', 'is_the_boys', 'stays_whole_he_walks_it'],
    objects: [],
    rulings: [
      { verb: 'is_split_between_houses', choiceId: 'split_them' },
      { verb: 'is_the_boys', choiceId: 'his_herd' },
      { verb: 'stays_whole_he_walks_it', choiceId: 'he_walks_them' },
      // and the two the work law answers before you open your mouth
      { verb: 'is_everybodys_by_law', choiceId: 'by_the_law_shared', needsLaw: 'work_shared' },
      { verb: 'is_his_by_law', choiceId: 'by_the_law_owned', needsLaw: 'work_owned' },
    ],
  },

  w_honey: {
    subject: 'THE HONEY',
    verbs: ['goes_a_jar_to_every_house', 'is_sold_at_the_gate', 'is_cut_into_hives'],
    objects: [],
    rulings: [
      { verb: 'goes_a_jar_to_every_house', choiceId: 'share' },
      { verb: 'is_sold_at_the_gate', choiceId: 'sell' },
      { verb: 'is_cut_into_hives', choiceId: 'hives' },
    ],
  },

  v5_winter_ground: {
    subject: 'THE FROZEN GROUND',
    verbs: ['burns_the_ground_open', 'waits_in_the_barn', 'goes_under_stones'],
    objects: [],
    rulings: [
      {
        verb: 'burns_the_ground_open',
        choiceId: 'burn_the_wood',
        against: [
          {
            law: 'dead_by_the_house',
            how: 'breaks',
            beneficiary: 'the three houses',
            result:
              "The whole place's woodpile on three houses' dead, under a law that says each house carries its own. The houses with nobody to bury count the logs.",
          },
          {
            law: 'dead_at_the_edge',
            how: 'bends',
            result:
              'Six days of fire is six days, and the law says the same day, and the strip gets them on the sixth. Nobody argues with fire.',
          },
        ],
      },
      {
        verb: 'waits_in_the_barn',
        choiceId: 'the_barn',
        against: [
          {
            law: 'dead_with_a_day',
            how: 'breaks',
            beneficiary: 'the field',
            result:
              'Three of them in the barn until April under a law that stops the work for one, and the work never stopped once. The day is owed, and everybody knows it is owed.',
          },
          {
            law: 'dead_at_the_edge',
            how: 'breaks',
            beneficiary: 'the three in the barn',
            result:
              'April is not the same day. The law on the post says the same day, and the barn is walked past every morning by people who wrote it with you.',
          },
        ],
      },
      {
        verb: 'goes_under_stones',
        choiceId: 'the_stones',
        against: [
          {
            law: 'dead_with_a_day',
            how: 'bends',
            result:
              "An afternoon, two people and a pile of stones, under a law that promised a day and all of us standing in it. It is the frost's fault, and it is said to be the frost's fault, often.",
          },
          {
            law: 'dead_by_the_house',
            how: 'bends',
            result:
              'The place piles the stones, not the houses. Nobody minds, and the law says otherwise, and both of those are true all winter.',
          },
        ],
      },
      { verb: 'is_dug_by_all_of_us', choiceId: 'all_of_us_dig', needsLaw: 'dead_with_a_day' },
      { verb: 'is_each_house_its_own', choiceId: 'their_own_houses', needsLaw: 'dead_by_the_house' },
      { verb: 'goes_to_the_edge_today', choiceId: 'the_edge_today', needsLaw: 'dead_at_the_edge' },
    ],
  },

  v6_road_dead: {
    subject: 'THE MAN AT THE GATEPOST',
    verbs: ['is_ours_now', 'waits_for_an_answer', 'goes_past_the_boundary'],
    objects: [],
    rulings: [
      {
        verb: 'is_ours_now',
        choiceId: 'ours_now',
        against: [
          {
            law: 'dead_by_the_house',
            how: 'breaks',
            beneficiary: 'a stranger with a name in his coat',
            result:
              'He had no house here, the law says the house carries its own, and the whole place carried him. The next house with a death asks why it was different.',
          },
          {
            law: 'dead_at_the_edge',
            how: 'bends',
            result:
              'The day and the standing, for a stranger, under a law that gives nobody a day. The field is a morning short and the law is a little shorter.',
          },
        ],
      },
      {
        verb: 'waits_for_an_answer',
        choiceId: 'send_word',
        against: [
          {
            law: 'dead_with_a_day',
            how: 'bends',
            result:
              'Eleven days of waiting is not a day of standing, and the work goes on around him, which the law said it would not.',
          },
          {
            law: 'dead_by_the_house',
            how: 'bends',
            result:
              'Two riders and eleven days out of the store for a man of no house, under a law that says the house pays. The store notices.',
          },
          {
            law: 'dead_at_the_edge',
            how: 'breaks',
            beneficiary: 'a brother in the third valley',
            result:
              'Held eleven days in August under a law that says the same day. The brother who comes for him is grateful, and the law is read aloud at the gate by somebody who is not.',
          },
        ],
      },
      {
        verb: 'goes_past_the_boundary',
        choiceId: 'past_the_boundary',
        against: [
          {
            law: 'dead_with_a_day',
            how: 'breaks',
            beneficiary: 'the next parish',
            result:
              'Nobody stood, nobody stopped, and a man was carried out of the place like a sack, under a law that stops the work for a death. The men who carried him do not come to the next one.',
          },
        ],
      },
      { verb: 'stops_the_work_the_same', choiceId: 'the_day_for_him', needsLaw: 'dead_with_a_day' },
      { verb: 'has_no_house_here', choiceId: 'no_house_no_burial', needsLaw: 'dead_by_the_house' },
      {
        verb: 'goes_to_the_edge_the_same_day',
        choiceId: 'edge_same_day',
        needsLaw: 'dead_at_the_edge',
      },
    ],
  },

  v7_beeches: {
    subject: 'THE BASKET',
    verbs: ['is_the_childs', 'is_tipped_out_and_split', 'belongs_to_the_strip'],
    objects: [],
    rulings: [
      {
        verb: 'is_the_childs',
        choiceId: 'the_child_keeps',
        against: [
          {
            law: 'mushrooms_weighed',
            how: 'breaks',
            beneficiary: 'Iva',
            result:
              'One basket kept by one child under a law that weighs and shares every basket. The scale by the long house is looked at, and then looked at again.',
          },
          {
            law: 'mushrooms_for_the_cart',
            how: 'breaks',
            beneficiary: 'Iva',
            result:
              'She eats them, and gives them away, and everybody who takes one is eating against a law that says nobody here does. The cart goes down the road lighter, and the carter says so.',
          },
        ],
      },
      {
        verb: 'is_tipped_out_and_split',
        choiceId: 'split_them',
        against: [
          {
            law: 'mushrooms_finders',
            how: 'bends',
            result:
              'Half to the one who was not up first, under a law that gives it all to the one who was. Fair, and not what it says on the post.',
          },
          {
            law: 'mushrooms_for_the_cart',
            how: 'bends',
            result:
              'Half a basket goes on the cart in the end, which is half of what the law says, and the other half is eaten quietly.',
          },
        ],
      },
      {
        verb: 'belongs_to_the_strip',
        choiceId: 'the_strip_owns',
        against: [
          {
            law: 'mushrooms_finders',
            how: 'breaks',
            beneficiary: 'Marta',
            result:
              'The law says whoever finds them, and a child found them, and they went to the strip anyway. Five people with lamps read the post the next dawn and go home.',
          },
          {
            law: 'mushrooms_weighed',
            how: 'breaks',
            beneficiary: 'Marta',
            result:
              'A whole basket to one household under a law that shares every basket by the scale. Marta knows it, and says thank you louder than she needs to.',
          },
        ],
      },
      {
        verb: 'goes_to_whoever_found_it',
        choiceId: 'up_first_wins',
        needsLaw: 'mushrooms_finders',
      },
      { verb: 'goes_on_the_scale', choiceId: 'to_the_scale', needsLaw: 'mushrooms_weighed' },
      { verb: 'goes_in_the_box', choiceId: 'on_the_cart', needsLaw: 'mushrooms_for_the_cart' },
    ],
  },

  v8_long_night: {
    subject: 'THE WOOD',
    verbs: ['is_shut_every_september', 'is_taught_every_autumn', 'is_their_own_lookout'],
    objects: [],
    rulings: [
      {
        verb: 'is_shut_every_september',
        choiceId: 'shut_the_wood',
        against: [
          {
            law: 'mushrooms_finders',
            how: 'breaks',
            beneficiary: 'the Healer',
            result:
              'A rope across the beech path under a law that gives the wood to whoever is up first. Three people are up first anyway, and step over it.',
          },
          {
            law: 'mushrooms_weighed',
            how: 'bends',
            result:
              'A place that shares what it picks, and picks nothing. The scale by the long house is used for flour.',
          },
        ],
      },
      {
        verb: 'is_taught_every_autumn',
        choiceId: 'teach_it',
        against: [
          {
            law: 'mushrooms_finders',
            how: 'bends',
            result:
              'Six evenings in the long house before anybody may go in, under a law that says whoever is up first. The early risers sit through it and are not early that year.',
          },
          {
            law: 'mushrooms_for_the_cart',
            how: 'bends',
            result:
              'Teaching a whole place which ones to eat, under a law that says nobody here eats them. The cart is a little lighter, and the Healer is a little happier.',
          },
        ],
      },
      {
        verb: 'is_their_own_lookout',
        choiceId: 'their_own_lookout',
        against: [
          {
            law: 'mushrooms_weighed',
            how: 'breaks',
            beneficiary: 'whoever wants the wood to themselves',
            result:
              'Their own risk and their own basket, under a law that picks together and passes everything over one scale. The scale is not used again that autumn.',
          },
          {
            law: 'mushrooms_for_the_cart',
            how: 'breaks',
            beneficiary: 'the ones who eat them',
            result:
              'The wood left open for eating under a law that put every mushroom in it on a cart. The carter counts what comes down the road and does the arithmetic aloud.',
          },
        ],
      },
      {
        verb: 'is_first_come_and_wrong_is_wrong',
        choiceId: 'finders_take_the_risk',
        needsLaw: 'mushrooms_finders',
      },
      {
        verb: 'passes_the_healer_first',
        choiceId: 'the_scale_decides',
        needsLaw: 'mushrooms_weighed',
      },
      {
        verb: 'settles_it_for_the_cart',
        choiceId: 'let_the_cart_have_it',
        needsLaw: 'mushrooms_for_the_cart',
      },
    ],
  },

  w_corner: {
    subject: 'NELL',
    verbs: ['is_carried_by_the_nine_of_us', 'has_the_afternoons', 'is_asked_herself'],
    objects: [],
    rulings: [
      { verb: 'is_carried_by_the_nine_of_us', choiceId: 'she_is_carried' },
      { verb: 'has_the_afternoons', choiceId: 'the_afternoons' },
      { verb: 'is_asked_herself', choiceId: 'she_is_asked' },
    ],
  },

  x_square: {
    subject: 'THE DEPUTATION',
    verbs: ['is_taken_entire', 'is_answered_in_three', 'is_sent_home'],
    objects: [],
    rulings: [
      { verb: 'is_taken_entire', choiceId: 'give_the_list' },
      { verb: 'is_answered_in_three', choiceId: 'hear_them_out' },
      { verb: 'is_sent_home', choiceId: 'the_seal_stands' },
    ],
  },

  w_brother: {
    subject: 'YOUR BROTHER',
    verbs: ['walks_in', 'is_kept_and_watched', 'is_turned_at_the_fence'],
    objects: [],
    rulings: [
      { verb: 'walks_in', choiceId: 'let_him_in' },
      { verb: 'is_kept_and_watched', choiceId: 'take_him_in' },
      { verb: 'is_turned_at_the_fence', choiceId: 'turn_him_back' },
    ],
  },

  w_brother_fire: {
    subject: 'YOUR BROTHER',
    verbs: ['is_let_be', 'rebuilds_it', 'is_on_the_road_by_morning'],
    objects: [],
    rulings: [
      { verb: 'is_let_be', choiceId: 'he_stays' },
      { verb: 'rebuilds_it', choiceId: 'he_works_it_off' },
      { verb: 'is_on_the_road_by_morning', choiceId: 'he_goes_now' },
    ],
  },

  w_brother_easel: {
    subject: 'YOUR BROTHER',
    verbs: ['stays_where_he_stands', 'paints_for_the_cart', 'goes_back_to_the_field'],
    objects: [],
    rulings: [
      { verb: 'stays_where_he_stands', choiceId: 'let_him_paint' },
      { verb: 'paints_for_the_cart', choiceId: 'sell_them' },
      { verb: 'goes_back_to_the_field', choiceId: 'back_to_the_field' },
    ],
  },

  w_pot: {
    subject: 'THE POT',
    verbs: ['is_split_four_coins', 'goes_to_the_finder', 'goes_to_the_store'],
    objects: [],
    rulings: [
      { verb: 'is_split_four_coins', choiceId: 'split' },
      { verb: 'goes_to_the_finder', choiceId: 'finder' },
      { verb: 'goes_to_the_store', choiceId: 'store' },
    ],
  },

  r1_tam_fed: {
    subject: 'THE FENCE',
    verbs: ['goes_up_where_tam_says', 'is_each_house_its_run', 'waits_for_spring'],
    objects: [],
    rulings: [
      { verb: 'goes_up_where_tam_says', choiceId: 'tam_says_where' },
      { verb: 'is_each_house_its_run', choiceId: 'each_house_its_run' },
      { verb: 'waits_for_spring', choiceId: 'pen_them_till_spring' },
    ],
  },

  r1_tam_cut: {
    subject: 'TAM',
    verbs: ['is_asked_at_the_gap', 'is_paid_like_a_stranger', 'is_not_asked'],
    objects: [],
    rulings: [
      { verb: 'is_asked_at_the_gap', choiceId: 'ask_him_yourself' },
      { verb: 'is_paid_like_a_stranger', choiceId: 'pay_him_like_a_stranger' },
      { verb: 'is_not_asked', choiceId: 'without_him' },
    ],
  },

  r2_marta_kept: {
    subject: 'THE STRIP',
    verbs: ['is_half_given', 'is_taken_kept_or_not', 'is_left_and_other_ground_paid_for'],
    objects: [],
    rulings: [
      { verb: 'is_half_given', choiceId: 'the_half_she_offers' },
      { verb: 'is_taken_kept_or_not', choiceId: 'kept_once_not_forever' },
      { verb: 'is_left_and_other_ground_paid_for', choiceId: 'other_ground' },
    ],
  },

  r2_marta_moved: {
    subject: 'MARTA',
    verbs: ['names_her_price', 'loses_it_as_before', 'is_paid_by_the_mill'],
    objects: [],
    rulings: [
      { verb: 'names_her_price', choiceId: 'her_price' },
      { verb: 'loses_it_as_before', choiceId: 'take_it_as_before' },
      { verb: 'is_paid_by_the_mill', choiceId: 'the_mill_pays' },
    ],
  },
};

/** The sentence as the clerk writes it down. */
export function formatRuling(caseId: string, verbId: string, objectId?: string): string {
  const grammar = CASE_VERDICTS[caseId];
  const verb = VERDICT_VERBS.find((v) => v.id === verbId)?.text ?? '';
  const object = objectId
    ? VERDICT_OBJECTS.find((o) => o.id === objectId)?.text
    : undefined;
  const head = grammar ? `${grammar.subject} ${verb}` : verb;
  return object ? `${head} ${object}` : head;
}
