import { UI } from '../../content/ui-strings';
import { movePoints } from '../../engine/format';
import { growthSourcesOf, yearlyChange } from '../../engine/simulation';
import { nextRung } from '../../engine/growth';
import type { GameState } from '../../engine/types';

interface Props {
  state: GameState;
}

const signed = movePoints;

function toneOf(n: number): string {
  return n > 0 ? 'text-good' : n < 0 ? 'text-bad' : 'text-parchment-dim';
}

/**
 * The count of people, and why it is doing that.
 *
 * It is the first fact about the place and the one read most often, so it is
 * the one number on the line drawn big, with the mark for what is being counted
 * beside it and which way it is going after it. Every other dial can be
 * hovered for the list of things pulling on it, and so can this: the law about
 * strangers, the sickness, and whether anybody wants to live here.
 */
export function GrowthNote({ state }: Props) {
  const sources = growthSourcesOf(state).filter((s) => s.percent !== 0 || s.kind === 'births');
  const next = yearlyChange(state);
  // a count is only interesting because of what it opens, and the ladder that
  // says so lives two clicks away behind a gear
  const rung = nextRung(state);

  const nameOf = (kind: string, label: string): string => {
    if (kind === 'law') return label;
    if (kind === 'winter') return UI.growth.winter;
    if (kind === 'health') return UI.growth.health;
    if (kind === 'mood') return UI.growth.mood;
    if (kind === 'births') return UI.growth.births;
    return UI.growth.ground;
  };

  return (
    <span className="group relative flex shrink-0 cursor-help items-baseline gap-1.5">
      <span aria-hidden className="self-center text-[15px] leading-none">
        {UI.court.peopleIcon}
      </span>
      <span
        className="text-[19px] leading-none tabular-nums text-parchment"
        title={`${state.population} ${UI.court.people}`}
      >
        {state.population}
      </span>
      <span className="sr-only">{UI.court.people}</span>
      {next !== 0 && (
        <span className={`text-[11px] leading-none tabular-nums ${toneOf(next)}`}>
          {signed(next)} <span aria-hidden>{next > 0 ? '▸' : '◂'}</span>
        </span>
      )}
      <span className="pointer-events-none absolute left-0 top-full z-50 mt-2 hidden w-[268px] rounded-lg border border-ink-line bg-ink p-3 text-left normal-case tracking-normal shadow-[0_14px_30px_rgba(0,0,0,0.5)] group-hover:block">
        <span className="block text-[10px] uppercase tracking-[0.15em] text-parchment-dim">
          {UI.growth.heading}
        </span>
        <span className="mt-1 block space-y-1">
          {sources.map((src, i) => (
            <span key={i} className="flex items-baseline gap-2 text-[11px] leading-snug">
              <span className={`w-11 shrink-0 tabular-nums ${toneOf(src.percent)}`}>
                {src.percent === 0 ? '' : UI.growth.perYear.replace('{n}', signed(src.percent))}
              </span>
              <span className="min-w-0 flex-1 text-parchment/85">
                {nameOf(src.kind, src.label)}
              </span>
            </span>
          ))}
        </span>
        <span className="mt-2 flex items-baseline justify-between gap-2 border-t border-ink-line pt-1.5 text-[11px]">
          <span className="text-parchment-dim">{UI.growth.net}</span>
          <span className={`tabular-nums ${toneOf(next)}`}>
            {signed(next)} {UI.court.people}
          </span>
        </span>
        {rung && (
          <span className="mt-1 block text-[11px] leading-snug text-seal/85">
            {UI.growth.opensAt.replace('{n}', String(rung.at)).replace('{what}', rung.title)}
          </span>
        )}
      </span>
    </span>
  );
}
