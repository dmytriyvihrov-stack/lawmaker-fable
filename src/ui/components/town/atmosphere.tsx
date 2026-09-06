import type { CSSProperties } from 'react';
import type { TownPaint } from './paint';

// The same centreline as the crossing and fishing spots. Bank details are
// measured from it, so reeds cannot drift into the water when the view crops.
const BENDS = [
  [1440, 380, 1300, 402, 1180, 436, 1090, 482],
  [1090, 482, 1000, 528, 930, 556, 850, 584],
  [850, 584, 790, 606, 746, 684, 716, 820],
];
const RIVER = 'M1440 380 C1300 402 1180 436 1090 482 C1000 528 930 556 850 584 C790 606 746 684 716 820';

function riverPoint(bend: number, t: number, offset = 0) {
  const [x0, y0, x1, y1, x2, y2, x3, y3] = BENDS[bend];
  const u = 1 - t;
  const x = u ** 3 * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t ** 3 * x3;
  const y = u ** 3 * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t ** 3 * y3;
  const dx = 3 * u * u * (x1 - x0) + 6 * u * t * (x2 - x1) + 3 * t * t * (x3 - x2);
  const dy = 3 * u * u * (y1 - y0) + 6 * u * t * (y2 - y1) + 3 * t * t * (y3 - y2);
  const length = Math.hypot(dx, dy);
  return { x: x - dy / length * offset, y: y + dx / length * offset };
}

/** Broad washes give the open ground a slope without inventing a built field. */
export function GroundWashes({ paint }: { paint: TownPaint }) {
  return (
    <g aria-hidden pointerEvents="none" className="city-tint">
      <path d="M0 284 Q320 228 590 288 T1100 280 L1440 236 V356 Q1110 300 850 350 T0 356Z" fill={paint.groundLow} opacity=".17" />
      <path d="M0 438 Q248 390 530 472 T1110 420 L1440 466 V516 Q1080 470 780 518 T0 506Z" fill={paint.hills} opacity=".12" />
      <path d="M0 674 Q240 588 566 648 L638 820 H0Z" fill={paint.groundTop} opacity=".12" />
      <path d="M954 686 Q1160 574 1440 616 V820 H852Z" fill={paint.groundLow} opacity=".25" />
      <path d="M40 532 Q246 486 426 522 M1020 642 Q1220 572 1410 608 M64 682 Q250 638 438 674" fill="none" stroke={paint.groundLow} strokeWidth="3" opacity=".26" strokeLinecap="round" />
    </g>
  );
}

/**
 * Current, shallow edges, and a few reeds rooted in the bank.
 *
 * In the long winter the same river is a lid. The water goes to a flat pale
 * plate with a dark seam down the middle where the ice is thin, snow lies on
 * it in drifts along the banks, nothing glints and nothing flows: the same
 * shape, standing still, which is what a frozen river is.
 */
export function River({ paint }: { paint: TownPaint }) {
  const frozen = paint.ice;
  return (
    <g aria-hidden pointerEvents="none" className="city-tint">
      <defs>
        <linearGradient id="river-depth" x1="0" y1="0" x2=".35" y2="1">
          <stop stopColor={paint.waterDeep} />
          <stop offset=".52" stopColor={paint.waterLight} />
          <stop offset="1" stopColor={paint.waterDeep} />
        </linearGradient>
      </defs>
      <g fill="none" strokeLinecap="round">
        <path d={RIVER} stroke={paint.shade} strokeWidth="76" opacity=".16" />
        <path d={RIVER} stroke={paint.roofSnow ? '#e1e8dc' : paint.road} strokeWidth="66" opacity=".66" />
        <path data-river="water" d={RIVER} stroke={paint.waterDeep} strokeWidth="60" />
        <path d={RIVER} stroke="url(#river-depth)" strokeWidth="48" />
        <path d={RIVER} stroke={paint.waterLight} strokeWidth="34" opacity={frozen ? '.7' : '.38'} />
        {frozen ? (
          <>
            {/* the seam down the middle, where the ice is thinnest and darkest */}
            <path d={RIVER} stroke="#7c919a" strokeWidth="2" strokeDasharray="34 18 12 40" opacity=".5" />
            {/* and the cracks that run off it */}
            <g stroke="#7c919a" strokeWidth="1.2" opacity=".55" strokeLinecap="round">
              {Array.from({ length: 9 }, (_, i) => {
                const bend = Math.floor(i / 3);
                const at = riverPoint(bend, ((i % 3) + .5) / 3, ((i * 11) % 17) - 8);
                const dir = i % 2 ? 1 : -1;
                return (
                  <path
                    key={i}
                    d={`M${at.x} ${at.y} l${9 * dir} ${-6} l${7 * dir} ${2} M${at.x} ${at.y} l${-6 * dir} ${8}`}
                  />
                );
              })}
            </g>
          </>
        ) : (
          <path d={RIVER} stroke="#d5e9e5" strokeWidth="1.5" strokeDasharray="22 46 7 70" opacity=".45" className="city-current" />
        )}
      </g>
      {frozen
        ? Array.from({ length: 12 }, (_, i) => {
            // snow lies on the ice in drifts along both banks, never in the seam
            const bend = Math.floor(i / 4);
            const at = riverPoint(bend, ((i % 4) + .5) / 4, i % 2 ? 19 : -19);
            return (
              <ellipse
                key={i}
                cx={at.x}
                cy={at.y}
                rx={14 + ((i * 5) % 9)}
                ry={3.2}
                fill="#f2f6f4"
                opacity=".8"
              />
            );
          })
        : Array.from({ length: 18 }, (_, i) => {
            const bend = Math.floor(i / 6);
            const at = riverPoint(bend, ((i % 6) + .5) / 6, ((i * 7) % 25) - 12);
            return (
              <g key={i} transform={`translate(${at.x} ${at.y})`}>
                <path d="M-5 0 q5 -1.8 10 0 M-2 3 h5" fill="none" stroke="#d7e9df" strokeWidth="1" className="city-water-glint" style={{ animationDelay: `-${i * .7}s` }} />
              </g>
            );
          })}
      {Array.from({ length: 14 }, (_, i) => {
        // Leave the bridge and the three fishing seats unobstructed.
        const bend = i < 6 ? 0 : 2;
        const at = riverPoint(bend, .16 + (i % 7) * .1, i % 2 ? 39 : -39);
        return (
          <g key={i} transform={`translate(${at.x} ${at.y})`}>
            <ellipse rx="8" ry="2.2" fill={paint.shade} opacity=".16" />
            <g className="city-reeds" style={{ animationDelay: `-${i * .6}s` }} stroke={paint.roofSnow ? paint.trunk : paint.crownNear} strokeWidth="1.4" strokeLinecap="round" fill="none">
              <path d="M-3 0 q1 -6 -3 -11 M0 1 q-1 -9 2 -16 M3 0 q0 -5 5 -9" />
              <path d="M2 -15 v-4" stroke={paint.roofSnow ? '#dae5df' : '#a38a57'} strokeWidth="2.8" />
            </g>
            <ellipse cx="9" cy="1" rx="3.8" ry="2" fill={paint.rock} opacity=".65" />
          </g>
        );
      })}
    </g>
  );
}

/** Handfuls of grass, with quiet gaps left for the eye and for the cards. */
export function MeadowDetails({ paint }: { paint: TownPaint }) {
  return (
    <g aria-hidden pointerEvents="none">
      {Array.from({ length: 54 }, (_, i) => {
        const right = i % 3 === 0;
        const x = right ? 1010 + (i * 83) % 420 : 26 + (i * 97) % 570;
        const y = 555 + (i * 61) % 255;
        const scale = .7 + (y - 540) / 320;
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${scale})`} opacity={paint.roofSnow ? .24 : .38}>
            <g className={i % 4 === 0 ? 'city-reeds' : undefined} style={{ animationDelay: `-${i % 7}s` } as CSSProperties}>
              <path d="M-5 0 q1 -4 -2 -6 M0 1 q0 -7 2 -10 M4 0 q0 -3 3 -5" fill="none" stroke={paint.roofSnow ? paint.crownFar : paint.crownNear} strokeWidth="1.2" strokeLinecap="round" />
              {paint.meadow === 'flowers' && i % 3 === 1 && (
                <g fill={i % 2 ? '#f6e4b0' : '#edc2b8'}>
                  <circle cx="2" cy="-10" r="2" /><circle cx="-6" cy="-6" r="1.6" />
                </g>
              )}
            </g>
          </g>
        );
      })}
    </g>
  );
}
