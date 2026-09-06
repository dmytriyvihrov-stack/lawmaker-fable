import { UI } from '../../content/ui-strings';

interface Props {
  hasSave: boolean;
  onNew: () => void;
  onContinue: () => void;
}

export function Title({ hasSave, onNew, onContinue }: Props) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-8 px-6 text-center">
      <div>
        <div aria-hidden className="mb-4 text-5xl">
          👑
        </div>
        <h1 className="text-3xl leading-tight tracking-wide">{UI.title.name}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-parchment-dim">{UI.title.tagline}</p>
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
      </div>
    </div>
  );
}
