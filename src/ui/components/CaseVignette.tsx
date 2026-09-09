/**
 * A small drawn scene for each case, in the same flat ink style as the town.
 * No words in here: the drawing is the witness, the text does the talking.
 */

const INK = 'var(--color-parchment-dim)';
const SOFT = 'var(--color-ink-line)';
const SEAL = 'var(--color-seal)';
const GLOW = 'var(--color-parchment)';

interface Props {
  caseId: string;
  size?: number;
}

export function CaseVignette({ caseId, size = 84 }: Props) {
  const art = ART[caseId];
  if (!art) return null;
  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      aria-hidden
      className="block shrink-0 rounded-md border border-ink-line bg-ink"
      preserveAspectRatio="xMidYMid meet"
    >
      {art}
    </svg>
  );
}

const ART: Record<string, JSX.Element> = {
  // the morning after the wind: posts down along the whole run, and the one
  // stretch by the gate standing straight, with a stool at the end of it
  r1_tam_fed: (
    <g>
      <path d="M6 84 h84" stroke={SOFT} strokeWidth="3" />
      <g stroke={INK} strokeWidth="3" strokeLinecap="round">
        <path d="M14 84 L26 60" />
        <path d="M34 84 L30 62" />
        <path d="M46 84 L60 66" />
      </g>
      <path d="M24 66 L44 72 M30 74 L52 78" stroke={SOFT} strokeWidth="2" strokeLinecap="round" />
      <g stroke={GLOW} strokeWidth="3" strokeLinecap="round">
        <path d="M66 84 V54 M78 84 V52 M90 84 V54" />
        <path d="M64 62 H92 M64 72 H92" strokeWidth="2.2" />
      </g>
      <rect x="54" y="74" width="9" height="3" fill={SEAL} opacity="0.9" />
      <path d="M56 77 V84 M61 77 V84" stroke={SEAL} strokeWidth="1.6" />
    </g>
  ),

  // the same morning with nothing standing: every post down, the goats through
  // the gap, and a pair of folded arms at the end of the run
  r1_tam_cut: (
    <g>
      <path d="M6 84 h84" stroke={SOFT} strokeWidth="3" />
      <g stroke={INK} strokeWidth="3" strokeLinecap="round">
        <path d="M14 84 L26 60" />
        <path d="M34 84 L30 62" />
        <path d="M50 84 L62 64" />
        <path d="M70 84 L66 62" />
      </g>
      <path d="M24 66 L44 72 M56 70 L74 76" stroke={SOFT} strokeWidth="2" strokeLinecap="round" />
      <g fill={GLOW} opacity="0.8">
        <ellipse cx="42" cy="50" rx="7" ry="4" />
        <circle cx="50" cy="47" r="2.6" />
        <ellipse cx="60" cy="42" rx="6" ry="3.4" />
        <circle cx="67" cy="40" r="2.2" />
      </g>
      <path d="M86 84 V58" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <circle cx="86" cy="52" r="5" fill={INK} />
      <path d="M79 66 H93" stroke={SEAL} strokeWidth="2.6" strokeLinecap="round" />
    </g>
  ),

  // the strip by the stream, with a line walked across it and a mattock at the
  // near end: hers, or half hers, or not
  r2_marta_kept: (
    <g>
      <path d="M8 88 q40 -10 80 0" stroke={SOFT} strokeWidth="3" fill="none" />
      <path d="M12 80 q40 -8 76 0" stroke={GLOW} strokeWidth="1.4" opacity="0.5" />
      <path d="M14 72 q40 -8 70 0" stroke={GLOW} strokeWidth="1.4" opacity="0.5" />
      <path d="M18 64 q36 -8 62 0" stroke={GLOW} strokeWidth="1.4" opacity="0.5" />
      <path d="M52 56 L46 90" stroke={SEAL} strokeWidth="2" strokeDasharray="4 3" />
      <path d="M8 40 q44 -12 80 4" stroke={INK} strokeWidth="6" fill="none" opacity="0.6" />
      <path d="M24 88 L30 58" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M22 60 h14 v5 h-14 z" fill={INK} />
    </g>
  ),

  /**
   * The mill that was built on her ground, and the strip in front of it that
   * she has not planted since.
   *
   * It was a bare spoked circle over a line, which is a cart wheel lying in a
   * field. A mill is a house with a wheel hanging off the side of it and
   * water running under that, and none of the three was drawn.
   */
  r2_marta_moved: (
    <g>
      {/* the leat, running under the wheel and away */}
      <path d="M2 62 q22 6 44 2 q24 -4 48 4" stroke={SOFT} strokeWidth="7" fill="none" opacity="0.7" />
      <path d="M2 62 q22 6 44 2 q24 -4 48 4" stroke={GLOW} strokeWidth="1.2" fill="none" opacity="0.35" />

      {/* the mill house: a stone foot, a timber upper floor and a long roof */}
      <path d="M44 26 L66 10 L88 26 Z" fill={INK} opacity="0.85" />
      <rect x="48" y="26" width="36" height="34" fill="none" stroke={INK} strokeWidth="2.4" />
      <path d="M48 44 h36" stroke={INK} strokeWidth="1.6" opacity="0.7" />
      {/* the sack door on the upper floor, which is the whole point of a mill */}
      <rect x="60" y="30" width="12" height="11" fill={INK} opacity="0.7" />
      <path d="M66 22 h12" stroke={INK} strokeWidth="2" />
      <path d="M76 22 v6" stroke={SOFT} strokeWidth="1.6" />
      {/* and the door at the bottom of it */}
      <rect x="62" y="48" width="10" height="12" fill={SOFT} opacity="0.8" />

      {/* the wheel, hung off the near end and standing in the water */}
      <circle cx="34" cy="52" r="17" fill="none" stroke={GLOW} strokeWidth="2.4" />
      <circle cx="34" cy="52" r="4" fill="none" stroke={GLOW} strokeWidth="1.6" />
      <g stroke={GLOW} strokeWidth="1.4" opacity="0.9">
        <path d="M17 52 H51 M34 35 V69 M22 40 L46 64 M46 40 L22 64" />
      </g>
      {/* the paddles on the rim, which are what the water pushes */}
      <g stroke={GLOW} strokeWidth="2.6" strokeLinecap="round" opacity="0.75">
        <path d="M34 35 v5 M51 52 h-5 M34 69 v-5 M17 52 h5" />
      </g>
      {/* the launder bringing the water on to the top of it */}
      <path d="M6 40 L26 40 L30 44" stroke={INK} strokeWidth="2.6" fill="none" strokeLinejoin="round" />

      {/* her strip, unploughed: the ridges of a field nobody has turned over,
          and the boundary peg still standing at the near end of it */}
      <path d="M4 92 q44 -8 88 0" stroke={SOFT} strokeWidth="3" fill="none" />
      <g stroke={SOFT} strokeWidth="1.2" opacity="0.55">
        <path d="M10 84 q40 -6 76 0 M14 76 q36 -5 66 0" />
      </g>
      <path d="M20 92 V70" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M14 72 h12 v4 h-12 z" fill={SEAL} opacity="0.85" />
    </g>
  ),

  /**
   * The year the mill was a stake in her ground and not a mill yet: four pegs
   * across a strip in crop, and the frame of the thing they are for standing
   * behind it with a wheel that has nothing to turn in.
   */
  v3_millwright: (
    <g>
      {/* the stream it wants, which is why it wants this ground */}
      <path d="M2 30 q24 8 46 2 q26 -6 46 4" stroke={SOFT} strokeWidth="6" fill="none" opacity="0.6" />

      {/* the frame: two posts, a beam, and the wheel hub set on it */}
      <g stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none">
        <path d="M52 58 V26 M84 58 V26 M50 26 H86" />
        <path d="M52 40 L84 26 M84 40 L52 26" strokeWidth="1.4" opacity="0.6" />
      </g>
      <circle cx="68" cy="46" r="10" fill="none" stroke={GLOW} strokeWidth="2" />
      <path d="M58 46 H78 M68 36 V56" stroke={GLOW} strokeWidth="1.4" />

      {/* her strip, in crop, with the line of pegs walked across it */}
      <path d="M4 92 q44 -8 88 0" stroke={SOFT} strokeWidth="3" fill="none" />
      <g stroke={GLOW} strokeWidth="1.3" opacity="0.5">
        <path d="M8 84 q42 -7 80 0 M12 76 q38 -6 70 0 M16 68 q34 -5 60 0" />
      </g>
      <g stroke={SEAL} strokeWidth="2.2" strokeLinecap="round">
        <path d="M30 90 V74 M42 87 V71 M54 85 V69 M66 84 V68" />
      </g>
      <path d="M30 76 L66 70" stroke={SEAL} strokeWidth="1.4" strokeDasharray="4 3" />
    </g>
  ),

  // a spade standing in ground that will not take it, and a fire beside it
  v5_winter_ground: (
    <g>
      <path d="M8 84 h80" stroke={SOFT} strokeWidth="3" />
      <path d="M8 78 h80" stroke={GLOW} strokeWidth="1.4" opacity="0.5" strokeDasharray="5 4" />
      <path d="M30 78 L34 30" stroke={INK} strokeWidth="2.6" />
      <path d="M26 26 h16 v10 q-8 6 -16 0 z" fill={INK} />
      <path d="M58 78 q4 -14 10 -19 q-2 9 4 12 q6 4 3 12 q-3 8 -10 8 q-9 0 -7 -13 z" fill={SEAL} opacity="0.85" />
      <path d="M52 78 h26" stroke={SOFT} strokeWidth="2" />
      <g stroke={GLOW} strokeWidth="0.9" opacity="0.7">
        <path d="M16 20 l3 4" />
        <path d="M50 16 l3 4" />
        <path d="M78 24 l3 4" />
      </g>
    </g>
  ),

  // a gatepost, a coat with a name in it, and the road running off
  v6_road_dead: (
    <g>
      <path d="M8 84 h80" stroke={SOFT} strokeWidth="3" />
      <path d="M60 84 L88 58" stroke={SOFT} strokeWidth="2" strokeDasharray="6 5" />
      <rect x="40" y="26" width="6" height="58" fill={INK} />
      <path d="M46 34 h30" stroke={SOFT} strokeWidth="2.2" />
      <path d="M46 48 h30" stroke={SOFT} strokeWidth="2.2" />
      <path d="M14 82 q2 -16 14 -16 q12 0 14 16 z" fill={INK} opacity="0.85" />
      <circle cx="28" cy="60" r="6" fill={INK} />
      <rect x="22" y="70" width="12" height="9" fill={SEAL} opacity="0.8" />
      <path d="M24 74 h8" stroke={GLOW} strokeWidth="0.9" />
    </g>
  ),

  // a basket in a ring of them, and a fence post between two strips
  v7_beeches: (
    <g>
      <path d="M8 84 h80" stroke={SOFT} strokeWidth="3" />
      <path d="M50 84 V44" stroke={SOFT} strokeWidth="2.2" strokeDasharray="5 4" />
      <g fill={SEAL}>
        <path d="M14 70 q6 -9 12 0 z" />
        <path d="M30 76 q6 -9 12 0 z" />
        <path d="M62 72 q6 -9 12 0 z" />
        <path d="M76 78 q5 -8 10 0 z" />
      </g>
      <g stroke={INK} strokeWidth="1.6">
        <path d="M20 70 v6" />
        <path d="M36 76 v5" />
        <path d="M68 72 v6" />
        <path d="M81 78 v4" />
      </g>
      <path d="M20 52 h22 l-3 14 h-16 z" fill={INK} opacity="0.8" />
      <path d="M22 52 q9 -12 18 0" stroke={INK} strokeWidth="1.6" fill="none" />
      <g fill={SEAL} opacity="0.9">
        <circle cx="27" cy="58" r="2.4" />
        <circle cx="34" cy="60" r="2.4" />
      </g>
    </g>
  ),

  // one bed, one candle, and a list held by somebody standing up
  v8_long_night: (
    <g>
      <path d="M8 84 h80" stroke={SOFT} strokeWidth="3" />
      <rect x="10" y="62" width="44" height="6" fill={INK} />
      <path d="M10 68 v14" stroke={INK} strokeWidth="2.4" />
      <path d="M54 68 v14" stroke={INK} strokeWidth="2.4" />
      <rect x="10" y="54" width="12" height="8" rx="2" fill={SOFT} />
      <path d="M24 62 q14 -6 28 0 z" fill={SOFT} />
      <rect x="66" y="34" width="4" height="18" fill={SOFT} />
      <path d="M68 34 q4 -6 0 -10 q-4 4 0 10 z" fill={SEAL} />
      <circle cx="80" cy="52" r="6" fill={INK} />
      <path d="M72 60 h16 l3 22 h-22 z" fill={INK} opacity="0.8" />
      <rect x="60" y="62" width="10" height="13" fill={GLOW} opacity="0.55" />
    </g>
  ),

  // a bed in a corner, a window with the light in it, and a chair pulled up
  w_corner: (
    <g>
      <path d="M8 84 h80" stroke={SOFT} strokeWidth="3" />
      <path d="M8 84 V20 h50" stroke={SOFT} strokeWidth="2" fill="none" />
      <rect x="20" y="28" width="20" height="18" fill={SEAL} opacity="0.35" />
      <rect x="20" y="28" width="20" height="18" fill="none" stroke={SOFT} strokeWidth="1.2" />
      <path d="M30 28 v18" stroke={SOFT} strokeWidth="1" />
      <rect x="14" y="64" width="46" height="6" fill={INK} />
      <path d="M14 70 v12" stroke={INK} strokeWidth="2.4" />
      <path d="M60 70 v12" stroke={INK} strokeWidth="2.4" />
      <rect x="14" y="55" width="14" height="9" rx="2.5" fill={SOFT} />
      <circle cx="21" cy="59" r="3.4" fill={GLOW} opacity="0.8" />
      <path d="M30 64 q16 -7 30 0 z" fill={SOFT} />
      <g stroke={INK} strokeWidth="2" fill="none">
        <path d="M72 82 V60" />
        <path d="M86 82 V60" />
        <path d="M72 68 h14" />
        <path d="M72 60 h14" />
      </g>
    </g>
  ),

  // nine of them in a yard, in daylight, with nothing in their hands
  x_square: (
    <g>
      <path d="M8 84 h80" stroke={SOFT} strokeWidth="3" />
      <g fill={INK}>
        <circle cx="20" cy="46" r="5" />
        <path d="M14 53 h12 l3 29 h-18 z" />
        <circle cx="34" cy="43" r="5" />
        <path d="M28 50 h12 l3 32 h-18 z" />
        <circle cx="48" cy="46" r="5" />
        <path d="M42 53 h12 l3 29 h-18 z" />
      </g>
      <circle cx="70" cy="40" r="6" fill={SEAL} />
      <path d="M63 48 h14 l4 34 h-22 z" fill={SEAL} opacity="0.85" />
      <rect x="64" y="56" width="12" height="15" fill="var(--color-ink)" />
      <g stroke={GLOW} strokeWidth="0.9">
        <path d="M66 60 h8" />
        <path d="M66 63 h8" />
        <path d="M66 66 h6" />
      </g>
    </g>
  ),

  // one bag, one bottle, and a fence between him and the rest of it
  w_brother: (
    <g>
      <path d="M8 84 h80" stroke={SOFT} strokeWidth="3" />
      <g stroke={SOFT} strokeWidth="2.4">
        <path d="M46 84 V44" />
        <path d="M18 58 H46" />
        <path d="M18 70 H46" />
      </g>
      <circle cx="66" cy="34" r="9" fill={INK} />
      <path d="M55 45 h22 l4 37 h-30 z" fill={INK} opacity="0.8" />
      <path d="M78 52 q7 4 5 14 q-2 8 -8 6" stroke={INK} strokeWidth="2.4" fill="none" />
      <rect x="80" y="64" width="9" height="14" rx="2" fill={SEAL} />
      <rect x="82.5" y="60" width="4" height="5" fill={SEAL} />
      <path d="M28 74 h12 l2 8 h-16 z" fill={SOFT} />
    </g>
  ),

  // a black shape in a field, and somebody sitting on the step of it
  w_brother_fire: (
    <g>
      <path d="M8 84 h80" stroke={SOFT} strokeWidth="3" />
      <path d="M18 82 V48 l22 -16 l22 16 V82 z" fill="var(--color-ink)" stroke={SOFT} strokeWidth="1.6" />
      <path d="M40 32 l22 16 V82" stroke={SOFT} strokeWidth="1.6" fill="none" />
      <g fill={SEAL}>
        <path d="M30 46 q4 -12 10 -16 q-2 8 4 12 q5 4 3 12 q-2 8 -9 8 q-9 0 -8 -16 z" opacity="0.9" />
      </g>
      <path d="M36 24 q3 -6 1 -10" stroke={SEAL} strokeWidth="1.4" fill="none" opacity="0.6" />
      <circle cx="76" cy="62" r="6" fill={INK} />
      <path d="M69 70 h14 l2 12 h-18 z" fill={INK} opacity="0.8" />
    </g>
  ),

  // a board on three legs, and the hill on it
  w_brother_easel: (
    <g>
      <path d="M8 84 h80" stroke={SOFT} strokeWidth="3" />
      <g stroke={SOFT} strokeWidth="2.2" fill="none">
        <path d="M22 82 L34 40" />
        <path d="M50 82 L38 40" />
        <path d="M36 82 V58" />
      </g>
      <rect x="20" y="34" width="32" height="26" fill={INK} opacity="0.35" stroke={SOFT} strokeWidth="1.4" />
      <path d="M21 55 L30 43 L37 52 L44 40 L51 55 z" fill={SEAL} opacity="0.8" />
      <circle cx="72" cy="40" r="8" fill={INK} />
      <path d="M62 50 h20 l4 32 h-28 z" fill={INK} opacity="0.8" />
      <path d="M62 56 L52 50" stroke={INK} strokeWidth="2.2" />
      <circle cx="50" cy="49" r="2.2" fill={GLOW} />
    </g>
  ),
  // a coat on a peg, and a smaller shape wearing one just like it
  c1_lark: (
    <g>
      <rect x="10" y="20" width="34" height="4" rx="2" fill={SOFT} />
      <rect x="24" y="24" width="4" height="6" fill={SOFT} />
      <path d="M18 30 h20 l6 26 h-32 z" fill={INK} opacity="0.35" />
      <circle cx="70" cy="34" r="9" fill={INK} />
      <path d="M58 46 h24 l4 34 h-32 z" fill={SEAL} opacity="0.75" />
      <path d="M70 46 v34" stroke={GLOW} strokeWidth="1.5" />
      <path d="M8 88 h80" stroke={SOFT} strokeWidth="3" />
    </g>
  ),

  // two hats on one table: the mask with nothing in it, the worm hat heavy
  s1_worms: (
    <g>
      <path d="M8 80 h80" stroke={SOFT} strokeWidth="3" />
      <path d="M14 78 q0 -14 14 -14 q14 0 14 14 z" fill={INK} opacity="0.7" />
      <path d="M22 50 q6 -10 12 0 q-6 6 -12 0 z" fill={GLOW} opacity="0.6" />
      <circle cx="25" cy="49" r="1.3" fill="var(--color-ink)" />
      <circle cx="31" cy="49" r="1.3" fill="var(--color-ink)" />
      <path d="M52 78 q0 -14 16 -14 q16 0 16 14 z" fill={INK} />
      <circle cx="62" cy="66" r="3.6" fill={SEAL} />
      <circle cx="70" cy="63" r="3.6" fill={SEAL} opacity="0.8" />
      <circle cx="77" cy="67" r="3.6" fill={SEAL} />
      <path d="M60 40 q6 -8 12 0 q6 8 12 0" stroke={SEAL} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <circle cx="84" cy="40" r="1.6" fill={SEAL} />
    </g>
  ),

  // a lute, a hat, and the verse with your name in it, underlined twice
  s2_ballad: (
    <g>
      <ellipse cx="34" cy="62" rx="16" ry="13" fill={INK} />
      <circle cx="34" cy="62" r="4" fill="var(--color-ink)" />
      <rect x="46" y="20" width="4" height="40" fill={INK} transform="rotate(28 48 40)" />
      <path d="M30 50 l10 22" stroke={GLOW} strokeWidth="1" opacity="0.6" />
      <path d="M62 84 q0 -10 12 -10 q12 0 12 10 z" fill={INK} opacity="0.7" />
      <rect x="58" y="18" width="30" height="34" rx="2" fill={SOFT} />
      <path d="M62 26 h22 M62 32 h16 M62 38 h22 M62 44 h12" stroke={INK} strokeWidth="2" />
      <path d="M62 34 h16 M62 46 h12" stroke={SEAL} strokeWidth="1.4" />
    </g>
  ),

  // two milestones, the far field, and a pony with a small rider between them
  w_race: (
    <g>
      <path d="M4 82 q44 -8 88 0" stroke={SOFT} strokeWidth="3" fill="none" />
      <rect x="12" y="60" width="6" height="20" rx="1.5" fill={GLOW} opacity="0.8" />
      <rect x="80" y="58" width="6" height="22" rx="1.5" fill={GLOW} opacity="0.8" />
      <ellipse cx="48" cy="70" rx="14" ry="7" fill={INK} />
      <path d="M60 68 l6 -8 l3 5 l-3 6 z" fill={INK} />
      <path d="M38 76 v8 M44 76 v8 M52 76 v8 M58 76 v8" stroke={INK} strokeWidth="2.4" />
      <path d="M34 70 q-6 2 -6 8" stroke={INK} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="47" cy="56" r="4.4" fill={SEAL} />
      <path d="M43 60 h8 l1 8 h-10 z" fill={SEAL} opacity="0.85" />
      <path d="M70 20 v18 M66 24 l4 -4 l4 4" stroke={GLOW} strokeWidth="1.6" fill="none" opacity="0.7" />
    </g>
  ),

  // the eave of the long house, a comb hanging under it, and the air busy
  w_bees: (
    <g>
      <path d="M4 40 L48 12 L92 40 Z" fill={SOFT} />
      <rect x="14" y="40" width="68" height="8" fill={INK} opacity="0.5" />
      <path d="M40 48 l-4 8 l4 8 h8 l4 -8 l-4 -8 z" fill={SEAL} opacity="0.85" />
      <path d="M48 56 l-4 8 l4 8 h8 l4 -8 l-4 -8 z" fill={SEAL} opacity="0.7" />
      <path d="M36 64 l-4 8 l4 8 h8 l4 -8 l-4 -8 z" fill={SEAL} opacity="0.7" />
      <g fill={GLOW}>
        <circle cx="22" cy="60" r="1.6" />
        <circle cx="70" cy="54" r="1.6" />
        <circle cx="76" cy="70" r="1.6" />
        <circle cx="18" cy="78" r="1.6" />
        <circle cx="64" cy="84" r="1.6" />
      </g>
      <path d="M20 62 q4 -6 8 0 M74 72 q-4 6 -8 0" stroke={GLOW} strokeWidth="0.9" fill="none" opacity="0.6" />
    </g>
  ),

  // a jar, full past the line, and the comb it came out of
  w_honey: (
    <g>
      <rect x="26" y="30" width="36" height="52" rx="6" fill={INK} />
      <rect x="30" y="24" width="28" height="8" rx="2" fill={SOFT} />
      <path d="M30 50 h28 v28 q0 2 -2 2 h-24 q-2 0 -2 -2 z" fill={SEAL} opacity="0.85" />
      <path d="M30 50 q14 6 28 0" stroke={GLOW} strokeWidth="1.4" fill="none" opacity="0.6" />
      <path d="M70 40 l-4 7 l4 7 h8 l4 -7 l-4 -7 z" fill={SEAL} opacity="0.7" />
      <path d="M78 54 l-4 7 l4 7 h8 l4 -7 l-4 -7 z" fill={SEAL} opacity="0.55" />
      <path d="M76 68 q0 6 -3 8" stroke={SEAL} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="73" cy="80" r="2" fill={SEAL} />
    </g>
  ),

  // a hedge between two fields, and the pot that came up under it
  w_pot: (
    <g>
      <path d="M4 84 h88" stroke={SOFT} strokeWidth="3" />
      <path d="M8 76 h30 M8 70 h30 M58 76 h30 M58 70 h30" stroke={INK} strokeWidth="1.4" opacity="0.45" />
      <path d="M40 84 q0 -30 8 -30 q8 0 8 30 z" fill={INK} opacity="0.6" />
      <path d="M36 64 q0 -12 12 -12 q12 0 12 12 l-2 16 h-20 z" fill={SOFT} />
      <ellipse cx="48" cy="52" rx="11" ry="4" fill={INK} />
      <circle cx="43" cy="51" r="2.4" fill={SEAL} />
      <circle cx="49" cy="49" r="2.4" fill={SEAL} opacity="0.85" />
      <circle cx="54" cy="52" r="2.4" fill={SEAL} />
    </g>
  ),

  // a toll box on a post by the water, one coin short of level
  // a woodpile, a bowl nobody admits to putting out, and two lights in the dark
  w_wolf: (
    <g>
      <path d="M6 88 h84" stroke={SOFT} strokeWidth="2" fill="none" />
      <g fill={SOFT}>
        <rect x="10" y="60" width="30" height="6" rx="2" />
        <rect x="14" y="66" width="30" height="6" rx="2" />
        <rect x="10" y="72" width="30" height="6" rx="2" />
        <rect x="16" y="78" width="30" height="6" rx="2" />
      </g>
      <ellipse cx="52" cy="84" rx="7" ry="2.6" fill={INK} opacity="0.55" />
      {/* the wolf, out past the light, made mostly of the two eyes */}
      <path d="M60 88 q0 -16 12 -17 q12 1 12 17 z" fill={INK} opacity="0.35" />
      {/* the coat, which is most of what a wolf is */}
      <path
        d="M56 72 l4 -4 l-2 -5 l5 1 l0 -5 l4 3 l2 -5 l3 4 l3 -4 l2 5 l4 -3 l0 5
           l5 -1 l-2 5 l4 4 l-4 4 l2 5 l-5 -1 l0 5 l-4 -3 l-2 5 l-3 -4 l-3 4
           l-2 -5 l-4 3 l0 -5 l-5 1 l2 -5 z"
        fill={INK}
        opacity="0.3"
      />
      <path d="M63 66 l0 -15 l10 9 z" fill={INK} opacity="0.75" />
      <path d="M81 66 l0 -15 l-10 9 z" fill={INK} opacity="0.75" />
      <path d="M61 62 q11 -8 22 0 q0 11 -5 15 q-6 4 -12 0 q-5 -4 -5 -15 z" fill={INK} opacity="0.75" />
      <path d="M66 74 q6 -3 12 0 q-2 8 -6 9 q-4 -1 -6 -9 z" fill={SOFT} opacity="0.7" />
      <circle cx="67" cy="64" r="2.2" fill={GLOW} />
      <circle cx="77" cy="64" r="2.2" fill={GLOW} />
    </g>
  ),

  // the same animal, three years on, on the wrong side of a shut gate
  w_wolf_back: (
    <g>
      <path d="M6 88 h84" stroke={SOFT} strokeWidth="2" fill="none" />
      {/* the pen, shut, which is the part that stopped mattering */}
      <g stroke={SOFT} strokeWidth="2" fill="none">
        <path d="M10 88 v-22" />
        <path d="M24 88 v-26" />
        <path d="M38 88 v-22" />
        <path d="M6 72 h36" />
        <path d="M6 80 h36" />
      </g>
      {/* and what is standing inside it, in the dark, not hurrying */}
      <ellipse cx="66" cy="84" rx="16" ry="3" fill={INK} opacity="0.5" />
      <path d="M52 78 q4 -12 14 -12 q10 0 14 12 q-4 6 -14 6 q-10 0 -14 -6 z" fill={INK} opacity="0.8" />
      <path d="M56 68 l-1 -9 l7 5 z" fill={INK} opacity="0.8" />
      <path d="M72 68 l3 -9 l4 6 z" fill={INK} opacity="0.8" />
      <path d="M80 74 l10 -3 l-9 6 z" fill={INK} opacity="0.8" />
      <circle cx="60" cy="72" r="2.2" fill={SEAL} />
      <circle cx="71" cy="72" r="2.2" fill={SEAL} />
      {/* one lamb's worth of what it has been doing with its nights */}
      <path d="M44 86 q5 -4 10 0" stroke={SEAL} strokeWidth="1.6" fill="none" opacity="0.7" />
    </g>
  ),

  // the same animal, three years on, with company and a doorstep
  w_wolf_dog: (
    <g>
      <path d="M6 88 h84" stroke={SOFT} strokeWidth="2" fill="none" />
      <path d="M8 88 v-30 h26 v30 z" fill={SOFT} />
      <path d="M4 58 L21 44 L38 58 Z" fill={SOFT} />
      <rect x="17" y="70" width="9" height="18" fill={INK} opacity="0.4" />
      {/* the grown one, lying across the doorway like it owns it */}
      <ellipse cx="54" cy="80" rx="14" ry="6" fill={INK} opacity="0.75" />
      <circle cx="68" cy="74" r="5" fill={INK} opacity="0.75" />
      <path d="M65 70 l-1 -5 l4 3 z" fill={INK} opacity="0.75" />
      <path d="M71 70 l2 -5 l2 4 z" fill={INK} opacity="0.75" />
      <path d="M40 80 q-6 1 -8 -5" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle cx="70" cy="73" r="1.2" fill={GLOW} />
      {/* and the small ones, which is the part that settled the argument */}
      <g fill={SEAL} opacity="0.8">
        <ellipse cx="78" cy="85" rx="5" ry="2.4" />
        <circle cx="83" cy="82" r="2.2" />
        <ellipse cx="66" cy="87" rx="4.4" ry="2.1" />
        <circle cx="70.5" cy="84.6" r="2" />
      </g>
    </g>
  ),

  c2_toll: (
    <g>
      <path d="M0 72 q24 -8 48 0 q24 8 48 0 v24 h-96 z" fill={SOFT} opacity="0.8" />
      <rect x="44" y="46" width="6" height="30" fill={INK} />
      <rect x="30" y="26" width="34" height="22" rx="2" fill={INK} />
      <path d="M36 30 h22" stroke={GLOW} strokeWidth="3" />
      <circle cx="74" cy="40" r="5" fill={SEAL} opacity="0.9" />
      <circle cx="84" cy="50" r="4" fill={SEAL} opacity="0.6" />
      <path d="M12 56 q10 -10 22 -2" stroke={INK} strokeWidth="2" fill="none" opacity="0.7" />
    </g>
  ),

  // a basket of pies, one bitten, a warden's pike leaning in from the edge
  d1_pies: (
    <g>
      <path d="M20 58 h56 l-7 26 h-42 z" fill={INK} />
      <path d="M20 58 q28 -14 56 0" fill="none" stroke={INK} strokeWidth="3" />
      <circle cx="36" cy="52" r="7" fill={SEAL} opacity="0.85" />
      <circle cx="52" cy="48" r="7" fill={SEAL} opacity="0.7" />
      <circle cx="66" cy="53" r="7" fill={SEAL} opacity="0.85" />
      <path d="M59 44 a7 7 0 0 1 7 7 l-7 0 z" fill={GLOW} opacity="0.5" />
      <rect x="84" y="8" width="3" height="80" fill={SOFT} />
      <path d="M85.5 8 l6 10 h-12 z" fill={SOFT} />
    </g>
  ),

  // the miller's price board: the old number crossed out, the tall one above
  d2_ashes: (
    <g>
      <rect x="22" y="18" width="52" height="60" rx="3" fill={SOFT} />
      <rect x="44" y="78" width="8" height="12" fill={SOFT} />
      <path d="M32 62 h32" stroke={INK} strokeWidth="4" />
      <path d="M28 66 l40 -8" stroke={SEAL} strokeWidth="3" />
      <path d="M32 34 h8 M44 34 h8 M56 34 h8 M32 44 h14 M50 44 h14" stroke={GLOW} strokeWidth="5" />
      <path d="M10 84 q6 -10 2 -18 M18 88 q8 -12 3 -24" stroke={INK} strokeWidth="2" fill="none" opacity="0.6" />
    </g>
  ),

  // the fork in the rails, the cart above it, the lever untouched
  d3_cart: (
    <g>
      <path d="M8 78 h80" stroke={INK} strokeWidth="3" />
      <path d="M48 78 q20 -4 34 -18" stroke={INK} strokeWidth="3" fill="none" />
      <path d="M12 74 v8 M24 74 v8 M36 74 v8 M56 72 v8 M68 66 v8" stroke={SOFT} strokeWidth="2" />
      <rect x="30" y="46" width="26" height="16" rx="2" fill={SEAL} opacity="0.9" />
      <circle cx="37" cy="64" r="4" fill={INK} />
      <circle cx="49" cy="64" r="4" fill={INK} />
      <path d="M43 46 l-6 -12" stroke={SEAL} strokeWidth="2" />
      <rect x="76" y="30" width="4" height="18" fill={GLOW} transform="rotate(24 78 48)" />
      <circle cx="78" cy="50" r="3" fill={GLOW} />
    </g>
  ),

  // the bridge arch, the wagon, and the space where a man stood
  d4_bridge: (
    <g>
      <path d="M6 70 h84" stroke={INK} strokeWidth="4" />
      <path d="M14 70 q34 -30 68 0" fill="none" stroke={INK} strokeWidth="3" />
      <rect x="26" y="36" width="22" height="14" rx="2" fill={SEAL} opacity="0.9" />
      <circle cx="32" cy="54" r="4" fill={INK} />
      <circle cx="42" cy="54" r="4" fill={INK} />
      <circle cx="66" cy="40" r="5" fill={GLOW} />
      <path d="M66 45 l0 10 m-5 -6 l10 0 m-10 10 l5 -4 l5 4" stroke={GLOW} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M60 84 q6 -3 12 0 q6 3 12 0" stroke={SOFT} strokeWidth="2" fill="none" />
    </g>
  ),

  // a bed, a candle, and the window with spring outside it
  d5_deathbed: (
    <g>
      <rect x="14" y="58" width="52" height="14" rx="3" fill={INK} />
      <rect x="14" y="48" width="14" height="12" rx="3" fill={SOFT} />
      <path d="M28 56 q14 -6 38 -2 l0 6 l-38 0 z" fill={GLOW} opacity="0.4" />
      <rect x="76" y="52" width="4" height="16" fill={GLOW} />
      <ellipse cx="78" cy="47" rx="3" ry="5" fill={SEAL} />
      <rect x="62" y="16" width="24" height="20" rx="2" fill="none" stroke={SOFT} strokeWidth="2.4" />
      <path d="M74 16 v20 M62 26 h24" stroke={SOFT} strokeWidth="2" />
      <circle cx="69" cy="22" r="2.4" fill={SEAL} opacity="0.8" />
      <circle cx="80" cy="31" r="2" fill={SEAL} opacity="0.6" />
    </g>
  ),

  // a door, a polite fist about to knock, and the cellar hatch to the side
  d6_door: (
    <g>
      <rect x="30" y="20" width="34" height="62" rx="3" fill={INK} />
      <circle cx="58" cy="52" r="2.6" fill={GLOW} />
      <path d="M14 40 q4 -8 10 -4 l-3 6 z" fill={GLOW} />
      <circle cx="12" cy="34" r="6" fill={GLOW} />
      <rect x="70" y="72" width="20" height="12" rx="2" fill="none" stroke={SEAL} strokeWidth="2.4" />
      <path d="M70 78 h20" stroke={SEAL} strokeWidth="2" />
      <circle cx="80" cy="75" r="1.6" fill={SEAL} />
    </g>
  ),

  // a sack of grain with the level chalked low
  w_grain: (
    <g>
      <path d="M28 30 q20 -12 40 0 l6 48 q-26 10 -52 0 z" fill={INK} />
      <path d="M28 30 q20 8 40 0" stroke={SOFT} strokeWidth="2.4" fill="none" />
      <path d="M26 64 h44" stroke={SEAL} strokeWidth="2.4" strokeDasharray="4 3" />
      <circle cx="42" cy="72" r="1.8" fill={GLOW} />
      <circle cx="52" cy="76" r="1.8" fill={GLOW} />
      <circle cx="60" cy="70" r="1.8" fill={GLOW} />
      <path d="M12 20 l4 4 m-4 0 l4 -4 M78 14 l4 4 m-4 0 l4 -4" stroke={GLOW} strokeWidth="1.6" opacity="0.7" />
    </g>
  ),

  // a woodpile under snow, one log missing, a guard's pike
  w_cold: (
    <g>
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3].map((col) => {
          if (row === 0 && col === 3) return null;
          const x = 20 + col * 15 + (row % 2) * 7;
          const y = 66 - row * 13;
          return <circle key={`${row}-${col}`} cx={x} cy={y} r="6.4" fill={INK} stroke={SOFT} strokeWidth="1.6" />;
        }),
      )}
      <path d="M14 36 q26 -10 54 0" stroke={GLOW} strokeWidth="4" fill="none" opacity="0.8" />
      <rect x="82" y="18" width="3" height="66" fill={SOFT} />
      <path d="M83.5 18 l6 10 h-12 z" fill={SOFT} />
      <circle cx="24" cy="16" r="1.4" fill={GLOW} opacity="0.7" />
      <circle cx="48" cy="10" r="1.4" fill={GLOW} opacity="0.7" />
      <circle cx="66" cy="20" r="1.4" fill={GLOW} opacity="0.7" />
    </g>
  ),
};
