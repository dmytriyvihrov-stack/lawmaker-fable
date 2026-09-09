import { useState } from 'react';
import { STATS } from '../../content/meta';
import { GROWTH_COST, GROWTH_STATE } from '../../content/growth-marks';
import { UI } from '../../content/ui-strings';
import { CONFIG } from '../../engine/config';
import { growthLadder, nextRung, yearsToRung } from '../../engine/growth';
import { crowdingOnHealth } from '../../engine/simulation';
import type { GrowthStep } from '../../engine/growth';
import type { GameState, StatId } from '../../engine/types';

interface Props {
  state: GameState;
}

function emojiOf(stat: StatId): string {
  return STATS.find((s) => s.id === stat)?.emoji ?? '';
}

/** How far along the whole ladder the place is standing, as a fraction. */
function walked(population: number, marks: number[]): number {
  const top = marks[marks.length - 1];
  const first = marks[0];
  if (population <= 0) return 0;
  if (population >= top) return 1;
  // the rungs are not evenly spaced, so the bar walks rung by rung rather than
  // by the raw count: five souls short of the charter should look nearly there
  const below = marks.filter((m) => m <= population).length;
  const lower = below === 0 ? 0 : marks[below - 1];
  const upper = marks[below] ?? top;
  const within = upper === lower ? 1 : (population - lower) / (upper - lower);
  const span = marks.length;
  const base = below === 0 ? 0 : below;
  return Math.min(1, (base + (below === 0 ? population / (first || 1) : within)) / span);
}

/**
 * The other branch. The tree beside it is what a good year buys; this is what
 * simply arrives because there are more of you than there were, and it is the
 * half of a reign that used to be invisible: the watch and the songs turned up
 * one spring with no warning and no bill, and a player who wanted to know why
 * had nowhere to look.
 *
 * What it is not is a museum. Six cards of equal weight, five of them stamped
 * PASSED, was most of this screen and none of its news: by the middle of a
 * reign the thing anybody opens this for is the rung in front of them, and the
 * ones behind are a line of counts you can unfold if you want to read your own
 * history. What is behind you also has to be true, which is why a rung that
 * asked a question once says what you answered rather than asking it again.
 */
export function GrowthLadder({ state }: Props) {
  const ladder = growthLadder(state);
  const [openPast, setOpenPast] = useState(false);
  if (ladder.length === 0) return null;

  const marks = ladder.map((step) => step.at);
  const progress = walked(state.population, marks);
  const upcoming = nextRung(state);
  const years = upcoming ? yearsToRung(state, upcoming) : null;

  const passed = ladder.filter((step) => step.reached);
  const ahead = ladder.filter((step) => !step.reached);

  const status = !upcoming
    ? GROWTH_STATE.top
    : years === null
      ? GROWTH_STATE.nextNever.replace('{n}', String(upcoming.at))
      : years <= 1
        ? GROWTH_STATE.nextSoon.replace('{n}', String(upcoming.at))
        : GROWTH_STATE.next
            .replace('{n}', String(upcoming.at))
            .replace('{years}', GROWTH_STATE.years.replace('{n}', String(years)));

  /** The boards a rung hands over, or the one it turned out you took. */
  const Boards = ({ step }: { step: GrowthStep }) => (
    <>
      {step.choose && (
        <div className="text-[10px] leading-snug text-seal/85">{UI.techs.growthPick}</div>
      )}
      {step.taken && (
        <div className="text-[10px] uppercase tracking-[0.12em] text-parchment-dim">
          {UI.techs.growthTook}
        </div>
      )}
      {/* a board of its own is the biggest thing a count can give: before the
          charter the watch and the songs are somebody's hobby, and after it
          they are things the place has */}
      {step.boards.map((board) => (
        <div
          key={board}
          className="text-[10px] leading-snug text-parchment/85"
          title={UI.techs.growthBoards}
        >
          <span aria-hidden>{emojiOf(board)}</span> {UI.stats[board]}
        </div>
      ))}
    </>
  );

  const Card = ({ step }: { step: GrowthStep }) => {
    const here = upcoming !== null && upcoming.at === step.at;
    /* The two rungs where the place stops being what it was are drawn as
       that and not as another card in the row: a charter and a crown are
       the only two counts in the game that change the rules. */
    const turning = step.stage !== undefined;
    const opens = step.techs.filter((t) => t.name !== step.title);
    const box = step.reached
      ? 'border-seal/70 bg-seal/15 text-parchment'
      : here
        ? 'border-parchment-dim bg-ink-soft text-parchment'
        : turning
          ? 'border-seal/40 bg-ink-soft/60 text-parchment'
          : 'border-ink-line bg-ink-soft/40 text-parchment-dim';
    return (
      <li
        className={`flex w-[152px] shrink-0 flex-col rounded-lg border p-2 ${box} ${
          turning ? 'border-dashed' : ''
        }`}
      >
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-[13px] tabular-nums">{step.at}</span>
          <span className="text-[9px] uppercase tracking-[0.12em] text-parchment-dim">
            {step.reached ? UI.techs.growthReached : here ? UI.techs.growthNext : ''}
          </span>
        </div>
        {/* The name, and then what it actually is. Half these cards used to
            carry a name and the words "thinkable from here" and nothing
            else, which is a card that has told you a count and a noun: the
            line is on the card now, clamped to three lines of it. */}
        <div className="mt-0.5 text-[12px] font-medium leading-tight">{step.title}</div>
        <p className="mt-1 line-clamp-3 text-[10px] leading-snug text-parchment-dim" title={step.line}>
          {step.line}
        </p>

        <div className="mt-auto space-y-1 pt-1.5">
          <Boards step={step} />
          {/* and whatever else lands on the same count. A rung that IS a
              thing worked out takes its name from it, so naming it again
              underneath was the card saying one word twice. */}
          {opens.length > 0 && (
            <div className="text-[10px] leading-snug text-seal/80">
              {UI.techs.growthOpens}
              <span className="text-parchment-dim">
                {': '}
                {opens.map((t) => t.name).join(', ')}
              </span>
            </div>
          )}
        </div>
      </li>
    );
  };

  return (
    <section className="mb-4">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <div>
          <h3 className="text-[13px] tracking-wide text-parchment">
            🏘️ {UI.techs.growthHeading}
          </h3>
          <p className="text-[10px] uppercase tracking-[0.18em] text-parchment-dim">
            {UI.techs.growthKicker}
          </p>
        </div>
        <span className="shrink-0 text-[12px] tabular-nums text-parchment">
          {UI.techs.growthSouls.replace('{n}', String(state.population))}
        </span>
      </div>

      {/* the road, and how far along it the place has actually walked */}
      <div className="relative h-1 w-full rounded-sm bg-ink-line">
        <div
          className="absolute left-0 top-0 h-full rounded-sm bg-seal transition-[width] duration-500"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      {/* What is behind you, at the width it is worth: a count, a tick and a
          name, on one line, and the whole of it folded away unless somebody
          actually wants to read their own history. */}
      {passed.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setOpenPast((v) => !v)}
            aria-expanded={openPast}
            className="flex w-full items-center justify-between gap-2 rounded-md border border-ink-line/70 px-2 py-1 text-left"
          >
            <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-[10px] uppercase tracking-[0.14em] text-parchment-dim">
                {passed.length === 1
                  ? UI.techs.growthBehindOne
                  : UI.techs.growthBehind.replace('{n}', String(passed.length))}
              </span>
              {!openPast &&
                passed.map((step) => (
                  <span
                    key={step.at}
                    title={step.line}
                    className="whitespace-nowrap text-[11px] text-parchment/70"
                  >
                    <span className="tabular-nums text-seal">{step.at}</span> {step.title}
                  </span>
                ))}
            </span>
            <span aria-hidden className="shrink-0 text-[11px] text-parchment-dim">
              {openPast ? '▴' : '▾'}
            </span>
          </button>

          {openPast && (
            <div className="mt-2 overflow-x-auto pb-1">
              <ol className="flex min-w-max items-stretch gap-2">
                {passed.map((step) => (
                  <Card key={step.at} step={step} />
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* and the rungs in front of you, which is what this screen is for */}
      {ahead.length > 0 && (
        <div className="mt-2 overflow-x-auto pb-1">
          <ol className="flex min-w-max items-stretch gap-2">
            {ahead.map((step) => (
              <Card key={step.at} step={step} />
            ))}
          </ol>
        </div>
      )}

      <p className="mt-1 text-[11px] leading-relaxed text-parchment-dim">{status}</p>

      {/* The other colour. Every card above says what a count opens; this says
          what it takes, because the crowd on one well is the steadiest pull
          down in the whole game and it used to be the one thing on this screen
          nobody could read. */}
      <div className="mt-2 rounded-md border border-bad/40 bg-bad/[0.06] px-2.5 py-2">
        <div className="text-[9px] uppercase tracking-[0.16em] text-bad">{GROWTH_COST.heading}</div>
        <p className="mt-1 text-[11px] leading-snug text-parchment/85" title={GROWTH_COST.answered}>
          {GROWTH_COST.line
            .replace('{n}', String(CONFIG.crowd.healthEvery))
            .replace('{town}', String(CONFIG.town.crowdEvery))}
        </p>
        <p className="mt-1 text-[11px] leading-snug text-bad">
          {crowdingOnHealth(state) === 0
            ? GROWTH_COST.nowNothing
            : GROWTH_COST.now.replace('{n}', String(Math.abs(crowdingOnHealth(state))))}
        </p>
      </div>
    </section>
  );
}
