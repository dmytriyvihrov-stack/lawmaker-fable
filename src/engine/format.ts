import { AGES } from '../content/folk';
import { TRIAL_LEANS } from '../content/trials';
import { UI } from '../content/ui-strings';
import { agesNow } from './folk';
import { truthOf } from './verdict';
﻿import type { ActionId, GameState, LawId, SubjectId } from './types';

const ROMAN: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

export function roman(n: number): string {
  let rest = Math.max(0, Math.floor(n));
  let out = '';
  for (const [value, sign] of ROMAN) {
    while (rest >= value) {
      out += sign;
      rest -= value;
    }
  }
  return out;
}

/**
 * A board, as a number on the screen. Boards are held to a tenth of a point,
 * so a count always shows its tenth: a store reading 18.4 is a store a reader
 * can hold against a hundred and get a percentage out of, and a column that
 * only grows a decimal place in the years something small happened is a
 * column whose width changes while it is being read.
 */
export function points(n: number): string {
  return n.toFixed(1);
}

/**
 * A move on a board. The tenth shows only when there is one, because most
 * moves are whole points and "+6.0" spends three characters saying nothing.
 * Rounded first: one tenth plus one tenth, in binary, is not two tenths.
 */
export function movePoints(n: number): string {
  const t = Math.round(n * 10) / 10;
  const body = Number.isInteger(t) ? String(t) : t.toFixed(1);
  return t > 0 ? `+${body}` : body;
}

/**
 * The same move, rounded to a whole point, for the places that are a row of
 * numbers rather than a report: the header carried "-27.5" beside "+1", which
 * is four characters of a tenth nobody can act on, in the one row that has to
 * fit six boards and the books and the year and the frost on one line.
 */
export function movePointsWhole(n: number): string {
  return movePoints(Math.round(n));
}

export function splitLawId(lawId: LawId): { subject: SubjectId; action: ActionId } {
  const parts = lawId.split('_');
  const subject = parts[0] as SubjectId;
  const action = parts.slice(1).join('_') as ActionId;
  return { subject, action };
}

/**
 * LAW III - "ALL ALE IS BANNED". Adds a note when it no longer stands.
 *
 * The year it was sealed used to ride along on every mention, in the one place
 * that already says why the scene in front of you exists: it does not, here,
 * settle anything a reader is asking. The Codex still gives the year, where
 * somebody is reading the law itself rather than living a consequence of it.
 */
export function formatLaw(s: GameState, lawId: LawId): string {
  const { subject, action } = splitLawId(lawId);
  let idx = -1;
  for (let i = s.laws.length - 1; i >= 0; i--) {
    const l = s.laws[i];
    if (l.subject === subject && l.action === action) {
      idx = i;
      break;
    }
  }
  if (idx === -1) return 'a law that was never sealed';
  const law = s.laws[idx];
  const base = `LAW ${roman(idx + 1)} - "${law.label}"`;
  return law.status === 'active' ? base : `${base} (since repealed)`;
}

/**
 * The same law, by number alone: `Law II`.
 *
 * A scene that crosses a law used to quote the whole sentence back, in capitals,
 * on a card that is already narrow, while the sentence itself stood in the
 * Standing panel two inches to the right and in the Codex behind one click. The
 * number is the reference; the text is where the text lives.
 */
export function lawNumber(s: GameState, lawId: LawId): string | null {
  const { subject, action } = splitLawId(lawId);
  for (let i = s.laws.length - 1; i >= 0; i--) {
    const l = s.laws[i];
    if (l.subject === subject && l.action === action) return `Law ${roman(i + 1)}`;
  }
  return null;
}

/** Who the town names when a law finally costs somebody. */
export function casualtyName(s: GameState): string {
  if (s.flags.includes('lever_praised')) return 'Bregg, who could not be shouted at';
  return "the miller's twins";
}

/**
 * The one detail in a trial scene that leans, in the version that matches the
 * truth. The truth comes off the seed, so the same reign always reads the same
 * scene and no two seeds read it the same way.
 */
export function leaningDetail(s: GameState): string {
  const caseId = s.current?.kind === 'case' ? s.current.id : null;
  if (!caseId) return '';
  const pair = TRIAL_LEANS[caseId];
  if (!pair) return '';
  return pair[truthOf(s.seed, caseId)];
}

/**
 * How long ago a scene was ruled on, off the log. Null when it never was,
 * which a scene gated on that ruling's flag should never see, and which a
 * loaded save from before the scene existed might.
 */
export function yearsSince(s: GameState, caseId: string): number | null {
  for (let i = s.log.length - 1; i >= 0; i--) {
    const entry = s.log[i];
    if (entry.kind === 'case' && entry.refId === caseId) return s.turn - entry.turn;
  }
  return null;
}

/**
 * "seven years ago", in the words a person uses for it. Nobody in this place
 * says "in year 3": they say you did it to them seven years ago, and the
 * number is the whole point of the sentence, so it is spelled out.
 */
export function agoWords(years: number | null): string {
  if (years === null) return UI.ago.unknown;
  if (years <= 0) return UI.ago.thisYear;
  if (years === 1) return UI.ago.lastYear;
  const word = UI.ago.numbers[years] ?? String(years);
  return UI.ago.years.replace('{n}', word);
}

/**
 * How old somebody is this year.
 *
 * A scene that says a number out loud ("nine years old") is written once and
 * read in year three or in year twenty five, and the register has known the
 * answer since the year they walked in. On the very first meeting the log has
 * no entry yet, because the scene is drawn before it is answered, so the age
 * they walked in at is the answer that morning.
 */
export function ageOf(s: GameState, character: string): number | null {
  const now = agesNow(s).get(character);
  if (now !== undefined && now > 0) return now;
  const born = AGES[character];
  return born === undefined || born === 0 ? null : born;
}

/**
 * Options for the one template that has a second reading.
 *
 * `spoken` is the law that is on the screen already, in full, a line above the
 * paragraph being rendered: the seal shows the sentence and then the ceremony
 * line quoted the whole thing back in capitals underneath it, which was the
 * third time a player read one law in one screen. Where the paragraph names
 * that law it says "it" instead, and a reference to any other law is still
 * spelled out, because that one is not on the screen.
 */
export interface TemplateOptions {
  spoken?: LawId;
}

export function renderTemplate(text: string, s: GameState, opts: TemplateOptions = {}): string {
  return text
    .replace(/\{\{law:([a-z_]+)\}\}/g, (_m, id: string, at: number) =>
      opts.spoken === id ? (at === 0 ? 'It' : 'it') : formatLaw(s, id as LawId),
    )
    .replace(/\{\{ago:([a-z0-9_]+)\}\}/g, (_m, id: string) => agoWords(yearsSince(s, id)))
    .replace(/\{\{age:([a-z0-9_]+)\}\}/g, (_m, id: string) => {
      const years = ageOf(s, id);
      return years === null ? UI.ago.numbers[0] : String(years);
    })
    .replace(/\{\{casualty\}\}/g, () => casualtyName(s))
    .replace(/\{\{lean\}\}/g, () => leaningDetail(s));
}
