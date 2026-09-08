import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useDevEdit } from '../dev/useDevEdit';
import { useTextEditMode } from '../dev/textEditMode';

interface PopoverProps {
  value: string;
  original: string;
  changed: boolean;
  edit: { note?: string } | undefined;
  save: (text: string, note: string, removed?: boolean) => void;
  reset: () => void;
}

/**
 * The editor itself: a rewrite box and a note box, shared by both the inline
 * form (prose) and the button-adjacent form (a choice's own label).
 */
function DevEditPopover({ value, original, changed, edit, save, reset }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const [draftText, setDraftText] = useState(value);
  const [draftNote, setDraftNote] = useState(edit?.note ?? '');

  useEffect(() => {
    if (!open) {
      setDraftText(value);
      setDraftNote(edit?.note ?? '');
    }
  }, [value, edit?.note, open]);

  return (
    /* Dev chrome, and it has to say so. The click-anything layer swallows
       every click that is not inside something marked, which made these
       pencils - the only ones with a hand written id on them - unopenable in
       the one mode they are drawn in. It also keeps their own tooltips out of
       the list of things the layer offers to rewrite. */
    <span data-dev-chrome className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Edit this text"
        title={changed ? 'Edited. Click to change or clear' : 'Edit this text'}
        className={`align-super text-[10px] leading-none ${
          changed ? 'text-seal' : 'text-parchment-dim/60 hover:text-seal'
        }`}
      >
        ✎
      </button>

      {open && (
        <span className="absolute left-0 top-full z-[60] mt-1 block w-[320px] max-w-[85vw] rounded-md border border-seal bg-ink p-2.5 text-left normal-case tracking-normal shadow-lg">
          <span className="mb-1 block text-[9px] uppercase tracking-[0.15em] text-parchment-dim">
            Rewrite
          </span>
          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            rows={3}
            className="w-full rounded border border-ink-line bg-ink-soft p-1.5 text-[12px] leading-snug text-parchment"
          />
          <span className="mb-1 mt-2 block text-[9px] uppercase tracking-[0.15em] text-parchment-dim">
            Note to AI
          </span>
          <input
            value={draftNote}
            onChange={(e) => setDraftNote(e.target.value)}
            placeholder="e.g. this needs a joke, or: generate two more like this"
            className="w-full rounded border border-ink-line bg-ink-soft p-1.5 text-[12px] text-parchment"
          />
          <span className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                save(draftText, draftNote);
                setOpen(false);
              }}
              className="rounded bg-seal px-2.5 py-1 text-[11px] tracking-wide text-parchment"
            >
              Save
            </button>
            {/* "there should be nothing here", which is a different request
                from "this should say nothing", and is filed as one. */}
            <button
              type="button"
              onClick={() => {
                save(original, draftNote, true);
                setOpen(false);
              }}
              className="rounded border border-bad px-2.5 py-1 text-[11px] text-bad"
            >
              Delete
            </button>
            {changed && (
              <button
                type="button"
                onClick={() => {
                  reset();
                  setOpen(false);
                }}
                className="rounded border border-ink-line px-2.5 py-1 text-[11px] text-parchment-dim"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded border border-ink-line px-2.5 py-1 text-[11px] text-parchment-dim"
            >
              Cancel
            </button>
          </span>
        </span>
      )}
    </span>
  );
}

interface Props {
  /** Stable, unique across the whole game: e.g. "case:v1_idle_hand:question". */
  id: string;
  text: string;
  dev: boolean;
  className?: string;
}

/**
 * A line of game prose, with a pencil on it in dev mode.
 *
 * The rest of the game is built on the rule that no text lives in a
 * component: everything is read out of `src/content/*`. This does not break
 * that rule, it sits on top of it. A browser tab cannot write back to a
 * source file, so an edit made here lives beside the game, in its own local
 * store, until somebody collects it and applies it by hand. What it can do
 * immediately is show the rewrite in place, so a line reads right or wrong
 * while the person editing it is still looking at the scene it belongs to.
 *
 * A note with no rewrite is a request rather than a fix: "needs a joke here"
 * is a real, useful thing to leave on a line that is otherwise fine to ship.
 *
 * Only for prose that is not itself inside a clickable control: the pencil is
 * a `<button>`, and a button cannot nest inside another button. A choice's
 * own label uses `DevEditTrigger` instead, placed beside it.
 */
export function DevText({ id, text, dev, className }: Props) {
  const { value, edit, save, reset } = useDevEdit(id, text);
  const editing = useTextEditMode();
  if (!dev || !editing) return <span className={className}>{value}</span>;
  const changed = edit !== undefined;
  return (
    <span className={`relative inline ${className ?? ''}`}>
      <span
        className={changed ? 'rounded-sm bg-seal/15 outline outline-1 outline-seal/50' : undefined}
      >
        {value}
      </span>{' '}
      <DevEditPopover value={value} original={text} changed={changed} edit={edit} save={save} reset={reset} />
    </span>
  );
}

/**
 * The pencil alone, with nothing to wrap: for a line of text that is already
 * the label of some other clickable element (a choice button), where the
 * trigger has to sit beside it rather than inside it.
 */
export function DevEditTrigger({ id, text, dev, className }: Props) {
  const { value, edit, save, reset } = useDevEdit(id, text);
  const editing = useTextEditMode();
  if (!dev || !editing) return null;
  return (
    <span className={className}>
      <DevEditPopover
        value={value}
        original={text}
        changed={edit !== undefined}
        edit={edit}
        save={save}
        reset={reset}
      />
    </span>
  );
}

/**
 * The text that comes up when the pointer rests on something, with the same
 * pencil on it as everything else in dev mode.
 *
 * A hover is game text like any other line, and until now it was the one kind
 * that could not be argued with while it was on the screen: it lives in a
 * `title` attribute, so there is nothing to put a pencil beside. This wraps
 * the thing being hovered instead. Out of dev mode it is exactly a `title`
 * and costs nothing.
 */
export function HoverText({
  id,
  text,
  dev,
  className,
  children,
}: Props & { children?: ReactNode }) {
  const { value, edit, save, reset } = useDevEdit(id, text);
  const editing = useTextEditMode();
  if (!dev || !editing) {
    return (
      <span className={className} title={value}>
        {children ?? value}
      </span>
    );
  }
  const changed = edit !== undefined;
  return (
    <span className={`relative ${className ?? ''}`} title={value}>
      <span className={changed ? 'rounded-sm outline outline-1 outline-seal/50' : undefined}>
        {children ?? value}
      </span>{' '}
      <DevEditPopover value={value} original={text} changed={changed} edit={edit} save={save} reset={reset} />
    </span>
  );
}

/**
 * The same, for a hover that has nowhere to hang a pencil: a `title` on a
 * control that is already a button, or on an SVG shape. The edit is still made
 * from the panel, and the id still shows up in the export.
 */
export function useHoverText(id: string, text: string): string {
  return useDevEdit(id, text).value;
}

/** The resolved text for a piece of content: the edit if there is one, else the original. */
export { useDevEdit as useDevText } from '../dev/useDevEdit';
