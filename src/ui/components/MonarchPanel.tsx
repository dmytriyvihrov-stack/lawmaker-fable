import type { ReactNode } from 'react';

import { readingFor } from '../../content/town-readings';
import { UI } from '../../content/ui-strings';
import { monarchAge, monarchOf } from '../../engine/monarch';
import { getCase } from '../../engine/registry';
import { dilemmaWeight } from '../../engine/story';
import { trendOf, trendSourcesOf } from '../../engine/simulation';
import type { GameState } from '../../engine/types';
import { MonarchPortrait } from './MonarchPortrait';
import { Feeling, feelingArrows } from './Feeling';
import { MovedBoards } from './MovedBoards';
import { DevEditTrigger, useHoverText } from './DevText';

interface Props {
  state: GameState;
  /**
   * What the person holding the seal is doing out there, in one line, on the
   * bottom edge of the card. Passed in rather than read here: this panel knows
   * about the crown and nothing about the walk, and the walk is a hook that
   * only the one place assembling the screen may hold.
   */
  doing?: ReactNode;
  /**
   * `card` floats on the town, top right, which is where the crown lives now.
   * `strip` is the same face laid on its side for a phone. `rail` is the old
   * column, kept for the screens that still have one.
   */
  variant: 'rail' | 'strip' | 'card';
  /** Dev mode: the hover on the gauge is game text and can be argued with. */
  dev?: boolean;
}

function toneOf(n: number): string {
  return n > 0 ? 'text-good' : n < 0 ? 'text-bad' : 'text-parchment-dim';
}

/**
 * The monarch is not one of the town's boards. They are a person upstairs whose
 * patience with you is its own gauge, and whose face keeps its own score, so
 * the gauge lives here under the face rather than in the row with the harvest.
 */
export function MonarchPanel({ state, variant, dev = false, doing }: Props) {
  /* The word and what it means, both under the pointer. The rail used to
     carry "MOOD" beside the crown in small capitals, which is a label on a
     dial that already has a crown on it. Asked for by the user. */
  const gaugeHover = useHoverText(
    'ui:monarch:gauge:hover',
    `${UI.monarch.gaugeName}: ${UI.monarch.gaugeHover}`,
  );
  const monarch = monarchOf(state.seed);
  const age = monarchAge(state.seed, state.turn);
  const mood = state.stats.crownSanity;
  const reading = readingFor('crownSanity', mood, state.stage);
  const pull = trendOf(state, 'crownSanity');
  const sources = trendSourcesOf(state, 'crownSanity').filter((s) => s.delta !== 0);

  // there is a hard thing on the table, and the face upstairs knows it
  const event =
    state.phase === 'case' && state.current?.kind === 'case'
      ? getCase(state.current.id)
      : undefined;
  const bracing = event ? dilemmaWeight(event) : 0;

  if (variant === 'strip') {
    return (
      <div className="flex items-center gap-2.5">
        <span className="shrink-0">
          <MonarchPortrait stage={state.stage} monarch={monarch} mood={mood} size={40} bracing={bracing} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5" title={gaugeHover}>
            <span aria-hidden className="text-[11px] leading-none">
              {UI.monarch.gaugeIcon}
            </span>
            <span className="truncate text-[10px] uppercase tracking-[0.15em] text-parchment-dim">
              {UI.monarch.gaugeName}
            </span>
            <span aria-hidden className={`text-[10px] leading-none ${toneOf(pull)}`}>
              {feelingArrows(pull)}
            </span>
            <span className="sr-only">{gaugeHover}</span>
            <DevEditTrigger id="ui:monarch:gauge:hover" text={UI.monarch.gauge} dev={dev} />
          </div>
          <Feeling
            value={mood}
            low={UI.feeling.crownLow}
            high={UI.feeling.crownHigh}
            label={UI.stats.crownSanity}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={variant === 'card' ? 'w-full' : 'sticky top-[var(--rail-top,1rem)] w-[176px] shrink-0'}>
      {/* under the header, not behind it: the header is sticky and tall */}
      {/* No heading over the face. A drawn person with a name and an age under
          them is already labelled; a caption saying they are on the throne is
          the picture explained back to the person looking at it. */}
      {/* The card is sewn into the top right corner of the picture, so it has
          no right edge of its own: the window is its right edge. The rail,
          which is a column on a page and not a thing on a picture, keeps all
          four. */}
      <div
        className={`border border-ink-line p-2.5 ${
          variant === 'card'
            ? 'rounded-l-xl rounded-r-none border-r-0 border-t-0 bg-ink-soft/95 shadow-[0_10px_28px_rgba(0,0,0,0.4)] backdrop-blur-[2px]'
            : 'rounded-xl bg-ink-soft'
        }`}
      >
        <div className="flex justify-center">
          <MonarchPortrait stage={state.stage}
            monarch={monarch}
            mood={mood}
            size={variant === 'card' ? 84 : 132}
            bracing={bracing}
          />
        </div>
        <div className="mt-2 text-center text-[13px] leading-tight text-parchment">
          {UI.monarch.you.replace('{name}', monarch.name)}
        </div>
        {/* they are a year older every year you hold the seal, and it shows.
            What they are is one word beside it: the paragraph and the rows are
            under the pointer, where somebody who wants them can go and get
            them, instead of taking a third of the rail every year. */}
        <div className="group/trait relative flex items-baseline justify-center gap-1 text-[10px] leading-tight">
          <span className="text-parchment-dim">
            {UI.monarch.age.replace('{n}', String(age))} &middot;
          </span>
          <span className="cursor-help border-b border-dotted border-seal/60 text-seal">
            {monarch.traitName}
          </span>
          <span className="pointer-events-none absolute left-0 top-full z-50 mt-1 hidden w-[236px] rounded-md border border-ink-line bg-ink p-2.5 text-left shadow-lg group-hover/trait:block">
            <span className="block text-[12px] leading-relaxed text-parchment/90">
              {monarch.traitLine}
            </span>
            <span className="mt-2 block border-t border-ink-line pt-1.5">
              <MovedBoards every={monarch.trait.yearly} place={state} bare />
            </span>
          </span>
        </div>

        {/* the monarch's own dial, under the monarch's own face, where it belongs */}
        <div className="group relative mt-3">
          {/* The crown, then the line it is on, then which way it is going:
              one row instead of a label over a bar. The crown says whose
              gauge this is and the word it used to be labelled with is under
              the pointer with the rest of the sentence. */}
          <div className="flex items-center gap-1.5" title={gaugeHover}>
            <span aria-hidden className="shrink-0 text-[12px] leading-none">
              {UI.monarch.gaugeIcon}
            </span>
            <span className="min-w-0 flex-1">
              <Feeling
                value={mood}
                low={UI.feeling.crownLow}
                high={UI.feeling.crownHigh}
                label={UI.stats.crownSanity}
              />
            </span>
            <span aria-hidden className={`shrink-0 text-[10px] leading-none ${toneOf(pull)}`}>
              {pull > 0 ? '▸' : pull < 0 ? '◂' : '·'}
            </span>
            <span className="sr-only">{gaugeHover}</span>
          </div>

          {/* What the mood of the crown means, in a sentence, where a sentence
              belongs: under the pointer, for the reader who asked. */}
          <div className="pointer-events-none absolute left-0 top-full z-50 mt-1 hidden w-[236px] rounded-md border border-ink-line bg-ink p-2.5 shadow-lg group-hover:block">
            <p className="text-[12px] leading-snug text-parchment/90">{reading}</p>
            {sources.length > 0 && (
              <>
                <div className="mt-2 border-t border-ink-line pt-1.5 text-[10px] uppercase tracking-[0.15em] text-parchment-dim">
                  {UI.trend.heading}
                </div>
                <ul className="mt-1 space-y-1">
                  {sources.map((src, i) => (
                    <li key={i} className="flex items-baseline gap-2 text-[11px] leading-snug">
                      <span aria-hidden className={`w-7 shrink-0 ${toneOf(src.delta)}`}>
                        {feelingArrows(src.delta)}
                      </span>
                      <span className="text-parchment/85">
                        {src.kind === 'drift' ? UI.ledger.crown : src.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* the day being spent under all of that, on the card's own edge */}
        {doing !== undefined && (
          <div className="mt-2.5 border-t border-ink-line pt-0.5">{doing}</div>
        )}
      </div>
    </div>
  );
}
