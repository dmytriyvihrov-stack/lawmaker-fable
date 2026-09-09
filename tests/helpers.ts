import { chooseLaw, newGame } from '../src/engine/reducer';
import { getProposal } from '../src/engine/registry';
import type { GameState } from '../src/engine/types';

/**
 * A reign parked on a year, with whatever the test needs written over it.
 * `reignAt({ turn: 6, population: 30 })` is a place of thirty in its sixth
 * year and nothing else changed. Seed 11 unless the patch says otherwise.
 */
export function reignAt(patch: Partial<GameState> = {}): GameState {
  return { ...newGame(patch.seed ?? 11), ...patch };
}

/** The same reign with one case on the table. The phase is left alone. */
export function withCase(s: GameState, caseId: string): GameState {
  return { ...s, current: { kind: 'case', id: caseId } };
}

/** Seal a law without going through the drafting table. */
export function seal(s: GameState, proposalId: string, idx: number): GameState {
  const proposal = getProposal(proposalId)!;
  return chooseLaw(s, proposalId, idx, proposal.options[idx].label);
}
