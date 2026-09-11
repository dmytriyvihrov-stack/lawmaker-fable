import { Fragment } from 'react';
import { PATHS, SPHERES, TECHS } from '../../content/techs';
import { STATS } from '../../content/meta';
import { UI } from '../../content/ui-strings';
import { CONFIG } from '../../engine/config';
import { movePoints } from '../../engine/format';
import {
  focusOf,
  isActiveStat,
  pathTechs,
  progressOn,
  researchGain,
  techReachable,
  yearsToTech,
} from '../../engine/simulation';
import type { GameState, SphereDef, StatId, TechDef, TechId } from '../../engine/types';
import { GrowthLadder } from '../components/GrowthLadder';

interface Props {
  state: GameState;
  onFocus: (id: TechId) => void;
  onClose: () => void;
}

/**
 * What the place is working out, and the one thing on this screen you can
 * actually do about it.
 *
 * Three spheres, each answering a different question, and inside each a
 * column per path with the steps stacked down it: the first thing at the
 * top, the second under it, the third under that, a short line between them
 * that goes red once the step above is known (T-TREE-3). It used to lay
 * every path out as a row with its steps side by side, which put twenty one
 * cards in nine rows and made the chains read as lists. Read down a column
 * now and you are reading one path; read across a row and you are reading
 * how far every path has got. The bar over the top is the other half of the
 * same screen, the counts that open things nobody can buy.
 *
 * One card is the focus and takes the whole pot every spring. Nothing on one
 * path closes another, so the screen never asks you to give something up,
 * only to say what the place should get to first, and the years take care of
 * the rest: a reign reaches about a third of this. Pointed at nothing, the
 * place buys the cheapest thing it can, which is exactly what it did before
 * there was a card to press.
 */

/** Known, being worked on, startable, waiting on the step before, or on people. */
type Reveal = 'known' | 'focus' | 'open' | 'after' | 'souls';

function emojiOf(stat: StatId): string {
  return STATS.find((s) => s.id === stat)?.emoji ?? '';
}

function fill(text: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce((t, [k, v]) => t.split(`{${k}}`).join(String(v)), text);
}

/** The step before this one on the same path, or null for a first step. */
function needOf(tech: TechDef): TechDef | null {
  const chain = pathTechs(tech.path);
  const at = chain.findIndex((t) => t.id === tech.id);
  return at > 0 ? chain[at - 1] : null;
}

function whenText(years: number): string {
  return years <= 1 ? UI.techs.nextSpring : fill(UI.techs.inYears, { n: years });
}

function revealOf(state: GameState, tech: TechDef, focus: TechDef | null): Reveal {
  if (state.techs.includes(tech.id)) return 'known';
  if (focus && focus.id === tech.id) return 'focus';
  const need = needOf(tech);
  if (need && !state.techs.includes(need.id)) return 'after';
  if (tech.needsSouls !== undefined && state.population < tech.needsSouls) return 'souls';
  return 'open';
}

/** What a step does besides moving boards: the ceiling, the crowd, the winter. */
function extraChips(tech: TechDef): string[] {
  const out: string[] = [];
  if (tech.room) out.push(fill(UI.techs.room, { n: tech.room }));
  if (tech.answers) out.push(fill(UI.techs.answers, { n: tech.answers }));
  if (tech.shelter) out.push(fill(UI.techs.winter, { n: tech.shelter }));
  return out;
}

function TechCard({
  state,
  tech,
  focus,
  onFocus,
}: {
  state: GameState;
  tech: TechDef;
  focus: TechDef | null;
  onFocus: (id: TechId) => void;
}) {
  const reveal = revealOf(state, tech, focus);
  const can = reveal === 'open';
  const have = progressOn(state, tech.id) + (reveal === 'focus' ? state.research : 0);
  const box =
    reveal === 'known'
      ? 'border-seal bg-seal/20 text-parchment'
      : reveal === 'focus'
        ? 'border-parchment bg-ink-soft text-parchment'
        : can
          ? 'answer border-ink-line bg-ink-soft/80 text-parchment'
          : 'border-ink-line/50 bg-ink-soft/30 text-parchment-dim/80';
  const need = needOf(tech);

  return (
    <button
      type="button"
      onClick={() => can && onFocus(tech.id)}
      disabled={!can}
      aria-pressed={reveal === 'focus'}
      aria-label={can ? `${UI.techs.pick}: ${tech.name}` : tech.name}
      title={tech.line}
      className={`flex h-full min-h-[96px] w-full flex-col rounded-lg border p-1.5 text-left disabled:cursor-default ${box}`}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-[12px] font-medium leading-tight">{tech.name}</span>
        <span className="shrink-0 text-[10px] tabular-nums text-parchment-dim">
          {fill(UI.techs.costPoints, { n: tech.cost })}
        </span>
      </div>

      <div className="mt-1 flex flex-wrap gap-x-1.5 gap-y-0.5">
        {Object.entries(tech.trend).map(([stat, value]) => {
          /* a hamlet has no watch and no songs: the trend is banked against
             the charter, not thrown away, and a card that does not say so is
             telling a small lie */
          const felt = isActiveStat(state, stat as StatId);
          return (
            <span
              key={stat}
              className={`text-[10px] tabular-nums ${
                !felt ? 'text-parchment-dim' : (value as number) > 0 ? 'text-good' : 'text-bad'
              }`}
              title={UI.stats[stat as StatId]}
            >
              <span aria-hidden>{emojiOf(stat as StatId)}</span>{' '}
              {felt ? UI.techs.yearly.replace('{n}', movePoints(value as number)) : UI.techs.banked}
            </span>
          );
        })}
        {extraChips(tech).map((chip) => (
          <span key={chip} className="text-[10px] tabular-nums text-bench">
            {chip}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-1">
        {reveal === 'known' && (
          <div className="text-[10px] text-parchment-dim">{UI.techs.knownIn}</div>
        )}

        {reveal === 'focus' && (
          <>
            <div className="h-1.5 w-full overflow-hidden rounded-sm bg-ink-line">
              <div
                className="h-full rounded-sm bg-seal transition-[width] duration-500"
                style={{ width: `${Math.round((Math.min(have, tech.cost) / tech.cost) * 100)}%` }}
              />
            </div>
            <div className="mt-1 flex flex-wrap justify-between gap-x-2 text-[10px] tabular-nums text-parchment-dim">
              <span>
                {UI.techs.progress
                  .replace('{have}', String(Math.floor(have)))
                  .replace('{need}', String(tech.cost))}
              </span>
              <span>{whenText(yearsToTech(state, tech))}</span>
            </div>
          </>
        )}

        {can && (
          <div className="flex flex-wrap items-baseline justify-between gap-x-2">
            <span className="text-[10px] uppercase tracking-[0.14em] text-seal">{UI.techs.pick}</span>
            <span className="text-[10px] tabular-nums text-parchment-dim">
              {whenText(yearsToTech(state, tech))}
            </span>
          </div>
        )}

        {reveal === 'after' && need && (
          <div className="text-[10px] text-parchment-dim/70">
            {fill(UI.techs.waitsFor, { name: need.name })}
          </div>
        )}

        {reveal === 'souls' && tech.needsSouls !== undefined && (
          <div className="text-[10px] leading-snug text-seal/80">
            {UI.techs.wantsSouls.replace('{n}', String(tech.needsSouls))}
          </div>
        )}
      </div>
    </button>
  );
}

/**
 * One sphere: a column per path, the steps down each column, the rows lined
 * up across the columns so a second step stands beside every other second
 * step. Everything is placed on the grid by hand, gutter included, because
 * a chain of two next to a chain of three leaves a cell empty and an
 * auto-placed grid would fill it with the wrong card.
 */
function Sphere({
  state,
  sphere,
  focus,
  onFocus,
}: {
  state: GameState;
  sphere: SphereDef;
  focus: TechDef | null;
  onFocus: (id: TechId) => void;
}) {
  const paths = PATHS.filter((p) => p.sphere === sphere.id);
  const chains = paths.map((p) => pathTechs(p.id));
  const rows = Math.max(0, ...chains.map((c) => c.length));
  /** Row 1 is the heads; a step sits on an even row and its link on the odd one under it. */
  const rowOf = (r: number) => r * 2 + 2;

  return (
    <section className="rounded-xl border border-ink-line bg-ink-soft/50 p-2.5">
      <header className="flex items-baseline gap-2">
        <span aria-hidden className="text-lg leading-none">
          {sphere.emoji}
        </span>
        <h3 className="text-[15px] tracking-wide text-parchment">{sphere.name}</h3>
        <span className="truncate text-[11px] text-parchment-dim">{sphere.line}</span>
      </header>

      <div
        className="mt-2 grid gap-x-1.5"
        style={{ gridTemplateColumns: `auto repeat(${paths.length}, minmax(0, 1fr))` }}
      >
        {paths.map((path, c) => (
          <div
            key={path.id}
            className="mb-1.5 min-w-0"
            style={{ gridColumn: c + 2, gridRow: 1 }}
            title={path.line}
          >
            <div className="truncate text-[10px] uppercase tracking-[0.16em] text-parchment-dim">
              {path.name}
            </div>
          </div>
        ))}

        {Array.from({ length: rows }, (_, r) => (
          <Fragment key={r}>
            <div
              className="flex items-center pr-1.5 text-[10px] tabular-nums text-parchment-dim"
              style={{ gridColumn: 1, gridRow: rowOf(r) }}
            >
              {UI.techs.tiers[r] ?? String(r + 1)}
            </div>
            {chains.map((chain, c) => {
              const tech = chain[r];
              if (!tech) return null;
              const next = chain[r + 1];
              return (
                <Fragment key={tech.id}>
                  <div style={{ gridColumn: c + 2, gridRow: rowOf(r) }}>
                    <TechCard state={state} tech={tech} focus={focus} onFocus={onFocus} />
                  </div>
                  {next && (
                    <span
                      aria-hidden
                      className={`mx-auto block h-3 w-px ${
                        state.techs.includes(tech.id) ? 'bg-seal' : 'bg-ink-line'
                      }`}
                      style={{ gridColumn: c + 2, gridRow: rowOf(r) + 1 }}
                    />
                  )}
                </Fragment>
              );
            })}
          </Fragment>
        ))}
      </div>
    </section>
  );
}

export function TechTree({ state, onFocus, onClose }: Props) {
  const focus = focusOf(state);
  const R = CONFIG.research;
  const rate = researchGain(state);
  const everything = TECHS.every((t) => state.techs.includes(t.id));
  /* Nothing to point at is two different facts, and the difference is whether
     the place could ever get there. */
  const anyOpen = TECHS.some((t) => !state.techs.includes(t.id) && techReachable(state, t));

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-6xl overflow-y-auto rounded-t-xl border border-ink-line bg-ink p-4 sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-lg tracking-wide">⚙️ {UI.techs.heading}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={UI.techs.close}
            className="min-h-[44px] min-w-[44px] shrink-0 rounded-md border border-ink-line text-parchment-dim"
          >
            ✕
          </button>
        </header>

        {/* The half of the screen nobody can spend on: what simply arrives
            because there are more of you. It goes over the tree because it
            comes first in the fiction: a place has to be big enough to have
            the idea before a good year can pay for it. */}
        <GrowthLadder state={state} />

        <div className="mb-3 rounded-md border border-ink-line bg-ink-soft px-3 py-2">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="text-[13px] tabular-nums text-parchment">
              {state.research} {UI.techs.points}
            </span>
            <span
              className="text-[13px] tabular-nums text-parchment-dim"
              title={fill(UI.techs.rateLine, {
                base: R.base,
                per: R.perSoul,
                past: R.perSoulPast,
                bend: R.bendsAt,
                culture: R.perCulture,
              })}
            >
              {fill(UI.techs.rate, { n: rate })}
            </span>
            {focus ? (
              <>
                <span className="text-[12px] text-parchment-dim">
                  {UI.techs.working}: <span className="text-parchment">{focus.name}</span>
                </span>
                <span className="text-[12px] tabular-nums text-parchment-dim">
                  {UI.techs.progress
                    .replace('{have}', String(Math.floor(progressOn(state, focus.id) + state.research)))
                    .replace('{need}', String(focus.cost))}
                  , {whenText(yearsToTech(state, focus))}
                </span>
              </>
            ) : (
              <span className="text-[12px] text-seal">
                {everything ? UI.techs.done : anyOpen ? UI.techs.nobodyPicked : UI.techs.waitingForSouls}
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] leading-snug text-parchment-dim">
            {UI.techs.pickHint} {UI.techs.sphereHint}
          </p>
        </div>

        <div className="grid gap-3 xl:grid-cols-3">
          {SPHERES.map((sphere) => (
            <Sphere key={sphere.id} state={state} sphere={sphere} focus={focus} onFocus={onFocus} />
          ))}
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-parchment-dim">{UI.techs.rootLine}</p>
      </div>
    </div>
  );
}
