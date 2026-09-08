import { useState } from 'react';
import { STATS } from '../../content/meta';
import { UI } from '../../content/ui-strings';
import { dialCeiling, dialValue, type DialId } from '../../engine/dev';
import { points } from '../../engine/format';
import { isActiveStat } from '../../engine/simulation';
import type { GameState, Stage, StatId } from '../../engine/types';

/**
 * The panel that drops out of the dev strip: every number in the reign with a
 * hand on it, and the three reigns you can be standing in a second from now.
 *
 * Two jobs, one panel, because they are the same job. The question is always
 * "what does this look like when-", and the answer used to be either eleven
 * years of play or a reload with a different query string on the end of it.
 * The dials answer it for a board, a count and the calendar; the jump answers
 * it for a whole stage.
 *
 * Nothing here invents a rule. A board moves through `bump` like every other
 * board (see `engine/dev.ts`), so it stops where the engine stops it and the
 * Codex can still say what moved it; a board the place has not opened yet is
 * refused, and offered instead. The jump is `beginAt`, which is the same
 * fixture the title screen and `?chapter=` have always opened.
 */

const CHAPTERS: Stage[] = ['village', 'town', 'kingdom'];

/** How far one press moves a dial. Ten is a board's worth of a bad year. */
const STEPS = [1, 5, 10];

function Dial({
  label,
  title,
  value,
  step,
  onTurn,
  hint,
}: {
  label: string;
  title?: string;
  value: string;
  step: number;
  onTurn: (delta: number) => void;
  hint?: string;
}) {
  return (
    <div
      title={title}
      className="flex items-center gap-1 rounded-sm border border-ink-line bg-ink-soft px-1.5 py-1"
    >
      <span className="min-w-0 flex-1 truncate text-[10px] lowercase tracking-wide text-parchment-dim">
        {label}
      </span>
      <span className="tabular-nums text-[11px] text-parchment">{value}</span>
      {hint && <span className="text-[9px] lowercase text-parchment-dim/60">{hint}</span>}
      <button
        type="button"
        onClick={() => onTurn(-step)}
        aria-label={`${label} down`}
        className="rounded-sm border border-ink-line px-1 text-[11px] leading-none text-parchment-dim hover:border-seal hover:text-seal"
      >
        −
      </button>
      <button
        type="button"
        onClick={() => onTurn(step)}
        aria-label={`${label} up`}
        className="rounded-sm border border-ink-line px-1 text-[11px] leading-none text-parchment-dim hover:border-seal hover:text-seal"
      >
        +
      </button>
    </div>
  );
}

export function DevDials({
  state,
  onTurn,
  onOpenBoard,
  onBeginAt,
}: {
  state: GameState;
  onTurn: (dial: DialId, delta: number) => void;
  onOpenBoard: (board: StatId) => void;
  /** Absent on a bench that has no reign to leave: the row simply is not there. */
  onBeginAt?: (chapter: Stage, samePlace: boolean) => void;
}) {
  const [step, setStep] = useState(STEPS[0]);
  const [samePlace, setSamePlace] = useState(true);
  /* No `window.confirm`: the preview pane answers it false, which is how the
     one button on this panel that throws a reign away would have done nothing
     at all in the place it is most used. It asks in the button instead. */
  const [asking, setAsking] = useState<Stage | null>(null);

  const counts: [DialId, string, string | undefined][] = [
    ['population', UI.dev.souls, undefined],
    ['research', UI.dev.potDial, undefined],
    ['turn', UI.dev.yearDial, UI.dev.yearHint],
  ];

  return (
    <div className="absolute left-0 right-0 top-full z-40 mt-1 rounded-sm border border-seal/50 bg-ink/95 p-2 shadow-lg backdrop-blur">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-[9px] uppercase tracking-[0.18em] text-seal">
          {UI.dev.dialsHeading}
        </span>
        <span className="ml-auto flex items-center gap-1" title={UI.dev.stepHint}>
          <span className="text-[9px] lowercase tracking-wide text-parchment-dim">
            {UI.dev.step}
          </span>
          {STEPS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setStep(n)}
              aria-pressed={step === n}
              className={`rounded-sm border px-1 text-[10px] leading-tight tabular-nums ${
                step === n ? 'border-seal text-seal' : 'border-ink-line text-parchment-dim'
              }`}
            >
              {n}
            </button>
          ))}
        </span>
      </div>

      {/* the six boards, and the two a hamlet has not decided on yet */}
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
        {STATS.map((stat) => {
          const open = isActiveStat(state, stat.id);
          const ceiling = dialCeiling(state, stat.id);
          const lidded = ceiling !== null && ceiling < 100;
          if (!open) {
            return (
              <div
                key={stat.id}
                className="flex items-center gap-1 rounded-sm border border-ink-line bg-ink-soft/50 px-1.5 py-1"
              >
                <span className="min-w-0 flex-1 truncate text-[10px] lowercase tracking-wide text-parchment-dim/60">
                  {stat.emoji} {stat.label}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenBoard(stat.id)}
                  title={UI.dev.openBoardHint}
                  className="rounded-sm border border-ink-line px-1 text-[9px] lowercase text-parchment-dim hover:border-seal hover:text-seal"
                >
                  {UI.dev.openBoard}
                </button>
              </div>
            );
          }
          return (
            <Dial
              key={stat.id}
              label={`${stat.emoji} ${stat.label}`}
              title={lidded ? UI.dev.lidHint : UI.stats[stat.id]}
              value={points(dialValue(state, stat.id))}
              hint={lidded ? `${UI.dev.lid} ${Math.round(ceiling)}` : undefined}
              step={step}
              onTurn={(delta) => onTurn(stat.id, delta)}
            />
          );
        })}
      </div>

      {/* the three that are counts rather than feelings */}
      <div className="mt-1 grid grid-cols-2 gap-1 sm:grid-cols-3">
        {counts.map(([dial, label, hint]) => (
          <Dial
            key={dial}
            label={label}
            title={hint}
            value={String(dialValue(state, dial))}
            step={step}
            onTurn={(delta) => onTurn(dial, delta)}
          />
        ))}
      </div>

      {/* and the whole reign, one stage at a time */}
      {onBeginAt && (
      <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-ink-line pt-2">
        <span className="text-[9px] uppercase tracking-[0.18em] text-seal" title={UI.dev.statesHint}>
          {UI.dev.statesHeading}
        </span>
        {CHAPTERS.map((chapter) => (
          <button
            key={chapter}
            type="button"
            title={UI.dev.statesHint}
            onClick={() => {
              if (asking === chapter) {
                setAsking(null);
                onBeginAt(chapter, samePlace);
              } else {
                setAsking(chapter);
              }
            }}
            onBlur={() => setAsking((now) => (now === chapter ? null : now))}
            className={`rounded-sm border px-1.5 py-0.5 text-[10px] lowercase tracking-wide ${
              asking === chapter
                ? 'border-bad text-bad'
                : state.stage === chapter
                  ? 'border-seal text-seal'
                  : 'border-ink-line text-parchment-dim hover:border-seal hover:text-seal'
            }`}
          >
            {asking === chapter ? UI.dev.sure : UI.world.chapters[chapter]}
          </button>
        ))}
        <label
          title={UI.dev.samePlaceHint}
          className={`ml-auto flex cursor-pointer items-center gap-1 text-[10px] lowercase tracking-wide ${
            samePlace ? 'text-seal' : 'text-parchment-dim'
          }`}
        >
          <input
            type="checkbox"
            checked={samePlace}
            onChange={() => setSamePlace((v) => !v)}
          />
          {UI.dev.samePlace}
        </label>
      </div>
      )}
    </div>
  );
}
