/**
 * The bench's own chrome. Nothing here is game text: the instructions the
 * hand is given live in `src/content/hand.ts`, with the rest of the writing.
 */
export const DEV = {
  title: 'MINIGAMES',
  reset: 'Reset',
  acts: 'All acts',
  every: 'every answer',
  law: { work: 'work', trade: 'trade', dead: 'the dead' },
  /* what the thing on the other end of the hand is doing about it */
  resist: {
    held: 'he holds on',
    drag: 'she pulls back',
    heavy: 'it slips',
  } as Record<string, string>,
};
