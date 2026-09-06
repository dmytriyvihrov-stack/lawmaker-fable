import { SEASONS } from '../../content/meta';
import { UI } from '../../content/ui-strings';
import { isWinter, yearsToWinter } from '../../engine/simulation';
import type { Season } from '../../engine/types';

interface Props {
  season: Season;
  size?: number;
  /** The wheel spins while the year turns over. */
  spinning?: boolean;
  /**
   * The year the dial is showing. With it, the dial can answer the other
   * question a wheel of seasons raises and never used to: how far round it has
   * to go before the long one.
   */
  turn?: number;
}

const ORDER: Season[] = ['spring', 'summer', 'autumn', 'winter'];

/** Quarter of a circle each, lit one at a time: the year, at a glance. */
export function SeasonDial({ season, size = 26, spinning = false, turn }: Props) {
  const index = ORDER.indexOf(season);
  const label = UI.seasons[season];

  // the long winter is the one thing in this game that arrives on a timetable,
  // and until now the timetable was only mentioned twice, two years out
  let title = label;
  if (turn !== undefined && turn > 0) {
    const left = yearsToWinter(turn);
    title = isWinter(turn)
      ? `${label}. ${UI.court.winterHere}`
      : left === 1
        ? `${label}. ${UI.court.winterNext}`
        : `${label}. ${UI.court.winterIn.replace('{n}', String(left))}`;
  }

  return (
    <span className="inline-flex items-center gap-1.5" title={title}>
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={spinning ? 'season-spin' : undefined}
        role="img"
        aria-label={label}
      >
        {ORDER.map((s, i) => {
          const lit = i === index;
          // quarters, clockwise from the top
          const a0 = (i * Math.PI) / 2 - Math.PI / 2;
          const a1 = a0 + Math.PI / 2;
          const x0 = 12 + 10 * Math.cos(a0);
          const y0 = 12 + 10 * Math.sin(a0);
          const x1 = 12 + 10 * Math.cos(a1);
          const y1 = 12 + 10 * Math.sin(a1);
          return (
            <path
              key={s}
              d={`M12 12 L ${x0.toFixed(2)} ${y0.toFixed(2)} A 10 10 0 0 1 ${x1.toFixed(
                2,
              )} ${y1.toFixed(2)} Z`}
              fill={lit ? 'var(--color-seal)' : 'var(--color-ink-line)'}
              opacity={lit ? 1 : 0.55}
            />
          );
        })}
        <circle cx="12" cy="12" r="10" fill="none" stroke="var(--color-ink)" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="3" fill="var(--color-ink)" />
      </svg>
      <span aria-hidden className="text-[13px] leading-none">
        {SEASONS[index].emoji}
      </span>
    </span>
  );
}
