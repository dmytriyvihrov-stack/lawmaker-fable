import { evaluate } from './conditions';
import { characterMeta } from '../content/meta';
import { allCases, allProposals, getCase, getProposal } from './registry';
import type { CaseEvent, CityFlag, Condition, GameState, LawId, LawOption } from './types';

/**
 * The chain the player should see: which law brought this scene, and what the
 * last decision changed in the town. Both are derived from state, so nothing
 * new is stored and a loaded save shows the same chain.
 */

type LawCondition = Extract<Condition, { kind: 'lawActive' } | { kind: 'lawEver' }>;

function lawConditions(cond: Condition | null | undefined, out: LawCondition[]): void {
  if (!cond) return;
  if (cond.kind === 'lawActive' || cond.kind === 'lawEver') out.push(cond);
  if (cond.kind === 'not') lawConditions(cond.cond, out);
  if (cond.kind === 'all' || cond.kind === 'any') {
    for (const c of cond.conds) lawConditions(c, out);
  }
}

/** The law that made this case possible, if the case grew out of one. */
export function causeLawOf(event: CaseEvent, s: GameState): LawId | null {
  const conds: LawCondition[] = [];
  lawConditions(event.trigger, conds);
  for (const cond of conds) {
    if (!evaluate(cond, s)) continue;
    for (let i = s.laws.length - 1; i >= 0; i--) {
      const law = s.laws[i];
      if (cond.kind === 'lawActive' && law.status !== 'active') continue;
      if (cond.subject !== undefined && law.subject !== cond.subject) continue;
      if (cond.action !== undefined && law.action !== cond.action) continue;
      return `${law.subject}_${law.action}` as LawId;
    }
  }
  return null;
}

/**
 * How hard the thing on the table is, 0..1: the worst any answer to it could
 * do. Read straight off the outcomes, so a scene is heavy because it is heavy
 * and not because somebody remembered to say so.
 */
export function dilemmaWeight(event: CaseEvent): number {
  let worst = 0;
  for (const choice of event.choices) {
    for (const value of Object.values(choice.effects)) {
      if (typeof value === 'number' && value < 0) worst = Math.max(worst, -value);
    }
    if (choice.souls) worst = Math.max(worst, Math.abs(choice.souls));
  }
  return Math.min(1, worst / 20);
}

export interface TownChange {
  flag: CityFlag;
  on: boolean;
}

/** What the last sealed law or answered case switched on or off in the town. */
export function lastTownChanges(s: GameState): TownChange[] {
  const entry = s.log[s.log.length - 1];
  if (!entry) return [];

  let on: CityFlag[] = [];
  let off: CityFlag[] = [];

  if (entry.kind === 'law') {
    const proposal = getProposal(entry.refId);
    const option = proposal?.options.find((o) => `${o.subject}_${o.action}` === entry.choiceId);
    on = option?.cityFlagsOn ?? [];
    off = option?.cityFlagsOff ?? [];
  } else {
    const event = getCase(entry.refId);
    const choice = event?.choices.find((c) => c.id === entry.choiceId);
    on = [...(choice?.cityFlagsOn ?? []), ...(choice?.enactLaw?.cityFlagsOn ?? [])];
    off = [...(choice?.cityFlagsOff ?? []), ...(choice?.enactLaw?.cityFlagsOff ?? [])];
  }

  const changes: TownChange[] = [];
  for (const flag of on) {
    if (s.cityFlags.includes(flag)) changes.push({ flag, on: true });
  }
  for (const flag of off) {
    if (!s.cityFlags.includes(flag)) changes.push({ flag, on: false });
  }
  return changes;
}

export interface ChronicleEntry {
  lawIndex: number;
  lawId: LawId;
  label: string;
  turn: number;
  status: 'active' | 'replaced' | 'repealed';
  /** Cases that this law brought to the throne, in the order they happened. */
  consequences: { caseId: string; title: string; turn: number }[];
}

/** The reign as a chain: every law with the scenes it caused. */
export function chronicle(s: GameState): ChronicleEntry[] {
  const entries: ChronicleEntry[] = s.laws.map((law, i) => ({
    lawIndex: i,
    lawId: `${law.subject}_${law.action}` as LawId,
    label: law.label,
    turn: law.turn,
    status: law.status,
    consequences: [],
  }));

  for (const logged of s.log) {
    if (logged.kind !== 'case') continue;
    const event = getCase(logged.refId);
    if (!event) continue;
    const conds: LawCondition[] = [];
    lawConditions(event.trigger, conds);
    if (conds.length === 0) continue;

    // the newest law sealed before this scene that the trigger points at
    let best = -1;
    for (const cond of conds) {
      for (let i = entries.length - 1; i >= 0; i--) {
        const law = s.laws[i];
        if (law.turn > logged.turn) continue;
        if (cond.subject !== undefined && law.subject !== cond.subject) continue;
        if (cond.action !== undefined && law.action !== cond.action) continue;
        if (i > best) best = i;
        break;
      }
    }
    if (best >= 0) {
      entries[best].consequences.push({
        caseId: event.id,
        title: event.title,
        turn: logged.turn,
      });
    }
  }

  return entries;
}

export interface Thread {
  kind: 'case' | 'proposal';
  id: string;
  title: string;
  /** Who turns up: a case character or the advisor who brings the next decree. */
  who: string;
}

/**
 * What a law opens up: the scenes that can only reach the throne because of it.
 * Read straight off the triggers, so the promise on the drafting table is the
 * same rule the scheduler uses later.
 */
export function threadsOf(option: LawOption, limit = 3): Thread[] {
  const matches = (cond: LawCondition): boolean =>
    (cond.subject === undefined || cond.subject === option.subject) &&
    (cond.action === undefined || cond.action === option.action);

  const out: Thread[] = [];

  for (const event of allCases()) {
    const conds: LawCondition[] = [];
    lawConditions(event.trigger, conds);
    if (conds.some(matches)) {
      out.push({
        kind: 'case',
        id: event.id,
        title: event.title,
        who: event.character ?? 'monarch',
      });
    }
  }

  for (const proposal of allProposals()) {
    const conds: LawCondition[] = [];
    lawConditions(proposal.unlockedBy, conds);
    if (conds.some(matches)) {
      out.push({
        kind: 'proposal',
        id: proposal.id,
        title: proposal.title,
        who: proposal.advisor,
      });
    }
  }

  return out.slice(0, limit);
}

export interface MetEntry {
  turn: number;
  /** What the scene was called. */
  title: string;
  /** What you actually said or did about it, in the words the case used. */
  decision: string;
}

export interface MetCharacter {
  character: string;
  label: string;
  emoji: string;
  entries: MetEntry[];
}

/**
 * Everyone who has stood in front of you, and what you did about each of
 * them, read straight off the log: nothing new is stored, so a loaded save
 * remembers exactly the reign it saved. The monarch is not in this list —
 * you do not meet yourself — and a case with nobody named in it is the
 * crowd's business, not a person's.
 */
export function metCharacters(s: GameState): MetCharacter[] {
  const byCharacter = new Map<string, MetCharacter>();
  for (const entry of s.log) {
    if (entry.kind !== 'case') continue;
    const event = getCase(entry.refId);
    // the monarch is not a stranger, and the square is not one person
    if (!event || !event.character) continue;
    if (event.character === 'monarch' || event.character === 'crowd') continue;
    const choice = event.choices.find((c) => c.id === entry.choiceId);
    if (!choice) continue;
    const meta = characterMeta(event.character);
    let met = byCharacter.get(event.character);
    if (!met) {
      met = { character: event.character, label: meta.label, emoji: meta.emoji, entries: [] };
      byCharacter.set(event.character, met);
    }
    met.entries.push({ turn: entry.turn, title: event.title, decision: choice.text });
  }
  // whoever first came to the door leads the book
  return [...byCharacter.values()].sort((a, b) => a.entries[0].turn - b.entries[0].turn);
}
