import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';

import { beginAt } from '../src/engine/chapters';
import type { GameState, Season } from '../src/engine/types';
import { CityScape } from '../src/ui/components/CityScape';
import { CASE_SPOTS } from '../src/content/meta';
import { atCrossing } from '../src/ui/journey/routes';
import { DECK, WATER_HALF, bankOf, lengthOf, resample, stopsFrom, walkOver, waterDistance } from '../src/ui/components/town/paths';
import {
  FAR_SITES,
  FISH_SPOTS,
  HUT_SITES,
  ROAD_IN,
  ROAD_OVER,
  SQUARE,
  WOOD_TRUNKS,
  homeDoor,
  hutSites,
} from '../src/ui/components/town/sites';

/**
 * The life of the place, read off what the reign has built.
 *
 * Every figure that moves in the picture moves because of something the
 * years paid for: a bridge is people crossing it, a road is people on it, a
 * road wide enough for a cart is a cart, enough roofs are children and hens
 * between them. These check the geometry that keeps a walk out of the river
 * and the wiring that puts each of those on the picture in the right reign
 * and in no other.
 */

const g = globalThis as Record<string, unknown>;
g.window ??= {
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  location: { search: '', pathname: '/' },
  innerWidth: 1280,
  innerHeight: 800,
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
};
g.document ??= { querySelector: () => null };

const town = beginAt('town', 7);

function drawn(
  state: GameState,
  season: Season,
  patch: Partial<GameState> = {},
  extra: Record<string, unknown> = {},
): string {
  const s = { ...state, ...patch };
  return renderToStaticMarkup(
    createElement(CityScape, {
      stats: s.stats,
      cityFlags: s.cityFlags,
      population: s.population,
      buildings: s.buildings,
      stage: s.stage,
      season,
      placements: s.placements,
      ...extra,
    }),
  );
}

const count = (html: string, needle: string): number => html.split(needle).length - 1;

/**
 * Every step between two stops is dry, or on the crossing.
 *
 * The first and last thirty units are the route's own ends, which it does not
 * choose: a door is where the roof put it and a rod is where the water is
 * deep enough, and the ninth roof's door stands on the very edge of the bank.
 * What the route is answerable for is the way between them, and "dry" is
 * the water itself and not the ruler's wider berth round it, because a bank
 * is a place people walk.
 */
function dryStops(route: { x: number; y: number }[]) {
  const stops = resample(route, 7);
  const first = route[0];
  const last = route[route.length - 1];
  for (let i = 1; i < stops.length; i++) {
    for (let t = 0; t <= 1; t += 0.05) {
      const at = {
        x: stops[i - 1].x + (stops[i].x - stops[i - 1].x) * t,
        y: stops[i - 1].y + (stops[i].y - stops[i - 1].y) * t,
      };
      if (Math.hypot(at.x - first.x, at.y - first.y) < 30) continue;
      if (Math.hypot(at.x - last.x, at.y - last.y) < 30) continue;
      const wet = waterDistance(at) < WATER_HALF;
      expect(wet && !atCrossing(at), `${at.x.toFixed(0)},${at.y.toFixed(0)}`).toBe(false);
    }
  }
}

describe('which bank a thing is on', () => {
  it('puts every roof, rod and trunk on the town side of the water', () => {
    for (const h of HUT_SITES) expect(bankOf(h), `hut ${h.x},${h.y}`).toBe('near');
    for (const f of FISH_SPOTS) expect(bankOf(f), `rod ${f.x},${f.y}`).toBe('near');
    for (const t of WOOD_TRUNKS) expect(bankOf(t), `trunk ${t.x},${t.y}`).toBe('near');
    expect(bankOf(SQUARE)).toBe('near');
  });

  it('puts the beeches and the far roofs on the other side', () => {
    expect(bankOf(CASE_SPOTS.v7_beeches)).toBe('far');
    for (const h of FAR_SITES) expect(bankOf(h), `far roof ${h.x},${h.y}`).toBe('far');
    expect(bankOf({ x: 1268, y: 548 })).toBe('far');
  });

  it('reads the deck bank to bank', () => {
    expect(bankOf(DECK[0])).toBe('near');
    expect(bankOf(DECK[DECK.length - 1])).toBe('far');
  });
});

describe('the way over', () => {
  const door = homeDoor(0, HUT_SITES);
  const beeches = { x: 1210, y: 560 };

  it('is a straight line on one bank', () => {
    expect(walkOver(door, FISH_SPOTS[0], false)).toEqual([door, FISH_SPOTS[0]]);
    expect(walkOver(door, FISH_SPOTS[0], true)).toEqual([door, FISH_SPOTS[0]]);
  });

  it('is nothing at all across the water with no bridge', () => {
    expect(walkOver(door, beeches, false)).toBeNull();
  });

  it('crosses on the deck with one, in either direction, dry-shod', () => {
    const over = walkOver(door, beeches, true)!;
    expect(over).toContainEqual({ x: 1090, y: 482 });
    expect(over[0]).toEqual(door);
    expect(over[over.length - 1]).toEqual(beeches);
    const back = walkOver(homeDoor(0, FAR_SITES), FISH_SPOTS[1], true)!;
    expect(back).toContainEqual({ x: 1090, y: 482 });
    // the deck is walked from the far bank first when that is where the door is
    expect(back[1]).toEqual(DECK[DECK.length - 1]);
    // and the stops the animation actually walks, corners cut and all, are dry
    dryStops(over);
    dryStops(back);
    // from every near door and every far door, not only the first
    for (let i = 0; i < HUT_SITES.length; i++) dryStops(walkOver(homeDoor(i, HUT_SITES), beeches, true)!);
    /* The last two trunks of the front rank stand on the bank itself (the
       fifth is twenty-two units from the middle of the river), so a walk to
       them is a walk along the bank whoever takes it, as it always was for
       the cutters from the near roofs. The inland trunks are checked. */
    for (let i = 0; i < FAR_SITES.length; i++) {
      for (const work of [...FISH_SPOTS, ...WOOD_TRUNKS.slice(0, 3)]) dryStops(walkOver(homeDoor(i, FAR_SITES), work, true)!);
    }
  });

  it('cuts a route into stops the same distance apart, ends kept', () => {
    const route = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }];
    const stops = resample(route, 7);
    expect(stops).toHaveLength(7);
    expect(stops[0]).toEqual({ x: 0, y: 0 });
    expect(stops[6]).toEqual({ x: 100, y: 50 });
    const step = lengthOf(route) / 6;
    for (let i = 1; i < stops.length; i++) {
      expect(Math.hypot(stops[i].x - stops[i - 1].x, stops[i].y - stops[i - 1].y)).toBeCloseTo(step, 6);
    }
    // and the offsets a stylesheet reads start where the figure is drawn
    const vars = stopsFrom(route, route[0]);
    expect(vars['--w0']).toBe('0px 0px');
    expect(vars['--w6']).toBe('100px 50px');
  });

  it('keeps both road trips on the road and the second one on the deck', () => {
    expect(ROAD_IN[0].y).toBeGreaterThan(200);
    expect(ROAD_OVER).toContainEqual({ x: 1090, y: 482 });
    dryStops(ROAD_IN);
    dryStops(ROAD_OVER);
  });
});

describe('what the picture puts on the ground', () => {
  const built = (patch: Partial<Record<string, number>>) =>
    ({ ...town.buildings, ...patch }) as GameState['buildings'];

  it('sends nobody over the water until there is a bridge', () => {
    const before = drawn(town, 'summer', { buildings: built({ bridge: 0, road: 1 }) });
    expect(count(before, 'data-job="far"')).toBe(0);
    expect(count(before, 'data-cart=')).toBe(0);
    const after = drawn(town, 'summer', { buildings: built({ bridge: 1, road: 1 }) });
    expect(count(after, 'data-job="far"')).toBeGreaterThan(0);
    // the far bank's people come out of a near door and cross on the deck
    expect(count(after, 'data-via="bridge"')).toBeGreaterThan(0);
    expect(after).toContain('city-commute-via');
    // and the deck is not walked while it is still two piles and a plank
    const plank = drawn(town, 'summer', { buildings: built({ bridge: 1, road: 1 }) }, { raising: 'bridge' });
    expect(count(plank, 'data-job="far"')).toBe(0);
  });

  it('walks the road end to end once there is one, and not in the frost', () => {
    const none = drawn(town, 'summer', { buildings: built({ road: 0, bridge: 0 }) });
    expect(count(none, 'data-job="road"')).toBe(0);
    const cut = drawn(town, 'summer', { buildings: built({ road: 1, bridge: 0 }) });
    expect(count(cut, 'data-job="road"')).toBeGreaterThan(0);
    expect(cut).toContain('city-trip');
    const frost = drawn(town, 'winter', { buildings: built({ road: 2, bridge: 1 }) });
    expect(count(frost, 'data-job="road"')).toBe(0);
    expect(count(frost, 'data-cart=')).toBe(0);
    expect(count(frost, 'data-job="far"')).toBe(0);
  });

  it('puts a cart on a road wide enough for one, and a second over the bridge', () => {
    const track = drawn(town, 'summer', { buildings: built({ road: 1, bridge: 1 }) });
    expect(count(track, 'data-cart=')).toBe(0);
    const wide = drawn(town, 'summer', { buildings: built({ road: 2, bridge: 0 }) });
    expect(count(wide, 'data-cart="in"')).toBe(1);
    expect(count(wide, 'data-cart="over"')).toBe(0);
    const both = drawn(town, 'summer', { buildings: built({ road: 2, bridge: 1 }) });
    expect(count(both, 'data-cart="in"')).toBe(1);
    expect(count(both, 'data-cart="over"')).toBe(1);
    // while the road is still being cut to that width, last year's road is what is drawn
    const cutting = drawn(town, 'summer', { buildings: built({ road: 2, bridge: 0 }) }, { raising: 'road' });
    expect(count(cutting, 'data-cart=')).toBe(0);
  });

  it('opens the far bank to roofs only once bridged, and after the near bank is full', () => {
    expect(hutSites(false)).toHaveLength(HUT_SITES.length);
    expect(hutSites(true)).toHaveLength(HUT_SITES.length + FAR_SITES.length);
    const crowded = { population: 220, buildings: built({ house: 3, bridge: 1, road: 2 }) };
    const far = drawn(town, 'summer', crowded);
    expect(count(far, 'data-bank="far"')).toBe(FAR_SITES.length);
    const unbridged = drawn(town, 'summer', { ...crowded, buildings: built({ house: 3, bridge: 0, road: 2 }) });
    expect(count(unbridged, 'data-bank="far"')).toBe(0);
    const small = drawn(town, 'summer', { population: 40, buildings: built({ house: 1, bridge: 1, road: 2 }) });
    expect(count(small, 'data-bank="far"')).toBe(0);
  });

  it('has children and hens once there are roofs enough, and none in a camp', () => {
    const camp = drawn(beginAt('village', 7), 'summer', { population: 5, buildings: built({ house: 0 }) });
    expect(count(camp, 'data-kid')).toBe(0);
    expect(count(camp, 'data-hen')).toBe(0);
    const lived = drawn(town, 'summer', { population: 60, buildings: built({ house: 2 }) });
    expect(count(lived, 'data-kid')).toBe(2);
    expect(count(lived, 'data-hen')).toBe(3);
    const frost = drawn(town, 'winter', { population: 60, buildings: built({ house: 2 }) });
    expect(count(frost, 'data-kid')).toBe(0);
  });

  it('dances in the square in the year of the fair and in no other', () => {
    const plain = drawn(town, 'summer');
    expect(count(plain, 'data-dance')).toBe(0);
    const fair = drawn(town, 'summer', {}, { raising: 'fair' });
    expect(count(fair, 'data-dance')).toBe(2);
    const bunting = drawn(town, 'autumn', { cityFlags: [...town.cityFlags, 'bunting'] });
    expect(count(bunting, 'data-dance')).toBe(2);
  });

  it('draws the goats grazing, not stuffed', () => {
    expect(drawn(town, 'summer')).toContain('city-graze');
  });
});
