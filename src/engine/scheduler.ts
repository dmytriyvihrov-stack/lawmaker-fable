import { CONFIG } from './config';
import { evaluate } from './conditions';
import { rand01 } from './rng';
import { allCases, allProposals } from './registry';
import type { CurrentEvent, GameState } from './types';

/**
 * The scenes that come round rather than happening once.
 *
 * Every other case in this game is spent the first time it is answered, which
 * is right for the arc and wrong for a reign that outlasts it: forty seven
 * one-shot scenes and thirty years leaves the last decade with nobody at the
 * door. These are the ordinary recurring business of a place - a stone, a
 * bench, a gate in November, the bottom of the store - and the convention is
 * the id, the way `x_` is a crisis and `r1_` is somebody coming back.
 */
const recurring = (id: string): boolean => id.startsWith('rr_');

/**
 * Whether the last person through this door was one of the warm ones.
 *
 * Read off the log rather than kept in the save: the log already says which
 * case was ruled on and when, and a field for this would be a field about the
 * scheduler's mood rather than about the reign.
 */
function lastWasWarm(s: GameState): boolean {
  let last: string | null = null;
  let turn = Number.NEGATIVE_INFINITY;
  for (const line of s.log) {
    if (line.kind === 'case' && line.turn >= turn) {
      turn = line.turn;
      last = line.refId ?? null;
    }
  }
  if (last === null) return false;
  const was = allCases().find((c) => c.id === last);
  return was !== undefined && was.priority >= CONFIG.year.warmFrom;
}

/** The year this scene was last ruled on. `-Infinity` if it never has been. */
function lastSeen(s: GameState, id: string): number {
  let last = Number.NEGATIVE_INFINITY;
  for (const line of s.log) {
    if (line.kind === 'case' && line.refId === id && line.turn > last) last = line.turn;
  }
  return last;
}

/**
 * Picks the event for the current turn (section 5.3).
 * Takes a draft state that the reducer has already cloned: it consumes the
 * pending entry, so it must not be called on live state.
 */
export function pickEvent(
  draft: GameState,
  opts: { lawAllowed?: boolean; heavyAllowed?: boolean; consequencesOnly?: boolean } = {},
): CurrentEvent | null {
  const lawAllowed = opts.lawAllowed !== false;
  /**
   * The consequence slot, which is the second half of one dilemma a year.
   *
   * A year holds one person at the door with a question, and one thing coming
   * back off an answer you already gave. Two branches are that second thing
   * and no others: the diary, which is what an answer scheduled for years
   * later, and the keen band, which is somebody the reign has already decided
   * about walking back up to the door. A fresh caller who happened to be next
   * in the queue is not a consequence and does not get this slot.
   */
  const consequencesOnly = opts.consequencesOnly === true;
  /**
   * Whether this slot may be filled by something hard.
   *
   * A year holds two people, and a player asked that it never hold two hard
   * ones: the year of work is the beat between the difficult things, and with
   * a second crisis stacked behind the first the beat never lands. The heavy
   * scenes are the two branches below - a promise the reign already made, and
   * anything the scheduler files at or under the urgent line - so a slot that
   * has spent its one heavy scene simply does not read them. What it can still
   * have is a caller, which is the half of this game that was written to be
   * enjoyed.
   */
  const heavyAllowed = opts.heavyAllowed !== false;
  /* Every scene in the game, read once: the keen band below is looked at
     before the urgent one on a consequence slot, so this cannot wait until
     step 2 the way it used to. */
  const cases = allCases();

  // 1. PENDING
  const due = heavyAllowed ? draft.pending.filter((p) => p.onTurn <= draft.turn) : [];
  if (due.length > 0) {
    let best = due[0];
    for (const p of due) {
      if (p.onTurn < best.onTurn || (p.onTurn === best.onTurn && p.seq < best.seq)) best = p;
    }
    draft.pending = draft.pending.filter((p) => p !== best);
    return { kind: 'case', id: best.caseId };
  }
  /* and when the diary is empty, the other kind of consequence: somebody
     the reign has already decided about, coming back about it. Nothing else
     may stand in this slot. */
  if (consequencesOnly) return casePick('keen');

  // 2. URGENT
  let urgentId: string | null = null;
  let urgentPrio = Number.POSITIVE_INFINITY;
  for (const c of heavyAllowed ? cases : []) {
    if (c.trigger === null) continue;
    if (c.priority > CONFIG.urgentPriority) continue;
    if (draft.shownCases.includes(c.id)) continue;
    if (!evaluate(c.trigger, draft)) continue;
    if (c.priority < urgentPrio) {
      urgentId = c.id;
      urgentPrio = c.priority;
    }
  }
  if (urgentId !== null) return { kind: 'case', id: urgentId };

  // 3. TURN SLOT
  const proposalPick = (): CurrentEvent | null => {
    const candidates = allProposals().filter(
      (p) =>
        !draft.usedProposals.includes(p.id) &&
        (p.unlockedBy === undefined || evaluate(p.unlockedBy, draft)),
    );
    if (candidates.length === 0) return null;
    const minAct = Math.min(...candidates.map((p) => p.act));
    const inAct = candidates.filter((p) => p.act === minAct);
    let best = inAct[0];
    let bestR = rand01(draft.seed, 'prop', best.id);
    for (const p of inAct.slice(1)) {
      const r = rand01(draft.seed, 'prop', p.id);
      if (r < bestR) {
        best = p;
        bestR = r;
      }
    }
    return { kind: 'proposal', id: best.id };
  };

  /**
   * The written arc, in three bands rather than one queue.
   *
   * `keen` is somebody the reign has already decided about, coming back the
   * first year there is room; `arc` is the rest of the written business; and
   * `warm` is the half of this game that was written to be enjoyed, which the
   * priority numbers put permanently at the back of the queue.
   *
   * That queue was fine while a year held two people, because the second of
   * them could not be a hard one and a warm caller was the only thing left to
   * fill it. With one person a year it is not: taking the lowest number every
   * time gave twelve reigns 15.7 crises each and 1.9 warm scenes between them,
   * and left ten cases unreachable. So the slot alternates instead, and which
   * band it reads is decided outside, by what the last person at the door was.
   */
  function casePick(band: 'keen' | 'arc' | 'warm'): CurrentEvent | null {
    const candidates = cases.filter(
      (c) =>
        c.trigger !== null &&
        !recurring(c.id) &&
        !draft.shownCases.includes(c.id) &&
        c.priority > CONFIG.urgentPriority &&
        evaluate(c.trigger, draft),
    );
    const pool = candidates.filter((c) =>
      band === 'keen'
        ? c.priority <= CONFIG.keenPriority
        : band === 'warm'
          ? c.priority >= CONFIG.year.warmFrom
          : c.priority > CONFIG.keenPriority && c.priority < CONFIG.year.warmFrom,
    );
    if (pool.length === 0) return null;
    // inside a band: the lower number, and the seed between equals
    let best = pool[0];
    let bestR = rand01(draft.seed, 'case', draft.turn, best.id);
    for (const c of pool.slice(1)) {
      const r = rand01(draft.seed, 'case', draft.turn, c.id);
      if (c.priority < best.priority || (c.priority === best.priority && r < bestR)) {
        best = c;
        bestR = r;
      }
    }
    return { kind: 'case', id: best.id };
  }

  /**
   * And the ordinary business of the place: a stone, a bench, a gate in
   * November, the bottom of the store. It comes after everything written, so
   * a scene that can be asked again never takes the year from one that
   * cannot, except on a warm turn where there is no warm caller left to have
   * it. Whichever has been away longest, and the seed between equals, and
   * never one that has been round inside `year.recurAfter`, so a quiet year
   * is still allowed to happen.
   */
  const roundPick = (): CurrentEvent | null => {
    const pool = cases.filter(
      (c) =>
        recurring(c.id) &&
        c.trigger !== null &&
        evaluate(c.trigger, draft) &&
        draft.turn - lastSeen(draft, c.id) >= CONFIG.year.recurAfter,
    );
    if (pool.length === 0) return null;
    let best = pool[0];
    let bestSeen = lastSeen(draft, best.id);
    let bestR = rand01(draft.seed, 'round', draft.turn, best.id);
    for (const c of pool.slice(1)) {
      const seen = lastSeen(draft, c.id);
      const r = rand01(draft.seed, 'round', draft.turn, c.id);
      if (seen < bestSeen || (seen === bestSeen && r < bestR)) {
        best = c;
        bestSeen = seen;
        bestR = r;
      }
    }
    return { kind: 'case', id: best.id };
  };

  // a decree opens the year it is due; otherwise the year belongs to people
  const first = lawAllowed ? proposalPick() : null;
  if (first) return first;

  /* And whose turn it is. One person a year means this slot is not choosing a
     scene so much as choosing what a whole year feels like, so it takes turns:
     after anybody hard, the next person through the door is somebody warm if
     there is one, and after somebody warm it is back to the written arc.

     The keen band is last here and not first, because it belongs to the other
     slot: somebody coming back about a ruling of yours is a consequence, and
     the consequence slot is where the year keeps them. It is still read here,
     so that a year with nothing else in it is never a year they wait through. */
  const warmTurn = !lastWasWarm(draft);
  const tries: (() => CurrentEvent | null)[] = warmTurn
    ? [() => casePick('warm'), roundPick, () => casePick('arc'), () => casePick('keen')]
    : [() => casePick('arc'), () => casePick('warm'), roundPick, () => casePick('keen')];
  for (const tryOne of tries) {
    const got = tryOne();
    if (got) return got;
  }

  // 4. nothing left
  return null;
}
