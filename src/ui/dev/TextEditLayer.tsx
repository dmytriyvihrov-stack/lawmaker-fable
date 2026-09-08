import { useEffect, useRef, useState } from 'react';
import {
  findDevEdit,
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
 *
 * Hover text is the same job through a second door. A tooltip lives in a
 * `title` attribute, so there is no text node under the pointer to pick up and
 * nothing on the page to draw a pencil beside: three of them in the whole game
 * were wired by hand (`HoverText`, `useHoverText`) and the other fifty could
 * not be argued with at all. A click now offers both what is written where you
 * clicked and what the thing you clicked says when you rest on it, and the
 * swap walks `[title]` alongside the text nodes.
 */

interface Pick {
  /** The line of text under the pointer, if the pointer was over one. */
  line: string | null;
  /** What the thing under the pointer says on a hover, if it says anything. */
  hover: string | null;
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

/**
 * The dev chrome is not the game, and an override must not reach it.
 *
 * The pending edits panel exists to show what a line said before and what it
 * says now, and the picker shows the original over the box you are rewriting
 * it in. Both are text on the page, so the swap found them and helpfully
 * replaced the "before" with the "after": two identical lines, and a batch
 * that appeared to be a diff against itself.
 */
function isChrome(node: Node): boolean {
  const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  return el?.closest('[data-dev-chrome]') != null;
}

/**
 * Everything this has written over, and what it said before.
 *
 * An override is filed under the original, so a line already wearing one has
 * nothing left on the page for the next rewrite to match: edit a sentence
 * twice and the second version sat in the panel and never reached the screen,
 * which is half of what the screen is for. Putting back what was written, and
 * only then writing what is wanted now, is what makes a second pass land.
 *
 * It happens when the store changes and never when the page redraws, which is
 * the whole reason it settles: put back and write again on every mutation is
 * two writes that cause a mutation, for good.
 */
const written = new Map<Text, string>();
const titled = new Map<Element, string>();

function putBack(): void {
  for (const [node, was] of written) {
    if (node.isConnected && node.nodeValue !== was) node.nodeValue = was;
  }
  written.clear();
  for (const [el, was] of titled) {
    if (el.isConnected && el.getAttribute('title') !== was) el.setAttribute('title', was);
  }
  titled.clear();
}

function applyEdits(root: HTMLElement, wanted: Map<string, string>): void {
  // a node React has thrown away is not worth putting anything back into
  for (const node of Array.from(written.keys())) if (!node.isConnected) written.delete(node);
  for (const el of Array.from(titled.keys())) if (!el.isConnected) titled.delete(el);
  if (wanted.size === 0) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => (isChrome(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const hits: [Text, string][] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = node as Text;
    const raw = text.nodeValue ?? '';
    const key = raw.trim();
    if (!key) continue;
    const to = wanted.get(key);
    if (to === undefined) continue;
    /* A function, not the string: a rewrite is somebody's prose, and `$&` in
       the middle of it is two characters they typed and not an instruction to
       paste the match back in. */
    hits.push([text, raw.replace(key, () => to)]);
  }
  for (const [text, value] of hits) {
    if (!written.has(text)) written.set(text, text.nodeValue ?? '');
    text.nodeValue = value;
  }

  // and the same swap on the hovers, which have no text node to walk
  for (const el of Array.from(root.querySelectorAll('[title]'))) {
    if (isChrome(el)) continue;
    const was = el.getAttribute('title') ?? '';
    const key = was.trim();
    if (!key) continue;
    const to = wanted.get(key);
    if (to === undefined) continue;
    if (!titled.has(el)) titled.set(el, was);
    el.setAttribute('title', to);
  }
}

/**
 * What the content file says, for a piece of text that may already be wearing
 * an override. Everything is filed under the original, so a second pick has to
 * find its way back to it rather than opening a second entry on the rewrite.
 */
function original(shown: string | null): string | null {
  if (!shown) return null;
  return findDevEdit(shown)?.original ?? shown;
}

/** What the thing under the pointer says on a hover, if it says anything. */
function hoverAt(x: number, y: number): string | null {
  const el = document.elementFromPoint(x, y)?.closest('[title]');
  const said = el?.getAttribute('title')?.trim() ?? '';
  return said || null;
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
  /** Which of the two the panel is editing: what is written, or what is said. */
  const [target, setTarget] = useState<'line' | 'hover'>('line');
  const [draft, setDraft] = useState('');
  const [note, setNote] = useState('');
  const panel = useRef<HTMLDivElement>(null);

  /** Whatever is already filed against this piece of text, in the two boxes. */
  const load = (was: string) => {
    const had = findDevEdit(was);
    setDraft(had?.text ?? was);
    setNote(had?.note ?? '');
  };

  /* Whatever the store holds, on the page, and back on it every time React
     has drawn over it. This runs whether or not the switch is on: an edit is
     meant to be read in the game, not only in the panel. */
  useEffect(() => {
    const root = document.body;
    let queued = false;
    let afresh = false;
    const run = () => {
      queued = false;
      // the store moved: the page is holding the last answer, not the original
      if (afresh) putBack();
      afresh = false;
      applyEdits(root, wantedFrom(getDevEditsSnapshot()));
    };
    const later = (changed = false) => {
      afresh ||= changed;
      if (queued) return;
      queued = true;
      queueMicrotask(run);
    };
    const observer = new MutationObserver(() => later());
    /* `title` as well as the text: a hover React has just redrawn is the
       original again, and the override has to land back on it the same way it
       lands back on a line. The write this makes is itself a mutation, and it
       settles for the same reason - once the attribute says the new thing,
       there is no original left to match. */
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['title'],
    });
    const stop = subscribeDevEdits(() => later(true));
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
      /* Both doors at once: the line the pointer is over, and the hover the
         thing under it carries. Either can be missing - a bare paragraph has
         no tooltip, an icon button has no text - and a click that finds
         neither is not a pick at all. */
      const line = original(textAt(e.clientX, e.clientY));
      const hover = original(hoverAt(e.clientX, e.clientY));
      if (!line && !hover) return;
      const first = line ? 'line' : 'hover';
      setPicked({ line, hover, x: e.clientX, y: e.clientY });
      setTarget(first);
      load((first === 'line' ? line : hover) as string);
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
  /* A pick with both doors open falls back to the one it has: the chip row is
     the only way to change `target`, and it is not drawn unless both exist. */
  const was = (target === 'hover' ? picked.hover : picked.line) ?? picked.line ?? picked.hover ?? '';
  const both = picked.line !== null && picked.hover !== null;
  const id = idForText(was);
  const edit = getDevEditsSnapshot()[id];
  const close = () => setPicked(null);
  const choose = (which: 'line' | 'hover') => {
    const next = which === 'hover' ? picked.hover : picked.line;
    if (!next) return;
    setTarget(which);
    load(next);
  };

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
      {both ? (
        /* Two pieces of text under one pointer. A stat in the header is the
           shape of it: the number is written there, and the board's name is
           what it says when you rest on it, and both are content somebody may
           want to argue with. */
        <div className="mb-1 flex items-center gap-1">
          {(['line', 'hover'] as const).map((which) => (
            <button
              key={which}
              type="button"
              onClick={() => choose(which)}
              aria-pressed={target === which}
              className={`rounded-sm border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.15em] ${
                target === which
                  ? 'border-seal text-seal'
                  : 'border-ink-line text-parchment-dim hover:text-seal'
              }`}
            >
              {which === 'line' ? 'On the page' : 'On a hover'}
            </button>
          ))}
        </div>
      ) : (
        <div className="mb-1 text-[9px] uppercase tracking-[0.15em] text-parchment-dim">
          {target === 'hover' ? 'On a hover' : 'On the page'}
        </div>
      )}
      <p className="mb-2 max-h-16 overflow-y-auto text-[11px] leading-snug text-parchment-dim/80">
        {was}
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
            saveDevEdit(id, was, draft, note);
            close();
          }}
          className="rounded bg-seal px-2.5 py-1 text-[11px] tracking-wide text-parchment"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => {
            saveDevEdit(id, was, was, note, true);
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
