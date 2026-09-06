import { UI } from '../../content/ui-strings';
import { formatLaw } from '../../engine/format';
import type { GameState, LawId } from '../../engine/types';

interface Props {
  lawId: LawId;
  state: GameState;
}

/** The visible thread: this scene exists because you sealed that law. */
export function CauseChip({ lawId, state }: Props) {
  return (
    <div className="mb-3 flex items-start gap-2 rounded-md border-l-2 border-seal bg-seal/10 px-3 py-2">
      <span aria-hidden className="text-sm leading-5">
        📜
      </span>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.18em] text-seal">
          {UI.story.becauseOf}
        </div>
        <div className="text-[12px] leading-snug text-parchment-dim">
          {formatLaw(state, lawId)}
        </div>
      </div>
    </div>
  );
}
