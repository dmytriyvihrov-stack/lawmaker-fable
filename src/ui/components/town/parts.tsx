import type { CSSProperties, ReactNode } from 'react';
import type { TownPaint } from './paint';

/**
 * The vocabulary the place is drawn in.
 *
 * Not one hard black line anywhere: outlines are a warm brown, shadows are the
 * colour of the grass they fall on, and every corner is rounded. A crown is
 * four soft circles. A roof is a slab with a ridge on it. The whole style has
 * to survive being three hundred pixels wide on a phone and two thousand on a
 * desk, so nothing here is thinner than about a unit.
 *
 * Every shape takes the paint of the year rather than owning a colour, which
 * is what lets one drawing be four seasons.
 */

const OUTLINE = '#7b6449';
const TIMBER = '#c3ac83';
const TIMBER_DIM = '#b09773';
const TIMBER_DARK = '#a58a68';
const DOOR = '#6f5b45';
const SNOW = '#f2f6f4';
const GLOW = '#f0e6cc';

/** The shadow every standing thing sits in, in the colour of the ground. */
export function Shade({
  paint,
  cx = 0,
  cy = 0,
  rx,
  ry,
}: {
  paint: TownPaint;
  cx?: number;
  cy?: number;
  rx: number;
  ry: number;
}) {
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill={paint.shade}
      opacity={paint.shadeOpacity}
      className="city-tint"
    />
  );
}

/**
 * A head of leaves: four soft circles, and not one hard line. In the cold
 * months the same tree is a trunk and a handful of twigs with snow caught in
 * them, which is the same tree and not a different one.
 */
export function Crown({ paint, rank }: { paint: TownPaint; rank: 'far' | 'mid' | 'near' }) {
  const base = rank === 'far' ? paint.crownFar : rank === 'mid' ? paint.crownMid : paint.crownNear;
  // A wood a mile off in the frost is a grey mass with snow on it, not a row
  // of individual twigs. Only the trees near enough to have a trunk get one.
  if (paint.bare && rank === 'far') {
    return (
      <g className="city-tint">
        <circle r="11" fill={base} />
        <circle cx="6" cy="-5" r="7" fill={paint.crownHigh} opacity="0.6" />
        <ellipse cy="-8" rx="9" ry="3.5" fill={SNOW} opacity="0.5" />
      </g>
    );
  }
  if (paint.bare) {
    return (
      <g className="city-tint">
        <g stroke={paint.trunk} strokeWidth="2.2" strokeLinecap="round" fill="none">
          <path d="M0 8 L0 -10 M0 -2 L-8 -10 M0 -4 L8 -12 M0 -8 L-5 -16 M0 -9 L6 -17" />
        </g>
        <g fill={SNOW} opacity="0.55">
          <circle cx="-7" cy="-10" r="2.6" />
          <circle cx="7" cy="-12" r="2.4" />
          <circle cx="0" cy="-15" r="2.2" />
        </g>
      </g>
    );
  }
  if (rank === 'far') {
    return (
      <g className="city-tint">
        <circle r="12" fill={base} />
        <circle cx="7" cy="-5" r="8" fill={paint.crownHigh} opacity="0.55" />
        <circle cx="-6" cy="2" r="7" fill={base} />
      </g>
    );
  }
  if (rank === 'mid') {
    return (
      <g className="city-tint">
        <circle r="13" fill={base} />
        <circle cx="7" cy="-5" r="9" fill={paint.crownHigh} opacity="0.7" />
        <circle cx="-7" cy="2" r="8" fill={paint.crownLow} />
      </g>
    );
  }
  return (
    <g className="city-tint">
      <circle r="14" fill={base} />
      <circle cx="8" cy="-6" r="10" fill={paint.crownHigh} />
      <circle cx="-8" cy="2" r="9" fill={paint.crownLow} />
      <circle cx="2" cy="-9" r="6" fill={paint.crownHigh} />
      <path d="M-11 5 Q-3 12 9 5" fill="none" stroke={paint.crownLow} strokeWidth="3" opacity=".55" strokeLinecap="round" />
      <path d="M-3 -13 Q3 -17 8 -12 M9 -7 q5 -2 7 2" fill="none" stroke={paint.groundLow} strokeWidth="1.5" opacity=".35" strokeLinecap="round" />
    </g>
  );
}

/**
 * A conifer, which is the one shape in this picture that is not soft circles.
 *
 * Three skirts of needles over a short trunk, each one wider than the one
 * above it, and the lit side taken off the same paint the round crowns use so
 * a pine belongs to the same afternoon as everything else. It keeps its
 * needles in the frost, because that is what a pine is for: in the winter
 * palette the beeches go to twigs and the pines are the only green left.
 */
export function Pine({ paint, rank }: { paint: TownPaint; rank: 'far' | 'mid' | 'near' }) {
  const base = rank === 'far' ? paint.crownFar : rank === 'mid' ? paint.crownMid : paint.crownNear;
  const lit = paint.crownHigh;
  const deep = paint.crownLow;
  return (
    <g className="city-tint">
      <rect x="-2" y="2" width="4" height="12" rx="1.6" fill={paint.trunk} />
      <path d="M0 -26 L9 -8 L-9 -8 Z" fill={base} />
      <path d="M0 -26 L9 -8 L0 -8 Z" fill={lit} opacity="0.55" />
      <path d="M0 -17 L12 4 L-12 4 Z" fill={base} />
      <path d="M0 -17 L12 4 L0 4 Z" fill={lit} opacity="0.45" />
      <path d="M0 -8 L14 8 L-14 8 Z" fill={deep} />
      <path d="M0 -8 L14 8 L0 8 Z" fill={base} opacity="0.9" />
      {paint.roofSnow && (
        <g fill={SNOW} opacity="0.75">
          <path d="M0 -26 L5 -14 L-5 -14 Z" />
          <path d="M0 -17 L7 -6 L-7 -6 Z" />
        </g>
      )}
    </g>
  );
}

/**
 * A wolf, drawn as an animal and not as somebody in a grey coat.
 *
 * Four legs, a level back, a tail that hangs and a head carried low in front
 * of the shoulders, which is the whole difference between a wolf and a dog at
 * this size. It faces whichever way it is walking, and the eye is the only
 * warm thing on it.
 */
export function Wolf({ paint, facing = 1, walking = false }: { paint: TownPaint; facing?: 1 | -1; walking?: boolean }) {
  const coat = '#6b665c';
  const back = '#575349';
  return (
    <g transform={facing === -1 ? 'scale(-1 1)' : undefined}>
      <Shade paint={paint} cy={9} rx={13} ry={3.5} />
      <g className={walking ? 'city-wolf-turn' : undefined}>
      <g stroke={back} strokeWidth="2.2" strokeLinecap="round">
        <g className={walking ? 'city-wolf-step' : undefined}>
          <line x1="-7" y1="3" x2="-8" y2="9" />
          <line x1="9" y1="3" x2="10" y2="9" />
        </g>
        <g className={walking ? 'city-wolf-step city-wolf-step-back' : undefined}>
          <line x1="-3" y1="3" x2="-2" y2="9" />
          <line x1="5" y1="3" x2="4" y2="9" />
        </g>
      </g>
      {/* the tail hangs: a wolf that is working does not wag */}
      <path d="M-9 -1 q-8 2 -10 8" stroke={coat} strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse rx="11" ry="5" fill={coat} />
      <path d="M-11 -2 q11 -5 22 0 q-11 3 -22 0 z" fill={back} opacity="0.7" />
      {/* the head, carried low and forward, and the ears on top of it */}
      <g transform="translate(11 -3)">
        <path d="M-3 -4 L-4 -9 L1 -6 Z" fill={back} />
        <path d="M2 -5 L3 -10 L6 -5 Z" fill={back} />
        <ellipse rx="5" ry="4" fill={coat} />
        <path d="M3 0 q6 0 7 2 q-6 2 -8 0 z" fill={back} />
        <circle cx="2" cy="-1" r="1.1" fill="#f0d488" />
      </g>
      </g>
    </g>
  );
}

/** A tree you can see the foot of: a trunk, a shadow, and a head on top. */
export function Tree({ paint, big = false }: { paint: TownPaint; big?: boolean }) {
  return (
    <g>
      <Shade paint={paint} cx={4} cy={16} rx={big ? 18 : 15} ry={5} />
      <rect
        x="-2.5"
        y={big ? 0 : 6}
        width="5"
        height="16"
        rx="2"
        fill={paint.trunk}
        className="city-tint"
      />
      <g transform={big ? 'translate(0 -8)' : undefined}>
        <g className="city-canopy">
          <Crown paint={paint} rank="near" />
        </g>
      </g>
    </g>
  );
}

export function Bush({ paint }: { paint: TownPaint }) {
  return (
    <g className="city-tint">
      <Shade paint={paint} cy={6} rx={11} ry={3.5} />
      <circle r="8" fill={paint.bushDark} />
      <circle cx="6" cy="-4" r="6" fill={paint.bushLight} />
      <circle cx="-6" cy="-1" r="5" fill={paint.bushDark} />
      {paint.roofSnow && (
        <g fill={SNOW} opacity="0.6">
          <ellipse cx="0" cy="-6" rx="7" ry="2.6" />
          <ellipse cx="7" cy="-8" rx="4" ry="2" />
        </g>
      )}
    </g>
  );
}

/**
 * Anybody at all. One dot is one person, and a person is a coat, a head and
 * the shadow they cast: the smallest thing in this picture that still reads
 * as somebody rather than as a mark.
 */
export function Person({
  paint,
  cloth,
  scale = 1,
}: {
  paint: TownPaint;
  cloth: string;
  scale?: number;
}) {
  return (
    <g transform={scale === 1 ? undefined : `scale(${scale})`}>
      <Shade paint={paint} cy={10} rx={5.5} ry={2.5} />
      <g className="city-breathe">
        <VillagerBody cloth={cloth} />
        <path d="M-3 0 l-1.1 4 M3 0 l1 3.4" fill="none" stroke={cloth} strokeWidth="1.8" strokeLinecap="round" />
      </g>
    </g>
  );
}

/** One readable silhouette, with a lit cheek and a fold in the coat. */
function VillagerBody({ cloth }: { cloth: string }) {
  return (
    <g>
      <path d="M-3 8.8 l-.5 1.3 h3 M1 8.8 l.2 1.3 h2.5" stroke={DOOR} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M-3.6 8.5 L-3 -1 Q0 -3.5 3 -1 L3.6 8.5 Q0 10 -3.6 8.5Z" fill={cloth} />
      <path d="M.5 -1 L1 8.6 Q2.4 9 3.6 8.5 L3 -1Z" fill={OUTLINE} opacity=".24" />
      <path d="M-2.2 -.6 L-2.7 6.8" stroke={GLOW} strokeWidth=".75" opacity=".25" strokeLinecap="round" />
      <path d="M-2.8 3 H3" stroke={DOOR} strokeWidth=".8" opacity=".65" />
      <path d="M-1.6 -2 L0 0 L1.6 -2" fill={GLOW} opacity=".8" />
      <circle cy="-6" r="3.6" fill="#d9bc93" />
      <ellipse cx="-.6" cy="-6.3" rx="2.8" ry="3.1" fill="#f0e3c6" />
      <path d="M-3.4 -6.8 Q-2.4 -10.3 .6 -9.4 Q3 -9.2 3.4 -7.2 Q.8 -8.6 -1.5 -7.6Z" fill={DOOR} />
      <circle cx="1.3" cy="-5.9" r=".45" fill={DOOR} />
    </g>
  );
}

/**
 * What a person is doing, which is the only thing this place has instead of a
 * list of jobs.
 *
 * A town seen from up here is not a crowd of identical dots drifting about:
 * it is a field with backs bent in it, a wood with somebody swinging at it, a
 * road with somebody under a load, a bank with a line in the water, and a
 * square where the ones with nothing to carry are arguing. Every figure is the
 * same coat and the same head as `Person`, and the job is told in three marks
 * and no more: how far the back is bent, what is in the hands, and the one
 * thing on the ground the hands are working at. At this size a fourth mark is
 * mud.
 */
export type Pose =
  | 'stand'
  | 'dig'
  | 'sow'
  | 'reap'
  | 'chop'
  | 'haul'
  | 'carry'
  | 'draw'
  | 'build'
  | 'tend'
  | 'fish';

/** A haft, an edge, and everything woven: the whole tool cupboard. */
const HAFT = '#6b573f';
const IRON = '#8f867a';
const STRAW = '#c9b184';

export function Worker({
  paint,
  cloth,
  pose,
  facing = 1,
}: {
  paint: TownPaint;
  cloth: string;
  pose: Pose;
  facing?: 1 | -1;
}) {
  if (pose === 'stand') return <Person paint={paint} cloth={cloth} />;

  /* The bend of the back is the half of a job that reads from the other side
     of a valley. A reaper is folded over the corn, a digger is over the spade,
     a sower walks upright with a hand out, and a fisher does not move at all. */
  const lean =
    pose === 'reap' ? 30 : pose === 'dig' ? 22 : pose === 'carry' ? 16 : pose === 'tend' ? 13 : 0;

  return (
    <g transform={facing === -1 ? 'scale(-1 1)' : undefined}>
      <Shade paint={paint} cy={10} rx={6} ry={2.5} />

      {/* what the hands are working at, which stays on the ground while the
          back over it moves */}
      {pose === 'chop' && (
        <g>
          <ellipse cx="8" cy="8" rx="3.6" ry="1.6" fill={TIMBER_DARK} />
          <path d="M4.4 8 h7.2 v2.6 q-3.6 1.4 -7.2 0 z" fill="#8a7256" />
        </g>
      )}
      {pose === 'build' && <rect x="2" y="8" width="11" height="2.4" rx="1.2" fill={TIMBER} />}
      {pose === 'reap' && (
        <g stroke={STRAW} strokeWidth="1" strokeLinecap="round" opacity="0.9">
          <line x1="6" y1="9" x2="12" y2="7.4" />
          <line x1="6" y1="10.6" x2="12" y2="9.4" />
        </g>
      )}

      <g transform={lean === 0 ? undefined : `rotate(${lean} 0 9)`}>
        {/* the sack rides on the back, so it goes on before the back does */}
        {pose === 'carry' && (
          <path
            d="M-3 -5 q-6 1 -6 6 q4 2.6 6 -0.6 z"
            fill={STRAW}
            stroke={HAFT}
            strokeWidth="0.7"
          />
        )}

        <VillagerBody cloth={cloth} />

        {/* out in the sun all day, and it is the one thing that says so */}
        {(pose === 'sow' || pose === 'reap' || pose === 'fish') && (
          <ellipse cy="-7.6" rx="5.4" ry="1.4" fill={STRAW} />
        )}

        {/* the spade, with a blade wide enough to be a blade */}
        {pose === 'dig' && (
          <g>
            <line
              x1="1"
              y1="-3"
              x2="8.6"
              y2="5.4"
              stroke={HAFT}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path d="M7.4 4.4 l4 2.2 l-2.2 3.8 l-3.6 -2.6 z" fill={IRON} />
          </g>
        )}

        {/* the arm out, the basket at the hip, and what leaves the hand */}
        {pose === 'sow' && (
          <g>
            <ellipse
              cx="-4.6"
              cy="2"
              rx="3.2"
              ry="2.6"
              fill={STRAW}
              stroke={HAFT}
              strokeWidth="0.7"
            />
            <line
              x1="2"
              y1="-2"
              x2="7"
              y2="-3.6"
              stroke={cloth}
              strokeWidth="1.9"
              strokeLinecap="round"
            />
            <g fill="#e2cb86" className="city-seed-cast">
              <circle cx="9.4" cy="-2.4" r="0.9" />
              <circle cx="11.4" cy="0.4" r="0.8" />
              <circle cx="8.6" cy="1.4" r="0.7" />
            </g>
          </g>
        )}

        {/* the sickle: the one tool in the place with a curve in it */}
        {pose === 'reap' && (
          <g fill="none" strokeLinecap="round">
            <line x1="1" y1="-2" x2="3.6" y2="0.4" stroke={HAFT} strokeWidth="1.5" />
            <path d="M3.4 0 q6 1.4 6.4 7" stroke={IRON} strokeWidth="1.4" />
          </g>
        )}

        {/* the hoe, which is a rake at this size and is meant to be */}
        {pose === 'tend' && (
          <g strokeLinecap="round">
            <line x1="1" y1="-2" x2="8.4" y2="5.4" stroke={HAFT} strokeWidth="1.3" />
            <g stroke={IRON} strokeWidth="0.9">
              <line x1="6.6" y1="5.6" x2="10.6" y2="7.4" />
              <line x1="7.6" y1="4.4" x2="8.2" y2="7.2" />
              <line x1="9.2" y1="5" x2="9.8" y2="7.8" />
            </g>
          </g>
        )}

        {/* the bucket, on the rope it came up on */}
        {pose === 'draw' && (
          <g className="city-draw-water">
            <line x1="2" y1="-3" x2="7.4" y2="-0.4" stroke={HAFT} strokeWidth="1" />
            <path d="M5.4 0 h5 l-0.9 4.8 h-3.2 z" fill={STRAW} stroke={HAFT} strokeWidth="0.7" />
            <path d="M5.4 0 q2.5 -2 5 0" fill="none" stroke={HAFT} strokeWidth="0.7" />
          </g>
        )}

        {/* the rod, and the line off the end of it going where lines go */}
        {pose === 'fish' && (
          <g strokeLinecap="round">
            <line x1="1" y1="-3.4" x2="12" y2="-11.6" stroke={HAFT} strokeWidth="1.1" />
            {/* the line has to reach the water, and the water is a body length
                out and downhill from the bank he is standing on */}
            <line
              x1="12"
              y1="-11.6"
              x2="22"
              y2="15"
              stroke="#dfe8e4"
              strokeWidth="0.6"
              opacity="0.85"
            />
            <circle cx="22" cy="15.4" r="1.1" fill="#e2cb86" />
            <ellipse cx="22" cy="16" rx="3.6" ry="1.1" fill="none" stroke="#d7e9df" strokeWidth=".65" className="city-water-glint" />
          </g>
        )}

        {/* the log, across the shoulder, which is the whole silhouette */}
        {pose === 'haul' && (
          <g>
            <line
              x1="-7.6"
              y1="-8.4"
              x2="9.4"
              y2="-10.4"
              stroke="#8a7256"
              strokeWidth="3.4"
              strokeLinecap="round"
            />
            <line
              x1="-6.6"
              y1="-9.2"
              x2="8.4"
              y2="-11"
              stroke={TIMBER_DARK}
              strokeWidth="1.1"
              strokeLinecap="round"
            />
            <line
              x1="1.6"
              y1="-2"
              x2="3.4"
              y2="-7"
              stroke={cloth}
              strokeWidth="1.9"
              strokeLinecap="round"
            />
          </g>
        )}
      </g>

      {/* the two jobs that are a swing, which is a thing the arm does and not
          a thing the back does */}
      {pose === 'chop' && (
        <g className="city-swing">
          <line
            x1="1"
            y1="-3"
            x2="7.6"
            y2="-10.6"
            stroke={HAFT}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M6.4 -12.4 l5 1.6 l-1.8 4 l-4 -2.8 z"
            fill={IRON}
            stroke={HAFT}
            strokeWidth="0.5"
          />
        </g>
      )}
      {pose === 'build' && (
        <g className="city-swing">
          <line
            x1="1"
            y1="-3.4"
            x2="6.6"
            y2="-8.8"
            stroke={HAFT}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <rect
            x="5.2"
            y="-12"
            width="5.2"
            height="3.6"
            rx="1.2"
            fill={TIMBER_DARK}
            stroke={HAFT}
            strokeWidth="0.5"
            transform="rotate(-42 7.8 -10.2)"
          />
        </g>
      )}
    </g>
  );
}

/**
 * A tent, which is what somebody sleeps under when the gate said no.
 *
 * Canvas over a ridge pole, a dark slit where the flap is, one guy rope pegged
 * out, and a shadow under it, because a tent standing on nothing floats the
 * same way a hut does.
 */
export function Tent({ paint, scale = 1 }: { paint: TownPaint; scale?: number }) {
  return (
    <g transform={scale === 1 ? undefined : `scale(${scale})`}>
      <Shade paint={paint} cx={2} cy={20} rx={20} ry={4} />
      <path
        d="M0 20 L14 -12 L28 20 Z"
        fill="#b3a184"
        stroke={OUTLINE}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M14 -12 L28 20 L20 20 Z" fill="#9c8b70" />
      <path d="M11 20 L14 4 L17 20 Z" fill={DOOR} />
      <line x1="14" y1="-13" x2="14" y2="-16" stroke={OUTLINE} strokeWidth="1.4" />
      <line x1="28" y1="18" x2="36" y2="21" stroke={OUTLINE} strokeWidth="1" />
      {paint.roofSnow && <path d="M6 6 L14 -12 L22 6 L14 1 Z" fill={SNOW} opacity="0.85" />}
    </g>
  );
}

/**
 * A hurdle: two rails between two posts, which is what a fence on a common
 * actually is. The line of them is drawn by whoever is fencing the meadow;
 * this is one panel of it.
 */
export function Hurdle({ paint, tilt = 0 }: { paint: TownPaint; tilt?: number }) {
  return (
    <g transform={tilt === 0 ? undefined : `rotate(${tilt})`}>
      <Shade paint={paint} cx={26} cy={15} rx={28} ry={3} />
      <g stroke={TIMBER_DARK} strokeWidth="2.6" strokeLinecap="round">
        <line x1="0" y1="-6" x2="52" y2="-6" />
        <line x1="0" y1="2" x2="52" y2="2" />
      </g>
      <g fill={TIMBER} stroke={OUTLINE} strokeWidth="0.8">
        <rect x="-2" y="-13" width="5" height="27" rx="2" />
        <rect x="49" y="-13" width="5" height="27" rx="2" />
      </g>
      {paint.roofSnow && (
        <g stroke={SNOW} strokeWidth="1.6" strokeLinecap="round" opacity="0.8">
          <line x1="0" y1="-7.5" x2="52" y2="-7.5" />
        </g>
      )}
    </g>
  );
}

/**
 * Somewhere to drink, which every settlement grows before it grows a hall.
 *
 * It is a hut with a sign on a bracket and a lit window, and the sign is the
 * whole of it: at this size a public house is a private house plus the fact
 * that a stranger knows to knock. Shuttered, the boards go over the door, the
 * window goes dark, and the sign is still hanging there, which is the part
 * that reads as closed rather than gone.
 */
export function Tavern({ paint, shuttered }: { paint: TownPaint; shuttered: boolean }) {
  return (
    <g>
      <Shade paint={paint} cx={38} cy={57} rx={50} ry={7} />
      <rect
        x="0"
        y="26"
        width="76"
        height="30"
        rx="2"
        fill="#bda487"
        stroke={OUTLINE}
        strokeWidth="1.2"
      />
      <path
        d="M6 0 h64 l8 26 h-80 z"
        fill="#8a6b4e"
        stroke={OUTLINE}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <line x1="6" y1="0" x2="70" y2="0" stroke={TIMBER_DARK} strokeWidth="1.6" />
      <rect x="30" y="38" width="16" height="18" rx="2" fill={DOOR} />
      <rect
        x="54"
        y="34"
        width="14"
        height="12"
        rx="2"
        fill={shuttered ? '#5d4d3b' : '#f0d488'}
        opacity={shuttered ? 1 : 0.9}
      />
      {/* the boards, and the reason anybody knew to come here in the first place */}
      {shuttered && (
        <g stroke="#6f5b45" strokeWidth="3" strokeLinecap="round">
          <path d="M26 40 l24 14 M50 40 l-24 14" />
        </g>
      )}
      <g>
        <path d="M76 12 h13" stroke={OUTLINE} strokeWidth="1.6" strokeLinecap="round" />
        <line x1="87" y1="12" x2="87" y2="17" stroke={OUTLINE} strokeWidth="1" />
        <rect
          x="80"
          y="17"
          width="15"
          height="12"
          rx="2"
          fill={TIMBER}
          stroke={OUTLINE}
          strokeWidth="1"
        />
        {/* a mug, painted by somebody who could not paint */}
        <path d="M84 21 h5 v6 h-5 z" fill={shuttered ? '#8a7256' : '#a04a3c'} />
      </g>
      {paint.roofSnow && <path d={roofCap(-2, 38, 78, 26, 0)} fill={SNOW} opacity="0.9" />}
    </g>
  );
}

/**
 * The swarm that came up the valley on Tuesday and chose the one roof nobody
 * can spare.
 *
 * A hanging mass under the eaves and a handful of them off it in the air. It
 * is drawn as a thing that lives there rather than as a cloud of dots: the
 * comb is the shape, and the ones on the wing are what make the shape move.
 */
export function Swarm({ paint }: { paint: TownPaint }) {
  return (
    <g>
      <path
        d="M-13 0 q13 -7 26 0 q-2 15 -13 22 q-11 -7 -13 -22 z"
        fill="#8a6a33"
        stroke="#6b5127"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path d="M-8 3 q8 -4 16 0 q-1 9 -8 14 q-7 -5 -8 -14 z" fill="#a3823f" opacity="0.85" />
      <g fill="#6b5127">
        {[
          [-20, -6],
          [18, -9],
          [24, 6],
          [-22, 9],
          [4, -13],
        ].map(([x, y], i) => (
          <g
            key={i}
            className="city-toil"
            style={
              {
                animationDuration: `${1.6 + i * 0.4}s`,
                animationDelay: `-${i * 0.5}s`,
              } as CSSProperties
            }
          >
            <ellipse cx={x} cy={y} rx="1.7" ry="1.1" />
          </g>
        ))}
      </g>
      {paint.roofSnow && <ellipse cy="-2" rx="12" ry="3" fill={SNOW} opacity="0.5" />}
    </g>
  );
}

/**
 * A trestle with the day's bread on it, and nothing on it by ten.
 *
 * The queue that forms in front of this is people, drawn as people; the board
 * is what tells you the queue is for bread and not for a hanging.
 */
export function BreadBoard({ paint }: { paint: TownPaint }) {
  return (
    <g>
      <Shade paint={paint} cy={9} rx={22} ry={3.5} />
      <rect
        x="-20"
        y="-4"
        width="40"
        height="6"
        rx="2"
        fill={TIMBER}
        stroke={OUTLINE}
        strokeWidth="1"
      />
      <g stroke={OUTLINE} strokeWidth="2" strokeLinecap="round">
        <line x1="-15" y1="2" x2="-17" y2="9" />
        <line x1="15" y1="2" x2="17" y2="9" />
      </g>
      <g fill="#c69a52" stroke="#a37c3f" strokeWidth="0.8">
        <ellipse cx="-10" cy="-7" rx="6" ry="3.4" />
        <ellipse cx="2" cy="-7" rx="6" ry="3.4" />
        <ellipse cx="-4" cy="-11" rx="5.4" ry="3" />
      </g>
    </g>
  );
}

/** Four legs and a bad idea, out on the near meadow. */
export function Goat({ paint }: { paint: TownPaint }) {
  return (
    <g>
      <Shade paint={paint} cy={8} rx={7} ry={2} />
      <g stroke="#7a6a52" strokeWidth="1.4" strokeLinecap="round">
        <line x1="-4" y1="3" x2="-4" y2="8" />
        <line x1="4" y1="3" x2="4" y2="8" />
      </g>
      <ellipse rx="7" ry="4" fill="#efe6cd" />
      <circle cx="8" cy="-3" r="2.6" fill="#efe6cd" />
      <line x1="8" y1="-5" x2="10" y2="-9" stroke="#7a6a52" strokeWidth="1" strokeLinecap="round" />
    </g>
  );
}

/**
 * An apple tree, and then some apples.
 *
 * The place had a wood, a meadow and a field and nothing anybody had planted
 * on purpose, so a basket of apples in the road came from nowhere. Three of
 * these stand above the field now: a shorter, rounder head than the wood has,
 * a trunk that forks, and fruit in it, because a tree with nothing on it is
 * just a small tree.
 */
export function AppleTree({ paint, fruit = true }: { paint: TownPaint; fruit?: boolean }) {
  return (
    <g>
      <Shade paint={paint} cy={2} rx={13} ry={4} />
      <path d="M-1.6 2 v-13 M-1 -7 l-5 -5 M-1 -9 l5 -6" stroke="#6b573f" strokeWidth="2.4"
        fill="none" strokeLinecap="round" />
      <g fill={paint.crownNear}>
        <circle cx="-8" cy="-17" r="8.5" />
        <circle cx="7" cy="-19" r="9.5" />
        <circle cx="0" cy="-25" r="8" />
        <circle cx="-2" cy="-13" r="8" />
      </g>
      <g fill={paint.crownFar} opacity=".45">
        <circle cx="6" cy="-14" r="6" />
        <circle cx="-9" cy="-21" r="5" />
      </g>
      {fruit && (
        <g fill="#c1503f">
          <circle cx="-9" cy="-13" r="1.7" />
          <circle cx="4" cy="-11" r="1.6" />
          <circle cx="10" cy="-21" r="1.7" />
          <circle cx="-4" cy="-24" r="1.5" />
          <circle cx="-13" cy="-19" r="1.5" />
        </g>
      )}
    </g>
  );
}

/**
 * The dog. Not the wolf, and the difference has to read at this size: it is
 * shorter in the body, the head is up rather than carried out in front, and
 * the tail is the whole argument, because it is the only thing in the picture
 * that is up and moving.
 */
export function TownDog({ paint }: { paint: TownPaint }) {
  const coat = '#8a7a5e';
  const back = '#6f6149';
  return (
    <g>
      <Shade paint={paint} cy={6} rx={8} ry={2.4} />
      <g stroke={back} strokeWidth="1.6" strokeLinecap="round">
        <line x1="-4" y1="2" x2="-4.6" y2="6" />
        <line x1="5" y1="2" x2="5.6" y2="6" />
      </g>
      {/* up, and not still */}
      <path d="M-5.6 -1 q-5 -1 -5.6 -6" stroke={coat} strokeWidth="2.2" fill="none"
        strokeLinecap="round" className="city-tail" />
      <ellipse rx="7" ry="3.4" fill={coat} />
      <g transform="translate(7 -4.6)">
        <ellipse rx="3.4" ry="3" fill={coat} />
        <path d="M-3 -2 L-3.6 -6 L0 -3.6 Z" fill={back} />
        <path d="M1.6 -2.4 L2.4 -6 L4 -2.6 Z" fill={back} />
        <path d="M2.4 0.6 q3.4 0 4 1.6 q-3.4 1.4 -4.6 0 z" fill={back} />
        <circle cx="1.6" cy="-0.6" r="0.8" fill="#2b241b" />
      </g>
    </g>
  );
}

/**
 * The woodcutter's cabin: a low shed, a lean-to over a saw pit and a stack of
 * cut lengths beside it. Everything about it is horizontal, because the wood
 * is what it is for and the wood is lying down.
 */
export function Woodcutter({ paint, level = 1 }: { paint: TownPaint; level?: number }) {
  return (
    <g>
      <Shade paint={paint} cy={40} rx={44} ry={9} />
      {/* the stack, which grows with the floors */}
      <g>
        {Array.from({ length: Math.min(3, level) }, (_, i) => (
          <g key={i} transform={`translate(${52 + i * 3} ${30 - i * 7})`}>
            <rect x="-6" y="0" width="26" height="6" rx="3" fill="#8a7256" />
            <ellipse cx="-6" cy="3" rx="2.6" ry="3" fill={TIMBER_DARK} />
            <ellipse cx="20" cy="3" rx="2.6" ry="3" fill={TIMBER_DARK} />
          </g>
        ))}
      </g>
      {/* the shed */}
      <path d="M4 8 h48 l10 14 h-68 z" fill={paint.roofSnow ? '#dae5df' : '#7d6448'} />
      <rect x="-6" y="22" width="68" height="20" rx="2" fill={TIMBER} stroke={OUTLINE} strokeWidth="1.1" />
      <rect x="-6" y="22" width="68" height="20" rx="2" fill="#000" opacity=".07" />
      <rect x="16" y="27" width="13" height="15" rx="1.5" fill="#4a3d2c" />
      {/* the lean-to over the saw pit, and the saw in it */}
      <path d="M62 24 h20 l-2 10 h-18 z" fill={paint.roofSnow ? '#dae5df' : '#6f5a41'} />
      <line x1="64" y1="34" x2="64" y2="42" stroke="#6b573f" strokeWidth="2" />
      <line x1="80" y1="34" x2="80" y2="42" stroke="#6b573f" strokeWidth="2" />
      <line x1="64" y1="38" x2="80" y2="38" stroke={IRON} strokeWidth="1.6" />
      {/* the chips, which is what a place like this leaves on the ground */}
      <g fill="#a58f6c" opacity=".7">
        <ellipse cx="34" cy="44" rx="3" ry="1.2" />
        <ellipse cx="46" cy="46" rx="2.4" ry="1" />
        <ellipse cx="22" cy="47" rx="2.6" ry="1.1" />
      </g>
    </g>
  );
}

/** A year that came in, stacked where it grew. */
export function Hay({ paint }: { paint: TownPaint }) {
  return (
    <g>
      <Shade paint={paint} cx={2} cy={2} rx={30} ry={6} />
      <path
        d="M-28 0 q28 -46 56 0 z"
        fill={paint.roofSnow ? '#dcd6c2' : '#d9c37f'}
        stroke="#b09b5f"
        strokeWidth="1.2"
        strokeLinejoin="round"
        className="city-tint"
      />
      {paint.roofSnow && <path d="M-19 -16 q19 -22 38 0 q-19 -8 -38 0 z" fill={SNOW} opacity="0.85" />}
    </g>
  );
}

/** Somebody is in there, and warm. */
export function Smoke({ delay = '0s' }: { delay?: string }) {
  return (
    <g className="city-smoke" style={{ animationDelay: delay } as CSSProperties}>
      <path d="M-4 2 Q-9 -3 -3 -7 Q3 -12 6 -5 Q10 2 3 5Z" fill="#f2f4f0" opacity=".32" />
    </g>
  );
}

/**
 * Snow along a long roof ridge, following the upper third of its slope.
 * These roofs have a horizontal ridge, so a triangular patch reads as a
 * separate little roof. The lower edge sags between the rafters instead.
 */
function roofCap(left: number, ridgeX: number, right: number, eaves: number, ridge: number): string {
  const inset = (right - left) * .1;
  const y = ridge + (eaves - ridge) * .34;
  const lx = left + inset * .66;
  const rx = right - inset * .66;
  return `M${left + inset} ${ridge} H${right - inset} L${rx} ${y} Q${(rx + ridgeX) / 2} ${y + 3} ${ridgeX} ${y} T${lx} ${y + 1.5}Z`;
}

/**
 * A roof anybody lives under. Two kinds, because a street of one hut repeated
 * is a wallpaper: the second is a shade darker and a little lower.
 */
export function Hut({ paint, kind = 0 }: { paint: TownPaint; kind?: 0 | 1 }) {
  const wall = kind === 0 ? TIMBER : '#b69e78';
  const roof = kind === 0 ? '#9a7d5c' : '#87694f';
  const ridge = kind === 0 ? '#b39a75' : '#a58a68';
  return (
    <g>
      <Shade paint={paint} cx={30} cy={55} rx={44} ry={7} />
      <rect x="-2" y="24" width="64" height="30" rx="2" fill={wall} stroke={OUTLINE} strokeWidth="1.2" />
      <path d="M46 25 H61 V53 H46Z" fill={TIMBER_DARK} opacity=".65" />
      <path d="M1 29 H59 M1 51 H60 M7 29 V51 M48 29 V51" stroke={OUTLINE} strokeWidth="1.3" opacity=".5" />
      <path d="M-1 24 H62 V29 H-1Z" fill={DOOR} opacity=".23" />
      <rect x="23" y="36" width="14" height="18" rx="2" fill={DOOR} />
      <path d="M29 38 V52" stroke={TIMBER_DARK} strokeWidth="1" opacity=".5" />
      <circle cx="33" cy="46" r=".9" fill={TIMBER} />
      <rect x="7" y="34" width="10" height="10" rx="1.4" fill={DOOR} />
      <rect x="8.5" y="35" width="7" height="7" rx=".8" fill={paint.roofSnow ? '#efd290' : '#cfba81'} />
      <path d="M12 35 V43 M8 39 H16" stroke={OUTLINE} strokeWidth="1" />
      {paint.roofSnow && <ellipse cx="12" cy="39" rx="13" ry="10" fill="#f2cb7c" opacity=".08" className="city-window" />}
      <rect x="21" y="54" width="18" height="3" rx="1.3" fill={paint.rock} />
      <path d="M40 -7 H48 V11 H40Z" fill={TIMBER_DARK} stroke={OUTLINE} strokeWidth="1" />
      <rect x="39" y="-8" width="10" height="3" rx="1" fill={paint.rock} />
      <path d="M5 0 h50 l7 24 h-64 z" fill={roof} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M6 6 H55 M3 12 H57 M1 18 H59" stroke={ridge} strokeWidth="1.1" opacity=".5" />
      <path d="M15 1 L11 23 M31 1 L30 23 M46 1 L49 23" stroke={DOOR} strokeWidth=".8" opacity=".24" />
      <line x1="5" y1="0" x2="55" y2="0" stroke={ridge} strokeWidth="1.6" />
      {paint.roofSnow && <path d="M5 0 H55 L57 7 Q44 10 32 7 T2 9Z" fill={SNOW} opacity=".9" />}
    </g>
  );
}

/** The biggest roof, in the colour of the seal, with the bell and the steps. */
export function Hall({ paint, level }: { paint: TownPaint; level: number }) {
  return (
    <g>
      <Shade paint={paint} cx={66} cy={70} rx={86} ry={9} />
      {level >= 2 && (
        <>
          <rect x="58" y="-34" width="14" height="34" rx="3" fill="#8e4438" stroke="#7b4038" strokeWidth="1" />
          <circle cx="65" cy="-22" r="5" fill="#c25a4a" />
        </>
      )}
      <rect x="-4" y="28" width="140" height="36" rx="2" fill={TIMBER} stroke={OUTLINE} strokeWidth="1.3" />
      <path d="M-2 33 H134 M5 34 V62 M44 34 V62 M88 34 V62 M127 34 V62" stroke={OUTLINE} strokeWidth="2" opacity=".45" />
      <rect x="54" y="42" width="24" height="22" rx="2" fill={DOOR} />
      <rect x="16" y="40" width="16" height="14" rx="2" fill="#f0d488" opacity="0.85" />
      <rect x="100" y="40" width="16" height="14" rx="2" fill="#f0d488" opacity="0.85" />
      <path d="M8 0 h116 l12 28 h-140 z" fill="#a04a3c" stroke="#7b4038" strokeWidth="1.3" strokeLinejoin="round" />
      <line x1="8" y1="0" x2="124" y2="0" stroke="#c05a48" strokeWidth="2" />
      <path d="M7 8 H126 M3 17 H130" stroke="#c8785a" strokeWidth="1.4" opacity=".4" />
      <path d="M24 41 V53 M17 47 H31 M108 41 V53 M101 47 H115" stroke={OUTLINE} strokeWidth="1.2" />
      {level >= 3 && (
        <g>
          <path d="M28 -12 l10 -14 l10 14 z" fill="#a04a3c" stroke="#7b4038" strokeWidth="1" />
          <rect x="34" y="-12" width="8" height="14" rx="2" fill="#8e4438" />
        </g>
      )}
      <rect x="46" y="64" width="40" height="5" rx="2.5" fill="#c2b9ab" />
      <rect x="42" y="69" width="48" height="5" rx="2.5" fill="#b0a698" />
      {paint.roofSnow && <path d={roofCap(-4, 66, 136, 28, 0)} fill={SNOW} opacity="0.9" />}
    </g>
  );
}

/** Somewhere to put a good year, with sacks against it. */
export function Granary({ paint, level }: { paint: TownPaint; level: number }) {
  return (
    <g>
      <Shade paint={paint} cx={56} cy={62} rx={72} ry={8} />
      <rect x="-4" y="26" width="120" height="34" rx="2" fill="#b69e78" stroke={OUTLINE} strokeWidth="1.3" />
      <path d="M-1 32 H113 M-1 55 H113 M5 32 V59 M55 32 V59 M108 32 V59" stroke={OUTLINE} strokeWidth="1.5" opacity=".48" />
      <rect x="14" y="38" width="22" height="22" rx="2" fill={DOOR} />
      <rect x="78" y="38" width="22" height="22" rx="2" fill={DOOR} />
      <path d="M8 0 h100 l8 26 h-120 z" fill="#7c6047" stroke={OUTLINE} strokeWidth="1.3" strokeLinejoin="round" />
      <line x1="8" y1="0" x2="108" y2="0" stroke={TIMBER_DARK} strokeWidth="1.6" />
      <path d="M7 8 H109 M3 17 H112 M18 41 L32 56 M82 41 L96 56" stroke={TIMBER} strokeWidth="1.1" opacity=".36" />
      {level >= 2 && (
        <g fill="#d9c37f" stroke="#b09b5f" strokeWidth="1">
          <ellipse cx="48" cy="56" rx="7" ry="5" />
          <ellipse cx="62" cy="58" rx="7" ry="5" />
          <ellipse cx="55" cy="49" rx="6.5" ry="4.5" />
        </g>
      )}
      {paint.roofSnow && <path d={roofCap(-4, 56, 116, 26, 0)} fill={SNOW} opacity="0.9" />}
    </g>
  );
}

/** Low and long, at the edge of the wood: beds for the sick. */
export function LongRoom({ paint, level }: { paint: TownPaint; level: number }) {
  const w = level >= 3 ? 168 : level >= 2 ? 152 : 136;
  return (
    <g>
      <Shade paint={paint} cx={w / 2} cy={49} rx={w * 0.6} ry={7} />
      <rect x="-2" y="22" width={w} height="26" rx="2" fill={TIMBER} stroke={OUTLINE} strokeWidth="1.2" />
      <rect x={w / 2 - 8} y="32" width="16" height="16" rx="2" fill={DOOR} />
      {[14, 34, w - 48, w - 28].map((x) => (
        <g key={x}>
          <rect x={x} y="31" width="10" height="9" rx="1.4" fill="#d8c493" stroke={OUTLINE} strokeWidth="1" />
          <path d={`M${x + 5} 32 V40`} stroke={OUTLINE} strokeWidth="1" />
        </g>
      ))}
      <path
        d={`M6 0 h${w - 16} l8 22 h${-w} z`}
        fill="#87694f"
        stroke={OUTLINE}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <line x1="6" y1="0" x2={w - 10} y2="0" stroke={TIMBER_DARK} strokeWidth="1.6" />
      {paint.roofSnow && <path d={roofCap(-2, w / 2, w - 2, 22, 0)} fill={SNOW} opacity="0.9" />}
    </g>
  );
}

/** Men with pikes, and somewhere to keep them. */
export function WatchHouse({ paint, level }: { paint: TownPaint; level: number }) {
  return (
    <g>
      <Shade paint={paint} cx={30} cy={55} rx={44} ry={7} />
      <rect x="-2" y="24" width="64" height="30" rx="2" fill="#a89578" stroke={OUTLINE} strokeWidth="1.2" />
      <rect x="23" y="36" width="14" height="18" rx="2" fill={DOOR} />
      <path d="M5 0 h50 l7 24 h-64 z" fill="#6f6152" stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
      <line x1="5" y1="0" x2="55" y2="0" stroke={TIMBER_DARK} strokeWidth="1.6" />
      {level >= 2 && (
        <g>
          <rect x="66" y="6" width="18" height="48" rx="3" fill="#a89578" stroke={OUTLINE} strokeWidth="1.2" />
          <path d="M64 6 h22 l-11 -14 z" fill="#6f6152" stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
        </g>
      )}
      {level >= 3 && (
        <g stroke="#5c7f86" strokeWidth="2.4" strokeLinecap="round">
          <line x1="-10" y1="54" x2="-10" y2="30" />
          <line x1="-16" y1="54" x2="-16" y2="34" />
        </g>
      )}
      {paint.roofSnow && <path d={roofCap(-2, 30, 62, 24, 0)} fill={SNOW} opacity="0.9" />}
    </g>
  );
}

/** Clean water, in the middle of the square. */
export function Well({ paint, level }: { paint: TownPaint; level: number }) {
  return (
    <g>
      <Shade paint={paint} cy={10} rx={24} ry={7} />
      <ellipse rx="17" ry="8" fill={paint.waterLight} stroke={TIMBER} strokeWidth="5" className="city-tint" />
      <rect x="-19" y="-24" width="5" height="24" rx="2" fill="#9a7d5c" />
      <rect x="14" y="-24" width="5" height="24" rx="2" fill="#9a7d5c" />
      <rect x="-24" y="-28" width="48" height="5" rx="2.5" fill={TIMBER} />
      {level >= 2 && (
        <>
          <rect x="-3" y="-27" width="6" height="12" rx="2" fill="#7b6449" />
          <rect x="-6" y="-16" width="12" height="9" rx="2" fill="#9a7d5c" stroke={OUTLINE} strokeWidth="0.8" />
        </>
      )}
      {paint.roofSnow && <ellipse cy="-29" rx="24" ry="3" fill={SNOW} opacity="0.85" />}
    </g>
  );
}

/** The far bank stops being a day away and starts being the far bank. */
export function Bridge({ paint, level }: { paint: TownPaint; level: number }) {
  return (
    <g transform="rotate(42)">
      <Shade paint={paint} cy={10} rx={60} ry={20} />
      <path d="M-30 17 Q0 50 30 17 Z" fill={paint.waterDeep} className="city-tint" />
      <rect x="-60" y="-17" width="120" height="34" rx="3" fill={TIMBER_DIM} stroke={OUTLINE} strokeWidth="1.2" />
      <g stroke="#95805f" strokeWidth="1.6" opacity="0.9">
        <line x1="-38" y1="-17" x2="-38" y2="17" />
        <line x1="-19" y1="-17" x2="-19" y2="17" />
        <line x1="0" y1="-17" x2="0" y2="17" />
        <line x1="19" y1="-17" x2="19" y2="17" />
        <line x1="38" y1="-17" x2="38" y2="17" />
      </g>
      <rect x="-60" y="-24" width="120" height="7" rx="3" fill={TIMBER} />
      <rect x="-60" y="17" width="120" height="7" rx="3" fill="#95805f" />
      {level >= 2 && (
        <g stroke={TIMBER} strokeWidth="3" strokeLinecap="round">
          <line x1="-50" y1="-24" x2="-50" y2="-34" />
          <line x1="-25" y1="-24" x2="-25" y2="-34" />
          <line x1="0" y1="-24" x2="0" y2="-34" />
          <line x1="25" y1="-24" x2="25" y2="-34" />
          <line x1="50" y1="-24" x2="50" y2="-34" />
          <line x1="-50" y1="-34" x2="50" y2="-34" />
          <line x1="-50" y1="24" x2="-50" y2="34" />
          <line x1="-25" y1="24" x2="-25" y2="34" />
          <line x1="0" y1="24" x2="0" y2="34" />
          <line x1="25" y1="24" x2="25" y2="34" />
          <line x1="50" y1="24" x2="50" y2="34" />
          <line x1="-50" y1="34" x2="50" y2="34" />
        </g>
      )}
      {paint.roofSnow && <rect x="-60" y="-24" width="120" height="6" rx="3" fill={SNOW} opacity="0.8" />}
    </g>
  );
}

/**
 * The line between the place and everything else, with the gate the road comes
 * through. A hamlet has no such line; the year somebody raises one is the year
 * the place decides it has an inside.
 */
export function Fence({ paint, level, closed }: { paint: TownPaint; level: number; closed: boolean }) {
  return (
    <g>
      <g stroke={TIMBER_DARK} strokeWidth="4" strokeLinecap="round">
        <line x1="0" y1="4" x2="172" y2="0" />
        <line x1="224" y1="0" x2="454" y2="6" />
        {level >= 2 && (
          <>
            <line x1="-96" y1="14" x2="0" y2="4" />
            <line x1="454" y1="6" x2="546" y2="18" />
          </>
        )}
      </g>
      <g fill={TIMBER} stroke={OUTLINE} strokeWidth="0.8">
        <rect x="0" y="-8" width="6" height="22" rx="2" />
        <rect x="88" y="-9" width="6" height="22" rx="2" />
        <rect x="166" y="-14" width="9" height="32" rx="3" />
        <rect x="220" y="-14" width="9" height="32" rx="3" />
        <rect x="332" y="-7" width="6" height="22" rx="2" />
        <rect x="448" y="-5" width="6" height="22" rx="2" />
      </g>
      {closed && (
        <g fill="#8a7256" stroke={OUTLINE} strokeWidth="1">
          <rect x="172" y="-12" width="52" height="26" rx="3" />
        </g>
      )}
      {paint.roofSnow && (
        <g stroke={SNOW} strokeWidth="2" strokeLinecap="round" opacity="0.8">
          <line x1="0" y1="1" x2="172" y2="-3" />
          <line x1="224" y1="-3" x2="454" y2="3" />
        </g>
      )}
    </g>
  );
}

/**
 * The ground under the plough, one worked patch per year spent on it.
 *
 * A place that has never broken ground has no field, and draws none: the
 * dashed patch is the *next* one, an offer made to somebody who has already
 * taken the first, and on an untouched valley it read as a bald patch of dirt
 * nobody had asked for. It comes back the moment the year of work is
 * considering a field, because that is the one moment it means something.
 *
 * And a field is not finished the day it is paid for. In the year it is being
 * broken the newest patch is turned earth with the furrows coming across it
 * from the near end, which is what breaking ground looks like from up here.
 */
export function Fields({
  paint,
  level,
  ghost = false,
  breaking = false,
}: {
  paint: TownPaint;
  level: number;
  /** The year of work has a field under the pointer, so show where it lands. */
  ghost?: boolean;
  /** This year's field is being turned over rather than standing finished. */
  breaking?: boolean;
}) {
  /**
   * Three strips and no more.
   *
   * The furrows used to run from the crag most of the way to the square, which
   * made the harvest the biggest single thing in the picture and left the west
   * of the place with no ground anybody could build on. They are worked at the
   * same three levels; they are simply a field beside a settlement now rather
   * than a settlement in the corner of a field.
   */
  const patches: string[] = [
    '300,312 452,306 460,362 294,368',
    '294,374 462,366 470,422 288,428',
    '288,434 470,426 478,476 282,482',
  ];
  /** The near end of a quad, as far across it as the plough has got. */
  const broken = (points: string, share: number): string => {
    const p = points.split(' ').map((pair) => pair.split(',').map(Number));
    const at = (a: number[], b: number[]) => [
      a[0] + (b[0] - a[0]) * share,
      a[1] + (b[1] - a[1]) * share,
    ];
    const topMid = at(p[0], p[1]);
    const lowMid = at(p[3], p[2]);
    return [p[0], topMid, lowMid, p[3]].map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  };

  /** How many patches stand finished, and which one is under the plough. */
  const done = breaking ? Math.max(0, level - 1) : level;
  const turning = breaking && level > 0 ? patches[level - 1] : null;
  const offering = !breaking && level < patches.length && (level > 0 || ghost);

  return (
    <g>
      {patches.map((points, i) => {
        if (i >= done) return null;
        return (
          <polygon
            key={i}
            points={points}
            fill="url(#rows)"
            stroke={OUTLINE}
            strokeWidth="1.4"
            strokeLinejoin="round"
            className="city-tint"
          />
        );
      })}

      {/* the one being turned over: bare earth, with the furrows arriving */}
      {turning && (
        <g>
          <polygon
            points={turning}
            fill={paint.fieldSoil}
            stroke={OUTLINE}
            strokeWidth="1.4"
            strokeLinejoin="round"
            className="city-tint"
          />
          <polygon points={broken(turning, 0.55)} fill="url(#rows)" className="city-tint" />
          <polyline
            points={broken(turning, 0.55).split(' ').slice(1, 3).join(' ')}
            fill="none"
            stroke={OUTLINE}
            strokeWidth="1.2"
            strokeDasharray="5 4"
            opacity="0.7"
          />
        </g>
      )}

      {offering && (
        <polygon
          points={patches[level]}
          fill={paint.fieldSoil}
          opacity="0.4"
          stroke={OUTLINE}
          strokeWidth="1.4"
          strokeDasharray="7 5"
          strokeLinejoin="round"
        />
      )}
      {level > 0 && (
        <rect x="282" y="486" width="198" height="6" rx="3" fill={OUTLINE} opacity="0.35" />
      )}
      {paint.sheaves && done > 0 && (
        <g>
          {[312, 348, 384].slice(0, done + 1).map((x, i) => (
            <g key={x} transform={`translate(${x} ${492 + i * 6})`}>
              <Shade paint={paint} cy={2} rx={13} ry={4} />
              <path
                d="M-11 0 q11 -22 22 0 z"
                fill="#d9c37f"
                stroke="#b09b5f"
                strokeWidth="1.1"
                strokeLinejoin="round"
              />
            </g>
          ))}
        </g>
      )}
    </g>
  );
}

/** Stone now, and whatever is under the stone later. It costs backs. */
export function MineMouth({ level }: { level: number }) {
  return (
    <g>
      <path d="M-22 22 L-22 0 Q0 -22 22 0 L22 22 Z" fill="#4b4238" />
      <path d="M-22 22 L-22 6 Q0 -12 22 6 L22 22 Z" fill="#332d26" />
      {level >= 2 && (
        <g>
          <rect x="-26" y="18" width="52" height="6" rx="3" fill={TIMBER_DIM} stroke={OUTLINE} strokeWidth="0.8" />
          <g fill="#8f867a">
            <circle cx="-34" cy="26" r="6" />
            <circle cx="-24" cy="32" r="5" />
            <circle cx="34" cy="28" r="6" />
          </g>
        </g>
      )}
    </g>
  );
}

/**
 * The five works that are not a building, in the year somebody is making them.
 *
 * A hall goes up inside a frame, and the frame says "a hall is happening here"
 * better than any label could. A road, a bridge, a fence, a field and a hole in
 * a rock have no frame to stand in, so for nine acts they simply appeared,
 * whole, the morning after they were paid for. These are what each of them
 * looks like while it is being made: a line pegged out, two piles and a plank,
 * posts without their rails, half a patch turned over, and a face of rock with
 * a stage against it. Every one of them is the same warm outline and the same
 * shadow as the finished thing, so the year of work reads as a year and not as
 * a gap.
 */

/** A stake in the ground with the line tied to it, which is how a road starts. */
export function Peg({ paint }: { paint: TownPaint }) {
  return (
    <g>
      <Shade paint={paint} cy={7} rx={4} ry={1.6} />
      <rect x="-1.4" y="-9" width="2.8" height="16" rx="1.2" fill={TIMBER} stroke={OUTLINE} strokeWidth="0.7" />
      <path d="M-1.4 -9 q1.4 -3 2.8 0 z" fill="#c96a5a" />
    </g>
  );
}

/** Two piles in the water, a plank over them, and a rope to hold. */
export function BridgeWorks({ paint }: { paint: TownPaint }) {
  return (
    <g transform="rotate(42)">
      <Shade paint={paint} cy={10} rx={54} ry={16} />
      {/* what has been driven into the bed, and the ring each one made */}
      <g>
        {[-38, -12, 14, 40].map((x, i) => (
          <g key={x}>
            <ellipse cx={x} cy={i % 2 ? 6 : -4} rx="9" ry="3.4" fill={paint.waterLight} opacity="0.7" />
            <rect
              x={x - 3}
              y={(i % 2 ? 6 : -4) - 22}
              width="6"
              height="24"
              rx="2"
              fill={TIMBER_DIM}
              stroke={OUTLINE}
              strokeWidth="1"
            />
          </g>
        ))}
      </g>
      {/* one plank across, which is a crossing and not yet a bridge */}
      <rect x="-56" y="-8" width="112" height="7" rx="3" fill={TIMBER} stroke={OUTLINE} strokeWidth="1" />
      <path
        d="M-56 -20 q28 6 56 0 q28 -6 56 0"
        fill="none"
        stroke="#95805f"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </g>
  );
}

/**
 * The posts are in and the rails are not. A fence is a day of digging and a
 * week of arguing about where the gate goes.
 */
export function FenceWorks({ paint, level }: { paint: TownPaint; level: number }) {
  const posts = level >= 2 ? [-96, 0, 88, 166, 220, 332, 448, 546] : [0, 88, 166, 220, 332, 448];
  return (
    <g>
      <g fill={TIMBER} stroke={OUTLINE} strokeWidth="0.8">
        {posts.map((x) => (
          <g key={x}>
            <Shade paint={paint} cx={x + 3} cy={16} rx={7} ry={2.4} />
            <rect x={x} y={x === 166 || x === 220 ? -14 : -8} width={x === 166 || x === 220 ? 9 : 6} height={x === 166 || x === 220 ? 32 : 24} rx="2" />
          </g>
        ))}
      </g>
      {/* the rails, still on the ground where the cart left them */}
      <g transform="translate(268 24)">
        <Shade paint={paint} cx={22} cy={6} rx={30} ry={4} />
        <g stroke={TIMBER_DARK} strokeWidth="3.4" strokeLinecap="round">
          <line x1="0" y1="0" x2="46" y2="-2" />
          <line x1="2" y1="5" x2="48" y2="3" />
        </g>
      </g>
    </g>
  );
}

/**
 * A face of rock with a stage against it, a ladder, and the first cartload of
 * what came out. Nobody is through yet: the hole is a scrape.
 */
export function MineWorks({ paint }: { paint: TownPaint }) {
  return (
    <g>
      <path d="M-16 22 L-16 8 Q0 -6 16 8 L16 22 Z" fill="#4b4238" opacity="0.75" />
      {/* the stage they are standing on to reach the face */}
      <g stroke={TIMBER_DIM} strokeWidth="3" strokeLinecap="round">
        <line x1="-26" y1="22" x2="-26" y2="-6" />
        <line x1="26" y1="22" x2="26" y2="-6" />
        <line x1="-28" y1="-6" x2="28" y2="-6" />
        <line x1="-26" y1="8" x2="26" y2="8" />
        <line x1="-26" y1="-6" x2="26" y2="8" />
      </g>
      {/* the ladder up to it */}
      <g stroke={TIMBER} strokeWidth="2" strokeLinecap="round">
        <line x1="-34" y1="22" x2="-28" y2="-6" />
        <line x1="-28" y1="22" x2="-22" y2="-6" />
        <line x1="-33" y1="16" x2="-27" y2="16" />
        <line x1="-31" y1="8" x2="-25" y2="8" />
        <line x1="-30" y1="0" x2="-24" y2="0" />
      </g>
      {/* and what has come out of it so far, which is stone and not much else */}
      <g fill="#8f867a">
        <Shade paint={paint} cx={36} cy={26} rx={16} ry={4} />
        <circle cx="32" cy="22" r="6" />
        <circle cx="42" cy="25" r="5" />
        <circle cx="37" cy="16" r="4.5" />
      </g>
    </g>
  );
}

/**
 * A thing the years have not paid for yet, drawn where it would stand and
 * breathing until somebody does. The question "what does this change" gets
 * answered in the place it changes.
 */
export function Ghost({ children }: { children: ReactNode }) {
  return (
    <g className="city-ghost" aria-hidden>
      <g fill="none" stroke={GLOW} strokeWidth="1.8" strokeDasharray="7 5" strokeLinejoin="round" opacity="0.75">
        {children}
      </g>
    </g>
  );
}

/** The frame that stands on a site for the one year the work is being done. */
export function Scaffold({ paint }: { paint: TownPaint }) {
  return (
    <g>
      <Shade paint={paint} cy={6} rx={40} ry={6} />
      <g stroke={TIMBER_DIM} strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M-30 6 L-24 -34 M30 6 L24 -34 M-24 -34 L24 -34 M-27 -14 L27 -14 M-30 6 L24 -34 M30 6 L-24 -34" />
      </g>
      {/* the stack that has not gone into it yet, at the foot of the frame */}
      <g stroke={OUTLINE} strokeWidth="0.9">
        <rect x="-44" y="0" width="22" height="4" rx="2" fill={TIMBER} />
        <rect x="-42" y="-4" width="22" height="4" rx="2" fill={TIMBER_DIM} />
      </g>
    </g>
  );
}

/**
 * A building going up, rather than a building that has appeared.
 *
 * The thing itself is drawn whole and then hidden behind a window that climbs
 * it: what is below the window is finished, what is above it is not there yet,
 * so a year of work reads as courses of wall arriving from the ground up. The
 * frame stands round it the whole time, and the window climbs again, because
 * a year is long and nobody watches the whole of it in one sitting.
 *
 * The clip window is a rectangle carrying its own animation, so the transform
 * on it is the animation's and nothing else's: an id per site keeps two sites
 * raising at once from sharing one window.
 */
export function Raising({
  paint,
  id,
  children,
  frame = { x: 40, y: 54, s: 1 },
  height = 200,
}: {
  paint: TownPaint;
  id: string;
  children: ReactNode;
  /** The foot of the frame, in the coordinates the building is drawn in. */
  frame?: { x: number; y: number; s: number };
  height?: number;
}) {
  const clip = `raise-${id}`;
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <rect
            className="city-raise"
            x="-260"
            y={-height}
            width="620"
            height={height + 80}
            style={{ '--raise': `${height + 80}px` } as CSSProperties}
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>{children}</g>
      <g transform={`translate(${frame.x} ${frame.y}) scale(${frame.s})`}>
        <Scaffold paint={paint} />
      </g>
    </g>
  );
}
