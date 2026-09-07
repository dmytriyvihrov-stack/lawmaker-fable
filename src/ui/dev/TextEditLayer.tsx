import { useEffect, useRef, useState } from 'react';
import {
  getDevEditsSnapshot,
  idForText,
  resetDevEdit,
  saveDevEdit,
  subscribeDevEdits,
  type DevEdit,
} from './devEditsStore';

/**
 * The pencil, on any line in the game, without anybody having wired it up
 * first.
 *
 * The wired pencils (`DevText`, `DevEditTrigger`, `HoverText`) are the tidy
 * version: a hand written id, an edit filed under the exact piece of content
 * it belongs to. There are eight of them, and the game has several thousand
 * lines, so the answer to "this sentence is wrong" was almost always "not that
 * one, then".
 *
 * This is the untidy version, and it reaches everything. While the switch is
 * on the game stops taking clicks, and every click picks up the line under the
 * pointer instead: rewrite it, cut it, or leave a note for whoever writes the
 * content next. What it does not do is write to a content file, because a
 * browser tab cannot. The rewrite shows on screen straight away, so a line can
 * be read in the scene it belongs to, and the batch is copied out of the
 * pending edits panel and applied by hand.
 *
 * How the override lands is the part worth knowing. There is no id to look up,
 * so an edit is filed under what the line says, and applied by walking the
 * text nodes and swapping any whose text matches. React owns those nodes and
 * puts the original back whenever it redraws that subtree, so a
 * `MutationObserver` puts the override back after it. Both directions settle:
 * React only writes when its own value changed, and this only writes when it
 * finds an original, which its own write removes.
 */

interface Pick {
  original: string;
  x: number;
  y: number;
}

/** Everything the store wants swapped: what it says now, what it should say. */
function wantedFrom(edits: Record<string, DevEdit>): Map<string, string> {
  const wanted = new Map<string, string>();
  for (const edit of Object.values(edits)) {
    const to = edit.removed ? '' : edit.text;
    if (to === undefined) continue;
    const from = edit.original.trim();
    // a swap onto itself is a loop, and it is also nothing
    if (to.trim() === from) continue;
    wanted.set(from, to);
  }
  return wanted;
}

function applyEdits(root: HTMLElement, wanted: Map<string, string>): void {
  if (wanted.size === 0) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const hits: [Text, string][] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = node as Text;
    const raw = text.nodeValue ?? '';
    const key = raw.trim();
    if (!key) continue;
    const to = wanted.get(key);
    if (to === undefined) continue;
    hits.push([text, raw.replace(key, to)]);
  }
  for (const [text, value] of hits) text.nodeValue = value;
}

/** The text the pointer is actually over, and not the box it sits inside. */
function textAt(x: number, y: number): string | null {
  const doc = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node } | null;
  };
  const found =
    doc.caretRangeFromPoint?.(x, y)?.startContainer ??
    doc.caretPositionFromPoint?.(x, y)?.offsetNode ??
    null;
  if (found && found.nodeType === Node.TEXT_NODE) {
    const value = (found.nodeValue ?? '').trim();
    if (value) return value;
  }
  // an SVG label, or a caret the browser will not give up: take the element
  const el = document.elementFromPoint(x, y);
  for (const child of el ? Array.from(el.childNodes) : []) {
    if (child.nodeType !== Node.TEXT_NODE) continue;
    const value = (child.nodeValue ?? '').trim();
    if (value) return value;
  }
  const own = el?.textContent?.trim() ?? '';
  return own && own.length <= 400 ? own : null;
}

export function TextEditLayer({ on }: { on: boolean }) {
  const [picked, setPicked] = useState<Pick | null>(null);
  const [draft, setDraft] = useState('');
  const [note, setNote] = useState('');
  const panel = useRef<HTMLDivElement>(null);

  /* Whatever the store holds, on the page, and back on it every time React
     has drawn over it. This runs whether or not the switch is on: an edit is
     meant to be read in the game, not only in the panel. */
  useEffect(() => {
    const root = document.body;
    let queued = false;
    const run = () => {
      queued = false;
      applyEdits(root, wantedFrom(getDevEditsSnapshot()));
    };
    const later = () => {
      if (queued) return;
      queued = true;
      queueMicrotask(run);
    };
    const observer = new MutationObserver(later);
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    const stop = subscribeDevEdits(later);
    run();
    return () => {
      observer.disconnect();
      stop();
    };
  }, []);

  /* While the switch is on a click is a pick, and never a move in the game. */
  useEffect(() => {
    if (!on) {
      setPicked(null);
      return;
    }
    document.body.classList.add('dev-text-mode');
    const grab = (e: MouseEvent) => {
      if (panel.current?.contains(e.target as Node)) return;
      /* The switch that turns this off is on the dev strip. Swallowing a
         click there is a mode nobody can leave. */
      const el = e.target instanceof Element ? e.target : null;
      if (el?.closest('[data-dev-chrome]')) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.type !== 'click') return;
      const text = textAt(e.clientX, e.clientY);
      if (!text) return;
      const existing = getDevEditsSnapshot()[idForText(text)];
      setPicked({ original: existing?.original ?? text, x: e.clientX, y: e.clientY });
      setDraft(existing?.text ?? existing?.original ?? text);
      setNote(existing?.note ?? '');
    };
    window.addEventListener('click', grab, true);
    window.addEventListener('mousedown', grab, true);
    return () => {
      document.body.classList.remove('dev-text-mode');
      window.removeEventListener('click', grab, true);
      window.removeEventListener('mousedown', grab, true);
    };
  }, [on]);

  if (!on || !picked) return null;
  const id = idForText(picked.original);
  const edit = getDevEditsSnapshot()[id];
  const close = () => setPicked(null);

  return (
    <div
      ref={panel}
      data-dev-chrome
      className="fixed z-[80] w-[340px] max-w-[88vw] rounded-md border border-seal bg-ink p-3 text-left shadow-lg"
      style={{
        left: Math.max(8, Math.min(window.innerWidth - 350, picked.x - 40)),
        top: Math.max(8, Math.min(window.innerHeight - 320, picked.y + 14)),
      }}
    >
      <div className="mb-1 text-[9px] uppercase tracking-[0.15em] text-parchment-dim">
        On the page
      </div>
      <p className="mb-2 max-h-16 overflow-y-auto text-[11px] leading-snug text-parchment-dim/80">
        {picked.original}
      </p>

      <div className="mb-1 text-[9px] uppercase tracking-[0.15em] text-parchment-dim">Rewrite</div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        className="w-full rounded border border-ink-line bg-ink-soft p-1.5 text-[12px] leading-snug text-parchment"
      />

      <div className="mb-1 mt-2 text-[9px] uppercase tracking-[0.15em] text-parchment-dim">
        Note to AI
      </div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="e.g. this needs a joke, or: two more like this"
        className="w-full rounded border border-ink-line bg-ink-soft p-1.5 text-[12px] text-parchment"
      />

      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => {
            saveDevEdit(id, picked.original, draft, note);
            close();
          }}
          className="rounded bg-seal px-2.5 py-1 text-[11px] tracking-wide text-parchment"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => {
            saveDevEdit(id, picked.original, picked.original, note, true);
            close();
          }}
          className="rounded border border-bad px-2.5 py-1 text-[11px] text-bad"
        >
          Delete
        </button>
        {edit && (
          <button
            type="button"
            onClick={() => {
              resetDevEdit(id);
              close();
            }}
            className="rounded border border-ink-line px-2.5 py-1 text-[11px] text-parchment-dim"
          >
            Restore
          </button>
        )}
        <button
          type="button"
          onClick={close}
          className="rounded border border-ink-line px-2.5 py-1 text-[11px] text-parchment-dim"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
