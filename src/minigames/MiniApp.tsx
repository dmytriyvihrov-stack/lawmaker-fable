import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CASE_SPOTS, LAW_SPOT, WORKS_SPOT } from '../content/meta';
import { HAND_INSTRUCTIONS } from '../content/hand';
import { CONFIG } from '../engine/config';
import { townFolk } from '../engine/folk';
import { chooseCase, chooseLaw, chooseWork, continueYear, reopenLaw } from '../engine/reducer';
import { getCase } from '../engine/registry';
import { isWinter, seasonOf } from '../engine/simulation';
import type { GameState, Season, WorkId } from '../engine/types';
import { CityScape } from '../ui/components/CityScape';
import { BuildBadge, DevBar, DevToggle } from '../ui/components/DevCorner';
import { DevEditsPanel } from '../ui/components/DevEditsPanel';
import { Interlude } from '../ui/components/Interlude';
import { MonarchPanel } from '../ui/components/MonarchPanel';
import { MusicToggle } from '../ui/components/MusicToggle';
import { Soundscape } from '../ui/components/Soundscape';
import { Popup } from '../ui/components/Popup';
import { SealMoment } from '../ui/components/SealMoment';
import { StandingLaws } from '../ui/components/StandingLaws';
import { TopBar } from '../ui/components/TopBar';
import { WORK_SITES, siteOf } from '../ui/components/town/sites';
import { actFor, resistOf } from '../ui/hand/acts';
import { handSpot } from '../ui/hand/spots';
import { useHand } from '../ui/hand/useHand';
import { Codex } from '../ui/overlays/Codex';
import { Register } from '../ui/overlays/Register';
import { TechTree } from '../ui/overlays/TechTree';
import { Aftermath } from '../ui/screens/Aftermath';
import { Case } from '../ui/screens/Case';
import { Composer } from '../ui/screens/Composer';
import { Works } from '../ui/screens/Works';
import { useMapFit } from '../ui/useMapFit';
import { DEV } from './content';
import {
  DEFAULT_LAWS,
  FORCED_CASES,
  LAW_CHOICES,
  fixture,
  forceCase,
  standEveryAnswer,
} from './fixture';
import type { LawPick } from './fixture';

/**
 * The bench for the hand, on a reign that never happened.
 *
 * The layer itself now lives in the game (`src/ui/hand`), and this entry is
 * what it is tried out on: the four cases that have a scene, one after
 * another, with the laws switchable so every answer of each one can be
 * reached. The game only ever shows the answers a reign has actually earned;
 * `every answer` here is the one thing that is not true of the real thing.
 */
type Idle = { step: number; span: number } | 'waiting' | null;

interface Anchor {
  left: number;
  top: number;
  width: number;
}

const WHEEL: Season[] = ['spring', 'summer', 'autumn', 'winter'];
const SPAN_YEAR = 4;
const SPAN_SAME_YEAR = 2;

export function MiniApp() {
  const [laws, setLaws] = useState<LawPick>(DEFAULT_LAWS);
  const [game, setGame] = useState<GameState>(() => fixture(FORCED_CASES[0], DEFAULT_LAWS));
  const queue = useRef<string[]>(FORCED_CASES.slice(1));
  const [idle, setIdle] = useState<Idle>(null);
  const skipDrift = useRef(false);
  const seen = useRef<{ turn: number; phase: string }>({ turn: -1, phase: '' });
  const [dev, setDev] = useState(false);
  const [everyAnswer, setEveryAnswer] = useState(true);
  const [showActs, setShowActs] = useState(false);
  const [codexOpen, setCodexOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [treeOpen, setTreeOpen] = useState(false);
  const [preview, setPreview] = useState<WorkId | null>(null);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const fit = useMapFit(mapRef);
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  const caseEvent = game.current?.kind === 'case' ? getCase(game.current.id) : undefined;
  /* The scene belongs to its case until the year moves on. */
  const handCaseId =
    caseEvent && (game.phase === 'case' || game.phase === 'aftermath') ? caseEvent.id : null;
  const handSpotNow = handCaseId ? handSpot(handCaseId, game) : null;

  /* The card is up for it: the years are not drifting and nobody is knocking. */
  const handReady = handCaseId !== null && game.phase === 'case' && idle === null;
  const hand = useHand({
    mapRef,
    fit,
    caseId: handCaseId,
    spot: handSpotNow,
    ready: handReady,
    anchor,
    tone: game.phase === 'case' && idle === null ? 'bench' : 'seal',
    onAnswer: (choiceId, ruling) =>
      setGame((g) => (g.current?.kind === 'case' ? chooseCase(g, g.current.id, choiceId, ruling) : g)),
  });

  /* where the card ended up, so the thread can land on it */
  useLayoutEffect(() => {
    const el = cardRef.current;
    const box = mapRef.current;
    if (!el || !box) {
      setAnchor((old) => (old === null ? old : null));
      return;
    }
    const write = () => {
      const r = el.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      const next = { left: r.left - b.left, top: r.top - b.top, width: r.width };
      setAnchor((old) =>
        old && old.left === next.left && old.top === next.top && old.width === next.width
          ? old
          : next,
      );
    };
    write();
    const observer = new ResizeObserver(write);
    observer.observe(el);
    window.addEventListener('resize', write);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', write);
    };
  });

  /* the years drift, and then somebody knocks: the build's own quiet */
  useEffect(() => {
    const before = seen.current;
    seen.current = { turn: game.turn, phase: game.phase };
    const waits = game.phase === 'composer' || game.phase === 'case';
    const arriving = before.phase !== game.phase || before.turn !== game.turn;
    if (!waits || !arriving) return;
    if (skipDrift.current) {
      skipDrift.current = false;
      setIdle('waiting');
      return;
    }
    setIdle({
      step: 0,
      span: before.turn >= 0 && game.turn > before.turn ? SPAN_YEAR : SPAN_SAME_YEAR,
    });
  }, [game]);

  useEffect(() => {
    if (idle === null || idle === 'waiting') return;
    const last = idle.step >= idle.span - 1;
    const id = window.setTimeout(
      () => setIdle(last ? 'waiting' : { ...idle, step: idle.step + 1 }),
      last ? CONFIG.idle.holdMs : CONFIG.idle.seasonMs,
    );
    return () => window.clearTimeout(id);
  }, [idle]);

  const openTheDoor = useCallback(() => setIdle(null), []);

  const decides =
    game.phase === 'composer' ||
    game.phase === 'case' ||
    game.phase === 'aftermath' ||
    game.phase === 'works';
  const idling = idle !== null && decides;
  const waiting = idle === 'waiting';
  const drifting = idling && !waiting;
  const caseOpen = game.phase === 'case' && caseEvent !== undefined && !idling;

  const lastLog = game.log[game.log.length - 1];
  const sealing = game.phase === 'aftermath' && lastLog?.kind === 'law';

  const settled = seasonOf(game.phase, game.turn, caseEvent?.season);
  const step = idle !== null && idle !== 'waiting' ? idle.step : 0;
  const season: Season =
    drifting && !isWinter(game.turn)
      ? WHEEL[(WHEEL.indexOf(settled) + step) % WHEEL.length]
      : settled;

  const markerSpot = drifting
    ? null
    : game.current?.kind === 'case' && (game.phase === 'case' || game.phase === 'aftermath')
      ? (handSpot(game.current.id, game) ?? CASE_SPOTS[game.current.id] ?? null)
      : game.phase === 'composer' || (game.current?.kind === 'proposal' && waiting)
        ? LAW_SPOT
        : game.phase === 'works'
          ? (() => {
              const at = preview ? siteOf(preview, game.placements) : undefined;
              if (!at || !WORK_SITES[preview!]) return WORKS_SPOT;
              return { x: at.x + 40 * at.scale, y: at.y + 30 * at.scale };
            })()
          : null;
  const tone: 'seal' | 'bench' = game.phase === 'case' && !idling ? 'bench' : 'seal';

  const folk = townFolk(game, season).filter(
    (p) => !((caseOpen || hand.zoomed) && caseEvent?.character === p.character),
  );

  /* The bench, with every answer this case has on it. The reign underneath is
     the honest one; this is only what the card and the list of laws read. */
  const bench = everyAnswer && caseEvent ? standEveryAnswer(game, caseEvent.id) : game;

  function nextForced() {
    const next = queue.current.shift();
    if (next) setGame((g) => forceCase(g, next));
    else setGame((g) => continueYear(g));
  }
  function onContinue() {
    if (hand.leave(nextForced)) return;
    nextForced();
  }
  function forceNow(id: string) {
    queue.current = FORCED_CASES.slice(FORCED_CASES.indexOf(id) + 1);
    skipDrift.current = true;
    setGame((g) => forceCase(g, id));
  }
  function resetAll(next: LawPick = laws) {
    queue.current = FORCED_CASES.slice(1);
    setLaws(next);
    setGame(fixture(FORCED_CASES[0], next));
  }

  const card = (() => {
    if (hand.busy) return null;
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
        <Popup tone="seal" cardRef={cardRef}>
          <Composer
            state={game}
            dev={dev}
            season={season}
            onSeal={(proposalId, optionIdx, label) =>
              setGame((g) => chooseLaw(g, proposalId, optionIdx, label))
            }
          />
        </Popup>
      );
    }
    if (game.phase === 'case') {
      return (
        <Popup tone="bench" tailX={hand.tailX} wide cardRef={cardRef}>
          <Case
            state={bench}
            dev={dev}
            season={season}
            onChoose={(choiceId, ruling) => {
              const text = caseEvent?.choices.find((c) => c.id === choiceId)?.text ?? '';
              if (handCaseId && hand.choose(handCaseId, choiceId, text, ruling)) return;
              setGame((g) =>
                g.current?.kind === 'case' ? chooseCase(g, g.current.id, choiceId, ruling) : g,
              );
            }}
          />
        </Popup>
      );
    }
    if (game.phase === 'aftermath' && !sealing) {
      return (
        <Popup tone="seal" tailX={hand.tailX} cardRef={cardRef}>
          <Aftermath state={game} dev={dev} onContinue={onContinue} />
        </Popup>
      );
    }
    if (game.phase === 'works') {
      return (
        <Popup tone="seal" cardRef={cardRef}>
          <Works
            state={game}
            dev={dev}
            season={season}
            onPreview={setPreview}
            plot={null}
            onPlot={() => {}}
            onBuild={(id) => {
              setPreview(null);
              setGame((g) => chooseWork(g, id));
            }}
            onReopen={(proposalId) => {
              setPreview(null);
              setGame((g) => reopenLaw(g, proposalId));
            }}
          />
        </Popup>
      );
    }
    return null;
  })();

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-ink">
      <div className="relative z-30 shrink-0">
        <TopBar
          state={game}
          season={season}
          speed={0}
          onSpeed={() => {}}
          onCodex={() => setCodexOpen(true)}
          onRegister={() => setRegisterOpen(true)}
          onTree={() => setTreeOpen(true)}
          onBeginAnew={() => window.location.reload()}
        />
        <div className="px-3 pt-2 lg:hidden">
          <div className="rounded-lg border border-ink-line bg-ink-soft/90 px-3 py-1.5 backdrop-blur">
            <MonarchPanel state={game} variant="strip" />
          </div>
        </div>
        {dev && (
          <div className="mx-auto w-full max-w-3xl px-4">
            <DevBar state={game} />
          </div>
        )}
      </div>

      <div ref={mapRef} className="relative min-h-0 flex-1 overflow-hidden">
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
              tailTo={null}
              tailTone={tone}
              veil={card !== null && !idling}
              placements={game.placements}
              preview={game.phase === 'works' ? preview : null}
              raising={game.turn - game.lastWorkTurn <= 1 ? game.lastWork : null}
              folk={folk}
            />
          </div>
          {hand.overlay}
        </div>

        <div className="pointer-events-none absolute right-5 top-[18px] z-20 hidden w-[176px] flex-col gap-4 lg:flex">
          <div className="pointer-events-auto">
            <MonarchPanel state={game} variant="card" />
          </div>
          <div className="pointer-events-auto">
            <StandingLaws state={bench} writing={game.phase === 'composer'} />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-5">
          {card}
          {hand.strip}
        </div>
      </div>

      {sealing && <SealMoment state={game} onDone={() => setGame((g) => continueYear(g))} />}

      {codexOpen && <Codex state={game} onClose={() => setCodexOpen(false)} />}
      {registerOpen && (
        <Register
          state={game}
          season={season}
          onGift={() => {}}
          onTake={() => {}}
          onClose={() => setRegisterOpen(false)}
        />
      )}
      {treeOpen && <TechTree state={game} onClose={() => setTreeOpen(false)} />}

      <div className="fixed bottom-2 right-9 z-40 flex items-center gap-2">
        <Soundscape game={game} season={season} ready={handReady} zoomed={hand.zoomed} mapRef={mapRef} />
        <MusicToggle seed={game.seed} season={season} />
      </div>

      {/* the bench's own strip: which case, which laws, what the hand can do */}
      <div className="fixed left-2 top-14 z-50 flex flex-wrap items-center gap-2 rounded-lg border border-ink-line bg-ink/85 px-2 py-1.5 text-[11px] text-parchment-dim opacity-50 transition-opacity hover:opacity-100">
        <span className="tracking-[0.15em] text-seal">{DEV.title}</span>
        {FORCED_CASES.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => forceNow(id)}
            className={`rounded border px-2 py-0.5 ${caseEvent?.id === id ? 'border-seal text-parchment' : 'border-ink-line text-parchment'}`}
          >
            {getCase(id)?.title}
          </button>
        ))}
        <button
          type="button"
          onClick={() => resetAll()}
          className="rounded border border-ink-line px-2 py-0.5 text-parchment"
        >
          {DEV.reset}
        </button>
        {(Object.keys(LAW_CHOICES) as (keyof LawPick)[]).map((subject) => (
          <label key={subject} className="flex items-center gap-1">
            <span>{DEV.law[subject]}</span>
            <select
              value={laws[subject]}
              onChange={(e) => resetAll({ ...laws, [subject]: e.target.value } as LawPick)}
              className="rounded border border-ink-line bg-ink px-1 py-0.5 text-parchment"
            >
              {LAW_CHOICES[subject].map((a) => (
                <option key={a} value={a}>
                  {a.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={everyAnswer}
            onChange={(e) => setEveryAnswer(e.target.checked)}
          />
          <span>{DEV.every}</span>
        </label>
        <button
          type="button"
          onClick={() => setShowActs((v) => !v)}
          className="rounded border border-ink-line px-2 py-0.5 text-parchment"
        >
          {DEV.acts}
        </button>
      </div>
      {showActs && (
        <div className="fixed left-2 top-24 z-50 max-h-[60vh] columns-4 gap-5 overflow-auto rounded-lg border border-ink-line bg-ink/95 px-3 py-2 text-[11px] text-parchment-dim">
          {FORCED_CASES.map((id) => (
            <div key={id} className="break-inside-avoid">
              <div className="text-parchment">{getCase(id)?.title}</div>
              {getCase(id)?.choices.map((c) => {
                const act = actFor(id, c.id);
                const push = resistOf(act);
                return (
                  <div key={c.id}>
                    <span className="text-bench">{act?.kind}</span>{' '}
                    {HAND_INSTRUCTIONS[`${id}:${c.id}`]}
                    {push && <span className="text-seal"> &middot; {DEV.resist[push]}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <BuildBadge />
      <DevToggle on={dev} onToggle={() => setDev((v) => !v)} />
      <DevEditsPanel on={dev} />
    </div>
  );
}
