import { useState } from 'react';
import { BOND_UI, bondWord } from '../../content/bonds';
import { bondLevel, isLover, isPerson } from '../../engine/bonds';
import { characterMeta } from '../../content/meta';
import { UI } from '../../content/ui-strings';
import { AGES } from '../../content/folk';
import { OWN_ROPE_WARNING } from '../../content/own-rope';
import { VERDICT_VERBS } from '../../content/verdict-words';
import { renderTemplate } from '../../engine/format';
import { monarchOf } from '../../engine/monarch';
import { agesNow } from '../../engine/folk';
import { getCase } from '../../engine/registry';
import { availableVerbs, choiceOf, parseVerdict, verdictFor } from '../../engine/verdict';
import type { GameState, Season } from '../../engine/types';
import { ChoiceButton } from '../components/ChoiceButton';
import { ConsequenceHint } from '../components/ConsequenceHint';
import { DevEffects } from '../components/DevCorner';
import { DevEditTrigger, DevText } from '../components/DevText';
import { useDevEdit } from '../dev/useDevEdit';
import { PersonPortrait } from '../components/PersonPortrait';
import { CaseVignette } from '../components/CaseVignette';
import { AffectedStats, MovedBoards } from '../components/MovedBoards';
import { CONFIG } from '../../engine/config';
import { scaleEffects } from '../../engine/simulation';
import { traitOf } from '../../engine/monarch';
import type { CaseChoice, Effects } from '../../engine/types';

interface Props {
  state: GameState;
  dev?: boolean;
  season: Season;
  onChoose: (choiceId: string, ruling?: string) => void;
}

/**
 * One answer, in its own component so its dev-edit hook has a stable slot.
 * `Case` stays mounted across different cases, and different cases can have
 * different numbers of choices; a hook called straight inside a `.map` over
 * `event.choices` would then run a different number of times between two
 * renders of the same `Case` instance, which React does not allow.
 */
function ChoiceRow({
  eventId,
  choice,
  dev,
  note,
  beloved,
  fullCost,
  state,
  onChoose,
}: {
  eventId: string;
  choice: CaseChoice;
  dev: boolean;
  note: string | undefined;
  /** The person this answer lands on is the one you took. */
  beloved: boolean;
  fullCost: (choice: CaseChoice) => Effects;
  state: GameState;
  onChoose: (choiceId: string) => void;
}) {
  const id = `case:${eventId}:choice:${choice.id}:text`;
  const { value } = useDevEdit(id, choice.text);
  return (
    <div>
      <div className="relative">
        <ChoiceButton onClick={() => onChoose(choice.id)} note={note}>
          {value}
        </ChoiceButton>
        {/* The pencil sits on top of the button rather than inside it: a
            button cannot nest inside the button it is editing. */}
        <DevEditTrigger
          id={id}
          text={choice.text}
          dev={dev}
          className="pointer-events-auto absolute right-2 top-2"
        />
      </div>
      {/* Which boards this leans on, and whether it does anything a board
          cannot carry. Neither says by how much or which way: that stays for
          the aftermath. */}
      <div className="mt-1 flex flex-wrap items-center gap-2 px-1">
        <AffectedStats once={fullCost(choice)} souls={choice.souls} place={state} />
        <ConsequenceHint choice={choice} />
        {/* Every answer on this card is about somebody. This one is about the
            somebody, and a lawmaker weighing it already knows that, so the
            card is not allowed to pretend otherwise. */}
        {beloved && (
          <span className="flex items-center gap-1 text-[11px] leading-none text-seal">
            <span aria-hidden>{BOND_UI.loverMark}</span>
            {BOND_UI.loverChoice}
          </span>
        )}
      </div>
      {dev && (
        <MovedBoards className="mt-1 px-1" once={fullCost(choice)} souls={choice.souls} place={state} />
      )}
    </div>
  );
}

/**
 * Who is standing in front of you.
 *
 * The left column of the card, in the colour of the bench: a face, a name, how
 * old they are this year, and whether you have had them here before. Nothing
 * about the case itself is in here. They are not also standing out in the town
 * while this is open, so nobody is in the picture twice.
 */
function WhoStands({
  state,
  character,
  caseId,
}: {
  state: GameState;
  character: string | undefined;
  caseId: string;
}) {
  const monarch = monarchOf(state.seed);
  const who =
    character === 'monarch' ? { label: monarch.name } : characterMeta(character);
  const age = character ? (agesNow(state).get(character) ?? AGES[character]) : undefined;
  const known = isPerson(character);
  const feeling = known ? bondWord(bondLevel(state, character)) : null;
  const mine = isLover(state, character);

  /** The last year this person stood here, out of the log, before today. */
  let before: number | null = null;
  for (const entry of state.log) {
    if (entry.kind !== 'case') continue;
    if (getCase(entry.refId)?.character !== character) continue;
    before = entry.turn;
  }

  return (
    <aside
      className={`rounded-xl border bg-ink/60 p-3 text-center ${
        mine ? 'border-seal/70' : 'border-bench/50'
      }`}
    >
      <div className="flex justify-center">
        <PersonPortrait character={character} size={104} />
      </div>
      <div className="mt-2 text-[17px] leading-tight text-parchment">{who.label}</div>
      {/* What they thought of you before you opened your mouth. */}
      {feeling && (
        <div className="mt-1 text-[11px] leading-snug text-parchment-dim" title={feeling.line}>
          <span aria-hidden>{feeling.mark}</span> {feeling.word}
        </div>
      )}
      {mine && (
        <p className="mt-1.5 rounded-sm border border-seal/50 bg-seal/10 px-2 py-1 text-[11px] leading-snug text-seal">
          <span aria-hidden>{BOND_UI.loverMark}</span> {BOND_UI.loverAtTheDoor}
        </p>
      )}
      {age !== undefined && age > 0 && (
        <div className="text-[10px] uppercase tracking-[0.15em] text-parchment-dim">
          {UI.popup.aged.replace('{n}', String(age))}
        </div>
      )}
      <div className="mt-2 text-[11px] italic text-hair">
        {before === null
          ? UI.popup.firstTime
          : UI.popup.seenBefore.replace('{n}', String(before))}
      </div>
      {/* Where this is happening, drawn. The mark on the town says the address
          and this says the room, and neither of them is a caption. */}
      <div className="mt-2.5 flex justify-center">
        <CaseVignette caseId={caseId} size={132} />
      </div>
    </aside>
  );
}

/**
 * Somebody at the door, in three columns: who is standing there, what happened,
 * and what you say about it.
 *
 * There is no heading over any of it. A ruling being assembled out of words,
 * under a sentence that is filling itself in, is legible as a ruling. Three of
 * the words are always there; the rest are on the table only because a law of
 * yours is standing, and the mark on the tile says which one.
 */
export function Case({ state, dev = false, season, onChoose }: Props) {
  /**
   * The whole bill, not the part content wrote. Bending your own law costs the
   * crown on top of whatever the answer itself does, and under a monarch who
   * counts your exceptions it costs twice.
   */
  const exceptionCost = traitOf(state.seed).exceptionSanityCost ?? CONFIG.exceptionCost;
  const fullCost = (choice: CaseChoice, how?: 'breaks' | 'bends'): Effects => {
    const felt = scaleEffects(choice.effects, CONFIG.caseScale) ?? {};
    const bill = choice.exceptionToLaw
      ? exceptionCost
      : how === 'breaks'
        ? exceptionCost
        : how === 'bends'
          ? Math.round(exceptionCost * CONFIG.bendShare)
          : 0;
    if (bill === 0) return felt;
    return { ...felt, crownSanity: (felt.crownSanity ?? 0) - bill };
  };

  const current = state.current;
  const event = current && current.kind === 'case' ? getCase(current.id) : undefined;
  const [verb, setVerb] = useState<string | null>(null);

  if (!event) return null;

  const grammar = verdictFor(event.id);
  const parsed = grammar ? parseVerdict(event.id, verb, null, state) : null;
  const choice = choiceOf(event, parsed);
  /* The law this sentence crosses, if it crosses one: the one written into
     the answer, or the one a standing law of yours makes of a plain word. */
  const crossed = choice?.exceptionToLaw
    ? { law: choice.exceptionToLaw, how: 'breaks' as const }
    : parsed?.against
      ? { law: parsed.against.law, how: parsed.against.how }
      : null;

  const tile =
    'answer answer-bench min-h-[38px] rounded-lg border px-2.5 py-1.5 text-[12px] tracking-wide';
  const tileOpen = 'border-bench/70 bg-ink-soft text-parchment';
  const tileOn = 'border-bench bg-bench/25 text-parchment';
  /* A word that crosses a standing law wears it on the tile: red for a breach,
     the colour of a rich coat for the grey answer that goes round it. */
  const tileBreaks = 'border-bad/80';
  const tileBends = 'border-cloth-rich/80';

  const pickVerb = (id: string) => setVerb(verb === id ? null : id);
  const verbs = grammar ? availableVerbs(event.id, state) : [];

  return (
    <div className="ruler-case grid gap-4 p-4 lg:grid-cols-[142px_minmax(0,1fr)_360px]">
      <WhoStands state={state} character={event.character} caseId={event.id} />

      {/* what happened */}
      <section className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.2em] text-parchment-dim">
          {UI.popup.aCase} &middot;{' '}
          {UI.popup.ofYear
            .replace('{season}', UI.seasons[season])
            .replace('{n}', String(state.turn))}
        </div>
        <h2 className="mt-1 text-[22px] leading-tight">{event.title}</h2>
        {event.question && (
          <p className="mt-3 border-l-4 border-bench bg-bench/10 px-3 py-2 text-[15px] leading-snug text-parchment">
            <DevText id={`case:${event.id}:question`} text={event.question} dev={dev} />
          </p>
        )}
        <div className="mt-2 space-y-1.5">
          {event.scene.map((p, i) => (
            <p key={i} className="text-[13px] leading-relaxed text-parchment-dim">
              <DevText
                id={`case:${event.id}:scene:${i}`}
                text={renderTemplate(p, state)}
                dev={dev}
              />
            </p>
          ))}
        </div>
      </section>

      {/* what you say */}
      <section className="min-w-0 rounded-xl border border-ink-line bg-ink/60 p-3.5">
        {!grammar ? (
          <>
            <div className="space-y-3">
              {event.choices.map((c) => (
                <ChoiceRow
                  key={c.id}
                  eventId={event.id}
                  choice={c}
                  dev={dev}
                  beloved={isLover(state, event.character)}
                  state={state}
                  onChoose={onChoose}
                  note={
                    c.exceptionToLaw
                      ? `${UI.caseScreen.breaks} ${renderTemplate(
                          `{{law:${c.exceptionToLaw}}}`,
                          state,
                        )}`
                      : undefined
                  }
                  fullCost={fullCost}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* the ruling as it currently reads */}
            <p className="text-[19px] leading-snug tracking-wide">
              <span className="text-bench">{grammar.subject} </span>
              <span className={verb ? 'text-parchment' : 'text-hair'}>
                {verb ? VERDICT_VERBS.find((v) => v.id === verb)?.text : UI.bench.blankVerb}
              </span>
            </p>

            {/* word bank: what the bench may do */}
            <div className="mt-2.5 grid grid-cols-2 gap-1.5">
              {verbs.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => pickVerb(v.id)}
                  title={v.grantedBy ? v.grantedBy.label : v.against ? v.against.label : undefined}
                  className={`${tile} ${verb === v.id ? tileOn : tileOpen} ${
                    v.grantedBy
                      ? 'border-seal/70'
                      : v.against?.how === 'breaks'
                        ? tileBreaks
                        : v.against?.how === 'bends'
                          ? tileBends
                          : ''
                  }`}
                >
                  {v.text}
                  {v.grantedBy && (
                    <span className="ml-1.5 rounded-sm bg-seal/40 px-1 text-[9px] tracking-normal text-parchment">
                      {v.grantedBy.index}
                    </span>
                  )}
                  {/* the law it crosses, by number, and how hard */}
                  {v.against && (
                    <span
                      className={`ml-1.5 rounded-sm px-1 text-[9px] tracking-normal ${
                        v.against.how === 'breaks'
                          ? 'bg-bad/40 text-parchment'
                          : 'bg-cloth-rich/30 text-parchment'
                      }`}
                    >
                      {v.against.how === 'breaks' ? UI.bench.breaksMark : UI.bench.bendsMark}{' '}
                      {v.against.index}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* what the clerk hears */}
            <div className="mt-3 min-h-[44px] rounded-lg border border-ink-line bg-ink-soft/70 px-3 py-2">
              {choice ? (
                <>
                  <p className="text-[13px] leading-snug text-parchment/90">
                    <DevText
                      id={`case:${event.id}:choice:${choice.id}:text`}
                      text={choice.text}
                      dev={dev}
                    />
                  </p>
                  {crossed && (
                    <p
                      className={`mt-1 text-[11px] leading-snug ${
                        crossed.how === 'breaks' ? 'text-seal' : 'text-cloth-rich'
                      }`}
                    >
                      {crossed.how === 'breaks' ? UI.caseScreen.breaks : UI.caseScreen.bends}{' '}
                      {renderTemplate(`{{law:${crossed.law}}}`, state)}
                    </p>
                  )}
                  {/* Every other breach in the game costs a number. This one
                      costs the reign, and a consequence that big is not allowed
                      to be a surprise. */}
                  {crossed?.law === 'crime_hanged' && crossed.how === 'breaks' && (
                    <p className="mt-1.5 rounded-sm border border-bad/60 bg-bad/10 px-2 py-1.5 text-[11px] leading-snug text-bad">
                      {OWN_ROPE_WARNING}
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <AffectedStats
                      once={fullCost(choice, crossed?.how)}
                      souls={choice.souls}
                      place={state}
                    />
                    <ConsequenceHint choice={choice} against={parsed?.against?.how} />
                    {isLover(state, event.character) && (
                      <span className="flex items-center gap-1 text-[11px] leading-none text-seal">
                        <span aria-hidden>{BOND_UI.loverMark}</span>
                        {BOND_UI.loverChoice}
                      </span>
                    )}
                  </div>
                  {/* A law tells you what it will cost before you seal it; a
                      ruling does not. The weight lands at the aftermath. */}
                  {dev && (
                    <div className="mt-2 border-t border-ink-line pt-1.5">
                      <div className="text-[9px] uppercase tracking-[0.18em] text-parchment-dim">
                        {UI.caseScreen.moves}
                      </div>
                      <MovedBoards
                        className="mt-1"
                        once={fullCost(choice, crossed?.how)}
                        souls={choice.souls}
                        place={state}
                        emptyLine={UI.caseScreen.movesNothing}
                      />
                      {crossed && (
                        <p className="mt-1 text-[10px] leading-snug text-parchment-dim">
                          {UI.caseScreen.exceptionCost}
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-[12px] text-parchment-dim">
                  {verb ? UI.bench.notWritable : UI.bench.pickPrompt}
                </p>
              )}
            </div>

            {dev && choice && (
              <DevEffects
                raw={choice.effects}
                felt={scaleEffects(choice.effects, CONFIG.caseScale)}
                extra={[
                  ['choice', choice.id],
                  ['tags', choice.tags.join(', ')],
                ]}
              />
            )}

            <button
              type="button"
              disabled={!parsed}
              onClick={() => parsed && onChoose(parsed.choiceId, `"${parsed.sentence}."`)}
              className="mt-3 min-h-[44px] w-full rounded-lg bg-bench px-5 py-2 text-[16px] tracking-[0.2em] text-ink disabled:opacity-30"
            >
              {UI.bench.pronounce}
            </button>
          </>
        )}
      </section>
    </div>
  );
}
