import { useState } from 'react';
import { STATS } from '../../content/meta';
import { UI } from '../../content/ui-strings';
import { CONFIG } from '../../engine/config';
import type { DialId } from '../../engine/dev';
import { movePoints } from '../../engine/format';
import { keepsWatch, lawWeight, nextTech, yearlyChange } from '../../engine/simulation';
import type { Effects, GameState, Stage, StatId } from '../../engine/types';
import { buildId } from '../motion';
import { DevDials } from './DevDials';

const signed = movePoints;

/**
 * The build this tab is actually running, so a shared link can be checked
 * against it instead of trusted on faith. Always on, not tied to dev mode:
 * the player standing on a stale pinned link needs it more than anyone.
 *
 * It takes no clicks. On a phone the card comes up the full width of the
 * window and this sat on top of its one button, faint grey lettering across
 * PRONOUNCE IT, catching thumbs that were aimed at the answer.
 */
export function BuildBadge() {
  const build = buildId();
  return (
    <div
      data-dev-chrome
      title={build}
      className="ruler-corner-chip pointer-events-none fixed bottom-20 right-2 z-40 rounded px-1.5 py-0.5 text-[10px] lowercase tracking-[0.2em] text-parchment-dim opacity-15 hover:opacity-60"
    >
      build {build}
    </div>
  );
}

/**
 * The switch in the corner. Barely there, because it is not for the player: it
 * is for whoever is standing behind the player asking why that number did that.
 */
export function DevToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      data-dev-chrome
      onClick={onToggle}
      aria-pressed={on}
      title={UI.dev.on}
      className={`ruler-corner-chip fixed bottom-2 right-2 z-40 rounded px-1.5 py-0.5 text-[10px] lowercase tracking-[0.2em] transition-opacity ${
        on
          ? 'border border-seal text-seal opacity-90'
          : 'text-parchment-dim opacity-15 hover:opacity-60'
      }`}
    >
      {UI.dev.label}
    </button>
  );
}

/**
 * The arithmetic behind the reign, in one strip, while the switch is on, and
 * the two switches that belong to the strip rather than to the reign.
 *
 * `editText` puts a pencil on every line in the game (see `TextEditLayer`);
 * `onWipe` throws away everything this browser has written down and opens a
 * fresh reign, which is the thing a playtester wanted most and had to do by
 * hand in the console, because the preview pane eats `window.confirm` and the
 * player's own "Begin a reign" silently did nothing over an existing save.
 *
 * `dials` drops the third switch's panel out from under the strip (see
 * `DevDials`): the same six facts, with a hand on them, and the three stages
 * to be standing in instead. It is a panel rather than another row because
 * the strip is read at a glance and a row of buttons is not read at all.
 */
export function DevBar({
  state,
  editText,
  onEditText,
  onWipe,
  onTurn,
  onOpenBoard,
  onBeginAt,
}: {
  state: GameState;
  editText: boolean;
  onEditText: () => void;
  onWipe: () => void;
  onTurn: (dial: DialId, delta: number) => void;
  onOpenBoard: (board: StatId) => void;
  /** Absent on a bench that has no reign to leave. See `DevDials`. */
  onBeginAt?: (chapter: Stage, samePlace: boolean) => void;
}) {
  const [dials, setDials] = useState(false);
  const next = nextTech(state);
  const facts: [string, string][] = [
    [UI.dev.weight, `x${lawWeight(state)}`],
    [UI.dev.scaleLaw, `x${CONFIG.law.sealScale}`],
    [UI.dev.scaleCase, `x${CONFIG.caseScale}`],
    [UI.dev.watch, keepsWatch(state) ? UI.dev.yes : UI.dev.no],
    [UI.dev.growth, signed(yearlyChange(state))],
    [UI.dev.pot, next ? `${state.research}/${next.need}` : String(state.research)],
  ];

  return (
    <div data-dev-chrome className="relative">
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 rounded-sm border border-seal/40 bg-seal/5 px-2 py-1">
        {facts.map(([label, value]) => (
          <span key={label} className="text-[10px] lowercase tracking-wide text-parchment-dim">
            {label}: <span className="tabular-nums text-seal">{value}</span>
          </span>
        ))}

        <span className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDials((v) => !v)}
            aria-pressed={dials}
            title={UI.dev.dialsHint}
            className={`rounded-sm border px-1.5 py-0.5 text-[10px] lowercase tracking-wide ${
              dials ? 'border-seal text-seal' : 'border-seal/50 text-parchment-dim hover:text-seal'
            }`}
          >
            {UI.dev.dials}
          </button>
          <label
            title={UI.dev.editTextOn}
            className={`flex cursor-pointer items-center gap-1 text-[10px] lowercase tracking-wide ${
              editText ? 'text-seal' : 'text-parchment-dim'
            }`}
          >
            <input type="checkbox" checked={editText} onChange={onEditText} />
            {UI.dev.editText}
          </label>
          <button
            type="button"
            onClick={onWipe}
            title={UI.dev.wipeHint}
            className="rounded-sm border border-seal/50 px-1.5 py-0.5 text-[10px] lowercase tracking-wide text-parchment-dim hover:text-seal"
          >
            {UI.dev.wipe}
          </button>
        </span>
      </div>

      {dials && (
        <DevDials
          state={state}
          onTurn={onTurn}
          onOpenBoard={onOpenBoard}
          onBeginAt={onBeginAt}
        />
      )}
    </div>
  );
}

/**
 * What an answer actually did, in the units the engine used: what the content
 * asked for, and what the place got after the scaling.
 */
export function DevEffects({
  raw,
  felt,
  extra,
}: {
  raw?: Effects;
  felt?: Effects;
  extra?: [string, string][];
}) {
  const ids = STATS.map((s) => s.id).filter(
    (id) => raw?.[id] !== undefined || felt?.[id] !== undefined,
  );
  if (ids.length === 0 && !extra?.length) return null;

  return (
    <div className="mt-2 rounded-md border border-seal/40 bg-seal/5 p-2">
      <div className="text-[9px] uppercase tracking-[0.2em] text-seal">{UI.dev.heading}</div>
      {ids.length > 0 && (
        <table className="mt-1 w-full text-[11px]">
          <tbody>
            {ids.map((id: StatId) => (
              <tr key={id}>
                <td className="py-0.5 pr-2 text-parchment-dim">{UI.stats[id]}</td>
                <td className="w-16 py-0.5 text-right tabular-nums text-parchment-dim/70">
                  {raw?.[id] !== undefined ? `${UI.dev.raw} ${signed(raw[id] as number)}` : ''}
                </td>
                <td className="w-16 py-0.5 text-right tabular-nums text-seal">
                  {felt?.[id] !== undefined ? `${UI.dev.felt} ${signed(felt[id] as number)}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {extra?.map(([label, value]) => (
        <div key={label} className="mt-0.5 text-[10px] lowercase text-parchment-dim">
          {label}: <span className="text-seal">{value}</span>
        </div>
      ))}
    </div>
  );
}
