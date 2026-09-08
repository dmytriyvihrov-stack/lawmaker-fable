import type { Stage } from '../../engine/types';
import { DEFAULT_MONARCH_ID, ROYAL_WARDROBE } from '../../content/monarchs';
import { JOURNEY } from '../../content/journey';
import { folkLook } from '../../content/folk';
import { FolkBody } from '../components/Folk';
import type { Moment } from '../../content/moments';
import type { JourneyControl } from './useJourney';
import type { Job } from './model';

export function RulerFigure({ moving = false, working = false, job = 'lanes', action, stage = 'village', monarch = DEFAULT_MONARCH_ID }: { stage?: Stage; monarch?: string; moving?: boolean; working?: boolean; job?: Job; action?: Moment['hand'] }) {
  const queen = monarch === DEFAULT_MONARCH_ID;
  const dress = ROYAL_WARDROBE[stage];
  return (
    <g data-costume={stage} data-monarch={monarch} className={`ruler-figure ${moving ? 'ruler-walking' : ''} ${working ? 'ruler-working' : ''} ${action ? `ruler-action-${action}` : ''}`}>
      <ellipse cy="3" rx="12" ry="4" fill="#383d29" opacity=".3" />
      <g className="ruler-body">
        <g className="ruler-legs" stroke="#503f34" strokeWidth="3.5" strokeLinecap="round">
          <path className="ruler-leg-a" d="M-4 -4 v7" /><path className="ruler-leg-b" d="M4 -4 v7" />
        </g>
        {queen && <path d="M-6 -31 Q-11 -22 -8 -13 L8 -13 Q11 -24 6 -31Z" fill="#e5dcc2" stroke="#b3ac98" strokeWidth=".8" />}
        <path d="M-6 -23 Q-12 -16 -11 -3 Q0 1 11 -3 L7 -24Z" fill={queen ? dress.cloak : "#922f38"} stroke="#5d3031" strokeWidth="1.2" />
        <path d="M-5 -23 L-4 -5 L5 -5 L5 -23" fill={queen ? dress.cloth : "#d5b671"} />
        <path d="M-7 -21 Q0 -17 7 -21" fill="none" stroke={queen ? dress.trim : "#f2e2b9"} strokeWidth="3.5" />
        <g className="ruler-arm" stroke="#c19b78" strokeWidth="3" strokeLinecap="round">
          <path d="M7 -18 l5 8" />
          {working && !action && job === 'fields' && <path d="M13 -20 v24 m-3 -2 h7" stroke="#775d3d" strokeWidth="2" />}
          {working && !action && job === 'wood' && <path d="M12 -9 l3 -15 m-3 2 l7 -1 l-1 5 l-5 -1" stroke="#a0aaa1" strokeWidth="2.5" />}
          {working && !action && job === 'lanes' && <path d="M10 -14 l8 1 v7 l-8 -1Z" fill="#e9d7a9" stroke="#a38961" strokeWidth="1" />}
          {action === 'pet' && <path d="M12 -10 q7 8 12 6" fill="none" />}
          {action === 'lift' && <g strokeWidth="1.2" stroke="#8d7049"><path d="M8 -5 h17 l-2 9 H10Z" fill="#b69051" /><path d="M11 -5 q5 -11 11 0" fill="none" /><circle cx="15" cy="-5" r="2.5" fill="#b34e37" /><circle cx="20" cy="-4" r="2.3" fill="#d0a949" /></g>}
          {action === 'pull' && <path d="M10 -9 Q24 -38 38 -30 q8 15 5 25" fill="none" stroke="#bea779" strokeWidth="1.6" />}
          {action === 'catch' && <path d="M12 -10 l16 9 m-2 -7 v16 m8 -13 v16 m-8 -11 h8 m-8 6 h8" fill="none" stroke="#b69c6c" strokeWidth="2" />}
        </g>
        {queen && <>
          <path d="M-4 -20 L-7 -4 H7 L4 -20" fill={dress.cloth} />
          <path d="M-5 -9 L-6 -4 M0 -17 V-4 M5 -9 L6 -4" stroke={dress.trim} strokeWidth=".65" opacity=".7" />
          {stage !== 'village' && <path d="M-6 -22 Q1 -14 7 -23 M-4 -7 H6" fill="none" stroke={dress.trim} strokeWidth="1.2" />}
          {stage === 'kingdom' && <path d="M-8 -22 Q0 -17 8 -22" fill="none" stroke="#faf5e9" strokeWidth="4" />}
        </>}
        <circle cy="-29" r="6.7" fill="#d8ad84" stroke="#906d50" strokeWidth=".9" />
        <path d="M-6 -30 Q-7 -38 0 -37 Q7 -37 6 -30 L4 -32 Q0 -30 -4 -32Z" fill={queen ? "#f3e8ce" : "#594334"} />
        {(!queen || stage === 'kingdom') && <path d="M-7 -35 L-8 -41 L-3 -38 L0 -43 L3 -38 L8 -41 L7 -35Z" fill="#efcd79" stroke="#93713e" strokeWidth="1" />}
        {queen && <>
          <path d="M-5 -33 Q0 -37 5 -33 M-5 -31 Q-8 -22 -5 -17 M5 -32 Q8 -24 5 -18" fill="none" stroke="#f6edd9" strokeWidth="2.3" />
          <path d="M-5 -28 l2 2 l-3 2 l2 2 l-2 2 M5 -28 l-2 2 l3 2 l-2 2" fill="none" stroke="#b3aa92" strokeWidth=".7" />
          {stage !== 'village' && <path d="M-6 -34 Q0 -31 6 -34" fill="none" stroke={dress.trim} strokeWidth="1" />}
        </>}
        <circle cx="2.5" cy="-28" r=".8" fill="#503f34" />
      </g>
    </g>
  );
}

export function JourneyLayer({ control, stage, monarch }: { control: JourneyControl; stage: Stage; monarch: string }) {
  const { snapshot: s } = control;
  const moving = s.mode.endsWith('-walk');
  const task = s.errands[0];
  /* No dotted line ahead of the ruler any more. A line of gold beads laid
     across a valley to say "he is going over there" is a map of a place
     rather than the place, and it was on screen more often than it was off:
     the figure is walking, and a walking figure has already said it. */
  const caller = s.visit && ['caller', 'briefing', 'event-walk', 'arrived'].includes(s.mode);
  const look = folkLook(s.visit?.character);
  return (
    <g className="ruler-layer" pointerEvents="none" aria-hidden="true">
      {s.visit && s.mode !== 'caller' && (
        <g transform={`translate(${s.visit.at.x} ${s.visit.at.y})`}>
          <ellipse rx="28" ry="10" fill="#90bdba" opacity=".13" />
          <ellipse rx="23" ry="8" stroke="#d5e5ce" strokeWidth="1.5" fill="none" opacity=".7" />
        </g>
      )}
      {caller && (
        <g ref={control.callerRef} data-journey-caller transform={`translate(${s.callerAt?.x ?? s.at.x} ${s.callerAt?.y ?? s.at.y})`}>
          <g className={s.mode === 'caller' || s.mode === 'event-walk' ? 'ruler-caller-walk' : ''}>
            <g transform="scale(1.5)"><FolkBody look={look} doing="watching" /></g>
          </g>
          {s.mode === 'briefing' && (
            <g className="ruler-speech" transform="translate(-8 -31)">
              <path d="M-14 -14 h36 q5 0 5 5 v12 q0 5 -5 5 H4 l-9 7 v-7 h-9 q-5 0 -5 -5 V-9 q0 -5 5 -5Z" fill="#fbefd2" stroke="#b3a27c" />
              <circle cx="-6" cy="-2" r="1.7" fill="#725e45" /><circle cx="3" cy="-2" r="1.7" fill="#725e45" /><circle cx="12" cy="-2" r="1.7" fill="#725e45" />
            </g>
          )}
        </g>
      )}
      <g ref={control.rulerRef} data-ruler data-mode={s.mode} transform={`translate(${s.at.x} ${s.at.y})`}>
        <ellipse cy="3" rx="10" ry="4" fill="#ead19a" opacity=".16" />
        <ellipse cy="3" rx="9" ry="3" fill="none" stroke="#f6dc9a" strokeWidth="1.4" opacity=".85" />
        <g transform="scale(.48)"><RulerFigure stage={stage} monarch={monarch} moving={moving} working={s.mode === 'working' || s.mode === 'collect-work'} job={s.job} action={s.mode === 'collect-work' ? task?.moment.hand : undefined} /></g>
        {(task || s.mode === 'event-walk') && (
          <circle ref={control.progressRef} cy="-31" r="3.5" pathLength="100" fill="#3e4130" stroke="#f1d491" strokeWidth="2" strokeDasharray="100" strokeDashoffset="100" />
        )}
      </g>
    </g>
  );
}

/**
 * What the ruler is doing, in one line, and the one way to change it.
 *
 * It used to be a panel of its own in the opposite corner: an icon, an
 * eyebrow saying "you, out in the town", the job, and a note underneath
 * counting the errands. Four pieces of furniture to carry three words, as far
 * from the person they are about as the window allows. Then it was a caption
 * under the crown's card, floating on the meadow with nothing round it, which
 * read as a label on the grass rather than on the face above it.
 *
 * It is a line inside the card now, under the face whose day it is, and it is
 * a button: pressing it moves the ruler on to the next thing the place has to
 * do. Nothing about a board changes. This is the one control in the game that
 * costs nothing and decides nothing, which is exactly why it is allowed to sit
 * where every real decision is refused.
 *
 * A job the place has not built is not in the round (`openJobs`), so a valley
 * with no field cannot be sent to tend one, and with one job open the line is
 * not a button at all: a control with one setting is furniture.
 */
export function RulerDoing({ control, className }: { control: JourneyControl; className?: string }) {
  const { job, open } = control.snapshot;
  const round = open.length ? open : [job];
  const only = round.length <= 1;
  const next = round[(round.indexOf(job) + 1) % round.length];
  if (only) return <p className={`ruler-doing-line ${className ?? ''}`}>{JOURNEY.jobs[job]}</p>;
  return (
    <button
      type="button"
      onClick={() => control.job(next)}
      title={JOURNEY.doingSwitch.replace('{next}', JOURNEY.jobs[next])}
      className={`ruler-doing-line ruler-doing-switch ${className ?? ''}`}
    >
      {JOURNEY.jobs[job]}
    </button>
  );
}

/**
 * The switches behind the dev corner: skip the walk, take the walk instantly,
 * turn the weather over. Never on screen for a player.
 */
export function RulerDevControls({ control, instant, onInstant, onWeather }: { control: JourneyControl; instant: boolean; onInstant: () => void; onWeather?: () => void }) {
  const s = control.snapshot;
  const busy = s.errands.length > 0 || s.visit !== null;
  return (
    <div data-dev-chrome className="ruler-dev ruler-dev-dock pointer-events-auto">
      <label><input type="checkbox" checked={instant} onChange={onInstant} />{JOURNEY.devInstant}</label>
      {busy && <button type="button" onClick={control.skip}>{JOURNEY.devSkip}</button>}
      {onWeather && <button type="button" onClick={onWeather}>{JOURNEY.devWeather}</button>}
    </div>
  );
}
