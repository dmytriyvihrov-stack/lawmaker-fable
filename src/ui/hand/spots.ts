import { CASE_SPOTS } from '../../content/meta';
import type { GameState } from '../../engine/types';
import { siteOf } from '../components/town/sites';
import { SCENES } from './scenes';

/**
 * Where the scene for a case is this reign.
 *
 * Usually the fixed spot the town has always used for it. The well is the
 * exception: it stands on whichever ground the place chose for it, so the
 * scene about four buckets a day has to be wherever the buckets are.
 */
export function handSpot(caseId: string, s: GameState): { x: number; y: number } | null {
  if (!(caseId in SCENES)) return null;
  if (caseId === 'v2_well') {
    const at = siteOf('well', s.placements);
    if (at) return { x: at.x, y: at.y + 6 };
  }
  return CASE_SPOTS[caseId] ?? null;
}
