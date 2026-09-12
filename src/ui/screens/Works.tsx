import { WorkModel } from '../components/town/parts';
import { PAINT } from '../components/town/paint';
import { useState } from 'react';
import { PLOT_NAMES, STATS, SUBJECTS, WORK_ICONS } from '../../content/meta';
import { UI } from '../../content/ui-strings';
import { CARD_BUTTON, CardFoot, PopupHead } from '../components/Popup';
import { getProposal } from '../../engine/registry';
import { reopenableProposals } from '../../engine/reducer';
import {
  storeCap,
  workCost,
  workOnceNow,
  workSpent,
  workSubsidised,
  worksFor,
} from '../../engine/simulation';
import { DevEffects } from '../components/DevCorner';
import { MovedBoards } from '../components/MovedBoards';
import { WORKS } from '../../content/works';
import { freePlots, needsPlacement, occupantOf, plotsFor } from '../../engine/plots';
import type { GameState, PlotId, Season, WorkDef, WorkId } from '../../engine/types';
import { TYPE } from '../type';

/** The one board a price is paid out of. */
const STORE = STATS.find((s) => s.id === 'economy')!;

interface Props {
  state: GameState;
  dev?: boolean;
  season: Season;
  /** What the town should draw a ghost of while it is being considered. */
  onPreview?: (id: WorkId | null) => void;
  /** The thing this year is actually settling on, so the town can offer ground. */
  onPick?: (id: WorkId | null) => void;
  /** The ground picked for it, held above this card because the town shares it. */
  plot: PlotId | null;
  onPlot: (plot: PlotId | null) => void;
  onBuild: (id: WorkId, plot?: PlotId) => void;
  onReopen: (proposalId: string) => void;
  /**
   * The shelf was opened from the mark in the corner rather than by the year
   * arriving at it, so it can be put away again. Absent in the year's own
   * turn for it, where the only way out is to spend the year.
   */
  onClose?: () => void;
}

type Pick = { kind: 'work'; id: WorkId } | { kind: 'law'; id: string };

/**
 * The other half of a year. A law says what the place believes; a building
 * says what it can do, and there is room for exactly one of them per year.
 *
 * Picking one points at the town rather than at this list: the ghost of it
 * stands where it would stand and breathes until it is paid for, and the
 * thread from the card runs up to that ground. The question "what does this
 * change" gets answered in the place it changes.
 */
export function Works({
  state,
  dev = false,
  season,
  onPreview,
  onPick,
  plot,
  onPlot,
  onBuild,
  onReopen,
  onClose,
}: Props) {
  const [picked, setPicked] = useState<Pick | null>(null);
  /* The year is spent, so the shelf is a thing to read and not a thing to
     take from; or the year has come round to it, in which case reopening a
     law is on the table as well. Reopening only then: it puts the drafting
     table in front of you at once, and in the spring that would push out
     whoever was already standing there. */
  const spent = workSpent(state);
  /* The shelf is the whole of this screen: the dev fixtures open on it, and
     nothing else in the game does any more. */
  const inPhase = state.phase === 'works';
  /* Opening a law again is the year's own business rather than the shelf's,
     so it is offered where the year has finished with whoever was at the door:
     on the shelf screen itself, and on the ruling just read. Anywhere else it
     would put the drafting table in front of somebody still standing there. */
  const canReopen = !spent && (inPhase || state.phase === 'aftermath');
  /** The list of standing laws stays folded until somebody asks for it. */
  const [reopenOpen, setReopenOpen] = useState(false);

  const pickWork = (id: WorkId) => {
    setPicked({ kind: 'work', id });
    onPreview?.(id);
    onPick?.(id);
    onPlot(null);
  };

  /** Whether this year still owes an answer to "and where". */
  const asking = picked?.kind === 'work' && needsPlacement(state, picked.id);
  const groundOpen = asking ? freePlots(state) : [];

  const offered = worksFor(state);
  const offeredIds = new Set(offered.map((w) => w.id));

  /**
   * A direction is a run of works that only makes sense in order, and it is
   * shown in order: the step that can be taken this year, and under it the
   * ones it opens, greyed and saying what they are waiting for. A chain with
   * its later links hidden is not a direction, it is a surprise.
   */
  const chain = WORKS.filter((w) => w.group === 'infrastructure');
  /* Not in the first year. That year is a roof or a saw pit and nothing else,
     which is the whole of what five people who walked out of somewhere last
     month are choosing between; a greyed run of roads and bridges under it
     turned the simplest year in the game into a shelf of eight things, six of
     which said "not yet". They all arrive in the second spring, together,
     along with the first law. */
  const chainShown =
    state.turn <= 1
      ? []
      : chain.filter((w) => offeredIds.has(w.id) || w.needsWork !== undefined);

  /* The year that costs nothing is not on the shelf, and is not under it
     either.

     It was the first card on the shelf, then a line under it on the foot of
     this card, and now it is gone: a year nobody spends is a year nobody
     spends, it pays nothing and it takes no click. What it used to be was the
     only way out of a screen that held the year still, and no screen holds the
     year still now. Asked for by the user. */
  const works = offered.filter((w) => w.group === undefined);
  const reopenable = reopenableProposals(state);

  /* There used to be a red line over the shelf on the years nothing on it was
     within the store: what the store held, and that the year could rest. Every
     price on the card is already beside its own work, the store is in the top
     bar all year, and a work that cannot be paid for is drawn dim and takes no
     click. The line said the arithmetic back to somebody who had just done
     it. */

  const card = 'answer w-full rounded-lg border p-3 text-left';
  const cardOpen = 'border-ink-line bg-ink-soft';
  const cardOn = 'border-seal bg-seal/20';
  const cardOff = 'border-transparent bg-ink-soft/40 opacity-50';

  const nameOf = (id: WorkId) => WORKS.find((w) => w.id === id)?.name ?? '';
  /** Levels, as a row of beads: filled for what stands, empty for what could. */
  const DOT = '●';
  const RING = '○';

  /**
   * One thing a year can be spent on, whether or not it can be spent yet.
   *
   * A mark, a name, the beads for how far it has been taken, one line of what
   * it is, and then a single row holding what it moves and what it costs. It
   * used to stack those last two, which made every card five lines tall and a
   * shelf of eight of them taller than the window.
   */
  const WorkCard = ({ work }: { work: WorkDef }) => {
    const level = state.buildings[work.id] ?? 0;
    const maxed = work.maxLevel > 0 && level >= work.maxLevel;
    const cost = workCost(state, work);
    // anything with a price can be too dear, and a full store only pays
    // half of a thing that is being built
    const tooDear = cost > 0 && state.stats.economy < cost;
    /**
     * And a price can be past the end of the shelf itself, which is a
     * different sentence and used to be told as the same one. The store holds
     * fifteen until somebody builds a granary, and the second floor of
     * anything costs seventeen: "the store cannot pay for it this year" was
     * true, and the year after, and every year of the reign, and a player
     * waiting for a number to climb to a ceiling above it waits forever.
     */
    const overShelf = cost > storeCap(state) && work.id !== 'granary';
    const subsidised = workSubsidised(state) && work.maxLevel > 0;
    /** Waiting on the step before it in its own chain, rather than on money. */
    const waiting =
      work.needsWork !== undefined &&
      (state.buildings[work.needsWork.id] ?? 0) < work.needsWork.level;
    const open = !maxed && !tooDear && !waiting && !spent;
    const on = picked?.kind === 'work' && picked.id === work.id;
    return (
      <button
        type="button"
        disabled={!open}
        onClick={() => pickWork(work.id)}
        onMouseEnter={() => open && onPreview?.(work.id)}
        onMouseLeave={() => onPreview?.(picked?.kind === 'work' ? picked.id : null)}
        className={`work-design-card ${card} ${on ? cardOn : open ? cardOpen : cardOff}`}
        aria-pressed={on}
        title={work.line}
      >
        {['house', 'woodcutter', 'granary', 'hall', 'long_room', 'watch_house', 'well'].includes(work.id) && <svg className="work-miniature" viewBox="-25 -65 210 165" aria-hidden="true"><WorkModel id={work.id} paint={PAINT[season]} level={Math.min(work.maxLevel, level + 1)} /></svg>}
        <div className="flex items-baseline justify-between gap-2">
          <span className="flex min-w-0 items-baseline gap-2">
            <span aria-hidden className={`shrink-0 ${TYPE.body} leading-none`}>
              {WORK_ICONS[work.id]}
            </span>
            <span className={`${TYPE.body} leading-snug text-parchment`}>{work.name}</span>
          </span>
          {work.maxLevel > 0 && (
            <span aria-hidden className={`shrink-0 ${TYPE.note} tracking-[0.2em] text-seal`}>
              {DOT.repeat(level)}
              {RING.repeat(work.maxLevel - level)}
            </span>
          )}
        </div>
        {on && <p className={`mt-1 ${TYPE.note} leading-snug text-parchment-dim`}>{work.line}</p>}

        {/* what it moves and what it costs, on one line, in that order */}
        <div className={`mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 pl-[22px] ${TYPE.note}`}>
          <MovedBoards row once={workOnceNow(state, work)} every={work.trend} place={state} />
          {waiting ? (
            <span className="text-parchment-dim">
              {UI.works.needsFirst.replace('{name}', nameOf(work.needsWork!.id))}
            </span>
          ) : maxed ? (
            <span className="text-parchment-dim">{UI.works.maxed}</span>
          ) : (
            (work.maxLevel > 0 || cost > 0) && (
              /* A thing you cannot afford still has a price, and the price is
                 the whole reason you cannot afford it. Say both, and say them
                 against the shelf they come off: the store's own mark, what
                 this takes, and what there is to take it from. Ten out of
                 twelve and ten out of forty are not the same decision, and
                 "costs 10 from the store" was the same sentence for both. */
              <span
                className={`flex items-baseline gap-1 rounded border px-1.5 ${
                  tooDear
                    ? 'border-bad/50 text-bad'
                    : subsidised
                      ? 'border-good/50 text-good'
                      : 'border-ink-line text-parchment-dim'
                }`}
                title={UI.works.costLabel}
              >
                <span aria-hidden>{STORE.emoji}</span>
                <span className="tabular-nums">
                  {(subsidised ? UI.works.free : UI.works.cost).replace('{n}', String(cost))}
                </span>
                <span className="sr-only">{UI.works.costLabel}</span>
              </span>
            )
          )}
        </div>
        {/* A store that cannot pay this year may pay next year, and that is
            the line over the shelf. A price past the end of the shelf itself
            will not be paid in any year of this reign, which is a fact about
            this card and stays on it. */}
        {overShelf && !waiting && !maxed && (
          <p className={`mt-0.5 pl-[22px] ${TYPE.note} text-bad`}>{UI.works.overShelf}</p>
        )}
      </button>
    );
  };

  return (
    <>
      <PopupHead
        mark="hammer"
        kicker={`${UI.works.heading} · ${UI.popup.ofYear
          .replace('{season}', UI.seasons[season])
          .replace('{n}', String(state.turn))}`}
        onClose={onClose}
        closeLabel={UI.works.close}
      />
      <div className="p-4">
        {/* What the shelf is today.

            Opened from the corner it says the year still comes; opened after
            the year is spent it says on what, and nothing below it takes a
            click. The way out is in the head now, beside the hammer. */}
        {(spent || !inPhase) && (
          <p className={`${TYPE.note} leading-snug text-parchment-dim`}>
            {spent
              ? state.lastWork
                ? UI.works.spent.replace('{name}', nameOf(state.lastWork))
                : UI.works.spentRest
              : UI.works.earlyLine}
          </p>
        )}

        {/* The other half of a year of work.

            What goes up is half the decision and where it goes is the other
            half, and the second half is answered on the town rather than in
            this list: every free piece of ground has a peg on it up there, the
            ghost of the building stands on whichever one is under the pointer,
            and nothing is ever moved afterwards. It sits at the top of the card
            the moment it is asked, because a question at the bottom of a list
            that has to be scrolled to is a question nobody knows they were
            asked. */}
        {asking && (
          <section className="mt-3 rounded-lg border border-seal/50 bg-seal/[0.08] p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className={`${TYPE.body} text-parchment`}>{UI.works.whereHeading}</span>
              <span className={`${TYPE.note} italic text-hair`}>{UI.works.whereLine}</span>
            </div>
            {groundOpen.length === 0 ? (
              <p className={`mt-2 ${TYPE.note} leading-snug text-bad`}>{UI.works.whereNone}</p>
            ) : (
              <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
                {plotsFor(state).map((id) => {
                  const taken = occupantOf(state, id);
                  const free = taken === null;
                  const on = plot === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={!free}
                      onClick={() => onPlot(id)}
                      title={free ? PLOT_NAMES[id].line : undefined}
                      className={`rounded-md border p-2 text-left ${
                        on
                          ? 'border-seal bg-seal/25'
                          : free
                            ? 'border-ink-line bg-ink-soft'
                            : 'border-transparent bg-ink-soft/40 opacity-50'
                      }`}
                    >
                      {/* The name, and nothing under it while the ground is
                          free: the same six names are already pegged out on
                          the town above this card, and a second line each
                          made the ground picker taller than the shelf it is
                          picking for. What the place is like is on the peg,
                          under the pointer. */}
                      <div className={`${TYPE.note} leading-snug text-parchment`}>
                        {PLOT_NAMES[id].label}
                      </div>
                      {!free && (
                        <p className={`mt-0.5 ${TYPE.note} leading-snug text-parchment-dim`}>
                          {UI.works.whereTaken.replace('{name}', nameOf(taken))}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Three across, not two.
           
            The shelf is the tallest thing in this game and the card it lives
            in comes up over the town: at two columns a village shelf of eight
            works is four rows deep, and four rows plus the run below them is
            the whole of the settlement behind glass. Three columns is the same
            eight works in three rows, and what that buys is the huts and the
            well back on screen while the year is being decided. Two on a
            laptop, one on a phone: a card three across at 900 pixels is three
            columns of one word each. */}
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {works.map((work) => (
            <WorkCard key={work.id} work={work} />
          ))}
        </div>

        {/* the one run of works that is a run and not a shelf */}
        {chainShown.length > 0 && (
          <section className="mt-4 rounded-lg border border-ink-line/70 p-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className={`${TYPE.label} text-parchment-dim`}>
                {UI.works.groupInfrastructure}
              </span>
              <span className={`${TYPE.note} italic text-hair`}>{UI.works.groupLine}</span>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {chainShown.map((work) => (
                <WorkCard key={work.id} work={work} />
              ))}
            </div>
          </section>
        )}

        {/* By the middle of a reign there is a card here for every law standing.
            Opening a law again is a rare thing to want, so it asks first. */}
        {canReopen && reopenable.length > 0 && (
          <section className="mt-4">
            <button
              type="button"
              onClick={() => setReopenOpen((v) => !v)}
              aria-expanded={reopenOpen}
              className="flex w-full items-center justify-between gap-2 rounded-md border border-ink-line px-3 py-2 text-left"
            >
              <span className={`${TYPE.body} text-parchment`}>
                {UI.works.reopenToggle.replace('{n}', String(reopenable.length))}
              </span>
              <span aria-hidden className={`${TYPE.note} text-parchment-dim`}>
                {reopenOpen ? '▴' : '▾'}
              </span>
            </button>
            <div className={`grid gap-2 sm:grid-cols-2 ${reopenOpen ? 'mt-2' : 'hidden'}`}>
              {reopenable.map((id) => {
                const proposal = getProposal(id);
                if (!proposal) return null;
                const subject = proposal.options[0].subject;
                const label = SUBJECTS.find((s) => s.id === subject);
                const on = picked?.kind === 'law' && picked.id === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setPicked({ kind: 'law', id });
                      onPreview?.(null);
                      onPick?.(null);
                      onPlot(null);
                    }}
                    className={`${card} ${on ? cardOn : cardOpen}`}
                  >
                    <div className="flex items-center gap-2">
                      <span aria-hidden>{label?.emoji ?? '📜'}</span>
                      <span className={`${TYPE.body} text-parchment`}>
                        {UI.works.reopen.replace(
                          '{subject}',
                          (label?.label ?? subject).toLowerCase(),
                        )}
                      </span>
                    </div>
                    <p className={`mt-1 ${TYPE.note} leading-snug text-parchment-dim`}>
                      {UI.works.reopenLine}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {dev && picked?.kind === 'work' && (
          <DevEffects
            extra={[
              ['work', picked.id],
              ['cost', String(workCost(state, WORKS.find((w) => w.id === picked.id)!))],
            ]}
          />
        )}

        {/* The one button, kept in view. The card is capped and scrolls, and
            the button used to be the last thing in it, so on a card with a
            direction and a fold of standing laws the way to spend the year was
            below the bottom edge of the window until somebody went looking. It
            sits on the bottom edge of the scroll now, on its own paper. */}
        {!spent && (
        <CardFoot>
          <div className="flex min-w-0 flex-col items-center gap-1.5">
            <button
              type="button"
              disabled={picked === null || (asking && plot === null)}
              onClick={() => {
                if (!picked) return;
                if (picked.kind === 'work') onBuild(picked.id, plot ?? undefined);
                else onReopen(picked.id);
              }}
              className={`${CARD_BUTTON} bg-timber text-ink`}
            >
              {asking && plot !== null
                ? UI.works.whereOn.replace('{where}', PLOT_NAMES[plot].label.toUpperCase())
                : asking
                  ? UI.works.wherePick
                  : UI.works.choose}
            </button>
          </div>
        </CardFoot>
        )}
      </div>
    </>
  );
}
