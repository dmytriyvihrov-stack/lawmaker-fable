import { truthOf, wrongfulConvictions } from './verdict';
import {
  BENCH_CLEAN,
  BENCH_NONE,
  BENCH_UNSEEN,
  BENCH_WRONG_MANY,
  BENCH_WRONG_ONE,
} from '../content/portrait-text';
import { renderTemplate } from './format';
import { CONFIG } from './config';
import { allWorks } from './registry';
import { activeStats } from './simulation';
import { UI } from '../content/ui-strings';
import { OWN_ROPE_DESC, OWN_ROPE_HEADLINE } from '../content/own-rope';
import { DEFEATS, OWN_ROPE_ICON, WALK_OUT_ICON } from '../content/defeat';
import { WALK_OUT_DESC, WALK_OUT_HEADLINE } from '../content/walk-out';
import type { GameState, LawId, PhilTag, StatId } from './types';
import {
  EXCEPTIONS_NONE_CLEAN,
  EXCEPTIONS_NONE_WIDOW,
  EXCEPTIONS_ONCE,
  EXCEPTIONS_SOME,
  FLAG_LINES,
  IVA_ADVOCATE,
  IVA_HELPED,
  IVA_LEFT,
  IVA_MET_ONLY,
  MISMATCH_TEMPLATE,
  REVEALED_DESC,
  SAME,
  TAG_LABEL,
  TAVERN_LINES,
} from '../content/portrait-text';

/** Fixed order, used as the tie break when two tags score the same. */
export const TAG_ORDER: PhilTag[] = [
  'utilitarian',
  'egalitarian',
  'libertarian',
  'meritocratic',
  'kantian',
  'communitarian',
];

export interface PortraitData {
  declaredTag: PhilTag | null;
  revealedTag: PhilTag;
  scores: Record<PhilTag, number>;
  matched: boolean;
  headline: string;
  description: string;
  /** The mark for how the reign ended, or null if it simply ran out of years. */
  endingIcon: string | null;
  exceptionsLine: string;
  exceptionNames: string[];
  ivaLine: string;
  /** What the bench got right, and what it did not. One or two lines. */
  benchLines: string[];
  stats: Record<StatId, number>;
  shownStats: StatId[];
  lawCounts: { active: number; replaced: number; repealed: number; total: number };
  flagLines: string[];
  tavernLine: string | null;
  soulsLine: string;
  hamletLine: string | null;
  workLines: string[];
}

export function computePortrait(s: GameState): PortraitData {
  // 1. score the tags
  const scores = {} as Record<PhilTag, number>;
  for (const tag of TAG_ORDER) scores[tag] = 0;
  for (const entry of s.log) {
    const weight = entry.kind === 'law' ? 2 : 1;
    for (const tag of entry.tags) scores[tag] += weight;
  }
  let revealedTag: PhilTag = TAG_ORDER[0];
  for (const tag of TAG_ORDER) {
    if (scores[tag] > scores[revealedTag]) revealedTag = tag;
  }

  // 2. headline. A reign that ended at the crossroads is not summed up by
  // which philosophy the rulings averaged out to: it is summed up by the last
  // afternoon, and that is what the card should open with.
  const matched = s.declaredTag !== null && s.declaredTag === revealedTag;
  const ownRope = s.flags.includes('own_rope');
  const walkedOut = s.flags.includes('square_walked');
  // a board that stayed on the floor a year after its own scene said so
  const lost = s.defeat !== undefined ? DEFEATS[s.defeat as keyof typeof DEFEATS] : undefined;
  const headline = lost
    ? lost.headline
    : ownRope
      ? OWN_ROPE_HEADLINE
      : walkedOut
        ? WALK_OUT_HEADLINE
        : matched
          ? SAME[revealedTag]
          : MISMATCH_TEMPLATE.replace(
              '{declared}',
              s.declaredTag ? TAG_LABEL[s.declaredTag] : 'nothing in particular',
            ).replace('{revealed}', TAG_LABEL[revealedTag]);
  const description = lost
    ? lost.desc
    : ownRope
      ? OWN_ROPE_DESC
      : walkedOut
        ? WALK_OUT_DESC
        : REVEALED_DESC[revealedTag];
  /* The mark for how it ended, over the card. A reign that ran its course has
     no mark: the reading is the ending, and a symbol over it would be the page
     congratulating itself. */
  const endingIcon = lost
    ? lost.icon
    : ownRope
      ? OWN_ROPE_ICON
      : walkedOut
        ? WALK_OUT_ICON
        : null;

  // 3. exceptions
  const exceptionNames = s.exceptions.map((e) => e.beneficiary);
  let exceptionsLine: string;
  if (exceptionNames.length === 0) {
    exceptionsLine = s.flags.includes('basket_burned')
      ? EXCEPTIONS_NONE_WIDOW
      : EXCEPTIONS_NONE_CLEAN;
  } else if (exceptionNames.length === 1) {
    exceptionsLine = EXCEPTIONS_ONCE.replace('{name}', exceptionNames[0]);
  } else {
    exceptionsLine = EXCEPTIONS_SOME.replace('{n}', String(exceptionNames.length)).replace(
      '{names}',
      exceptionNames.join(', '),
    );
  }

  // 4. Iva
  let ivaLine: string;
  if (s.iva.includes('advocate')) ivaLine = IVA_ADVOCATE;
  else if (s.iva.includes('wronged')) ivaLine = IVA_LEFT;
  else if (s.iva.includes('helped')) ivaLine = IVA_HELPED;
  else ivaLine = IVA_MET_ONLY;

  // 5. the reign, counted
  const lawCounts = {
    active: s.laws.filter((l) => l.status === 'active').length,
    replaced: s.laws.filter((l) => l.status === 'replaced').length,
    repealed: s.laws.filter((l) => l.status === 'repealed').length,
    total: s.laws.length,
  };
  // What became of them, in the order it became of them, and only the last
  // eight of it: a long reign leaves fourteen of these, and a closing card
  // that has to be read as a list stops being read at all. The ones that fall
  // off the top are the oldest, which are the ones already half forgotten.
  const allFlagLines: string[] = [];
  for (const flag of s.flags) {
    const line = FLAG_LINES[flag];
    if (line) allFlagLines.push(line);
  }
  const flagLines = allFlagLines.slice(-8);

  // the closing note about the town's mouth, if any law of words was sealed
  let tavernLine: string | null = null;
  for (let i = s.laws.length - 1; i >= 0; i--) {
    const law = s.laws[i];
    if (law.subject !== 'truth') continue;
    const template = TAVERN_LINES[`${law.subject}_${law.action}` as LawId];
    if (template) tavernLine = renderTemplate(template, s);
    break;
  }

  // 6. the count, and what was built with the years
  const what =
    s.stage === 'kingdom'
      ? UI.court.kingdom
      : s.stage === 'town'
        ? UI.court.town
        : UI.court.hamlet;
  const soulsLine = UI.portrait.soulsLine
    .replace('{from}', String(CONFIG.population.start))
    .replace('{what}', what)
    .replace('{to}', String(s.population));
  const hamletLine = s.stage === 'village' ? UI.portrait.hamletLine : null;
  const workLines: string[] = [];
  for (const work of allWorks()) {
    const level = s.buildings[work.id] ?? 0;
    if (level <= 0 || work.maxLevel === 0) continue;
    workLines.push(`${work.name}, ${UI.works.level.replace('{n}', String(level)).replace('{max}', String(work.maxLevel))}`);
  }

  // The bench. The truth comes off the seed, so this is the first and only
  // place the reign is told how it actually went.
  const benchLines: string[] = [];
  if (s.verdicts.length === 0) {
    benchLines.push(BENCH_NONE);
  } else {
    const wrong = wrongfulConvictions(s);
    const n = String(s.verdicts.length);
    if (wrong === 0) benchLines.push(BENCH_CLEAN.replace('{n}', n));
    else if (wrong === 1) benchLines.push(BENCH_WRONG_ONE.replace('{n}', n));
    else benchLines.push(BENCH_WRONG_MANY.replace('{n}', n).replace('{w}', String(wrong)));

    const unseen = s.verdicts.filter(
      (v) => !v.surfaced && v.ruled === 'guilty' && truthOf(s.seed, v.caseId) === 'innocent',
    ).length;
    if (unseen > 0) benchLines.push(BENCH_UNSEEN.replace('{u}', String(unseen)));
  }

  return {
    declaredTag: s.declaredTag,
    revealedTag,
    scores,
    matched,
    headline,
    description,
    endingIcon,
    exceptionsLine,
    exceptionNames,
    ivaLine,
    benchLines,
    stats: s.stats,
    shownStats: activeStats(s),
    lawCounts,
    flagLines,
    tavernLine,
    soulsLine,
    hamletLine,
    workLines,
  };
}
