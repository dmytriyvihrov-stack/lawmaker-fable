/**
 * What the hand does for each answer, once the tile has been chosen.
 *
 * Six kinds of gesture cover all eighteen answers. `item`, `to` and `target`
 * name things inside the near scene of the case (scenes.ts); the scene, not
 * the act, decides how the picture reacts to each step.
 *
 * `resist` is what the other person does about it. Nothing kind resists:
 * a loaf carried to a man arrives. A loaf taken off him is in his hand, a
 * child does not stand still to be burned or walked to the Guild, and a
 * body is heavy and does not care what you meant to do with it.
 */
export type Tool = 'hand' | 'knife' | 'torch' | 'stick' | 'bucket' | null;

export type Resist =
  /** In somebody's fist: it stretches this far, and comes loose after so many yanks. */
  | { kind: 'held'; pulls: number; slack?: number }
  /**
   * Somebody who is not going. `back` is how fast they take the ground back
   * when the hand stops, in units a second; `leash` is the slack in the arm,
   * which has to be taken up before they move at all.
   */
  | { kind: 'drag'; back?: number; leash?: number }
  /** Dead weight: it lags, it strains the grip, and it goes down where it slips. */
  | { kind: 'heavy' };

export interface CarryStep {
  item: string;
  to: string;
  resist?: Resist;
}

export type ActDef =
  | { kind: 'carry'; tool: Tool; steps: CarryStep[]; then?: ActDef }
  | { kind: 'stroke'; tool: Tool; target: string; axis: 'x' | 'y'; then?: ActDef }
  | { kind: 'shake'; tool: Tool; target: string; count: number; spill: string[]; then?: ActDef }
  | { kind: 'hold'; tool: Tool; target: string; seconds: number; then?: ActDef }
  | { kind: 'taps'; tool: Tool; target: string; count: number; then?: ActDef }
  | { kind: 'turn_away'; tool: Tool; target: string; then?: ActDef };

const HELD = { kind: 'held', pulls: 3 } as const;
const HEAVY = { kind: 'heavy' } as const;

export const ACTS: Record<string, ActDef> = {
  /* his own loaf is in his own hand in every one of these */
  'v1_idle_hand:feed_him': { kind: 'carry', tool: 'hand', steps: [{ item: 'loafCart', to: 'tam' }] },
  'v1_idle_hand:half_share': {
    kind: 'stroke',
    tool: 'knife',
    target: 'loaf',
    axis: 'y',
    // he agreed to half, so the half comes away without a fight
    then: { kind: 'carry', tool: 'hand', steps: [{ item: 'half', to: 'cart' }] },
  },
  'v1_idle_hand:no_work_no_bread': {
    kind: 'carry',
    tool: 'hand',
    steps: [{ item: 'loaf', to: 'cart', resist: HELD }],
  },
  'v1_idle_hand:cut_his_share': {
    kind: 'carry',
    tool: 'hand',
    steps: [{ item: 'loaf', to: 'cart', resist: HELD }],
  },
  'v1_idle_hand:headman_decides': { kind: 'carry', tool: 'hand', steps: [{ item: 'handles', to: 'tam' }] },
  'v1_idle_hand:his_own_field': { kind: 'turn_away', tool: null, target: 'tam' },

  /* the well: four buckets a day, more mouths than that */
  'v2_well:share_thin': { kind: 'stroke', tool: 'bucket', target: 'cups', axis: 'x' },
  'v2_well:draw_lots': {
    kind: 'shake',
    tool: 'hand',
    target: 'hat',
    count: 3,
    spill: ['pebble', 'pebble', 'pebble'],
  },
  'v2_well:weakest_waits': {
    kind: 'carry',
    tool: 'hand',
    steps: [{ item: 'cup', to: 'diggers', resist: { kind: 'held', pulls: 2 } }],
  },
  'v2_well:diggers_first': {
    kind: 'carry',
    tool: 'hand',
    steps: [{ item: 'bucket', to: 'diggers', resist: { kind: 'held', pulls: 2 } }],
  },
  'v2_well:headman_drinks_last': {
    kind: 'carry',
    tool: 'hand',
    steps: [{ item: 'crownCup', to: 'queueEnd' }],
  },
  'v2_well:sell_the_bucket': { kind: 'carry', tool: 'hand', steps: [{ item: 'bucket', to: 'buyer' }] },

  'd1_pies:reward': { kind: 'carry', tool: 'hand', steps: [{ item: 'board', to: 'basket' }] },
  'd1_pies:nothing': { kind: 'stroke', tool: 'hand', target: 'slate', axis: 'x' },
  /* she takes the basket and bolts; the scene does the running */
  'd1_pies:barred': { kind: 'hold', tool: 'torch', target: 'basket', seconds: 2.5 },
  'd1_pies:fine_anyway': {
    kind: 'shake',
    tool: 'hand',
    target: 'iva',
    count: 5,
    spill: ['coin', 'coin', 'coin', 'pie', 'pie'],
  },
  'd1_pies:toll': { kind: 'carry', tool: 'hand', steps: [{ item: 'coin', to: 'desk' }] },
  'd1_pies:guild': {
    kind: 'carry',
    tool: 'hand',
    steps: [{ item: 'iva', to: 'guild', resist: { kind: 'drag', back: 30 } }],
  },

  'v6_road_dead:ours_now': { kind: 'carry', tool: 'hand', steps: [{ item: 'man', to: 'edge', resist: HEAVY }] },
  'v6_road_dead:send_word': { kind: 'carry', tool: 'hand', steps: [{ item: 'tag', to: 'rider' }] },
  'v6_road_dead:past_the_boundary': {
    kind: 'carry',
    tool: 'hand',
    steps: [{ item: 'man', to: 'stone', resist: HEAVY }],
  },
  'v6_road_dead:the_day_for_him': { kind: 'carry', tool: 'hand', steps: [{ item: 'law', to: 'post' }] },
  'v6_road_dead:no_house_no_burial': { kind: 'turn_away', tool: null, target: 'man' },
  'v6_road_dead:edge_same_day': {
    kind: 'carry',
    tool: 'hand',
    steps: [
      { item: 'man', to: 'edge', resist: HEAVY },
      { item: 'coat', to: 'pile' },
    ],
  },
};

export function actFor(caseId: string, choiceId: string): ActDef | undefined {
  return ACTS[`${caseId}:${choiceId}`];
}

/** How this answer pushes back, for the dev list of acts. */
export function resistOf(act: ActDef | undefined): string | null {
  if (!act) return null;
  if (act.kind === 'carry') return act.steps.find((s) => s.resist)?.resist?.kind ?? null;
  return null;
}
