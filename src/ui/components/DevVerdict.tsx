import { useEffect, useState } from 'react';
import { UI } from '../../content/ui-strings';
import { markDev, noteDev, type Verdict } from '../dev/devMarksStore';
import { useDevMark } from '../dev/useDevMarks';

/**
 * Two thumbs on a thing that just happened.
 *
 * The pencils elsewhere in dev mode are for rewriting a line, which is work.
 * This is not work: it is the note somebody actually leaves while they are
 * still playing, because it costs one click and does not take them out of the
 * reign to make it. Everything that happens to a player carries one - the
 * person at the bench, the law on the table, what came of the ruling, and the
 * small thing out on the meadow - so a run can be walked once, top to bottom,
 * and come out the other end as a list of what landed and what did not.
 *
 * It is filed against the content and not against the reign (see
 * `devMarksStore`), so the same case marked in two playthroughs is one mark,
 * and it is collected in the same panel as the pending edits and handed over
 * in the same batch.
 *
 * `wide` is the version with room for a line of why. The map has no such room,
 * so out there it is the thumbs alone and the note is typed in the panel.
 */
export function DevVerdict({
  id,
  label,
  turn,
  dev,
  wide = false,
  className,
}: {
  id: string;
  label: string;
  turn: number;
  dev: boolean;
  wide?: boolean;
  className?: string;
}) {
  const mark = useDevMark(id);
  const [note, setNote] = useState(mark?.note ?? '');
  const [writing, setWriting] = useState(false);

  /* The card is reused for the next case, and a note left on the last one must
     not follow it there. It is keyed on the id for that reason and not on the
     mark, so typing does not fight the store on every keystroke. */
  useEffect(() => {
    setNote(mark?.note ?? '');
    setWriting(false);
    // the note for this id, taken once: what is typed after that is the draft
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!dev) return null;

  const thumb = (verdict: Verdict, glyph: string, title: string) => {
    const on = mark?.verdict === verdict;
    const colour = verdict === 'up' ? 'border-good text-good' : 'border-bad text-bad';
    return (
      <button
        type="button"
        onClick={() => markDev(id, label, verdict, turn)}
        aria-pressed={on}
        title={title}
        className={`rounded-sm border px-1 text-[11px] leading-none transition-opacity ${
          on ? `${colour} opacity-100` : 'border-ink-line text-parchment-dim opacity-50 hover:opacity-100'
        }`}
      >
        {glyph}
      </button>
    );
  };

  return (
    <span
      data-dev-chrome
      className={`inline-flex items-center gap-1 align-middle ${className ?? ''}`}
    >
      {thumb('up', UI.dev.likeMark, UI.dev.likeHint)}
      {thumb('down', UI.dev.dislikeMark, UI.dev.dislikeHint)}
      {wide && (writing || mark?.note ? (
        <input
          value={note}
          autoFocus={writing}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => {
            noteDev(id, label, note, turn);
            setWriting(false);
          }}
          placeholder={UI.dev.markNote}
          className="w-40 rounded-sm border border-ink-line bg-ink-soft px-1 py-0.5 text-[10px] normal-case tracking-normal text-parchment"
        />
      ) : (
        <button
          type="button"
          onClick={() => setWriting(true)}
          title={UI.dev.markNote}
          className="rounded-sm border border-ink-line px-1 text-[10px] leading-none text-parchment-dim opacity-50 hover:opacity-100"
        >
          {UI.dev.markWhy}
        </button>
      ))}
    </span>
  );
}
