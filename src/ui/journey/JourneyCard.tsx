import type { Ref } from 'react';
import { JOURNEY } from '../../content/journey';
import { characterMeta } from '../../content/meta';
import { renderTemplate } from '../../engine/format';
import { getCase } from '../../engine/registry';
import type { GameState } from '../../engine/types';
import { PersonPortrait } from '../components/PersonPortrait';
import type { JourneyControl } from './useJourney';

export function JourneyCard({ state, control, cardRef, dev }: { state: GameState; control: JourneyControl; cardRef: Ref<HTMLDivElement>; dev: boolean }) {
  const s = control.snapshot, errand = s.errands[0];
  const event = s.visit ? getCase(s.visit.id) : undefined;
  const briefing = s.mode === 'briefing', walking = s.mode === 'event-walk';
  const who = event?.character === 'wolf' || event?.character === 'crowd' || !event?.character
    ? JOURNEY.animalCaller : characterMeta(event.character).label;
  if (errand) return (
    <div ref={cardRef} className="journey-card journey-errand pointer-events-auto" role="status">
      <span className="journey-spark" aria-hidden="true">✦</span>
      <div><p className="ruler-eyebrow">{s.mode === 'collect-work' ? JOURNEY.doing : JOURNEY.fetching}</p>
        <h2>{s.mode === 'collect-work' ? (errand.moment.task ?? JOURNEY.tasks[errand.moment.hand]) : errand.moment.label}</h2>
        <p className="journey-note">{s.visit ? JOURNEY.waiting : JOURNEY.reserved}</p></div>
      {s.errands.length > 1 && <span className="journey-count">{s.errands.length}</span>}
      {dev && <button className="journey-skip" onClick={control.skip}>{JOURNEY.devSkip}</button>}
    </div>
  );
  if (!event || !s.visit) return null;
  return (
    <div ref={cardRef} className="journey-card pointer-events-auto" data-journey-card={s.mode}>
      <div className="journey-person"><PersonPortrait character={event.character === 'wolf' ? undefined : event.character} size={58} /></div>
      <div className="journey-story">
        <p className="ruler-eyebrow">{walking ? JOURNEY.walking : briefing ? `${who} · ${JOURNEY.heading}` : JOURNEY.approaching}</p>
        <h2>{event.title}</h2>
        {/* One hook on the road, and the scene at the bench.

            This card used to carry the title, the question and both scene
            paragraphs, and then the bench opened and said the same three
            things again, word for word. What somebody stopping you on a lane
            gives you is the one sentence that makes you come and look. */}
        {(briefing || walking)
          ? <p className="journey-intro">{event.question ? renderTemplate(event.question, state) : JOURNEY.speaking}</p>
          : <p className="journey-note">{who}</p>}
        {walking && <p className="journey-note">{JOURNEY.arriving}</p>}
      </div>
      {briefing && <button className="journey-go" type="button" onClick={control.follow}>{JOURNEY.go}<span aria-hidden="true">↗</span></button>}
      {dev && <button className="journey-skip" type="button" onClick={control.skip}>{JOURNEY.devSkip}</button>}
    </div>
  );
}
