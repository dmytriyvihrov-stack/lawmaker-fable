import { STATS } from '../../content/meta';
import { UI } from '../../content/ui-strings';
import { CARD_BUTTON } from './Popup';
import { TYPE } from '../type';

interface Props {
  /** Fires when it has been read, and the first year begins. */
  onDone: () => void;
}

/**
 * The one screen where the game says what it is, before the first year.
 *
 * Four rows and two lines: what the marks in the corner of the screen are,
 * what each one pulls on, what ends a reign, and the fact that a year holds
 * exactly one decision. Nothing here is a number and nothing here is optional
 * reading.
 *
 * What it is not any more is four paragraphs. Every row now draws the thing it
 * moves as a second mark with an arrow between them, because "let it fall and
 * people die over the winter, and the count of you falls with them" is a
 * sentence about an arrow: conditions point at the count of souls. A player
 * asked for the arrows and for less of the sentence, and the arrow is read at
 * a glance by somebody who is standing up.
 *
 * It used to be a block on the bottom of the seal ceremony, which happens in
 * the second spring, which is to say after the player had already chosen a
 * whole year of work out of four marks nobody had named.
 *
 * Shown once per browser, on the same note in `save.ts` the old lecture used,
 * so nobody who has already had it gets it twice.
 */
export function Primer({ onDone }: Props) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/92 px-5 py-8 backdrop-blur-sm">
      <div className="drift-in mx-auto w-full max-w-xl">
        <h2 className={`${TYPE.display} leading-tight text-parchment`}>{UI.wiring.heading}</h2>
        <p className={`mt-2 ${TYPE.body} leading-relaxed text-parchment-dim`}>{UI.wiring.lead}</p>

        {/* The four, in the marks they are drawn with up in the header, so the
            next time they are seen they are already known. The name beside the
            mark is the board's own name from `meta`, not a second one written
            here: a board renamed there would otherwise go on being called
            something else on the one screen that teaches it. */}
        <ul className="mt-5 space-y-2.5">
          {UI.wiring.boards.map((board) => {
            const meta = STATS.find((s) => s.id === board.stat);
            const marks: Record<string, { icon: string; label: string }> = UI.wiring.marks;
            /* Which way the arrow runs. Three of the boards do something to
               the place; the crown is the one the place does something to. */
            const outward = 'to' in board;
            const other = marks[(outward ? board.to : board.from) as string];
            return (
              <li
                key={board.stat}
                className="flex items-baseline gap-3 border-l-2 border-ink-line pl-3"
              >
                {/* the wiring itself: this mark, an arrow, the mark at the
                    other end of it, on one line and never wrapping */}
                <span
                  aria-hidden
                  className="flex shrink-0 items-center gap-1 text-[15px] leading-none"
                  title={other.label}
                >
                  {outward ? (
                    <>
                      <span>{meta?.emoji}</span>
                      <span className="text-[11px] text-seal">&rarr;</span>
                      <span>{other.icon}</span>
                    </>
                  ) : (
                    <>
                      <span>{other.icon}</span>
                      <span className="text-[11px] text-seal">&rarr;</span>
                      <span>{meta?.emoji}</span>
                    </>
                  )}
                </span>
                <div className="min-w-0">
                  <div className={`${TYPE.body} leading-snug text-parchment`}>
                    {board.title}
                    <span className="sr-only">
                      {' '}
                      {meta?.label}, {other.label}
                    </span>
                  </div>
                  <p className={`${TYPE.note} leading-snug text-parchment-dim`}>{board.line}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <p
          className={`mt-4 rounded-md border border-bad/50 bg-bad/[0.08] px-3 py-2 ${TYPE.note} leading-relaxed text-bad`}
        >
          {UI.wiring.floor}
        </p>

        <div className="mt-4 border-t border-ink-line pt-3">
          <div className={`${TYPE.label} text-seal`}>{UI.wiring.yearHeading}</div>
          <p className={`mt-1 ${TYPE.note} leading-relaxed text-parchment-dim`}>
            {UI.wiring.year}
          </p>
        </div>

        <div className="mt-5 flex justify-center">
          <button type="button" onClick={onDone} className={`${CARD_BUTTON} bg-seal text-parchment`}>
            {UI.wiring.go}
          </button>
        </div>
      </div>
    </div>
  );
}
