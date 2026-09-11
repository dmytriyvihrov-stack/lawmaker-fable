import type { Ref } from 'react';
import { UI } from '../../content/ui-strings';
import { TYPE } from '../type';
import { characterTitle } from '../../content/meta';
import { seasonLine } from '../../content/season-lines';
import { getCase } from '../../engine/registry';
import type { CurrentEvent, GameState, Season } from '../../engine/types';
import { PersonPortrait } from './PersonPortrait';
import { SeasonDial } from './SeasonDial';

interface Props {
  state: GameState;
  season: Season;
  /** The years have stopped drifting: somebody is under the mark on the town. */
  waiting: boolean;
  /** What is waiting, so the door can say who is at it. */
  next: CurrentEvent | null;
  onOpen: () => void;
  cardRef?: Ref<HTMLDivElement>;
}

/**
 * The years with nobody at the door.
 *
 * Nothing takes the screen while nothing needs you: the whole of it is the
 * town, and this is one low pill along the bottom of it saying which year it
 * is and what the weather is doing. The meadow, the haystacks, the goats and
 * the path exist for exactly this state.
 *
 * Then something does need you, the mark on the town starts to knock, and the
 * pill turns into the other way in.
 */
export function Interlude({ state, season, waiting, next, onOpen, cardRef }: Props) {
  const event = next?.kind === 'case' ? getCase(next.id) : undefined;
  const who = event ? characterTitle(event.character) : null;

  if (!waiting) {
    return (
      <div
        ref={cardRef}
        className="pointer-events-auto flex w-full max-w-[860px] items-center gap-4 rounded-full border border-ink-line bg-ink-soft/90 px-6 py-3 shadow-[0_16px_36px_rgba(0,0,0,0.45)] backdrop-blur-[2px]"
      >
        <SeasonDial season={season} size={26} turn={state.turn} />
        <div className="min-w-0 flex-1">
          <div className={`${TYPE.label} text-parchment-dim`}>
            {UI.idle.kicker} &middot; {UI.court.turn} {state.turn}, {UI.seasons[season]}
          </div>
          {/* The year of work is spent in autumn, which for a long time made
              autumn the only season that happened. Each of the others gets a
              line of its own, out of the seed, so a drifting year is a year
              and not a progress bar. */}
          <p key={season} className={`drift-in truncate ${TYPE.body} italic leading-snug text-parchment`}>
            {seasonLine(state.seed, state.turn, season, state.stage)}
          </p>
        </div>
        {/* Nothing in the game cuts a season short. The person watching it may:
            the wheel turns at its own speed and finishes on its own, and this
            is the one hand that can move it along. */}
        <button
          type="button"
          onClick={onOpen}
          className={`shrink-0 rounded-full border border-ink-line px-4 py-1.5 ${TYPE.tag} tracking-wide text-parchment hover:border-parchment-dim`}
        >
          {UI.idle.skip}
        </button>
      </div>
    );
  }

  return (
    <button
      ref={cardRef as Ref<HTMLButtonElement>}
      type="button"
      onClick={onOpen}
      className="drift-in pointer-events-auto flex w-full max-w-[720px] items-center gap-4 rounded-2xl border border-seal bg-ink-soft/95 px-5 py-4 text-left shadow-[0_18px_40px_rgba(0,0,0,0.5)] backdrop-blur-[2px] transition-colors hover:brightness-110"
    >
      {event ? (
        <PersonPortrait character={event.character} size={52} />
      ) : (
        <span aria-hidden className="text-3xl leading-none">
          📜
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className={`${TYPE.label} text-seal`}>
          {event ? UI.idle.waitingHeading : UI.idle.waitingLawHeading}
        </div>
        <div className="truncate text-lg leading-tight tracking-wide">
          {event ? event.title : UI.composer.heading}
        </div>
        <div className={`truncate ${TYPE.note} text-parchment-dim`}>
          {who ?? UI.idle.waitingLaw}
        </div>
      </div>
      <span className="shrink-0 rounded-md bg-seal px-5 py-2.5 text-[15px] tracking-[0.2em] text-parchment">
        {UI.idle.open}
      </span>
    </button>
  );
}
