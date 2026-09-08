import { useEffect, useRef, useState } from 'react';
import { ACTIONS, STATS, SUBJECTS, moodFace } from '../../content/meta';
import { TAG_LABEL } from '../../content/portrait-text';
import { UI } from '../../content/ui-strings';
import { CONFIG } from '../../engine/config';
import { rand01 } from '../../engine/rng';
import { blockedReason, raidRisk, type WorldAction } from '../../engine/world';
import type { ForeignState, GameState, StatId } from '../../engine/types';
import { TYPE } from '../type';

interface Props {
  state: GameState;
  onAct: (action: WorldAction, target: string) => void;
  onClose: () => void;
}

/** The board the map is drawn on. Fixed units, so a blob lands where it is put. */
const BOARD_W = 1000;
const BOARD_H = 800;
const REACH = 260;

/**
 * The three things a neighbour can be, at a glance.
 *
 * The seven words in `UI.world.stance` are the fine grain, and they stay under
 * the name. This is the reading somebody makes in half a second from across
 * the map: are they with me, are they nothing to me, or are they trouble.
 */
function stanceMark(stance: number): string {
  if (stance >= 1) return UI.world.stanceMark.friendly;
  if (stance <= -1) return UI.world.stanceMark.hostile;
  return UI.world.stanceMark.civil;
}

/** Warm parchment at a favour, cold stone at a grudge, plain in between. */
function fillFor(stance: number): string {
  if (stance >= 2) return '#a9bb7d';
  if (stance <= -2) return '#bb8171';
  return '#b6aa86';
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
  const K = CONFIG.kingdom;
  const buttons: { action: WorldAction; label: string; cost: string; after: string }[] = [
    {
      action: 'ask',
      label: UI.world.ask,
      cost: UI.world.costs.ask,
      after: UI.world.effects.ask.replace('{n}', String(K.ask.debt)),
    },
    {
      action: 'send',
      label: UI.world.send,
      cost: UI.world.costs.send.replace('{n}', String(K.send.cost)),
      after: UI.world.effects.send.replace('{n}', String(K.send.stance)),
    },
    {
      action: 'raid',
      label: UI.world.raid,
      cost: UI.world.costs.raid.replace('{n}', String(K.raid.crown)),
      after: UI.world.effects.raid
        .replace('{n}', String(K.raid.stance))
        .replace('{o}', String(K.raid.others)),
    },
  ];

  return (
    <div className="world-card">
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

      <details className="world-laws"><summary>{UI.world.laws} <span>{them.laws.length}</span></summary>
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
      </ol></details>

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
                className="world-action"
              >
                <span aria-hidden className="world-action-icon">{UI.world.actionIcons[b.action]}</span>{b.label}<span aria-hidden className="world-action-arrow">↗</span>
              </button>
              <div className="world-action-cost">
                {blocked ?? b.cost}
              </div>
              {/* what it costs is only half of it: this is what everybody
                  standing round the table thinks of you afterwards */}
              <div className="world-action-after">{b.after}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** A settlement carries its scale, stores and watch in its silhouette. */
function Settlement({ stage, store, army, home = false }: { stage: ForeignState['stage']; store: number; army: number; home?: boolean }) {
  const roof = home ? '#793c45' : '#526c70';
  return <g pointerEvents="none">
    <ellipse cy="32" rx="64" ry="15" fill="#4b5034" opacity=".18" />
    <g fill="#e0cba3" stroke="#6f634a" strokeWidth="2" strokeLinejoin="round">
      <path d="M-37 -2 H36 V33 H-37Z" />
      <path d="M-45 -2 L-2 -33 L45 -2Z" fill={roof} />
      <path d="M-8 33 V13 Q0 2 8 13 V33Z" fill="#64533e" />
      <path d="M-27 9 H-17 V20 H-27Z M18 9 H28 V20 H18Z" fill="#f7dd98" />
      {stage !== 'village' && <><path d="M-51 36 V-13 H-33 V36 M34 36 V-13 H52 V36" /><path d="M-56 -13 L-42 -34 L-28 -13Z M29 -13 L43 -34 L57 -13Z" fill={roof} /><path d="M-44 0 V9 M44 0 V9" stroke="#72644d" strokeWidth="4" /></>}
      {stage === 'kingdom' && <><path d="M-15 -21 V-58 H15 V-21" /><path d="M-20 -58 L0 -81 L20 -58Z" fill={roof} /><path d="M0 -75 V-98" /><path d="M1 -98 Q15 -101 24 -94 L21 -83 Q13 -90 1 -86Z" fill={home ? '#d0a453' : roof} /><path d="M-4 -48 H4 V-36 H-4Z" fill="#f7dd98" /></>}
      {Array.from({ length: Math.min(3, Math.floor(store / 25)) }, (_, i) => <g key={i} transform={`translate(${-53 + i * 12} 35)`}><ellipse cy="-4" rx="6" ry="9" fill="#d2b875" /><path d="M-3 -11 H3" /></g>)}
      {army >= 50 && <><path d="M61 29 V-5" /><path d="M55 2 H67 V14 L61 20 L55 14Z" fill={roof} /><path d="M61 5 V15" stroke="#e5d8b9" /></>}
    </g>
  </g>;
}

export function World({ state, onAct, onClose }: Props) {
  const world = state.world;
  const [picked, setPicked] = useState<string | null>(world?.states[0]?.id ?? null);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    return () => previous?.focus();
  }, []);
  if (!world) return null;
  const them = world.states.find((k) => k.id === picked) ?? null;
  return (
    <div className="world-backdrop" onClick={onClose}>
      <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label={UI.world.heading} className="world-panel" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => {
        if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
        if (e.key === 'Tab') {
          const items = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"], summary') ?? []);
          const visible = items.filter((el) => el.getClientRects().length > 0);
          const first = visible[0], last = visible[visible.length - 1];
          if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { e.preventDefault(); last?.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
        }
      }}>
        <header className="world-header">
          <div><p>{UI.world.atlas}</p><h2>{UI.world.heading}</h2></div>
          <button type="button" onClick={onClose} aria-label={UI.world.close}>{UI.world.closeMark}</button>
        </header>
        <div className="world-layout">
          <div className="world-cartography">
            <svg viewBox={`0 0 ${BOARD_W} ${BOARD_H}`} className="world-map" role="group" aria-label={UI.world.heading}>
              <defs>
                <radialGradient id="atlas-paper"><stop stopColor="#e6d4a6" /><stop offset="1" stopColor="#bfae85" /></radialGradient>
                <pattern id="atlas-grid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0H0V80" fill="none" stroke="#746d52" strokeWidth=".6" opacity=".14" /></pattern>
              </defs>
              <rect width={BOARD_W} height={BOARD_H} rx="22" fill="url(#atlas-paper)" />
              <rect x="14" y="14" width="972" height="772" rx="14" fill="none" stroke="#756344" opacity=".45" />
              <rect width={BOARD_W} height={BOARD_H} fill="url(#atlas-grid)" />
              <g pointerEvents="none">
                <path d="M-10 590 Q145 610 124 730 Q104 804 350 830 H-10Z M1000 0 H877 Q786 110 898 141 Q940 220 1000 224Z" fill="#83a6a3" opacity=".65" />
                <path d="M70 800 Q228 669 188 571 Q145 485 230 423 T212 245 Q153 166 196 0" fill="none" stroke="#728f86" strokeWidth="13" opacity=".36" />
                <path d="M70 800 Q228 669 188 571 Q145 485 230 423 T212 245 Q153 166 196 0" fill="none" stroke="#9bb5a7" strokeWidth="7" />
                {[ [82,170],[116,196],[64,219],[887,555],[925,582],[871,599],[380,75],[423,68] ].map(([x,y],i) => <g key={i} transform={`translate(${x} ${y})`}><path d="M-22 15 L0 -24 L25 15 M-5 -15 L0 -24 L8 -12" fill="#9b9c7c" stroke="#777958" strokeWidth="2" opacity=".6" /></g>)}
                {[ [90,380],[115,400],[82,414],[820,690],[846,678],[862,710],[650,78],[676,93] ].map(([x,y],i) => <g key={i} transform={`translate(${x} ${y})`}><path d="M0 15 V-12" stroke="#7c7754" strokeWidth="2" /><path d="M-13 8 L0 -21 L13 8Z" fill="#7e9168" opacity=".7" /></g>)}
                <g transform="translate(900 700)" stroke="#7b6c4d" fill="none" opacity=".65"><circle r="29" /><path d="M0 -48 L9 0 L0 44 L-9 0Z M-41 0 H41" /><path d="M0 -48 L9 0 H0Z" fill="#7b6c4d" /></g>
              </g>
              {world.states.map((k) => {
                const selected = picked === k.id;
                return <g key={`road-${k.id}`} pointerEvents="none"><line x1="500" y1="400" x2={500 + k.position.x * REACH} y2={400 + k.position.y * REACH} stroke={k.stance < 0 ? '#a46658' : k.stance > 0 ? '#667c4e' : '#87785b'} strokeWidth={selected ? 5 : 2} strokeDasharray={k.stance < 0 ? '5 9' : k.stance > 0 ? undefined : '10 8'} opacity={selected ? .9 : .45} /></g>;
              })}
              <g transform="translate(500 400)">
                <path d={blobPath(state.seed, 87)} fill="#b59862" stroke="#896c3f" strokeWidth="2" />
                <Settlement stage="kingdom" store={state.stats.economy} army={state.stats.army} home />
                <text y="68" textAnchor="middle" className="atlas-home">{state.townName ?? UI.world.you}</text>
              </g>
              {world.states.map((k) => {
                const on = k.id === picked;
                const stance = UI.world.stance[String(k.stance) as keyof typeof UI.world.stance];
                return <g key={k.id} transform={`translate(${500 + k.position.x * REACH} ${400 + k.position.y * REACH})`} role="button" tabIndex={0} aria-label={`${k.name}, ${stance}`} aria-pressed={on} onClick={() => setPicked(k.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPicked(k.id); } }} className="atlas-country">
                  <title>{k.name}: {stance}</title>
                  <path className="atlas-territory" d={blobPath(k.seed, 85)} fill={fillFor(k.stance)} stroke={on ? '#fff3cf' : '#8d8260'} strokeWidth={on ? 5 : 1.5} />
                  <Settlement stage={k.stage} store={k.stats.economy} army={k.stats.army} />
                  <rect x="-99" y="53" width="198" height="49" rx="7" fill={on ? '#36483d' : '#e4d4af'} stroke="#84785a" strokeWidth="1" />
                  <text y="74" textAnchor="middle" className="atlas-name" fill={on ? '#fff0cc' : '#3e4834'}>{k.name}</text>
                  <text y="92" textAnchor="middle" className="atlas-stance" fill={on ? '#cbd3b5' : '#666347'}>{stance}</text>
                  {k.ask && <g transform="translate(57 -62)"><circle r="18" fill="#f7df9d" stroke="#9b7447" strokeWidth="2" /><text y="6" textAnchor="middle" fontSize="20">{UI.world.askMark}</text></g>}
                  {/* What they are, over the top of them.

                      A stance was a word under the name in eleven point type
                      and a line style on the road, both of which are read only
                      by somebody who already knows to look. This is the one
                      thing about a neighbour that decides what you do next, so
                      it is a mark the size of a mark, above the roofs. */}
                  <g transform="translate(0 -104)" pointerEvents="none">
                    <circle r="21" fill={fillFor(k.stance)} stroke="#6f634a" strokeWidth="2" />
                    <text y="8" textAnchor="middle" fontSize="22">{stanceMark(k.stance)}</text>
                  </g>
                </g>;
              })}

              {/* And what is actually on the roads this year.

                  A neighbour who has asked for something has sent somebody to
                  ask, and a neighbour who is angry enough and armed enough to
                  come is on the way whether or not the atlas was opened. Both
                  travel the road they would really travel, from their own
                  ground to the capital, and the second is read off the same
                  predicate the year itself uses to pick a raider. */}
              {world.states.map((k) => {
                const raiding = raidRisk(state, k);
                if (!k.ask && !raiding) return null;
                const from = { x: 500 + k.position.x * REACH, y: 400 + k.position.y * REACH };
                return (
                  <g key={`traffic-${k.id}`} pointerEvents="none">
                    <g
                      className="atlas-traffic"
                      style={{
                        ['--dx' as string]: `${((500 - from.x) * 0.72).toFixed(1)}px`,
                        ['--dy' as string]: `${((400 - from.y) * 0.72).toFixed(1)}px`,
                      }}
                    >
                      <g transform={`translate(${from.x} ${from.y})`}>
                        <title>
                          {k.name}: {raiding ? UI.world.traffic.raiding : UI.world.traffic.asking}
                        </title>
                        <circle r="15" fill={raiding ? '#bb8171' : '#e4d4af'} stroke="#6f634a" strokeWidth="2" />
                        <text y="6" textAnchor="middle" fontSize="16">
                          {raiding ? UI.world.actionIcons.raid : UI.world.actionIcons.ask}
                        </text>
                      </g>
                    </g>
                  </g>
                );
              })}
            </svg>
            <div className="world-country-list">{world.states.map((k) => <button key={k.id} type="button" aria-pressed={picked === k.id} onClick={() => setPicked(k.id)}>{k.name}</button>)}</div>
            <div className="world-legend"><span className="atlas-friendly">{UI.world.stance['2']}</span><span className="atlas-neutral">{UI.world.stance['0']}</span><span className="atlas-hostile">{UI.world.stance['-3']}</span></div>
            <details className="world-peoples"><summary>{UI.world.peoples.heading}</summary><div>{world.peoples.map((p) => <span key={p.id}><span aria-hidden>{moodFace(p.mood)}</span> {UI.world.peoples[p.id]} <b>{Math.round(p.share * 100)}%</b></span>)}</div></details>
          </div>
          <aside className="world-dossier" aria-live="polite">{them ? <Card state={state} them={them} onAct={onAct} /> : <p>{UI.world.pick}</p>}</aside>
        </div>
      </div>
    </div>
  );
}
