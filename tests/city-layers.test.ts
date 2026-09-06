import { describe, expect, it } from 'vitest';
import { chooseLaw, chooseCase, newGame } from '../src/engine/reducer';
import { PROPOSALS } from '../src/content/proposals';
import { CASES } from '../src/content/cases';

/**
 * The wiring, end to end.
 *
 * A layer can be drawn, and switchable in principle, and still never appear,
 * because the option that names it is one nobody can reach or because the
 * engine drops it on the way into the save. These sit a real reign down in
 * front of the real reducer and read the flags back out of the state.
 */
describe('the layers a ruling puts on the town actually land in the save', () => {
  const seal = (proposalId: string, idx: number) => {
    const p = PROPOSALS.find((x) => x.id === proposalId)!;
    const s = newGame(1);
    return chooseLaw(s, proposalId, idx, p.options[idx].label);
  };

  it('the first law puts goats on the common or a fence across it', () => {
    const shared = seal('pv1_work', 0);
    expect(shared.cityFlags).toContain('goat_parade');
    const owned = seal('pv1_work', 2);
    expect(owned.cityFlags).toContain('meadow_fenced');
  });

  it('replacing shared with owned moves the meadow over', () => {
    const shared = seal('pv1_work', 0);
    const owned = chooseLaw(shared, 'pv1_work', 2, PROPOSALS[0].options[2].label);
    expect(owned.cityFlags).toContain('meadow_fenced');
    expect(owned.cityFlags).not.toContain('goat_parade');
  });

  it('a closed gate grows a camp outside it', () => {
    const turned = seal('pv2_strangers', 2);
    expect(turned.cityFlags).toContain('camp_outside');
  });

  it('the Guild boards up the house that is not its own', () => {
    const guild = seal('p1_trade', 2);
    expect(guild.cityFlags).toContain('tavern_shuttered');
  });

  it('rationing makes a queue, and a swarm stays on the roof', () => {
    const base = newGame(1);
    const grain = CASES.find((c) => c.id === 'w_grain')!;
    const rationed = chooseCase(base, 'w_grain', 'ration');
    expect(grain.choices.map((c) => c.id)).toContain('ration');
    expect(rationed.cityFlags).toContain('bread_queue');

    const kept = chooseCase(base, 'w_bees', 'keep');
    expect(kept.cityFlags).toContain('dragon_roost');
  });
});
