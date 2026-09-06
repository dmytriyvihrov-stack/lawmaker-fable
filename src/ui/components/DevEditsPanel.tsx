import { useState } from 'react';
import { clearAllDevEdits, formatDevEditsForExport } from '../dev/devEditsStore';
import { useAllDevEdits } from '../dev/useDevEdit';

/**
 * Everything left on the pencil marks, in one place, ready to hand over.
 *
 * Nothing here reaches a content file: the button copies plain text, in the
 * shape a person pastes into a chat with whoever writes the content next.
 * "Clear" throws the pad away, on purpose, once a batch has actually been
 * sent — it is a scratch pad, not a second copy of the game's history.
 */
export function DevEditsPanel({ on }: { on: boolean }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const edits = useAllDevEdits();
  const count = Object.keys(edits).length;

  if (!on || count === 0) return null;

  const rows = Object.values(edits).sort((a, b) => a.id.localeCompare(b.id));

  const copyAll = async () => {
    const text = formatDevEditsForExport(edits);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard blocked: the text is still on screen to select by hand
    }
  };

  return (
    <div className="fixed bottom-11 right-2 z-40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded border border-seal bg-ink px-2 py-1 text-[10px] tracking-wide text-seal"
      >
        {count} edit{count === 1 ? '' : 's'} pending
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-1 w-[360px] max-w-[88vw] rounded-md border border-seal bg-ink p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-[0.18em] text-parchment-dim">
              Pending edits
            </span>
            <span className="flex gap-1.5">
              <button
                type="button"
                onClick={copyAll}
                className="rounded bg-seal px-2 py-1 text-[11px] text-parchment"
              >
                {copied ? 'Copied' : 'Copy all'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Clear every pending edit? This does not undo anything already sent.')) {
                    clearAllDevEdits();
                  }
                }}
                className="rounded border border-ink-line px-2 py-1 text-[11px] text-parchment-dim"
              >
                Clear
              </button>
            </span>
          </div>
          <ul className="max-h-[50vh] space-y-2 overflow-y-auto">
            {rows.map((e) => (
              <li key={e.id} className="rounded border border-ink-line bg-ink-soft p-2 text-[11px] leading-snug">
                <div className="mb-1 truncate text-[9px] uppercase tracking-wide text-seal">
                  {e.id}
                </div>
                {e.text !== undefined && (
                  <>
                    <div className="text-parchment-dim/70 line-through">{e.original}</div>
                    <div className="text-parchment">{e.text}</div>
                  </>
                )}
                {e.text === undefined && <div className="text-parchment/85">{e.original}</div>}
                {e.note && <div className="mt-1 text-seal">note: {e.note}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
