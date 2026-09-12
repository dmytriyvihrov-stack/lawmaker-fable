import { useState } from 'react';
import { CITY_LABELS, SUBJECTS } from '../../content/meta';
import { UI } from '../../content/ui-strings';
import type { CaseChoice } from '../../engine/types';

interface Props {
  choice: CaseChoice;
  /**
   * What a standing law of yours makes of this answer today, when the answer
   * itself was written before the law was. The choice does not know; the
   * bench does, and says.
   */
  against?: 'breaks' | 'bends';
  className?: string;
}

/**
 * The question mark under an answer that does more than move numbers.
 *
 * Every answer already prices itself in boards. What the row of boards cannot
 * say is that this one books somebody's return in three years, or changes the
 * picture of the place, or is going to be read back to you at the end of the
 * reign. Those are the consequences that made a player feel the game was
 * arbitrary: they were always there, they were never sayable, and the answer
 * that looked cheapest on the boards was quite often the one with a person
 * attached to it.
 *
 * It says what kind of consequence, never which one. "Somebody comes back
 * about this" is information a lawmaker would have. Naming who, and when, and
 * what they will want is the dilemma, and that stays shut.
 */
export function ConsequenceHint({ choice, against, className = '' }: Props) {
  const [open, setOpen] = useState(false);

  const notes: string[] = [];
  if (choice.schedule) notes.push(UI.consequence.later);
  const layers = [...(choice.cityFlagsOn ?? []), ...(choice.cityFlagsOff ?? [])];
  if (layers.length > 0) notes.push(UI.consequence.changes);
  if (choice.setFlags?.length || choice.setIva) notes.push(UI.consequence.remembered);
  if ((choice.souls ?? 0) !== 0 || (choice.soulsExact ?? 0) !== 0) notes.push(UI.consequence.souls);
  if (choice.exceptionToLaw || against === 'breaks') notes.push(UI.consequence.bent);
  else if (against === 'bends') notes.push(UI.consequence.stretched);
  if (choice.enactLaw) {
    const subject = SUBJECTS.find((s) => s.id === choice.enactLaw?.subject);
    notes.push(UI.consequence.law.replace('{subject}', (subject?.label ?? '').toLowerCase()));
  }
  if (notes.length === 0) return null;

  /* The mark on the town is the one consequence a player can be shown rather
     than told, so it is named: they can look up at the band and find it. */
  const seen = layers
    .map((f) => CITY_LABELS[f]?.emoji)
    .filter((e): e is string => e !== undefined);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={UI.consequence.label}
        title={UI.consequence.label}
        className={`min-h-[22px] rounded-full border px-2 text-[11px] leading-none ${
          open
            ? 'border-seal bg-seal/20 text-parchment'
            : 'border-ink-line text-parchment-dim hover:border-seal hover:text-parchment'
        }`}
      >
        <span aria-hidden>{UI.consequence.ask}</span>
        {seen.length > 0 && (
          <span aria-hidden className="ml-1">
            {seen.join('')}
          </span>
        )}
      </button>
      {open && (
        <ul className="mt-1 space-y-0.5 border-l-2 border-seal/60 pl-2">
          {notes.map((note) => (
            <li key={note} className="text-[11px] leading-snug text-parchment-dim">
              {note}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
