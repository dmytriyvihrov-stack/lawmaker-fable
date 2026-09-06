import { useEffect, useState } from 'react';
import { STATS } from '../../content/meta';
import { UI } from '../../content/ui-strings';
import { findLawOption } from '../../engine/registry';
import { hasSeenWiring, markWiringSeen } from '../../engine/save';
import { lawTrend } from '../../engine/simulation';
import type { GameState } from '../../engine/types';
import { MovedBoards } from './MovedBoards';

interface Props {
  /** The state with the decree already sealed into it. */
  state: GameState;
  /** Fires when the moment is over and the year gets on with itself. */
  onDone: () => void;
}

/**
 * Long enough to read the sentence twice, which is the whole point of it.
 *
 * Three seconds was long enough to read it once and then be interrupted, and
 * there are two lists of numbers under the sentence to read as well. Nothing
 * is waiting on this: the whole overlay is a button, so anybody who has
 * finished reading is one click from the rest of the year.
 */
const HOLD_MS = 4800;

function reducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * The seal coming down, and then the law standing there for three seconds with
 * what it does written under it. This replaces a whole screen and a click: a
 * decree is not a scene with an outcome, it is a sentence that is now true.
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

  useEffect(() => {
    if (teaching) return;
    const delay = reducedMotion() ? 0 : HOLD_MS;
    const id = window.setTimeout(onDone, delay);
    return () => window.clearTimeout(id);
  }, [onDone, teaching]);

  const law = [...state.laws].reverse().find((l) => l.status === 'active');
  const option = law ? findLawOption(law.subject, law.action, law.label) : undefined;
  const paragraphs = state.lastAftermath?.paragraphs ?? [];

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label={UI.seal.heading}
      className="fixed inset-0 z-50 flex flex-col items-center justify-start overflow-y-auto bg-ink/80 px-5 py-10 backdrop-blur-sm"
    >
      <div className="stamp-flash pointer-events-none fixed inset-0 bg-parchment" />

      <div className="stamp-seal fixed left-1/2 top-[38%]">
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

      <div className="drift-in relative mt-[46vh] w-full max-w-md text-left">
        <div className="text-[10px] uppercase tracking-[0.2em] text-parchment-dim">
          {UI.seal.reads}
        </div>
        <p className="mt-1 text-[17px] leading-snug tracking-wide text-parchment">
          {law?.label ?? ''}
        </p>

        {/* The same shape the drafting table used to promise it, three seconds
            ago. Two lists in two hands is how a law came to say "dips a little"
            while it was being written and "-2" the moment it was true. */}
        <div className="mt-3 border-t border-ink-line pt-2">
          <div className="text-[10px] uppercase tracking-[0.2em] text-parchment-dim">
            {UI.seal.andSo}
          </div>
          <MovedBoards
            className="mt-1.5"
            once={state.lastAftermath?.deltas}
            every={option ? lawTrend(state, option) : undefined}
            place={state}
          />
        </div>

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
            <p className="mt-1.5 text-[13px] leading-relaxed text-parchment/90">
              {UI.wiring.lead}
            </p>
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
            <p className="mt-2 text-[11px] uppercase tracking-[0.15em] text-parchment-dim">
              {UI.winter.dismiss}
            </p>
          </div>
        )}
      </div>
    </button>
  );
}
