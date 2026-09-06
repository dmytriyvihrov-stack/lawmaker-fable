/**
 * What the hand is told to do.
 *
 * A ruling that has a scene is not finished when the word is spoken. The card
 * folds down to one line, the pointer becomes a hand, and this is that line:
 * an order, never an explanation, and never a hint about what it will cost.
 * One per answer, keyed `case:choice`.
 *
 * Only the answers the game itself offers are here. A case with no scene is
 * ruled on the way every case used to be.
 */
export const HAND_INSTRUCTIONS: Record<string, string> = {
  /* the fence, and a man who says his back */
  'v1_idle_hand:feed_him': 'Take a loaf from the cart to him.',
  'v1_idle_hand:half_share': 'Cut the loaf. Take half back.',
  'v1_idle_hand:no_work_no_bread': 'Take his loaf back to the cart.',
  'v1_idle_hand:cut_his_share': 'Take it. They are watching.',
  'v1_idle_hand:headman_decides': 'Give him the broken handles.',
  'v1_idle_hand:his_own_field': 'Leave him to his field.',

  /* four buckets a day, and a queue */
  'v2_well:share_thin': 'Pour it along the cups.',
  'v2_well:draw_lots': 'Shake the hat until the pebbles are out.',
  'v2_well:weakest_waits': 'Take her cup to the diggers.',
  'v2_well:diggers_first': 'The bucket goes to the diggers. Take it.',
  'v2_well:headman_drinks_last': 'Put your own cup at the end.',
  'v2_well:sell_the_bucket': 'The bucket to whoever pays for it.',

  /* the north gate, and a child who asked nobody */
  'd1_pies:reward': 'Hang a licence board on her basket.',
  'd1_pies:nothing': 'Underline it.',
  'd1_pies:barred': 'Hold the torch to the basket.',
  'd1_pies:fine_anyway': 'Shake her until nothing else falls out.',
  'd1_pies:toll': 'Take her coin to the desk.',
  'd1_pies:guild': 'Hand her to the Guild.',

  /* the post on the road, and a man who is not from here */
  'v6_road_dead:ours_now': 'Carry him in, to the edge.',
  'v6_road_dead:send_word': 'Give the rider the name from his coat.',
  'v6_road_dead:past_the_boundary': 'Carry him past the marker.',
  'v6_road_dead:the_day_for_him': 'Pin the law to the post.',
  'v6_road_dead:no_house_no_burial': 'Walk away.',
  'v6_road_dead:edge_same_day': 'Him to the edge. His coat to the pile.',
};

/** The strip the instruction sits on, and the way back to the words. */
export const HAND_STRIP = {
  kicker: 'What the hand does',
  putDown: 'Put it down',
};
