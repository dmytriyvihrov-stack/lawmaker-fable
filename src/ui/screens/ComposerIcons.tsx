import { useState } from 'react';
import { ACTIONS, PLACE_NAMES, STATS, SUBJECTS } from '../../content/meta';
import { UI } from '../../content/ui-strings';
import { getProposal, getWork } from '../../engine/registry';
import { threadsOf } from '../../engine/story';
import { characterMeta } from '../../content/meta';
import type { ActionId, GameState, StatId, SubjectId } from '../../engine/types';

interface Props {
  state: GameState;
  onSeal: (optionIdx: number) => void;
}

/**
 * The earlier icon grid version of the drafting table, kept on purpose.
 * Not wired into App: the word builder in Composer.tsx replaced it.
 */
export function ComposerIcons({ state, onSeal }: Props) {
  const current = state.current;
  const proposal = current && current.kind === 'proposal' ? getProposal(current.id) : undefined;
  const [subject, setSubject] = useState<SubjectId | null>(null);
  const [action, setAction] = useState<ActionId | null>(null);

  if (!proposal) return null;
  const options = proposal.options;

  const openSubjects = new Set<SubjectId>(options.map((o) => o.subject));
  const openActions = new Set<ActionId>(
    options.filter((o) => subject === null || o.subject === subject).map((o) => o.action),
  );

  const picked =
    subject !== null && action !== null
      ? options.findIndex((o) => o.subject === subject && o.action === action)
      : -1;
  const option = picked >= 0 ? options[picked] : null;

  const arrows: { stat: StatId; up: boolean }[] = [];
  if (option) {
    for (const stat of STATS) {
      const total = (option.effects[stat.id] ?? 0) + (option.perTurn?.[stat.id] ?? 0);
      if (total !== 0) arrows.push({ stat: stat.id, up: total > 0 });
    }
  }
  const threads = option ? threadsOf(option, 3, state) : [];

  const chooseSubject = (id: SubjectId) => {
    if (!openSubjects.has(id)) return;
    setSubject(id);
    const stillValid = options.some((o) => o.subject === id && o.action === action);
    if (!stillValid) setAction(null);
  };

  const chooseAction = (id: ActionId) => {
    if (subject === null || !options.some((o) => o.subject === subject && o.action === id)) return;
    setAction(id);
  };

  return (
    <div className="px-4 pb-6">
      <h2 className="mb-1 text-lg tracking-wide">{UI.composer.heading}</h2>
      <p className="mb-4 text-[13px] text-parchment-dim">{UI.composer.pickPrompt}</p>

      <div className="mb-4">
        <div className="mb-2 text-[11px] uppercase tracking-[0.15em] text-parchment-dim">
          {UI.composer.subjectsLabel}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {SUBJECTS.map((s) => {
            const open = openSubjects.has(s.id);
            const active = subject === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => chooseSubject(s.id)}
                disabled={!open}
                title={open ? s.label : UI.composer.locked}
                aria-label={s.label}
                className={`answer flex aspect-square min-h-[44px] flex-col items-center justify-center rounded-md border text-xl ${
                  active
                    ? 'border-seal bg-seal/25'
                    : open
                      ? 'border-ink-line bg-ink-soft'
                      : 'border-transparent bg-ink-soft/40 opacity-35'
                }`}
              >
                <span aria-hidden>{open ? s.emoji : '🔒'}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-5">
        <div className="mb-2 text-[11px] uppercase tracking-[0.15em] text-parchment-dim">
          {UI.composer.actionsLabel}
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {ACTIONS.map((a) => {
            const open = subject !== null && openActions.has(a.id);
            const active = action === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => chooseAction(a.id)}
                disabled={!open}
                title={open ? a.label : UI.composer.locked}
                aria-label={a.label}
                className={`answer flex aspect-square min-h-[44px] items-center justify-center rounded-md border text-xl ${
                  active
                    ? 'border-seal bg-seal/25'
                    : open
                      ? 'border-ink-line bg-ink-soft'
                      : 'border-transparent bg-ink-soft/40 opacity-35'
                }`}
              >
                <span aria-hidden>{open ? a.emoji : '🔒'}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-[132px] rounded-lg border border-dashed border-ink-line bg-ink-soft/60 p-4">
        {option ? (
          <>
            <p className="text-[17px] leading-snug tracking-wide">{option.label}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-[11px] uppercase tracking-[0.15em] text-parchment-dim">
                {UI.composer.effectsLabel}
              </span>
              {arrows.map(({ stat, up }) => {
                const meta = STATS.find((s) => s.id === stat)!;
                return (
                  <span key={stat} className="flex items-center gap-1 text-base">
                    <span aria-hidden>{meta.emoji}</span>
                    <span className={up ? 'text-good' : 'text-bad'}>{up ? '▲' : '▼'}</span>
                  </span>
                );
              })}
            </div>

            <div className="mt-4 border-t border-ink-line pt-3">
              <div className="text-[11px] uppercase tracking-[0.15em] text-parchment-dim">
                {UI.story.opens}
              </div>
              {threads.length === 0 ? (
                <p className="mt-1 text-[13px] text-parchment-dim">{UI.story.opensNothing}</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {threads.map((thread) => (
                    <li key={thread.id} className="flex items-center gap-2 text-[13px]">
                      <span aria-hidden>{characterMeta(thread.who).emoji}</span>
                      <span className="text-parchment/90">{thread.title}</span>
                      {thread.kind === 'proposal' && (
                        <span className="text-[11px] text-parchment-dim">
                          {UI.story.laterDecree}
                        </span>
                      )}
                      {thread.needs && (
                        <span className="text-[11px] text-parchment-dim">
                          {UI.story.whenBuilt.replace(
                            '{what}',
                            PLACE_NAMES[thread.needs] ?? getWork(thread.needs)?.name ?? '',
                          )}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <p className="text-[14px] text-parchment-dim">{UI.composer.pickPrompt}</p>
        )}
      </div>

      <button
        type="button"
        disabled={picked < 0}
        onClick={() => picked >= 0 && onSeal(picked)}
        className="mt-4 min-h-[56px] w-full rounded-md bg-seal px-5 py-3 text-xl tracking-[0.2em] text-parchment disabled:opacity-30"
      >
        {UI.composer.seal}
      </button>
    </div>
  );
}
