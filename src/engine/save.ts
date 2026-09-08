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

/**
 * What was in the slot, and whether it could be opened.
 *
 * `loadGame` used to answer `null` to three completely different questions -
 * nobody has played here, there is a reign but it was written by another
 * version, and there is something in the slot that is not a reign at all -
 * and the Title screen showed the same thing for all three: no Continue
 * button, no word, an hour of somebody's play gone without a sentence about
 * it. It answers them separately now, and the Title says so.
 */
export type SaveSlot =
  | { kind: 'none' }
  | { kind: 'ok'; state: GameState }
  | { kind: 'stale'; version: unknown };

export function readSave(): SaveSlot {
  let parsed: unknown;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { kind: 'none' };
    parsed = JSON.parse(raw);
  } catch {
    return { kind: 'none' };
  }
  if (typeof parsed !== 'object' || parsed === null) return { kind: 'none' };
  const version = (parsed as { version?: unknown }).version;
  const carried = version === SAVE_VERSION ? fillGaps(parsed as Record<string, unknown>) : parsed;
  if (isGameState(carried)) return { kind: 'ok', state: carried };
  return { kind: 'stale', version };
}

export function loadGame(): GameState | null {
  const slot = readSave();
  return slot.kind === 'ok' ? slot.state : null;
}

/**
 * A reign of this version that is missing something this version has since
 * grown.
 *
 * The save is the whole state and the state gains fields: `floored`, the
 * kingdom's `world`, whatever comes next. Every one of those has been optional
 * so far, which is luck rather than design - the day one of them is not, every
 * reign in every browser is dropped on the floor by the check below. Anything
 * absent that has an empty shape gets its empty shape here, and the check then
 * decides. Nothing is ever invented: a missing number or a missing string
 * cannot be guessed at, and a save missing one is honestly unreadable.
 */
const EMPTY: Record<string, unknown> = {
  boards: [],
  ledger: [],
  verdicts: [],
  laws: [],
  exceptions: [],
  usedProposals: [],
  shownCases: [],
  pending: [],
  flags: [],
  cityFlags: [],
  iva: [],
  log: [],
  techs: [],
  bonds: {},
  placements: {},
  floored: {},
  buildings: {},
  pendingTownBonus: {},
};

function fillGaps(raw: Record<string, unknown>): unknown {
  const out: Record<string, unknown> = { ...raw };
  for (const [key, empty] of Object.entries(EMPTY)) {
    if (out[key] === undefined || out[key] === null) {
      out[key] = Array.isArray(empty) ? [] : { ...(empty as object) };
    }
  }
  return out;
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // nothing to clear
  }
}

export function hasSave(): boolean {
  return readSave().kind === 'ok';
}

/**
 * Everything this game has ever written into this browser, gone: the reign in
 * the slot, the pending text edits, the speed, the sound, the music, and the
 * note saying the four dials have already been explained once.
 *
 * By prefix rather than by a list of names, on purpose. Six keys live in five
 * files across two layers, and the list went stale the first time somebody
 * added a sixth; every key this game owns begins `lawmaker`, and a key added
 * next year will too. Nothing else in the browser is touched.
 *
 * This is the dev switch's clean slate. The player's own "Begin a reign"
 * still only clears the save, because a new reign is not a reason to forget
 * that somebody turned the music off.
 */
export function forgetEverything(): void {
  try {
    const ours: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('lawmaker')) ours.push(key);
    }
    for (const key of ours) localStorage.removeItem(key);
  } catch {
    // private mode: there was nothing written down to forget
  }
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

/**
 * The two later notes, on the same terms as the primer above.
 *
 * Neither of them can be said on the first screen: one is about the person at
 * the door and the other is about a thing out on the meadow, and on the day
 * the primer is read there is neither. So each waits for the thing it is
 * about to be on screen, and each is remembered by the browser rather than by
 * the reign, so a second reign is not a second lecture.
 *
 * Both keys begin `lawmaker`, which is the whole of what `forgetEverything`
 * looks for: `clear history` puts the tutorial back with everything else.
 */
const NOTE_KEYS = {
  /** What a dilemma is, said when the first one is standing there. */
  door: 'lawmaker_seen_door_v1',
  /** What the small things on the map are, said over the first one. */
  smallThing: 'lawmaker_seen_small_thing_v1',
} as const;

export type NoteId = keyof typeof NOTE_KEYS;

export function hasSeenNote(id: NoteId): boolean {
  try {
    return localStorage.getItem(NOTE_KEYS[id]) === '1';
  } catch {
    return false;
  }
}

export function markNoteSeen(id: NoteId): void {
  try {
    localStorage.setItem(NOTE_KEYS[id], '1');
  } catch {
    // private mode or full storage: it will simply be offered again
  }
}

/**
 * The shape check. A save that fails this is not repaired past `fillGaps`
 * above: a reign is a reign or it is not, and half a reign is worse than none.
 * What changed is that failing it is now something the player is told about.
 */
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
