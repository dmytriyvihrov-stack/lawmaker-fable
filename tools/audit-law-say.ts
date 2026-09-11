/** Each law, what it does every year, and the paragraph the place reads after it. */
import { PROPOSALS } from '../src/content/proposals';
import { AFTERMATHS } from '../src/content/aftermaths';
const say = (e: Record<string, number> | undefined) =>
  e ? Object.entries(e).map(([k, v]) => `${k} ${v > 0 ? '+' : ''}${v}`).join(', ') : '-';
for (const p of PROPOSALS) {
  console.log(`\n== ${p.id} ${p.title}`);
  for (const o of p.options) {
    const am = AFTERMATHS.find((a) => a.id === o.aftermathId);
    console.log(`  ${o.label}`);
    console.log(`    once ${say(o.effects as any)} | year ${say(o.perTurn as any)} | town ${say(o.perTurnTown as any)}${o.growth ? ` | growth x${o.growth}` : ''}`);
    for (const para of am?.paragraphs ?? ['(no aftermath)']) console.log(`    > ${para}`);
  }
}
