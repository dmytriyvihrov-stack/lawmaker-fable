import type { ReactNode, Ref } from 'react';
import { TYPE } from '../type';

interface Props {
  /**
   * What kind of thing this is. A scene is somebody standing in front of you,
   * in the colour of the bench; a document is a law being written, in the
   * colour of the seal. Nothing else uses the card.
   */
  tone: 'bench' | 'seal';
  /**
   * Where the thread from the town lands on the top edge, in pixels from the
   * left of the card. Null when the thing on the card is not about a place.
   */
  tailX?: number | null;
  /** A scene is wide and low; a document is narrower and taller. */
  wide?: boolean;
  /**
   * This card has no scene under it, so it may take the height.
   *
   * The cap exists to keep the town visible above the card, and on the two
   * screens that are a shelf of things to read - the year of work and the
   * drafting table - what is above the card is scenery, while what is inside
   * it is three hundred pixels of list nobody can see without scrolling. On
   * the bench it is the opposite: somebody is standing up there in a scene
   * the answers act on, and every pixel the card takes is taken off them.
   *
   * 48, and it has been 42 and 54. This is a trade with two ends and one
   * number in it: every point of height is a point of scroll saved and a
   * point of town covered, and the small thing a year puts on the map sits
   * between map y 350 and 604, which is the near meadow the card lives over.
   *
   * 42 was the old cap and the year of work scrolled 305 pixels at it. 54 cut
   * that to 161 and covered the settlement band with it, which is the whole
   * of what a player is deciding about. What moved the trade was the shelf
   * going three across instead of two: the same eight works are three rows
   * now rather than four, so 48 scrolls 204 - still better than 54 managed at
   * two columns - and hands back 43 pixels of town. Measured on a 720 window
   * with a village shelf and the run below it.
   */
  tall?: boolean;
  cardRef?: Ref<HTMLDivElement>;
  children: ReactNode;
}

const EDGE = { bench: 'var(--color-bench)', seal: 'var(--color-seal)' };

/**
 * The one button that ends a card: its size, spacing and manners, without its
 * colour, which belongs to the screen.
 *
 * Four screens end in one of these and all four had written their own,
 * which is how they arrived at three type sizes and two corner radii between
 * them. It is centred and as wide as its own words: full width made a slab
 * of paint the width of the card, which reads as the floor of the card and
 * not as a thing to press.
 */
export const CARD_BUTTON =
  'min-h-[44px] max-w-full rounded-lg px-9 py-2 text-[16px] tracking-[0.2em] disabled:opacity-30';

/**
 * The card that opens over the town.
 *
 * It is not a panel: it appears, takes the screen, and goes away again, which
 * is what makes a decision an event rather than a form. It never touches an
 * edge, it has a shadow under it and a thin line of its own colour round it,
 * and the town is visible around it rather than only above it.
 *
 * It is also capped. The settlement sits in the middle of the picture and the
 * card comes up from the bottom, so a card that grows with its own text
 * eventually parks itself on top of the very place it is pointing at. Past the
 * cap the card scrolls and the town stays visible, which is the right way
 * round.
 */
export function Popup({ tone, tailX = null, wide = false, tall = false, cardRef, children }: Props) {
  const edge = EDGE[tone];
  return (
    <div
      ref={cardRef}
      className={`pointer-events-auto relative w-full ${wide ? 'max-w-[1140px]' : 'max-w-[920px]'}`}
    >
      {/* the point of the thread, sitting on the edge it came down to */}
      {tailX !== null && (
        <span
          aria-hidden
          className="absolute -top-[6px] z-10 block h-3 w-3 rotate-45 border-l border-t bg-ink-soft"
          style={{ left: `${tailX - 6}px`, borderColor: edge }}
        />
      )}
      {/* Square along the bottom, because that edge is the edge of the
          window now rather than a margin of meadow nobody was looking at.
          The twenty pixels under it were the one part of this screen that
          could never hold anything. */}
      <div
        className={`decision-paper overflow-y-auto rounded-t-2xl border border-b-0 bg-ink-soft/95 shadow-[0_20px_44px_rgba(0,0,0,0.5)] backdrop-blur-[2px] ${
          tall ? 'max-h-[48dvh]' : 'max-h-[44dvh]'
        }`}
        style={{ borderColor: edge }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * The bottom edge of a card, with the one button that ends the screen on it.
 *
 * The card is capped at 42dvh and scrolls, and every one of these buttons used
 * to be the last thing inside it. On a 1440x900 window that put SEAL IT at
 * y=931, PRONOUNCE IT at y=1089 and Continue at y=916: below the window, with
 * nothing to say so, so the way to finish the screen was to guess that the card
 * scrolled. The year of work already solved this; the other three do it the
 * same way now.
 *
 * The parent has to be the padded block inside the card (`p-4` or `p-5`), and
 * the negative margins here are matched to it, so the bar reaches the paper's
 * own edges.
 */
export function CardFoot({
  pad = 4,
  children,
}: {
  /** The padding of the block this sits in, so the bar can cancel it. */
  pad?: 4 | 5;
  children: ReactNode;
}) {
  const cancel = pad === 5 ? '-mx-5 -mb-5 px-5 pb-3' : '-mx-4 -mb-4 px-4 pb-3';
  return (
    /* Centred, and the button inside is the width of what it says. A bar of
       colour the whole width of the card reads as the card's own floor
       rather than as one thing to press, and on a wide window it was eight
       hundred pixels of paint carrying three words. */
    <div
      className={`sticky z-10 mt-3 flex justify-center border-t border-ink-line/60 bg-ink-soft/95 pt-2 backdrop-blur-[2px] [bottom:0] ${cancel}`}
    >
      {children}
    </div>
  );
}

/**
 * The head of a card: a band in its own colour, with what this is and when it
 * is happening written across it, and the mark on the corner so you can see
 * what it ends in before you start.
 *
 * Two marks, because there are two kinds of year in this game and they should
 * not feel like one thing. A law ends in wax: the seal, in the seal's red. A
 * year of work ends in a building, so it gets a hammer on a timber disc, and
 * the whole band goes the colour of sawn wood. Nothing about the card changes
 * except how it feels to open, which is the entire point of it.
 */
export function PopupHead({
  kicker,
  note,
  wax = true,
  mark = 'seal',
}: {
  kicker: string;
  /** One short line under the kicker: the rule of this screen, said once. */
  note?: string;
  wax?: boolean;
  mark?: 'seal' | 'hammer';
}) {
  const timber = mark === 'hammer';
  return (
    <div
      className={`relative border-b px-5 py-2.5 ${
        timber ? 'border-timber/50 bg-timber/[0.12]' : 'border-seal/50 bg-seal/[0.14]'
      }`}
    >
      <div className={`${TYPE.label} text-parchment`}>{kicker}</div>
      {note !== undefined && (
        <div className={`mt-0.5 ${TYPE.note} leading-snug text-parchment-dim`}>{note}</div>
      )}
      {wax && (
        <span aria-hidden className="absolute -top-1 right-5">
          <svg viewBox="-30 -30 60 60" width="40" height="40">
            {timber ? (
              <>
                <circle r="26" fill="var(--color-timber)" />
                <circle r="22" fill="none" stroke="var(--color-ink)" strokeWidth="1" opacity=".5" />
                {/* a hammer, head down, the way it is left on the bench */}
                <g
                  fill="none"
                  stroke="var(--color-ink)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity=".55"
                >
                  <path d="M2 -12 L-4 14" />
                </g>
                <path
                  d="M-12 -16 h20 a3 3 0 0 1 3 3 v7 a3 3 0 0 1 -3 3 h-20 l4 -6.5 z"
                  fill="var(--color-ink)"
                  opacity=".55"
                />
              </>
            ) : (
              <>
                <circle r="26" fill="var(--color-seal)" />
                <circle r="22" fill="none" stroke="var(--color-ink)" strokeWidth="1" opacity=".5" />
                <path
                  d="M0 -17 L5 -5 L18 -4 L8 4 L11 17 L0 10 L-11 17 L-8 4 L-18 -4 L-5 -5 Z"
                  fill="var(--color-ink)"
                  opacity=".45"
                />
              </>
            )}
          </svg>
        </span>
      )}
    </div>
  );
}
