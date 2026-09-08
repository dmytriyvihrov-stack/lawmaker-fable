import { UI } from '../../content/ui-strings';
import { roman } from '../../engine/format';
import { epithetOf } from '../../engine/epithet';
import { findLawOption } from '../../engine/registry';
import { lawTrend } from '../../engine/simulation';
import { MovedBoards } from '../components/MovedBoards';
import type { GameState } from '../../engine/types';

interface Props {
  state: GameState;
  onClose: () => void;
}

export function Codex({ state, onClose }: Props) {
  const epithet = epithetOf(state);
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

        {state.laws.length > 0 && (
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
            /**
             * What this law is costing or paying the place this year.
             *
             * Read off the law itself through the same function the year uses,
             * at this reign's weight and this stage's scale, so the number
             * here and the number the store actually gets are one number. A
             * hamlet law that turns at scale reads differently in the town it
             * grew into, and it should.
             */
            const option = findLawOption(law.subject, law.action, law.label);
            const pays = !dead && option ? lawTrend(state, option) : null;
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
                <div className="mt-2 border-t border-ink-line pt-1.5">
                  <div className="text-[10px] uppercase tracking-[0.15em] text-parchment-dim">
                    {UI.codex.paysHeading}
                  </div>
                  <div className="mt-1">
                    {pays === null ? (
                      <p className="text-[12px] leading-snug text-parchment-dim">
                        {UI.codex.paysGone}
                      </p>
                    ) : (
                      <MovedBoards
                        every={pays}
                        place={state}
                        bare
                        emptyLine={UI.codex.paysNothing}
                      />
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
