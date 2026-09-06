import { describe, expect, it } from 'vitest';
import { UI } from '../src/content/ui-strings';
import { beginAt } from '../src/engine/chapters';
import { CONFIG } from '../src/engine/config';
import { advance, sendAbroad } from '../src/engine/reducer';
import { previewReign } from '../src/ui/previewReign';
import {
  actAbroad,
  canActAbroad,
  fromReign,
  openWorld,
  tickWorld,
} from '../src/engine/world';
import type { ForeignState, GameState, StatId } from '../src/engine/types';

const K = CONFIG.kingdom;
const STATS: StatId[] = ['crownSanity', 'mood', 'health', 'economy', 'army', 'culture'];

/** A kingdom in its first year with the crown, in the autumn where a year is spent. */
function crowned(seed = 77): GameState {
  return beginAt('kingdom', seed);
}

/** The one neighbour, put where the test needs it. */
function withState(s: GameState, at: number, patch: Partial<ForeignState>): GameState {
  const states = s.world!.states.map((k, i) => (i === at ? { ...k, ...patch } : k));
  return { ...s, world: { ...s.world!, states } };
}

describe('the world the crown opens', () => {
  it('is the same world every time for one seed, and a different one for another', () => {
    const a = openWorld(crowned(5));
    const b = openWorld(crowned(5));
    const other = openWorld(crowned(6));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(other));
  });

  it('draws the neighbours the config asks for, each named once', () => {
    const world = openWorld(crowned());
    expect(world.states).toHaveLength(K.states);
    const names = world.states.map((k) => k.name);
    expect(new Set(names).size, 'two neighbours share a name').toBe(names.length);
    for (const k of world.states) {
      expect(k.kind).toBe('bot');
      expect(k.stage === 'town' || k.stage === 'kingdom').toBe(true);
      expect(k.population).toBeGreaterThan(0);
      for (const stat of STATS) {
        expect(k.stats[stat], `${k.name} ${stat}`).toBeGreaterThanOrEqual(0);
        expect(k.stats[stat], `${k.name} ${stat}`).toBeLessThanOrEqual(100);
      }
    }
  });

  it('writes each of them two to four laws, never two on one subject', () => {
    for (const seed of [1, 2, 3, 40, 500]) {
      for (const k of openWorld(crowned(seed)).states) {
        expect(k.laws.length).toBeGreaterThanOrEqual(2);
        expect(k.laws.length).toBeLessThanOrEqual(4);
        const subjects = k.laws.map((l) => l.subject);
        expect(new Set(subjects).size, 'a place contradicting itself').toBe(subjects.length);
        for (const law of k.laws) {
          expect(law.status).toBe('active');
          expect(law.label.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('divides the kingdom into four peoples that add up to all of it', () => {
    for (const seed of [1, 9, 21, 300]) {
      const peoples = openWorld(crowned(seed)).peoples;
      expect(peoples).toHaveLength(4);
      const total = peoples.reduce((sum, p) => sum + p.share, 0);
      expect(total, 'the kingdom does not add up to itself').toBeCloseTo(1, 5);
      for (const p of peoples) expect(p.share).toBeGreaterThanOrEqual(0.09);
    }
  });

  it('reads your own law on strangers back to you in who lives here', () => {
    const base = crowned(12);
    const welcomed: GameState = {
      ...base,
      laws: [
        { subject: 'strangers', action: 'welcomed', label: 'A stranger at this gate is welcomed', turn: 4, status: 'active' },
      ],
    };
    const shut: GameState = {
      ...base,
      laws: [
        { subject: 'strangers', action: 'turned_away', label: 'A stranger at this gate is turned away', turn: 4, status: 'active' },
      ],
    };
    const comers = (s: GameState) => openWorld(s).peoples.find((p) => p.id === 'comers')!.share;
    expect(comers(welcomed)).toBeGreaterThan(comers(shut));
    expect(comers(shut)).toBeLessThanOrEqual(0.1);
  });

  it('makes a neighbour out of any real reign, which is the whole online contract', () => {
    const them = fromReign(previewReign(), 'k9', 'player');
    expect(them.id).toBe('k9');
    expect(them.kind).toBe('player');
    expect(them.name).toBe('Beckhold');
    expect(them.laws.every((l) => l.status === 'active')).toBe(true);
    expect(them.laws.length).toBeGreaterThan(0);
    for (const stat of STATS) expect(typeof them.stats[stat]).toBe('number');
    expect(them.stance).toBe(0);
    expect(them.ask).toBeNull();
  });
});

describe('a year abroad', () => {
  it('raises an ask when a neighbour runs out, and drops it when nobody answers', () => {
    let s = withState(crowned(), 0, {
      stats: { ...crowned().world!.states[0].stats, economy: K.askBelow - 5, health: 60 },
      laws: [],
      stance: 0,
    });
    const raised = tickWorld(s)!;
    expect(raised.world.states[0].ask?.board).toBe('economy');

    // it stands for a few years and then it is remembered as a no
    s = { ...s, world: raised.world, turn: s.turn + K.askExpires };
    const expired = tickWorld(s)!;
    expect(expired.world.states[0].ask).toBeNull();
    expect(expired.world.states[0].stance, 'silence cost nothing').toBe(-1);
  });

  it('lets a cold neighbour with the bigger watch come and take, once', () => {
    const base = crowned();
    const s = withState({ ...base, stats: { ...base.stats, army: 10 } }, 0, {
      stance: -2,
      stats: { ...base.world!.states[0].stats, army: 90 },
    });
    const out = tickWorld(s)!;
    const economy = out.moves.filter((m) => m.stat === 'economy');
    const mood = out.moves.filter((m) => m.stat === 'mood');
    expect(economy).toHaveLength(1);
    expect(economy[0].delta).toBe(-K.raided.economy);
    expect(mood[0].delta).toBe(-K.raided.mood);
    expect(economy[0].source, 'the line does not name them').toContain(base.world!.states[0].name);
    // and having taken it, they have no further business with you this year
    expect(out.world.states[0].stance).toBe(-1);
  });

  it('leaves a quiet world quiet', () => {
    const base = crowned(31);
    const calm = base.world!.states.map((k) => ({
      ...k,
      stance: 0,
      stats: { ...k.stats, economy: 70, health: 70, army: 10 },
    }));
    const s: GameState = { ...base, stats: { ...base.stats, army: 90 }, world: { ...base.world!, states: calm } };
    const out = tickWorld(s)!;
    expect(out.moves).toHaveLength(0);
  });

  it('is nothing at all in a place that has no outside', () => {
    expect(tickWorld(beginAt('town', 3))).toBeNull();
  });
});

describe('a year of work spent abroad', () => {
  it('is only offered in the autumn of a year that has not been spent', () => {
    const s = crowned();
    expect(s.phase).toBe('works');
    expect(canActAbroad(s)).toBe(true);
    expect(canActAbroad({ ...s, phase: 'case' }), 'offered mid-case').toBe(false);
    expect(canActAbroad({ ...s, lastWorkTurn: s.turn }), 'offered twice in a year').toBe(false);
    expect(canActAbroad(beginAt('town', 3)), 'offered to a town').toBe(false);
  });

  it('refuses an action on a spent year, on a bad target, and with an empty store', () => {
    const s = crowned();
    expect(actAbroad({ ...s, lastWorkTurn: s.turn }, 'ask', 'k1')).toBeNull();
    expect(actAbroad(s, 'ask', 'nobody')).toBeNull();
    expect(actAbroad({ ...s, stats: { ...s.stats, economy: 2 } }, 'send', 'k1')).toBeNull();
    expect(actAbroad({ ...s, stats: { ...s.stats, army: 1 } }, 'raid', 'k1')).toBeNull();
    // and the reducer leaves the state exactly as it found it
    const before = { ...s, lastWorkTurn: s.turn };
    expect(sendAbroad(before, 'ask', 'k1')).toBe(before);
  });

  it('sends grain: the store pays, the crown eases, and they remember it', () => {
    const s = withState(crowned(), 0, { stance: 0, ask: { board: 'economy', since: 1 } });
    const out = actAbroad(s, 'send', 'k1')!;
    const store = out.moves.find((m) => m.stat === 'economy')!;
    const crown = out.moves.find((m) => m.stat === 'crownSanity')!;
    expect(store.delta).toBe(-K.send.cost);
    expect(crown.delta).toBe(K.send.crown);
    expect(out.world.states[0].stance).toBe(K.send.stance);
    expect(out.world.states[0].ask, 'the asking was not answered').toBeNull();
    expect(store.source).toBe(UI.ledger.sentAsked.replace('{{name}}', s.world!.states[0].name));
  });

  it('asks for grain: a warm neighbour gives, and nothing moves when they will not', () => {
    const warm = withState(crowned(), 0, {
      stance: 3,
      stats: { ...crowned().world!.states[0].stats, economy: 80 },
      laws: [],
    });
    const yes = actAbroad(warm, 'ask', 'k1')!;
    expect(yes.moves[0].delta).toBe(K.ask.gain);
    expect(yes.world.states[0].stance).toBe(3);

    const cold = withState(crowned(), 0, {
      stance: -3,
      stats: { ...crowned().world!.states[0].stats, economy: 10 },
      laws: [
        { subject: 'strangers', action: 'turned_away', label: 'A stranger at this gate is turned away', turn: 3, status: 'active' },
      ],
    });
    const no = actAbroad(cold, 'ask', 'k1')!;
    expect(no.moves).toHaveLength(1);
    expect(no.moves[0].delta, 'a refusal moved a board').toBe(0);
    expect(no.moves[0].source).toContain(cold.world!.states[0].name);
  });

  it('a refusal still leaves a line, because the year is gone either way', () => {
    const cold = withState(crowned(), 0, {
      stance: -3,
      stats: { ...crowned().world!.states[0].stats, economy: 10 },
      laws: [],
    });
    const after = sendAbroad(cold, 'ask', 'k1');
    const line = after.ledger.find((e) => e.source.includes(cold.world!.states[0].name));
    expect(line, 'a spent year with no record of what it was spent on').toBeDefined();
    expect(after.lastWorkTurn, 'the year was not spent').toBe(cold.turn);
  });

  it('sends the watch: it costs the crown either way, and word travels', () => {
    const base = crowned();
    const strong: GameState = { ...base, stats: { ...base.stats, army: 95 } };
    const s = withState(strong, 0, { stance: 0, stats: { ...base.world!.states[0].stats, army: 5 } });
    const others = s.world!.states.slice(1).map((k) => k.stance);

    const out = actAbroad(s, 'raid', 'k1')!;
    const crown = out.moves.find((m) => m.stat === 'crownSanity')!;
    expect(crown.delta, 'ordering it was free').toBe(-K.raid.crown);
    expect(out.world.states[0].stance).toBe(-K.raid.stance);
    out.world.states.slice(1).forEach((k, i) => {
      expect(k.stance, 'nobody else heard about it').toBe(others[i] - K.raid.others);
    });

    // and the same order against somebody stronger costs the crown the same
    const weak: GameState = { ...base, stats: { ...base.stats, army: K.raid.needsArmy } };
    const hard = withState(weak, 0, { stats: { ...base.world!.states[0].stats, army: 99 } });
    const lost = actAbroad(hard, 'raid', 'k1')!;
    expect(lost.moves.find((m) => m.stat === 'crownSanity')!.delta).toBe(-K.raid.crown);
    expect(lost.moves.find((m) => m.stat === 'mood')!.delta).toBe(-K.raid.moodLose);
  });

  it('spends the year and turns it, the way a building does', () => {
    const s = crowned();
    const after = sendAbroad(s, 'send', 'k1');
    expect(after.lastWorkTurn).toBe(s.turn);
    expect(after.lastWork, 'a raid put something up in the town').toBeNull();
    expect(after.turn, 'the year did not turn').toBeGreaterThan(s.turn);
  });
});

describe('the crown itself', () => {
  it('arrives at the count, but only on a reign that was opened for it', () => {
    const town = beginAt('town', 8);
    const big: GameState = { ...town, population: CONFIG.kingdom.at + 20, phase: 'aftermath' };
    const crownedNow = advance(big);
    expect(crownedNow.stage).toBe('kingdom');
    expect(crownedNow.world, 'crowned with no world').toBeDefined();
    expect(crownedNow.flags).toContain('became_kingdom');
    expect(
      crownedNow.ledger.some((e) => e.source === UI.ledger.crownArrives),
      'nothing in the ledger says the crown came',
    ).toBe(true);

    const shut: GameState = { ...big, flags: big.flags.filter((f) => f !== 'kingdom_open') };
    expect(advance(shut).stage, 'crowned without the road being open').toBe('town');
  });
});
