import { moodFace, STATS } from '../../content/meta';
import { readingFor } from '../../content/town-readings';
import { UI } from '../../content/ui-strings';
import { CONFIG } from '../../engine/config';
import { boardPoints, movePoints, movePointsWhole } from '../../engine/format';
import {
  activeStats,
  isWinter,
  storeCap,
  techOpening,
  trendOf,
  trendSourcesOf,
  yearsToWinter,
} from '../../engine/simulation';
import { newFaces } from '../../engine/story';
import type { GameState, Season, StatId } from '../../engine/types';
import { Feeling, feelingArrows, isFeeling } from './Feeling';
import { GrowthNote } from './GrowthNote';
import { Menu } from './Menu';
import { SeasonDial } from './SeasonDial';
import { TrendRows } from './TrendRows';
import { WorksButton } from './WorksButton';
import { DevEditTrigger, useHoverText } from './DevText';

interface Props {
  state: GameState;
  season: Season;
  /** Which notch the wheel between decisions is turning at. */
  speed: number;
  onSpeed: (next: number) => void;
  onCodex: () => void;
  onRegister: () => void;
  /** The map out, which only a place with an outside has. */
  onWorld: () => void;
  onTree: () => void;
  /**
   * The shelf, from here only on a window with no column under the crown
   * for it. Optional because the bench draws this bar too and has no shelf.
   */
  onWorks?: () => void;
  /** The way out of a reign, which is the one thing here that is not the reign. */
  onBeginAnew: () => void;
  /** Dev mode: what the pointer says about a board is game text too. */
  dev?: boolean;
}

/** What each count is drawn in. A feeling has no colour of its own: the line does. */
const FILL: Partial<Record<StatId, string>> = {
  economy: '#c8a24a',
  army: '#5c7f86',
  culture: '#b6a683',
};

function toneOf(n: number): string {
  return n > 0 ? 'text-good' : n < 0 ? 'text-bad' : 'text-parchment-dim';
}

/** What the two ends of a condition mean, in the words of that board. */
function endsOf(stat: StatId): { low: string; high: string } {
  if (stat === 'mood') return { low: UI.feeling.squareLow, high: UI.feeling.squareHigh };
  if (stat === 'health') return { low: UI.feeling.healthLow, high: UI.feeling.healthHigh };
  return { low: UI.feeling.crownLow, high: UI.feeling.crownHigh };
}

/**
 * One board: its mark, its line, and the one number beside it that is news.
 *
 * A count is a bar that fills, in the colour of the thing it counts. A feeling
 * is a line between two ends with a marker on it and no number anywhere,
 * because how the square feels about you is not a quantity. The two questions
 * a gauge ever raises (which way is it going, and whose fault is that) are
 * under the pointer: the trend law by law, and the last few things that moved
 * it.
 */
function Gauge({
  state,
  stat,
  edge,
  dev = false,
}: {
  state: GameState;
  stat: StatId;
  /** Whether the card would hang off the right edge of the window from here. */
  edge: boolean;
  dev?: boolean;
}) {
  const hover = useHoverText(`ui:stat:${stat}:hover`, UI.stats[stat]);
  const meta = STATS.find((s) => s.id === stat)!;
  const value = state.stats[stat];
  const feeling = isFeeling(stat);
  const ceiling = stat === 'economy' ? storeCap(state) : CONFIG.statMax;
  const pull = trendOf(state, stat);
  const delta = state.lastAftermath?.deltas?.[stat] ?? 0;
  const sources = trendSourcesOf(state, stat);
  const laws = sources.filter((s) => s.kind === 'law');
  const others = sources.filter((s) => s.kind !== 'law');
  const recent = state.ledger.filter((e) => e.stat === stat).slice(-5).reverse();
  const reading = feeling ? readingFor(stat, value, state.stage) : null;
  // the square has a face, and it is the only board that does
  const mark = stat === 'mood' ? moodFace(value) : meta.emoji;
  /**
   * How much line a gauge gets.
   *
   * They were 90 and 70, which is fine for four boards and one board too wide
   * for six: at 1440 with the watch and the songs open, Culture wrapped onto a
   * second row under the store, twenty two pixels taller than the rest of the
   * header and out of the row it belongs to. A bar is read for its fill and its
   * direction, and both survive being shorter.
   */
  const wide = stat === 'economy' || feeling;

  return (
    <div className="group relative flex shrink-0 items-center gap-2" title={hover}>
      <span aria-hidden className="text-[15px] leading-none">
        {mark}
      </span>
      <span className="sr-only">{hover}</span>
      <DevEditTrigger id={`ui:stat:${stat}:hover`} text={UI.stats[stat]} dev={dev} />
      {feeling ? (
        <span className={wide ? 'w-[58px]' : 'w-[44px]'}>
          <Feeling
            value={value}
            pull={pull}
            low={endsOf(stat).low}
            high={endsOf(stat).high}
            label={UI.stats[stat]}
          />
        </span>
      ) : (
        <>
          <span
            className={`block h-2 overflow-hidden rounded-full bg-ink-line ${
              wide ? 'w-[58px]' : 'w-[44px]'
            }`}
            role="meter"
            aria-valuemin={CONFIG.statMin}
            aria-valuemax={ceiling}
            aria-valuenow={value}
            aria-label={UI.stats[stat]}
          >
            <span
              className={`block h-full rounded-full transition-[width] duration-500 ${
                delta !== 0 ? 'bar-pulse' : ''
              }`}
              style={{
                width: `${Math.max(0, Math.min(100, (value / ceiling) * 100))}%`,
                background: FILL[stat],
              }}
            />
          </span>
          {/* The store is the one board a year is spent out of, so its count
              is on the line; the rest say only which way they are going. */}
          {stat === 'economy' && (
            <span className="text-[11px] tabular-nums text-parchment-dim">{Math.round(value)}</span>
          )}
          {pull !== 0 && (
            <span className={`text-[11px] tabular-nums ${toneOf(pull)}`}>
              {movePointsWhole(pull)}
            </span>
          )}
        </>
      )}

      {/* under the pointer: what it means, what is pulling on it, and what moved it */}
      <div
        className={`pointer-events-none absolute top-full z-50 mt-2 hidden w-[264px] rounded-lg border border-ink-line bg-ink p-3 shadow-[0_14px_30px_rgba(0,0,0,0.5)] group-hover:block ${
          edge ? 'right-0' : 'left-0'
        }`}
      >
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] uppercase tracking-[0.15em] text-parchment-dim">
            {UI.stats[stat]}
          </span>
          <span className={`text-[11px] tabular-nums ${toneOf(pull)}`}>
            {pull > 0 ? UI.trend.rising : pull < 0 ? UI.trend.falling : UI.trend.flat}{' '}
            {!feeling && pull !== 0 && movePoints(pull)}
          </span>
        </div>
        {reading ? (
          <p className="mt-1.5 text-[12px] leading-snug text-parchment/90">{reading}</p>
        ) : (
          <p className="mt-1.5 text-[12px] tabular-nums text-parchment/90">
            {boardPoints(stat, value)} / {Math.round(ceiling)}
          </p>
        )}
        <div className="mt-2 border-t border-ink-line pt-1.5 text-[10px] uppercase tracking-[0.15em] text-parchment-dim">
          {UI.trend.heading}
        </div>
        <div className="mt-1">
          <TrendRows stat={stat} sources={[...laws, ...others]} />
        </div>
        {recent.length > 0 && (
          <>
            <div className="mt-2 border-t border-ink-line pt-1.5 text-[10px] uppercase tracking-[0.15em] text-parchment-dim">
              {UI.ledger.heading}
            </div>
            <ul className="mt-1 space-y-0.5">
              {recent.map((entry, i) => (
                <li key={i} className="flex items-baseline gap-2 text-[11px] leading-snug">
                  <span className={`w-8 shrink-0 tabular-nums ${toneOf(entry.delta)}`}>
                    {feeling ? feelingArrows(entry.delta) : movePoints(entry.delta)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-parchment/85">{entry.source}</span>
                  <span
                    className={`shrink-0 text-[9px] uppercase tracking-[0.1em] ${
                      entry.every ? 'text-parchment-dim' : 'text-parchment-dim/50'
                    }`}
                  >
                    {entry.every ? UI.ledger.every : UI.ledger.once}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * One line across the top, and nothing under it but the place itself.
 *
 * Everything the reign is counted in, left to right in the order it is read:
 * what the place is and what it is called, how many of them there are, the
 * store, how they are, how they feel about you, the watch, the songs. Then the
 * books, then the year, and the long winter last, because it is the one fact
 * here that is a date rather than a dial. The crown keeps its own dial, on its
 * own face, because it is a person.
 */
/** What the place is, in one word and one mark. */
function placeWord(stage: GameState['stage']): { word: string; icon: string } {
  if (stage === 'kingdom') return { word: UI.court.kingdom, icon: UI.court.kingdomIcon };
  if (stage === 'town') return { word: UI.court.town, icon: UI.court.townIcon };
  return { word: UI.court.hamlet, icon: UI.court.hamletIcon };
}

export function TopBar({
  state,
  season,
  speed,
  onSpeed,
  onCodex,
  onRegister,
  onWorld,
  onTree,
  onWorks,
  onBeginAnew,
  dev = false,
}: Props) {
  const opening = techOpening(state);
  const treeUnlocked = opening >= 1;
  const soulsToGo = Math.max(0, CONFIG.research.openAt - state.population);
  const left = yearsToWinter(state.turn);
  const frost = isWinter(state.turn)
    ? UI.court.winterHere
    : left === 1
      ? UI.court.winterNext
      : UI.court.winterIn.replace('{n}', String(left));
  const frostShort = isWinter(state.turn)
    ? UI.court.frostHere
    : left === 1
      ? UI.court.frostNext
      : UI.court.frostIn.replace('{n}', String(left));

  const boards = (['economy', 'health', 'mood', 'army', 'culture'] as StatId[]).filter((id) =>
    activeStats(state).includes(id),
  );

  /** Who has come to the door since the book was last opened. */
  const faces = newFaces(state);
  const faceNews =
    faces.length === 1
      ? `${UI.register.openLabel}: ${UI.register.newsOne}`
      : `${UI.register.openLabel}: ${UI.register.news.replace('{n}', String(faces.length))}`;

  /* h-7 and not h-8: this strip is the one piece of furniture on screen the
     whole time, and every pixel of it is a pixel of valley. Nothing in it
     got smaller except the air round it. */
  const box =
    'flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-ink-line px-2 text-[14px] leading-none text-parchment-dim hover:border-parchment-dim/60 disabled:cursor-default';

  return (
    /* `relative`, because the year hangs off the middle of this bar rather
       than standing in the row: see the clock below. */
    <header className="pointer-events-auto relative border-b border-ink-line bg-ink-soft">
      <div className="ruler-topbar-row flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-1.5 sm:px-6 sm:py-2">
        {/* what the place is, and what it is called */}
        <span
          className="flex shrink-0 items-center gap-1.5 text-parchment"
          title={placeWord(state.stage).word}
        >
          <span aria-hidden className="text-[16px] leading-none">
            {placeWord(state.stage).icon}
          </span>
          {state.townName && <span className="text-[13px]">{state.townName}</span>}
          <span className="sr-only">{placeWord(state.stage).word}</span>
        </span>

        <GrowthNote state={state} />

        <div className="ruler-topbar-boards flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1.5">
          {boards.map((id, i) => (
            <Gauge key={id} state={state} stat={id} edge={i >= boards.length - 1} dev={dev} />
          ))}
        </div>

        <span className="ruler-topbar-actions flex shrink-0 items-center gap-2.5">
          {/* The shelf, in the row with the other doors.

              It used to sit in the column under the crown on a wide window
              and only come up here when that column was not drawn. That put
              the one mark that carries a count out on the meadow on its own,
              a long way from everything else you can open, and the first
              thing a player asked was what it was. Asked for by the user. */}
          {onWorks && <WorksButton state={state} onOpen={onWorks} className={box} />}
          {opening > 0 && (
            <button
              type="button"
              disabled={!treeUnlocked}
              onClick={onTree}
              style={{ opacity: 0.35 + 0.65 * opening }}
              title={
                treeUnlocked
                  ? UI.techs.open
                  : UI.techs.locked.replace('{n}', String(CONFIG.research.openAt))
              }
              aria-label={UI.techs.open}
              className={box}
            >
              <span aria-hidden>{UI.techs.openIcon}</span>
              <span className="sr-only">{UI.techs.open}</span>
              {!treeUnlocked && (
                <span className="text-[11px] text-parchment-dim">
                  <span aria-hidden>{UI.techs.lockedIcon}</span>
                  <span className="ml-1 tabular-nums">{soulsToGo}</span>
                </span>
              )}
            </button>
          )}
          {/* the world, which a hamlet and a town do not have and a kingdom
              cannot stop having */}
          {state.stage === 'kingdom' && (
            <button
              type="button"
              onClick={onWorld}
              aria-label={UI.court.openWorld}
              title={UI.court.openWorld}
              className={box}
            >
              <span aria-hidden>{UI.world.icon}</span>
              <span className="sr-only">{UI.court.openWorld}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onCodex}
            aria-label={UI.court.openCodex}
            title={UI.court.openCodex}
            className={box}
          >
            <span aria-hidden>{UI.court.codexIcon}</span>
            <span className="sr-only">{UI.court.openCodex}</span>
          </button>
          {/* The book of faces, and its own count: somebody is in it who was
              not in it the last time it was opened. The shelf has carried one
              of these since T-SHELF-1 and the book is the other page in this
              game that gains things while you are looking elsewhere. Asked
              for by the user. */}
          <button
            type="button"
            onClick={onRegister}
            aria-label={faces.length > 0 ? faceNews : UI.register.openLabel}
            title={faces.length > 0 ? faceNews : UI.register.openLabel}
            className={`relative ${box}`}
          >
            <span aria-hidden>{UI.register.icon}</span>
            <span className="sr-only">{UI.register.openLabel}</span>
            {faces.length > 0 && (
              <span
                aria-hidden
                className="shelf-news absolute -right-1.5 -top-1.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-seal px-1 text-[10px] leading-none tabular-nums text-parchment"
              >
                {faces.length}
              </span>
            )}
          </button>

          {/* The year, the season it is in, and the one date this place keeps,
              in the middle of the bar and in a ring of their own.

              Everything else up here is a dial or a door. Where the reign has
              got to is neither, and in the row it was a number between two
              buttons: the year of a reign read as one more piece of chrome.
              The ring hangs a little below the bar, over the top of the
              valley, which is what stops it reading as a seventh box.

              Narrow, there is no middle to stand in: it goes back in the row
              where it always was, which is what the `lg:` half of this says.
              Asked for by the user. */}
          <span className="ruler-topbar-clock ml-1 flex shrink-0 items-center gap-2 lg:absolute lg:left-1/2 lg:top-[15px] lg:ml-0 lg:-translate-x-1/2">
            <span
              className="flex items-center gap-2 rounded-full border border-ink-line bg-ink px-3 py-1.5 lg:shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
              title={`${UI.court.turn} ${state.turn}`}
            >
              <SeasonDial season={season} turn={state.turn} />
              <span className="whitespace-nowrap text-[11px] uppercase tracking-[0.2em] tabular-nums text-parchment">
                {UI.court.turn} {state.turn}
              </span>
            </span>

            {/* the other clock, which runs whether or not anybody is looking */}
            <span className="whitespace-nowrap text-[10px] text-seal/85" title={frost}>
              <span aria-hidden>❄️</span> <span className="tabular-nums">{frostShort}</span>
              <span className="sr-only">{frost}</span>
            </span>
          </span>

          {/* And how fast that dial is allowed to go round.

              The years between decisions are the one stretch of this game that
              is watched rather than played, and how long anybody wants to
              watch a field is a fact about them. One button, three notches,
              and it is remembered for the next reign as well as this one. */}
          <button
            type="button"
            onClick={() => onSpeed((speed + 1) % CONFIG.speeds.length)}
            title={`${UI.speed.label}: ${UI.speed.names[speed] ?? UI.speed.names[0]}`}
            aria-label={UI.speed.label}
            className={`${box} tracking-[0.1em] text-seal`}
          >
            <span aria-hidden>{UI.speed.marks[speed] ?? UI.speed.marks[0]}</span>
            <span className="sr-only">{UI.speed.names[speed] ?? UI.speed.names[0]}</span>
          </button>

          {/* and the corner, which is not part of the reign at all */}
          <Menu onBeginAnew={onBeginAnew} />
        </span>
      </div>
    </header>
  );
}
