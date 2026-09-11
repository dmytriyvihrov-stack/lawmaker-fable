import { STATS } from '../../content/meta';
import { GROWTH_COST, GROWTH_STATE } from '../../content/growth-marks';
import { SPHERES } from '../../content/techs';
import { UI } from '../../content/ui-strings';
import { CONFIG } from '../../engine/config';
import { growthLadder, nextRung, yearsToRung } from '../../engine/growth';
import { crimeOf, crowdingOnHealth } from '../../engine/simulation';
import type { GrowthStep } from '../../engine/growth';
import type { GameState, StatId } from '../../engine/types';

interface Props {
  state: GameState;
}

function emojiOf(stat: StatId): string {
  return STATS.find((s) => s.id === stat)?.emoji ?? '';
}

/**
 * The mark on a tick: what the count opens there, as a picture.
 *
 * A charter and a crown are the two counts that change what the place is,
 * and they wear the place's own mark. A board wears its board, and the rung
 * that asked which board first wears both until the question is answered.
 * Anything the tree waits on wears its sphere, and the first rung of all,
 * where the place starts working things out, wears the cog it opens.
 */
function markOf(step: GrowthStep): string {
  if (step.stage === 'town') return UI.court.townIcon;
  if (step.stage === 'kingdom') return UI.court.kingdomIcon;
  if (step.boards.length > 0) return step.boards.map(emojiOf).join('');
  if (step.techs.length > 0) {
    return SPHERES.find((s) => s.id === step.techs[0].sphere)?.emoji ?? UI.techs.openIcon;
  }
  return UI.techs.openIcon;
}

/** How much of the piece of road ending at `to` the count has walked. */
function within(population: number, from: number, to: number): number {
  if (population >= to) return 1;
  if (population <= from) return 0;
  return (population - from) / (to - from);
}

/**
 * What the count opens, as one bar.
 *
 * The tree beside it is what a good year buys; this is what simply arrives
 * because there are more of you than there were. It used to be a row of
 * cards, one per rung, each with a title, a paragraph and a list, and a fold
 * of more cards for the rungs behind you: most of the screen and none of its
 * news. What anybody opens this for is one question, how far is the next
 * thing, and a bar answers it at a glance (T-LADDER-1).
 *
 * One piece of road per rung, so the ticks are evenly spaced whatever the
 * counts are: five souls short of the charter looks nearly there, which it
 * is. The count itself rides the bar at the point it has walked to, the way
 * a marker rides a progress bar, and each tick carries the count it happens
 * at, a mark for what it opens and two or three words. The whole sentence is
 * under the pointer.
 */
export function GrowthLadder({ state }: Props) {
  const ladder = growthLadder(state);
  if (ladder.length === 0) return null;

  const upcoming = nextRung(state);
  const years = upcoming ? yearsToRung(state, upcoming) : null;
  const status = !upcoming
    ? GROWTH_STATE.top
    : (years === null
        ? GROWTH_STATE.nextNever
        : years <= 1
          ? GROWTH_STATE.nextSoon
          : GROWTH_STATE.next
      )
        .replace('{n}', String(upcoming.at))
        .replace('{what}', upcoming.short)
        .replace('{years}', GROWTH_STATE.years.replace('{n}', String(years ?? 0)));
  const crowd = crowdingOnHealth(state);
  const crime = crimeOf(state);

  return (
    <section className="mb-3">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[13px] tracking-wide text-parchment">
            🏘️ {UI.techs.growthHeading}
          </h3>
          <p className="truncate text-[10px] uppercase tracking-[0.18em] text-parchment-dim">
            {UI.techs.growthBarHint}
          </p>
        </div>
        <span className="shrink-0 text-[12px] tabular-nums text-parchment">
          {UI.techs.growthSouls.replace('{n}', String(state.population))}
        </span>
      </div>

      {/* the road, one piece per rung, and the count riding it */}
      <div className="overflow-x-auto pb-1">
        <ol className="flex min-w-[760px] items-start pr-4 pt-5">
          {ladder.map((step, i) => {
            const from = i === 0 ? 0 : ladder[i - 1].at;
            const fill = within(state.population, from, step.at);
            const here = upcoming !== null && upcoming.at === step.at;
            const turning = step.stage !== undefined;
            const tick = step.reached
              ? 'border-seal bg-ink text-parchment'
              : here
                ? 'border-parchment-dim bg-ink text-parchment'
                : 'border-ink-line bg-ink text-parchment-dim';
            return (
              <li
                key={step.at}
                className="relative min-w-0 flex-1"
                title={`${step.at}: ${step.title}. ${step.line}`}
              >
                <div
                  className={`h-2.5 border-y border-ink-line bg-ink ${
                    i === 0 ? 'rounded-l-sm border-l' : ''
                  }`}
                >
                  <div
                    className={`h-full transition-[width] duration-500 ${
                      step.reached ? 'bg-seal' : 'bg-seal/70'
                    }`}
                    style={{ width: `${Math.round(fill * 100)}%` }}
                  />
                </div>

                {/* the count, at the point the place has walked to */}
                {here && (
                  <span
                    aria-hidden
                    className="absolute -top-5 z-10 flex -translate-x-1/2 items-baseline gap-0.5 whitespace-nowrap leading-none"
                    style={{ left: `${Math.round(fill * 100)}%` }}
                  >
                    <span className="text-[13px]">{UI.court.peopleIcon}</span>
                    <span className="text-[11px] tabular-nums text-parchment">{state.population}</span>
                  </span>
                )}

                {/* the tick, on the right edge of its piece of road */}
                <span
                  aria-hidden
                  className={`absolute right-0 top-[5px] z-10 flex -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border px-1 leading-none ${tick} ${
                    turning ? 'h-[26px] min-w-[26px] text-[13px]' : 'h-[22px] min-w-[22px] text-[11px]'
                  }`}
                >
                  {markOf(step)}
                </span>

                {/* the count it happens at, and what */}
                <div className="mt-2.5 pl-1 pr-3 text-right">
                  <div
                    className={`text-[12px] tabular-nums ${
                      step.reached ? 'text-seal' : here ? 'text-parchment' : 'text-parchment-dim'
                    }`}
                  >
                    {step.at}
                  </div>
                  <div
                    className={`line-clamp-2 text-[10px] leading-snug ${
                      step.reached || here ? 'text-parchment' : 'text-parchment-dim'
                    }`}
                  >
                    {step.short}
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.12em] text-parchment-dim">
                    {step.reached ? UI.techs.growthReached : here ? UI.techs.growthNext : ''}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <p className="mt-1 text-[11px] leading-relaxed text-parchment-dim">{status}</p>
      {/* The other colour, in one line. Every tick above says what a count
          opens; this says what it costs this year, because the crowd on one
          well is the steadiest pull down in the game. The rule is under the
          pointer. */}
      <p
        className="mt-0.5 text-[11px] leading-snug text-bad"
        title={`${GROWTH_COST.line
          .replace('{n}', String(CONFIG.crowd.healthEvery))
          .replace('{town}', String(CONFIG.town.crowdEvery))} ${GROWTH_COST.answered} ${GROWTH_COST.crimeLine
          .replace('{free}', String(CONFIG.crime.freeBelow))
          .replace('{per}', String(CONFIG.crime.perSoul))
          .replace('{culture}', String(CONFIG.crime.perCulture))
          .replace('{watch}', String(CONFIG.crime.perWatch))}`}
      >
        {crowd === 0 ? GROWTH_COST.nowNothing : GROWTH_COST.now.replace('{n}', String(Math.abs(crowd)))}
        {/* and the share of the year's making that never arrives, when there is
            one. Zero is not news and the line is long enough already. */}
        {crime > 0 && GROWTH_COST.crimeNow.replace('{n}', String(crime))}
      </p>
    </section>
  );
}
