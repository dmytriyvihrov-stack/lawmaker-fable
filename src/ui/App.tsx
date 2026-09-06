import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { UI } from '../content/ui-strings';
import {
  advance,
  chooseCase,
  chooseDeclared,
  chooseLaw,
  chooseWork,
  continueYear,
  giveGift,
  nameTown,
  openBoard,
  newGame,
  reopenLaw,
  takeLover,
  takeMoment,
} from '../engine/reducer';
import { freePlots, needsPlacement } from '../engine/plots';
import { getMoment, momentsNow } from '../engine/moments';
import { clearSave, loadGame, saveGame } from '../engine/save';
import type {
  GameState,
  PhilTag,
  PlotId,
  Season,
  StatId,
  TechId,
  WorkId,
} from '../engine/types';
import { CityScape } from './components/CityScape';
import { MONARCHS } from '../content/monarchs';
import { CASE_SPOTS, LAW_SPOT, WORKS_SPOT } from '../content/meta';
import { TECHS } from '../content/techs';
import { isWinter, seasonOf, yearsToWinter } from '../engine/simulation';
import { getCase } from '../engine/registry';
import { townFolk } from '../engine/folk';
import { CONFIG } from '../engine/config';
import { BuildBadge, DevBar, DevToggle } from './components/DevCorner';
import { DevEditsPanel } from './components/DevEditsPanel';
import { FolkGallery } from './dev/FolkGallery';
import { previewReign } from './previewReign';
import { Interlude } from './components/Interlude';
import { MonarchPanel } from './components/MonarchPanel';
import { Popup } from './components/Popup';
import { StandingLaws } from './components/StandingLaws';
import { TopBar } from './components/TopBar';
import { SealMoment } from './components/SealMoment';
import { TechMoment } from './components/TechMoment';
import { MusicToggle } from './components/MusicToggle';
import { Soundscape } from './components/Soundscape';
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
import { WORK_SITES, siteOf } from './components/town/sites';
import { fitToMap, fitToScreen, useMapFit } from './useMapFit';
import { useHand } from './hand/useHand';
import { handSpot } from './hand/spots';
import { Aftermath } from './screens/Aftermath';
import { Case } from './screens/Case';
import { Composer } from './screens/Composer';
import { Intro } from './screens/Intro';
import { Portrait } from './screens/Portrait';
import { Title } from './screens/Title';
import { Works } from './screens/Works';

type Action =
  | { type: 'new'; seed: number }
  | { type: 'continue'; game: GameState }
  | { type: 'declare'; tag: PhilTag }
  | { type: 'law'; proposalId: string; optionIdx: number; label: string }
  | { type: 'case'; choiceId: string; ruling?: string }
  | { type: 'nextInYear' }
  | { type: 'build'; id: WorkId; plot?: PlotId }
  | { type: 'gift'; character: string }
  | { type: 'lover'; character: string }
  | { type: 'nameTown'; name: string }
  | { type: 'openBoard'; board: StatId }
  | { type: 'reopen'; proposalId: string }
  | { type: 'moment'; id: string }
  | { type: 'advance' }
  | { type: 'reset' };

function appReducer(game: GameState | null, action: Action): GameState | null {
  if (action.type === 'new') return newGame(action.seed);
  if (action.type === 'continue') return action.game;
  if (action.type === 'reset') return null;
  if (!game) return game;

  switch (action.type) {
    case 'declare':
      return chooseDeclared(game, action.tag);
    case 'moment':
      return takeMoment(game, action.id);
    case 'law':
      return chooseLaw(game, action.proposalId, action.optionIdx, action.label);
    case 'case':
      if (game.current?.kind !== 'case') return game;
      return chooseCase(game, game.current.id, action.choiceId, action.ruling);
    case 'nextInYear':
      return continueYear(game);
    case 'build':
      return chooseWork(game, action.id, action.plot);
    case 'gift':
      return giveGift(game, action.character);
    case 'lover':
      return takeLover(game, action.character);
    case 'nameTown':
      return nameTown(game, action.name);
    case 'openBoard':
      return openBoard(game, action.board);
    case 'reopen':
      return reopenLaw(game, action.proposalId);
    case 'advance':
      return advance(game);
  }
}

function freshSeed(): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return crypto.getRandomValues(new Uint32Array(1))[0];
  }
  return 1;
}

const WHEEL: Season[] = ['spring', 'summer', 'autumn', 'winter'];

function reducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * The quiet between decisions. `span` is how many seasons drift past before
 * somebody knocks: a whole wheel when the year has turned, a couple of steps
 * when the next person is simply next in the same year.
 */
type Idle = { step: number; span: number } | 'waiting' | null;

const SPAN_YEAR = 4;
const SPAN_SAME_YEAR = 2;

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
  const [treeOpen, setTreeOpen] = useState(false);
  const [dev, setDev] = useState(false);
  const [saved, setSaved] = useState<GameState | null>(null);
  const [idle, setIdle] = useState<Idle>(null);
  /** A work being considered, so the town can show where it would stand. */
  const [preview, setPreview] = useState<WorkId | null>(null);
  /** The one this year has actually settled on, which is what the ground is for. */
  const [picked, setPicked] = useState<WorkId | null>(null);
  /** And the ground it is going on, held here because the town shares it. */
  const [plot, setPlot] = useState<PlotId | null>(null);
  /** A peg under the pointer out on the town, before anybody has committed. */
  const [plotHover, setPlotHover] = useState<PlotId | null>(null);
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
  /** The year of a long winter that somebody has come to warn you about. */
  const [winterAhead, setWinterAhead] = useState<number | null>(null);
  const knownTechs = useRef(0);
  /** undefined until the first state is seen, so a loaded save is not news. */
  const knownEpithet = useRef<string | null | undefined>(undefined);
  /** Whether the Fool has already given the one look this reign gets. */
  const epithetIntroduced = useRef(false);
  const knownWinter = useRef<number | null | undefined>(undefined);
  const seen = useRef<{ turn: number; phase: string }>({ turn: 0, phase: 'title' });

  /** The box the town fills, and the card floating over the bottom of it. */
  const mapRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  /** The small thing most recently done, and the year it was done in. */
  const [said, setSaid] = useState<{ id: string; turn: number } | null>(null);
  const fit = useMapFit(mapRef);
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  useEffect(() => {
    setSaved(loadGame());
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
      setAnchor((old) => (old === null ? old : null));
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
      setAnchor((old) =>
        old && old.left === next.left && old.top === next.top && old.width === next.width
          ? old
          : next,
      );
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
    setIdle({
      step: 0,
      span: game.turn > before.turn ? SPAN_YEAR : SPAN_SAME_YEAR,
    });
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
    if (!epithetIntroduced.current) {
      if (!first && inWindow && id !== null) {
        setNamed(earned);
        epithetIntroduced.current = true;
      }
    } else if (!first && id !== null && id !== knownEpithet.current) {
      // said again, later, only because it changed to something truer
      setNamed(earned);
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
  /* The card is up for it: the years are not drifting and nobody is knocking. */
  const handReady = handCaseId !== null && game?.phase === 'case' && idle === null;
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

  const openTheDoor = useCallback(() => setIdle(null), []);

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
          onNew={() => {
            if (saved && !window.confirm(UI.title.confirmNew)) return;
            clearSave();
            dispatch({ type: 'new', seed: freshSeed() });
          }}
          onContinue={() => saved && dispatch({ type: 'continue', game: saved })}
        />
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
            dispatch({ type: 'reset' });
          }}
        />
      </main>
    );
  }

  // a sealed decree is a sentence, not a scene: it is held, read, and done with
  const lastLog = game.log[game.log.length - 1];
  const sealing = game.phase === 'aftermath' && lastLog?.kind === 'law';

  const decides =
    game.phase === 'composer' ||
    game.phase === 'case' ||
    game.phase === 'aftermath' ||
    game.phase === 'works';
  const idling = idle !== null && decides;
  const waiting = idle === 'waiting';
  const drifting = idling && !waiting;

  /**
   * During the drift the year is only weather, carrying on from where it was.
   * Otherwise the phase says which season it is, and if the person in front of
   * you brought a season with them, that is the season: the frozen ground does
   * not arrive under a summer sun.
   */
  const sceneSeason =
    game.current?.kind === 'case' ? getCase(game.current.id)?.season : undefined;
  const settled = seasonOf(game.phase, game.turn, sceneSeason);
  const step = idle !== null && idle !== 'waiting' ? idle.step : 0;
  const season: Season =
    drifting && !isWinter(game.turn)
      ? WHEEL[(WHEEL.indexOf(settled) + step) % WHEEL.length]
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

  const caseEvent = game.current?.kind === 'case' ? getCase(game.current.id) : undefined;
  const caseOpen = game.phase === 'case' && caseEvent !== undefined && !idling;

  /**
   * The ground this year is choosing between, if it is choosing at all.
   *
   * Only the year of work asks, only for a building that has never stood, and
   * only while that building is the one being considered: a peg under a ghost
   * of something else is a promise about the wrong thing.
   */
  const plotWork =
    game.phase === 'works' && picked !== null && needsPlacement(game, picked) ? picked : null;
  const openPlots = plotWork !== null && !idling ? freePlots(game) : [];
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
  const markerSpot = drifting
    ? null
    : game.current?.kind === 'case' && (game.phase === 'case' || game.phase === 'aftermath')
      ? (CASE_SPOTS[game.current.id] ?? null)
      : game.phase === 'composer' || (game.current?.kind === 'proposal' && waiting)
        ? LAW_SPOT
        : game.phase === 'works'
          ? (() => {
              /* The thread points at the ground the building is actually going
                 on, which is the ground under the pointer while it is still
                 being chosen and the chosen one after that. */
              const at = preview ? siteOf(preview, shownPlacements) : undefined;
              if (!at || !WORK_SITES[preview!]) return WORKS_SPOT;
              return { x: at.x + 40 * at.scale, y: at.y + 30 * at.scale };
            })()
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
    (p) => !((caseOpen || hand.zoomed) && caseEvent?.character === p.character),
  );

  const card = (() => {
    /* While the hand is at work there is no card at all: the scene is the
       whole of the screen, and the strip under it is the only writing. */
    if (hand.busy) return null;
    /* The founding is not a card. It is the only screen in the game about a
       place that does not exist yet, and it takes the window: see the full
       screen layer below the town. */
    if (game.phase === 'intro') return null;
    if (idling) {
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
        <Popup tone="seal" tailX={tailX} cardRef={cardRef}>
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
            state={game}
            dev={dev}
            season={season}
            onChoose={(choiceId, ruling) => {
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
    if (game.phase === 'works') {
      return (
        <Popup tone="seal" tailX={tailX} cardRef={cardRef}>
          <Works
            state={game}
            dev={dev}
            season={season}
            onPreview={setPreview}
            onPick={setPicked}
            plot={plot}
            onPlot={setPlot}
            onBuild={(id, where) => {
              setPreview(null);
              setPicked(null);
              setPlot(null);
              setPlotHover(null);
              dispatch({ type: 'build', id, plot: where });
            }}
            onReopen={(proposalId) => {
              setPreview(null);
              setPicked(null);
              setPlot(null);
              dispatch({ type: 'reopen', proposalId });
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
   * Never while something is being asked. A dog offered to somebody halfway
   * through a dilemma is a third button on a two button question, and the same
   * goes for a law being drafted and for ground being picked.
   *
   * What is left is the year of work and the drift between seasons, which is
   * where a player actually sits and looks at the place. The card floats over
   * the near meadow and every one of these stands above it, so they are never
   * behind anything either.
   */
  const townIsPokeable =
    !hand.zoomed &&
    !waiting &&
    openPlots.length === 0 &&
    (idling || (game.phase !== 'case' && game.phase !== 'aftermath' && game.phase !== 'composer'));
  const moments = townIsPokeable ? momentsNow(game, season) : [];
  /** What the last one turned out to be. The year clears it, not a timer. */
  const saidNow = said && said.turn === game.turn ? getMoment(said.id) : null;
  const saidAt = saidNow ? fitToScreen(fit, saidNow.x, saidNow.y) : null;

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-ink">
      <div className="relative z-30 shrink-0">
        <TopBar
          state={game}
          season={season}
          dev={dev}
          speed={speed}
          onSpeed={changeSpeed}
          onCodex={() => setCodexOpen(true)}
          onRegister={() => setRegisterOpen(true)}
          onTree={() => setTreeOpen(true)}
          onBeginAnew={() => {
            clearSave();
            setSaved(null);
            dispatch({ type: 'new', seed: freshSeed() });
          }}
        />
        {/* on a narrow window the crown lies down under the header instead of
            floating beside the town, because there is no beside */}
        <div className="px-3 pt-2 lg:hidden">
          <div className="rounded-lg border border-ink-line bg-ink-soft/90 px-3 py-1.5 backdrop-blur">
            <MonarchPanel state={game} variant="strip" dev={dev} />
          </div>
        </div>
        {dev && (
          <div className="mx-auto w-full max-w-3xl px-4">
            <DevBar state={game} />
          </div>
        )}
      </div>

      {/* the place itself, under the bar and down to the bottom of the window,
          with everything else floating on top of it */}
      <div ref={mapRef} className="relative min-h-0 flex-1 overflow-hidden">
      {/* the camera: the town and the scene drawn over it move together */}
      <div ref={hand.zoomRef} className="absolute inset-0 origin-top-left">
      <div className="absolute inset-0">
        <CityScape
          stats={game.stats}
          cityFlags={game.cityFlags}
          population={game.population}
          buildings={game.buildings}
          stage={game.stage}
          season={season}
          marker={hand.zoomed ? null : markerSpot}
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
          preview={game.phase === 'works' ? preview : null}
          /* What was paid for is a frame with people at it for the whole year
             that follows, which is the year the player watches go past. */
          raising={game.turn - game.lastWorkTurn <= 1 ? game.lastWork : null}
          folk={folk}
          moments={moments}
          onMomentTake={(id) => {
            dispatch({ type: 'moment', id });
            setSaid({ id, turn: game.turn });
          }}
        />

        {/* What came of stopping, said over the spot it happened at and then
            gone. It is not a card: there is nothing to answer and nothing to
            dismiss, so it fades on its own and never takes a click. */}
        {saidNow && saidAt && (
          <div
            key={`${saidNow.id}:${game.turn}`}
            className="moment-said absolute z-20 w-[260px] -translate-x-1/2 -translate-y-full"
            style={{ left: saidAt.x, top: saidAt.y - 26 }}
          >
            <p className="rounded-lg border border-seal/40 bg-ink/95 px-3 py-2 text-[13px] leading-relaxed text-parchment shadow-lg">
              {saidNow.line}
            </p>
          </div>
        )}
      </div>
      {hand.overlay}
      </div>

      {/* the crown, and under it what is written down. Nothing below that:
          there is no game information down there, there is the town. */}
      <div className="pointer-events-none absolute right-5 top-[18px] z-20 hidden w-[176px] flex-col gap-4 lg:flex">
        <div className="pointer-events-auto">
          <MonarchPanel state={game} variant="card" dev={dev} />
        </div>
        <div className="pointer-events-auto">
          <StandingLaws state={game} writing={game.phase === 'composer'} dev={dev} />
        </div>
      </div>


      {/* the card, floating over the near meadow, which is what the meadow is for */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-5">
        {card}
        {hand.strip}
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

      {sealing && <SealMoment state={game} onDone={() => dispatch({ type: 'nextInYear' })} />}

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

      {named && !sealing && !showNaming && !choosingBoard && !worked && winterAhead === null && (
        <EpithetMoment epithet={named} onDone={() => setNamed(null)} />
      )}

      {codexOpen && <Codex state={game} onClose={() => setCodexOpen(false)} />}

      {registerOpen && (
        <Register
          state={game}
          season={season}
          onGift={(character) => dispatch({ type: 'gift', character })}
          onTake={(character) => dispatch({ type: 'lover', character })}
          onClose={() => setRegisterOpen(false)}
        />
      )}

      {treeOpen && <TechTree state={game} onClose={() => setTreeOpen(false)} />}

      {/* The music is not part of the reign, so it does not sit in the row of
          things the reign is made of. It waits in the corner, the way the
          switch on a wall does, and is found once and never looked for again. */}
      <div className="fixed bottom-2 right-9 z-40 flex items-center gap-2">
        <Soundscape game={game} season={season} ready={handReady} zoomed={hand.zoomed} mapRef={mapRef} />
        <MusicToggle seed={game.seed} season={season} />
      </div>

      <BuildBadge />
      <DevToggle on={dev} onToggle={() => setDev((v) => !v)} />
      <DevEditsPanel on={dev} />
    </div>
  );
}
