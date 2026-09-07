import { UI } from '../../content/ui-strings';
import { roman } from '../../engine/format';
import { epithetOf } from '../../engine/epithet';
import { chronicle } from '../../engine/story';
import { characterMeta } from '../../content/meta';
import { getCase } from '../../engine/registry';
import type { GameState } from '../../engine/types';

interface Props {
  state: GameState;
  onClose: () => void;
}

export function Codex({ state, onClose }: Props) {
  const epithet = epithetOf(state);
  const chain = chronicle(state);
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-xl border border-ink-line bg-ink p-4 sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg tracking-wide">📜 {UI.codex.heading}</h2>
            {/* whose laws these are, which the book itself never used to say */}
            {state.townName && (
              <div className="truncate text-[12px] text-parchment-dim">{state.townName}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={UI.codex.close}
            className="min-h-[44px] min-w-[44px] shrink-0 rounded-md border border-ink-line text-parchment-dim"
          >
            ✕
          </button>
        </header>

        {/* No monarch block in here.

            The face upstairs, their age and what they are like are on the crown
            card, in the corner of the map, all reign. Repeating the lot at the
            top of the book of laws pushed the laws themselves below the fold
            and said nothing the player had not already read. What stays is the
            one line that is about this reign rather than about them: what the
            place has settled on calling you. */}
        {epithet && (
          <p className="mb-4 rounded-md border border-ink-line bg-ink-soft p-3 text-[13px] leading-relaxed text-parchment/90">
            {UI.epithet.calledYou.replace('{name}', epithet.name)}
          </p>
        )}

        {state.laws.length === 0 && <p className="text-[14px] text-parchment-dim">{UI.codex.empty}</p>}

        {chain.length > 0 && (
          <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-parchment-dim">
            {UI.story.chronicleHeading}
          </div>
        )}

        <ul className="space-y-4">
          {state.laws.map((law, i) => {
            const dead = law.status !== 'active';
            const related = state.exceptions.filter(
              (e) => e.law === `${law.subject}_${law.action}`,
            );
            const caused = chain[i]?.consequences ?? [];
            return (
              <li key={`${law.subject}_${law.action}_${i}`} className="border-l-2 border-ink-line pl-3">
                <div className={dead ? 'text-parchment-dim line-through' : 'text-parchment'}>
                  <span className="text-[13px] tracking-[0.15em]">LAW {roman(i + 1)}</span>
                  <span className="mx-1">-</span>
                  <span className="text-[15px]">"{law.label}"</span>
                </div>
                <div className="text-[12px] text-parchment-dim">
                  {UI.codex.sealedOn} {law.turn}
                  {dead && ` · ${law.status === 'replaced' ? UI.codex.replaced : UI.codex.repealed}`}
                </div>
                {related.map((e, k) => (
                  <div key={k} className="mt-1 text-[12px] text-seal">
                    {UI.codex.exceptionLine
                      .replace('{who}', e.beneficiary)
                      .replace('{turn}', String(e.turn))}
                  </div>
                ))}
                {caused.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {caused.map((c, k) => (
                      <li key={k} className="flex items-center gap-2 text-[12px] text-parchment-dim">
                        <span aria-hidden className="text-parchment-dim">
                          ↳
                        </span>
                        <span aria-hidden>{characterMeta(getCase(c.caseId)?.character).emoji}</span>
                        <span className="text-parchment/80">{c.title}</span>
                        <span className="text-[11px]">t{c.turn}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
