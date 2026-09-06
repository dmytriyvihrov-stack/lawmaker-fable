import { STATS } from '../../content/meta';
import { TECHS } from '../../content/techs';
import { UI } from '../../content/ui-strings';
import { movePoints } from '../../engine/format';
import { nextTech, openTechs } from '../../engine/simulation';
import type { GameState, StatId, TechDef, TechId } from '../../engine/types';
import { isActiveStat } from '../../engine/simulation';
import { GrowthLadder } from '../components/GrowthLadder';

interface Props {
  state: GameState;
  onClose: () => void;
}

/** The board the tree is drawn on. Fixed units, so the wires can be exact. */
const NODE_W = 168;
const NODE_H = 116;
const GAP_X = 56;
const GAP_Y = 24;
const ROOT_W = 104;

/**
 * Known, being worked out, half thought of, waiting for a crowd, or not
 * thought of at all. `souls` is its own state on purpose: a thing nobody has
 * had the idea for and a thing nobody has had the *people* for are two
 * different facts, and only one of them is a plan.
 */
type Reveal = 'known' | 'working' | 'glimpsed' | 'souls' | 'dark';

/**
 * Which of the two branches a thing grew along. The field wants a good year;
 * the crowd wants a crowd, and says so, however good the year was.
 */
function branchOf(tech: TechDef): string {
  if (tech.needsSouls !== undefined) return UI.techs.branchCrowd;
  for (const need of tech.requires ?? []) {
    const parent = TECHS.find((t) => t.id === need);
    if (parent && branchOf(parent) === UI.techs.branchCrowd) return UI.techs.branchCrowd;
  }
  return UI.techs.branchField;
}

/** The count of people the crowd branch is still waiting for, if it is. */
function crowdGate(population: number, known: TechId[]): number | null {
  let lowest: number | null = null;
  for (const tech of TECHS) {
    if (known.includes(tech.id)) continue;
    if (tech.needsSouls === undefined || population >= tech.needsSouls) continue;
    if (lowest === null || tech.needsSouls < lowest) lowest = tech.needsSouls;
  }
  return lowest;
}

const signed = movePoints;

/** Two lines and no more, so a node never spills over its own box. */
const CLAMP_2 = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical' as const,
  overflow: 'hidden',
};

function emojiOf(stat: StatId): string {
  return STATS.find((s) => s.id === stat)?.emoji ?? '';
}

/**
 * Where each thing sits. A column is how many things had to come first; a lane
 * is which branch it grew along. Content is written parent before child, which
 * the validator insists on, so one pass down the list is enough.
 */
function layout(): { col: Map<TechId, number>; lane: Map<TechId, number>; lanes: number } {
  const col = new Map<TechId, number>();
  const lane = new Map<TechId, number>();
  const taken = new Set<string>();

  for (const tech of TECHS) {
    const depth = (tech.requires ?? []).reduce(
      (deepest, need) => Math.max(deepest, (col.get(need) ?? 0) + 1),
      0,
    );
    col.set(tech.id, depth);

    // a child sits in line with its parent when the row is free, and steps down when it is not
    const parent = (tech.requires ?? [])[0];
    let row = parent !== undefined ? (lane.get(parent) ?? 0) : 0;
    while (taken.has(`${depth}:${row}`)) row += 1;
    taken.add(`${depth}:${row}`);
    lane.set(tech.id, row);
  }

  const lanes = Math.max(...[...lane.values()]) + 1;
  return { col, lane, lanes };
}

export function TechTree({ state, onClose }: Props) {
  const next = nextTech(state);
  const open = new Set(openTechs(state).map((t) => t.id));
  const { col, lane, lanes } = layout();

  const boardW = ROOT_W + GAP_X + (Math.max(...col.values()) + 1) * (NODE_W + GAP_X);
  const boardH = lanes * NODE_H + (lanes - 1) * GAP_Y;
  const colX = (c: number): number => ROOT_W + GAP_X + c * (NODE_W + GAP_X);
  const laneY = (l: number): number => l * (NODE_H + GAP_Y);

  const revealOf = (tech: TechDef): Reveal => {
    if (state.techs.includes(tech.id)) return 'known';
    if (next && next.tech.id === tech.id) return 'working';
    if (open.has(tech.id)) return 'glimpsed';
    // one step past the edge of what is possible is a rumour, not a secret
    const parents = tech.requires ?? [];
    if (parents.length > 0 && parents.every((p) => state.techs.includes(p) || open.has(p))) {
      return 'glimpsed';
    }
    // A thing waiting on a crowd is not a secret at all. It is a queue, and a
    // player is owed the number they are queueing for.
    if (branchOf(tech) === UI.techs.branchCrowd) return 'souls';
    return 'dark';
  };

  const gate = crowdGate(state.population, state.techs);

  // the pot is spent when a thing is worked out, so progress is simply the pot
  const need = next ? next.need : 1;
  const done = next ? Math.max(0, Math.min(need, state.research)) : need;

  // the wires follow what actually has to come first
  const edges: { from: [number, number]; to: [number, number]; lit: boolean }[] = [];
  for (const tech of TECHS) {
    const y = laneY(lane.get(tech.id) ?? 0) + NODE_H / 2;
    const known = state.techs.includes(tech.id);
    const parents = tech.requires ?? [];
    if (parents.length === 0) {
      edges.push({ from: [ROOT_W, boardH / 2], to: [colX(col.get(tech.id) ?? 0), y], lit: known });
      continue;
    }
    for (const parent of parents) {
      edges.push({
        from: [colX(col.get(parent) ?? 0) + NODE_W, laneY(lane.get(parent) ?? 0) + NODE_H / 2],
        to: [colX(col.get(tech.id) ?? 0), y],
        lit: known,
      });
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-t-xl border border-ink-line bg-ink p-4 sm:rounded-xl"
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

        <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-md border border-ink-line bg-ink-soft px-3 py-2">
          <span className="text-[13px] tabular-nums text-parchment">
            {state.research} {UI.techs.points}
          </span>
          {next ? (
            <>
              <span className="text-[12px] text-parchment-dim">
                {UI.techs.working}: <span className="text-parchment">{next.tech.name}</span>
              </span>
              <span className="text-[12px] tabular-nums text-parchment-dim">
                {UI.techs.progress
                  .replace('{have}', String(done))
                  .replace('{need}', String(need))}
              </span>
            </>
          ) : (
            <span className="text-[12px] text-parchment-dim">
              {/* nothing being worked out is two different facts, and the
                  difference is whether the place could ever get there */}
              {TECHS.every((t) => state.techs.includes(t.id))
                ? UI.techs.done
                : UI.techs.waitingForSouls}
            </span>
          )}
          {gate !== null && (
            <span className="text-[12px] tabular-nums text-seal">
              {UI.techs.crowdGate.replace('{n}', String(gate))}
            </span>
          )}
        </div>

        {/* The half of the screen nobody can spend on: what simply arrives
            because there are more of you. It goes above the tree because it
            comes first in the fiction: a place has to be big enough to have
            the idea before a good year can pay for it. */}
        <GrowthLadder state={state} />

        {/* the tree itself: the place on the left, the years going right */}
        <div className="overflow-x-auto pb-2">
          <div className="relative" style={{ width: boardW, height: boardH }}>
            <svg
              className="absolute inset-0"
              width={boardW}
              height={boardH}
              viewBox={`0 0 ${boardW} ${boardH}`}
              aria-hidden
            >
              {edges.map((e, i) => {
                const [x1, y1] = e.from;
                const [x2, y2] = e.to;
                const mid = x1 + (x2 - x1) / 2;
                return (
                  <path
                    key={i}
                    d={`M${x1} ${y1} C${mid} ${y1} ${mid} ${y2} ${x2} ${y2}`}
                    fill="none"
                    stroke={e.lit ? 'var(--color-seal)' : 'var(--color-parchment-dim)'}
                    strokeWidth={e.lit ? 2.2 : 1.4}
                    strokeDasharray={e.lit ? undefined : '4 4'}
                    opacity={e.lit ? 1 : 0.45}
                  />
                );
              })}
            </svg>

            {/* the root: nobody asked it to work anything out */}
            <div
              className="absolute flex flex-col items-center justify-center rounded-lg border border-ink-line bg-ink-soft px-2 text-center"
              style={{ left: 0, top: (boardH - NODE_H) / 2, width: ROOT_W, height: NODE_H }}
              title={UI.techs.rootLine}
            >
              <span aria-hidden className="text-xl leading-none">
                🏘️
              </span>
              <span className="mt-1 text-[11px] leading-tight text-parchment-dim">
                {UI.techs.root}
              </span>
              <span className="mt-1 text-[12px] tabular-nums text-parchment">
                {state.population}
              </span>
            </div>

            {TECHS.map((tech, idx) => {
              const reveal = revealOf(tech);
              const named = reveal !== 'dark';
              const box =
                reveal === 'known'
                  ? 'border-seal bg-seal/20 text-parchment'
                  : reveal === 'working'
                    ? 'border-parchment-dim bg-ink-soft text-parchment'
                    : reveal === 'glimpsed'
                      ? 'border-ink-line bg-ink-soft/70 text-parchment-dim'
                      : reveal === 'souls'
                        ? 'border-ink-line/70 bg-ink-soft/40 text-parchment-dim/80'
                        : 'border-ink-line/50 bg-ink-soft/30 text-parchment-dim/50';
              return (
                <div
                  key={tech.id}
                  className={`absolute flex flex-col overflow-hidden rounded-lg border p-2 ${box}`}
                  style={{
                    left: colX(col.get(tech.id) ?? 0),
                    top: laneY(lane.get(tech.id) ?? 0),
                    width: NODE_W,
                    height: NODE_H,
                  }}
                  title={`${UI.techs.eraLabel.replace(
                    '{n}',
                    String(tech.era),
                  )}. ${UI.techs.orderHint.replace('{n}', String(idx + 1))}`}
                >
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="truncate text-[9px] uppercase tracking-[0.12em] text-parchment-dim">
                      {branchOf(tech)}
                    </span>
                    <span className="text-[9px] tabular-nums text-parchment-dim">{idx + 1}</span>
                  </div>

                  <div className="mt-0.5 text-[12px] font-medium leading-tight">
                    {named ? tech.name : UI.techs.unknown}
                  </div>

                  {reveal === 'known' && (
                    <>
                      <p className="mt-1 text-[10px] leading-snug text-parchment/80" style={CLAMP_2}>
                        {tech.line}
                      </p>
                      <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                        {Object.entries(tech.trend).map(([stat, value]) => {
                          // a hamlet has no watch and no songs: the trend is
                          // banked against the charter, not thrown away, and a
                          // node that does not say so is telling a small lie
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
                                ? UI.techs.yearly.replace('{n}', signed(value as number))
                                : UI.techs.banked}
                            </span>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {reveal === 'working' && (
                    <>
                      <p className="mt-1 text-[10px] leading-snug text-parchment-dim" style={CLAMP_2}>
                        {tech.line}
                      </p>
                      <div className="mt-auto pt-1">
                        <div className="h-1.5 w-full overflow-hidden rounded-sm bg-ink-line">
                          <div
                            className="h-full rounded-sm bg-seal transition-[width] duration-500"
                            style={{ width: `${Math.round((done / need) * 100)}%` }}
                          />
                        </div>
                        <div className="mt-1 text-[10px] tabular-nums text-parchment-dim">
                          {UI.techs.progress
                            .replace('{have}', String(done))
                            .replace('{need}', String(need))}
                        </div>
                      </div>
                    </>
                  )}

                  {reveal === 'souls' && tech.needsSouls !== undefined && (
                    <div className="mt-auto">
                      <p className="text-[10px] leading-snug text-seal/80">
                        {UI.techs.wantsSouls.replace('{n}', String(tech.needsSouls))}
                      </p>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-sm bg-ink-line">
                        <div
                          className="h-full rounded-sm bg-parchment-dim/60"
                          style={{
                            width: `${Math.round(
                              Math.min(100, (state.population / tech.needsSouls) * 100),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {reveal === 'glimpsed' && (
                    <div className="mt-auto space-y-0.5">
                      <p className="text-[10px] leading-snug text-parchment-dim/80">
                        {UI.techs.glimpsed}
                      </p>
                      {tech.needsSouls !== undefined && state.population < tech.needsSouls && (
                        <p className="text-[10px] leading-snug text-seal/80">
                          {UI.techs.wantsSouls.replace('{n}', String(tech.needsSouls))}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-2 text-[11px] leading-relaxed text-parchment-dim">
          {UI.techs.rootLine}
        </p>
      </div>
    </div>
  );
}
