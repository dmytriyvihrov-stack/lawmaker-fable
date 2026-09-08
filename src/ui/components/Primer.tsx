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
 * It is four rows and two paragraphs: what the marks in the corner of the
 * screen are, what each one does when it falls, what ends a reign, and the
 * fact that a year holds exactly one decision. Nothing here is a number and
 * nothing here is optional reading.
 *
 * It used to be a block on the bottom of the seal ceremony, which happens in
 * the second spring, which is to say after the player had already chosen a
 * whole year of work out of four marks nobody had named. A player who has
 * not been told what a board is cannot weigh a building against it, and the
 * screen that finally told them was also busy stamping a law.
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
        <ul className="mt-5 space-y-3">
          {UI.wiring.boards.map((board) => {
            const meta = STATS.find((s) => s.id === board.stat);
            return (
              <li
                key={board.stat}
                className="flex items-baseline gap-3 border-l-2 border-ink-line pl-3"
              >
                <span aria-hidden className="w-5 shrink-0 text-[17px] leading-none">
                  {meta?.emoji}
                </span>
                <div className="min-w-0">
                  <div className={`${TYPE.body} leading-snug text-parchment`}>
                    {board.title}
                    <span className="sr-only"> {meta?.label}</span>
                  </div>
                  <p className={`mt-0.5 ${TYPE.note} leading-relaxed text-parchment-dim`}>
                    {board.line}
                  </p>
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

        <div className="mt-5 border-t border-ink-line pt-3">
          <div className={`${TYPE.label} text-seal`}>{UI.wiring.yearHeading}</div>
          <p className={`mt-1.5 ${TYPE.note} leading-relaxed text-parchment-dim`}>
            {UI.wiring.year}
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <button type="button" onClick={onDone} className={`${CARD_BUTTON} bg-seal text-parchment`}>
            {UI.wiring.go}
          </button>
        </div>
      </div>
    </div>
  );
}
