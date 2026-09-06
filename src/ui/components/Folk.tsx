import type { CSSProperties } from 'react';
import { folkLook } from '../../content/folk';
import type { Doing, FolkLook } from '../../content/folk';
import type { FolkPin } from '../../engine/folk';

/**
 * The people you have met, drawn small enough to live in the town band.
 *
 * A crowd figure in this picture is a coloured dot with a pale dot on top of
 * it, and that is right: a hundred souls are a hundred souls. Somebody who has
 * stood in front of you is not that. They get a head covering, the colour of
 * their coat, and the thing they were doing the last time you saw them, at
 * about half again the height of everybody else, which is as much as a
 * ten pixel figure will carry before it turns into a smudge.
 *
 * Nobody has legs. A coat that reaches the ground is one clean silhouette and
 * a pair of two pixel legs under it is a smudge, so the posture is carried by
 * the hem and the lean instead. The head covering does the identifying: at
 * this size a red hood is a person and a face is a dot.
 *
 * The same drawing is the mark beside their name in the register, at four
 * times the size and with a hint of where they are standing behind it. One
 * drawing, two sizes: that is what makes it possible to recognise the Digger
 * out on the edge strip after meeting him once.
 */

const INK = 'var(--color-parchment-dim)';
const SOFT = 'var(--color-ink-line)';
const SEAL = 'var(--color-seal)';
const GLOW = 'var(--color-parchment)';
const WATER = 'var(--color-bench)';
const HAIR = 'var(--color-hair)';

const CLOTH: Record<FolkLook['cloth'], string> = {
  poor: 'var(--color-cloth-poor)',
  work: 'var(--color-cloth-work)',
  rich: 'var(--color-cloth-rich)',
};

/** How a body is arranged, which the doing decides and not the person. */
type Posture = 'stand' | 'stoop' | 'sit' | 'run' | 'ride' | 'none';

const POSTURE: Record<Doing, Posture> = {
  foraging: 'stoop',
  trading: 'stand',
  milling: 'stand',
  digging: 'stoop',
  tending: 'stand',
  preaching: 'stand',
  writing: 'stand',
  watching: 'stand',
  hauling: 'stoop',
  pouring: 'sit',
  playing: 'stand',
  riding: 'ride',
  painting: 'stand',
  mourning: 'stand',
  resting: 'sit',
  mending: 'sit',
  running: 'run',
  ferrying: 'stand',
  counting: 'stand',
  building: 'stand',
  prowling: 'none',
  gone: 'none',
};

/** What is behind them in the register, so the mark says where as well as what. */
type Place = 'wood' | 'water' | 'roofs' | 'field' | 'road' | 'stones' | 'none';

const PLACE: Record<Doing, Place> = {
  foraging: 'wood',
  trading: 'roofs',
  milling: 'roofs',
  digging: 'field',
  tending: 'roofs',
  preaching: 'road',
  writing: 'roofs',
  watching: 'road',
  hauling: 'road',
  pouring: 'roofs',
  playing: 'roofs',
  riding: 'road',
  painting: 'roofs',
  mourning: 'field',
  resting: 'roofs',
  mending: 'field',
  running: 'road',
  ferrying: 'water',
  counting: 'roofs',
  building: 'roofs',
  prowling: 'wood',
  gone: 'none',
};

/**
 * One of them, standing in the town at town scale.
 *
 * The figure is drawn round its own feet at the origin and then put where it
 * belongs, so every doing is written once in one small coordinate space and
 * none of them carry the town's numbers around inside them.
 */
export function FolkFigure({ pin, scale = 1 }: { pin: FolkPin; scale?: number }) {
  const look = folkLook(pin.character);
  const moving = ['hauling', 'running', 'riding', 'ferrying', 'prowling'].includes(pin.doing);
  return (
    <g transform={`translate(${pin.x} ${pin.y})`} className="town-folk" data-doing={pin.doing}>
      <title>{pin.label}</title>
      <g className={moving ? 'city-person' : undefined} style={{ animationDuration: pin.dur, animationDelay: pin.delay, '--stroll': pin.span, '--folk-delay': pin.delay } as CSSProperties}>
        <g transform={`scale(${scale})`}>
          <ellipse cy=".5" rx="4.8" ry="1.2" fill="#4f523d" opacity=".22" />
          <g className={moving ? 'city-stroll-turn' : undefined} style={{ animationDuration: pin.dur, animationDelay: pin.delay }}>
            <Figure look={look} doing={pin.doing} />
          </g>
        </g>
      </g>
    </g>
  );
}

/**
 * The same person as a mark, for beside their name. Bigger, with the ground
 * they are standing on drawn in behind them, and nothing else: a register is
 * read a face at a time, so the mark has to answer "where is she now" on its
 * own without a caption doing the work.
 */
export function FolkIcon({
  character,
  doing,
  size = 34,
  look: given,
}: {
  character?: string;
  doing: Doing;
  size?: number;
  /** A shape that is not one of this town's people, for somebody from another. */
  look?: FolkLook;
}) {
  const look = given ?? folkLook(character);
  // a person on a horse and a person holding a pike are taller than the box,
  // so they stand back from it rather than losing the top of their heads
  const top = TALL[doing] ?? 10.9;
  const fit = Math.min(1, 12.8 / top);
  return (
    <svg
      viewBox="-11.5 -13.5 23 16.5"
      width={size}
      height={size}
      aria-hidden
      className="block shrink-0 rounded-md border border-ink-line bg-ink"
      preserveAspectRatio="xMidYMid meet"
    >
      <Backdrop place={PLACE[doing]} />
      <path d="M-11.5 0 h23" stroke={SOFT} strokeWidth="0.8" />
      <g transform={fit < 1 ? `scale(${fit.toFixed(3)})` : undefined}>
        <Figure look={look} doing={doing} />
      </g>
    </svg>
  );
}

/** How far above the ground each of the tall ones reaches. */
const TALL: Partial<Record<Doing, number>> = {
  riding: 16.5,
  watching: 13.6,
  playing: 13,
};

/** Where they are, in the two or three strokes it takes to say so. */
function Backdrop({ place }: { place: Place }) {
  switch (place) {
    case 'wood':
      return (
        <g fill={SOFT} opacity="0.75">
          <path d="M-9 0 l2.6 -7 l2.6 7 z" />
          <path d="M6 0 l2.2 -5.6 l2.2 5.6 z" />
          <path d="M-4.6 0 l1.7 -4.2 l1.7 4.2 z" opacity="0.6" />
        </g>
      );
    case 'water':
      return (
        <g>
          <ellipse cx="0" cy="0.8" rx="11" ry="2.4" fill={WATER} opacity="0.4" />
          <path d="M-7 -0.4 q2 -0.9 4 0 M2 0.6 q2 -0.9 4 0" stroke={WATER} strokeWidth="0.5" fill="none" opacity="0.8" />
        </g>
      );
    case 'roofs':
      return (
        <g fill={SOFT} opacity="0.8">
          <path d="M-11 0 v-4.4 l3.4 -2.6 l3.4 2.6 v4.4 z" />
          <path d="M5.4 0 v-3.4 l2.8 -2.2 l2.8 2.2 v3.4 z" opacity="0.7" />
        </g>
      );
    case 'field':
      return (
        <g stroke={SOFT} strokeWidth="0.55" opacity="0.9">
          <path d="M-11 -1.6 h22" />
          <path d="M-11 -3.4 h22" opacity="0.6" />
        </g>
      );
    case 'road':
      return (
        <path
          d="M-11 -0.6 h22"
          stroke={SOFT}
          strokeWidth="0.9"
          strokeDasharray="2.4 2"
          opacity="0.9"
        />
      );
    case 'stones':
      return (
        <g fill={SOFT} opacity="0.85">
          <path d="M-9.4 0 v-3.4 q1 -1 2 0 V0 z" />
          <path d="M7 0 v-2.8 q0.9 -0.9 1.8 0 V0 z" opacity="0.7" />
        </g>
      );
    default:
      return null;
  }
}

/**
 * A person, ten units tall, standing on the origin.
 *
 * The order matters: whatever is on the ground goes down first, then the body,
 * then what is on their head, then what is in their hands, so a spade crosses
 * the coat and the coat crosses the furrow.
 */
function Figure({ look, doing }: { look: FolkLook; doing: Doing }) {
  if (doing === 'prowling') return <TinyWolf />;
  if (doing === 'gone') return <Absent />;

  const posture = POSTURE[doing];
  const cloth = CLOTH[look.cloth];
  // somebody on a horse is four units further from the ground than everybody else
  const lift = posture === 'ride' ? -5.4 : 0;
  const lean = posture === 'stoop' ? 15 : posture === 'run' ? -12 : 0;

  return (
    <g>
      <Ground doing={doing} />
      <g transform={`translate(0 ${lift}) rotate(${lean} 0 -3)`}>
        <g className="folk-body">
          <Body posture={posture} cloth={cloth} />
          <Head look={look} posture={posture} />
          <g className="folk-hands">
            <Hands doing={doing} posture={posture} seal={look.seal === true} />
          </g>
        </g>
      </g>
    </g>
  );
}

/** Where the head sits, which is the only thing the posture moves. */
function headY(posture: Posture): number {
  return posture === 'sit' ? -7.1 : -9.3;
}

function Body({ posture, cloth }: { posture: Posture; cloth: string }) {
  if (posture === 'sit') {
    return (
      <g fill={cloth}>
        {/* sitting is a coat gathered on the ground with a knee out in front */}
        <path d="M-0.6 -2.2 L3.5 -1.6 L3.5 -0.2 L-0.6 -0.6 z" />
        <path d="M-2.3 -0.2 Q-2.5 -6.3 0 -6.3 Q2.4 -6.3 2.2 -0.2 z" />
      </g>
    );
  }
  // Standing is one shape from the ground to the shoulders and no legs in it.
  // A pair of legs at this size is two strokes that read as a smudge under
  // the coat, and a coat that reaches the earth is what everybody in this
  // picture is wearing anyway: the crowd are circles and the portraits stop
  // at the collar. The hem is what carries the posture instead.
  const coat =
    posture === 'run'
      ? // leaning, with the hem thrown back behind the stride
        'M-3.4 0 Q-2.6 -7.6 0 -7.9 Q2.5 -8.1 2 0 z'
      : posture === 'ride'
        ? // Sits into the horse rather than on top of it. The lift puts the
          // origin at 5.4 and the animal's back is at 5.85, so a hem that
          // stops at the origin leaves the rider floating half a unit clear of
          // the thing they are supposed to be sitting on.
          'M-2.1 0.6 Q-2.4 -8 0 -8 Q2.4 -8 2.1 0.6 z'
        : 'M-2.2 0 Q-2.5 -8 0 -8 Q2.5 -8 2.2 0 z';
  return (
    <g>
      <path d={coat} fill={cloth} />
      <path d="M.4 -7 Q1.8 -5 1.6 -.5" fill="none" stroke={HAIR} strokeWidth=".8" opacity=".45" />
      <path d="M-1.3 -5.8 L-1.5 -1.2" stroke={GLOW} strokeWidth=".5" opacity=".25" />
      <path d="M-1.8 -3 H1.8" stroke={HAIR} strokeWidth=".6" />
      <path d="M-1 -7.4 L0 -6.3 L1 -7.4" fill={GLOW} opacity=".85" />
    </g>
  );
}

/**
 * The head, and the thing on it, which at this size is the whole of who
 * somebody is. A hood is a hood at four pixels. A face is not a face at forty.
 */
function Head({ look, posture }: { look: FolkLook; posture: Posture }) {
  const y = headY(posture);
  const r = 1.5;
  const fill = look.seal ? SEAL : HAIR;
  return (
    <g>
      <circle cx="0" cy={y} r={r} fill={GLOW} />
      <path d={`M.7 ${y - 1.2} q1.4 1.3 .1 2.5`} stroke="#c7aa83" strokeWidth=".5" fill="none" />
      {look.hair === 'hood' && (
        <path
          d={`M-2.4 ${y + 2.6} q0 -4.3 2.4 -4.3 q2.4 0 2.4 4.3 l-1.2 0 q0 -2.6 -1.2 -2.6 q-1.2 0 -1.2 2.6 z`}
          fill={fill}
        />
      )}
      {look.hair === 'kerchief' && (
        <path d={`M-1.6 ${y - 0.3} a1.6 1.6 0 0 1 3.2 0 l-0.5 -1.1 h-2.2 z`} fill={fill} />
      )}
      {look.hair === 'cap' && (
        <g fill={fill}>
          <path d={`M-1.5 ${y - 0.5} a1.5 1.5 0 0 1 3 0 z`} />
          <rect x="-2.2" y={y - 1} width="4.4" height="0.55" rx="0.27" />
        </g>
      )}
      {look.hair === 'long' && (
        <g fill={fill}>
          <path d={`M-1.5 ${y} a1.5 1.5 0 0 1 3 0 z`} />
          <path d={`M-1.5 ${y} l0 2.4 l0.7 0 l0 -2.4 z M1.5 ${y} l0 2.4 l-0.7 0 l0 -2.4 z`} />
        </g>
      )}
      {look.hair === 'crop' && <path d={`M-1.5 ${y - 0.2} a1.5 1.5 0 0 1 3 0 z`} fill={fill} />}
      {/* a bald head keeps the pale circle it was given, and that is the joke */}
    </g>
  );
}

/** Things that stay on the ground when the body leans over them. */
function Ground({ doing }: { doing: Doing }) {
  switch (doing) {
    case 'foraging':
      return (
        <g>
          {/* the basket, put down while both hands are busy */}
          <path d="M-6.6 0 h4.4 l-0.6 -2.6 h-3.2 z" fill={GLOW} opacity="0.8" />
          <path d="M-6.6 -2.6 q2.2 -1.6 4.4 0" fill="none" stroke={GLOW} strokeWidth="0.45" />
          {/* and what goes in it */}
          <g fill={SEAL} opacity="0.9">
            <path d="M3.4 0 q1 -1.5 2 0 z" />
            <path d="M5.6 0 q0.8 -1.2 1.6 0 z" />
          </g>
        </g>
      );
    case 'trading':
      return (
        <g>
          <rect x="1.6" y="-4.6" width="7" height="0.8" fill={SOFT} />
          <path d="M2.6 -3.8 v3.8 M7.6 -3.8 v3.8" stroke={SOFT} strokeWidth="0.6" />
          <path d="M3.4 -4.6 h3.6 l-0.5 -2 h-2.6 z" fill={GLOW} opacity="0.8" />
        </g>
      );
    case 'mourning':
      // one stone, and it has to be a stone and not a fence post, so it is
      // wider than it is thin and the top of it is round
      return (
        <g>
          <ellipse cx="4.4" cy="0" rx="3" ry="0.7" fill={SOFT} opacity="0.6" />
          <path d="M2.8 -0.2 v-4 q1.6 -1.7 3.2 0 v4 z" fill={INK} opacity="0.55" />
          <path d="M3.5 -2.6 h1.8 M4.4 -3.4 v1.6" stroke={SOFT} strokeWidth="0.4" />
        </g>
      );
    case 'mending':
      return (
        <g stroke={SOFT} strokeWidth="0.7" fill="none">
          <path d="M-6 0 v-3.6 M7 0 v-3.2" />
          <path d="M-6 -2.6 h13" opacity="0.8" />
        </g>
      );
    case 'resting':
    case 'pouring':
      // a step to sit on, since a person sitting on nothing is a person falling
      return <rect x="-3.4" y="-1.6" width="4.6" height="1.6" fill={SOFT} />;
    case 'riding':
      return (
        <g fill={INK}>
          {/* A horse is legs and a neck. Give it a long low body and a neck
              that comes forward instead of up, and what you have drawn is a
              dog; the animal only arrives when the legs are a third of the
              height and the neck goes up out of the shoulder at an angle. */}
          <path
            d="M-2.5 -3.3 v3.3 M-1.1 -3.2 v3.2 M1.5 -3.2 v3.2 M2.7 -3.3 v3.3"
            stroke={INK}
            strokeWidth="0.8"
          />
          <ellipse cx="0" cy="-4.4" rx="3.5" ry="1.45" />
          <path d="M1.9 -5.3 L3.5 -8.4 L4.8 -8 L3.5 -4.9 z" />
          <path d="M3.3 -8.7 L6.1 -8.9 L6.2 -7.7 L4.2 -7.6 z" />
          <path d="M3.6 -8.8 l0.15 -1.1 l0.8 0.9 z" />
          <path d="M-3.3 -4.8 q-2.3 0.9 -2.9 3.2 q1.8 -0.8 2.9 -2 z" />
        </g>
      );
    case 'ferrying':
      return (
        <g>
          <path d="M-6.4 0 q6.4 2.6 12.8 0 l-1.4 1.6 q-5 1.5 -10 0 z" fill={SOFT} />
        </g>
      );
    case 'painting':
      return (
        <g stroke={GLOW} strokeWidth="0.5" fill="none" opacity="0.9">
          <path d="M3.4 0 L5 -6.4 M7.6 0 L6 -6.4 M5.5 0 L5.5 -3.4" />
          <rect x="3.2" y="-9.4" width="4.6" height="3.4" fill={SEAL} opacity="0.65" stroke={GLOW} />
        </g>
      );
    case 'writing':
    case 'counting':
      return (
        <g>
          <rect x="1.8" y="-4.4" width="6.4" height="0.8" fill={SOFT} />
          <path d="M2.8 -3.6 v3.6 M7.2 -3.6 v3.6" stroke={SOFT} strokeWidth="0.6" />
          {doing === 'counting' ? (
            <g fill={GLOW} opacity="0.85">
              <circle cx="4" cy="-5" r="0.7" />
              <circle cx="5.8" cy="-5" r="0.7" />
              <circle cx="4.9" cy="-6.2" r="0.7" />
            </g>
          ) : (
            <rect x="3.4" y="-5.2" width="3.8" height="0.9" fill={GLOW} opacity="0.8" />
          )}
        </g>
      );
    case 'building':
      return (
        <g stroke={SOFT} strokeWidth="0.75" fill="none">
          <path d="M3 0 v-7 h5.4 v7" />
          <path d="M3 -7 l2.7 -1.8 l2.7 1.8" />
          <path d="M3 -3.4 h5.4" opacity="0.7" />
        </g>
      );
    case 'digging':
      return <path d="M-7.6 0 q2.4 -1.8 4.8 0 z" fill={SOFT} />;
    default:
      return null;
  }
}

/**
 * What is in their hands, drawn last so it sits on top of the coat. A hand at
 * this size is not a hand, it is the thing it is holding.
 */
function Hands({ doing, posture, seal }: { doing: Doing; posture: Posture; seal: boolean }) {
  const y = headY(posture);
  const bright = seal ? SEAL : GLOW;

  switch (doing) {
    case 'digging':
      return (
        <g stroke={INK} strokeWidth="0.65" fill="none" strokeLinecap="round">
          <path d="M-1.4 -5.6 L-5.2 -1.6" />
          <path d="M-5.2 -1.6 l-1.5 1.6 l1.5 1.2 l1.5 -1.6 z" fill={INK} stroke="none" />
        </g>
      );
    case 'foraging':
      // one hand down at the ground, which is what picking looks like
      return <path d="M-1.6 -5 L-3.4 -1.4" stroke={INK} strokeWidth="0.65" strokeLinecap="round" />;
    case 'milling':
      return (
        <g>
          <path d="M-2.6 -8 q2.6 -2.4 5.2 0 q-2.6 1.4 -5.2 0 z" fill={GLOW} opacity="0.75" />
          <path d="M1.9 -6.6 L3 -4.6" stroke={INK} strokeWidth="0.6" strokeLinecap="round" />
        </g>
      );
    case 'hauling':
      return (
        <g stroke={GLOW} strokeLinecap="round" fill="none">
          <path d="M-3 -8.6 h6.4" strokeWidth="1.2" opacity="0.8" />
          <path d="M-2.4 -9.8 h5.4" strokeWidth="0.8" opacity="0.55" />
        </g>
      );
    case 'watching':
      return (
        <g>
          <rect x="2.2" y="-11.6" width="0.6" height="11.6" fill={INK} />
          <path d="M2.5 -13.4 l1.4 2 h-2.8 z" fill={INK} />
        </g>
      );
    case 'preaching':
      return (
        <g>
          <path d={`M1.6 ${y - 2.6} q0 -2.4 1.6 -2.4 q1.6 0 1.6 2.4 z`} fill={bright} />
          <circle cx="3.2" cy={y - 2} r="0.45" fill={bright} />
          <path
            d={`M5.6 ${y - 4.6} q1.4 1.2 0 2.4 M6.8 ${y - 5.6} q2.4 2.2 0 4.4`}
            stroke={bright}
            strokeWidth="0.4"
            fill="none"
            opacity="0.7"
          />
          <path d={`M0.8 ${y + 2.2} L2.4 ${y - 1.6}`} stroke={INK} strokeWidth="0.6" />
        </g>
      );
    case 'tending':
      return (
        <g>
          <rect x="2.4" y="-6.4" width="1.4" height="2.4" rx="0.4" fill={bright} />
          <rect x="2.9" y="-7.4" width="0.5" height="1.1" fill={bright} />
          <path d="M1.6 -6.2 L2.4 -5.4" stroke={INK} strokeWidth="0.6" strokeLinecap="round" />
        </g>
      );
    case 'pouring':
      return (
        <g>
          <rect x="2.4" y="-3.6" width="1.9" height="3.6" rx="0.5" fill={GLOW} opacity="0.8" />
          <rect x="3.05" y="-5" width="0.7" height="1.5" fill={GLOW} opacity="0.8" />
          <path d="M1.5 -3.4 L2.4 -2.6" stroke={INK} strokeWidth="0.6" strokeLinecap="round" />
        </g>
      );
    case 'writing':
      return (
        <g>
          <path d="M1.8 -5.2 L4 -7.8" stroke={GLOW} strokeWidth="0.55" strokeLinecap="round" />
          <path d="M4 -7.8 q-0.4 1.2 -1.4 1.6 q0.4 -1.2 1.4 -1.6 z" fill={GLOW} opacity="0.9" />
        </g>
      );
    case 'counting':
      return <path d="M1.7 -5.6 L3.6 -5" stroke={INK} strokeWidth="0.6" strokeLinecap="round" />;
    case 'playing':
      return (
        <g>
          {/* an arm up and a bow across it, and three notes going nowhere */}
          <path d="M1.7 -6.6 L4.2 -8.2" stroke={INK} strokeWidth="0.65" strokeLinecap="round" />
          <path d="M2.6 -9.4 L5.4 -7" stroke={GLOW} strokeWidth="0.5" />
          <g fill={bright} opacity="0.85">
            <circle cx="5.8" cy="-10.6" r="0.6" />
            <circle cx="7.6" cy="-12.2" r="0.5" />
          </g>
        </g>
      );
    case 'painting':
      return (
        <g>
          <path d="M1.7 -6.4 L3.4 -7.4" stroke={INK} strokeWidth="0.6" strokeLinecap="round" />
          <path d="M-2 -6 a1.4 1.4 0 1 0 -0.02 0 z" fill={SOFT} />
        </g>
      );
    case 'building':
      return (
        <g>
          <path d="M1.7 -8 L3.2 -9.6" stroke={INK} strokeWidth="0.6" strokeLinecap="round" />
          <rect x="2.8" y="-10.6" width="1.8" height="0.9" rx="0.3" fill={INK} />
        </g>
      );
    case 'ferrying':
      return <path d="M-3.6 -11 L3.4 -0.6" stroke={GLOW} strokeWidth="0.55" strokeLinecap="round" />;
    case 'mending':
      // both hands on the rail across the knees
      return <path d="M0.8 -4.4 L2.6 -2.8" stroke={INK} strokeWidth="0.6" strokeLinecap="round" />;
    case 'mourning':
      return <path d="M1.6 -5.6 L2.8 -3.4" stroke={INK} strokeWidth="0.6" strokeLinecap="round" />;
    case 'running':
      return (
        <path
          d="M-1.6 -6 L-3.6 -4.4 M1.6 -6.4 L3.4 -7.4"
          stroke={INK}
          strokeWidth="0.65"
          strokeLinecap="round"
        />
      );
    case 'riding':
      return <path d="M1.4 -6.2 L3.4 -5.2" stroke={INK} strokeWidth="0.6" strokeLinecap="round" />;
    case 'trading':
      return <path d="M1.6 -5.8 L3 -4.8" stroke={INK} strokeWidth="0.6" strokeLinecap="round" />;
    default:
      return null;
  }
}

/**
 * The one in the register with no shoulders, at the size the town draws it:
 * heavy through the front, head carried level with the back, tail hanging.
 */
function TinyWolf() {
  return (
    <g fill={WATER} opacity="0.9">
      <ellipse cx="0" cy="-2.4" rx="4.2" ry="2" />
      <ellipse cx="2.1" cy="-3.3" rx="2" ry="2.1" />
      <circle cx="4.4" cy="-3.4" r="1.75" />
      <path d="M5.4 -4 l3.3 0.9 l-3.1 1.2 z" />
      <path d="M3.2 -4.5 l0 -1.9 l1.7 1.3 z M5 -4.7 l0.4 -1.8 l1.3 1.3 z" />
      <path d="M-3.9 -2.6 q-3.7 1.4 -4.6 4.6 q2.3 -0.9 3.5 -2 q1.2 -1 1.8 -2.3 z" />
      <path
        d="M-2.1 -0.5 l-0.3 2.4 M2.3 -0.5 l0.3 2.4"
        stroke={WATER}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </g>
  );
}

/**
 * Nobody, drawn with some care. A chair and an open window: the register still
 * has a page for them, and the page is not blank.
 */
function Absent() {
  return (
    <g>
      <g stroke={SOFT} strokeWidth="0.75" fill="none">
        <path d="M-1.6 0 v-3.4 h3.4 v3.4" />
        <path d="M-1.6 -3.4 v-2.6" />
      </g>
      <rect x="4" y="-9.4" width="4.6" height="4.6" fill="none" stroke={SOFT} strokeWidth="0.7" />
      <path d="M6.3 -9.4 v4.6" stroke={SOFT} strokeWidth="0.5" />
      <rect x="4" y="-9.4" width="2.3" height="4.6" fill={GLOW} opacity="0.14" />
    </g>
  );
}
