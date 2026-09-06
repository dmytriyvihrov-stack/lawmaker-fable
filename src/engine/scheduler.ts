import { CONFIG } from './config';
import { evaluate } from './conditions';
import { rand01 } from './rng';
import { allCases, allProposals } from './registry';
import type { CurrentEvent, GameState } from './types';

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

  // a decree opens the year it is due; otherwise the year belongs to people
  const first = lawAllowed ? proposalPick() : null;
  if (first) return first;
  const second = casePick();
  if (second) return second;

  // 4. nothing left
  return null;
}
