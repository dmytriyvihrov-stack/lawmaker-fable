import { characterMeta, characterTitle, CITY_LABELS, PLACE_NAMES } from '../../content/meta';
import { UI } from '../../content/ui-strings';
import { getCase, getProposal, getWork } from '../../engine/registry';
import { causeLawOf, lastTownChanges, threadsOf } from '../../engine/story';
import type { Effects, GameState } from '../../engine/types';
import { DevEffects } from '../components/DevCorner';
import { DevVerdict } from '../components/DevVerdict';
import { MovedBoards } from '../components/MovedBoards';
import { CARD_BUTTON, CardFoot } from '../components/Popup';
import { lawNumber } from '../../engine/format';
import { PersonPortrait } from '../components/PersonPortrait';
import { TYPE } from '../type';

interface Props {
  state: GameState;
  dev?: boolean;
  onContinue: () => void;
}

/**
 * The boards, in whole points.
 *
 * Everything the engine works in is a float, because trends and scaling are,
 * and this card printed them straight: "+3.6", "-2.4", "-1.2". A tenth of a
 * point is not something a player can act on, and the ledger keeps the real
 * number either way.
 */
function roundDeltas(deltas: Effects | undefined): Effects | undefined {
  if (!deltas) return deltas;
  const out: Effects = {};
  for (const [id, value] of Object.entries(deltas)) {
    const whole = Math.round(value as number);
    if (whole !== 0) out[id as keyof Effects] = whole;
  }
  return out;
}

export function Aftermath({ state, dev = false, onContinue }: Props) {
  const data = state.lastAftermath;
  const paragraphs = data?.paragraphs ?? [];
  const noChange = !data || Object.keys(data.deltas).length === 0;
  const changes = lastTownChanges(state);

  const last = state.log[state.log.length - 1];
  const event = last?.kind === 'case' ? getCase(last.refId) : undefined;
  const cause = event ? causeLawOf(event, state) : null;
  const who = event ? characterTitle(event.character) : null;

  // a ruling that cost somebody something is a face that leaves the room
  const choice = event?.choices.find((c) => c.id === last?.choiceId);
  const hurt = Object.entries(choice?.effects ?? {}).some(
    ([stat, value]) => (stat === 'mood' || stat === 'health') && (value as number) < 0,
  );

  /**
   * How many opening paragraphs are the words the player wrote at the bench.
   *
   * The reducer puts the ruling at the head of the aftermath so the scene
   * follows the sentence. On screen that is the one line the reader already
   * knows, in capitals, above the only lines they do not.
   */
  const spoken = event && paragraphs.length > 1 && paragraphs[0].startsWith('"') ? 1 : 0;

  const built = last?.kind === 'work' ? getWork(last.refId) : undefined;

  const sealed =
    last?.kind === 'law'
      ? getProposal(last.refId)?.options.find(
          (o) => `${o.subject}_${o.action}` === last.choiceId,
        )
      : undefined;
  const opened = sealed ? threadsOf(sealed, 3, state) : [];

  /**
   * What a mark left on this screen is a mark on.
   *
   * Not the screen: the screen is the same every time. What is being judged
   * here is the consequence written for one answer, so the id carries the
   * answer as well as the thing answered, and a ruling that reads flat can be
   * told apart from the case that set it up.
   */
  const judged = !last
    ? null
    : event
      ? {
          id: `aftermath:case:${last.refId}:${last.choiceId}`,
          label: `${event.title} \u2192 ${choice?.text ?? last.choiceId}`,
        }
      : sealed
        ? { id: `aftermath:law:${last.refId}:${last.choiceId}`, label: sealed.label }
        : built
          ? { id: `aftermath:work:${last.refId}`, label: built.name }
          : { id: `aftermath:${last.kind}:${last.refId}`, label: last.refId };

  return (
    <div className="p-5">
      {/* What this is, and the law it came out of, on one line.

          The law used to be a block of its own quoting the whole sentence in
          capitals, on a screen that already quotes the ruling the player wrote
          a second earlier and then says what came of it. The number is the
          reference; the sentence stands in the Standing panel and in the
          Codex. */}
      <h2 className={`mb-3 ${TYPE.label} text-parchment-dim`}>
        {UI.aftermath.heading}
        {cause && (
          <>
            {' \u00b7 '}
            <span className="text-seal">{lawNumber(state, cause) ?? UI.aftermath.aLaw}</span>
          </>
        )}
        {who && <span className="text-parchment"> &middot; {who}</span>}
      </h2>

      {/* What came of the answer, judged separately from the case that asked
          it: a good case can still end in a flat paragraph. */}
      {judged && (
        <DevVerdict
          id={judged.id}
          label={judged.label}
          turn={state.turn}
          dev={dev}
          wide
          className="mb-3"
        />
      )}

      {/* The first law used to be explained here, on a card a sealed law never
          reaches: the app shows the seal in place of this screen when the last
          thing decided was a decree, so the block was never once seen. It is on
          the seal itself now, which is where the reader actually is. */}

      {event && who ? (
        <section className="flex gap-3 rounded-lg border border-ink-line bg-ink-soft p-4">
          <span className="shrink-0">
            <PersonPortrait character={event.character} size={56} grim={hurt} />
          </span>
          {/* The first paragraph is the sentence the player just pronounced,
              said back to them on the next screen in quotes. They wrote it. It
              is in the log, and this card is for what came of it. */}
          <div className="min-w-0 space-y-3">
            {paragraphs.slice(spoken).map((p, i) => (
              <p key={i} className={`${TYPE.body} leading-relaxed text-parchment/90`}>
                {p}
              </p>
            ))}
          </div>
        </section>
      ) : (
        <section className="space-y-3 rounded-lg border border-ink-line bg-ink-soft p-4">
          {built && (
            <div className={`${TYPE.label} text-parchment-dim`}>
              {built.name}
            </div>
          )}
          {paragraphs.map((p, i) => (
            <p key={i} className={`${TYPE.body} leading-relaxed text-parchment/90`}>
              {p}
            </p>
          ))}
          {noChange && changes.length === 0 && (
            <p className={`${TYPE.note} text-parchment-dim`}>{UI.aftermath.noChange}</p>
          )}
        </section>
      )}

      {/* And what it came to. The card used to say what happened to the person
          and what changed in the town and never once said what the answer did
          to the boards, so a player who wanted the number had to open the
          ledger and work back to it. It is the same row of marks the year of
          work and the drafting table use, in the same order. */}
      {!noChange && (
        <section className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg border border-ink-line bg-ink/60 p-3">
          <h3 className={`${TYPE.label} text-parchment-dim`}>{UI.aftermath.moved}</h3>
          {/* Whole numbers, and the mark said once for all of them. It used to
              read "+3.6 rises" beside "-1.2", so one row carried a tenth and an
              adjective and the next carried only a tenth. */}
          <MovedBoards row plain bare once={roundDeltas(data?.deltas)} place={state} />
          <span className={`${TYPE.label} text-parchment-dim`}>{UI.aftermath.allAtOnce}</span>
        </section>
      )}

      {/* What changed out there is a line under the scene, not a headed
          section over a list of one. */}
      {changes.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {changes.map(({ flag, on }) => {
            const label = CITY_LABELS[flag];
            return (
              <li key={flag} className={`flex items-center gap-2 ${TYPE.note}`}>
                <span aria-hidden>{label.emoji}</span>
                <span className={on ? 'text-parchment' : 'text-parchment-dim'}>
                  {on ? label.on : label.off}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {opened.length > 0 && (
        <section className="mt-3 rounded-lg border border-ink-line bg-ink/60 p-3">
          <h3 className={`mb-2 ${TYPE.label} text-parchment-dim`}>
            {UI.story.opened}
          </h3>
          <ul className="space-y-1">
            {opened.map((thread) => (
              <li key={thread.id} className={`flex items-center gap-2 ${TYPE.note}`}>
                <span aria-hidden>{characterMeta(thread.who).emoji}</span>
                <span className="text-parchment/90">{thread.title}</span>
                {thread.needs && (
                  <span className="text-parchment-dim">
                    {UI.story.whenBuilt.replace(
                      '{what}',
                      PLACE_NAMES[thread.needs] ?? getWork(thread.needs)?.name ?? '',
                    )}
                  </span>
                )}
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

      <CardFoot pad={5}>
        <button
          type="button"
          onClick={onContinue}
          className={`${CARD_BUTTON} bg-seal text-parchment active:brightness-110`}
        >
          {UI.aftermath.continueButton}
        </button>
      </CardFoot>
    </div>
  );
}
