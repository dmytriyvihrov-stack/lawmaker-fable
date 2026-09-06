import { useState } from 'react';
import { ACTIONS, STATS, SUBJECTS, moodFace } from '../../content/meta';
import { TAG_LABEL } from '../../content/portrait-text';
import { UI } from '../../content/ui-strings';
import { CONFIG } from '../../engine/config';
import { rand01 } from '../../engine/rng';
import { blockedReason, type WorldAction } from '../../engine/world';
import type { ForeignState, GameState, StatId } from '../../engine/types';
import { TYPE } from '../type';

interface Props {
  state: GameState;
  onAct: (action: WorldAction, target: string) => void;
  onClose: () => void;
}

/** The board the map is drawn on. Fixed units, so a blob lands where it is put. */
const BOARD_W = 1200;
const BOARD_H = 720;
const REACH = 260;

/** Warm parchment at a favour, cold stone at a grudge, plain in between. */
function fillFor(stance: number): string {
  if (stance >= 2) return '#c8a24a';
  if (stance <= -2) return '#5c7f86';
  return '#7d6a4f';
}

/**
 * A country, drawn the way this game draws everything: a rounded shape with a
 * warm brown line round it and no straight edges anywhere.
 *
 * Nine points on a circle, each pushed in or out by its own amount off the
 * seed, joined with a closed cubic curve so the outline never shows a corner.
 * The wobble is the place's own seed, so a neighbour keeps its shape for the
 * whole reign and two reigns never draw the same map.
 */
function blobPath(seed: number, radius: number): string {
  const points = 9;
  const at: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const r = radius + (rand01(seed, 'blob', i) - 0.5) * 28;
    at.push([Math.cos(angle) * r, Math.sin(angle) * r]);
  }
  // a closed curve through the points, each control point half way to the next
  let d = `M ${at[0][0].toFixed(1)} ${at[0][1].toFixed(1)}`;
  for (let i = 0; i < points; i++) {
    const cur = at[i];
    const next = at[(i + 1) % points];
    const mid: [number, number] = [(cur[0] + next[0]) / 2, (cur[1] + next[1]) / 2];
    d += ` Q ${cur[0].toFixed(1)} ${cur[1].toFixed(1)} ${mid[0].toFixed(1)} ${mid[1].toFixed(1)}`;
  }
  return `${d} Z`;
}

/** One board of somebody else's, at the width of a thumb. No trend, no ledger. */
function ForeignGauge({ stat, value }: { stat: StatId; value: number }) {
  const meta = STATS.find((s) => s.id === stat)!;
  return (
    <span className="flex items-center gap-1.5" title={UI.stats[stat]}>
      <span aria-hidden className="text-[13px] leading-none">
        {stat === 'mood' ? moodFace(value) : meta.emoji}
      </span>
      <span className="sr-only">{UI.stats[stat]}</span>
      <span className="block h-1.5 w-[52px] overflow-hidden rounded-full bg-ink-line">
        <span
          className="block h-full rounded-full bg-parchment-dim"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </span>
      <span className="w-6 text-[10px] tabular-nums text-parchment-dim">{Math.round(value)}</span>
    </span>
  );
}

/** What one neighbour is, in the order it is read: who, how they rule, what they wrote. */
function Card({
  state,
  them,
  onAct,
}: {
  state: GameState;
  them: ForeignState;
  onAct: (action: WorldAction, target: string) => void;
}) {
  const stance = UI.world.stance[String(them.stance) as keyof typeof UI.world.stance];
  const buttons: { action: WorldAction; label: string; cost: string }[] = [
    { action: 'ask', label: UI.world.ask, cost: UI.world.costs.ask },
    {
      action: 'send',
      label: UI.world.send,
      cost: UI.world.costs.send.replace('{n}', String(CONFIG.kingdom.send.cost)),
    },
    {
      action: 'raid',
      label: UI.world.raid,
      cost: UI.world.costs.raid.replace('{n}', String(CONFIG.kingdom.raid.crown)),
    },
  ];

  return (
    <div className="rounded-lg border border-ink-line bg-ink-soft p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className={TYPE.title}>{them.name}</span>
        <span className={`${TYPE.label} text-parchment-dim`}>{stance}</span>
      </div>
      <div className="mt-0.5 text-[12px] text-parchment-dim">
        {UI.world.style} {TAG_LABEL[them.tag]} &middot; {Math.round(them.population)}{' '}
        {UI.world.souls}
      </div>
      {them.ask && (
        <div className="mt-2 rounded border border-seal/60 px-2 py-1 text-[12px] text-seal">
          {UI.world.asks[them.ask.board]}
        </div>
      )}

      <div className={`mt-3 ${TYPE.label} text-parchment-dim`}>{UI.world.laws}</div>
      <ol className="mt-1 space-y-1">
        {them.laws.map((law, i) => (
          <li key={`${law.subject}-${law.turn}-${i}`} className="leading-tight" title={law.label}>
            <span className="block truncate text-[11px] text-parchment">
              <span className="text-seal">{i + 1}</span>{' '}
              {(SUBJECTS.find((s) => s.id === law.subject)?.label ?? law.subject).toLowerCase()}{' '}
              <span className="text-parchment-dim">
                {(ACTIONS.find((a) => a.id === law.action)?.label ?? law.action).toLowerCase()}
              </span>
            </span>
          </li>
        ))}
        {them.laws.length === 0 && (
          <li className="text-[11px] text-parchment-dim">{UI.world.lawsNone}</li>
        )}
      </ol>

      <div className={`mt-3 ${TYPE.label} text-parchment-dim`}>{UI.world.boards}</div>
      <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
        {STATS.map((s) => (
          <ForeignGauge key={s.id} stat={s.id} value={them.stats[s.id]} />
        ))}
      </div>

      <div className="mt-3 space-y-2 border-t border-ink-line pt-3">
        {buttons.map((b) => {
          const blocked = blockedReason(state, b.action);
          return (
            <div key={b.action}>
              <button
                type="button"
                disabled={blocked !== null}
                onClick={() => onAct(b.action, them.id)}
                className="w-full rounded-md border border-ink-line px-3 py-2 text-left text-[13px] text-parchment hover:border-parchment-dim/60 disabled:cursor-default disabled:text-parchment-dim/50"
              >
                {b.label}
              </button>
              <div className="mt-0.5 text-[11px] leading-snug text-parchment-dim">
                {blocked ?? b.cost}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Everything outside the walls, on one screen.
 *
 * A kingdom is the first stage of this game that is not alone, and this is the
 * whole of what that means: five places with names, each with its own seal and
 * its own laws, and three things a year of work can be spent on instead of a
 * building. The map is drawn as plainly as a map on a table gets: blobs, roads,
 * names. It is not a strategy board and there is nothing on it to solve.
 */
export function World({ state, onAct, onClose }: Props) {
  const world = state.world;
  const [picked, setPicked] = useState<string | null>(world?.states[0]?.id ?? null);
  if (!world) return null;
  const them = world.states.find((k) => k.id === picked) ?? null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-t-xl border border-ink-line bg-ink p-4 sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-lg tracking-wide">
            {UI.world.icon} {UI.world.heading}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={UI.world.close}
            className="min-h-[44px] min-w-[44px] shrink-0 rounded-md border border-ink-line text-parchment-dim"
          >
            ✕
          </button>
        </header>

        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="min-w-0 flex-1">
            <svg
              viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
              className="w-full"
              role="img"
              aria-label={UI.world.heading}
            >
              {/* the roads out, drawn under everything they run to */}
              {world.states.map((k) => (
                <line
                  key={`road-${k.id}`}
                  x1={BOARD_W / 2}
                  y1={BOARD_H / 2}
                  x2={BOARD_W / 2 + k.position.x * REACH}
                  y2={BOARD_H / 2 + k.position.y * REACH}
                  stroke="#7a5c3a"
                  strokeWidth={2}
                  strokeDasharray="7 6"
                  opacity={0.5}
                />
              ))}

              {/* you, in the middle, in the colour of the seal */}
              <g transform={`translate(${BOARD_W / 2} ${BOARD_H / 2})`}>
                <path
                  d={blobPath(state.seed, 78)}
                  fill="#8c3b32"
                  stroke="#7a5c3a"
                  strokeWidth={3}
                  strokeLinejoin="round"
                />
                <text
                  y={104}
                  textAnchor="middle"
                  className="fill-parchment text-[11px] uppercase tracking-[0.18em]"
                >
                  {state.townName ?? UI.world.you}
                </text>
              </g>

              {world.states.map((k) => {
                const x = BOARD_W / 2 + k.position.x * REACH;
                const y = BOARD_H / 2 + k.position.y * REACH;
                const on = k.id === picked;
                return (
                  <g
                    key={k.id}
                    transform={`translate(${x} ${y})`}
                    onClick={() => setPicked(k.id)}
                    onMouseEnter={() => setPicked(k.id)}
                    className="cursor-pointer"
                  >
                    <path
                      d={blobPath(k.seed, k.stage === 'kingdom' ? 74 : 58)}
                      fill={fillFor(k.stance)}
                      stroke={on ? '#e8dcc0' : '#7a5c3a'}
                      strokeWidth={on ? 4 : 3}
                      strokeLinejoin="round"
                    />
                    {k.ask && (
                      <text
                        y={-84}
                        textAnchor="middle"
                        className="fill-seal text-[28px] font-bold"
                        aria-hidden
                      >
                        {UI.world.askMark}
                      </text>
                    )}
                    <text
                      y={98}
                      textAnchor="middle"
                      className="fill-parchment text-[11px] uppercase tracking-[0.18em]"
                    >
                      {k.name}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* who lives in your own kingdom, which is what a ruling on a group
                would be about the day there is one */}
            <div className="mt-2 rounded-lg border border-ink-line bg-ink-soft p-3">
              <div className={`${TYPE.label} text-parchment-dim`}>{UI.world.peoples.heading}</div>
              <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1">
                {world.peoples.map((p) => (
                  <div key={p.id} className="flex items-baseline gap-2 text-[12px]">
                    <span aria-hidden className="text-[13px] leading-none">
                      {moodFace(p.mood)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-parchment/85">
                      {UI.world.peoples[p.id]}
                    </span>
                    <span className="shrink-0 tabular-nums text-parchment-dim">
                      {Math.round(p.share * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full shrink-0 lg:w-[300px]">
            {them ? (
              <Card state={state} them={them} onAct={onAct} />
            ) : (
              <p className="text-[13px] text-parchment-dim">{UI.world.pick}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
