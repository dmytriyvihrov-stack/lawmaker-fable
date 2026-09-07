import { useEffect, useState } from 'react';
import { STATS } from '../../content/meta';
import { UI } from '../../content/ui-strings';
import { hasSeenWiring, markWiringSeen } from '../../engine/save';
import { lawNumber } from '../../engine/format';
import type { GameState, LawId } from '../../engine/types';

interface Props {
  /** The state with the decree already sealed into it. */
  state: GameState;
  /** Fires when the moment is over and the year gets on with itself. */
  onDone: () => void;
}

/**
 * The seal coming down, and then the law standing there until it is dismissed.
 * This replaces a whole screen and a click: a decree is not a scene with an
 * outcome, it is a sentence that is now true.
 */
export function SealMoment({ state, onDone }: Props) {
  /* The one moment the game explains itself, and a screen that explains
     itself cannot also take itself away after four seconds. It used to live
     on the aftermath card, which a sealed law never reaches, so nobody ever
     saw it; then it tied to "the first law of this save", so nobody already
     past their first law ever saw it either. It is a fact about the device,
     not the reign: shown once, on whichever law is standing here the first
     time this browser sees this screen, and never again after that. */
  const [teaching] = useState(() => !hasSeenWiring());

  useEffect(() => {
    if (teaching) markWiringSeen();
  }, [teaching]);

  /* No timer. The first law waited for a click and every law after it took
     itself away after four and a half seconds, so the one screen in the game
     that says "click anywhere to carry on" said it once and then stopped
     saying it, and a reader who had learned to wait was interrupted instead.
     One behaviour: it stands until it is dismissed. */

  const law = [...state.laws].reverse().find((l) => l.status === 'active');
  const number = law ? lawNumber(state, `${law.subject}_${law.action}` as LawId) : null;
  const paragraphs = state.lastAftermath?.paragraphs ?? [];

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label={UI.seal.heading}
      className="fixed inset-0 z-50 flex flex-col items-center justify-start overflow-y-auto bg-ink/80 px-5 py-10 backdrop-blur-sm"
    >
      <div className="stamp-flash pointer-events-none fixed inset-0 bg-parchment" />

      <div className={`stamp-seal fixed left-1/2 ${teaching ? 'top-[24%]' : 'top-[38%]'}`}>
        <svg viewBox="0 0 120 120" className="h-32 w-32 opacity-90" aria-hidden>
          <circle cx="60" cy="60" r="52" fill="var(--color-seal)" />
          <circle
            cx="60"
            cy="60"
            r="44"
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth="2"
            opacity="0.5"
          />
          <path
            d="M60 26 L70 50 L96 52 L76 68 L82 94 L60 80 L38 94 L44 68 L24 52 L50 50 Z"
            fill="var(--color-ink)"
            opacity="0.45"
          />
        </svg>
      </div>

      {/* The lecture is four lines taller than the sentence it stands under,
          so on its one showing the whole block starts higher up and the stamp
          moves up out of its way. */}
      <div
        className={`drift-in relative mb-6 w-full max-w-md text-left ${
          teaching ? 'mt-[32vh]' : 'mt-[46vh]'
        }`}
      >
        {/* Its number, and then the sentence. The number is what the rest of
            the reign will call it, and the ceremony line underneath now says
            "it" rather than quoting the whole thing a second time. */}
        <div className="text-[10px] uppercase tracking-[0.2em] text-seal">
          {number ?? UI.seal.reads}
        </div>
        <p className="mt-1 text-[17px] leading-snug tracking-wide text-parchment">
          {law?.label ?? ''}
        </p>

        {/* No list of what it does. The drafting table showed it on the
            predicate a second ago, and the ledger has it for good. */}

        {paragraphs.length > 0 && (
          <div className="mt-3 space-y-2 border-t border-ink-line pt-2">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-[13px] leading-relaxed text-parchment-dim">
                {p}
              </p>
            ))}
          </div>
        )}

        {/* Once, on the first law: the four dials, in the marks they are drawn
            with up in the header, and the one rule about the floor. */}
        {teaching && (
          <div className="mt-4 rounded-md border border-seal/50 bg-seal/10 p-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-seal">
              {UI.wiring.heading}
            </div>
            <ul className="mt-2 space-y-1.5">
              {UI.wiring.boards.map((board) => {
                const meta = STATS.find((s) => s.id === board.stat);
                return (
                  <li key={board.stat} className="flex items-baseline gap-2.5">
                    <span aria-hidden className="w-5 shrink-0 text-[15px] leading-none">
                      {meta?.emoji}
                    </span>
                    <span className="sr-only">{meta?.label}</span>
                    <span className="text-[13px] leading-relaxed text-parchment/90">
                      {board.line}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2.5 border-t border-seal/40 pt-2 text-[13px] leading-relaxed text-bad">
              {UI.wiring.floor}
            </p>
          </div>
        )}

        {/* Always in the window, whatever is above it. The lecture is the one
            thing here tall enough to push the way out below the bottom edge,
            and a screen that explains itself cannot also hide its own door. */}
        <p className="sticky bottom-0 mt-3 border-t border-ink-line bg-ink py-2 text-[11px] uppercase tracking-[0.15em] text-parchment-dim">
          {UI.winter.dismiss}
        </p>
      </div>
    </button>
  );
}
