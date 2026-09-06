import { UI } from '../../content/ui-strings';
import { monarchOf } from '../../engine/monarch';
import type { PhilTag } from '../../engine/types';
import { ChoiceButton } from '../components/ChoiceButton';
import { DevEditTrigger, DevText } from '../components/DevText';
import { MonarchPortrait } from '../components/MonarchPortrait';
import { FoundingPortrait } from '../components/PersonPortrait';
import { useDevEdit } from '../dev/useDevEdit';

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
        <h1 className="mt-4 text-[26px] leading-tight tracking-wide text-parchment">
          {brief.heading}
        </h1>
        <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-parchment-dim">
          {brief.kicker}
        </p>
        {/* two sentences about the people in the picture, and no more */}
        <p className="mx-auto mt-3 max-w-xl text-[14px] italic leading-relaxed text-hair">
          <DevText id="intro:brief:caption" text={brief.caption} dev={dev} />
        </p>
      </section>

      {/* what the whole reign is for, said once, before anybody talks */}
      <p className="mt-5 rounded-lg border border-seal/50 bg-seal/[0.12] px-4 py-3 text-[15px] leading-relaxed text-parchment">
        <DevText id="intro:brief:charge" text={brief.charge} dev={dev} />
      </p>

      {/* and then the crown, who has come a long way to ask one thing: a
          picture of this one, their name, why they are here, and the one thing
          about them that will bend the whole reign */}
      <section className="mt-5 rounded-lg border border-ink-line bg-ink-soft p-4">
        <header className="mb-3 flex items-center gap-3">
          {/* The crown is painted, like everybody else in this game. An emoji
              here made the one person with an actual portrait the only one
              without, and five monarchs read as one. */}
          <MonarchPortrait monarch={monarch} mood={72} size={48} />
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.15em] text-parchment-dim">
              {UI.intro.speaker}
            </div>
            <div className="text-[15px] leading-tight">{monarch.name}</div>
          </div>
        </header>
        <div className="space-y-3">
          {UI.intro.lead.map((p, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-parchment/90">
              <DevText id={`intro:lead:${i}`} text={p} dev={dev} />
            </p>
          ))}
        </div>
        <p className="mt-3 rounded-md border border-ink-line bg-ink/50 p-3 text-[13px] leading-relaxed text-parchment-dim">
          <span className="text-seal">{monarch.traitName}. </span>
          <DevText id={`monarch:${monarch.id}:traitLine`} text={monarch.traitLine} dev={dev} />
        </p>
      </section>

      <h2 className="mt-6 text-center text-xl leading-snug">
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

      <p className="mt-4 text-center text-[13px] leading-relaxed text-parchment-dim italic">
        <DevText id="intro:footnote" text={UI.intro.footnote} dev={dev} />
      </p>
    </div>
  );
}
