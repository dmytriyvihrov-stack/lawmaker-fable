/**
 * What somebody playing thought of a thing, at the moment it happened to them.
 *
 * The pencils beside it (`devEditsStore`) are for a line that is wrong and
 * ought to say something else. This is the other half, and the cheaper one: a
 * thumb, on the spot, for the case that landed and the case that did not. It
 * costs one click and it is the only note anybody actually leaves while they
 * are still playing rather than reviewing.
 *
 * A mark is filed against the piece of content and not against the reign it
 * turned up in, because the thing being judged is the writing: the same case
 * in a second playthrough is the same case. The year is kept anyway, because
 * "this one dragged" means something different in year two and year twenty.
 *
 * Like the edits, this is a scratch pad in this browser and nothing else. It
 * never touches the save, it never touches `src/content/*`, and the whole
 * point of it is the batch that gets copied out and handed over.
 */
export type Verdict = 'up' | 'down';

export interface DevMark {
  /** The content, not the moment: `case:v1_idle_hand`, `moment:the_rod`. */
  id: string;
  /** What it was, in words, so the batch reads without the game beside it. */
  label: string;
  /** Absent when only a note was left, which is a remark and not a verdict. */
  verdict?: Verdict;
  note?: string;
  /** The year it was marked in. */
  turn: number;
  updatedAt: number;
}

const KEY = 'lawmaker_dev_marks_v1';
type Store = Record<string, DevMark>;

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
    // private mode or full storage: the marks live for the tab and no longer
  }
}

let state: Store = load();
const listeners = new Set<() => void>();

function emit(): void {
  for (const l of listeners) l();
}

export function subscribeDevMarks(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDevMarksSnapshot(): Store {
  return state;
}

/** An entry that asks for nothing is not an entry, so it takes itself out. */
function write(id: string, next: DevMark | null): void {
  const all = { ...state };
  if (next === null || (next.verdict === undefined && !next.note)) delete all[id];
  else all[id] = { ...next, updatedAt: Date.now() };
  state = all;
  persist(state);
  emit();
}

/**
 * A thumb, up or down. The same thumb again takes it back: a mark left by a
 * misclick has to be as cheap to undo as it was to make, and there is no
 * third state worth a button.
 */
export function markDev(id: string, label: string, verdict: Verdict, turn: number): void {
  const had = state[id];
  const same = had?.verdict === verdict;
  write(id, {
    id,
    label,
    verdict: same ? undefined : verdict,
    note: had?.note,
    turn: had?.turn ?? turn,
    updatedAt: 0,
  });
}

/** A line of why, which is worth more than the thumb and is never required. */
export function noteDev(id: string, label: string, note: string, turn: number): void {
  const had = state[id];
  write(id, {
    id,
    label,
    verdict: had?.verdict,
    note: note.trim() || undefined,
    turn: had?.turn ?? turn,
    updatedAt: 0,
  });
}

export function clearDevMark(id: string): void {
  if (!(id in state)) return;
  write(id, null);
}

export function clearAllDevMarks(): void {
  state = {};
  persist(state);
  emit();
}

/** One block per mark, in the shape a person pastes into a chat. */
export function formatDevMarksForExport(marks: Store): string {
  const rows = Object.values(marks).sort((a, b) => a.turn - b.turn || a.id.localeCompare(b.id));
  if (rows.length === 0) return '';
  return rows
    .map((m) => {
      const verdict = m.verdict === 'up' ? 'GOOD' : m.verdict === 'down' ? 'POOR' : 'SEEN';
      const lines = [`# ${m.id} (year ${m.turn})`, `${verdict}: ${m.label}`];
      if (m.note) lines.push(`NOTE: ${m.note}`);
      return lines.join('\n');
    })
    .join('\n\n');
}
