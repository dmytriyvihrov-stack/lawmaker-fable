import type {
  ActionId,
  CaseEvent,
  LawOption,
  Proposal,
  SubjectId,
  TechDef,
  WorkDef,
} from './types';
import { PROPOSALS } from '../content/proposals';
import { CASES } from '../content/cases';
import { AFTERMATHS } from '../content/aftermaths';
import { WORKS } from '../content/works';
import { TECHS } from '../content/techs';
import type { AftermathScene } from './types';

interface Content {
  proposals: Proposal[];
  cases: CaseEvent[];
  aftermaths: AftermathScene[];
  works: WorkDef[];
  techs: TechDef[];
}

const DEFAULT_CONTENT: Content = {
  proposals: PROPOSALS,
  cases: CASES,
  aftermaths: AFTERMATHS,
  works: WORKS,
  techs: TECHS,
};

let content: Content = DEFAULT_CONTENT;

/** Tests swap the content in, then restore it with resetContent(). */
export function setContentForTests(next: Partial<Content>): void {
  content = { ...DEFAULT_CONTENT, ...next };
}

export function resetContent(): void {
  content = DEFAULT_CONTENT;
}

export function allProposals(): Proposal[] {
  return content.proposals;
}

export function allCases(): CaseEvent[] {
  return content.cases;
}

export function allAftermaths(): AftermathScene[] {
  return content.aftermaths;
}

export function allWorks(): WorkDef[] {
  return content.works;
}

export function getProposal(id: string): Proposal | undefined {
  return content.proposals.find((p) => p.id === id);
}

export function getCase(id: string): CaseEvent | undefined {
  return content.cases.find((c) => c.id === id);
}

export function getAftermath(id: string): AftermathScene | undefined {
  return content.aftermaths.find((a) => a.id === id);
}

export function allTechs(): TechDef[] {
  return content.techs;
}

export function getWork(id: string): WorkDef | undefined {
  return content.works.find((w) => w.id === id);
}

/** Every law option declared anywhere in the content, decrees from cases included. */
export function everyLawOption(): LawOption[] {
  const out: LawOption[] = [];
  for (const p of allProposals()) out.push(...p.options);
  for (const c of allCases()) {
    for (const ch of c.choices) if (ch.enactLaw) out.push(ch.enactLaw);
  }
  return out;
}

/** Finds the option behind a sealed law: exact label first, then subject plus action. */
export function findLawOption(
  subject: SubjectId,
  action: ActionId,
  label?: string,
): LawOption | undefined {
  const all = everyLawOption();
  if (label !== undefined) {
    const exact = all.find(
      (o) => o.subject === subject && o.action === action && o.label === label,
    );
    if (exact) return exact;
  }
  return all.find((o) => o.subject === subject && o.action === action);
}
