import type { AftermathScene } from '../engine/types';

/**
 * The week after a decree, in one paragraph. Two for the bad idea, because a
 * bad idea needs room to arrive.
 */
export const AFTERMATHS: AftermathScene[] = [
  // ---------------------------------------------------------------- the hamlet
  {
    id: 'am_work_shared',
    paragraphs: [
      '{{law:work_shared}} is said out loud at the woodpile, and everybody nods, and the nodding is the whole of the ceremony.',
    ],
  },
  {
    id: 'am_work_ruled',
    paragraphs: [
      '{{law:work_ruled}} makes one of us a headman and the rest of us an audience. The headman is you. The field notices by August.',
      'By the second year the headman has a chair. It is the only chair, and people stand differently around it.',
    ],
  },
  {
    id: 'am_work_owned',
    paragraphs: [
      'Under {{law:work_owned}} the field gets four fences by Sunday and the water gets none, and everybody drinks from it anyway.',
    ],
  },
  {
    id: 'am_strangers_welcomed',
    paragraphs: [
      '{{law:strangers_welcomed}} is read to the road. The road hears it. By harvest there are nine of you, and one of them can sing.',
    ],
  },
  {
    id: 'am_strangers_earned',
    paragraphs: [
      '{{law:strangers_earned}} puts a year between the fence and the table. The ones who stay through it stay for good.',
    ],
  },
  {
    id: 'am_strangers_turned_away',
    paragraphs: [
      '{{law:strangers_turned_away}} is painted on a board at the top of the lane by someone who can paint. It is the nicest thing in the hamlet.',
      'The road learns. Fewer people stop. The people already here get very good at the people already here.',
    ],
  },
  // ---------------------------------------------------------------- trade
  {
    id: 'am_dead_with_a_day',
    paragraphs: [
      'Under {{law:dead_with_a_day}} the next one is a Thursday in August, in the middle of the carting, and the carts stand in the lane all day with the load still on them.',
    ],
    extra: [
      {
        when: { kind: 'lawActive', subject: 'work', action: 'owned' },
        paragraph:
          'Two of them go back to their own fields after an hour, which is exactly what {{law:work_owned}} says they may do, and nobody has ever been looked at like that here before.',
      },
    ],
  },
  {
    id: 'am_dead_by_the_house',
    paragraphs: [
      'Under {{law:dead_by_the_house}} the field does not stop and the sowing goes in on time, and a family of three digs a hole for one of them on a Tuesday while everybody else is visible, working, forty yards away.',
    ],
  },
  {
    id: 'am_dead_at_the_edge',
    paragraphs: [
      '{{law:dead_at_the_edge}} is read out once and never has to be read out again. Nobody argues with it in the room, and nobody looks at anybody else either.',
      'It works. The sowing is never late again, there is no ground to keep and no box to build. What it also does is put the place upstream of itself, and by the third year nobody here will drink below the bend, and nobody has said out loud why.',
    ],
  },
  {
    id: 'am_mushrooms_finders',
    paragraphs: [
      'Under {{law:mushrooms_finders}} the wood has three people in it before light by Wednesday and eleven by the end of the month, and the good ring in the beeches is stripped by the fifth of September for the first time in living memory.',
    ],
  },
  {
    id: 'am_mushrooms_weighed',
    paragraphs: [
      '{{law:mushrooms_weighed}} puts a scale on a barrel by the long house and one person beside it who knows which ones are which, and everybody eats better in October than they have any year before.',
    ],
  },
  {
    id: 'am_mushrooms_for_the_cart',
    paragraphs: [
      'Under {{law:mushrooms_for_the_cart}} the whole crop goes down the road in two loads and comes back as coin, and it is a great deal of coin, and the store has never looked like that in September.',
      'The part nobody drafted is what happens in a wet year in a place that has learned the wood is not for eating. They pick them anyway, at night, without the person who knows which ones are which, because that person is at the cart. The Healer keeps a list now and will not discuss it.',
    ],
  },
  {
    id: 'am_trade_free',
    paragraphs: [
      '{{law:trade_free}} is read out in the market on Monday, and by the afternoon there are nine baskets where there was one. The Treasurer takes the news standing up, with his hands behind his back.',
    ],
  },
  {
    id: 'am_trade_taxed',
    paragraphs: [
      'A desk appears in the row under {{law:trade_taxed}}, with a man behind it who has waited his whole life for a desk. By Friday there is a path worn round the desk.',
    ],
  },
  {
    id: 'am_trade_licensed',
    paragraphs: [
      'The Guild receives {{law:trade_licensed}} with the dignity of an institution that has just been handed a town. There is a banner over the market by Wednesday and a list of who may stand under it.',
      'By the second week the back lanes have lanterns and better prices. The Guild has asked for wardens, the wardens have asked for more wardens, and the Treasurer has begun to call the whole arrangement an income.',
    ],
  },

  // ---------------------------------------------------------------- lives
  {
    id: 'am_lives_by_count',
    paragraphs: [
      '{{law:lives_by_count}} goes up on both gates, and by the second morning somebody has chalked a sum underneath it, correctly.',
      'The Chaplain hears three people work out what they are worth in a fire. All three had the number ready before he asked.',
    ],
  },
  {
    id: 'am_lives_untouchable',
    paragraphs: [
      '{{law:lives_untouchable}} is read in the chapel first, which the Chaplain arranges without asking. The eleven men on the levers are relieved, then quiet. The cart still goes wherever the cart goes.',
    ],
  },
  {
    id: 'am_lives_by_lot',
    paragraphs: [
      'The mine buys a leather cup and a set of numbered stones under {{law:lives_by_lot}}, and keeps them where the brandy used to be. Everyone agrees it is fair, in the voice people use when a thing is fair.',
    ],
  },

  // ---------------------------------------------------------------- truth
  {
    id: 'am_truth_mandatory',
    paragraphs: [
      'Under {{law:truth_mandatory}} the market goes quiet, then loud, then quiet again, as everybody works out how much of their trade was tone of voice. The Chaplain is delighted for eleven days.',
    ],
  },
  {
    id: 'am_truth_kind_lies',
    paragraphs: [
      '{{law:truth_kind_lies}} arrives like a window opening. The Healer goes back to her old voice, and her waiting room fills with people who want to hear it.',
    ],
  },
  {
    id: 'am_truth_licensed',
    paragraphs: [
      'The first licence under {{law:truth_licensed}} is bought by a horse dealer at nine in the morning, before the ink is dry.',
      'The stalls are up by the fountain within the week: licences by the day, the season and the sentence. The dear one says NO LIMIT, and is mostly bought as a joke and used seriously.',
    ],
  },
  // ---------------------------------------------------------------- crime
  {
    id: 'am_crime_forgiven',
    paragraphs: [
      'Under {{law:crime_forgiven}} the first hand belongs to a woman who took a hen, and the asking why takes until dark. She had a reason. Everybody has a reason, it turns out, and now the town has to hear them.',
    ],
  },
  {
    id: 'am_crime_repaid',
    paragraphs: [
      '{{law:crime_repaid}} turns out to be arithmetic, which the town likes. A ledger goes up by the fountain with two columns, taken and paid, and people read it the way they read weather.',
    ],
  },
  {
    id: 'am_crime_hanged',
    paragraphs: [
      'The crossroads gets a beam. It is a good beam, cut from the long house offcuts, and the man who cut it did not know what it was for.',
      'Under {{law:crime_hanged}} nothing goes missing for a season. Nothing is lent, either. Doors that stood open all summer are shut by August, and the town is quieter than it has ever been, in the way a field is quiet.',
    ],
  },
  // ---------------------------------------------------------------- song
  {
    id: 'am_song_worthy',
    paragraphs: [
      'Under {{law:song_worthy}} the hall sits on Thursdays to decide what worth is, and the first thing it decides is that the worm man has none. He eats eleven worms outside the door, for nothing, to a bigger crowd than the hall has ever drawn.',
    ],
  },
  {
    id: 'am_song_by_crowd',
    paragraphs: [
      '{{law:song_by_crowd}} is read out on fair day, and by the next fair day the square has three worm eaters, a man who is set on fire on purpose, and the players, performing to the bench they brought with them.',
    ],
  },
  {
    id: 'am_song_by_hat',
    paragraphs: [
      '{{law:song_by_hat}} shuts the fair purse the same afternoon, and the Treasurer has it melted into something more useful before anybody can open it again.',
      'The players leave in the spring, for a town with a purse. The worm man stays, and does very well, and by the second year he is the only thing the square has ever seen, and the children can name every worm.',
    ],
  },
];
