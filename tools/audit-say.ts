/**
 * One line per answer: what the result sentence says, and what the answer
 * actually moves. For reading the two against each other. Nothing is written.
 *
 *   npx vite-node tools/audit-say.ts > say.txt
 */
import { CASES } from '../src/content/cases';
import { CONFIG } from '../src/engine/config';
import type { Effects } from '../src/engine/types';

const MARK: Record<string, string> = {
  economy: 'store', health: 'health', mood: 'square', crownSanity: 'crown',
  army: 'watch', culture: 'songs',
};

function felt(e: Effects | undefined): string {
  if (!e) return '-';
  return Object.entries(e)
    .map(([k, v]) => `${MARK[k] ?? k} ${(v as number) * CONFIG.caseScale > 0 ? '+' : ''}${((v as number) * CONFIG.caseScale).toFixed(1)}`)
    .join(', ');
}

for (const c of CASES) {
  console.log(`\n== ${c.id}  ${c.title}`);
  for (const ch of c.choices) {
    const extra = [
      ch.souls ? `souls ${ch.souls}` : '',
      ch.bond ? `bond ${ch.bond}` : '',
      ch.exceptionToLaw ? `exception:${ch.exceptionToLaw}` : '',
      ch.setFlags?.length ? `flags:${ch.setFlags.join('+')}` : '',
    ].filter(Boolean).join(' ');
    console.log(`  - [${ch.id}] ${ch.text}`);
    console.log(`    RESULT: ${ch.result}`);
    console.log(`    MOVES:  ${felt(ch.effects)}${extra ? '  |  ' + extra : ''}`);
  }
}
