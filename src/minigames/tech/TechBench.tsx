import { useEffect, useState } from 'react';
import { SPHERES, TREE_UI as T } from './content';
import type { Effect, PathDef, SphereDef, TechDef } from './content';
import {
  BENCH,
  advanceYear,
  growthOf,
  isKnown,
  isOpen,
  mindsOf,
  needOf,
  newTechState,
  pathTechs,
  roomOf,
  setFocus,
  spherePaths,
  techOf,
  yearsToFinish,
} from './model';
import type { LogLine, TechState } from './model';

/**
 * The tree as a choice, on the bench.
 *
 * Three spheres side by side, each a stack of paths, each path a chain of
 * cards going right. One card is the focus and fills every spring; the count
 * at the top grows on its own and pays for the thinking. The years run by
 * themselves at the speed of somebody watching, and the interval is pacing
 * and nothing else: every rule is in `model.ts`, and one spring is one call
 * to `advanceYear`, whoever asks for it.
 */
const YEAR_MS = 1500;
const SPEEDS = [1, 2, 4] as const;
type Speed = (typeof SPEEDS)[number];

function fill(text: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce((t, [k, v]) => t.split(`{${k}}`).join(String(v)), text);
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

/** What a step does, one chip per number, in the order the header lists them. */
function effectChips(effect: Effect): string[] {
  const out: string[] = [];
  if (effect.room) out.push(fill(T.effects.room, { n: effect.room }));
  if (effect.growth) out.push(fill(T.effects.growth, { n: signed(effect.growth) }));
  if (effect.minds) out.push(fill(T.effects.minds, { n: signed(effect.minds) }));
  if (effect.shelter) out.push(fill(T.effects.shelter, { n: effect.shelter }));
  return out;
}

function whenText(years: number): string {
  return years <= 1 ? T.oneYear : fill(T.years, { n: years });
}

function logText(line: LogLine): string {
  switch (line.kind) {
    case 'learned': {
      const tech = techOf(line.tech);
      return fill(T.log.learned, { year: line.year, name: tech.name, line: tech.line });
    }
    case 'winter':
      return line.lost === 0
        ? fill(T.log.winterNone, { year: line.year })
        : fill(T.log.winter, { year: line.year, lost: line.lost, had: line.had });
    case 'stage':
      return line.stage === 'kingdom'
        ? fill(T.log.kingdom, { year: line.year })
        : fill(T.log.town, { year: line.year });
  }
}

interface CardProps {
  game: TechState;
  tech: TechDef;
  onPick: () => void;
}

function TechCard({ game, tech, onPick }: CardProps) {
  const known = isKnown(game, tech.id);
  const focus = game.focus === tech.id;
  const open = isOpen(game, tech.id);
  const have = game.progress[tech.id] ?? 0;
  const need = tech.cost;
  const box = known
    ? 'border-seal bg-seal/20 text-parchment'
    : focus
      ? 'border-parchment bg-ink-soft text-parchment'
      : open
        ? 'answer border-ink-line bg-ink-soft/80 text-parchment'
        : 'border-ink-line/50 bg-ink-soft/30 text-parchment-dim/70';
  const prev = needOf(tech.id);

  return (
    <button
      type="button"
      onClick={onPick}
      disabled={!open || focus}
      aria-pressed={focus}
      className={`flex min-h-[132px] min-w-[96px] grow basis-0 flex-col rounded-lg border p-1.5 text-left disabled:cursor-default ${box}`}
      title={tech.line}
    >
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-[12px] font-medium leading-tight">{tech.name}</span>
        <span className="shrink-0 text-[10px] tabular-nums text-parchment-dim">
          {fill(T.cost, { n: need })}
        </span>
      </div>
      <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-parchment/75">{tech.line}</p>

      <div className="mt-auto pt-1.5">
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          {effectChips(tech.effect).map((chip) => (
            <span
              key={chip}
              className={`text-[10px] tabular-nums ${known ? 'text-good' : 'text-parchment-dim'}`}
            >
              {chip}
            </span>
          ))}
        </div>

        {known && (
          <div className="mt-1 text-[10px] text-parchment-dim">
            {fill(T.known, { n: game.learnedIn[tech.id] ?? game.year })}
          </div>
        )}
        {!known && (focus || have > 0) && (
          <>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-sm bg-ink-line">
              <div
                className={`h-full rounded-sm transition-[width] duration-500 ${focus ? 'bg-seal' : 'bg-parchment-dim/60'}`}
                style={{ width: `${Math.round((Math.min(have, need) / need) * 100)}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] tabular-nums text-parchment-dim">
              <span>{fill(T.progress, { have: Math.floor(have), need })}</span>
              {focus && <span>{whenText(yearsToFinish(game, tech.id))}</span>}
            </div>
          </>
        )}
        {!known && !focus && open && have === 0 && (
          <div className="mt-1 text-[10px] text-parchment-dim">
            {fill(T.open, { when: whenText(yearsToFinish(game, tech.id)) })}
          </div>
        )}
        {!known && !open && prev && (
          <div className="mt-1 text-[10px] text-parchment-dim/70">
            {fill(T.after, { name: prev.name })}
          </div>
        )}
      </div>
    </button>
  );
}

function PathRow({ game, path, onPick }: { game: TechState; path: PathDef; onPick: (id: TechDef['id']) => void }) {
  const chain = pathTechs(path.id);
  return (
    <div className="mt-3">
      <div className="mb-1 flex items-baseline gap-2">
        <span className="text-[11px] uppercase tracking-[0.18em] text-parchment-dim">{path.name}</span>
        <span className="truncate text-[11px] text-parchment-dim/70">{path.line}</span>
      </div>
      <div className="flex items-stretch gap-0.5 overflow-x-auto pb-1">
        {chain.map((tech, i) => (
          <div key={tech.id} className="flex min-w-0 grow basis-0 items-stretch">
            {i > 0 && (
              <span
                aria-hidden
                className={`flex shrink-0 items-center text-[13px] ${
                  isKnown(game, chain[i - 1].id) ? 'text-seal' : 'text-ink-line'
                }`}
              >
                ›
              </span>
            )}
            <TechCard game={game} tech={tech} onPick={() => onPick(tech.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Sphere({ game, sphere, onPick }: { game: TechState; sphere: SphereDef; onPick: (id: TechDef['id']) => void }) {
  return (
    <section className="rounded-xl border border-ink-line bg-ink-soft/50 p-2.5">
      <header className="flex items-baseline gap-2">
        <span aria-hidden className="text-lg leading-none">
          {sphere.emoji}
        </span>
        <h2 className="text-[15px] tracking-wide text-parchment">{sphere.name}</h2>
        <span className="truncate text-[11px] text-parchment-dim">{sphere.line}</span>
      </header>
      {spherePaths(sphere.id).map((path) => (
        <PathRow key={path.id} game={game} path={path} onPick={onPick} />
      ))}
    </section>
  );
}

export function TechBench() {
  const [game, setGame] = useState<TechState>(newTechState);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState<Speed>(1);

  /* the years go by at the speed of somebody watching; pacing, not a rule */
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setGame((g) => advanceYear(g)), YEAR_MS / speed);
    return () => window.clearInterval(id);
  }, [running, speed]);

  const focus = game.focus ? techOf(game.focus) : null;
  const souls = Math.round(game.souls);
  const chip = 'rounded border border-ink-line px-2 py-0.5 text-[11px] text-parchment';
  const pressed = 'border-seal text-parchment';

  return (
    <div className="min-h-dvh w-full bg-ink text-parchment">
      <div className="sticky top-0 z-30 border-b border-ink-line bg-ink/95 px-3 py-2 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="tracking-[0.15em] text-seal">{T.title}</span>
          <span className="text-[13px] tabular-nums">{fill(T.year, { n: game.year })}</span>
          <span className="text-[13px] tabular-nums" title={T.roomLine}>
            <span aria-hidden>{T.stageEmoji[game.stage]}</span> {T.stage[game.stage]},{' '}
            {fill(T.souls, { n: souls })}, {fill(T.room, { n: roomOf(game) })}
          </span>
          <span className="text-[13px] tabular-nums text-parchment-dim" title={T.growthLine}>
            {fill(T.growth, { n: growthOf(game) })}
          </span>
          <span className="text-[13px] tabular-nums" title={fill(T.mindsLine, BENCH.minds)}>
            {fill(T.minds, { n: mindsOf(game) })}
          </span>
          <span className="text-[13px] tabular-nums text-parchment-dim" title={T.potLine}>
            {fill(T.pot, { n: Math.floor(game.pot) })}
          </span>

          <span className="ml-auto flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setRunning((v) => !v)}
              className={`${chip} ${running ? '' : pressed}`}
            >
              {running ? T.controls.pause : T.controls.play}
            </button>
            {SPEEDS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSpeed(n)}
                aria-pressed={speed === n}
                className={`${chip} ${speed === n ? pressed : ''}`}
              >
                {fill(T.controls.speed, { n })}
              </button>
            ))}
            <button type="button" onClick={() => setGame((g) => advanceYear(g))} className={chip}>
              {T.controls.step}
            </button>
            <button type="button" onClick={() => setGame(newTechState())} className={chip}>
              {T.controls.anew}
            </button>
            <a href="#" className={`${chip} text-parchment-dim`}>
              {T.controls.hand}
            </a>
          </span>
        </div>
        <div className="mx-auto mt-1 flex max-w-7xl flex-wrap items-baseline gap-x-3 text-[12px]">
          {focus ? (
            <>
              <span>{fill(T.focusOn, { name: focus.name })}</span>
              <span className="tabular-nums text-parchment-dim">
                {fill(T.progress, { have: Math.floor(game.progress[focus.id] ?? 0), need: focus.cost })},{' '}
                {whenText(yearsToFinish(game, focus.id))}
              </span>
            </>
          ) : (
            <span className="text-seal">{T.focusNone}</span>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-3 py-3">
        <p className="mb-3 text-[12px] text-parchment-dim">{T.kicker}</p>
        <div className="grid gap-3 lg:grid-cols-3">
          {SPHERES.map((sphere) => (
            <Sphere
              key={sphere.id}
              game={game}
              sphere={sphere}
              onPick={(id) => setGame((g) => setFocus(g, id))}
            />
          ))}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[2fr_1fr]">
          <section className="rounded-xl border border-ink-line bg-ink-soft/40 p-3">
            <h3 className="text-[11px] uppercase tracking-[0.18em] text-parchment-dim">{T.log.heading}</h3>
            {game.log.length === 0 ? (
              <p className="mt-2 text-[12px] text-parchment-dim">{T.log.empty}</p>
            ) : (
              <ol className="mt-2 space-y-1">
                {[...game.log].reverse().map((line, i) => (
                  <li
                    key={`${line.year}-${line.kind}-${i}`}
                    className={`text-[12px] leading-snug ${
                      line.kind === 'winter' ? 'text-bench' : line.kind === 'stage' ? 'text-timber' : 'text-parchment'
                    }`}
                  >
                    {logText(line)}
                  </li>
                ))}
              </ol>
            )}
          </section>
          <section className="rounded-xl border border-ink-line bg-ink-soft/40 p-3">
            <ul className="space-y-1.5">
              {T.rules.map((rule) => (
                <li key={rule} className="text-[11px] leading-snug text-parchment-dim">
                  {rule}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
