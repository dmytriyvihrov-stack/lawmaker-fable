import { UI } from '../../content/ui-strings';
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
/**
 * How many walk out of it, in words.
 *
 * The bill said "-23.8%", which is a tenth of a percent of a person on the one
 * card in the game that has nothing else with a decimal point on it. Nobody can
 * act on the tenth; they can act on "about a quarter".
 */
function soulsInWords(percent: number): string {
  const share = Math.abs(percent);
  const words = UI.winter.shares;
  const idx =
    share < 3 ? 0
      : share < 7 ? 1
        : share < 14 ? 2
          : share < 22 ? 3
            : share < 29 ? 4
              : share < 40 ? 5
                : 6;
  return UI.winter.soulsShare.replace('{share}', words[idx]);
}

export function WinterWarning({ state, onDone }: Props) {
  const bill = winterBill(state);
  const left = yearsToWinter(state.turn);
  /* The mouths are what the store pays for a year that sows nothing and carts
     nothing. They used to be a sentence under the bill holding a number the
     bill was already about; they are inside the store's own figure now. */
  const drain = {
    ...bill.drain,
    economy: Math.round((bill.drain.economy ?? 0) - bill.mouths),
  };

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
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <MovedBoards row plain bare once={drain} place={state} />
            <span className="flex items-baseline gap-1.5 text-[12px]">
              <span aria-hidden>{UI.court.peopleIcon}</span>
              <span className="text-bad">{soulsInWords(bill.soulsPercent)}</span>
            </span>
          </div>
          {bill.weight > 1 && (
            <p className="mt-1.5 text-[11px] leading-snug text-parchment-dim">
              {UI.winter.weight.replace('{n}', String(bill.weight))}
            </p>
          )}
        </div>

        {bill.shelter > 0 && (
          <p className="mt-3 text-[13px] leading-relaxed text-good">
            {UI.winter.shelter.replace('{n}', String(bill.shelter))}
          </p>
        )}
        <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-parchment-dim">
          {UI.winter.dismiss}
        </p>
      </div>
    </button>
  );
}
