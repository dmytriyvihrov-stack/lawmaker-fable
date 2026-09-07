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
  opts: { lawAllowed?: boolean } = {},
): CurrentEvent | null {
  const lawAllowed = opts.lawAllowed !== false;
  // 1. PENDING
  const due = draft.pending.filter((p) => p.onTurn <= draft.turn);
  if (due.length > 0) {
    let best = due[0];
    for (const p of due) {
      if (p.onTurn < best.onTurn || (p.onTurn === best.onTurn && p.seq < best.seq)) best = p;
    }
    draft.pending = draft.pending.filter((p) => p !== best);
    return { kind: 'case', id: best.caseId };
  }

  // 2. URGENT
  const cases = allCases();
  let urgentId: string | null = null;
  let urgentPrio = Number.POSITIVE_INFINITY;
  for (const c of cases) {
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

  const casePick = (): CurrentEvent | null => {
    const candidates = cases.filter(
      (c) =>
        c.trigger !== null &&
        !recurring(c.id) &&
        !draft.shownCases.includes(c.id) &&
        c.priority > CONFIG.urgentPriority &&
        evaluate(c.trigger, draft),
    );
    if (candidates.length === 0) return null;
    /* The keen band goes first, and only then the lottery. A person the reign
       has already decided about comes back the first year there is room for
       them, ahead of the callers who wait on nobody; between two of them, the
       lower number, and between equals the seed. */
    const keen = candidates.filter((c) => c.priority <= CONFIG.keenPriority);
    const pool = keen.length > 0 ? keen : candidates;
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
  };

  /**
   * And when the written arc has nothing left, the ordinary business of the
   * place. Last on purpose: a scene that can be asked again must never take
   * the year from one that cannot. Whichever has been away longest, and the
   * seed between equals, and never one that has been round inside
   * `year.recurAfter`, so a quiet year is still allowed to happen.
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
  const second = casePick();
  if (second) return second;
  const third = roundPick();
  if (third) return third;

  // 4. nothing left
  return null;
}
