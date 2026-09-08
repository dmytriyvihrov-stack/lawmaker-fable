import { useEffect } from 'react';

import { UI } from '../../content/ui-strings';
import { TYPE } from '../type';

interface Props {
  /** Where the thing itself is, on the screen the town is drawn on. */
  left: number;
  top: number;
  /** Fires once, when it is actually on the screen and has therefore been said. */
  onShown: () => void;
}

/**
 * What the small things on the map are, said once, over the first one.
 *
 * Not a card, and this is the whole design of it. The note at the top of
 * `content/moments.ts` records what a card did here: a paragraph floating on
 * the meadow made the smallest thing in the game the loudest thing on the
 * screen, for a minute that costs the reign nothing. A player who is told
 * about a dog in a full screen lecture has been told the dog matters, which
 * is the one thing about it that is not true.
 *
 * So it is a tag beside the thing, in the shape of the receipt that appears
 * after one is taken, and it says the three facts that are the whole of the
 * mechanic: free, worth a point, gone when the year turns.
 *
 * It takes no pointer events at all. The thing underneath is a click target
 * standing on the ground, and anything drawn over the map that can be clicked
 * takes clicks meant for what is under it. This one cannot be dismissed and
 * does not need to be: taking the thing, or the year turning, is what ends it.
 */
export function SmallThingNote({ left, top, onShown }: Props) {
  /* Said when it is on the screen, not when the state that would show it is
     worked out: the map is pokeable in plenty of frames where this is behind a
     card, and a note written down as read on one of those is a note the player
     never got. Mounting is the only moment that means it was drawn. */
  useEffect(() => {
    onShown();
    // once per showing, on purpose: it is a latch and not a subscription
  }, []);

  return (
    <div
      className="moment-note pointer-events-none absolute z-20 w-[230px] -translate-x-1/2 -translate-y-full"
      style={{ left, top }}
    >
      {/* The animation is on the inner box and the position on the outer one.
          A keyframe that touches `transform` replaces whatever transform the
          element already carries, and the whole of this thing's placement is
          two translates: put the two on one element and the note draws itself
          at the map's origin for half a second on the way in. */}
      <div className="drift-in rounded-md border border-seal/40 bg-ink/95 px-3 py-2 shadow-lg">
        <div className={`${TYPE.label} text-seal`}>{UI.smallThing.heading}</div>
        <p className={`mt-1 ${TYPE.note} leading-relaxed text-parchment-dim`}>
          {UI.smallThing.line}
        </p>
      </div>

      {/* A corner of the box, turned, hanging off its bottom edge and pointing
          at the thing. Without it the note is a paragraph in the sky: the
          things this is about are eight units across and faintly lit, and a
          reader who cannot see which one is meant has been told there is
          something to find and not what. This is the game's own thread from a
          card to a spot, at the only size this note can afford. */}
      <div
        aria-hidden
        className="drift-in absolute left-1/2 top-full h-[9px] w-[9px] -translate-x-1/2 -translate-y-[5px] rotate-45 border-b border-r border-seal/40 bg-ink"
      />
    </div>
  );
}
