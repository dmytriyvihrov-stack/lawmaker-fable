import { useState } from 'react';
import { PLOT_NAMES, SUBJECTS, WORK_ICONS } from '../../content/meta';
import { UI } from '../../content/ui-strings';
import { PopupHead } from '../components/Popup';
import { getProposal } from '../../engine/registry';
import { reopenableProposals } from '../../engine/reducer';
import { storeCap, workCost, workOnce, workSubsidised, worksFor } from '../../engine/simulation';
import { DevEffects } from '../components/DevCorner';
import { MovedBoards } from '../components/MovedBoards';
import { WORKS } from '../../content/works';
import { freePlots, needsPlacement, occupantOf, PLOT_IDS } from '../../engine/plots';
import type { GameState, PlotId, Season, WorkDef, WorkId } from '../../engine/types';

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
}: Props) {
  const [picked, setPicked] = useState<Pick | null>(null);
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
  const chainShown = chain.filter((w) => offeredIds.has(w.id) || w.needsWork !== undefined);

  // The year that costs nothing goes at the top: it is the one every reign
  // reaches for when there is nothing left to spend, and hunting for it at the
  // bottom of a list of things it cannot afford was the wrong shape of asking.
  const works = offered
    .filter((w) => w.group === undefined)
    .sort((a, b) => (a.id === 'rest' ? -1 : b.id === 'rest' ? 1 : 0));
  const reopenable = reopenableProposals(state);

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
    const open = !maxed && !tooDear && !waiting;
    const on = picked?.kind === 'work' && picked.id === work.id;
    return (
      <button
        type="button"
        disabled={!open}
        onClick={() => pickWork(work.id)}
        onMouseEnter={() => open && onPreview?.(work.id)}
        onMouseLeave={() => onPreview?.(picked?.kind === 'work' ? picked.id : null)}
        className={`${card} ${on ? cardOn : open ? cardOpen : cardOff}`}
      >
        <div className="flex items-baseline justify-between gap-2">
          <span className="flex min-w-0 items-baseline gap-2">
            <span aria-hidden className="shrink-0 text-[14px] leading-none">
              {WORK_ICONS[work.id]}
            </span>
            <span className="text-[14px] leading-snug text-parchment">{work.name}</span>
          </span>
          {work.maxLevel > 0 && (
            <span aria-hidden className="shrink-0 text-[11px] tracking-[0.2em] text-seal">
              {DOT.repeat(level)}
              {RING.repeat(work.maxLevel - level)}
            </span>
          )}
        </div>
        <p className="mt-0.5 pl-[22px] text-[12px] leading-snug text-parchment-dim">{work.line}</p>

        {/* what it moves and what it costs, on one line, in that order */}
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 pl-[22px] text-[11px]">
          <MovedBoards row once={workOnce(state, work)} every={work.trend} place={state} />
          {waiting ? (
            <span className="text-parchment-dim">
              {UI.works.needsFirst.replace('{name}', nameOf(work.needsWork!.id))}
            </span>
          ) : maxed ? (
            <span className="text-parchment-dim">{UI.works.maxed}</span>
          ) : (
            (work.maxLevel > 0 || cost > 0) && (
              /* A thing you cannot afford still has a price, and the price is
                 the whole reason you cannot afford it. Say both. */
              <span className={subsidised ? 'text-good' : 'text-parchment-dim'}>
                {(subsidised ? UI.works.free : UI.works.cost).replace('{n}', String(cost))}
              </span>
            )
          )}
        </div>
        {tooDear && !waiting && !maxed && (
          <p className="mt-0.5 pl-[22px] text-[11px] text-bad">
            {overShelf
              ? UI.works.overShelf.replace('{n}', String(cost))
              : UI.works.cannotPay}
          </p>
        )}
      </button>
    );
  };

  return (
    <>
      <PopupHead
        kicker={`${UI.works.heading} · ${UI.popup.ofYear
          .replace('{season}', UI.seasons[season])
          .replace('{n}', String(state.turn))}`}
      />
      <div className="p-4">
        <p className="text-[15px] text-parchment">{UI.works.prompt}</p>

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
              <span className="text-[13px] text-parchment">{UI.works.whereHeading}</span>
              <span className="text-[10px] italic text-hair">{UI.works.whereLine}</span>
            </div>
            {groundOpen.length === 0 ? (
              <p className="mt-2 text-[12px] leading-snug text-bad">{UI.works.whereNone}</p>
            ) : (
              <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
                {PLOT_IDS.map((id) => {
                  const taken = occupantOf(state, id);
                  const free = taken === null;
                  const on = plot === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={!free}
                      onClick={() => onPlot(id)}
                      className={`rounded-md border p-2 text-left ${
                        on
                          ? 'border-seal bg-seal/25'
                          : free
                            ? 'border-ink-line bg-ink-soft'
                            : 'border-transparent bg-ink-soft/40 opacity-50'
                      }`}
                    >
                      <div className="text-[12px] leading-snug text-parchment">
                        {PLOT_NAMES[id].label}
                      </div>
                      <p className="mt-0.5 text-[10px] leading-snug text-parchment-dim">
                        {free
                          ? PLOT_NAMES[id].line
                          : UI.works.whereTaken.replace('{name}', nameOf(taken))}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {works.map((work) => (
            <WorkCard key={work.id} work={work} />
          ))}
        </div>

        {/* the one run of works that is a run and not a shelf */}
        {chainShown.length > 0 && (
          <section className="mt-4 rounded-lg border border-ink-line/70 p-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-parchment-dim">
                {UI.works.groupInfrastructure}
              </span>
              <span className="text-[10px] italic text-hair">{UI.works.groupLine}</span>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {chainShown.map((work) => (
                <WorkCard key={work.id} work={work} />
              ))}
            </div>
          </section>
        )}

        {/* By the middle of a reign there is a card here for every law standing.
            Opening a law again is a rare thing to want, so it asks first. */}
        {reopenable.length > 0 && (
          <section className="mt-4">
            <button
              type="button"
              onClick={() => setReopenOpen((v) => !v)}
              aria-expanded={reopenOpen}
              className="flex w-full items-center justify-between gap-2 rounded-md border border-ink-line px-3 py-2 text-left"
            >
              <span className="text-[13px] text-parchment">
                {UI.works.reopenToggle.replace('{n}', String(reopenable.length))}
              </span>
              <span aria-hidden className="text-[12px] text-parchment-dim">
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
                      <span className="text-[14px] text-parchment">
                        {UI.works.reopen.replace(
                          '{subject}',
                          (label?.label ?? subject).toLowerCase(),
                        )}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] leading-snug text-parchment-dim">
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
        <div className="sticky -mx-4 -mb-4 mt-4 bg-ink-soft/95 px-4 pb-4 pt-2 [bottom:0]">
          <button
            type="button"
            disabled={picked === null || (asking && plot === null)}
            onClick={() => {
              if (!picked) return;
              if (picked.kind === 'work') onBuild(picked.id, plot ?? undefined);
              else onReopen(picked.id);
            }}
            className="min-h-[48px] w-full rounded-lg bg-seal px-5 py-2 text-[17px] tracking-[0.2em] text-parchment disabled:opacity-30"
          >
            {asking && plot !== null
              ? UI.works.whereOn.replace('{where}', PLOT_NAMES[plot].label.toUpperCase())
              : asking
                ? UI.works.wherePick
                : UI.works.choose}
          </button>
        </div>
      </div>
    </>
  );
}
