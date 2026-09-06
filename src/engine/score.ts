import { SCORE_UI } from '../content/scoreboard';
import { RIVALS } from '../content/scoreboard';
import type { Rival } from '../content/scoreboard';
import { allWorks } from './registry';
import type { GameState } from './types';

/**
 * What a reign came to, as one number.
 *
 * The game spends twenty years refusing to tell anybody whether they are doing
 * well, which is the point of it, so this is allowed to exist only at the very
 * end and only with its own arithmetic printed underneath. Every part of it is
 * something the player watched happen: the people in the place, the years held,
 * how the place was living, the laws that outlasted the arguments, what got
 * built, and every time the law was bent for somebody with a name.
 *
 * The bent laws are the only part that subtracts, and they subtract hard. That
 * is not a moral judgement the game is making about the player; it is the same
 * arithmetic the town does, and the town has been doing it out loud all reign.
 */

export interface ScorePart {
  label: string;
  /** What it contributed, already signed. */
  value: number;
  /** The thing itself, for the reader who wants to check the sum. */
  detail: string;
}

export interface ReignScore {
  total: number;
  parts: ScorePart[];
  years: number;
}

export function reignScore(s: GameState): ReignScore {
  const years = Math.max(1, s.turn);
  const boards = Object.values(s.stats).reduce((a, b) => a + b, 0);
  const standing = s.laws.filter((law) => law.status === 'active').length;
  let built = 0;
  for (const work of allWorks()) built += s.buildings[work.id] ?? 0;

  const parts: ScorePart[] = [
    {
      label: SCORE_UI.parts.souls,
      value: s.population,
      detail: String(s.population),
    },
    {
      label: SCORE_UI.parts.years,
      value: years * 3,
      detail: String(years),
    },
    {
      label: SCORE_UI.parts.boards,
      value: Math.round(boards / 4),
      detail: String(Math.round(boards / 6)),
    },
    {
      label: SCORE_UI.parts.laws,
      value: standing * 10,
      detail: String(standing),
    },
    {
      label: SCORE_UI.parts.works,
      value: built * 8,
      detail: String(built),
    },
    {
      label: SCORE_UI.parts.exceptions,
      value: -s.exceptions.length * 15,
      detail: String(s.exceptions.length),
    },
  ];

  return {
    total: Math.max(0, parts.reduce((a, part) => a + part.value, 0)),
    parts,
    years,
  };
}

export interface BoardRow {
  id: string;
  name: string;
  town: string | null;
  score: number;
  line: string | null;
  /** Whether this row is the reign that just ended. */
  you: boolean;
  rival: Rival | null;
}

/**
 * The four of them in order, biggest first, with the reign that just ended
 * slotted in wherever it lands. A tie goes to the one who has been dead
 * longest, which is to say the rivals, because a reign that only just finished
 * has not been tested by anybody's memory yet.
 */
export function scoreboard(s: GameState, townName: string | null): BoardRow[] {
  const mine = reignScore(s);
  const rows: BoardRow[] = RIVALS.map((rival) => ({
    id: rival.id,
    name: rival.name,
    town: rival.town,
    score: rival.score,
    line: rival.line,
    you: false,
    rival,
  }));
  rows.push({
    id: 'you',
    name: SCORE_UI.yourRow,
    town: townName,
    score: mine.total,
    line: null,
    you: true,
    rival: null,
  });
  return rows.sort((a, b) => b.score - a.score || (a.you ? 1 : -1));
}

/** Where the reign came, 1 to 4. */
export function placing(rows: BoardRow[]): 1 | 2 | 3 | 4 {
  const i = rows.findIndex((row) => row.you);
  return ((i < 0 ? 3 : i) + 1) as 1 | 2 | 3 | 4;
}
