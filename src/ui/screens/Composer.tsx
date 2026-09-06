import { useState } from 'react';
import { SUBJECT_WORDS, buildLabel, predicateFor } from '../../content/law-words';
import { ACTIONS, SUBJECTS } from '../../content/meta';
import { PersonPortrait } from '../components/PersonPortrait';
import { PopupHead } from '../components/Popup';
import { UI } from '../../content/ui-strings';
import { getProposal } from '../../engine/registry';
import { openProposals } from '../../engine/reducer';
import { CONFIG } from '../../engine/config';
import { growthPercentOf, lawTrend, scaleEffects } from '../../engine/simulation';
import { renderTemplate } from '../../engine/format';
import { MovedBoards } from '../components/MovedBoards';
import { DevEffects } from '../components/DevCorner';
import { DevText } from '../components/DevText';
import { TYPE } from '../type';
import type { ActionId, GameState, Proposal, Season, SubjectId } from '../../engine/types';

interface Props {
  state: GameState;
  dev?: boolean;
  season: Season;
  onSeal: (proposalId: string, optionIdx: number, label: string) => void;
}

/**
 * The drafting table, as a document.
 *
 * A decree is one subject and one predicate, and that whole sentence is what
 * the place quotes back at you for the rest of your reign. The card is headed
 * and has the wax on it, because you can see from the top of it how this ends.
 *
 * The person who brought the question stands in the margin of the document
 * rather than beside it. They are not neutral and never were: the Captain
 * wants a watch and the Fool wants a holiday, and hearing that before you seal
 * is the difference between a decision and a guess.
 */
export function Composer({ state, dev = false, season, onSeal }: Props) {
  const current = state.current;
  const [subject, setSubject] = useState<SubjectId | null>(null);
  const [action, setAction] = useState<ActionId | null>(null);

  const reopening = state.reopening !== null;
  const ids = reopening
    ? [state.reopening as string]
    : (() => {
        const open = openProposals(state);
        const id = current?.kind === 'proposal' ? current.id : null;
        return id && !open.includes(id) ? [id, ...open] : open;
      })();
  const proposals = ids.map(getProposal).filter((p): p is Proposal => Boolean(p));
  if (proposals.length === 0) return null;

  /** Every option on the table this year, from every law that is open. */
  const table = proposals.flatMap((p) => p.options.map((o, i) => ({ p, o, i })));

  const openSubjects = new Set<SubjectId>(table.map((t) => t.o.subject));
  const openActions = new Set<ActionId>(
    table.filter((t) => subject === null || t.o.subject === subject).map((t) => t.o.action),
  );

  const picked =
    subject !== null && action !== null
      ? table.find((t) => t.o.subject === subject && t.o.action === action)
      : undefined;
  const proposal = picked?.p ?? table.find((t) => t.o.subject === subject)?.p ?? proposals[0];

  const label = picked ? buildLabel(picked.o.subject, picked.o.action) : null;
  // what it will do, in the units the place will actually feel
  const onceRaw = picked ? (scaleEffects(picked.o.effects, CONFIG.law.sealScale) ?? {}) : {};
  const everyRaw = picked ? lawTrend(state, picked.o) : {};
  // "more of them" and "more of them" are the same two words for two different laws
  const growth = picked ? growthPercentOf(state, picked.o) : null;
  const standing = state.laws.find((l) => l.status === 'active' && l.subject === subject);
  const advice = proposal.advice;
  const advised = advice ? proposal.options[advice.option] : undefined;

  const chooseSubject = (id: SubjectId) => {
    if (!openSubjects.has(id)) return;
    if (subject === id) {
      setSubject(null);
      setAction(null);
      return;
    }
    setSubject(id);
    if (!table.some((t) => t.o.subject === id && t.o.action === action)) setAction(null);
  };

  const chooseAction = (id: ActionId) => {
    if (subject === null || !table.some((t) => t.o.subject === subject && t.o.action === id)) return;
    setAction(action === id ? null : id);
  };

  const chip = `answer min-h-[34px] rounded-lg border px-3 py-1.5 ${TYPE.note} tracking-wide`;
  const row = `answer min-h-[38px] w-full rounded-lg border px-3.5 py-2 text-left ${TYPE.note} tracking-wide`;
  const open = 'border-ink-line bg-ink-soft text-parchment';
  const chosen = 'border-seal bg-seal/25 text-parchment';
  const held = 'border-seal/50 bg-ink-soft text-parchment';

  return (
    <>
      <PopupHead
        kicker={`${UI.popup.draftingTable} · ${UI.popup.ofYear
          .replace('{season}', UI.seasons[season])
          .replace('{n}', String(state.turn))}`}
      />
      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_336px]">
        {/* The sentence, which is the document. It is what the reign is
            actually made of, so it gets the width and the matter that raised
            it stands in the margin beside it rather than in front of it. */}
        <section className="min-w-0 rounded-xl border border-ink-line bg-ink/60 p-4">
          <div className={`${TYPE.label} text-parchment-dim`}>{UI.popup.lawWillRead}</div>
          {/* The document. It is the point of this screen, so it is the one
              thing on it set at display size. */}
          <p className={`mt-2 ${TYPE.display} leading-tight`}>
            <span className={subject ? 'text-parchment' : 'text-hair'}>
              {subject ? SUBJECT_WORDS[subject] : UI.composer.blankSubject}{' '}
            </span>
            <span className={action ? 'text-parchment' : 'text-hair'}>
              {subject && action ? predicateFor(subject, action) : UI.composer.blankPredicate}
            </span>
          </p>

          {/* the subjects that are on the table today, as tiles */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {SUBJECTS.filter((s) => openSubjects.has(s.id)).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => chooseSubject(s.id)}
                title={s.label}
                className={`${chip} ${subject === s.id ? chosen : open}`}
              >
                <span aria-hidden className="mr-1">
                  {s.emoji}
                </span>
                {s.label}
              </button>
            ))}
          </div>

          {/* and the predicates, in full lines, because they are sentences */}
          {subject !== null && (
            <div className="mt-2 space-y-1.5">
              {ACTIONS.filter((a) => openActions.has(a.id)).map((a) => {
                const isStanding = standing !== undefined && standing.action === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => chooseAction(a.id)}
                    title={a.label}
                    className={`${row} ${action === a.id ? chosen : isStanding ? held : open}`}
                  >
                    {predicateFor(subject, a.id)}
                    {isStanding && (
                      <span className={`ml-1.5 ${TYPE.label} text-seal`}>
                        {UI.composer.standing}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* what it will do, in the units the place will feel, and the wax
              beside it: the two are one decision and sit on one line */}
          <div className="mt-3 flex items-end justify-between gap-3 border-t border-ink-line pt-2">
          <div className="min-h-[52px] min-w-0 flex-1">
            {picked ? (
              <>
                <div className={`${TYPE.label} text-parchment-dim`}>{UI.popup.whatItDoes}</div>
                <MovedBoards
                  className="mt-1"
                  once={onceRaw}
                  every={everyRaw}
                  place={state}
                  emptyLine={UI.story.movesNothing}
                />
                {growth !== null && (
                  <div className={`mt-1 flex items-baseline gap-2 ${TYPE.note}`}>
                    <span aria-hidden className="w-4">
                      🚶
                    </span>
                    <span
                      className={`w-8 shrink-0 tabular-nums ${
                        growth > 0 ? 'text-good' : 'text-parchment-dim'
                      }`}
                    >
                      +{growth}%
                    </span>
                    <span className="flex-1 text-parchment/85">{UI.story.whoComes}</span>
                    <span className={`${TYPE.label} text-seal`}>{UI.seal.everyYear}</span>
                  </div>
                )}
                {picked.o.perTurnWatch && (
                  <p className={`mt-1.5 ${TYPE.note} leading-snug text-parchment-dim`}>
                    {UI.story.watchNote}
                  </p>
                )}
                {dev && (
                  <DevEffects
                    raw={picked.o.effects}
                    felt={scaleEffects(picked.o.effects, CONFIG.law.sealScale)}
                    extra={[['perTurn', JSON.stringify(picked.o.perTurn ?? {})]]}
                  />
                )}
              </>
            ) : (
              <p className={`${TYPE.note} text-parchment-dim`}>{UI.composer.pickPrompt}</p>
            )}
          </div>

          <button
            type="button"
            disabled={!picked || label === null}
            onClick={() => picked && label !== null && onSeal(picked.p.id, picked.i, label)}
            className={`min-h-[40px] shrink-0 rounded-lg bg-seal px-7 ${TYPE.body} tracking-[0.18em] text-parchment disabled:opacity-30`}
          >
            {UI.composer.seal}
          </button>
          </div>
          {reopening && (
            <p className={`mt-2 text-center ${TYPE.note} text-parchment-dim`}>
              {UI.composer.reopenCost
                .replace('{crown}', String(Math.abs(CONFIG.reopen.crownSanity)))
                .replace('{mood}', String(Math.abs(CONFIG.reopen.mood)))}
            </p>
          )}
        </section>
        {/* the matter, and the advisor in the margin of it */}
        <section className="order-first min-w-0 lg:order-last">
          {reopening && (
            <p className={`mb-3 border-l-4 border-seal bg-seal/10 px-3 py-2 ${TYPE.note} leading-snug text-parchment`}>
              {UI.composer.reopenLine}
            </p>
          )}
          <h2 className={`${TYPE.title} leading-tight`}>{proposal.title}</h2>
          <div className="mt-2 space-y-1.5">
            {proposal.problem.map((p, i) => (
              <p key={i} className={`${TYPE.note} leading-relaxed text-parchment-dim`}>
                <DevText
                  id={`proposal:${proposal.id}:problem:${i}`}
                  text={renderTemplate(p, state)}
                  dev={dev}
                />
              </p>
            ))}
          </div>

          {advice && advised && (
            <div className="mt-3 flex gap-3 border-t border-ink-line pt-2.5">
              <span className="shrink-0">
                <PersonPortrait character={proposal.advisor} size={54} />
              </span>
              <div className="min-w-0">
                <div className={`${TYPE.label} text-seal`}>
                  {UI.popup.inTheMargin}
                </div>
                <p className={`mt-1 ${TYPE.note} italic leading-relaxed text-parchment`}>
                  <DevText
                    id={`proposal:${proposal.id}:advice`}
                    text={advice.line}
                    dev={dev}
                  />
                </p>
              </div>
            </div>
          )}

          {proposals.length > 1 && (
            <p className={`mt-3 ${TYPE.note} leading-snug text-hair`}>{UI.composer.manyLaws}</p>
          )}
        </section>

      </div>
    </>
  );
}
