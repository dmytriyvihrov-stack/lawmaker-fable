import { UI } from '../../content/ui-strings';
import { CONFIG } from '../../engine/config';
import { winterBill, yearsToWinter } from '../../engine/simulation';
import type { GameState } from '../../engine/types';
import { MovedBoards } from './MovedBoards';
import { PersonPortrait } from './PersonPortrait';

interface Props {
  state: GameState;
  onDone: () => void;
}

/**
 * Two years out, the Treasurer comes and says it to your face.
 *
 * The long winter was always on the calendar and always announced, in one line
 * of small red text under the header, which is where a reader puts everything
 * they have learned to skip. It is the largest single thing that happens to
 * the place and there are exactly two years left in which anything can be done
 * about it, so it gets a screen of its own, once, with the bill on it as the
 * place stands today.
 *
 * Nothing here is a decision. It closes on a click and does not close on its
 * own: a warning that vanishes while it is being read is not a warning.
 */
export function WinterWarning({ state, onDone }: Props) {
  const bill = winterBill(state);
  const left = yearsToWinter(state.turn);

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label={UI.winter.heading}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/80 px-5 py-8 backdrop-blur-sm"
    >
      <div className="drift-in w-full max-w-md rounded-lg border border-bench bg-ink-soft p-5 text-left shadow-lg">
        <div className="flex items-center gap-3">
          <PersonPortrait character="treasurer" size={56} />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.2em] text-bench">
              {UI.winter.heading}
            </div>
            <h2 className="text-lg leading-tight tracking-wide">
              {UI.winter.title.replace('{n}', String(state.turn + left))}
            </h2>
          </div>
        </div>

        <div className="mt-3 space-y-2.5">
          {UI.winter.lead.map((p, i) => (
            <p key={i} className="text-[14px] leading-relaxed text-parchment/90">
              {p}
            </p>
          ))}
        </div>

        {/* The bill, as the place stands today. Every line of it moves if the
            two years are spent on the right things, which is the point of
            being told now rather than in the first week of the frost. */}
        <div className="mt-3.5 rounded-md border border-dashed border-bench/50 bg-ink/50 p-3">
          <div className="text-[10px] uppercase tracking-[0.18em] text-bench">
            {UI.winter.billLabel}
          </div>
          <MovedBoards
            className="mt-1.5"
            once={bill.drain}
            souls={bill.soulsPercent}
            place={state}
          />
          {bill.mouths > 0 && (
            <p className="mt-1.5 text-[11px] leading-snug text-parchment-dim">
              {UI.winter.mouths.replace('{n}', String(bill.mouths))}
            </p>
          )}
          {bill.weight > 1 && (
            <p className="mt-1 text-[11px] leading-snug text-parchment-dim">
              {UI.winter.weight.replace('{n}', String(bill.weight))}
            </p>
          )}
          {bill.shelter > 0 && (
            <p className="mt-1 text-[11px] leading-snug text-good">
              {UI.winter.shelter.replace('{n}', String(bill.shelter))}
            </p>
          )}
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-bench">
          {UI.winter.advice.replace('{n}', String(CONFIG.winter.every))}
        </p>
        <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-parchment-dim">
          {UI.winter.dismiss}
        </p>
      </div>
    </button>
  );
}
