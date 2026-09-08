import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactElement } from 'react';

import { beginAt } from '../src/engine/chapters';
import { getCase } from '../src/engine/registry';
import { newGame, chooseCase, chooseLaw } from '../src/engine/reducer';
import { seasonOf } from '../src/engine/simulation';
import type { GameState } from '../src/engine/types';

import { Aftermath } from '../src/ui/screens/Aftermath';
import { Case } from '../src/ui/screens/Case';
import { Composer } from '../src/ui/screens/Composer';
import { Intro } from '../src/ui/screens/Intro';
import { Portrait } from '../src/ui/screens/Portrait';
import { Title } from '../src/ui/screens/Title';
import { Works } from '../src/ui/screens/Works';
import { CityScape } from '../src/ui/components/CityScape';
import { Interlude } from '../src/ui/components/Interlude';
import { MonarchPanel } from '../src/ui/components/MonarchPanel';
import { StandingLaws } from '../src/ui/components/StandingLaws';
import { TopBar } from '../src/ui/components/TopBar';
import { GrowthLadder } from '../src/ui/components/GrowthLadder';
import { DevBar } from '../src/ui/components/DevCorner';
import { DevDials } from '../src/ui/components/DevDials';
import { DevVerdict } from '../src/ui/components/DevVerdict';
import { townFolk } from '../src/engine/folk';

/**
 * Does every screen in this game render at all.
 *
 * Two hundred and sixty six tests and not one of them had ever rendered a
 * component: eight thousand lines of TSX, and the release guard checked that
 * the built file contained a `#root` div and a script. A component that throws
 * the moment it is asked for its markup shipped as a blank window and passed
 * every check there was, which is the one hole in this project's quality that
 * the project could not see.
 *
 * This is deliberately not a DOM: `renderToStaticMarkup` is `react-dom`, which
 * is already a dependency, and the rule about installing nothing else is not
 * worth breaking for jsdom. What it catches is exactly what it says: a screen
 * that cannot be drawn. Effects do not run here, so what a component does
 * *after* it is on screen is still the browser's business and still checked by
 * hand. Rendering is the half that used to be checked by nobody.
 */

/** The handful of browser things a screen touches while it is being drawn. */
const g = globalThis as Record<string, unknown>;
g.window ??= {
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  location: { search: '', pathname: '/' },
  requestAnimationFrame: () => 0,
  cancelAnimationFrame: () => {},
  innerWidth: 1280,
  innerHeight: 800,
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
};
g.document ??= { querySelector: () => null };
g.localStorage ??= (g.window as { localStorage: unknown }).localStorage;

const draw = (el: ReactElement): string => renderToStaticMarkup(el);
const noop = () => {};

/** A reign at each stage, and one with a person standing in front of you. */
const village = beginAt('village', 7);
const town = beginAt('town', 7);
const kingdom = beginAt('kingdom', 7);

function withCase(state: GameState): GameState {
  const s = { ...state, phase: 'case' as const, current: { kind: 'case' as const, id: 'v1_idle_hand' } };
  return s;
}

function afterCase(state: GameState): GameState {
  const open = withCase(state);
  const event = getCase('v1_idle_hand')!;
  return chooseCase(open, event.id, event.choices[0].id);
}

describe('every screen renders', () => {
  it('the title, with and without a reign to carry on', () => {
    expect(draw(<Title hasSave={false} onNew={noop} onContinue={noop} />)).toContain('<h1');
    const carried = draw(<Title hasSave staleSave onNew={noop} onContinue={noop} dev onBeginAt={noop} />);
    expect(carried.length).toBeGreaterThan(200);
  });

  it('the founding', () => {
    expect(draw(<Intro seed={7} onDeclare={noop} />)).toContain('<h1');
  });

  it('the drafting table, at every stage', () => {
    for (const state of [village, town, kingdom]) {
      const s = { ...state, phase: 'composer' as const, current: { kind: 'proposal' as const, id: 'pv1_work' } };
      expect(draw(<Composer state={s} season="spring" onSeal={noop} />).length).toBeGreaterThan(200);
    }
  });

  it('the bench, and what came of it', () => {
    const open = withCase(village);
    expect(draw(<Case state={open} season="spring" onChoose={noop} />)).toContain('Tam');
    const done = afterCase(village);
    expect(draw(<Aftermath state={done} onContinue={noop} />).length).toBeGreaterThan(200);
  });

  it('the year of work, at every stage and with ground to pick', () => {
    for (const state of [village, town, kingdom]) {
      const s = { ...state, phase: 'works' as const };
      const card = draw(
        <Works state={s} season="autumn" plot={null} onPlot={noop} onBuild={noop} onReopen={noop} />,
      );
      expect(card.length).toBeGreaterThan(400);
    }
  });

  it('the closing report', () => {
    const ended = { ...town, phase: 'portrait' as const };
    expect(draw(<Portrait state={ended} onBeginAnew={noop} />).length).toBeGreaterThan(400);
  });

  it('the chrome that is always on screen', () => {
    for (const state of [village, town, kingdom]) {
      const bar = draw(
        <TopBar
          state={state}
          season="summer"
          speed={0}
          onSpeed={noop}
          onCodex={noop}
          onRegister={noop}
          onWorld={noop}
          onTree={noop}
          onBeginAnew={noop}
        />,
      );
      expect(bar.length).toBeGreaterThan(200);
      expect(draw(<MonarchPanel state={state} variant="card" />).length).toBeGreaterThan(100);
      expect(draw(<MonarchPanel state={state} variant="strip" />).length).toBeGreaterThan(50);
      // a place with no law on the wall draws nothing here, which is the point
      const wall = draw(<StandingLaws state={state} writing={false} />);
      expect(typeof wall).toBe('string');
      if (state.laws.some((l) => l.status === 'active')) expect(wall.length).toBeGreaterThan(20);
      expect(draw(<GrowthLadder state={state} />).length).toBeGreaterThan(200);
    }
  });

  it('the quiet between decisions', () => {
    const card = draw(
      <Interlude
        state={village}
        season="winter"
        waiting
        next={{ kind: 'case', id: 'v1_idle_hand' }}
        onOpen={noop}
      />,
    );
    expect(card.length).toBeGreaterThan(100);
  });

  it('the town itself, in every season and at every stage', () => {
    for (const state of [village, town, kingdom]) {
      for (const season of ['spring', 'summer', 'autumn', 'winter'] as const) {
        const svg = draw(
          <CityScape
            stats={state.stats}
            cityFlags={state.cityFlags}
            population={state.population}
            buildings={state.buildings}
            stage={state.stage}
            season={season}
            placements={state.placements}
            folk={townFolk(state, season)}
          />,
        );
        expect(svg.startsWith('<svg'), `${state.stage} in ${season}`).toBe(true);
        expect(svg.length).toBeGreaterThan(5000);
      }
    }
  });

  it('the dev strip and its dials draw at every stage', () => {
    for (const state of [village, town, kingdom]) {
      const strip = draw(
        <DevBar
          state={state}
          editText={false}
          onEditText={noop}
          onWipe={noop}
          onTurn={noop}
          onOpenBoard={noop}
          onBeginAt={noop}
        />,
      );
      expect(strip.length, state.stage).toBeGreaterThan(100);

      /* The panel is behind a click, so it is drawn here on its own. A hamlet
         is the one that has boards it has not opened, and offers them instead
         of a dial: that is the row this is really watching. */
      const panel = draw(
        <DevDials state={state} onTurn={noop} onOpenBoard={noop} onBeginAt={noop} />,
      );
      expect(panel, state.stage).toContain('souls');
      expect(panel.includes('open it'), state.stage).toBe(state.stage === 'village');
    }
  });

  it('the thumbs are drawn in dev mode and nowhere else', () => {
    const props = { id: 'case:v1_idle_hand', label: 'The Idle Hand', turn: 3 };
    expect(draw(<DevVerdict {...props} dev={false} />)).toBe('');
    const on = draw(<DevVerdict {...props} dev wide />);
    expect(on).toContain('aria-pressed');
    // the thumbs alone out on the map, the line of why only where there is room
    expect(draw(<DevVerdict {...props} dev />)).not.toContain('why');
    expect(on).toContain('why');
  });

  it('a fresh reign draws its first three screens in order', () => {
    let s = newGame(11);
    expect(draw(<Intro seed={s.seed} onDeclare={noop} />).length).toBeGreaterThan(200);
    s = { ...s, phase: 'composer', turn: 2, current: { kind: 'proposal', id: 'pv1_work' } };
    const season = seasonOf(s.phase, s.turn);
    expect(draw(<Composer state={s} season={season} onSeal={noop} />).length).toBeGreaterThan(200);
    const proposal = 'pv1_work';
    const sealed = chooseLaw(s, proposal, 0, 'THE WORK OF THIS PLACE IS SHARED ALIKE, AND SO IS THE HARVEST');
    expect(draw(<Aftermath state={sealed} onContinue={noop} />).length).toBeGreaterThan(100);
  });
});
