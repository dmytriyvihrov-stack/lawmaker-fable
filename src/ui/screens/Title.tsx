import { UI } from '../../content/ui-strings';
import type { Stage } from '../../engine/types';

const CHAPTERS: Stage[] = ['village', 'town', 'kingdom'];

interface Props {
  hasSave: boolean;
  /** A reign is in the slot and this version cannot open it. Say so. */
  staleSave?: boolean;
  onNew: () => void;
  onContinue: () => void;
  /** The dev switch in the corner, which is the gate on the row below. */
  dev?: boolean;
  /** Open a fabricated reign at a chapter, for looking at a later stage. */
  onBeginAt?: (chapter: Stage) => void;
}

export function Title({ hasSave, staleSave = false, onNew, onContinue, dev = false, onBeginAt }: Props) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-8 px-6 text-center">
      <div>
        <div aria-hidden className="mb-4 text-5xl">
          👑
        </div>
        <h1 className="text-3xl leading-tight tracking-wide">{UI.title.name}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-parchment-dim">{UI.title.tagline}</p>
        {/* An hour of somebody's play used to disappear behind a missing
            Continue button and no sentence at all. */}
        {staleSave && (
          <p className="mx-auto mt-4 max-w-sm rounded-md border border-bad/50 bg-bad/[0.08] px-3 py-2 text-[13px] leading-relaxed text-bad">
            {UI.title.staleSave}
          </p>
        )}
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={onNew}
          className="min-h-[52px] rounded-md bg-seal px-5 py-3 text-lg tracking-wide text-parchment active:brightness-110"
        >
          {UI.title.newGame}
        </button>
        {hasSave && (
          <button
            type="button"
            onClick={onContinue}
            className="min-h-[52px] rounded-md border border-ink-line bg-ink-soft px-5 py-3 text-lg tracking-wide text-parchment active:bg-ink-line"
          >
            {UI.title.continueGame}
          </button>
        )}

        {/* The three stages are ten years apart from each other, which is right
            for a player and useless for anybody who has to look at the last one
            twice in an afternoon. Behind the dev switch, and nowhere else. */}
        {dev && onBeginAt && (
          <div className="flex items-baseline justify-center gap-3 text-[11px] uppercase tracking-[0.18em] text-parchment-dim">
            <span>{UI.title.beginAt}</span>
            {CHAPTERS.map((chapter) => (
              <button
                key={chapter}
                type="button"
                onClick={() => onBeginAt(chapter)}
                className="underline decoration-dotted underline-offset-4 hover:text-parchment"
              >
                {UI.world.chapters[chapter]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
