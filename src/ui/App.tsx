import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { UI } from '../content/ui-strings';
import {
  advance,
  chooseCase,
  chooseDeclared,
  chooseLaw,
  buildEarly,
  chooseWork,
  continueYear,
  focusTech,
  giveGift,
  nameTown,
  openBoard,
  newGame,
  reopenLaw,
  seeFaces,
  seeWorks,
  sendAbroad,
  takeLover,
  visitLover,
  takeMoment,
} from '../engine/reducer';
import { beginAt } from '../engine/chapters';
import { turnDial, type DialId } from '../engine/dev';
import type { WorldAction } from '../engine/world';
import { freePlots, needsPlacement } from '../engine/plots';
import { getMoment, momentsNow } from '../engine/moments';
import { clearSave, forgetEverything, hasSeenNote, hasSeenWiring, markNoteSeen, markWiringSeen, readSave, saveGame } from '../engine/save';
import type {
  GameState,
  PhilTag,
  Phase,
  PlotId,
  Season,
  Stage,
  StatId,
  TechId,
  WorkId,
} from '../engine/types';
import { CityScape } from './components/CityScape';
import { DEFAULT_MONARCH_ID, MONARCHS } from '../content/monarchs';
import { CASE_SPOTS, LAW_SPOT, STATS, WORKS_SPOT } from '../content/meta';
import { HUSHED_CASES } from '../content/sound';
import { TECHS } from '../content/techs';
import { buildableNow, isWinter, seasonOf, techOpening, workSpent, yearsToWinter } from '../engine/simulation';
import { getCase } from '../engine/registry';
import { townFolk } from '../engine/folk';
import { CONFIG } from '../engine/config';
import { movePoints } from '../engine/format';
import { BuildBadge, DevBar, DevToggle } from './components/DevCorner';
import { DevEditsPanel } from './components/DevEditsPanel';
import { DevVerdict } from './components/DevVerdict';
import { TextEditLayer } from './dev/TextEditLayer';
import { clearAllDevEdits } from './dev/devEditsStore';
import { clearAllDevMarks } from './dev/devMarksStore';
import { setTextEditMode } from './dev/textEditMode';
import { FolkGallery } from './dev/FolkGallery';
import { previewReign } from './previewReign';
import { Interlude } from './components/Interlude';
import { LoverMoment } from './components/LoverMoment';
import { MonarchPanel } from './components/MonarchPanel';

import { Popup } from './components/Popup';
import { Primer } from './components/Primer';
import { DoorNote } from './components/DoorNote';
import { SmallThingNote } from './components/SmallThingNote';
import { TopBar } from './components/TopBar';
import { SealMoment } from './components/SealMoment';
import { TechMoment } from './components/TechMoment';
import { TechOpened } from './components/TechOpened';
import { MusicToggle } from './components/MusicToggle';
import { wantMusic } from './music';
import { WinterWarning } from './components/WinterWarning';
import { TownNaming } from './components/TownNaming';
import { BoardChoice } from './components/BoardChoice';
import { OPENABLE_BOARDS, openableBoard } from '../engine/simulation';
import { EpithetMoment } from './components/EpithetMoment';
import { epithetOf } from '../engine/epithet';
import type { EpithetDef } from '../content/epithets';
import { MonarchPortrait } from './components/MonarchPortrait';
import { Codex } from './overlays/Codex';
import { Register } from './overlays/Register';
import { TechTree } from './overlays/TechTree';
import { World } from './overlays/World';
import { WORK_SITES, siteOf } from './components/town/sites';
import { fitToMap, fitToScreen, mapViewport, useMapFit } from './useMapFit';
import { useHand } from './hand/useHand';
import { handSpot } from './hand/spots';
import { Aftermath } from './screens/Aftermath';
import { Case } from './screens/Case';
import { Composer } from './screens/Composer';
import { Intro } from './screens/Intro';
import { Portrait } from './screens/Portrait';
import { Title } from './screens/Title';
import { Works } from './screens/Works';
import { useJourney } from './journey/useJourney';
import { openJobs } from './journey/model';
import { JourneyLayer, RulerDevControls, RulerDoing } from './journey/Ruler';
import { JourneyCard } from './journey/JourneyCard';
import './journey/journey.css';
import './map-design.css';
import { monarchOf } from '../engine/monarch';
import { onFoot } from './journey/routes';
import { TYPE } from './type';
import { reducedMotion } from './motion';

type Action =
  | { type: 'new'; seed: number }
  | { type: 'continue'; game: GameState }
  | { type: 'declare'; tag: PhilTag }
  | { type: 'law'; proposalId: string; optionIdx: number; label: string }
  | { type: 'case'; choiceId: string; ruling?: string }
  | { type: 'nextInYear' }
  | { type: 'build'; id: WorkId; plot?: PlotId }
  | { type: 'seeWorks' }
  | { type: 'seeFaces' }
  | { type: 'gift'; character: string }
  | { type: 'lover'; character: string }
  | { type: 'visit'; character: string }
  | { type: 'nameTown'; name: string }
  | { type: 'openBoard'; board: StatId }
  | { type: 'reopen'; proposalId: string }
  | { type: 'focus'; tech: TechId }
  | { type: 'moment'; id: string }
  | { type: 'world'; action: WorldAction; target: string }
  | { type: 'begin'; chapter: Stage; seed: number }
  | { type: 'dial'; dial: DialId; delta: number }
  | { type: 'advance' }
  | { type: 'reset' };

function appReducer(game: GameState | null, action: Action): GameState | null {
  if (action.type === 'new') return newGame(action.seed);
  if (action.type === 'begin') return beginAt(action.chapter, action.seed);
  if (action.type === 'continue') return action.game;
  if (action.type === 'reset') return null;
  if (!game) return game;

  switch (action.type) {
    case 'declare':
      return chooseDeclared(game, action.tag);
    case 'moment':
      return takeMoment(game, action.id);
    case 'world':
      return sendAbroad(game, action.action, action.target);
    case 'law':
      return chooseLaw(game, action.proposalId, action.optionIdx, action.label);
    case 'case':
      if (game.current?.kind !== 'case') return game;
      return chooseCase(game, game.current.id, action.choiceId, action.ruling);
    case 'nextInYear':
      return continueYear(game);
    case 'build':
      /* In the year's own turn for it the year turns on the choice; from the
         shelf in any other season it does not, and whoever is due this year
         still comes. */
      return game.phase === 'works'
        ? chooseWork(game, action.id, action.plot)
        : buildEarly(game, action.id, action.plot);
    case 'seeWorks':
      return seeWorks(game);
    case 'seeFaces':
      return seeFaces(game);
    case 'gift':
      return giveGift(game, action.character);
    case 'lover':
      return takeLover(game, action.character);
    case 'visit':
      return visitLover(game, action.character);
    case 'nameTown':
      return nameTown(game, action.name);
    case 'openBoard':
      return openBoard(game, action.board);
    case 'dial':
      return turnDial(game, action.dial, action.delta);
    case 'reopen':
      return reopenLaw(game, action.proposalId);
    case 'focus':
      return focusTech(game, action.tech);
    case 'advance':
      return advance(game);
  }
}

function freshSeed(): number {
  let seed = typeof crypto !== 'undefined' && crypto.getRandomValues
    ? crypto.getRandomValues(new Uint32Array(1))[0] : 1;
  // Keep saved and explicitly requested seeds intact. Only a fresh reign
  // selects the default crown, through the existing deterministic schedule.
  while (monarchOf(seed).id !== DEFAULT_MONARCH_ID) seed = (seed + 1) >>> 0;
  return seed;
}

/**
 * `?chapter=village|town|kingdom` on the URL, with an optional `?seed=`.
 *
 * Not gated on the dev switch, for the same reason `?see=end` is not: it is
 * how a chapter gets reloaded and reloaded while it is being looked at, and a
 * switch that has to be found again after every reload is not a tool. It reads
 * once, on mount, and it never fires over a save that is being continued.
 */
function chapterInUrl(): { chapter: Stage; seed: number } | null {
  if (PLAYER_BUILD) return null;
  const params = new URLSearchParams(window.location.search);
  const asked = params.get('chapter');
  if (asked !== 'village' && asked !== 'town' && asked !== 'kingdom') return null;
  const wanted = Number(params.get('seed'));
  return { chapter: asked, seed: Number.isInteger(wanted) && wanted > 0 ? wanted : freshSeed() };
}

/**
 * The build a stranger opens.
 *
 * `vite build --mode player` sets this, and `tools/build-itch.ps1` is the only
 * thing that runs it. What it takes out is every door that is not the game: the
 * switch in the bottom corner and the whole strip behind it, the chapter
 * fixtures on the title screen, and `?chapter=` on the URL. Nothing else about
 * the build changes, and `?see=end` stays, because the closing screen on a
 * reign that never happened is a thing to show somebody rather than a tool.
 */
const PLAYER_BUILD = import.meta.env.MODE === 'player';

const WHEEL: Season[] = ['spring', 'summer', 'autumn', 'winter'];

/** The season a scene brought with it, which outranks the phase it lands in. */
function sceneSeasonOf(game: GameState): Season | undefined {
  return game.current?.kind === 'case' ? getCase(game.current.id)?.season : undefined;
}

/**
 * The quiet between decisions. `span` is how many seasons drift past before
 * somebody knocks: a whole wheel when the year has turned, a couple of steps
 * when the next person is simply next in the same year.
 */
type Idle = { step: number; span: number; from: Season } | 'waiting' | null;

/** How far in from the corner of the card the thread is allowed to land. */
const TAIL_INSET = 44;

/** Where the one preference this game has is kept. Not in the save: the save
 *  is the reign, and how fast somebody likes to watch it is not. */
const SPEED_KEY = 'lawmaker_speed_v1';

/** Where the card is sitting, measured in the box the town is drawn in. */
interface Anchor {
  left: number;
  top: number;
  width: number;
}

export function App() {
  const [game, dispatch] = useReducer(appReducer, null);
  const [codexOpen, setCodexOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  /** Who is up at the house right now, when the one you took has been asked. */
  const [visiting, setVisiting] = useState<string | null>(null);
  const [worldOpen, setWorldOpen] = useState(false);
  const [treeOpen, setTreeOpen] = useState(false);
  /** The shelf, opened from the mark in the corner in a season that is not its own. */
  const [worksOpen, setWorksOpen] = useState(false);
  /** The books, and the rule that there is only ever one of them open. */
  const openOnly = useCallback((which: 'codex' | 'register' | 'world' | 'tree' | null) => {
    setCodexOpen(which === 'codex');
    setRegisterOpen(which === 'register');
    setWorldOpen(which === 'world');
    setTreeOpen(which === 'tree');
  }, []);
  const [dev, setDev] = useState(false);
  /** Dev mode: a pencil on every line in the game. See `TextEditLayer`. */
  const [editText, setEditText] = useState(false);
  useEffect(() => setTextEditMode(dev && editText), [dev, editText]);
  const [instantJourneys, setInstantJourneys] = useState(false);
  const deferredYear = useRef<Action | null>(null);
  const [saved, setSaved] = useState<GameState | null>(null);
  /** There is a reign in the slot that this version cannot open. */
  const [staleSave, setStaleSave] = useState(false);
  const [idle, setIdle] = useState<Idle>(null);
  /** A work being considered, so the town can show where it would stand. */
  const [preview, setPreview] = useState<WorkId | null>(null);
  /** The one this year has actually settled on, which is what the ground is for. */
  const [picked, setPicked] = useState<WorkId | null>(null);
  /** And the ground it is going on, held here because the town shares it. */
  const [plot, setPlot] = useState<PlotId | null>(null);
  /** A peg under the pointer out on the town, before anybody has committed. */
  const [plotHover, setPlotHover] = useState<PlotId | null>(null);
  /* And the year turning clears what last year was considering, whichever way
     it turned. `onBuild` clears these; a year that ended on a law or a case
     never went through it. */
  const turnNow = game?.turn ?? -1;
  useEffect(() => {
    setPreview(null);
    setPicked(null);
    setPlot(null);
    setPlotHover(null);
    setWorksOpen(false);
  }, [turnNow]);
  /* `phase: works` is the shelf and nothing else on the screen. No year of a
     played reign ends there any more; what still does is a dev fixture opened
     at a chapter, and on that screen the shelf is what there is to look at. */
  const phaseNow = game?.phase ?? null;
  useEffect(() => {
    if (phaseNow === 'works') setWorksOpen(true);
  }, [phaseNow]);
  /** The year the shelf last came up by itself, so it comes up once a year. */
  const shelfShownOn = useRef(-99);
  /* The shelf has been read, whichever way it was opened, and what is on it
     is what the mark compares against from now on. Nothing changes when
     nothing new is on it, so this settles at once. */
  const worksShown = game !== null && worksOpen;
  useEffect(() => {
    if (worksShown) dispatch({ type: 'seeWorks' });
  }, [worksShown, game]);
  /* And the same for the book of faces, which gains people while you are
     looking at something else. */
  useEffect(() => {
    if (registerOpen) dispatch({ type: 'seeFaces' });
  }, [registerOpen, game]);
  /**
   * How fast the years go past. A preference, not part of the reign: it lives
   * in this browser and never goes into the save.
   */
  const [speed, setSpeed] = useState(0);

  useEffect(() => {
    try {
      const kept = Number(localStorage.getItem(SPEED_KEY));
      if (Number.isInteger(kept) && kept >= 0 && kept < CONFIG.speeds.length) setSpeed(kept);
    } catch {
      // private mode: the wheel turns at the speed it always did
    }
  }, []);

  const changeSpeed = useCallback((next: number) => {
    setSpeed(next);
    try {
      localStorage.setItem(SPEED_KEY, String(next));
    } catch {
      // it simply does not stick, which is not worth an error about
    }
  }, []);
  /** Something the place worked out on its own, waiting to be noticed. */
  const [worked, setWorked] = useState<TechId | null>(null);
  /** A name the place has settled on for you, waiting to be told to you. */
  const [named, setNamed] = useState<EpithetDef | null>(null);
  /** The year the place last settled on what to call you. */
  const namedOn = useRef(-99);
  /** The year of a long winter that somebody has come to warn you about. */
  const [winterAhead, setWinterAhead] = useState<number | null>(null);
  /* What the four boards are, said once before anything is spent. A fact
     about this browser rather than about this reign, so it uses the same note
     the four-dial lecture used when it lived on the seal. */
  const [primer, setPrimer] = useState(() => !hasSeenWiring());
  /* The two later notes, on the same terms as the primer: a fact about this
     browser and not about this reign, so a second reign is not a second
     lecture, and `clear history` puts both of them back.

     Neither can be said on the primer's own screen. One is about the person at
     the door and the other about a thing out on the meadow, and on the day the
     primer is read there is neither, so each waits for the thing it explains
     to be on the screen in front of the reader. */
  const [doorNote, setDoorNote] = useState(() => !hasSeenNote('door'));
  const [smallNote] = useState(() => !hasSeenNote('smallThing'));
  /** The year the small thing was named in. The year turning takes it down. */
  const [smallNoteTurn, setSmallNoteTurn] = useState<number | null>(null);
  /** The year the workshops opened, waiting to be mentioned to you once. */
  const [treeOpened, setTreeOpened] = useState(false);
  /** undefined until the first state is seen, so a loaded save is not news. */
  const treeWasOpen = useRef<boolean | undefined>(undefined);
  const knownTechs = useRef(0);
  /** undefined until the first state is seen, so a loaded save is not news. */
  const knownEpithet = useRef<string | null | undefined>(undefined);
  /** Whether the Fool has already given the one look this reign gets. */
  const epithetIntroduced = useRef(false);
  const knownWinter = useRef<number | null | undefined>(undefined);
  const seen = useRef<{ turn: number; phase: Phase }>({ turn: 0, phase: 'title' });

  /** The box the town fills, and the card floating over the bottom of it. */
  const mapRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  /** The small thing most recently done, and the year it was done in. */
  const [said, setSaid] = useState<{ id: string; turn: number } | null>(null);
  const fit = useMapFit(mapRef);
  /* The one box every layer over the town is drawn in. The scenes get the
     same one straight from `useHand`, so there is never a second. */
  const view = mapViewport(fit);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  /** The anchor as last written, so an unchanged measurement writes nothing. */
  const anchorNow = useRef<Anchor | null>(null);

  useEffect(() => {
    const slot = readSave();
    setSaved(slot.kind === 'ok' ? slot.state : null);
    setStaleSave(slot.kind === 'stale');
  }, []);

  // the chapter door, taken once and only when the URL actually asks for it
  useEffect(() => {
    const asked = chapterInUrl();
    if (asked) dispatch({ type: 'begin', chapter: asked.chapter, seed: asked.seed });
  }, []);

  useEffect(() => {
    if (game) saveGame(game);
  }, [game]);

  /**
   * Where the card actually ended up.
   *
   * The card grows with what is written on it, so its top edge is not a number
   * anybody can know in advance, and the thread from the town has to land on
   * it. Measured after every render, and written only when it has moved, which
   * is what keeps a ResizeObserver from feeding itself.
   */
  useLayoutEffect(() => {
    const el = cardRef.current;
    const box = mapRef.current;
    if (!el || !box) {
      if (anchorNow.current !== null) {
        anchorNow.current = null;
        setAnchor(null);
      }
      return;
    }
    let frame = 0;
    const write = () => {
      const r = el.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      /* Whole pixels only. A third of one is not a place a thread can land,
         and a rect that wobbles in the third decimal writes a new anchor on
         every render, which is a render loop and not a measurement. */
      const next = {
        left: Math.round(r.left - b.left),
        top: Math.round(r.top - b.top),
        width: Math.round(r.width),
      };
      /* Compared before the state is touched and not inside the updater, for
         the same reason `useMapFit` does: this effect runs after every render,
         and a `setState` from inside a layout effect is a nested update even
         when it changes nothing. See the note in `useMapFit`. */
      const was = anchorNow.current;
      if (was && was.left === next.left && was.top === next.top && was.width === next.width) return;
      anchorNow.current = next;
      setAnchor(next);
    };
    write();
    /* The observer answers on the next frame rather than inside the commit
       that started it: a card whose height is settling (a scrollbar arriving,
       a font landing) then settles in two frames instead of stacking nested
       updates until React gives up on the whole tree. */
    const later = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        write();
      });
    };
    const observer = new ResizeObserver(later);
    observer.observe(el);
    window.addEventListener('resize', later);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', later);
    };
  });

  /**
   * Nothing happens for a while, and then it does. Every time somebody new is
   * due in front of you, the town gets the time in between: the seasons turn
   * over the whole window, and then the place goes still and the spot where it
   * is happening starts to knock.
   */
  useEffect(() => {
    if (!game) {
      seen.current = { turn: 0, phase: 'title' };
      return;
    }
    const before = seen.current;
    // the reign opening is not a lull: the first decision follows the intro
    const opening = before.phase === 'title' || before.phase === 'intro';
    seen.current = { turn: game.turn, phase: game.phase };

    const waits = game.phase === 'composer' || game.phase === 'case';
    const arriving = before.phase !== game.phase || before.turn !== game.turn;
    if (opening || !waits || !arriving) return;

    /* The first year is the whole promise told tight: a law, the man who tests
       it, what your answer did to him, and one year of work. No seasons drift
       between the seal and the knock in year one. The knock itself stays,
       because the mark on the town is learned by answering it once. */
    if (game.turn <= 1) {
      setIdle('waiting');
      return;
    }

    if (reducedMotion()) {
      setIdle('waiting');
      return;
    }

    /* The wheel walks from the season the year is in to the season the next
       card opens in, and stops there.

       It used to start at the destination and step forward from it, for a
       fixed four seasons between years and two inside one, which is how a
       player watched summer and autumn of year two go past and was then handed
       a drafting table headed "spring, year 2", and how the same season line
       came round twice in one year. The distance decides the length now, and
       when there is no distance there is no drift. */
    const from = seasonOf(before.phase, before.turn);
    const to = seasonOf(game.phase, game.turn, sceneSeasonOf(game));
    const step = (WHEEL.indexOf(to) - WHEEL.indexOf(from) + WHEEL.length) % WHEEL.length;
    /* Leaving the first year is the one walk that goes all the way round.
     
       The first year of work is decided in the spring the place was founded
       in, and the drafting table it hands over to is a spring as well, so the
       distance between them is nought and the wheel would not turn at all: a
       whole year of building a house, and the weather never changed. The
       first season out of that year is the summer the house went up in, and
       then the autumn, and then the winter, and then the seal. */
    const span = step === 0 && before.turn === 1 && game.turn > 1 ? WHEEL.length : step;
    if (span === 0) {
      setIdle('waiting');
      return;
    }
    setIdle({ step: 0, span, from });
  }, [game]);

  // the wheel turns on its own, and then stops with a mark on the town
  useEffect(() => {
    if (idle === null || idle === 'waiting') return;
    const last = idle.step >= idle.span - 1;
    const rate = CONFIG.speeds[speed] ?? 1;
    const id = window.setTimeout(
      () => setIdle(last ? 'waiting' : { ...idle, step: idle.step + 1 }),
      (last ? CONFIG.idle.holdMs : CONFIG.idle.seasonMs) / rate,
    );
    return () => window.clearTimeout(id);
  }, [idle, speed]);

  /**
   * Nobody voted for the technology and nobody can refuse it, so the least the
   * screen can do is say when it happened.
   */
  useEffect(() => {
    if (!game) {
      knownTechs.current = 0;
      return;
    }
    if (game.techs.length > knownTechs.current) {
      const latest = game.techs[game.techs.length - 1];
      // a loaded save is not news: only announce what happened while watching
      if (knownTechs.current > 0 || game.techs.length === 1) setWorked(latest);
    }
    knownTechs.current = game.techs.length;
  }, [game]);

  /**
   * A screen arrived in the corner and nothing said so.
   *
   * The cog fades up over a few years and then, at `research.openAt` souls, it
   * is a page you can open, and until now the only way to find that out was to
   * click a thing that had been greyed out for six years. It is announced once,
   * by the one person in the place who would have noticed, and never again. A
   * reign loaded from a save past that point is not news.
   */
  useEffect(() => {
    if (!game) {
      treeWasOpen.current = undefined;
      return;
    }
    const open = techOpening(game) >= 1;
    if (treeWasOpen.current === false && open) setTreeOpened(true);
    treeWasOpen.current = open;
  }, [game]);

  /**
   * Nobody votes on what a place calls its lawmaker, but the Fool is the one
   * who tells you: once, in the years just before the first long winter, and
   * not a day before them.
   */
  useEffect(() => {
    if (!game) {
      knownEpithet.current = undefined;
      epithetIntroduced.current = false;
      return;
    }
    const earned = epithetOf(game);
    const id = earned?.id ?? null;
    const first = knownEpithet.current === undefined;
    const inWindow = game.turn >= CONFIG.epithet.fromYear && game.turn <= CONFIG.epithet.toYear;
    /* A name the place has settled on does not settle again next spring. The
       Fool said "the Unbending" in year seven and "the Builder" in year eight,
       two windows one after the other, and the second landed on top of an open
       aftermath card. Nothing may take it back inside `CONFIG.epithet.rest`
       years of the last time it was said. */
    const rested = game.turn - namedOn.current >= CONFIG.epithet.rest;
    if (!epithetIntroduced.current) {
      if (!first && inWindow && id !== null) {
        setNamed(earned);
        namedOn.current = game.turn;
        epithetIntroduced.current = true;
      }
    } else if (!first && id !== null && id !== knownEpithet.current && rested) {
      // said again, later, only because it changed to something truer
      setNamed(earned);
      namedOn.current = game.turn;
    }
    knownEpithet.current = id;
  }, [game]);

  /** The long winter, said to your face once, two years out. */
  useEffect(() => {
    if (!game) {
      knownWinter.current = undefined;
      return;
    }
    const due =
      yearsToWinter(game.turn) === CONFIG.winter.warnAt ? game.turn + CONFIG.winter.warnAt : null;
    const first = knownWinter.current === undefined;
    if (!first && due !== null && due !== knownWinter.current) setWinterAhead(due);
    knownWinter.current = due;
  }, [game]);

  /**
   * The hand.
   *
   * Some cases have a scene: the camera comes in on the place it is happening
   * and the answer has to be carried out before the reign hears it. It is set
   * up here, above the screens below, because a hook cannot be called after
   * one of them has returned. A case with no scene never notices it.
   */
  /* The scene belongs to its case until the year moves on, so it is still
     standing behind the card that says what the ruling did. */
  const handCaseId =
    game &&
    game.current?.kind === 'case' &&
    (game.phase === 'case' || game.phase === 'aftermath')
      ? game.current.id
      : null;
  const handSpotNow = game && handCaseId ? handSpot(handCaseId, game) : null;
  const visitKey = game && handCaseId ? `${game.seed}:${game.turn}:${handCaseId}` : '';
  const visitEvent = handCaseId ? getCase(handCaseId) : undefined;
  const visitAt = handSpotNow ?? (handCaseId ? CASE_SPOTS[handCaseId] : null);
  const journey = useJourney({
    reign: game?.seed ?? null,
    visit: game && visitEvent && visitAt && (idle === null || idle === 'waiting')
      ? { key: visitKey, id: visitEvent.id, character: visitEvent.character, at: onFoot(visitAt) } : null,
    speed: CONFIG.speeds[speed] ?? 1,
    paused: !game || primer || game.phase === 'intro' || game.phase === 'portrait' || codexOpen || registerOpen || treeOpen || worldOpen || worked !== null || named !== null || treeOpened || winterAhead !== null || (!!game && (openableBoard(game) !== null || (!game.townName && game.turn >= CONFIG.townName.fromYear))),
    instant: dev && instantJourneys,
    /* The day is made of the jobs this valley has. Nobody tends a field that
       nobody has cleared yet, the ruler included: `fields` joins the round the
       year the ground is broken and not before. */
    jobs: openJobs(game?.buildings),
    onComplete: ({ moment, turn }) => {
      if (!game || game.turn !== turn) return;
      dispatch({ type: 'moment', id: moment.id });
      setSaid({ id: moment.id, turn });
    },
  });
  const journeyReady = journey.ready(visitKey);
  useEffect(() => {
    if (journeyReady) setIdle(null);
  }, [journeyReady]);
  // A year cannot discard a promised errand. Its action is applied to the
  // latest reign after the walk, so the collection reward is not overwritten.
  const finishThen = (action: Action) => {
    if (journey.snapshot.errands.length) deferredYear.current = action;
    else dispatch(action);
  };
  useEffect(() => {
    if (journey.snapshot.errands.length || !deferredYear.current) return;
    const action = deferredYear.current;
    deferredYear.current = null;
    dispatch(action);
  }, [journey.snapshot.errands.length]);
  useEffect(() => { deferredYear.current = null; }, [game?.seed]);

  /**
   * A reign is being replaced by another one, and none of the last one is news.
   *
   * The four things above that only speak up when something *changes* keep
   * what they last saw in a ref, and a ref does not know a reign ended. They
   * reset themselves when there is no reign at all, which is the path through
   * the title screen and the only path there used to be. A dev jump goes from
   * one reign straight into another without passing through nothing, so the
   * forgetting is done here instead: otherwise landing a fixture in year 20
   * announces a long winter that the reign you left was two years short of.
   */
  const forgetTheLastReign = useCallback(() => {
    knownTechs.current = 0;
    treeWasOpen.current = undefined;
    knownEpithet.current = undefined;
    epithetIntroduced.current = false;
    namedOn.current = -99;
    knownWinter.current = undefined;
    deferredYear.current = null;
    shelfShownOn.current = -99;
    openOnly(null);
    setIdle(null);
    setWorked(null);
    setNamed(null);
    setWinterAhead(null);
    setTreeOpened(false);
    setSaid(null);
    setPreview(null);
    setPicked(null);
    setPlot(null);
    setPlotHover(null);
  }, [openOnly]);

  /**
   * The same place, ten years on, without playing the ten years.
   *
   * `beginAt` is the fixture the title screen and `?chapter=` have always
   * opened; what is new is opening one from inside a running reign, which is
   * where the question is actually asked. Keeping the seed keeps the valley,
   * the crown and the name, so what changes on the screen is the stage and
   * nothing else - which is the only way to see whether the town reads.
   *
   * The walk is stopped by hand because the journey resets on the seed, and
   * the whole point of this is a jump that does not change it.
   */
  const jumpTo = (chapter: Stage, samePlace: boolean) => {
    forgetTheLastReign();
    journey.skip();
    dispatch({ type: 'begin', chapter, seed: samePlace && game ? game.seed : freshSeed() });
  };
  /* The card is up for it: the years are not drifting and nobody is knocking. */
  const handReady = handCaseId !== null && game?.phase === 'case' && idle === null && journeyReady;
  const hand = useHand({
    mapRef,
    fit,
    caseId: handCaseId,
    spot: handSpotNow,
    ready: handReady,
    anchor,
    tone: game?.phase === 'case' && idle === null ? 'bench' : 'seal',
    onAnswer: (choiceId, ruling) => dispatch({ type: 'case', choiceId, ruling }),
  });

  const openTheDoor = useCallback(() => setIdle(game?.current?.kind === 'case' ? 'waiting' : null), [game?.current?.kind]);

  /**
   * The shelf, coming up on its own, once in every year it has something in
   * it the store can pay for.
   *
   * It used to be the year that opened it: the year ran out of callers, the
   * phase stopped on the shelf, and the screen held the valley with nothing on
   * it at all until somebody went looking for the hammer. On a year whose only
   * answer was to rest, that stop was a dead end and was reported as the game
   * freezing. The year does not stop anywhere now, so the card comes to the
   * player instead: once a year, in the quiet the seasons already drift
   * through, and never over somebody at the door or over a sheet that has the
   * window. It is put away with one click and the year carries on underneath
   * it, spent or not. Asked for by the user.
   */
  const shelfHeldBack =
    !game ||
    primer ||
    codexOpen ||
    registerOpen ||
    treeOpen ||
    worldOpen ||
    worked !== null ||
    named !== null ||
    treeOpened ||
    winterAhead !== null ||
    hand.busy ||
    hand.zoomed ||
    journey.snapshot.errands.length > 0 ||
    openableBoard(game) !== null ||
    (!game.townName && game.turn >= CONFIG.townName.fromYear) ||
    /* the sealing sheet, which takes the window over the top of the card */
    (game.phase === 'aftermath' && game.log[game.log.length - 1]?.kind === 'law');
  useEffect(() => {
    if (!game || shelfHeldBack || worksOpen) return;
    if (shelfShownOn.current === game.turn) return;
    /* Only where the year has no card of its own up: the drift between two
       callers, and the knock at the end of it. A shelf over an open case is a
       card standing on another card. */
    if (idle === null) return;
    if (game.phase !== 'case' && game.phase !== 'composer' && game.phase !== 'aftermath') return;
    if (workSpent(game) || buildableNow(game).length === 0) return;
    shelfShownOn.current = game.turn;
    setWorksOpen(true);
  }, [game, idle, shelfHeldBack, worksOpen]);

  // dev only: ?faces=1 lays out every monarch for a look, the way ?city=all does
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('faces')) {
    return (
      <div className="flex flex-wrap items-start gap-4 p-4">
        {MONARCHS.map((m) => (
          <figure key={m.id} className="w-[180px]">
            <MonarchPortrait monarch={m} mood={75} size={170} />
            <figcaption className="mt-1 text-[12px] text-parchment-dim">{m.name}</figcaption>
          </figure>
        ))}
      </div>
    );
  }

  // dev only: ?folk=1 puts every person and every doing in one place
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('folk')) {
    return <FolkGallery />;
  }

  /**
   * Not dev only, on purpose: `?see=end` on the built file opens the closing
   * screen on a reign that never happened.
   */
  if (new URLSearchParams(window.location.search).get('see') === 'end') {
    return (
      <Portrait
        state={previewReign()}
        onBeginAnew={() => {
          window.location.href = window.location.pathname;
        }}
      />
    );
  }

  if (!game) {
    return (
      <main className="mx-auto min-h-dvh w-full max-w-md">
        <Title
          hasSave={saved !== null}
          staleSave={staleSave}
          onNew={() => {
            if (saved && !window.confirm(UI.title.confirmNew)) return;
            clearSave();
            setStaleSave(false);
            /* A reign opens with the room full. Muting is an answer to one
               evening and not a standing opinion, so it lasts as long as the
               reign it was given in. Asked for by the user. */
            wantMusic();
            dispatch({ type: 'new', seed: freshSeed() });
          }}
          onContinue={() => saved && dispatch({ type: 'continue', game: saved })}
          dev={dev && !PLAYER_BUILD}
          onBeginAt={(chapter) => {
            clearSave();
            wantMusic();
            dispatch({ type: 'begin', chapter, seed: freshSeed() });
          }}
        />
        {/* The music starts here and not at the first spring.

            It was a switch in the corner of the town, which meant the menu,
            the founding and the whole of the first year were played in
            silence, and a player who had asked for music last time got it at
            whatever they clicked next. The reign the pad draws its notes from
            is whichever one the slot is holding, if it is holding one; a fresh
            reign keeps whatever is already playing, which is the same rule the
            toggle has always had. */}
        <div className="fixed bottom-2 right-9 z-30 flex items-center gap-2">
          <MusicToggle seed={saved?.seed ?? 1} season="spring" />
        </div>
        <BuildBadge />
        {!PLAYER_BUILD && <DevToggle on={dev} onToggle={() => setDev((v) => !v)} />}
      </main>
    );
  }

  // the closing screen is a report, not a place: it gets the whole window
  if (game.phase === 'portrait') {
    return (
      <main className="mx-auto min-h-dvh w-full max-w-xl">
        <Portrait
          state={game}
          onBeginAnew={() => {
            if (!window.confirm(UI.portrait.confirmAnew)) return;
            clearSave();
            setSaved(null);
            wantMusic();
            dispatch({ type: 'reset' });
          }}
        />
      </main>
    );
  }

  // a sealed decree is a sentence, not a scene: it is held, read, and done with
  const lastLog = game.log[game.log.length - 1];
  const sealing = game.phase === 'aftermath' && lastLog?.kind === 'law';

  /* Death, punishment and collapse. The effects have hushed themselves round
     these since V50; the music does now as well, and it stays down through the
     aftermath, because a scene is current until the aftermath is read. */
  const graveScene = game.current?.kind === 'case' && HUSHED_CASES.has(game.current.id);

  const decides =
    game.phase === 'composer' ||
    game.phase === 'case' ||
    game.phase === 'aftermath' ||
    game.phase === 'works';
  const idling = idle !== null && decides;
  const waiting = idle === 'waiting';
  const drifting = idling && !waiting;

  /**
   * During the drift the year is only weather, walking forward from the season
   * it was in towards the one the next card opens in. Otherwise the phase says
   * which season it is, and if the person in front of you brought a season with
   * them, that is the season: the frozen ground does not arrive under a summer
   * sun.
   */
  const settled = seasonOf(game.phase, game.turn, sceneSeasonOf(game));
  const wheel = idle !== null && idle !== 'waiting' ? idle : null;
  const season: Season =
    drifting && wheel !== null && !isWinter(game.turn)
      ? WHEEL[(WHEEL.indexOf(wheel.from) + wheel.step + 1) % WHEEL.length]
      : settled;

  /**
   * The place is big enough to be something else as well. Offered once at each
   * of the two counts, and it stands in front of everything: a board that opens
   * changes what every card after it is allowed to promise.
   */
  const offered = openableBoard(game);
  const offer =
    offered === null ? [] : offered === 'both' ? [...OPENABLE_BOARDS] : [offered];
  const choosingBoard = decides && offer.length > 0;

  // Three years in, the carters still ask which turning. It gets a name once.
  const naming =
    decides && !choosingBoard && !game.townName && game.turn >= CONFIG.townName.fromYear;
  const showNaming = naming && !sealing;

  /**
   * The set-piece moments, and where a thumb can go on one.
   *
   * Every one of them is a full screen sheet that is itself one button saying
   * "carry on", so there is nowhere inside to put a control that is not that,
   * and a button cannot be nested in a button anyway. The mark sits over the
   * corner of the sheet instead, on whichever sheet is actually up - the same
   * queue the sheets themselves are drawn in, so a thumb is never offered for
   * something standing behind something else.
   *
   * Three of them, because three of them carry writing that changes: the
   * sentence a law came out as, the line a technology arrives with, and the
   * name the place settles on for you. The fixed ones - the winter, the
   * workshops opening - say the same thing every reign.
   */
  const sealedNow = sealing
    ? [...game.laws].reverse().find((l) => l.status === 'active')
    : undefined;
  const quiet = !sealing && !showNaming && !choosingBoard && winterAhead === null;
  const marked = sealedNow
    ? { id: `seal:${sealedNow.subject}_${sealedNow.action}`, label: sealedNow.label }
    : worked && quiet
      ? { id: `tech:${worked}`, label: TECHS.find((t) => t.id === worked)?.name ?? worked }
      : named && quiet && !worked && !treeOpened
        ? { id: `epithet:${named.id}`, label: named.name }
        : null;

  const caseEvent = game.current?.kind === 'case' ? getCase(game.current.id) : undefined;
  const caseOpen = game.phase === 'case' && caseEvent !== undefined && !idling && journeyReady;

  /**
   * The ground this year is choosing between, if it is choosing at all.
   *
   * Only the year of work asks, only for a building that has never stood, and
   * only while that building is the one being considered: a peg under a ghost
   * of something else is a promise about the wrong thing.
   */
  const plotWork =
    worksOpen && picked !== null && needsPlacement(game, picked) ? picked : null;
  /* The pegs go out whenever the shelf is up and asking, the years drifting
     underneath it or not: the drift is weather, and a peg is a question. */
  const openPlots = plotWork !== null && (!idling || worksOpen) ? freePlots(game) : [];
  const plotShown = plotWork !== null && preview === plotWork ? (plot ?? plotHover) : null;
  /** What the picture is standing on, this year's undecided building included. */
  const shownPlacements =
    plotShown !== null && plotWork !== null
      ? { ...(game.placements ?? {}), [plotWork]: plotShown }
      : (game.placements ?? {});

  /**
   * Where the thing in front of you is happening.
   *
   * While the years drift there is nothing to point at: that is the point of
   * them. The mark arrives with the knock and stays through the scene it opened.
   * The year of work points at the ground a chosen building would stand on,
   * which is the one place the answer to "what does this change" lives.
   */
  /* The thread points at the ground the building is actually going on, which
     is the ground under the pointer while it is still being chosen and the
     chosen one after that. */
  const worksSpot = () => {
    const at = preview ? siteOf(preview, shownPlacements) : undefined;
    if (!at || !WORK_SITES[preview!]) return WORKS_SPOT;
    return { x: at.x + 40 * at.scale, y: at.y + 30 * at.scale };
  };
  /* The shelf opened from the corner takes the thread, except while somebody
     is knocking: the knock is the one mark on the town that is also a way
     in, and it stays where it is until it is answered. */
  const markerSpot = drifting
    ? null
    : worksOpen && !waiting
      ? worksSpot()
      : game.current?.kind === 'case' && (game.phase === 'case' || game.phase === 'aftermath')
        ? (handSpotNow ?? CASE_SPOTS[game.current.id] ?? null)
        : game.phase === 'composer' || (game.current?.kind === 'proposal' && waiting)
          ? LAW_SPOT
          : null;

  /* The card is the bench's only while somebody is actually standing on it.
     During the drift the thread runs down to a pill in the seal's colour, and
     a thread that changes colour halfway is two threads. */
  const tone: 'seal' | 'bench' = game.phase === 'case' && !idling ? 'bench' : 'seal';

  /**
   * Where the thread lands on the card, and where that is on the town.
   *
   * Both ends are worked out in the same coordinates the picture is drawn in,
   * so the thread runs from the mark to the card and not to a guess at where
   * the card might be.
   */
  const markerScreen = markerSpot ? fitToScreen(fit, markerSpot.x, markerSpot.y) : null;
  const tailX =
    anchor && markerScreen
      ? Math.max(
          TAIL_INSET,
          Math.min(anchor.width - TAIL_INSET, markerScreen.x - anchor.left),
        )
      : null;
  const tailTo =
    anchor && tailX !== null ? fitToMap(fit, anchor.left + tailX, anchor.top) : null;

  // nobody stands twice: whoever is at the door is not also out at their station
  const folk = townFolk(game, season).filter(
    (p) => !((caseOpen || hand.zoomed || journey.snapshot.visit !== null) && caseEvent?.character === p.character),
  );

  const card = (() => {
    /* While the hand is at work there is no card at all: the scene is the
       whole of the screen, and the strip under it is the only writing. */
    if (hand.busy) return null;
    /* The founding is not a card. It is the only screen in the game about a
       place that does not exist yet, and it takes the window: see the full
       screen layer below the town. */
    if (game.phase === 'intro') return null;
    /* The shelf, opened from the corner.

       It used to open itself as well, at the end of every year, over the top
       of the valley: a card of eight works, most of them unaffordable, in
       front of a player who had not asked for it. The year still waits to be
       spent (`phase === 'works'`), and the mark in the header says so with a
       slow breath and, the first time, a note; what it does not do is take
       the screen. Asked for by the user.

       One card either way, with a way out of it: the person at the door is
       still there when it closes. */
    if (worksOpen) {
      const putAway = () => {
        setPreview(null);
        setPicked(null);
        setPlot(null);
        setPlotHover(null);
        setWorksOpen(false);
      };
      return (
        <Popup tone="seal" tailX={tailX} wide tall cardRef={cardRef}>
          <Works
            key={`shelf:${game.turn}`}
            state={game}
            dev={dev}
            season={season}
            onPreview={setPreview}
            onPick={setPicked}
            plot={plot}
            onPlot={setPlot}
            onBuild={(id, where) => {
              putAway();
              finishThen({ type: 'build', id, plot: where });
            }}
            /* Only offered in the year's own turn for it (`Works` asks
               `inPhase`), and it has to actually work there: this branch is
               the only shelf there is now. */
            onReopen={(proposalId) => {
              putAway();
              dispatch({ type: 'reopen', proposalId });
            }}
            /* Put away, and on the one screen that is the shelf and nothing
               else (a dev fixture opened at a chapter) the year turns with
               it, because there would be nothing behind it to go back to. */
            onClose={() => {
              putAway();
              if (game.phase === 'works') dispatch({ type: 'advance' });
            }}
          />
        </Popup>
      );
    }
    if (journey.snapshot.errands.length || (game.phase === 'case' && !drifting && !journeyReady)) {
      return <JourneyCard state={game} control={journey} cardRef={cardRef} dev={dev} />;
    }
    if (idling) {
      /* The year of work is the one stop with no card and no door: the mark
         in the header is the whole of it, and a pill offering to open
         something is offering to open nothing. The seasons still drift over
         it; what is gone is the "go and see" at the end of the drift. */
      if (game.phase === 'works' && waiting) return null;
      return (
        <Interlude
          state={game}
          season={season}
          waiting={waiting}
          next={game.current}
          onOpen={openTheDoor}
          cardRef={cardRef}
        />
      );
    }
    if (game.phase === 'composer') {
      return (
        <Popup tone="seal" tailX={tailX} wide tall cardRef={cardRef}>
          <Composer
            state={game}
            dev={dev}
            season={season}
            onSeal={(proposalId, optionIdx, label) =>
              dispatch({ type: 'law', proposalId, optionIdx, label })
            }
          />
        </Popup>
      );
    }
    if (game.phase === 'case') {
      return (
        <Popup tone="bench" tailX={hand.tailX ?? tailX} wide cardRef={cardRef}>
          <Case
            key={visitKey}
            state={game}
            dev={dev}
            season={season}
            onChoose={(choiceId, ruling) => {
              if (!journeyReady) return;
              const text = caseEvent?.choices.find((c) => c.id === choiceId)?.text ?? '';
              if (handCaseId && hand.choose(handCaseId, choiceId, text, ruling)) return;
              dispatch({ type: 'case', choiceId, ruling });
            }}
          />
        </Popup>
      );
    }
    if (game.phase === 'aftermath' && !sealing) {
      return (
        <Popup tone="seal" tailX={hand.tailX ?? tailX} cardRef={cardRef}>
          <Aftermath
            state={game}
            dev={dev}
            onContinue={() => {
              if (hand.leave(() => dispatch({ type: 'nextInYear' }))) return;
              dispatch({ type: 'nextInYear' });
            }}
          />
        </Popup>
      );
    }
    return null;
  })();

  /**
   * The small things, and when the map is allowed to have them on it.
   *
   * They used to be taken off the picture the moment anything was being asked,
   * which meant that in the two screens a player spends the most time in - a
   * dilemma, and the year of work - the town had nothing in it at all and the
   * dog you had seen a second ago was simply gone. They stay on the map now,
   * in every screen that still shows the town. What changes is whether they
   * can be taken: while somebody is standing in front of you the ruler is not
   * free to go and lend a hand, so the thing is drawn quiet and takes no
   * click, and it is there again the moment the card closes.
   *
   * The one place they are still off is the founding, which is a screen about
   * a place that does not exist yet, and the moment ground is being picked,
   * where every gold ring on the map is already a peg.
   */
  const townIsPokeable =
    !hand.zoomed &&
    !waiting &&
    openPlots.length === 0 &&
    (idling || (game.phase !== 'case' && game.phase !== 'aftermath' && game.phase !== 'composer'));
  const momentsShown = !hand.zoomed && openPlots.length === 0 && game.phase !== 'intro';
  const pendingMoments = journey.snapshot.errands.map((e) => e.moment);
  const moments = [...(momentsShown ? momentsNow(game, season) : []), ...pendingMoments]
    .filter((moment, i, all) => all.findIndex((m) => m.id === moment.id) === i);
  /** What the last one turned out to be. The year clears it, not a timer. */
  const saidNow = said && said.turn === game.turn ? getMoment(said.id) : null;
  const saidAt = saidNow ? fitToScreen(fit, saidNow.x, saidNow.y) : null;
  /* One board, because a small thing only ever moves one. The mark says which
     and by how much, and nothing else: `MovedBoards` is the shape for weighing
     a decision, and this is not one. */
  const saidWorth = saidNow
    ? STATS.map((stat) => ({ ...stat, delta: saidNow.effect[stat.id] ?? 0 })).find((s) => s.delta !== 0)
    : undefined;
  /**
   * The small things a thumb can be left on, dev only.
   *
   * The one just done is in the list as well as the ones still out there. It
   * has to be: the map stops offering a thing the moment it is taken, and
   * taking it is the only way to find out whether it was worth writing. The
   * receipt over the spot fades in seven seconds and takes no click by design,
   * so the mark sits under it instead and stays for the rest of the year.
   */
  const markable = dev && momentsShown
    ? [...moments, ...(saidNow && !moments.some((m) => m.id === saidNow.id) ? [saidNow] : [])]
    : [];

  /**
   * What a dilemma is, said once, when the first one is on the table.
   *
   * Not one screen earlier. `caseOpen` is already the moment the walk has
   * ended, the caller is standing there and the card is up, which is the first
   * time the three sentences on this note are about something the reader can
   * see.
   *
   * On `busy` and not on `zoomed`. Most of the scenes worth teaching this on
   * have a hand scene under them, and the camera is in on one for the whole of
   * `decide`, which is to say for the whole of the reading and the choosing:
   * waiting for the wide shot meant waiting for a screen that never comes, and
   * the first cut of this note never appeared at all. `busy` is the camera
   * actually flying, or a pair of hands actually doing something, which are
   * the two frames nothing may be drawn over.
   */
  const doorNoteUp = doorNote && caseOpen && !primer && !hand.busy;

  /**
   * And the small thing, named beside the first one that is out there.
   *
   * It waits for `townIsPokeable`, which is the game's own word for "the ruler
   * is free to walk over there": a note that says you can stop for this, on a
   * screen where you cannot, teaches the wrong thing. It goes once the player
   * has set off for one, and the year it went up is the only year it is up.
   */
  /* And not over a card. `townIsPokeable` lets the shelf stand, because a
     small thing can be taken with the year of work still open; a note
     explaining what a small thing is, on top of the card asking how the year
     is spent, is a second lesson over the one being read. It waits for a frame
     with no year in front of it: the drift between cards, or a year already
     spent. */
  const noteRoom = idling || (game.phase !== 'works' && game.phase !== 'composer');
  const noteMoment =
    smallNote &&
    (smallNoteTurn === null || smallNoteTurn === game.turn) &&
    townIsPokeable &&
    noteRoom &&
    !primer &&
    !doorNoteUp &&
    journey.snapshot.errands.length === 0
      ? (momentsNow(game, season)[0] ?? null)
      : null;
  const noteAtRaw = noteMoment ? fitToScreen(fit, noteMoment.x, noteMoment.y) : null;
  /* And only while the thing it names is actually on screen.
     
     The card comes up over the near meadow and two of the four small things
     stand in it, so on the years those are dealt the tag was drawn above the
     card with its corner pointing at the paper: a note about a thing, pointing
     at a card, about something else. It waits for a year it can point at the
     thing instead. `anchor.top` is the card's own measured edge, so this
     follows a card that grew with the answer picked. */
  const noteAt =
    noteAtRaw && (anchor === null || noteAtRaw.y < anchor.top - 24) ? noteAtRaw : null;

  return (
    <div className="ruler-edition flex h-dvh w-full flex-col overflow-hidden bg-ink">
      {/* Not while the founding is open. Every dial in the header and the whole
          crown panel stood behind the glass on the one screen where there is
          nothing yet to count and nobody has been asked anything: noise on the
          first thing a player ever reads. The valley itself stays.

          The dev strip is the exception, because it is not something a player
          is ever shown: it came away with the header, which left the one
          screen with the most prose on it - the brief, four answers and the
          footnote, all of them wired for a pencil - as the one screen where
          "edit any text" could not be switched on. The dials go the same way
          for the same reason: a jump to the hamlet lands here, and a panel you
          cannot get back to is not a way out. */}
      {(game.phase !== 'intro' || dev) && (
      /* The founding is a `fixed inset-0` sheet at z-40, so on that one screen
         the strip has to be lifted over it or it is drawn and unclickable,
         which is worse than not being drawn. Nothing else is on the screen
         then: the moment cards that share this level all come later.

         And while dev mode is on it is lifted over all of them, not only that
         one. The two notes that teach the game - what the marks in the corner
         are, and what somebody at the door is - are `fixed inset-0` sheets at
         z-50, and they are the two screens in the game that are nothing but
         prose: the strip sat under both, so the switch that puts a pencil on
         a line could not be reached from the one place it was most wanted.
         Asked for by the user. A stacking context cannot be escaped from the
         inside, so it is this wrapper that moves. */
      <div
        className={`relative shrink-0 ${
          dev ? 'z-[60]' : game.phase === 'intro' ? 'z-50' : 'z-30'
        }`}
      >
        {game.phase !== 'intro' && (<>
        <TopBar
          state={game}
          season={season}
          dev={dev}
          speed={speed}
          onSpeed={changeSpeed}
          /* One at a time. All four of these are full-screen overlays at the
             same z, so opening the register over the codex left two of them
             stacked and the top one closing onto the other. */
          onCodex={() => openOnly('codex')}
          onRegister={() => openOnly('register')}
          onWorld={() => openOnly('world')}
          onTree={() => openOnly('tree')}
          onWorks={() => setWorksOpen(true)}
          onBeginAnew={() => {
            clearSave();
            setSaved(null);
            wantMusic();
            dispatch({ type: 'new', seed: freshSeed() });
          }}
        />
        {/* On a narrow window the crown lies down under the header instead of
            floating beside the town, because there is no beside. On a phone
            turned on its side there is no under either: see `journey.css`,
            which takes it away rather than spend a fifth of a 390 pixel
            window on a face. The mood it carries is on the header already. */}
        <div className="ruler-crown-strip px-3 pt-2 lg:hidden">
          <div className="rounded-lg border border-ink-line bg-ink-soft/90 px-3 py-1.5 backdrop-blur">
            <MonarchPanel state={game} variant="strip" dev={dev} />
            {!hand.zoomed && <RulerDoing control={journey} className="ruler-doing-strip" />}
          </div>
        </div>
        </>)}
        {dev && (
          <div className="mx-auto w-full max-w-3xl px-4">
            <DevBar
              state={game}
              editText={editText}
              onEditText={() => setEditText((v) => !v)}
              onTurn={(dial, delta) => dispatch({ type: 'dial', dial, delta })}
              onOpenBoard={(board) => dispatch({ type: 'openBoard', board })}
              onBeginAt={jumpTo}
              /* No `window.confirm` here on purpose: the preview pane eats it
                 and answers false, which is exactly how "Begin a reign" over
                 an existing save came to do nothing at all. The switch is
                 behind dev mode, and dev mode is not somewhere a player is. */
              onWipe={() => {
                /* The pending edits live in a module as well as in storage,
                   and the module is what the screen reads. Emptying it first
                   means `forgetEverything` is the last write, so the key does
                   not come back as an empty object a moment later. */
                clearAllDevEdits();
                clearAllDevMarks();
                forgetEverything();
                forgetTheLastReign();
                setSaved(null);
                setStaleSave(false);
                setEditText(false);
                wantMusic();
                dispatch({ type: 'new', seed: freshSeed() });
              }}
            />
          </div>
        )}
      </div>
      )}

      {/* The place itself, under the bar and down to the bottom of the window,
          with everything else floating on top of it.

          It clips with `overflow: clip`, which `journey.css` sets over the
          `overflow-hidden` here - that one stays as the fallback for a browser
          too old to know `clip`. It is not a tidying. `hidden` makes this box
          a scroll container, and a scroll container with a scaled child
          hanging four thousand pixels out of it puts that child's border box
          somewhere the camera's own arithmetic says it is not: on a phone the
          scene was drawn a hundred and fifty pixels above where every finger
          was being measured, so the hand went through the loaf and came up
          with nothing. `clip` clips without any of that, and the picture and
          the finger are back in one place. */}
      <div ref={mapRef} className="ruler-map relative min-h-0 flex-1 overflow-hidden">
      {/* the camera: the town and the scene drawn over it move together */}
      <div ref={hand.zoomRef} className="absolute inset-0 origin-top-left">
      <div className="absolute inset-0">
        <CityScape
          viewport={view.narrow ? view.viewBox : undefined}
          /* The camera in on a scene is a composition of its own, and it draws its
             own people: the walking pair standing in it would be the same person
             twice. The layer comes back when the camera pulls out. */
          journeyLayer={game.phase === 'intro' || hand.zoomed ? null : <JourneyLayer control={journey} stage={game.stage} monarch={monarchOf(game.seed).id} />}
          reservedMoments={pendingMoments.map((m) => m.id)}
          stats={game.stats}
          cityFlags={game.cityFlags}
          population={game.population}
          turn={game.turn}
          buildings={game.buildings}
          stage={game.stage}
          season={season}
          marker={hand.zoomed || journey.snapshot.visit !== null ? null : markerSpot}
          markerCharacter={caseOpen ? (caseEvent?.character ?? null) : null}
          markerWaiting={waiting}
          onMarkerClick={waiting ? openTheDoor : undefined}
          tailTo={hand.zoomed ? null : tailTo}
          tailTone={tone}
          veil={card !== null && !idling}
          placements={game.placements}
          plots={openPlots}
          plotOn={plotShown}
          onPlotPick={setPlot}
          onPlotHover={setPlotHover}
          preview={worksOpen ? preview : null}
          /* What was paid for is a frame with people at it for the whole year
             that follows, which is the year the player watches go past. */
          raising={game.turn - game.lastWorkTurn <= 1 ? game.lastWork : null}
          folk={folk}
          moments={moments}
          momentsQuiet={!townIsPokeable}
          onMomentTake={(id) => {
            if (!townIsPokeable) return;
            const moment = momentsNow(game, season).find((m) => m.id === id);
            if (moment) journey.collect({ key: `${game.seed}:${game.turn}:${id}`, turn: game.turn, moment });
          }}
        />

        {/* What the small things are, once, beside the first one out there.

            Above the receipt in the source because they can never both be up:
            the receipt is what is left after one is taken, and taking one is
            what puts the note away for good. */}
        {noteMoment && noteAt && (
          <SmallThingNote
            /* Clear of the crown, which is 150 wide against the right edge and
               is painted after the map: a note that runs under it is a note
               with its last two words missing. Half this note is 115, so the
               stop is that plus the crown plus a little air. Only where the
               crown is actually drawn, which is Tailwind's `lg` and no
               narrower: below that the column is hidden and holding the note
               off an edge that has nothing on it only moves it away from the
               thing it names. */
            left={Math.max(125, Math.min(fit.w - (fit.w >= 1024 ? 315 : 125), noteAt.x))}
            top={Math.max(140, noteAt.y - 30)}
            onShown={() => {
              markNoteSeen('smallThing');
              setSmallNoteTurn(game.turn);
            }}
          />
        )}

        {/* What came of stopping, over the spot it happened at, and then gone.

            It used to be a card three lines deep with the whole sentence in
            it, which made the smallest thing in the game the loudest thing on
            the screen: a paragraph floating on the meadow, for a minute that
            cost the reign nothing. What a player wants here is the receipt -
            the verb and the one board it moved - and the sentence is still
            there for whoever rests the pointer on it. It takes no click and
            fades on its own either way. */}
        {saidNow && saidAt && saidWorth && (
          <div
            key={`${saidNow.id}:${game.turn}`}
            className="moment-said absolute z-20 -translate-x-1/2 -translate-y-full"
            style={{ left: Math.max(70, Math.min(fit.w - 70, saidAt.x)), top: Math.max(120, saidAt.y - 26) }}
          >
            <span
              title={saidNow.line}
              className="flex items-baseline gap-2 whitespace-nowrap rounded-full border border-seal/40 bg-ink/95 px-3 py-1 shadow-lg"
            >
              <span className={`${TYPE.note} text-parchment`}>{saidNow.done}</span>
              <span className="text-[12px] leading-none" aria-hidden>
                {saidWorth.emoji}
              </span>
              <span className="text-[12px] leading-none tabular-nums text-good">
                {movePoints(saidWorth.delta)}
              </span>
              <span className="sr-only">{`${saidWorth.label}: ${movePoints(saidWorth.delta)}`}</span>
            </span>
          </div>
        )}

        {/* dev only: two thumbs beside the small thing itself, out on the
            meadow where it happened, so a run can be walked once and come out
            as a list of what was worth stopping for.

            Over the spot and not under it, which is where the receipt goes as
            well: every one of these things stands in the upper half of the
            picture and the card comes up over the lower half, so under the
            spot is behind the card about half the time. And above the card's
            level besides, because "about half the time" is not a thing a tool
            is allowed to be. */}
        {markable.map((moment) => {
          const at = fitToScreen(fit, moment.x, moment.y);
          return (
            <div
              key={`mark:${moment.id}`}
              className="absolute z-30 -translate-x-1/2"
              style={{
                left: Math.max(70, Math.min(fit.w - 70, at.x)),
                top: Math.max(90, at.y - 30),
              }}
            >
              <DevVerdict
                id={`moment:${moment.id}`}
                label={moment.label}
                turn={game.turn}
                dev={dev}
              />
            </div>
          );
        })}
      </div>
      {hand.overlay}
      </div>

      {/* Nothing in the top left corner any more. What the ruler is doing is
          one line under the crown, where the person it is about already is;
          what is left here is the dev switches, which nobody playing sees. */}
      {dev && game.phase !== 'intro' && !hand.zoomed && <div className="ruler-control-dock absolute left-4 top-3 z-20">
        <RulerDevControls control={journey} instant={instantJourneys} onInstant={() => setInstantJourneys((v) => !v)}
          onWeather={idle !== null && idle !== 'waiting' ? () => setIdle({ ...idle, step: idle.step + 1 }) : undefined} />
      </div>}

      {/* The crown, and under it what is written down. Nothing below that:
          there is no game information down there, there is the town.

          Into the corner, and narrower. It used to float twenty pixels in from
          the top right, which put a strip of meadow between it and both edges
          and made the whole column read as a thing lying on the picture. It is
          furniture, not weather: it is sewn to the corner now, with its right
          edge squared off against the window, and twenty-six pixels came off
          its width, which is the hill behind it back. */}
      {game.phase !== 'intro' && (
      <div className="pointer-events-none absolute right-0 top-0 z-20 hidden w-[150px] flex-col gap-2.5 lg:flex">
        {/* What is written down used to hang under the crown here, four
            lines of law over the hill. The Codex holds them, with the
            wording, which is the whole of what that book is for: the
            corner keeps the person and what they are doing, and whoever
            wants the law goes to the book. Asked for by the user. */}
        <div className="pointer-events-auto relative z-20">
          {/* And what you are doing while they sit up there, in one line, on
              the card rather than under it. Loose on the meadow it read as a
              caption on the grass; it belongs to the face above it, and it is
              the one line on this card that answers to a click. */}
          <MonarchPanel
            state={game}
            variant="card"
            dev={dev}
            doing={hand.zoomed ? undefined : <RulerDoing control={journey} />}
          />
        </div>
      </div>
      )}


      {/* the card, floating over the near meadow, which is what the meadow is for */}
      <div className="ruler-card-dock pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-4">
        {card}
        {hand.strip}
      </div>

      {/* The music is not part of the reign, so it does not sit in the row of
          things the reign is made of. It waits in the corner, the way the
          switch on a wall does, and is found once and never looked for again.

          In the corner of the picture, not of the window. On a phone the card
          comes up the full width and the bottom right corner of the window is
          the middle of its one button, so the volume slider sat across the
          answer; `journey.css` moves this to the top of the picture there,
          where there is nothing but sky. It also means the founding, which
          takes the whole window, is no longer read through a slider.

          Out of the way while the hand is at work either way: the strip that
          says what to do runs the width of the screen. */}
      <div
        className={`ruler-sound-dock absolute bottom-2 right-9 z-30 flex items-center gap-2 transition-opacity ${
          hand.busy ? 'pointer-events-none opacity-0' : ''
        }`}
      >
        <MusicToggle seed={game.seed} season={season} hushed={graveScene} />
      </div>
      </div>

      {/* The founding, which takes the window.

          It sits over the town rather than replacing it: the valley you are
          about to be responsible for is behind the glass while you are being
          asked what you think a good ruler is. */}
      {game.phase === 'intro' && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-ink/95 backdrop-blur-[2px]">
          <Intro
            seed={game.seed}
            dev={dev}
            onDeclare={(tag) => dispatch({ type: 'declare', tag })}
          />
        </div>
      )}

      {/* And then, before the first year is spent, what the four marks in the
          corner actually are. Not while the founding is still up: it is one
          question at a time, and the question up there is who you are. */}
      {primer && game.phase !== 'intro' && (
        <Primer
          dev={dev}
          onDone={() => {
            markWiringSeen();
            setPrimer(false);
          }}
        />
      )}

      {/* And the first time somebody is actually at the door, what that is:
          an answer that lands once, that nothing warned you about, on a bench
          your own laws have already been writing on. */}
      {doorNoteUp && (
        <DoorNote
          dev={dev}
          onDone={() => {
            markNoteSeen('door');
            setDoorNote(false);
          }}
        />
      )}

      {sealing && <SealMoment state={game} onDone={() => dispatch({ type: 'nextInYear' })} />}

      {/* The thumb on whichever sheet is up, over its corner. Above the sheet
          itself, which is at z-50 and is one big button. */}
      {dev && marked && (
        <div className="fixed left-3 top-3 z-[60] rounded-sm border border-ink-line bg-ink/95 px-1.5 py-1 shadow-lg">
          <DevVerdict id={marked.id} label={marked.label} turn={game.turn} dev={dev} wide />
        </div>
      )}

      {choosingBoard && !sealing && (
        <BoardChoice
          state={game}
          offer={offer}
          onTake={(board) => dispatch({ type: 'openBoard', board })}
        />
      )}

      {naming && !sealing && <TownNaming onName={(name) => dispatch({ type: 'nameTown', name })} />}

      {/* The frost outranks a workshop and a nickname: it is the one thing on
          this list that anybody can still do something about. */}
      {winterAhead !== null && !sealing && !showNaming && !choosingBoard && (
        <WinterWarning state={game} onDone={() => setWinterAhead(null)} />
      )}

      {worked && !sealing && !showNaming && !choosingBoard && winterAhead === null && (
        <TechMoment tech={TECHS.find((t) => t.id === worked)!} onDone={() => setWorked(null)} />
      )}

      {/* the page in the corner, said once, after everything louder than it */}
      {treeOpened && !sealing && !showNaming && !choosingBoard && !worked && winterAhead === null && (
        <TechOpened onDone={() => setTreeOpened(false)} />
      )}

      {named && !sealing && !showNaming && !choosingBoard && !worked && !treeOpened && winterAhead === null && (
        <EpithetMoment epithet={named} onDone={() => setNamed(null)} />
      )}

      {codexOpen && <Codex state={game} onClose={() => setCodexOpen(false)} />}

      {registerOpen && (
        <Register
          state={game}
          season={season}
          onGift={(character) => dispatch({ type: 'gift', character })}
          onTake={(character) => dispatch({ type: 'lover', character })}
          /* The register closes behind them: what happens next happens in the
             house, not on a page of names. */
          onVisit={(character) => {
            dispatch({ type: 'visit', character });
            setRegisterOpen(false);
            setVisiting(character);
          }}
          onClose={() => setRegisterOpen(false)}
        />
      )}

      {visiting !== null && (
        <LoverMoment state={game} character={visiting} onDone={() => setVisiting(null)} />
      )}

      {treeOpen && (
        <TechTree
          state={game}
          onFocus={(tech) => dispatch({ type: 'focus', tech })}
          onClose={() => setTreeOpen(false)}
        />
      )}

      {/* A year spent abroad is spent from in here, and then the year turns the
          way it does after any other year of work, so the map shuts behind it. */}
      {worldOpen && game.world && (
        <World
          state={game}
          onAct={(action, target) => {
            setWorldOpen(false);
            finishThen({ type: 'world', action, target });
          }}
          onClose={() => setWorldOpen(false)}
        />
      )}

      <BuildBadge />
      {!PLAYER_BUILD && <DevToggle on={dev} onToggle={() => setDev((v) => !v)} />}
      <DevEditsPanel on={dev} />
      <TextEditLayer on={dev && editText} />
    </div>
  );
}
