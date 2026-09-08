import { UI } from '../../content/ui-strings';
import { monarchOf } from '../../engine/monarch';
import type { PhilTag } from '../../engine/types';
import { ChoiceButton } from '../components/ChoiceButton';
import { DevEditTrigger, DevText } from '../components/DevText';
import { MonarchPortrait } from '../components/MonarchPortrait';
import { FoundingPortrait } from '../components/PersonPortrait';
import { useDevEdit } from '../dev/useDevEdit';
import { TYPE } from '../type';

/**
 * The first sentence of a line, and no more.
 *
 * A monarch's line is two sentences: what they do, and what it does to the
 * place. Both are true and both are worth reading, and the founding is the one
 * screen where neither has happened yet, so it takes the half that introduces
 * the person. The whole of it is under the pointer on the crown's own panel,
 * which is on the screen every year of the reign after this one.
 */
function firstSentence(line: string): string {
  const at = line.indexOf('. ');
  return at === -1 ? line : line.slice(0, at + 1);
}

interface Props {
  seed: number;
  dev?: boolean;
  onDeclare: (tag: PhilTag) => void;
}

/** One stance, in its own component so its dev-edit hook has a stable slot. */
function AnswerRow({
  tag,
  text,
  dev,
  onDeclare,
}: {
  tag: PhilTag;
  text: string;
  dev: boolean;
  onDeclare: (tag: PhilTag) => void;
}) {
  const id = `intro:answer:${tag}`;
  const { value } = useDevEdit(id, text);
  return (
    <div className="relative">
      <ChoiceButton onClick={() => onDeclare(tag)}>{value}</ChoiceButton>
      <DevEditTrigger id={id} text={text} dev={dev} className="absolute right-2 top-2" />
    </div>
  );
}

/**
 * The founding, which takes the whole window.
 *
 * Every other card in this game floats over the near meadow, because every
 * other card is about something happening in a place that already exists. This
 * one is about the place not existing yet, and it used to be told in a card
 * five lines tall with the answers below the fold, so a first time player read
 * three paragraphs of a monarch and never saw what the game was for.
 *
 * It reads top to bottom in the order somebody actually needs it: who is in
 * the picture, what you are holding, what you are supposed to do with it, and
 * only then the crown, who has come a long way to ask you one question.
 */
export function Intro({ seed, dev = false, onDeclare }: Props) {
  const monarch = monarchOf(seed);
  const brief = UI.intro.brief;

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-7">
      {/* the five of you, on the day, before anything is decided */}
      <section className="text-center">
        <FoundingPortrait seed={seed} size={92} />
        <h1 className={`mt-4 ${TYPE.display} leading-tight text-parchment`}>
          {brief.heading}
        </h1>
        <p className={`mt-1 ${TYPE.label} text-parchment-dim`}>
          {brief.kicker}
        </p>
        {/* two sentences about the people in the picture, and no more */}
        <p className={`mx-auto mt-3 max-w-xl ${TYPE.body} leading-relaxed text-parchment-dim`}>
          <DevText id="intro:brief:caption" text={brief.caption} dev={dev} />
        </p>
      </section>

      {/* and then the crown, who has come a long way to ask one thing: a
          picture of this one, their name, why they are here, and the one thing
          about them that will bend the whole reign.

          The picture is the size of a picture. It was a 48 pixel stamp beside
          a name, which is the size of an icon: the one person in this game who
          was painted properly, the one whose face is going to be over the
          whole reign, drawn smaller than the five strangers at the top of the
          screen. It is a portrait on a wall now, on the left, with everything
          she has come to say running down the side of it. */}
      <section className="mt-5 rounded-lg border border-ink-line bg-ink-soft p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="mx-auto shrink-0 rounded-lg border border-ink-line bg-ink/40 p-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.35)] sm:mx-0">
            <MonarchPortrait monarch={monarch} mood={72} size={132} />
          </div>
          <div className="min-w-0 flex-1">
            <div className={`${TYPE.display} leading-tight text-parchment`}>{monarch.name}</div>
            {/* What she is, which is the one thing about her that will bend
                the reign. The rider with the wax used to stand above it in a
                block of its own; that half sentence is in front of the
                question now, where the question is. */}
            <p className={`mt-3 ${TYPE.body} leading-relaxed text-parchment-dim`}>
              <span className="text-seal">{monarch.traitName}. </span>
              <DevText id={`monarch:${monarch.id}:traitLine`} text={firstSentence(monarch.traitLine)} dev={dev} />
            </p>
          </div>
        </div>
      </section>

      <h2 className={`mt-6 text-center ${TYPE.title} leading-snug`}>
        <DevText id="intro:question" text={UI.intro.question} dev={dev} />
      </h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {UI.intro.answers.map((answer) => (
          <AnswerRow
            key={answer.tag}
            tag={answer.tag}
            text={answer.text}
            dev={dev}
            onDeclare={onDeclare}
          />
        ))}
      </div>
    </div>
  );
}
