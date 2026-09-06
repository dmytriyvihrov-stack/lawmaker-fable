import { isActiveStat } from './simulation';
import type { ActionId, Condition, EnactedLaw, GameState, SubjectId } from './types';

function matchesLaw(law: EnactedLaw, subject?: SubjectId, action?: ActionId): boolean {
  if (subject !== undefined && law.subject !== subject) return false;
  if (action !== undefined && law.action !== action) return false;
  return true;
}

export function evaluate(cond: Condition, s: GameState): boolean {
  switch (cond.kind) {
    case 'always':
      return true;

    case 'lawActive':
      return s.laws.some(
        (l) => l.status === 'active' && matchesLaw(l, cond.subject, cond.action),
      );

    case 'lawEver':
      return s.laws.some((l) => matchesLaw(l, cond.subject, cond.action));

    case 'stat': {
      // a board the place is too small to have cannot be in crisis
      if (!isActiveStat(s, cond.stat)) return false;
      const v = s.stats[cond.stat];
      return cond.op === 'lte' ? v <= cond.value : v >= cond.value;
    }

    case 'stage':
      // a kingdom is a town that got neighbours, so everything the charter
      // unlocked is unlocked still: the town proposals go on being offered
      return s.stage === cond.stage || (cond.stage === 'town' && s.stage === 'kingdom');

    case 'souls':
      return cond.op === 'lte' ? s.population <= cond.value : s.population >= cond.value;

    case 'flag':
      return s.flags.includes(cond.flag);

    // A scene that is about a building cannot happen in a place that has not
    // built one. The well runs dry only where there is a well to run dry.
    case 'built':
      return (s.buildings[cond.work] ?? 0) >= (cond.level ?? 1);

    case 'caseShown':
      return s.shownCases.includes(cond.caseId);

    case 'turn':
      return cond.op === 'lte' ? s.turn <= cond.value : s.turn >= cond.value;

    case 'not':
      return !evaluate(cond.cond, s);

    case 'all':
      return cond.conds.every((c) => evaluate(c, s));

    case 'any':
      return cond.conds.some((c) => evaluate(c, s));
  }
}
