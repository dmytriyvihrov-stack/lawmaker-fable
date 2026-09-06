/**
 * The person who was standing in front of you, drawn small, in the same flat
 * ink as the town. Not a likeness: a shape you recognise the second time.
 *
 * The shape comes out of `content/folk.ts`, which the figure that goes on
 * living in the town and the mark in the register both read as well. That is
 * the point of keeping it in one table: the hood you are shown at this size is
 * the hood you pick out of a street at a tenth of it.
 */

import { folkLook } from '../../content/folk';
import type { FolkLook } from '../../content/folk';
import { foundingLooks } from '../../engine/folk';

const INK = 'var(--color-parchment-dim)';
const SOFT = 'var(--color-ink-line)';
const SEAL = 'var(--color-seal)';
const HAIR = 'var(--color-hair)';
const GLOW = 'var(--color-parchment)';
/** A face is the one light thing in the frame, and the frame is the wall. */
const SKIN = '#e9dcbe';
/** What is on the shoulders: the coat, in a colour that says whose it is. */
const COAT: Record<FolkLook['cloth'], string> = {
  poor: '#7a746a',
  work: '#5c7f86',
  rich: '#c8a24a',
};

interface Props {
  character?: string;
  size?: number;
  /** A face that has just had bad news looks down. */
  grim?: boolean;
  /**
   * A shape to draw that nobody has met.
   *
   * The founding picture needs five faces in a game that has not introduced
   * anybody yet, and they have to be drawn in this ink or they are a different
   * game's people. Given a look, the character id is not consulted at all.
   */
  look?: FolkLook;
  /** Set back behind the others in a group, so a huddle has depth in it. */
  dim?: boolean;
}

export function PersonPortrait({
  character,
  size = 64,
  grim = false,
  look: given,
  dim = false,
}: Props) {
  // one of the people who came to the door is not people
  if (given === undefined && character === 'wolf') {
    return <WolfPortrait size={size} grim={grim} />;
  }

  const look = given ?? folkLook(character);
  const eyeY = look.y + (grim ? 1 : 0);

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden
      className={`block shrink-0 rounded-lg bg-ink-line ${dim ? 'opacity-75' : ''}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* shoulders, in the coat, and the collar that stops them being a hill */}
      <path
        d="M10 64 Q14 44 32 42 Q50 44 54 64 Z"
        fill={look.seal ? '#c96a5a' : COAT[look.cloth]}
      />
      <path
        d="M24 43 q8 7 16 0"
        fill="none"
        stroke={INK}
        strokeWidth="1.1"
        opacity="0.5"
        strokeLinecap="round"
      />
      {/* A neck. Without one a head sits on a coat like a ball on a shelf,
          and every person in the game had the same problem. */}
      <path
        d={`M${32 - look.r * 0.34} ${look.y + look.r - 2} h${look.r * 0.68} v${
          44 - (look.y + look.r) + 3
        } h-${look.r * 0.68} z`}
        fill={SKIN}
        opacity="0.9"
      />
      {/* head */}
      <circle cx="32" cy={look.y} r={look.r} fill={SKIN} />
      {/* The light comes from the same side it comes from in the town: one
          cheek is lit and the other is not, and that is the whole of the form. */}
      <path
        d={`M32 ${look.y - look.r} a${look.r} ${look.r} 0 0 1 0 ${look.r * 2} z`}
        fill="var(--color-ink)"
        opacity="0.06"
      />
      {/* ears, on the heads that have anything covering them to hang off */}
      {kind_hasEars(look) && (
        <g fill={SKIN}>
          <circle cx={32 - look.r} cy={look.y + 1} r={look.r * 0.2} />
          <circle cx={32 + look.r} cy={look.y + 1} r={look.r * 0.2} />
        </g>
      )}
      {/* brows carry the news before the mouth gets to it */}
      <g stroke="var(--color-ink)" strokeWidth="1.1" strokeLinecap="round" opacity="0.8">
        <path
          d={
            grim
              ? `M${32 - look.r * 0.62} ${eyeY - 3.4} l${look.r * 0.46} 1.4`
              : `M${32 - look.r * 0.62} ${eyeY - 3} l${look.r * 0.46} -0.6`
          }
        />
        <path
          d={
            grim
              ? `M${32 + look.r * 0.62} ${eyeY - 3.4} l-${look.r * 0.46} 1.4`
              : `M${32 + look.r * 0.62} ${eyeY - 3} l-${look.r * 0.46} -0.6`
          }
        />
      </g>
      {/* eyes and mouth */}
      <circle cx={32 - look.r * 0.38} cy={eyeY} r="1.5" fill="var(--color-ink)" />
      <circle cx={32 + look.r * 0.38} cy={eyeY} r="1.5" fill="var(--color-ink)" />
      {/* a nose, which is the difference between a face and a button */}
      <path
        d={`M32 ${eyeY + 0.6} l0 ${look.r * 0.3} l1.6 0`}
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />
      <path
        d={
          grim
            ? `M ${32 - 4} ${look.y + look.r * 0.62} q4 -3 8 0`
            : `M ${32 - 4} ${look.y + look.r * 0.55} q4 3 8 0`
        }
        stroke="var(--color-ink)"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      {hair(look)}
      {look.specs && specs(look)}
      {prop(look)}
    </svg>
  );
}

/**
 * Spectacles. Two rims and a bridge, sitting on the nose rather than floating
 * in front of it, on the people whose whole job is having read something you
 * have not.
 */
function specs({ r, y }: FolkLook) {
  const ink = 'var(--color-ink)';
  const lens = r * 0.36;
  return (
    <g>
      <g fill="var(--color-parchment)" opacity="0.13">
        <circle cx={32 - r * 0.38} cy={y} r={lens} />
        <circle cx={32 + r * 0.38} cy={y} r={lens} />
      </g>
      <g stroke={ink} strokeWidth="0.9" fill="none" opacity="0.85">
        <circle cx={32 - r * 0.38} cy={y} r={lens} />
        <circle cx={32 + r * 0.38} cy={y} r={lens} />
        <path d={`M${32 - r * 0.38 + lens} ${y} L${32 + r * 0.38 - lens} ${y}`} />
        <path d={`M${32 - r * 0.38 - lens} ${y} l-${r * 0.34} -1.4`} />
        <path d={`M${32 + r * 0.38 + lens} ${y} l${r * 0.34} -1.4`} />
      </g>
    </g>
  );
}

/** Whether anything is showing at the sides of this head to hang an ear off. */
function kind_hasEars(look: FolkLook): boolean {
  return look.hair !== 'hood' && look.hair !== 'long';
}

function hair({ r, y, hair: kind, seal }: FolkLook) {
  const fill = seal ? SEAL : HAIR;
  switch (kind) {
    case 'long':
      return (
        <g fill={fill}>
          <path d={`M${32 - r} ${y} a${r} ${r} 0 0 1 ${r * 2} 0 l0 ${r * 1.4} l-3 0 l0 -${r} l-${r * 2 - 6} 0 l0 ${r} l-3 0 z`} />
        </g>
      );
    case 'kerchief':
      return (
        <path
          d={`M${32 - r} ${y - 1} a${r} ${r} 0 0 1 ${r * 2} 0 l-3 -3 l-${r * 2 - 6} 0 z`}
          fill={fill}
        />
      );
    case 'hood':
      return (
        <path
          d={`M${32 - r - 2} ${y + r} q0 -${r * 2.2} ${r + 2} -${r * 2.2} q${r + 2} 0 ${r + 2} ${r * 2.2} l-4 0 q0 -${r * 1.5} -${r - 2} -${r * 1.5} q-${r - 2} 0 -${r - 2} ${r * 1.5} z`}
          fill={fill}
        />
      );
    case 'cap':
      return (
        <g fill={fill}>
          <path d={`M${32 - r} ${y - 2} a${r} ${r} 0 0 1 ${r * 2} 0 z`} />
          <rect x={32 - r - 3} y={y - 3} width={r * 2 + 6} height="2.5" rx="1.2" />
        </g>
      );
    case 'bald':
      return <path d={`M${32 - r + 2} ${y - r + 3} q${r - 2} -3 ${r * 2 - 4} 0`} stroke={fill} strokeWidth="1.2" fill="none" />;
    default:
      return <path d={`M${32 - r} ${y - 1} a${r} ${r} 0 0 1 ${r * 2} 0 z`} fill={fill} />;
  }
}

function prop({ prop: kind, seal }: FolkLook) {
  const fill = seal ? SEAL : GLOW;
  switch (kind) {
    case 'basket':
      return (
        <g>
          <path d="M6 52 h18 l-2.5 10 h-13 z" fill={GLOW} opacity="0.85" />
          <path d="M6 52 q9 -6 18 0" fill="none" stroke={GLOW} strokeWidth="1.4" />
          <circle cx="12" cy="50" r="2.2" fill={fill} />
          <circle cx="18" cy="50" r="2.2" fill={fill} />
        </g>
      );
    case 'stick':
      return <rect x="8" y="34" width="2.4" height="30" rx="1.2" fill={GLOW} opacity="0.8" />;
    case 'spade':
      return (
        <g>
          <rect x="9" y="34" width="2.4" height="20" fill={GLOW} opacity="0.8" />
          <path d="M6 54 h9 l-1.5 8 h-6 z" fill={GLOW} opacity="0.8" />
        </g>
      );
    case 'pike':
      return (
        <g>
          <rect x="9" y="26" width="2.4" height="38" fill={GLOW} opacity="0.8" />
          <path d="M10.2 20 l4 8 h-8 z" fill={GLOW} opacity="0.9" />
        </g>
      );
    case 'ledger':
      return (
        <g>
          <rect x="5" y="48" width="16" height="12" rx="1.5" fill={GLOW} opacity="0.85" />
          <path d="M8 52 h10 M8 55 h10 M8 58 h6" stroke="var(--color-ink)" strokeWidth="1" />
        </g>
      );
    case 'bottle':
      return (
        <g>
          <rect x="9" y="48" width="8" height="14" rx="2" fill={GLOW} opacity="0.85" />
          <rect x="11.5" y="43" width="3" height="6" fill={GLOW} opacity="0.85" />
        </g>
      );
    case 'bell':
      return (
        <g>
          <path d="M8 56 q0 -10 6 -10 q6 0 6 10 z" fill={fill} opacity="0.85" />
          <circle cx="14" cy="58" r="1.8" fill={fill} opacity="0.85" />
        </g>
      );
    case 'quill':
      return (
        <g>
          <path d="M6 60 q8 -14 14 -20" stroke={GLOW} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M20 40 q-2 6 -6 8 q2 -6 6 -8 z" fill={GLOW} opacity="0.9" />
        </g>
      );
    case 'reins':
      return (
        <g>
          <path d="M4 46 q10 6 20 2" stroke={fill} strokeWidth="2" fill="none" />
          <path d="M4 52 q10 6 20 2" stroke={fill} strokeWidth="2" fill="none" />
        </g>
      );
    default:
      return null;
  }
}

/**
 * The one caller in the game with no shoulders. Drawn in the same flat ink and
 * at the same size as everybody else, because that is the joke: it is standing
 * in the queue like the miller and the chaplain, waiting to be dealt with.
 */
function WolfPortrait({ size, grim }: { size: number; grim: boolean }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden
      className="block shrink-0 rounded-lg bg-ink-line"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* the chest, low and wide, so the head reads as a head on an animal */}
      <path d="M12 64 Q18 46 32 45 Q46 46 52 64 Z" fill="#4d5a4a" />
      {/* The ruff. A wolf is more coat than animal, and at this size the coat
          is the only thing that separates it from a dog, so it is drawn as
          teeth of fur standing out all round the jaw rather than an outline. */}
      <path
        d="M14 40 l-4 -3 l4 -1 l-3 -4 l5 0 l-2 -5 l5 2 l0 -5 l4 3 l1 -5 l3 4
           l3 -4 l1 5 l4 -3 l0 5 l5 -2 l-2 5 l5 0 l-3 4 l4 1 l-4 3
           l4 4 l-5 1 l2 5 l-5 -1 l0 5 l-5 -3 l-2 5 l-4 -4 l-4 4 l-2 -5 l-5 3
           l0 -5 l-5 1 l2 -5 l-5 -1 z"
        fill={INK}
        opacity="0.35"
      />
      {/* ears, then the skull, then the muzzle: the order the eye needs them */}
      <path d="M21 28 L20 12 L31 21 Z" fill={INK} />
      <path d="M43 28 L44 12 L33 21 Z" fill={INK} />
      <path d="M18 30 q14 -10 28 0 q0 12 -6 17 q-8 4 -16 0 q-6 -5 -6 -17 z" fill={INK} />
      <path d="M26 44 q6 -3 12 0 q-1 8 -6 9 q-5 -1 -6 -9 z" fill={SOFT} opacity="0.8" />
      {/* eyes: the one thing that is never dim on this animal */}
      <circle cx="26" cy={grim ? 35 : 34} r="1.8" fill={GLOW} />
      <circle cx="38" cy={grim ? 35 : 34} r="1.8" fill={GLOW} />
      <circle cx="32" cy="50" r="1.6" fill="var(--color-ink)" />
      {/* and the mouth, which is a wolf mouth whichever way it is going */}
      <path
        d={grim ? 'M28 54 q4 -2 8 0' : 'M28 53 q4 3 8 0'}
        stroke="var(--color-ink)"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * The five of you, on the day.
 *
 * You in front with the seal, the other four ranged behind and set back, and
 * the whole thing at the top of the first screen instead of a crown emoji. It
 * is the same ink, the same heads and the same props as every face the reign
 * will put in front of you afterwards, which is the only reason it is worth
 * drawing: the game opens on its own people rather than on its own logo.
 *
 * Who the five are is the seed's, so the first thing on the first screen is
 * already this reign and not the last one. The same seed draws your head on
 * your own row at the reckoning, which is the point: it was one person.
 */
export function FoundingPortrait({ seed, size = 96 }: { seed: number; size?: number }) {
  const small = Math.round(size * 0.6);
  const { you, others } = foundingLooks(seed);
  return (
    <div className="flex items-end justify-center">
      {others.slice(0, 2).map((look, i) => (
        <div key={`l${i}`} className={i === 0 ? '-mr-3' : '-mr-4'}>
          <PersonPortrait look={look} size={small} dim />
        </div>
      ))}
      <div className="relative z-10 rounded-xl ring-2 ring-seal/70">
        <PersonPortrait look={you} size={size} />
      </div>
      {others.slice(2).map((look, i) => (
        <div key={`r${i}`} className={i === 0 ? '-ml-4' : '-ml-3'}>
          <PersonPortrait look={look} size={small} dim />
        </div>
      ))}
    </div>
  );
}
