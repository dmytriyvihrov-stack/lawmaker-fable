import { JOURNEY } from '../../content/journey';
import { folkLook } from '../../content/folk';
import { FolkBody } from '../components/Folk';
import type { Moment } from '../../content/moments';
import type { JourneyControl } from './useJourney';
import type { Job } from './model';

export function RulerFigure({ moving = false, working = false, job = 'lanes', action }: { moving?: boolean; working?: boolean; job?: Job; action?: Moment['hand'] }) {
  return (
    <g className={`ruler-figure ${moving ? 'ruler-walking' : ''} ${working ? 'ruler-working' : ''} ${action ? `ruler-action-${action}` : ''}`}>
      <ellipse cy="3" rx="12" ry="4" fill="#383d29" opacity=".3" />
      <g className="ruler-body">
        <g className="ruler-legs" stroke="#503f34" strokeWidth="3.5" strokeLinecap="round">
          <path className="ruler-leg-a" d="M-4 -4 v7" /><path className="ruler-leg-b" d="M4 -4 v7" />
        </g>
        <path d="M-6 -23 Q-12 -16 -11 -3 Q0 1 11 -3 L7 -24Z" fill="#922f38" stroke="#5d3031" strokeWidth="1.2" />
        <path d="M-5 -23 L-4 -5 L5 -5 L5 -23" fill="#d5b671" />
        <path d="M-7 -21 Q0 -17 7 -21" fill="none" stroke="#f2e2b9" strokeWidth="3.5" />
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
        <circle cy="-29" r="6.7" fill="#d8ad84" stroke="#906d50" strokeWidth=".9" />
        <path d="M-6 -30 Q-7 -38 0 -37 Q7 -37 6 -30 L4 -32 Q0 -30 -4 -32Z" fill="#594334" />
        <path d="M-7 -35 L-8 -41 L-3 -38 L0 -43 L3 -38 L8 -41 L7 -35Z" fill="#efcd79" stroke="#93713e" strokeWidth="1" />
        <circle cx="2.5" cy="-28" r=".8" fill="#503f34" />
      </g>
    </g>
  );
}

export function JourneyLayer({ control }: { control: JourneyControl }) {
  const { snapshot: s } = control;
  const moving = s.mode.endsWith('-walk');
  const task = s.errands[0];
  const visibleRoute = moving && s.mode !== 'work-walk';
  const caller = s.visit && ['caller', 'briefing', 'event-walk', 'arrived'].includes(s.mode);
  const look = folkLook(s.visit?.character);
  return (
    <g className="ruler-layer" pointerEvents="none" aria-hidden="true">
      {visibleRoute && (
        <polyline data-journey-route points={s.path.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={task ? '#efd183' : '#e7ecda'} strokeWidth="2.3" strokeDasharray="2 9" strokeLinecap="round" opacity=".8" />
      )}
      {s.visit && s.mode !== 'caller' && (
        <g transform={`translate(${s.visit.at.x} ${s.visit.at.y})`}>
          <ellipse rx="28" ry="10" fill="#90bdba" opacity=".13" />
          <ellipse rx="23" ry="8" stroke="#d5e5ce" strokeWidth="1.5" fill="none" opacity=".7" />
        </g>
      )}
      {caller && (
        <g ref={control.callerRef} data-journey-caller transform={`translate(${s.callerAt?.x ?? s.at.x} ${s.callerAt?.y ?? s.at.y})`}>
          <g className={s.mode === 'caller' || s.mode === 'event-walk' ? 'ruler-caller-walk' : ''}>
            <g transform="scale(2.4)"><FolkBody look={look} doing="watching" /></g>
          </g>
          {s.mode === 'briefing' && (
            <g className="ruler-speech" transform="translate(-8 -46)">
              <path d="M-14 -14 h36 q5 0 5 5 v12 q0 5 -5 5 H4 l-9 7 v-7 h-9 q-5 0 -5 -5 V-9 q0 -5 5 -5Z" fill="#fbefd2" stroke="#b3a27c" />
              <circle cx="-6" cy="-2" r="1.7" fill="#725e45" /><circle cx="3" cy="-2" r="1.7" fill="#725e45" /><circle cx="12" cy="-2" r="1.7" fill="#725e45" />
            </g>
          )}
        </g>
      )}
      <g ref={control.rulerRef} data-ruler data-mode={s.mode} transform={`translate(${s.at.x} ${s.at.y})`}>
        <ellipse cy="3" rx="19" ry="8" fill="#ead19a" opacity=".16" />
        <ellipse cy="3" rx="17" ry="6" fill="none" stroke="#f6dc9a" strokeWidth="1.4" opacity=".85" />
        <RulerFigure moving={moving} working={s.mode === 'working' || s.mode === 'collect-work'} job={s.job} action={s.mode === 'collect-work' ? task?.moment.hand : undefined} />
        {(task || s.mode === 'event-walk') && (
          <circle ref={control.progressRef} cy="-57" r="5" pathLength="100" fill="#3e4130" stroke="#f1d491" strokeWidth="2" strokeDasharray="100" strokeDashoffset="100" />
        )}
      </g>
    </g>
  );
}

export function RulerControls({ control, dev, instant, onInstant, onWeather }: { control: JourneyControl; dev: boolean; instant: boolean; onInstant: () => void; onWeather?: () => void }) {
  const s = control.snapshot;
  const busy = s.errands.length > 0 || s.visit !== null;
  return (
    <aside className="ruler-controls pointer-events-auto">
      <div className="ruler-control-icon"><svg viewBox="-23 -48 46 56" width="25" height="34" aria-hidden="true"><RulerFigure /></svg></div>
      <div className="min-w-0 flex-1">
        <p className="ruler-eyebrow">{JOURNEY.you}</p>
        <select aria-label={JOURNEY.changeWork} value={s.job} onChange={(e) => control.job(e.target.value as Job)}>
          {Object.entries(JOURNEY.jobs).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        {busy && <p className="ruler-task-note">{s.errands.length ? s.errands.length === 1 ? JOURNEY.queueOne : JOURNEY.queue.replace('{n}', String(s.errands.length)) : s.mode === 'arrived' ? JOURNEY.arrived : JOURNEY.heading}</p>}
      </div>
      {dev && <div className="ruler-dev">
        <label><input type="checkbox" checked={instant} onChange={onInstant} />{JOURNEY.devInstant}</label>
        {busy && <button type="button" onClick={control.skip}>{JOURNEY.devSkip}</button>}
        {onWeather && <button type="button" onClick={onWeather}>{JOURNEY.devWeather}</button>}
      </div>}
    </aside>
  );
}
