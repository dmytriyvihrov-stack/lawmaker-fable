import { useState } from 'react';
import { STATS } from '../../content/meta';
import { UI } from '../../content/ui-strings';
import { allWorks } from '../../engine/registry';
import type { GameState, StatId } from '../../engine/types';

interface Props {
  state: GameState;
  /** What is on offer. Two of them is a choice; one of them is a formality. */
  offer: StatId[];
  onTake: (board: StatId) => void;
}

function metaOf(board: StatId) {
  return STATS.find((s) => s.id === board)!;
}

function copyFor(board: StatId): { name: string; line: string } {
  return board === 'army'
    ? { name: UI.boards.army, line: UI.boards.armyLine }
    : { name: UI.boards.culture, line: UI.boards.cultureLine };
}

/**
 * The two rungs of the growth ladder that are decisions.
 *
 * Everything else the count opens simply arrives. These two do not: a place of
 * thirty can spare exactly one pair of hands from the field, and which pair it
 * is decides whether this settlement becomes a thing with a gate or a thing
 * with a bell first. The other one comes later, and arriving late is a fact
 * about the place that outlives the reign.
 */
export function BoardChoice({ state, offer, onTake }: Props) {
  const [picked, setPicked] = useState<StatId | null>(offer.length === 1 ? offer[0] : null);
  const choosing = offer.length > 1;

  return (
    <div
      role="dialog"
      aria-label={UI.boards.heading}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/80 px-5 py-8 backdrop-blur-sm"
    >
      <div className="drift-in w-full max-w-md rounded-lg border border-seal bg-ink-soft p-5">
        <div className="text-[10px] uppercase tracking-[0.2em] text-seal">
          {UI.boards.kicker.replace('{n}', String(state.population))}
        </div>
        <h2 className="mt-1 text-lg leading-tight tracking-wide">
          {choosing ? UI.boards.heading : UI.boards.second}
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-parchment/90">
          {choosing ? UI.boards.lead : UI.boards.secondLead}
        </p>

        <div className="mt-4 space-y-2">
          {offer.map((board) => {
            const copy = copyFor(board);
            const on = picked === board;
            // the building that comes with it, so the choice is a thing you can
            // then spend a year on and not only a new line on the header
            const work = allWorks().find((w) => w.needsBoard === board);
            return (
              <button
                key={board}
                type="button"
                onClick={() => setPicked(board)}
                className={`w-full rounded-lg border p-3 text-left ${
                  on ? 'border-seal bg-seal/15' : 'border-ink-line bg-ink/50'
                }`}
              >
                <div className="flex items-baseline gap-2">
                  <span aria-hidden className="text-[15px] leading-none">
                    {metaOf(board).emoji}
                  </span>
                  <span className="text-[14px] leading-tight">{copy.name}</span>
                </div>
                <p className="mt-1.5 text-[12px] leading-snug text-parchment-dim">{copy.line}</p>
                {work && (
                  <p className="mt-1.5 text-[11px] leading-snug text-seal/85">
                    {UI.boards.opens}: {work.name}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={picked === null}
          onClick={() => picked && onTake(picked)}
          className="mt-4 min-h-[44px] w-full rounded-md border border-seal bg-seal/20 text-[14px] tracking-[0.15em] text-parchment disabled:border-ink-line disabled:bg-transparent disabled:text-parchment-dim"
        >
          {UI.boards.take}
        </button>
        {choosing && picked === null && (
          <p className="mt-2 text-[12px] leading-snug text-parchment-dim">{UI.boards.choose}</p>
        )}
      </div>
    </div>
  );
}
