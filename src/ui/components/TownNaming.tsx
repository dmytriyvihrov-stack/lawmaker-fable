import { useState } from 'react';
import { FIRST_WORDS, SECOND_WORDS, joinTownName } from '../../content/town-names';
import { UI } from '../../content/ui-strings';

interface Props {
  /** Fires with the finished name, two words and a space. */
  onName: (name: string) => void;
}

function Tile({
  text,
  picked,
  onClick,
}: {
  text: string;
  picked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[36px] rounded-md border px-3 text-[13px] tracking-wide ${
        picked
          ? 'border-seal bg-ink-line/60 text-parchment'
          : 'border-ink-line text-parchment-dim hover:text-parchment'
      }`}
    >
      {text}
    </button>
  );
}

/**
 * The place gets a name the same way a law gets written: two lists of words,
 * one from each, and whatever comes out is what everybody says from then on.
 * It costs nothing and moves no board. It is the first thing in the reign that
 * is purely yours.
 */
export function TownNaming({ onName }: Props) {
  const [first, setFirst] = useState<string | null>(null);
  const [second, setSecond] = useState<string | null>(null);
  const ready = first !== null && second !== null;
  const reads = ready
    ? joinTownName(first, second)
    : `${first ?? UI.townName.blank} ${second ?? UI.townName.blank}`;

  return (
    <div
      role="dialog"
      aria-label={UI.townName.heading}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/80 px-5 py-8 backdrop-blur-sm"
    >
      <div className="drift-in w-full max-w-md rounded-lg border border-seal bg-ink-soft p-5">
        <div className="text-[10px] uppercase tracking-[0.2em] text-seal">
          {UI.townName.kicker}
        </div>
        <h2 className="mt-1 text-lg leading-tight tracking-wide">{UI.townName.heading}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-parchment/90">{UI.townName.lead}</p>

        <div className="mt-4 rounded-md border border-ink-line bg-ink/60 p-3">
          <div className="text-[10px] uppercase tracking-[0.18em] text-parchment-dim">
            {UI.townName.reads}
          </div>
          <div className="mt-1 text-xl leading-tight tracking-wide">{reads}</div>
        </div>

        <div className="mt-4 text-[10px] uppercase tracking-[0.18em] text-parchment-dim">
          {UI.townName.firstLabel}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {FIRST_WORDS.map((word) => (
            <Tile
              key={word.id}
              text={word.text}
              picked={first === word.text}
              onClick={() => setFirst(word.text)}
            />
          ))}
        </div>

        <div className="mt-4 text-[10px] uppercase tracking-[0.18em] text-parchment-dim">
          {UI.townName.secondLabel}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {SECOND_WORDS.map((word) => (
            <Tile
              key={word.id}
              text={word.text}
              picked={second === word.text}
              onClick={() => setSecond(word.text)}
            />
          ))}
        </div>

        <button
          type="button"
          disabled={!ready}
          onClick={() => ready && onName(joinTownName(first, second))}
          className="mt-5 min-h-[44px] w-full rounded-md border border-seal bg-seal/20 text-[14px] tracking-[0.15em] text-parchment disabled:border-ink-line disabled:bg-transparent disabled:text-parchment-dim"
        >
          {UI.townName.confirm}
        </button>
        {!ready && (
          <p className="mt-2 text-[12px] leading-snug text-parchment-dim">
            {UI.townName.pickBoth}
          </p>
        )}
      </div>
    </div>
  );
}
