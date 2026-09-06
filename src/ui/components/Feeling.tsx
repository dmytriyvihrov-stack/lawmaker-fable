import { CONFIG } from '../../engine/config';
import { UI } from '../../content/ui-strings';

interface Props {
  /** 0..100, but nobody is ever shown the number. */
  value: number;
  /**
   * Which way it is drifting, before anything happens this year. Pass it only
   * when nothing else beside this line is already saying so: one gauge gets
   * one arrow, and a caller that prints its own chevrons owns that arrow.
   */
  pull?: number;
  /** What the two ends of the line mean, in words. */
  low: string;
  high: string;
  label: string;
  /** The same line, shorter, for a header row that has to fit under a picture. */
  tight?: boolean;
}

/**
 * A condition, not a quantity.
 *
 * The store is a count: there is grain in it or there is not, it fills and it
 * empties, and a bar that fills is the honest picture of that. Nothing else on
 * the boards works that way. How the square feels about you does not
 * accumulate. Neither does how the crown feels. Neither, it turns out, does
 * health: nobody banks being well, a place is living in good conditions this
 * year or poor ones, and a bar that fills was the wrong picture of it from the
 * start.
 *
 * So those three are drawn the same way: a line that runs from bad on the left
 * to good on the right, with a middle, a marker, and no number anywhere. The
 * colour of the track says which way is up without a legend, which is the
 * whole job of a colour.
 */
export function Feeling({ value, pull = 0, low, high, label, tight }: Props) {
  const pos = Math.max(0, Math.min(100, (value / CONFIG.statMax) * 100));
  const side = value >= 55 ? 'bg-good' : value <= 45 ? 'bg-bad' : 'bg-parchment-dim';

  return (
    <div>
      <div
        className={`relative w-full rounded-full ${tight ? 'h-[5px]' : 'h-2'}`}
        style={{
          // bad on the left, good on the right, so the direction to move in is
          // a fact about the picture and not something to be remembered
          background:
            'linear-gradient(to right, color-mix(in srgb, var(--color-bad) 60%, var(--color-ink-line)), var(--color-ink-line) 48%, var(--color-ink-line) 52%, color-mix(in srgb, var(--color-good) 60%, var(--color-ink-line)))',
        }}
        role="meter"
        aria-valuemin={CONFIG.statMin}
        aria-valuemax={CONFIG.statMax}
        aria-valuenow={value}
        aria-label={label}
        /* The two ends used to be printed under every gauge. Read once they
           explain the line; read forty times they are furniture, and each pair
           cost a line of the header. They live under the pointer now. */
        title={`${label}: ${low} / ${high}`}
      >
        {/* the middle, which is the only tick a feeling needs */}
        <div className="absolute left-1/2 top-[-1px] h-[10px] w-px -translate-x-1/2 bg-parchment-dim/50" />
        <div
          className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[left] duration-700 ${
            tight ? 'h-2 w-2' : 'h-2.5 w-2.5'
          } ${side}`}
          style={{ left: `${pos}%` }}
        />
        {pull !== 0 && (
          <span
            aria-hidden
            className={`absolute top-1/2 -translate-y-1/2 text-[9px] leading-none ${
              pull > 0 ? 'text-good' : 'text-bad'
            }`}
            style={{
              left: `${Math.max(3, Math.min(97, pos + (pull > 0 ? 5 : -5)))}%`,
            }}
          >
            {pull > 0 ? '▸' : '◂'}
          </span>
        )}
      </div>
    </div>
  );
}

/** A move on a feeling, in words. Nobody is told it was minus two. */
export function feelingWord(delta: number): string {
  if (delta === 0) return UI.feeling.holds;
  const size = Math.abs(delta);
  if (delta > 0) {
    return size >= 6 ? UI.feeling.bigUp : size >= 3 ? UI.feeling.up : UI.feeling.slightUp;
  }
  return size >= 6 ? UI.feeling.bigDown : size >= 3 ? UI.feeling.down : UI.feeling.slightDown;
}

/** The same move, at the width of a number column. */
export function feelingArrows(delta: number): string {
  if (delta === 0) return '·';
  const size = Math.abs(delta);
  const n = size >= 6 ? 3 : size >= 3 ? 2 : 1;
  return (delta > 0 ? '▲' : '▼').repeat(n);
}

/**
 * Which boards are conditions rather than counts. The store is the only count
 * in the game: it is the only board where a good year leaves something behind
 * that a bad year can spend.
 */
export const FEELINGS = ['mood', 'crownSanity', 'health'] as const;

export function isFeeling(stat: string): boolean {
  return stat === 'mood' || stat === 'crownSanity' || stat === 'health';
}
