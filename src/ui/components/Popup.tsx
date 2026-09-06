import type { ReactNode, Ref } from 'react';

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
  cardRef?: Ref<HTMLDivElement>;
  children: ReactNode;
}

const EDGE = { bench: 'var(--color-bench)', seal: 'var(--color-seal)' };

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
export function Popup({ tone, tailX = null, wide = false, cardRef, children }: Props) {
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
      <div
        className="decision-paper max-h-[42dvh] overflow-y-auto rounded-2xl border bg-ink-soft/95 shadow-[0_20px_44px_rgba(0,0,0,0.5)] backdrop-blur-[2px]"
        style={{ borderColor: edge }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * The head of a document: a band in the colour of the seal, with what this is
 * and when it is happening written across it, and the wax on the corner so you
 * can see what it ends in before you start.
 */
export function PopupHead({ kicker, wax = true }: { kicker: string; wax?: boolean }) {
  return (
    <div className="relative border-b border-seal/50 bg-seal/[0.14] px-5 py-2.5">
      <div className="text-[10px] uppercase tracking-[0.2em] text-parchment">{kicker}</div>
      {wax && (
        <span aria-hidden className="absolute -top-1 right-5">
          <svg viewBox="-30 -30 60 60" width="40" height="40">
            <circle r="26" fill="var(--color-seal)" />
            <circle r="22" fill="none" stroke="var(--color-ink)" strokeWidth="1" opacity=".5" />
            <path
              d="M0 -17 L5 -5 L18 -4 L8 4 L11 17 L0 10 L-11 17 L-8 4 L-18 -4 L-5 -5 Z"
              fill="var(--color-ink)"
              opacity=".45"
            />
          </svg>
        </span>
      )}
    </div>
  );
}
