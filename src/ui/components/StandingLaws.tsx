import { useState } from 'react';
import { ACTIONS, SUBJECTS } from '../../content/meta';
import { UI } from '../../content/ui-strings';
import { HoverText } from './DevText';
import type { GameState } from '../../engine/types';

interface Props {
  state: GameState;
  /** A law is on the table right now, so the list says where it will land. */
  writing?: boolean;
  dev?: boolean;
  /**
   * The card is against the right edge of the window, under the crown, so it
   * has no right edge of its own. False on the bench, where it is a card on a
   * page like any other.
   */
  flush?: boolean;
}

/**
 * What is written down, in the order it was written.
 *
 * One law is one line: the number, the subject and what was done about it, and
 * nothing else. The full decree is a sentence in capitals, and the whole card
 * is a reminder rather than the document, so the wording lives in the Codex
 * and the hover, and the card stays the height of the list.
 *
 * The heading is the fold. Four laws in the corner of the town is a lot of
 * furniture over a picture, so it takes one click to put them away and one to
 * bring them back, in the place they already are.
 */
export function StandingLaws({ state, writing = false, dev = false, flush = false }: Props) {
  const [open, setOpen] = useState(true);
  const laws = state.laws.filter((l) => l.status === 'active');
  if (laws.length === 0 && !writing) return null;

  return (
    <div
      className={`border border-ink-line bg-ink-soft/95 p-2.5 shadow-[0_10px_28px_rgba(0,0,0,0.4)] backdrop-blur-[2px] ${
        flush ? 'rounded-l-xl rounded-r-none border-r-0' : 'rounded-xl'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 text-[9px] uppercase tracking-[0.2em] text-parchment-dim"
      >
        <span>
          <span aria-hidden className="mr-1">
            {UI.standing.headingIcon}
          </span>
          {UI.standing.heading}
          {laws.length > 0 && <span className="ml-1.5 text-seal">{laws.length}</span>}
        </span>
        <span aria-hidden className="text-[11px] leading-none">
          {open ? '▴' : '▾'}
        </span>
      </button>

      {open && (
        <ol className="mt-2 space-y-1">
          {laws.map((law, i) => {
            const subject = SUBJECTS.find((s) => s.id === law.subject);
            const action = ACTIONS.find((a) => a.id === law.action);
            return (
              <li key={`${law.subject}-${law.turn}`} className="leading-tight">
                <HoverText
                  id={`law:${law.subject}:${law.action}:hover`}
                  text={law.label}
                  dev={dev}
                  className="block truncate text-[11px] text-parchment"
                >
                  <span className="text-seal">{i + 1}</span>{' '}
                  {(subject?.label ?? law.subject).toLowerCase()}{' '}
                  <span className="text-parchment-dim">
                    {(action?.label ?? law.action).toLowerCase()}
                  </span>
                </HoverText>
              </li>
            );
          })}
          {writing && (
            <li className="text-[10px] text-seal">
              {laws.length + 1} {UI.standing.writingNow}
            </li>
          )}
          {laws.length === 0 && !writing && (
            <li className="text-[11px] text-parchment-dim">{UI.standing.none}</li>
          )}
        </ol>
      )}
    </div>
  );
}
