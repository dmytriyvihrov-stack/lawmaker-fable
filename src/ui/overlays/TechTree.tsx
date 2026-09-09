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
import type { GameState, PathDef, SphereDef, StatId, TechDef, TechId } from '../../engine/types';
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
 * It used to be a picture of a decision nobody made: nine things in two lanes,
 * bought cheapest first out of the surplus, and the only interaction was
 * reading it. It is three spheres now, each answering a different question,
 * each a stack of short chains. One card is the focus and takes the whole pot
 * every spring. Nothing on one path closes another, so the screen never asks
 * you to give something up, only to say what the place should get to first,
 * and the years take care of the rest: a reign reaches about a third of this.
 *
 * Pointed at nothing, the place buys the cheapest thing it can, which is
 * exactly what it did before there was a card to press. A player who never
 * opens this screen has the game they always had.
 */

/** Known, being worked on, startable, waiting on the step before, or on people. */
type Reveal = 'known' | 'focus' | 'open' | 'after' | 'souls';

function emojiOf(stat: StatId): string {
  return STATS.find((s) => s.id === stat)?.emoji ?? '';
}

function fill(text: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce((t, [k, v]) => t.split(`{${k}}`).join(String(v)), text);
}

/** Two lines and no more, so a card never spills over its own box. */
const CLAMP_2 = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical' as const,
  overflow: 'hidden',
};

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
      className={`flex min-h-[128px] min-w-[96px] grow basis-0 flex-col rounded-lg border p-1.5 text-left disabled:cursor-default ${box}`}
    >
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-[12px] font-medium leading-tight">{tech.name}</span>
        <span className="shrink-0 text-[10px] tabular-nums text-parchment-dim">
          {fill(UI.techs.costPoints, { n: tech.cost })}
        </span>
      </div>
      <p className="mt-1 text-[10px] leading-snug text-parchment/75" style={CLAMP_2}>
        {tech.line}
      </p>

      <div className="mt-auto pt-1">
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          {Object.entries(tech.trend).map(([stat, value]) => {
            /* a hamlet has no watch and no songs: the trend is banked against
               the charter, not thrown away, and a card that does not say so is
               telling a small lie */
            const felt = isActiveStat(state, stat as StatId);
            return (
              <span
                key={stat}
                className={`text-[10px] tabular-nums ${
                  !felt
                    ? 'text-parchment-dim'
                    : (value as number) > 0
                      ? 'text-good'
                      : 'text-bad'
                }`}
                title={UI.stats[stat as StatId]}
              >
                <span aria-hidden>{emojiOf(stat as StatId)}</span>{' '}
                {felt
                  ? UI.techs.yearly.replace('{n}', movePoints(value as number))
                  : UI.techs.banked}
              </span>
            );
          })}
          {extraChips(tech).map((chip) => (
            <span key={chip} className="text-[10px] tabular-nums text-bench">
              {chip}
            </span>
          ))}
        </div>

        {reveal === 'known' && (
          <div className="mt-1 text-[10px] text-parchment-dim">{UI.techs.knownIn}</div>
        )}

        {reveal === 'focus' && (
          <>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-sm bg-ink-line">
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
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-2">
            <span className="text-[10px] uppercase tracking-[0.14em] text-seal">
              {UI.techs.pick}
            </span>
            <span className="text-[10px] tabular-nums text-parchment-dim">
              {whenText(yearsToTech(state, tech))}
            </span>
          </div>
        )}

        {reveal === 'after' && need && (
          <div className="mt-1 text-[10px] text-parchment-dim/70">
            {fill(UI.techs.waitsFor, { name: need.name })}
          </div>
        )}

        {reveal === 'souls' && tech.needsSouls !== undefined && (
          <div className="mt-1 text-[10px] leading-snug text-seal/80">
            {UI.techs.wantsSouls.replace('{n}', String(tech.needsSouls))}
          </div>
        )}
      </div>
    </button>
  );
}

function PathRow({
  state,
  path,
  focus,
  onFocus,
}: {
  state: GameState;
  path: PathDef;
  focus: TechDef | null;
  onFocus: (id: TechId) => void;
}) {
  const chain = pathTechs(path.id);
  return (
    <div className="mt-3">
      <div className="mb-1 flex items-baseline gap-2">
        <span className="shrink-0 text-[11px] uppercase tracking-[0.18em] text-parchment-dim">
          {path.name}
        </span>
        <span className="truncate text-[11px] text-parchment-dim/70">{path.line}</span>
      </div>
      <div className="flex items-stretch gap-0.5 overflow-x-auto pb-1">
        {chain.map((tech, i) => (
          <div key={tech.id} className="flex min-w-0 grow basis-0 items-stretch">
            {i > 0 && (
              <span
                aria-hidden
                className={`flex shrink-0 items-center text-[13px] ${
                  state.techs.includes(chain[i - 1].id) ? 'text-seal' : 'text-ink-line'
                }`}
              >
                &rsaquo;
              </span>
            )}
            <TechCard state={state} tech={tech} focus={focus} onFocus={onFocus} />
          </div>
        ))}
      </div>
    </div>
  );
}

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
  return (
    <section className="rounded-xl border border-ink-line bg-ink-soft/50 p-2.5">
      <header className="flex items-baseline gap-2">
        <span aria-hidden className="text-lg leading-none">
          {sphere.emoji}
        </span>
        <h3 className="text-[15px] tracking-wide text-parchment">{sphere.name}</h3>
        <span className="truncate text-[11px] text-parchment-dim">{sphere.line}</span>
      </header>
      {PATHS.filter((p) => p.sphere === sphere.id).map((path) => (
        <PathRow key={path.id} state={state} path={path} focus={focus} onFocus={onFocus} />
      ))}
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
          <p className="mt-1 text-[11px] leading-snug text-parchment-dim">{UI.techs.pickHint}</p>
        </div>

        {/* The half of the screen nobody can spend on: what simply arrives
            because there are more of you. It goes above the tree because it
            comes first in the fiction: a place has to be big enough to have
            the idea before a good year can pay for it. */}
        <GrowthLadder state={state} />

        <p className="mb-2 mt-3 text-[11px] leading-snug text-parchment-dim">
          {UI.techs.sphereHint}
        </p>
        <div className="grid gap-3 lg:grid-cols-3">
          {SPHERES.map((sphere) => (
            <Sphere
              key={sphere.id}
              state={state}
              sphere={sphere}
              focus={focus}
              onFocus={onFocus}
            />
          ))}
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-parchment-dim">{UI.techs.rootLine}</p>
      </div>
    </div>
  );
}
