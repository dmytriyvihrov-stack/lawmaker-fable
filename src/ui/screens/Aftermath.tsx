import { characterMeta, CITY_LABELS } from '../../content/meta';
import { UI } from '../../content/ui-strings';
import { getCase, getProposal, getWork } from '../../engine/registry';
import { causeLawOf, lastTownChanges, threadsOf } from '../../engine/story';
import type { GameState } from '../../engine/types';
import { CauseChip } from '../components/CauseChip';
import { DevEffects } from '../components/DevCorner';
import { PersonPortrait } from '../components/PersonPortrait';

interface Props {
  state: GameState;
  dev?: boolean;
  onContinue: () => void;
}

export function Aftermath({ state, dev = false, onContinue }: Props) {
  const data = state.lastAftermath;
  const paragraphs = data?.paragraphs ?? [];
  const noChange = !data || Object.keys(data.deltas).length === 0;
  const changes = lastTownChanges(state);

  const last = state.log[state.log.length - 1];
  const event = last?.kind === 'case' ? getCase(last.refId) : undefined;
  const cause = event ? causeLawOf(event, state) : null;
  const who = event ? characterMeta(event.character) : null;

  // a ruling that cost somebody something is a face that leaves the room
  const choice = event?.choices.find((c) => c.id === last?.choiceId);
  const hurt = Object.entries(choice?.effects ?? {}).some(
    ([stat, value]) => (stat === 'mood' || stat === 'health') && (value as number) < 0,
  );

  const built = last?.kind === 'work' ? getWork(last.refId) : undefined;

  const sealed =
    last?.kind === 'law'
      ? getProposal(last.refId)?.options.find(
          (o) => `${o.subject}_${o.action}` === last.choiceId,
        )
      : undefined;
  const opened = sealed ? threadsOf(sealed) : [];

  return (
    <div className="p-5">
      <h2 className="mb-3 text-[11px] uppercase tracking-[0.2em] text-parchment-dim">
        {UI.aftermath.heading}
      </h2>

      {cause && <CauseChip lawId={cause} state={state} />}

      {/* The first law used to be explained here, on a card a sealed law never
          reaches: the app shows the seal in place of this screen when the last
          thing decided was a decree, so the block was never once seen. It is on
          the seal itself now, which is where the reader actually is. */}

      {event && who ? (
        <section className="rounded-lg border border-ink-line bg-ink-soft p-4">
          <header className="mb-3 flex items-center gap-3">
            <PersonPortrait character={event.character} size={56} grim={hurt} />
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.18em] text-parchment-dim">
                {UI.aftermath.whatBecameOf}
              </div>
              <div className="truncate text-[15px] leading-tight text-parchment">{who.label}</div>
            </div>
          </header>
          <div className="space-y-3">
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className={
                  i === 0 && paragraphs.length > 1
                    ? 'text-[14px] italic leading-relaxed text-seal'
                    : 'text-[15px] leading-relaxed text-parchment/90'
                }
              >
                {p}
              </p>
            ))}
          </div>
        </section>
      ) : (
        <section className="space-y-3 rounded-lg border border-ink-line bg-ink-soft p-4">
          {built && (
            <div className="text-[10px] uppercase tracking-[0.18em] text-parchment-dim">
              {built.name}
            </div>
          )}
          {paragraphs.map((p, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-parchment/90">
              {p}
            </p>
          ))}
          {noChange && changes.length === 0 && (
            <p className="text-[13px] text-parchment-dim">{UI.aftermath.noChange}</p>
          )}
        </section>
      )}

      {changes.length > 0 && (
        <section className="mt-3 rounded-lg border border-ink-line bg-ink/60 p-3">
          <h3 className="mb-2 text-[10px] uppercase tracking-[0.18em] text-parchment-dim">
            {UI.story.townChanged}
          </h3>
          <ul className="space-y-1">
            {changes.map(({ flag, on }) => {
              const label = CITY_LABELS[flag];
              return (
                <li key={flag} className="flex items-center gap-2 text-[13px]">
                  <span aria-hidden>{label.emoji}</span>
                  <span className={on ? 'text-parchment' : 'text-parchment-dim'}>
                    {on ? label.on : label.off}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {opened.length > 0 && (
        <section className="mt-3 rounded-lg border border-ink-line bg-ink/60 p-3">
          <h3 className="mb-2 text-[10px] uppercase tracking-[0.18em] text-parchment-dim">
            {UI.story.opened}
          </h3>
          <ul className="space-y-1">
            {opened.map((thread) => (
              <li key={thread.id} className="flex items-center gap-2 text-[13px]">
                <span aria-hidden>{characterMeta(thread.who).emoji}</span>
                <span className="text-parchment/90">{thread.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {dev && (
        <DevEffects
          raw={choice?.effects}
          felt={state.lastAftermath?.deltas}
          extra={[
            ['answer', String(last?.choiceId ?? '')],
            ['souls', String(choice?.souls ?? 0)],
            ['flags', (choice?.setFlags ?? []).join(', ') || '-'],
          ]}
        />
      )}

      <button
        type="button"
        onClick={onContinue}
        className="mt-4 min-h-[52px] w-full rounded-md bg-seal px-5 py-3 text-lg tracking-wide text-parchment active:brightness-110"
      >
        {UI.aftermath.continueButton}
      </button>
    </div>
  );
}
