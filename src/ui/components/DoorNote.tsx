import { UI } from '../../content/ui-strings';
import { CARD_BUTTON } from './Popup';
import { TYPE } from '../type';

/**
 * How far down a full-screen sheet starts while the dev strip is drawn.
 *
 * The strip is lifted over these two sheets on purpose: they are the game's
 * two screens of pure prose and "edit any text" is wanted on them more than
 * anywhere. What that left was a heading under the strip, which is a line
 * nobody can click. The sheet scrolls, so the room costs nothing, and the
 * narrow figure is the header wrapped onto three rows with the crown lying
 * down under it. Asked for by the user.
 */
const DEV_HEAD = 'pt-[150px] max-lg:pt-[240px]';
interface Props {
  /** Fires when it has been read, and the person at the door is heard. */
  onDone: () => void;
  /** The dev strip is on the screen, so this starts below it. */
  dev?: boolean;
}

/**
 * What a dilemma is, said once, on the first day one is at the door.
 *
 * The primer before the first year teaches the four boards. It cannot also
 * teach this: on that screen nobody has knocked yet, and a rule about a thing
 * a player has never seen is a rule they do not keep. So this one waits for
 * the knock, which is the first moment the three sentences on it are about
 * something in front of the reader.
 *
 * Narrower and shorter than the primer on purpose. Somebody is standing there,
 * and the game has just made them wait.
 *
 * Shown once per browser, on its own note in `save.ts`, and put back by
 * `clear history` along with everything else this browser remembers.
 */
export function DoorNote({ onDone, dev = false }: Props) {
  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto bg-ink/92 px-5 py-8 backdrop-blur-sm ${
        dev ? DEV_HEAD : ''
      }`}
    >
      <div className="drift-in mx-auto flex min-h-full w-full max-w-lg flex-col justify-center">
        <h2 className={`${TYPE.title} leading-tight text-parchment`}>{UI.door.heading}</h2>

        {/* Three sentences and a rule between them, rather than one block:
            they are three separate facts and a reader who takes only the
            first one has still learned the one that costs the most. */}
        <div className="mt-4 space-y-3 border-l-2 border-seal/60 pl-3">
          {UI.door.lines.map((line) => (
            <p key={line} className={`${TYPE.body} leading-relaxed text-parchment-dim`}>
              {line}
            </p>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <button type="button" onClick={onDone} className={`${CARD_BUTTON} bg-seal text-parchment`}>
            {UI.door.go}
          </button>
        </div>
      </div>
    </div>
  );
}
