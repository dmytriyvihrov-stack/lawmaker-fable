/**
 * Where a dev-mode text edit goes while nobody has applied it to the content
 * files yet.
 *
 * This is not part of the save file and never touches game state: it is a
 * separate, local scratch pad a playtester writes on top of the running game.
 * An edit here changes what the screen shows immediately, so a proposed
 * rewrite can be read in place before it is worth sending anywhere. It does
 * not change `src/content/*`, because a browser tab cannot write to disk;
 * the point of the panel is to collect what changed and hand it to whoever
 * can.
 */
export interface DevEdit {
  id: string;
  /** What the content file currently says, so a diff is always possible. */
  original: string;
  /** The rewrite, if there is one. Absent means only a note was left. */
  text?: string;
  /** "Note to AI": a request rather than a rewrite, e.g. "needs a joke here". */
  note?: string;
  /**
   * Struck out: this line should not be in the game at all.
   *
   * A rewrite to an empty string and a deletion are two different requests -
   * "say nothing here" and "there should be nothing here" - and whoever
   * applies the batch needs to be able to tell them apart, so it is a flag of
   * its own rather than an empty `text`. On screen the line disappears either
   * way, which is the point: you can see the screen without it before anybody
   * commits to it.
   */
  removed?: boolean;
  updatedAt: number;
}

const KEY = 'lawmaker_dev_edits_v1';
type Store = Record<string, DevEdit>;

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function persist(next: Store): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // private mode or full storage: edits live for the tab and no longer
  }
}

/**
 * A name for a line of text that nobody had to write down first.
 *
 * The wired-up pencils file an edit under a hand-written id like
 * `case:v1_idle_hand:question`, which is better, and there are eight of them
 * in a game with several thousand lines. Anything picked up off the screen is
 * filed under what it says instead: whoever applies the batch has the exact
 * sentence to search the content files for, and the same sentence picked twice
 * lands on the same entry.
 */
export function idForText(text: string): string {
  let h = 5381;
  const key = text.trim();
  for (let i = 0; i < key.length; i++) h = ((h * 33) ^ key.charCodeAt(i)) >>> 0;
  return `text:${h.toString(36)}:${key.slice(0, 24).replace(/\s+/g, '-').toLowerCase()}`;
}

let state: Store = load();
const listeners = new Set<() => void>();

function emit(): void {
  for (const l of listeners) l();
}

export function subscribeDevEdits(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDevEditsSnapshot(): Store {
  return state;
}

/**
 * Save a rewrite, a note, a deletion, or any two of the three. An entry that
 * asks for none of them is not an entry, so it clears itself.
 */
export function saveDevEdit(
  id: string,
  original: string,
  text: string,
  note: string,
  removed = false,
): void {
  const trimmedText = text.trim();
  const trimmedNote = note.trim();
  const rewritten = !removed && trimmedText !== original.trim();
  const next = { ...state };
  if (!rewritten && trimmedNote === '' && !removed) {
    delete next[id];
  } else {
    next[id] = {
      id,
      original,
      text: rewritten ? trimmedText : undefined,
      note: trimmedNote || undefined,
      removed: removed || undefined,
      updatedAt: Date.now(),
    };
  }
  state = next;
  persist(state);
  emit();
}

export function resetDevEdit(id: string): void {
  if (!(id in state)) return;
  const next = { ...state };
  delete next[id];
  state = next;
  persist(state);
  emit();
}

export function clearAllDevEdits(): void {
  state = {};
  persist(state);
  emit();
}

/** One block of plain text per edit, in the shape a person can paste into chat. */
export function formatDevEditsForExport(edits: Store): string {
  const rows = Object.values(edits).sort((a, b) => a.id.localeCompare(b.id));
  if (rows.length === 0) return '';
  return rows
    .map((e) => {
      const lines = [`# ${e.id}`, `WAS: ${e.original}`];
      if (e.text !== undefined) lines.push(`NOW: ${e.text}`);
      if (e.note) lines.push(`NOTE: ${e.note}`);
      return lines.join('\n');
    })
    .join('\n\n');
}
