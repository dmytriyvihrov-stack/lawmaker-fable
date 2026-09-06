import { UI } from '../../content/ui-strings';
import { SOURCE_ICONS } from '../../content/meta';
import { movePoints } from '../../engine/format';
import { feelingWord, isFeeling } from './Feeling';
import type { StatId } from '../../engine/types';

export interface TrendSource {
  kind: string;
  label: string;
  delta: number;
}

interface Props {
  stat: StatId;
  sources: TrendSource[];
}

const signed = movePoints;

function toneOf(n: number): string {
  return n > 0 ? 'text-good' : n < 0 ? 'text-bad' : 'text-parchment-dim';
}

/**
 * Why a board is going the way it is going, in one shape everywhere.
 *
 * Every card in this game that answers that question used to answer it in its
 * own format: one printed an arrow and a name, one printed a number and a
 * name, one printed a word. Three formats for one question is three things to
 * learn. This is the format: a mark for what kind of thing it is, what it does
 * in the units that board is read in, and what it is called.
 */
export function TrendRows({ stat, sources }: Props) {
  if (sources.length === 0) {
    return <p className="text-[12px] leading-snug text-parchment-dim">{UI.trend.none}</p>;
  }
  const feeling = isFeeling(stat);

  return (
    <ul className="space-y-1">
      {sources.map((src, i) => (
        <li key={i} className="flex items-baseline gap-2 text-[11px] leading-snug">
          <span aria-hidden className="w-4 shrink-0 text-[12px]">
            {SOURCE_ICONS[src.kind] ?? SOURCE_ICONS.other}
          </span>
          <span className={`w-[74px] shrink-0 tabular-nums ${toneOf(src.delta)}`}>
            {feeling ? feelingWord(src.delta) : signed(src.delta)}
          </span>
          <span className="min-w-0 flex-1 text-parchment/85">
            {src.label || (UI.trend.sources[src.kind] ?? UI.trend.sources.other)}
          </span>
        </li>
      ))}
    </ul>
  );
}
