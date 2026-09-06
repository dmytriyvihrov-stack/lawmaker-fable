import type { GameState } from './types';

export const SAVE_KEY = 'lawmaker_demo_save_v1';
const SAVE_VERSION = 1;

/** One slot, written after every dispatch. There is no undo. */
export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // private mode or full storage: the run continues in memory
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isGameState(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // nothing to clear
  }
}

export function hasSave(): boolean {
  return loadGame() !== null;
}

/**
 * Whether this browser has already had the four-dial explainer, on any
 * reign. Tying it to "the first law of this save" meant nobody playing on
 * a save already past their first law ever saw it, including every save
 * still open from before the explainer existed. This is a fact about the
 * device, not the reign, so it lives outside the save.
 */
const WIRING_SEEN_KEY = 'lawmaker_seen_wiring_v1';

export function hasSeenWiring(): boolean {
  try {
    return localStorage.getItem(WIRING_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markWiringSeen(): void {
  try {
    localStorage.setItem(WIRING_SEEN_KEY, '1');
  } catch {
    // private mode or full storage: it will simply be offered again
  }
}

/** A save from another version is ignored, not repaired: one run, one format. */
function isGameState(value: unknown): value is GameState {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Partial<GameState>;
  return (
    s.version === SAVE_VERSION &&
    typeof s.seed === 'number' &&
    typeof s.turn === 'number' &&
    typeof s.phase === 'string' &&
    typeof s.stats === 'object' &&
    s.stats !== null &&
    Array.isArray(s.laws) &&
    Array.isArray(s.ledger) &&
    typeof s.stage === 'string' &&
    typeof s.buildings === 'object' &&
    s.buildings !== null &&
    typeof s.lastWorkTurn === 'number' &&
    typeof s.pendingTownBonus === 'object' &&
    s.pendingTownBonus !== null
  );
}
