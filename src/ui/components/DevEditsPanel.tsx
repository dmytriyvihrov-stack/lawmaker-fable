import { useState } from 'react';
import { UI } from '../../content/ui-strings';
import { clearAllDevEdits, formatDevEditsForExport } from '../dev/devEditsStore';
import { clearAllDevMarks, clearDevMark, formatDevMarksForExport, noteDev } from '../dev/devMarksStore';
import { useAllDevEdits } from '../dev/useDevEdit';
import { useAllDevMarks } from '../dev/useDevMarks';

/**
 * Everything a session left behind, in one place, ready to hand over.
 *
 * Two kinds of thing, one pad. The pencils leave a rewrite of a line that is
 * wrong; the thumbs leave a verdict on a thing that happened. They are made
 * with different hands and they are read by the same person afterwards, so
 * there is one button, one panel and one "copy all" rather than two of each
 * fighting over the same corner of the window.
 *
 * Nothing here reaches a content file: the button copies plain text, in the
 * shape a person pastes into a chat with whoever writes the content next.
 * "Clear" throws the pad away, on purpose, once a batch has actually been
 * sent: it is a scratch pad, not a second copy of the game's history.
 */
export function DevEditsPanel({ on }: { on: boolean }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [asking, setAsking] = useState(false);
  const edits = useAllDevEdits();
  const marks = useAllDevMarks();
  const edited = Object.keys(edits).length;
  const marked = Object.keys(marks).length;
  const count = edited + marked;

  if (!on || count === 0) return null;

  const rows = Object.values(edits).sort((a, b) => a.id.localeCompare(b.id));
  const markRows = Object.values(marks).sort((a, b) => a.turn - b.turn || a.id.localeCompare(b.id));

  const copyAll = async () => {
    const text = [formatDevMarksForExport(marks), formatDevEditsForExport(edits)]
      .filter(Boolean)
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard blocked: the text is still on screen to select by hand
    }
  };

  return (
    <div data-dev-chrome className="fixed bottom-11 right-2 z-[70]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded border border-seal bg-ink px-2 py-1 text-[10px] tracking-wide text-seal"
      >
        {count} pending
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-1 w-[360px] max-w-[88vw] rounded-md border border-seal bg-ink p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-[0.18em] text-parchment-dim">
              Pending
            </span>
            <span className="flex gap-1.5">
              <button
                type="button"
                onClick={copyAll}
                className="rounded bg-seal px-2 py-1 text-[11px] text-parchment"
              >
                {copied ? 'Copied' : 'Copy all'}
              </button>
              {/* No `window.confirm`: the preview pane answers it false, so
                  the button did nothing at all in the one place this panel is
                  most used. It asks in place instead. */}
              <button
                type="button"
                onClick={() => {
                  if (!asking) return setAsking(true);
                  clearAllDevEdits();
                  clearAllDevMarks();
                }}
                onBlur={() => setAsking(false)}
                className={`rounded border px-2 py-1 text-[11px] ${
                  asking ? 'border-bad text-bad' : 'border-ink-line text-parchment-dim'
                }`}
              >
                {asking ? 'Sure?' : 'Clear'}
              </button>
            </span>
          </div>
          <ul className="max-h-[50vh] space-y-2 overflow-y-auto">
            {/* The thumbs first: they are the walk through the reign, and the
                rewrites are what came out of stopping on the way. */}
            {markRows.length > 0 && (
              <li className="text-[9px] uppercase tracking-[0.18em] text-seal">
                {UI.dev.marksHeading} ({markRows.length})
              </li>
            )}
            {markRows.map((m) => (
              <li
                key={m.id}
                className="rounded border border-ink-line bg-ink-soft p-2 text-[11px] leading-snug"
              >
                <div className="mb-1 flex items-baseline gap-1.5">
                  <span aria-hidden>
                    {m.verdict === 'up' ? UI.dev.likeMark : m.verdict === 'down' ? UI.dev.dislikeMark : '·'}
                  </span>
                  <span className="min-w-0 flex-1 text-parchment">{m.label}</span>
                  <span className="shrink-0 text-[9px] lowercase text-parchment-dim">
                    year {m.turn}
                  </span>
                  <button
                    type="button"
                    onClick={() => clearDevMark(m.id)}
                    title={UI.dev.markDrop}
                    className="shrink-0 rounded-sm border border-ink-line px-1 text-[9px] leading-none text-parchment-dim hover:border-bad hover:text-bad"
                  >
                    ×
                  </button>
                </div>
                <div className="truncate text-[9px] uppercase tracking-wide text-parchment-dim/70">
                  {m.id}
                </div>
                {/* The why, typed here when there was no room for it out where
                    the thing happened: the map has none, and a run is walked
                    faster than a sentence is written. */}
                <input
                  defaultValue={m.note ?? ''}
                  key={`${m.id}:${m.note ?? ''}`}
                  onBlur={(e) => noteDev(m.id, m.label, e.target.value, m.turn)}
                  placeholder={UI.dev.markNote}
                  className="mt-1 w-full rounded-sm border border-ink-line bg-ink px-1 py-0.5 text-[10px] text-parchment"
                />
              </li>
            ))}

            {rows.length > 0 && (
              <li className="pt-1 text-[9px] uppercase tracking-[0.18em] text-seal">
                {UI.dev.editsHeading} ({rows.length})
              </li>
            )}
            {rows.map((e) => (
              <li key={e.id} className="rounded border border-ink-line bg-ink-soft p-2 text-[11px] leading-snug">
                <div className="mb-1 truncate text-[9px] uppercase tracking-wide text-seal">
                  {e.id}
                </div>
                {e.removed && (
                  <>
                    <div className="text-parchment-dim/70 line-through">{e.original}</div>
                    <div className="text-bad">cut from the game</div>
                  </>
                )}
                {!e.removed && e.text !== undefined && (
                  <>
                    <div className="text-parchment-dim/70 line-through">{e.original}</div>
                    <div className="text-parchment">{e.text}</div>
                  </>
                )}
                {!e.removed && e.text === undefined && (
                  <div className="text-parchment/85">{e.original}</div>
                )}
                {e.note && <div className="mt-1 text-seal">note: {e.note}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
