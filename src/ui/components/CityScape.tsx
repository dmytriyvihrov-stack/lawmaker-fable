import { memo } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { CityFlag, PlotId, Season, Stage, StatId, WorkId } from '../../engine/types';
import { WORKS } from '../../content/works';
import { UI } from '../../content/ui-strings';
import { STATS } from '../../content/meta';
import { movePoints } from '../../engine/format';
import { JOURNEY } from '../../content/journey';
import { FolkFigure } from './Folk';
import { folkLook } from '../../content/folk';
import type { FolkPin } from '../../engine/folk';
import { PAINT } from './town/paint';
import type { TownPaint } from './town/paint';
import { GroundWashes, MeadowDetails, River } from './town/atmosphere';
import { TownDog } from './town/parts';
import type { Moment } from '../../content/moments';
import {
  BreadBoard,
  Bridge,
  BridgeWorks,
  Bush,
  Crown,
  Fence,
  FenceWorks,
  Fields,
  Ghost,
  AppleTree,
  Goat,
  Granary,
  Hall,
  Hay,
  Hurdle,
  Hut,
  Woodcutter,
  LongRoom,
  MineMouth,
  MineWorks,
  Peg,
  Person,
  Pine,
  Raising,
  Smoke,
  Swarm,
  Tavern,
  Tent,
  Tree,
  WatchHouse,
  Well,
  Wolf,
  Worker,
} from './town/parts';
import type { Pose } from './town/parts';
import {
  CROWD_SPOTS,
  CUTTER_STANDOFF,
  FISH_SPOTS,
  HORIZON,
  HUT_SITES,
  LANE,
  MAP,
  PLOT_MARK,
  RIGHT_WOOD_SHIFT,
  ROAD_WALK,
  SMOKE_ORDER,
  SQUARE,
  WOOD_HAUL,
  WOOD_TRUNKS,
  WORK_SITES,
  homeDoor,
  siteOf,
} from './town/sites';
import type { CrowdJob } from './town/sites';
import { HORIZON_WOOD, LEFT_PINES, LEFT_WOOD, RIGHT_WOOD, RIGHT_WOOD_FLOOR } from './town/woods';
import type { Stand } from './town/woods';
import { PLACE_NAMES, PLOT_NAMES } from '../../content/meta';

interface Props {
  stats: Record<StatId, number>;
  cityFlags: CityFlag[];
  /** Souls in the place. Roofs appear as the count grows. */
  population?: number;
  /** What has been built with the years, by level. */
  buildings?: Partial<Record<WorkId, number>>;
  stage?: Stage;
  /** The weather of the year. Winter is the long one. */
  season?: Season;
  /** Where in the place the thing in front of you is happening. */
  marker?: { x: number; y: number } | null;
  /** Who is standing under the mark, so the ring has the right coat in it. */
  markerCharacter?: string | null;
  /** The marker is knocking: somebody is waiting to be heard, and can be. */
  markerWaiting?: boolean;
  onMarkerClick?: () => void;
  /** Where the popup is, so the mark can run a thread down to it. */
  tailTo?: { x: number; y: number } | null;
  /** The colour of that thread, which says what kind of thing is open. */
  tailTone?: 'seal' | 'bench';
  /**
   * A card is open over the town. The town goes a shade darker under it, so the
   * card is the thing being looked at and the place is still readable through
   * the curtain, which is all a curtain is for.
   */
  veil?: boolean;
  /** Where each building was put, when the place chose. */
  placements?: Partial<Record<WorkId, PlotId>>;
  /**
   * The ground that is open this year, drawn as pegs the player can point at.
   * Empty every year but the one where something is going up for the first
   * time: the rest of the time the ground is ground.
   */
  plots?: PlotId[];
  /** The one being considered right now, so the ghost knows where to stand. */
  plotOn?: PlotId | null;
  onPlotPick?: (plot: PlotId) => void;
  onPlotHover?: (plot: PlotId | null) => void;
  /** A work being considered, drawn where it would stand, before it is paid for. */
  preview?: WorkId | null;
  /** What is going up right now, and is therefore a frame and not a building. */
  raising?: WorkId | null;
  /**
   * The people you have met, still doing whatever you last left them doing.
   * Everybody else out there is a figure; these have names, and the picture is
   * where you find out what became of them.
   */
  folk?: FolkPin[];
  /**
   * The small things out there this year that are not decisions. They stay on
   * the picture in every screen that still shows the town, because a dog that
   * vanishes the moment a card opens was never in the place to begin with.
   */
  moments?: Moment[];
  /**
   * Somebody is at the door, so the ruler is not free to go and lend a hand.
   * The thing is still there and still says what it is; it simply does not
   * answer to a click until the card closes.
   */
  momentsQuiet?: boolean;
  onMomentTake?: (id: string) => void;
  reservedMoments?: string[];
  journeyLayer?: ReactNode;
  viewport?: string;
}

const SEAL = '#a3352c';
const BENCH = '#5c7f86';
const GLOW = '#f0e6cc';
const OUTLINE = '#7b6449';
const TIMBER = '#c3ac83';
const CLOTH_POOR = 'var(--color-cloth-poor)';
const CLOTH_WORK = 'var(--color-cloth-work)';
const CLOTH_RICH = 'var(--color-cloth-rich)';
const CLOTH = { poor: CLOTH_POOR, work: CLOTH_WORK, rich: CLOTH_RICH };

/** Dev only: ?season=autumn holds the year still, the way ?city=all does. */
function devSeason(): Season | null {
  if (!import.meta.env.DEV) return null;
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('season');
  if (raw === 'spring' || raw === 'summer' || raw === 'autumn' || raw === 'winter') return raw;
  return null;
}

/** Dev only: ?city=all or ?city=bunting,dragon_roost forces layers on. */
function devFlags(): CityFlag[] | 'all' | null {
  if (!import.meta.env.DEV) return null;
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('city');
  if (!raw) return null;
  if (raw === 'all') return 'all';
  return raw.split(',').map((s) => s.trim()) as CityFlag[];
}

function Layer({ on, children }: { on: boolean; children: ReactNode }) {
  if (!on) return null;
  return (
    <g className="city-layer" aria-hidden>
      {children}
    </g>
  );
}

/** Trees where the drawing put them, each with the kind of head it was given. */
/**
 * The wood, drawn once per season instead of once per render.
 *
 * There are 417 trees in this picture and the far bank used to be filtered out
 * of the list three times on every render of the town - three new arrays of a
 * few hundred entries each - and then every tree in all of them was rebuilt as
 * React elements. Nothing about a tree depends on anything but the season: the
 * lists are constants now, and the layers that take only `paint` are memoised,
 * so a render that changed a dial does not redraw a forest. `paint` is
 * `PAINT[season]`, one object per season, so the comparison is a reference
 * check and the memo actually holds.
 */
const RIGHT_WOOD_BACK = RIGHT_WOOD.filter((t) => t[3] < 2);
const RIGHT_WOOD_MID = RIGHT_WOOD.filter((t) => t[3] === 2);
const RIGHT_WOOD_NEAR = RIGHT_WOOD.filter((t) => t[3] === 3);

const Stands = memo(function Stands({
  paint,
  stands,
  conifer = false,
}: {
  paint: TownPaint;
  stands: Stand[];
  /** This stand is pines, which keep their shape and their needles all year. */
  conifer?: boolean;
}) {
  return (
    <g>
      {stands.map(([x, y, sc, kind], i) => {
        const rank = kind === 0 ? 'far' : kind === 1 ? 'mid' : 'near';
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${sc})`}>
            {conifer ? (
              <Pine paint={paint} rank={rank} />
            ) : kind === 3 ? (
              <Tree paint={paint} />
            ) : (
              <Crown paint={paint} rank={rank} />
            )}
          </g>
        );
      })}
    </g>
  );
});

/**
 * The place, from the fence to the far range, in one picture that fills the
 * window.
 *
 * Everything the reign has done to it is in here rather than in a list beside
 * it: the roofs are the count of souls, the buildings are the years that were
 * spent, the field is the season, and the people standing about are the people
 * you have actually met, doing what your rulings left them doing.
 */
export function CityScape({
  stats,
  cityFlags,
  population = 5,
  buildings = {},
  stage = 'village',
  season: seasonIn = 'summer',
  marker = null,
  markerCharacter = null,
  markerWaiting = false,
  onMarkerClick,
  tailTo = null,
  tailTone = 'seal',
  veil = false,
  placements = {},
  plots = [],
  plotOn = null,
  onPlotPick,
  moments = [],
  momentsQuiet = false,
  onMomentTake,
  reservedMoments = [],
  journeyLayer,
  viewport,
  onPlotHover,
  preview = null,
  raising = null,
  folk = [],
}: Props) {
  const forced = devFlags();
  const on = (f: CityFlag): boolean => {
    if (forced === 'all') return true;
    if (forced) return forced.includes(f);
    return cityFlags.includes(f);
  };

  const season = devSeason() ?? seasonIn;
  const paint = PAINT[season];
  const level = (id: WorkId): number => buildings[id] ?? 0;
  // a kingdom is drawn as the town it grew out of: nothing about the picture
  // changes the year the crown arrives, because nothing about the place does
  const town = stage !== 'village';

  /**
   * One roof is one household, up to a lane's worth of them. A place of five
   * has a hut and a fire in it; a place of a hundred and fifty has the whole
   * of the list, and after that the roofs stop and the street fills up
   * instead, because a crowd is what a town looks like from up here.
   */
  /* Roofs come with the count, and with the years spent on putting one up:
     a house is the one work whose whole point is that there is one more of
     them, so every floor of it is another roof standing here. */
  const huts = Math.max(
    1,
    Math.min(HUT_SITES.length, 1 + level('house') + Math.floor((population - 5) / 12)),
  );

  /**
   * One figure is one person while a person can still be picked out.
   *
   * Up to a lane's worth of souls the picture counts heads exactly: five souls
   * are five figures, and the year a sixth arrives you can see the sixth
   * standing there. Past that nobody is counting anyway, so two souls start
   * sharing a figure and the street goes on filling at half speed instead of
   * turning into a carpet of dots.
   */
  const COUNTED = 15;
  const dots = Math.max(
    1,
    Math.min(
      84,
      population <= COUNTED ? population : COUNTED + Math.ceil((population - COUNTED) / 2),
    ),
  );

  const mood = stats.mood;
  const spirit =
    season === 'winter' ? 'low' : !town ? 'mid' : mood <= 30 ? 'low' : mood <= 70 ? 'mid' : 'high';
  const pace = spirit === 'high' ? 9 : spirit === 'mid' ? 14 : 22;

  /**
   * Who is out there and what they have on. In a place of five everybody
   * works: there is nobody to be poor next to and nothing to be rich on, and
   * both of those are things a crowd invents. After that a thin year puts more
   * people in grey and takes the gold coats off the street.
   */
  const poorShare =
    population < 30 ? 0 : Math.max(0.05, Math.min(0.55, (70 - stats.economy) / 100));
  const richShare =
    population < 60 ? 0 : Math.max(0.03, Math.min(0.2, (stats.economy - 40) / 220));

  const working = paint.crop !== 'bare';
  const fieldLevel = level('fields');
  const roadLevel = level('road');
  /**
   * The road as it stands to be looked at this year, which is not always the
   * road that has been paid for. The store is charged the moment the year is
   * spent, so the level climbs a year before the cart can use it: while the
   * line is still being pegged out, what is drawn is last year's road.
   */
  const shownRoad = raising === "road" ? roadLevel - 1 : roadLevel;
  const wellLevel = level('well');
  const raisingOf = raising ?? null;

  /**
   * What work there is to be at this year, which is the whole rule for what
   * everybody out there is doing.
   *
   * Nobody in this place is milling about. A year is furrows to sow and then
   * to cut, a wood to fell and carry home, a line in the river, a road to be
   * on under a load, yards to sweep and a square to argue in, and which of
   * those exist depends on what the reign has actually built: with no fields
   * nobody is in the furrows, with no road nobody is on it, and with a frame
   * standing on a site there are people at the frame. The cold is the one
   * season with a single answer, and the answer is indoors, so the furrows
   * empty and the yards fill.
   *
   * The list is taken in passes rather than in blocks, so a hamlet of five has
   * one soul at each of five jobs instead of three of them at the same tree.
   */
  const wanted: [CrowdJob, number][] = [];
  const post = (job: CrowdJob, n: number) => {
    if (n > 0) wanted.push([job, n]);
  };
  if (working) {
    if (fieldLevel > 0) post('field', 5 + fieldLevel * 2);
    /* A square is a thing a town has. Before there is one, the people posted
       here were standing in open grass in the middle of the valley, which is
       what "these people are doing something unclear" looks like from the
       other side of the screen. In a hamlet they are on the lane instead,
       which is a real line between real doors, and there are fewer of them. */
    post('square', town ? 5 : 2);
    post('wood', 3);
    post('yard', town ? 3 : 2);
    // somebody is always with the animals, and the animals are always there
    post('pen', 2);
    // nobody stands at a river that is a lid
    if (!paint.ice) post('fish', 2);
    post('haul', 2);
    if (roadLevel > 0) post('road', 2 + roadLevel);
    if (wellLevel > 0) post('water', 2);
  } else {
    post('yard', 5);
    post('square', 3);
    post('wood', 2);
    post('haul', 1);
  }
  if (raisingOf && WORK_SITES[raisingOf]) post('site', 4);

  /**
   * The jobs that are a walk from the door.
   *
   * A rod, an axe and a hammer used to stand where they were used, all day,
   * as if the bank and the trees and the frame had grown the people on them.
   * These three now come out of a hut, cross the ground, do the work, and walk
   * home: the walk is most of what a day of that work looks like from up here,
   * and a building site with nobody arriving at it is a building putting
   * itself up.
   */
  const COMMUTES: CrowdJob[] = ['fish', 'wood', 'site'];

  /**
   * Taking them in flat passes gave every job the same first man, so a place
   * with nine furrows to work and three yards to sweep put the same three
   * souls in each. Each job's slots are spread evenly over the same stretch
   * instead, and the whole lot sorted: a hamlet of five still has five
   * different jobs, and a town of two hundred has the field full.
   */
  const roster: CrowdJob[] = wanted
    .flatMap(([job, n], order) =>
      Array.from({ length: n }, (_, k) => ({ job, at: (k + 0.5) / n, order })),
    )
    .sort((a, b) => a.at - b.at || a.order - b.order)
    .map((slot) => slot.job);

  /**
   * One pose per job, and whether it is a job you walk at or stand and do.
   *
   * The field is the one job that changes with the year, and it is the whole
   * reason the field is worth looking at twice: the same hands that walked the
   * furrows scattering seed in the spring are bent over a sickle in them in
   * the autumn, and one of them is carrying it off.
   */
  const fieldPose = (i: number): Pose => {
    if (season === 'spring') return i % 3 === 0 ? 'dig' : 'sow';
    if (season === 'autumn') return i % 4 === 0 ? 'carry' : 'reap';
    return 'tend';
  };
  const POSE: Record<CrowdJob, Pose> = {
    field: 'sow',
    pen: 'tend',
    wood: 'chop',
    haul: 'haul',
    fish: 'fish',
    road: 'carry',
    square: 'stand',
    yard: 'tend',
    water: 'draw',
    site: 'build',
  };
  const TRAVELS: CrowdJob[] = ['road', 'square', 'yard'];

  const siteAnchor = raisingOf ? siteOf(raisingOf, placements) : undefined;

  /**
   * How many of this job have already been placed.
   *
   * Some of these jobs are a short list of named spots rather than a patch to
   * scatter over, and indexing that list by the number of the *person* put the
   * fourth and the twelfth soul on the same rock with the same rod. What the
   * list wants is the number of the fisherman.
   */
  const placed: Partial<Record<CrowdJob, number>> = {};

  const crowd = Array.from({ length: dots }, (_, i) => {
    const roll = ((i * 37) % 100) / 100;
    const cloth = roll < poorShare ? CLOTH_POOR : roll > 1 - richShare ? CLOTH_RICH : CLOTH_WORK;
    const job = roster[i % roster.length];
    const nth = placed[job] ?? 0;
    placed[job] = nth + 1;
    const box = CROWD_SPOTS[job];

    let x: number;
    let y: number;
    if (job === 'road') {
      const step = ROAD_WALK[nth % ROAD_WALK.length];
      x = step.x + ((i * 11) % 22) - 11;
      y = step.y + ((i * 7) % 16) - 8;
    } else if (job === 'fish') {
      /* A bank is a line, not a patch, and a man with a rod is standing on
         the one spot of it where the water is deep enough to be worth it. */
      const seat = FISH_SPOTS[nth % FISH_SPOTS.length];
      // a fourth rod on a three rod river stands a little further along it
      const lap = Math.floor(nth / FISH_SPOTS.length);
      x = seat.x - lap * 16;
      y = seat.y + lap * 7;
    } else if (job === 'haul') {
      x = WOOD_HAUL.x + ((nth * 19) % 26) - 13;
      y = WOOD_HAUL.y + ((nth * 23) % 18) - 9;
    } else if (job === 'wood') {
      /* A cutter is at a tree: the foot of one of the front rank trunks,
         standing off it by a body's width so the swing crosses the wood. A
         sixth cutter on a five trunk edge takes the next tree back. */
      const trunk = WOOD_TRUNKS[nth % WOOD_TRUNKS.length];
      const lap = Math.floor(nth / WOOD_TRUNKS.length);
      x = trunk.x - CUTTER_STANDOFF - lap * 14;
      y = trunk.y + 2 + lap * 6;
    } else if (job === 'site' && siteAnchor) {
      x = siteAnchor.x + 8 + ((i * 23) % 70);
      y = siteAnchor.y + 46 + ((i * 13) % 22);
    } else if (job === 'square' && (!working || !town)) {
      const lane = LANE[nth % LANE.length];
      x = lane.x + ((i * 23) % 60) - 30;
      y = lane.y + ((i * 17) % 26) - 13;
    } else {
      // the furrows only fill as far as they have been broken
      const h = job === 'field' && fieldLevel < 2 ? 74 : box.h;
      x = box.x + ((nth * 53 + (i % 3) * 17) % box.w);
      y = box.y + ((nth * 71 + (i % 5) * 11) % h);
    }

    const travels = TRAVELS.includes(job);
    const commutes = COMMUTES.includes(job);
    /* The door this one leaves by. Their number picks the hut, so the same
       soul comes out of the same house every year, and a hamlet of one roof
       sends everybody out of it. */
    const door = commutes ? homeDoor(i, huts) : null;
    return {
      x: Math.round(x),
      y: Math.round(y),
      cloth,
      job,
      pose: job === 'field' ? fieldPose(nth) : POSE[job],
      travels,
      span: travels ? (job === 'road' ? 44 : 18) : 0,
      /* A load off the wood is a walk of its own length and takes as long as
         it takes; a day that starts at a door is a long loop of out, work and
         home; everything else is a stroll or a stoop. */
      dur:
        job === 'haul'
          ? `${pace * 1.7 + ((i * 5) % 7)}s`
          : commutes
            ? `${46 + ((i * 7) % 19)}s`
            : travels
              ? `${pace + ((i * 7) % 9)}s`
              : `${2.4 + ((i * 5) % 7) * 0.3}s`,
      /* The commuters are spread round the whole day, so at any moment one is
         on the way out, two are at it and one is walking home. */
      delay: commutes ? `-${(i * 13.7) % 46}s` : `-${(i * 1.7) % 9}s`,
      /* The small nod of somebody working, on its own short clock. */
      toilDur: `${2.4 + ((i * 5) % 7) * 0.3}s`,
      /* A hut is four metres and a person is under two, so a figure a fifth
         of a roof high was never the scale: it was as small as a mark could be
         drawn. It has to carry a tool now, and a tool on a twelve unit body is
         two pixels of it, so everybody grew by about a fifth. */
      scale: 1.05 + ((i * 11) % 4) / 10,
      /* Everybody else can face either way. A rod cast onto the grass is
         not a man fishing, so the bank always faces the water, and an axe
         swung at the air beside a tree is not a man cutting it, so a cutter
         always faces the trunk on their right. */
      facing: ((job === 'fish' || job === 'wood' ? 1 : (i * 13) % 2 === 0 ? 1 : -1) as 1 | -1),
      door,
      /* What is carried on the way out: timber to a site, nothing to a bank. */
      walkOut: (job === 'site' ? 'carry' : 'stand') as Pose,
    };
  });
  /**
   * Everything that stands on the ground, drawn back to front.
   *
   * A granary in front of a hall that is further down the picture is a granary
   * hanging in the air, so nothing here is placed by hand: each standing thing
   * says where its feet are, and the list is sorted on that.
   */
  const standing: { y: number; key: string; node: ReactNode }[] = [];
  const put = (key: string, y: number, node: ReactNode) => {
    standing.push({ key, y, node });
  };

  const ghostOf = preview ?? null;
  const nameOf = (id: WorkId) => WORKS.find((w) => w.id === id)?.name ?? '';

  /**
   * Where everything stands as far as this picture is concerned: what has
   * actually been put down, plus the one thing the year of work is currently
   * pointing at, standing on the ground under the pointer. That is the whole
   * of what makes choosing ground a decision rather than a form: the ghost
   * moves to the plot you are considering, in the place you are considering.
   */
  const shown =
    ghostOf !== null && plotOn !== null ? { ...placements, [ghostOf]: plotOn } : placements;

  /** A work that stands, is being raised this year, or is only being thought of. */
  const workNode = (id: WorkId, drawn: (lvl: number) => ReactNode, outline: ReactNode) => {
    const s = siteOf(id, shown);
    if (!s) return;
    const lvl = level(id);
    const isRaising = raisingOf === id;
    const isGhost = ghostOf === id && !isRaising;
    if (lvl === 0 && !isRaising && !isGhost) return;
    put(
      id,
      s.y + 60,
      <g className="town-landmark" tabIndex={isGhost || isRaising ? undefined : 0} role="img" aria-label={nameOf(id)} transform={`translate(${s.x} ${s.y}) scale(${s.scale})`}>
        <title>{nameOf(id)}</title>
        {!isGhost && <text className="landmark-name" pointerEvents="none" x={s.label.x} y={s.label.y} textAnchor="middle" fontSize="16" fill={GLOW}>{PLACE_NAMES[id] ?? nameOf(id)}</text>}
        {/* What was paid for last year is not standing yet: it is courses of
            wall climbing out of the ground inside a frame, and the level it is
            climbing to is the one being paid for. */}
        {isRaising ? (
          <Raising paint={paint} id={id} frame={s.frame}>
            {drawn(Math.max(1, lvl))}
          </Raising>
        ) : (
          lvl > 0 && drawn(lvl)
        )}
        {isGhost && (
          <>
            <Ghost>{outline}</Ghost>
            <text
              x={s.label.x}
              y={s.label.y}
              fontSize="16"
              fill={GLOW}
              opacity="0.75"
              textAnchor="middle"
            >
              {nameOf(id)}
            </text>
          </>
        )}
      </g>,
    );
  };

  // the roofs people live under, which is the count of souls made of wood
  HUT_SITES.slice(0, huts).forEach((h, i) => {
    put(
      `hut${i}`,
      h.y + 55 * h.scale,
      <g transform={`translate(${h.x} ${h.y}) scale(${h.scale})`}>
        <Hut paint={paint} kind={h.kind} />
        {on('graves_in_the_yards') && i < 3 && (
          <g transform="translate(72 46)">
            <path d="M-5 8 v-11 q5 -5 10 0 V8 z" fill="#c2b9ab" stroke="#8a8072" strokeWidth="1" />
          </g>
        )}
      </g>,
    );
    if (SMOKE_ORDER.slice(0, paint.smoke).includes(i)) {
      put(
        `smoke${i}`,
        h.y + 56 * h.scale,
        <g transform={`translate(${h.x + 44 * h.scale} ${h.y - 2})`}>
          <Smoke delay={`-${i * 1.4}s`} />
          <g transform="translate(0 -10)">
            <Smoke delay={`-${i * 1.4 + 2.3}s`} />
          </g>
        </g>,
      );
    }
  });

  workNode('watch_house', (l) => <WatchHouse paint={paint} level={l} />, [
    <path key="r" d="M5 0 h50 l7 24 h-64 z" />,
    <rect key="w" x="-2" y="24" width="64" height="30" rx="2" />,
  ]);
  workNode('long_room', (l) => <LongRoom paint={paint} level={l} />, [
    <path key="r" d="M6 0 h120 l8 22 h-136 z" />,
    <rect key="w" x="-2" y="22" width="136" height="26" rx="2" />,
  ]);
  workNode('woodcutter', (l) => <Woodcutter paint={paint} level={l} />, [
    <path key="r" d="M4 8 h48 l10 14 h-68 z" />,
    <rect key="w" x="-6" y="22" width="68" height="20" rx="2" />,
  ]);
  /* The house's own outline. What it actually leaves standing is a roof in the
     hut cluster (see `huts` above), so this is the ghost of the first one
     while the year is still being thought about. */
  workNode('house', () => null, [
    <path key="r" d="M2 6 h42 l8 14 h-58 z" />,
    <rect key="w" x="-6" y="20" width="58" height="20" rx="2" />,
  ]);
  workNode('granary', (l) => <Granary paint={paint} level={l} />, [
    <path key="r" d="M8 0 h100 l8 26 h-120 z" />,
    <rect key="w" x="-4" y="26" width="120" height="34" rx="2" />,
  ]);
  workNode('hall', (l) => <Hall paint={paint} level={l} />, [
    <path key="r" d="M8 0 h116 l12 28 h-140 z" />,
    <rect key="w" x="-4" y="28" width="140" height="36" rx="2" />,
  ]);
  /**
   * Somewhere to drink. Not a work and never was: nobody votes a year of the
   * reign into a public house, it simply appears the year there are enough
   * people to fill one, the way the square does. It is here so the law that
   * shuts it has something to shut: the flag used to board up the long room,
   * which is the infirmary, and crossing the sick beds was not the joke
   * anybody wrote.
   */
  if (population >= 18) {
    put(
      'tavern',
      312,
      <g transform="translate(910 256)">
        <Tavern paint={paint} shuttered={on('tavern_shuttered')} />
      </g>,
    );
  }

  workNode('well', (l) => <Well paint={paint} level={l} />, [
    <ellipse key="o" rx="17" ry="8" />,
    <path key="b" d="M-19 0 v-24 M14 0 v-24 M-24 -26 h48" />,
  ]);

  /**
   * The eaves whatever has moved in is hanging off. The long room is the one
   * building in the place that is all roof, so it gets it the year it stands;
   * before that the oldest hut is the biggest thing there is.
   */
  const roostAt =
    level('long_room') > 0
      ? "translate(1028 266) scale(0.62)"
      : "translate(838 398) scale(0.62)";

  const folkPins = folk.filter((p) => p.doing !== 'gone');

  return (
    <svg
      viewBox={viewport ?? `0 0 ${MAP.w} ${MAP.h}`}
      /* When the window is shorter than the picture, it is the sky that goes,
         never the ground: the card sits on the near meadow and the settlement
         has to stay above it, so the picture hangs from the bottom edge. */
      preserveAspectRatio={viewport ? 'none' : 'xMidYMax slice'}
      className="city-world block h-full w-full"
      role={plots.length > 0 || onMarkerClick || moments.length > 0 ? 'group' : 'img'}
      aria-label={UI.city.label}
    >
      <defs>
        <linearGradient id="ruler-ground-tail" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={paint.groundLow} stopOpacity="0" />
          <stop offset="1" stopColor={paint.groundLow} />
        </linearGradient>
        <filter id="wood-soft-edge" x="-10%" y="-25%" width="120%" height="150%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <radialGradient id="sun-halo">
          <stop stopColor={paint.sun?.tint ?? '#eef2e9'} stopOpacity=".38" />
          <stop offset=".38" stopColor={paint.sun?.tint ?? '#eef2e9'} stopOpacity=".15" />
          <stop offset="1" stopColor={paint.sun?.tint ?? '#eef2e9'} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={paint.skyTop} className="city-tint" />
          <stop offset=".55" stopColor={paint.skyMid} className="city-tint" />
          <stop offset="1" stopColor={paint.skyLow} className="city-tint" />
        </linearGradient>
        <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={paint.haze} stopOpacity="0" />
          <stop offset="1" stopColor={paint.haze} stopOpacity={paint.hazeOpacity} />
        </linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={paint.groundTop} className="city-tint" />
          <stop offset=".55" stopColor={paint.groundMid} className="city-tint" />
          <stop offset="1" stopColor={paint.groundLow} className="city-tint" />
        </linearGradient>
        <pattern id="rows" width="20" height="12" patternUnits="userSpaceOnUse">
          <rect width="20" height="12" fill={paint.fieldRow} />
          <rect width="20" height="2.5" fill={paint.fieldSoil} />
        </pattern>
        {/* The flowers on the meadow.
            Seven dots in a 76 by 54 tile is a grid at any distance a player
            actually looks from, and the near meadow is the widest flat thing
            on the screen, so it read as wallpaper: the same handful of dots,
            nineteen times across. Two tiles now, one big and one small and
            turned seventeen degrees off it, both scattered rather than spaced.
            Their repeats are coprime and out of alignment, so what a meadow
            wide of it comes to is 233 by 167 of dots that never line up. */}
        <pattern id="flowers" width="233" height="167" patternUnits="userSpaceOnUse">
          <circle cx="21.8" cy="12.9" r="1.63" fill="#e3aab0" opacity="0.9" />
          <circle cx="52.8" cy="7" r="1.89" fill="#ecd188" opacity="0.87" />
          <circle cx="100.5" cy="22.9" r="2.42" fill="#e3aab0" opacity="0.67" />
          <circle cx="171.8" cy="26.4" r="2.5" fill="#f3ecd2" opacity="0.79" />
          <circle cx="6" cy="60.6" r="2.44" fill="#f3ecd2" opacity="0.68" />
          <circle cx="62.4" cy="55.8" r="1.71" fill="#e3aab0" opacity="0.72" />
          <circle cx="141.6" cy="59.8" r="2.15" fill="#e3aab0" opacity="0.79" />
          <circle cx="167.2" cy="42.1" r="2.15" fill="#f3ecd2" opacity="0.79" />
          <circle cx="219.5" cy="46.4" r="1.83" fill="#e3aab0" opacity="0.67" />
          <circle cx="63.7" cy="79.2" r="2.26" fill="#ecd188" opacity="0.78" />
          <circle cx="91.8" cy="86.7" r="2.3" fill="#f3ecd2" opacity="0.66" />
          <circle cx="161.6" cy="76.9" r="2.48" fill="#e3aab0" opacity="0.76" />
          <circle cx="218.1" cy="90.2" r="1.68" fill="#e3aab0" opacity="0.83" />
          <circle cx="22.7" cy="105.2" r="1.8" fill="#f3ecd2" opacity="0.67" />
          <circle cx="95.2" cy="127" r="2.42" fill="#ecd188" opacity="0.86" />
          <circle cx="147" cy="113.8" r="2.28" fill="#ecd188" opacity="0.83" />
          <circle cx="165.3" cy="108.7" r="1.58" fill="#e3aab0" opacity="0.83" />
          <circle cx="226.7" cy="116" r="1.95" fill="#ecd188" opacity="0.78" />
          <circle cx="12.9" cy="138.3" r="1.98" fill="#e3aab0" opacity="0.87" />
          <circle cx="44.6" cy="138.4" r="2.49" fill="#e3aab0" opacity="0.88" />
          <circle cx="105.5" cy="152" r="2.1" fill="#f3ecd2" opacity="0.66" />
          <circle cx="163.7" cy="153" r="1.81" fill="#ecd188" opacity="0.83" />
          <circle cx="223.8" cy="141.2" r="1.99" fill="#ecd188" opacity="0.87" />
        </pattern>
        <pattern
          id="flowers-fine"
          width="149"
          height="113"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(17)"
        >
          <circle cx="63.9" cy="11.2" r="1.99" fill="#f3ecd2" opacity="0.81" />
          <circle cx="95.1" cy="6.6" r="1.34" fill="#f3ecd2" opacity="0.62" />
          <circle cx="44.4" cy="33.9" r="1.57" fill="#e3aab0" opacity="0.64" />
          <circle cx="90" cy="33.2" r="1.33" fill="#f3ecd2" opacity="0.81" />
          <circle cx="134.4" cy="51" r="1.94" fill="#e3aab0" opacity="0.65" />
          <circle cx="20.8" cy="72.1" r="1.58" fill="#e3aab0" opacity="0.9" />
          <circle cx="43.9" cy="77.7" r="1.52" fill="#f3ecd2" opacity="0.67" />
          <circle cx="83.3" cy="77.7" r="1.44" fill="#f3ecd2" opacity="0.87" />
          <circle cx="119.9" cy="67.7" r="1.5" fill="#f3ecd2" opacity="0.73" />
          <circle cx="13.4" cy="89.6" r="1.95" fill="#ecd188" opacity="0.87" />
          <circle cx="102.6" cy="108.9" r="1.64" fill="#e3aab0" opacity="0.62" />
          <circle cx="117.1" cy="91" r="1.54" fill="#ecd188" opacity="0.74" />
        </pattern>
      </defs>

      <rect width={MAP.w} height={MAP.h} fill="url(#sky)" />

      {/* the light of the day, on open sky at the left, where the sketch put it */}
      {paint.sun && (
        <g transform={`translate(${paint.sun.x} ${paint.sun.y})`}>
          <circle r={paint.sun.r * 4.8} fill="url(#sun-halo)" />
          <circle
            r={paint.sun.r * 1.9}
            fill="url(#sun-halo)"
            className="city-sun-glow"
          />
          <g
            className="city-sun-rays"
            stroke={paint.sun.tint}
            strokeWidth="2"
            opacity=".26"
            strokeLinecap="round"
          >
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i * Math.PI) / 4;
              const r0 = paint.sun!.r * 1.4;
              const r1 = paint.sun!.r * 1.75;
              return (
                <line
                  key={i}
                  x1={(Math.cos(a) * r0).toFixed(1)}
                  y1={(Math.sin(a) * r0).toFixed(1)}
                  x2={(Math.cos(a) * r1).toFixed(1)}
                  y2={(Math.sin(a) * r1).toFixed(1)}
                />
              );
            })}
          </g>
          <circle r={paint.sun.r} fill={paint.sun.tint} />
          <circle r={paint.sun.r} fill={paint.sun.warm} opacity=".45" />
          <circle r={paint.sun.r * 0.76} fill="#fcf5e6" opacity=".55" />
        </g>
      )}

      {paint.moon && (
        <g transform={`translate(${paint.moon.x} ${paint.moon.y})`}>
          <circle r={paint.moon.r * 3} fill="#dbe6ea" opacity=".07" />
          <circle r={paint.moon.r} fill="#e6eef0" opacity=".9" />
          <circle
            cx={paint.moon.r * 0.42}
            r={paint.moon.r * 0.92}
            fill={paint.skyTop}
            opacity=".55"
          />
        </g>
      )}

      {paint.stars > 0 && (
        <g fill="#eef3f4">
          {Array.from({ length: paint.stars }, (_, i) => (
            <circle
              key={i}
              className="city-star"
              cx={(i * 137) % MAP.w}
              cy={20 + ((i * 53) % 150)}
              r={0.9 + ((i * 7) % 3) * 0.4}
              style={{ animationDelay: `-${(i * 0.7) % 5}s` } as CSSProperties}
            />
          ))}
        </g>
      )}

      {/* cloud, because five sixths of this picture is sky */}
      <g fill={paint.cloudTint} opacity={paint.cloudOpacity}>
        {Array.from({ length: paint.clouds }, (_, i) => {
          const x = 240 + ((i * 331) % 1000);
          const y = 62 + ((i * 47) % 90);
          const s = 0.7 + ((i * 13) % 8) / 10;
          return (
            <g
              key={i}
              className="city-drift"
              style={
                {
                  animationDuration: `${180 + i * 40}s`,
                  animationDelay: `-${i * 26}s`,
                } as CSSProperties
              }
            >
              <g transform={`translate(${x} ${y}) scale(${s})`}>
                <ellipse rx="50" ry="12" />
                <ellipse cx="28" cy="-11" rx="32" ry="15" />
                <ellipse cx="-28" cy="-7" rx="25" ry="11" />
              </g>
            </g>
          );
        })}
      </g>

      {/* and what crosses it twice a year */}
      {paint.birds > 0 && <Birds n={paint.birds} tint={paint.crownNear} />}

      {/* the range, over on the right where it stands back from the town */}
      <g className="city-tint">
        <path
          d="M700 200 L830 100 L906 134 L1010 74 L1112 132 L1194 104 L1300 68 L1400 130 L1440 158 L1440 200 Z"
          fill={paint.rockLit}
        />
        <path
          d="M1010 74 L1112 132 L1194 104 L1300 68 L1400 130 L1440 158 L1440 200 L1122 200 Z"
          fill={paint.rockDim}
          opacity=".85"
        />
        <g fill="#f1f5f2" opacity={0.5 + paint.snowLine * 0.5}>
          <path
            d={`M995 ${93 + paint.snowLine * 30} L1010 74 L1026 ${
              95 + paint.snowLine * 30
            } L1015 90 L1005 97 Z`}
          />
          <path
            d={`M1287 ${88 + paint.snowLine * 30} L1300 68 L1314 ${
              90 + paint.snowLine * 30
            } L1304 86 L1295 92 Z`}
          />
          <path
            d={`M819 ${116 + paint.snowLine * 26} L830 100 L842 ${
              118 + paint.snowLine * 26
            } L833 114 L826 120 Z`}
          />
        </g>
      </g>
      <rect y="150" width={MAP.w} height="56" fill="url(#haze)" />

      {/* the hills a morning's walk out, and then the country itself */}
      <path
        d="M0 200 Q 210 166 440 194 T 880 196 T 1250 182 L1440 192 L1440 258 L0 258 Z"
        fill={paint.hills}
        className="city-tint"
      />
      <rect y="194" width={MAP.w} height="626" fill="url(#ground)" />
      {viewport && <rect y="820" width={MAP.w} height="3000" fill={paint.groundLow} />}
      <GroundWashes paint={paint} />

      {/* the belt of wood along the whole horizon, and the two woods that come
          in: six ranks on the right that overlap, over a shaded floor, with
          trunks only in the front rank where they can be seen */}
      <g opacity=".95">
        <Stands paint={paint} stands={HORIZON_WOOD} />
      </g>
      <g transform={`translate(${RIGHT_WOOD_SHIFT.x} ${RIGHT_WOOD_SHIFT.y})`}>
        <Stands paint={paint} stands={RIGHT_WOOD_BACK} />
        <path d={RIGHT_WOOD_FLOOR} fill={paint.woodFloor} opacity=".6" className="city-tint" filter="url(#wood-soft-edge)" />
        {/* Something lives in there. It walks its own line deep in the wood,
            behind the front crowns and in front of the middle ranks, so what
            can be seen of it is a grey back moving between the trees and never
            the whole animal. It does not come out: the year it does is an
            event, and until that year this is only a wood with a wolf in it. */}
        <g className="city-prowl" style={{ '--prowl': '88px' } as CSSProperties} opacity=".88">
          <g transform="translate(1066 262) scale(0.42)">
            <Wolf paint={paint} walking />
          </g>
        </g>
        <Stands paint={paint} stands={RIGHT_WOOD_MID} />
        <Stands paint={paint} stands={RIGHT_WOOD_NEAR} />
      </g>
      <Stands paint={paint} stands={LEFT_WOOD} />
      <Stands paint={paint} stands={LEFT_PINES} conifer />

      {/* the crag: rock, not field. It keeps its own colour and its own foot. */}
      <g className="city-tint">
        <path d="M-20 402 L4 292 L54 312 L96 240 L152 306 L186 292 L198 398 Z" fill={paint.rock} />
        <path d="M96 240 L152 306 L186 292 L198 398 L126 404 Z" fill={paint.rockShade} />
        <path d="M-20 402 L4 292 L54 312 L60 400 Z" fill={paint.rock} opacity=".8" />
        <path d="M96 244 L117 326 L99 350 M7 299 L24 352 L13 387 M154 311 L168 352 L185 366" fill="none" stroke={paint.rockLit} strokeWidth="3" opacity=".4" strokeLinejoin="round" />
        <path d="M78 324 L92 315 M142 374 L160 371 M33 367 L48 360" fill="none" stroke={paint.rockShade} strokeWidth="2" opacity=".6" strokeLinecap="round" />
        <ellipse cx="150" cy="392" rx="34" ry="9" fill={paint.rock} opacity=".8" />
      </g>
      {raisingOf === 'mine' ? (
        <g transform="translate(114 344)">
          <MineWorks paint={paint} />
        </g>
      ) : level('mine') > 0 ? (
        <g transform="translate(114 344)">
          <MineMouth level={level('mine')} />
        </g>
      ) : ghostOf === 'mine' ? (
        <g transform="translate(114 344)">
          <Ghost>
            <path d="M-22 22 L-22 0 Q0 -22 22 0 L22 22 Z" />
          </Ghost>
          <text x="0" y="-34" fontSize="16" fill={GLOW} opacity=".75" textAnchor="middle">
            {nameOf('mine')}
          </text>
        </g>
      ) : (
        <path d="M92 366 L92 344 Q114 324 136 344 L136 366 Z" fill="#4b4238" opacity=".45" />
      )}

      {/* the belt of scrub at its foot, so the rock never touches the corn */}
      <g>
        <g transform="translate(150 416) scale(.95)">
          <Bush paint={paint} />
        </g>
        <g transform="translate(198 398) scale(1.05)">
          <Tree paint={paint} />
        </g>
        <g transform="translate(216 444) scale(1.15)">
          <Tree paint={paint} />
        </g>
        <g transform="translate(176 470)">
          <Bush paint={paint} />
        </g>
        <g transform="translate(230 358) scale(.9)">
          <Tree paint={paint} />
        </g>
        <g transform="translate(244 410)">
          <Bush paint={paint} />
        </g>
      </g>

      {/* the ground under the plough, well clear of the rock */}
      <Fields
        paint={paint}
        level={fieldLevel}
        ghost={ghostOf === 'fields'}
        breaking={raisingOf === 'fields'}
      />
      {ghostOf === 'fields' && (
        <text
          x="430"
          y="292"
          fontSize="16"
          fill={GLOW}
          opacity=".75"
          textAnchor="middle"
          className="city-ghost"
        >
          {nameOf('fields')}
        </text>
      )}

      {/* the meadow, on both banks */}
      {paint.meadow === 'flowers' && (
        <>
          <polygon points="0,540 860,540 860,600 716,820 0,820" fill="url(#flowers)" opacity=".32" />
          <polygon points="900,616 1440,576 1440,820 790,820" fill="url(#flowers)" opacity=".32" />
          {/* and the small turned one over the top of both, which is what
              stops either repeat from being findable */}
          <polygon
            points="0,540 860,540 860,600 716,820 0,820"
            fill="url(#flowers-fine)"
            opacity=".26"
          />
          <polygon
            points="900,616 1440,576 1440,820 790,820"
            fill="url(#flowers-fine)"
            opacity=".26"
          />
        </>
      )}
      {paint.meadow === 'snow' && (
        <g fill="#eef3f2" opacity=".5">
          <ellipse cx="330" cy="700" rx="300" ry="70" />
          <ellipse cx="1120" cy="720" rx="290" ry="66" />
        </g>
      )}

      {/* the river: in at the right, across the corner, out through the meadow */}
      <MeadowDetails paint={paint} />
      <River paint={paint} />

      {/* The road, which is a thing somebody paid for and not a thing that was
          always here. Nobody arrives on a road: the first years have bare
          ground between the huts and the rise, and the year it is cut there is
          a track, and the year after that a road wide enough for a cart. */}
      {shownRoad > 0 && (
        <g stroke={paint.road} fill="none" strokeLinecap="round" className="city-tint">
          <path d="M770 178 C 766 206, 760 228, 756 248" strokeWidth={shownRoad > 1 ? 15 : 7} />
          <path
            d="M756 242 C 764 292, 796 328, 844 362 C 886 390, 950 410, 1010 438 C 1046 454, 1072 466, 1090 482"
            strokeWidth={shownRoad > 1 ? 34 : 14}
            opacity={shownRoad > 1 ? 1 : 0.85}
          />
          {shownRoad > 1 && (
            <>
              <path
                d="M1090 482 C 1140 506, 1180 522, 1230 530 C 1300 540, 1380 536, 1440 532"
                strokeWidth="30"
              />
              <path
                d="M660 540 C 620 600, 540 640, 500 682 C 460 724, 430 766, 410 820"
                strokeWidth="11"
                opacity=".8"
              />
            </>
          )}
        </g>
      )}
      {/* The year it is cut, it is a line of pegs with a string on it and a
          gang somewhere along it, which is what a road is before it is a road. */}
      {raisingOf === 'road' && (
        <g>
          <path
            d="M756 242 C 764 292, 796 328, 844 362 C 886 390, 950 410, 1010 438 C 1046 454, 1072 466, 1090 482"
            fill="none"
            stroke={paint.road}
            strokeWidth="18"
            strokeLinecap="round"
            opacity="0.35"
            className="city-tint"
          />
          <path
            d="M756 242 C 764 292, 796 328, 844 362 C 886 390, 950 410, 1010 438 C 1046 454, 1072 466, 1090 482"
            fill="none"
            stroke={TIMBER}
            strokeWidth="1.4"
            strokeDasharray="14 10"
            opacity="0.8"
          />
          {ROAD_WALK.map((step) => (
            <g key={step.x} transform={`translate(${step.x + 16} ${step.y - 10})`}>
              <Peg paint={paint} />
            </g>
          ))}
        </g>
      )}
      {ghostOf === 'road' && (
        <g>
          <Ghost>
            <path d="M756 242 C 764 292, 796 328, 844 362 C 886 390, 950 410, 1010 438 C 1046 454, 1072 466, 1090 482" />
          </Ghost>
          <text x="900" y="372" fontSize="16" fill={GLOW} opacity=".75" textAnchor="middle">
            {nameOf('road')}
          </text>
        </g>
      )}

      {/* the crossing, which is a bridge once somebody has paid for one */}
      {raisingOf === 'bridge' ? (
        <g transform="translate(1090 482)">
          {level('bridge') > 1 && <Bridge paint={paint} level={1} />}
          <BridgeWorks paint={paint} />
        </g>
      ) : level('bridge') > 0 ? (
        <g transform="translate(1090 482)">
          <Bridge paint={paint} level={level('bridge')} />
        </g>
      ) : ghostOf === 'bridge' ? (
        <g transform="translate(1090 482)">
          <g transform="rotate(42)">
            <Ghost>
              <rect x="-60" y="-17" width="120" height="34" rx="3" />
            </Ghost>
          </g>
          <text x="0" y="-52" fontSize="16" fill={GLOW} opacity=".75" textAnchor="middle">
            {nameOf('bridge')}
          </text>
        </g>
      ) : null}

      {/* the far bank, which is trees and the far bank and nothing else: the
          stacked timber and the milestone were labels for things this place
          has not done yet */}
      <g>
        <g transform="translate(1382 452) scale(1.15)">
          <Tree paint={paint} big />
        </g>
        <g transform="translate(1436 500) scale(1.25)">
          <Tree paint={paint} big />
        </g>
        <g transform="translate(1000 700) scale(1.5)">
          <Tree paint={paint} big />
        </g>
        <g transform="translate(1180 764) scale(1.9)">
          <Tree paint={paint} big />
        </g>
        <g transform="translate(1390 730) scale(2.2)">
          <Tree paint={paint} big />
        </g>
      </g>

      {/* the square, which only exists once there are enough people to fill it */}
      {population >= 14 && (
        <ellipse cx={SQUARE.x} cy={SQUARE.y} rx={SQUARE.rx} ry={SQUARE.ry} fill="#9c9070" opacity=".45" />
      )}

      {/* the line between the place and everything else */}
      {raisingOf === 'fence' ? (
        <g transform="translate(560 250)">
          {level('fence') > 1 && <Fence paint={paint} level={1} closed={on('gates_closed')} />}
          <FenceWorks paint={paint} level={level('fence')} />
        </g>
      ) : level('fence') > 0 ? (
        <g transform="translate(560 250)">
          <Fence paint={paint} level={level('fence')} closed={on('gates_closed')} />
        </g>
      ) : ghostOf === 'fence' ? (
        <g transform="translate(560 250)">
          <Ghost>
            <path d="M0 4 L172 0 M224 0 L454 6 M166 -14 v32 M220 -14 v32" />
          </Ghost>
          <text x="220" y="-26" fontSize="16" fill={GLOW} opacity=".75" textAnchor="middle">
            {nameOf('fence')}
          </text>
        </g>
      ) : null}

      {/* everything that stands on the ground, back to front */}
      {standing
        .slice()
        .sort((a, b) => a.y - b.y)
        .map((s) => (
          <g key={s.key}>{s.node}</g>
        ))}

      {/* what the reign has done to the place: one flag, one layer.
          A fair is the one work that leaves no building: what it leaves is a
          square with bunting over it for the year that follows, which is the
          year the player actually watches. */}
      <Layer on={on('bunting') || raisingOf === 'fair'}>
        <g stroke="#c8a24a" strokeWidth="1.6" fill="none" opacity=".9">
          <path d="M624 396 Q770 370 916 396" />
          <path d="M636 428 Q770 404 904 428" />
        </g>
        <g fill="#c96a5a">
          {Array.from({ length: 10 }, (_, i) => (
            <path key={i} d={`M${640 + i * 28} 382 l6 0 l-3 9 z`} />
          ))}
        </g>
      </Layer>
      {/* Turned away before dark, and still there in the morning. The camp is
          outside the line the place drew, up by the road, which is the whole
          point of it: everybody inside walks past it on the way out. */}
      <Layer on={on('camp_outside')}>
        <g>
          {[
            [806, 212, 0.9],
            [860, 222, 1],
            [916, 210, 0.85],
            [782, 232, 0.8],
          ].map(([x, y, s]) => (
            <g key={x} transform={`translate(${x} ${y})`}>
              <Tent paint={paint} scale={s} />
            </g>
          ))}
          {/* somebody is out there, and has been since the gate shut */}
          <g transform="translate(848 246) scale(1.05)">
            <Person paint={paint} cloth={CLOTH_POOR} />
          </g>
          <g transform="translate(896 240) scale(0.95)">
            <Person paint={paint} cloth={CLOTH_POOR} />
          </g>
        </g>
      </Layer>

      {/* The common stops being common. Hurdles across the meadow, in a line
          that follows the fall of the ground, which is how anybody actually
          fences a slope. */}
      <Layer on={on('meadow_fenced')}>
        <g>
          {[
            [104, 654, 2],
            [162, 650, 2],
            [220, 645, 1],
            [278, 641, 1],
            [336, 636, 1],
            [394, 632, 0],
            [452, 628, 0],
          ].map(([x, y, tilt]) => (
            <g key={x} transform={`translate(${x} ${y})`}>
              <Hurdle paint={paint} tilt={-tilt} />
            </g>
          ))}
        </g>
      </Layer>

      {/* And when it stays common, this is what is on it. */}
      <Layer on={on('goat_parade')}>
        <g>
          {[
            [140, 618, 1],
            [252, 646, 1.1],
            [308, 598, 0.9],
            [366, 676, 1.15],
            [424, 622, 1],
            [478, 706, 1.25],
            [534, 654, 1.05],
          ].map(([x, y, s]) => (
            <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
              <Goat paint={paint} />
            </g>
          ))}
        </g>
      </Layer>

      <Layer on={on('graves_at_the_edge')}>
        <g fill="#c2b9ab" stroke="#8a8072" strokeWidth="1">
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${398 + i * 26} ${528 + (i % 2) * 8} v-16 q6 -6 12 0 v16 z`} />
          ))}
        </g>
      </Layer>

      {/* The queue is at the granary door, because that is where the bread is,
          and it goes back up the lane, because that is the only direction it
          can go. A board with three loaves left on it says what the line is
          for. */}
      <Layer on={on('bread_queue')}>
        <g>
          <g transform="translate(1030 396)">
            <BreadBoard paint={paint} />
          </g>
          {[
            [1062, 391, 1.15],
            [1092, 385, 1.05],
            [1122, 379, 1.15],
            [1152, 373, 1],
          ].map(([x, y, s]) => (
            <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
              <Person paint={paint} cloth={CLOTH_POOR} />
            </g>
          ))}
        </g>
      </Layer>

      <Layer on={on('share_stalls') || on('quack_row') || on('tavern_rowdy')}>
        <g>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${690 + i * 54} ${452 + (i % 2) * 10})`}>
              <rect x="-20" y="-6" width="40" height="8" rx="3" fill={TIMBER} stroke={OUTLINE} strokeWidth="1" />
              <path d="M-24 -8 h48 l-6 -12 h-36 z" fill="#a04a3c" opacity=".8" />
            </g>
          ))}
        </g>
      </Layer>

      <Layer on={on('baron_banner') || on('war_banners')}>
        <g>
          <rect x="720" y="330" width="4" height="52" fill={OUTLINE} />
          <path d="M724 332 h34 l-8 12 l8 12 h-34 z" fill={on('war_banners') ? BENCH : '#5b4a6b'} />
        </g>
      </Layer>
      <Layer on={on('mourning_ribbons')}>
        <g stroke="#6b5a44" strokeWidth="2.5" strokeLinecap="round" opacity=".9">
          <path d="M718 500 l6 14 M736 496 l6 14 M566 484 l6 14" />
        </g>
      </Layer>
      <Layer on={on('smuggler_lanterns')}>
        <g fill="#f0d488">
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={604 + i * 96} cy={498 + (i % 2) * 18} r="4" opacity=".85" />
          ))}
        </g>
      </Layer>
      <Layer on={on('exam_desk')}>
        <g transform="translate(792 268)">
          <rect x="-16" y="-4" width="32" height="7" rx="2" fill={TIMBER} stroke={OUTLINE} strokeWidth="1" />
          <rect x="-13" y="3" width="4" height="10" fill={OUTLINE} />
          <rect x="9" y="3" width="4" height="10" fill={OUTLINE} />
        </g>
      </Layer>
      <Layer on={on('easel_in_the_square')}>
        <g transform="translate(700 462)">
          <g stroke={OUTLINE} strokeWidth="2.4" strokeLinecap="round">
            <path d="M-8 14 L0 -8 M8 14 L0 -8 M0 -8 L0 14" />
          </g>
          <rect x="-13" y="-24" width="26" height="20" rx="2" fill="#e9dcbe" stroke={OUTLINE} strokeWidth="1.2" />
        </g>
      </Layer>
      {/* The litter, grown. They were three brown lozenges with a stick for a
          tail, which read as something dead on the grass and had two people
          ask what it was; they are the same drawing the small thing on the map
          uses now, which is the one shape in this game a player has already
          been taught to recognise. */}
      <Layer on={on('dogs_about')}>
        {[
          { x: 704, y: 446, k: 0.9, flip: false },
          { x: 770, y: 468, k: 1, flip: true },
          { x: 838, y: 492, k: 0.86, flip: false },
        ].map((d) => (
          <g key={d.x} transform={`translate(${d.x} ${d.y}) scale(${d.flip ? -d.k : d.k} ${d.k})`}>
            <TownDog paint={paint} />
          </g>
        ))}
      </Layer>
      {/* It was in the trees all along. This is the year it walked out of
          them, which is the only difference the flag makes. */}
      <Layer on={on('wolf_at_the_edge')}>
        <g className="city-prowl" style={{ '--prowl': '70px' } as CSSProperties}>
          {/* A wolf is about as long as a person is tall, not twice it. The
              body here is 22 units nose to tail and a townsman at scale 2 is
              16 units from foot to hat, so 0.72 puts them right. It was at
              1.35, which drew a pony. */}
          <g transform="translate(1046 424) scale(0.72)">
            <Wolf paint={paint} walking />
          </g>
        </g>
      </Layer>
      {/* Something large came up the valley on a Tuesday and chose the one
          roof nobody can spare. It hangs off the eaves of the biggest thing
          standing, which is the long room once there is one and the oldest
          roof in the place until then. */}
      <Layer on={on('dragon_roost')}>
        <g transform={roostAt}>
          <Swarm paint={paint} />
        </g>
      </Layer>

      {/* the crowd, each of them at the work the year has for them */}
      <g>
        {crowd.map((c, i) => {
          const life = { '--life-cycle': `${3.4 + (i % 7) * .31}s`, '--life-delay': `-${(i * 1.73) % 7}s`, '--gait-cycle': `${.82 + (i % 5) * .07}s` } as CSSProperties;
          const beat = { animationDuration: c.dur, animationDelay: c.delay } as CSSProperties;
          /* A tree that is felled and left where it fell is firewood for
             nobody. The walk down to the yards is half the job, so it is drawn:
             out of the trees under the log, back up the same line with empty
             hands, and round again. */
          if (c.job === 'haul') {
            return (
              <g key={i} className="town-resident" style={life} data-activity={c.pose} transform={`translate(${c.x} ${c.y})`}>
                <g
                  className="city-haul"
                  style={
                    {
                      ...beat,
                      '--haul-x': `${WOOD_HAUL.dx}px`,
                      '--haul-y': `${WOOD_HAUL.dy}px`,
                    } as CSSProperties
                  }
                >
                  {/* nobody walks home backwards: the turn is at the far end */}
                  <g className="city-turn" style={beat}>
                    <g transform={`scale(${c.scale})`}><g className="city-footfall">
                      <g className="city-load" style={beat}>
                        <Worker paint={paint} cloth={c.cloth} pose="haul" />
                      </g>
                      <g className="city-unload" opacity="0" style={beat}>
                        <Worker paint={paint} cloth={c.cloth} pose="stand" />
                      </g>
                    </g></g>
                  </g>
                </g>
              </g>
            );
          }
          /* A day that starts at a door. The figure is drawn at the work and
             the whole of it is carried back to the door by the animation, so
             it walks out to where it is drawn, does the work there, and walks
             home again, on a loop as long as a working day is from up here.
             Two figures share the spot: the one walking, who faces the way
             they are going and turns round for the walk home, and the one
             working, who faces whatever the work is. Only one is ever lit. */
          if (c.door) {
            const toilBeat = { animationDuration: c.toilDur, animationDelay: c.delay } as CSSProperties;
            const outFacing: 1 | -1 = c.x >= c.door.x ? 1 : -1;
            return (
              <g key={i} className="town-resident" style={life} data-activity={c.pose} transform={`translate(${c.x} ${c.y})`}>
                <g
                  className="city-commute"
                  style={
                    {
                      ...beat,
                      '--home-x': `${c.door.x - c.x}px`,
                      '--home-y': `${c.door.y - c.y}px`,
                    } as CSSProperties
                  }
                >
                  <g transform={`scale(${c.scale})`}>
                    <g className="city-commute-walk" style={beat}>
                      <g className="city-commute-face" style={beat}>
                        <g className="city-footfall" style={{ animationDelay: c.delay }}>
                          <Worker paint={paint} cloth={c.cloth} pose={c.walkOut} facing={outFacing} />
                        </g>
                      </g>
                    </g>
                    <g className="city-commute-work" style={beat}>
                      <g className={c.pose === 'fish' ? undefined : 'city-toil'} style={toilBeat}>
                        <Worker paint={paint} cloth={c.cloth} pose={c.pose} facing={c.facing} />
                      </g>
                    </g>
                  </g>
                </g>
              </g>
            );
          }
          return (
            <g key={i} className="town-resident" style={life} data-activity={c.pose} transform={`translate(${c.x} ${c.y}) scale(${c.scale})`}>
              <g
                className={c.travels ? 'city-person' : c.pose === 'fish' ? undefined : 'city-toil'}
                style={{ ...beat, '--stroll': `${c.span / c.scale}px` } as CSSProperties}
              >
                <g className={c.travels ? 'city-footfall' : undefined} style={{ animationDelay: c.delay }}>
                  <g className={c.travels ? 'city-stroll-turn' : undefined} style={beat}>
                    <Worker paint={paint} cloth={c.cloth} pose={c.pose} facing={c.travels ? 1 : c.facing} />
                  </g>
                </g>
              </g>
            </g>
          );
        })}
      </g>
      {/* everybody you have actually met, doing what your rulings left them doing */}
      <g>
        {folkPins.map((pin) => (
          <FolkFigure key={pin.character} pin={pin} scale={2} />
        ))}
      </g>

      {/* The orchard.

          Somebody planted this, which is the point of it: everything else
          growing in this valley grew there on its own. Three trees above the
          field, in fruit from spring to autumn and bare through the winter,
          and the reason there is ever a basket of apples in the grass. */}
      <g>
        {[
          [352, 250, 1],
          [400, 238, 0.86],
          [438, 258, 0.94],
        ].map(([x, y, k]) => (
          <g key={x} transform={`translate(${x} ${y}) scale(${k})`}>
            <AppleTree paint={paint} fruit={season !== 'winter'} />
          </g>
        ))}
      </g>

      {/* THE NEAR MEADOW, which is what the popup floats over */}
      <g transform="translate(210 668)">
        <Hay paint={paint} />
      </g>
      {paint.sheaves && (
        <g transform="translate(288 704) scale(1.15)">
          <Hay paint={paint} />
        </g>
      )}
      {working && (
        <g>
          <g transform="translate(400 636)">
            <Goat paint={paint} />
          </g>
          <g transform="translate(440 656) scale(.9)">
            <Goat paint={paint} />
          </g>
          <g transform="translate(370 664) scale(1.1)">
            <Goat paint={paint} />
          </g>
        </g>
      )}
      <g transform="translate(580 628) scale(1.5)">
        <Tree paint={paint} />
      </g>
      <g transform="translate(150 776) scale(1.7)">
        <Bush paint={paint} />
      </g>
      <g transform="translate(660 748) scale(1.6)">
        <Bush paint={paint} />
      </g>
      <g transform="translate(66 740) scale(2.5)">
        <Tree paint={paint} />
      </g>

      {/* the weather of the year, coming down at the speed weather comes down at */}
      {paint.weather !== 'none' && <Weather kind={paint.weather} />}
      {/* and the wet months are wet as well as gold */}
      {paint.rains && <Weather kind="rain" weight={0.6} />}

      {/* the light of the day, laid over the whole of it */}
      <rect
        width={MAP.w}
        height={MAP.h}
        fill={paint.wash}
        opacity={paint.washOpacity}
        className="city-tint"
      />

      {/* the curtain a card is looked at through */}
      {viewport && <rect y="750" width={MAP.w} height="70" fill="url(#ruler-ground-tail)" pointerEvents="none" />}
      {veil && <rect width={MAP.w} height={viewport ? 3820 : MAP.h} fill="#14110d" opacity=".10" pointerEvents="none" />}

      {/* The four small things.

          Drawn over the curtain like the pegs are, because in the year they
          exist they are meant to be findable, and under nothing else: a case
          marker and one of these never share a spot, because a card is open in
          one and not in the other. The whole gold shape is the target and the
          drawing inside it is a hint, not a picture: what tells a player is
          the ring lighting up and the pointer turning into a hand. */}
      {/* What each of them actually is.

          A gold ring over empty grass is a button. The ring has to be round
          something, so the thing is drawn first and the ring goes over it: a
          dog in the yards, a basket down in the orchard grass, a rod bent
          double on the bank, a kid loose on the meadow. All four are only here
          while the moment is, which is why they are drawn here and not with
          the rest of the picture: they are what is happening today. */}
      {moments.map((moment) => (
        <g key={`${moment.id}-thing`} transform={`translate(${moment.x} ${moment.y})`}>
          {moment.id === 'dog' && <TownDog paint={paint} />}
          {moment.id === 'kid' && (
            <g transform="scale(0.72)">
              <Goat paint={paint} />
            </g>
          )}
          {moment.id === 'spill' && (
            <g>
              {/* the basket over on its side, and what rolled out of it */}
              <path d="M-8 2 l2 -7 h9 l2 7 z" fill="#c9b184" opacity=".95" />
              <path d="M-6 -5 q4.5 -3.5 9 0" fill="none" stroke="#c9b184" strokeWidth="1.4" />
              <g fill="#c1503f">
                <circle cx="7" cy="2" r="2" />
                <circle cx="12" cy="4" r="1.7" />
                <circle cx="-11" cy="4" r="1.8" />
                <circle cx="16" cy="0" r="1.5" />
              </g>
            </g>
          )}
          {moment.id === 'stack' && (
            <g>
              {/* a winter's firewood, down across the path, cut ends towards you */}
              <g fill="#8a7059" stroke="#5f4c39" strokeWidth="0.7">
                <ellipse cx="-9" cy="2" rx="3.4" ry="2.4" />
                <ellipse cx="-2" cy="4" rx="3.4" ry="2.4" />
                <ellipse cx="5" cy="2.6" rx="3.2" ry="2.2" />
                <ellipse cx="-6" cy="-2" rx="3.2" ry="2.2" />
                <ellipse cx="1" cy="-1" rx="3" ry="2.1" />
              </g>
              <g fill="#c0a97f" opacity=".9">
                <ellipse cx="-9" cy="2" rx="1.5" ry="1.1" />
                <ellipse cx="-2" cy="4" rx="1.5" ry="1.1" />
                <ellipse cx="5" cy="2.6" rx="1.4" ry="1" />
              </g>
            </g>
          )}
          {moment.id === 'bite' && (
            <g>
              {/* the rod, bent the wrong way, and the line going into the water */}
              <path d="M-4 -6 q11 3 15 14" fill="none" stroke="#6b573f" strokeWidth="1.7"
                strokeLinecap="round" />
              <path d="M11 8 v9" fill="none" stroke="#e8dcc0" strokeWidth="0.9" opacity=".8" />
              <path d="M4 18 q7 -3 14 0" fill="none" stroke="#dfe9ea" strokeWidth="1.1"
                opacity=".7" />
            </g>
          )}
        </g>
      ))}

      {moments.map((moment) => {
        const reserved = reservedMoments.includes(moment.id);
        const quiet = momentsQuiet && !reserved;
        /* What stopping is worth, on the ring itself. It is one point and it
           was never a secret; leaving it off only meant a player found out
           what a dog is worth by scratching one and reading the ledger. */
        const worth = momentWorth(moment);
        return (
          <g
            key={moment.id}
            transform={`translate(${moment.x} ${moment.y})`}
            role={quiet ? 'img' : 'button'}
            tabIndex={reserved || quiet ? -1 : 0}
            aria-label={moment.label}
            aria-disabled={reserved || quiet}
            data-moment={moment.id}
            data-reserved={reserved}
            data-quiet={quiet}
            pointerEvents={quiet ? 'none' : undefined}
            className={`city-moment-hit hand-${moment.hand} ${reserved ? 'moment-reserved' : ''} ${quiet ? 'moment-quiet' : ''}`}
            onClick={() => !reserved && !quiet && onMomentTake?.(moment.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                if (!reserved && !quiet) onMomentTake?.(moment.id);
              }
            }}
          >
            <title>{reserved ? JOURNEY.reserved : moment.label}</title>
            <circle r="26" fill="transparent" />
            <g className="city-moment">
              <circle r="17" fill="#e8c877" opacity=".12" />
              <circle r="11.5" fill="none" stroke="#e8c877" strokeWidth="1.6" opacity=".85" />
              <MomentMark hand={moment.hand} />
            </g>
            <g className="moment-name" transform="translate(0 29)" pointerEvents="none">
              <rect x="-52" y="-11" width="104" height="20" rx="10" fill="#332e21" opacity=".9" />
              <text textAnchor="middle" y="3" fill="#f2d792" fontSize="12">
                {reserved ? JOURNEY.queued : moment.label}
                {worth && <tspan fill="#a6c88a">{`  ${worth}`}</tspan>}
              </text>
            </g>
          </g>
        );
      })}

      {/* The ground that is open this year.

          Drawn over the curtain rather than under it, because in the one year
          they exist they are the thing being looked at: a peg in every piece
          of ground the place has left, and the one under the pointer lit up
          with the ghost of the building standing on it. */}
      {plots.map((plot) => {
        const at = PLOT_MARK[plot];
        const on = plotOn === plot;
        return (
          <g
            key={plot}
            transform={`translate(${at.x} ${at.y})`}
            role="button"
            tabIndex={0}
            aria-label={PLOT_NAMES[plot].label}
            style={{ cursor: 'pointer' }}
            onClick={() => onPlotPick?.(plot)}
            onMouseEnter={() => onPlotHover?.(plot)}
            onMouseLeave={() => onPlotHover?.(null)}
            onFocus={() => onPlotHover?.(plot)}
            onBlur={() => onPlotHover?.(null)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onPlotPick?.(plot);
              }
            }}
          >
            <title>{PLOT_NAMES[plot].label}</title>
            {/* the whole peg is a target, not the six pixels of the dot */}
            <circle r="30" fill="transparent" />
            <ellipse cy="4" rx="22" ry="8" fill={SEAL} opacity={on ? 0.3 : 0.12} />
            <circle
              r={on ? 11 : 7}
              fill="none"
              stroke={SEAL}
              strokeWidth={on ? 3 : 1.8}
              opacity={on ? 1 : 0.7}
              className={on ? undefined : 'city-marker'}
            />
            <text
              y="-20"
              fontSize="15"
              fill={GLOW}
              opacity={on ? 0.95 : 0.6}
              textAnchor="middle"
            >
              {PLOT_NAMES[plot].label}
            </text>
          </g>
        );
      })}

      {/* where the thing in front of you is happening, and the thread down to it */}
      {marker && tailTo && (
        <path
          d={`M${marker.x} ${marker.y + 34} L${tailTo.x} ${tailTo.y}`}
          stroke={tailTone === 'bench' ? BENCH : SEAL}
          strokeWidth="2"
          strokeLinecap="round"
          opacity=".4"
          pointerEvents="none"
        />
      )}
      {marker && (
        /* The ring is put where it belongs on the outside and breathes on the
           inside. A CSS animation on an element overrides that element's own
           transform attribute, so an animated ring carrying its own position
           draws itself at the origin, in the corner, every time.

           And when nobody is knocking, the ring is a picture and not a
           button. In the year of work it stands on the very ground the pegs
           are on, drawn over them, and a ring that takes the pointer there
           takes the click meant for the peg under it and throws the hover
           off the peg the moment it lands on it. */
        <g
          transform={`translate(${marker.x} ${marker.y})`}
          pointerEvents={onMarkerClick ? undefined : 'none'}
          onClick={onMarkerClick}
          role={onMarkerClick ? 'button' : undefined}
          tabIndex={onMarkerClick ? 0 : undefined}
          aria-label={onMarkerClick ? UI.city.answerMarker : undefined}
          onKeyDown={(event) => {
            if (onMarkerClick && (event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault();
              onMarkerClick();
            }
          }}
          style={onMarkerClick ? { cursor: 'pointer' } : undefined}
        >
          {onMarkerClick && <title>{UI.city.answerMarker}</title>}
          <g className={markerWaiting ? 'city-knock' : 'city-marker'}>
            <circle r="36" fill={SEAL} opacity=".16" />
            <circle r="27" fill="none" stroke={SEAL} strokeWidth="1.5" opacity=".65" />
            <circle r="15" fill="none" stroke={SEAL} strokeWidth="2.5" />
          </g>
          {markerCharacter === 'wolf' ? (
            <Wolf paint={paint} facing={-1} />
          ) : (
            <Person
              paint={paint}
              cloth={markerCharacter ? CLOTH[folkLook(markerCharacter).cloth] : '#c96a5a'}
            />
          )}
        </g>
      )}
      {journeyLayer}
    </svg>
  );
}

/**
 * A sheet of weather is wider than the picture, because it slides sideways as
 * it falls. It travels exactly one row of its own lattice and then starts
 * again, so it loops without ever snapping back.
 *
 * And it comes down on the country, not only on the sky above it. Rain that
 * stops dead at the horizon is a curtain hung behind a town; the same rain
 * falling through the fields and the meadow is weather the place is standing
 * in. What comes down over the ground is thinner and paler than what comes
 * down over the sky, because it is between you and the town rather than
 * behind it, and a full sheet of it hides the thing it is supposed to be
 * happening to.
 */
function Weather({
  kind,
  weight = 1,
}: {
  kind: 'petals' | 'rain' | 'leaves' | 'snow';
  /** A second sheet over a first one is behind it, not as loud as it. */
  weight?: number;
}) {
  // blossom is a few petals on the air, not a snowfall of them
  const rows = kind === 'rain' ? 5 : kind === 'petals' ? 2 : 4;
  const pitch = kind === 'rain' ? 150 : 210;
  const secs = kind === 'rain' ? 1.1 : kind === 'snow' ? 7 : 5;
  const drift = kind === 'rain' ? 26 : kind === 'snow' ? 70 : 110;
  const colour =
    kind === 'rain'
      ? '#b6d4dc'
      : kind === 'snow'
        ? '#f2f6f4'
        : kind === 'leaves'
          ? '#c0913f'
          : '#f0dbe0';
  const opacity =
    (kind === 'rain' ? 0.4 : kind === 'snow' ? 0.85 : kind === 'petals' ? 0.45 : 0.7) * weight;

  /**
   * The bands the same lattice is tiled into, top to bottom. The first sits
   * over the sky at full weight; the rest tile the country under it, thinner
   * on the count and fainter in the ink, and only the front rows carry them so
   * the ground never costs what the sky costs.
   */
  const bands: { top: number; n: number; fade: number }[] = [{ top: -pitch, n: 34, fade: 1 }];
  for (let top = HORIZON; top < MAP.h; top += pitch) {
    bands.push({ top, n: 11, fade: 0.55 });
  }

  return (
    <g aria-hidden opacity={opacity}>
      {Array.from({ length: rows }, (_, r) => (
        <g
          key={r}
          className="city-fall"
          style={
            {
              animationDuration: `${secs + r * 0.7}s`,
              animationDelay: `-${r * 1.3}s`,
              '--fall': `${pitch}px`,
              '--drift': `${drift}px`,
            } as CSSProperties
          }
        >
          {bands.map((band, b) => {
            // the country gets the front rows only: three sheets deep is
            // already more weather than there is town behind it
            if (b > 0 && r >= 3) return null;
            return Array.from({ length: band.n }, (_, i) => {
              const seed = i * 173 + r * 61 + b * 311;
              const x = -160 + (seed % 1700);
              const y = band.top + ((i * 97 + r * 37 + b * 53) % pitch);
              const key = `${b}-${i}`;
              const fade = band.fade;
              if (kind === 'rain') {
                return (
                  <line
                    key={key}
                    x1={x}
                    y1={y}
                    x2={x - 5}
                    y2={y + 16}
                    stroke={colour}
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    opacity={fade}
                  />
                );
              }
              if (kind === 'leaves') {
                return (
                  <ellipse
                    key={key}
                    cx={x}
                    cy={y}
                    rx="4.5"
                    ry="2.6"
                    fill={colour}
                    opacity={fade}
                    transform={`rotate(${seed % 180} ${x} ${y})`}
                  />
                );
              }
              return (
                <circle
                  key={key}
                  cx={x}
                  cy={y}
                  r={kind === 'snow' ? 2.6 : 2.3}
                  fill={colour}
                  opacity={fade}
                />
              );
            });
          })}
        </g>
      ))}
    </g>
  );
}

/**
 * Birds, which are the one thing in this picture that is only ever passing
 * through.
 *
 * Two strokes each and no body: at this size a bird is a shape the eye agrees
 * to, and drawing more of one gets you a moth. They come back with the spring
 * and go over in a crowd in the autumn, and the frost has none at all, which
 * is a season told without moving a single colour.
 */
function Birds({ n, tint }: { n: number; tint: string }) {
  return (
    <g aria-hidden stroke={tint} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity=".5">
      {Array.from({ length: n }, (_, i) => {
        const x = 120 + ((i * 197) % 1080);
        const y = 64 + ((i * 71) % 96);
        const s = 0.7 + ((i * 13) % 5) / 10;
        return (
          <g
            key={i}
            className="city-drift"
            style={
              {
                animationDuration: `${120 + i * 17}s`,
                animationDelay: `-${i * 13}s`,
              } as CSSProperties
            }
          >
            <g transform={`translate(${x} ${y}) scale(${s})`}>
              <g className="city-wings" style={{ animationDelay: `-${i * .4}s` }}>
                <path d="M-7 0 q4 -4 7 0 q3 -4 7 0" />
              </g>
            </g>
          </g>
        );
      })}
    </g>
  );
}

/**
 * What is inside the gold ring, at eleven units across.
 *
 * Four scratches each, and no more. At this size on this map anything with
 * detail in it turns into a blot, and the ring plus the pointer is what is
 * actually doing the telling: this only has to be different enough from the
 * other three that a player who has seen it before knows which one it is.
 */
/**
 * What a minute of your day is worth, in the units the boards are in. One
 * point, in one place, which is the whole of it: it is written on the ring so
 * nobody has to take one to find out whether it was worth taking.
 */
function momentWorth(moment: Moment): string | null {
  const stat = STATS.find((s) => moment.effect[s.id] !== undefined && moment.effect[s.id] !== 0);
  if (!stat) return null;
  return `${stat.emoji} ${movePoints(moment.effect[stat.id] as number)}`;
}

function MomentMark({ hand }: { hand: Moment['hand'] }) {
  const gold = '#e8c877';
  const line = {
    fill: 'none',
    stroke: gold,
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (hand) {
    case 'pet':
      // a dog sitting, seen from the side: back, head, one ear, a tail
      return (
        <g {...line}>
          <path d="M-5 4 q1.5 -6 4.5 -6.5 q3 -0.5 3.5 -3.5" />
          <path d="M3 -6 q2.5 -0.6 3 2 q0.4 2.2 -2 2.6" />
          <path d="M4.6 -6.4 l1.6 -2.2" />
          <path d="M-5 4 q-3 -1.5 -2 -5" />
        </g>
      );
    case 'lift':
      // a basket on its side, and what came out of it
      return (
        <g {...line}>
          <path d="M-6 2 l2.5 -6 h7 l2.5 6 z" />
          <path d="M-3.5 -4 q3.5 -3 7 0" />
          <circle cx="5.5" cy="4.5" r="1.6" />
          <circle cx="-6" cy="5" r="1.3" />
        </g>
      );
    case 'pull':
      // a rod bent double, and the water under the end of it
      return (
        <g {...line}>
          <path d="M-6 -7 q7 3 9 11" />
          <path d="M3 4 v3.5" />
          <path d="M-6 6 q3 -2 6 0 q3 2 6 0" />
        </g>
      );
    default:
      // a kid: too much leg, and horns that have not decided yet
      return (
        <g {...line}>
          <path d="M-5 5 v-4 q0 -3 4 -3 h3" />
          <path d="M2 -2 q3 0 3 -3" />
          <path d="M4 -5.5 l-1.5 -2.5 M5.6 -5.5 l1.6 -2.5" />
          <path d="M-3.5 5 v-3 M0.5 5 v-3" />
        </g>
      );
  }
}
