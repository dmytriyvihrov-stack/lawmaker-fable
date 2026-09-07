import type { Stage } from '../../engine/types';
import { ROYAL_WARDROBE } from '../../content/monarchs';
import type { MonarchDef } from '../../content/monarchs';

interface Props {
  monarch: MonarchDef;
  /** 0..100, the monarch's patience with you. Drives the eyes and the mouth. */
  mood: number;
  size?: number;
  stage?: Stage;
  /**
   * There is a hard thing on the table, 0..1. The face does not know the
   * answer either: it leans in, and the brows come down with the weight of it.
   */
  bracing?: number;
}

/**
 * The monarch, painted badly by someone who was paid in advance. Five faces,
 * five tempers each: furious, grim, level, pleased, delighted. Everything the
 * portrait says it says with a jaw, and now also with the whole head.
 */
export function MonarchPortrait({ monarch, mood, size = 132, bracing = 0, stage = 'village' }: Props) {
  // a hard question ages a face by twenty points for as long as it is on the table
  const felt = Math.max(0, Math.min(100, mood - Math.round(bracing * 22)));
  const furious = felt <= 10;
  const grim = felt <= 40;
  const pleased = felt >= 70;
  const delighted = felt >= 90;
  /** The head leans with the temper: away from you when angry, toward you when won over. */
  const lean = (furious ? -6 : grim ? -3 : delighted ? 4 : pleased ? 2 : 0) + bracing * 3;

  if (monarch.id === 'vaelis') {
    const dress = ROYAL_WARDROBE[stage];
    return <svg viewBox="0 0 120 150" width={size} height={size * 1.25} role="img" aria-label={monarch.name} className="block" data-royal-portrait={stage}>
      <rect width="120" height="150" rx="8" fill="#303c36" />
      <circle cx="60" cy="61" r="46" fill="#b6b993" opacity=".09" />
      <path d="M9 150 Q12 117 41 110 H79 Q108 117 111 150Z" fill={dress.cloth} />
      <path d="M14 150 L26 119 L43 112 L47 150Z" fill={dress.cloak} />
      <path d="M51 91 H69 V116 L60 126 L50 116Z" fill="#e4bca0" />
      <path d="M49 110 L60 126 L72 110 M60 126 V150" fill="none" stroke={dress.trim} strokeWidth="1.5" />
      {stage !== 'village' && <><path d="M24 121 Q54 145 92 120" fill="none" stroke={dress.trim} strokeWidth="2.5" /><path d="M30 120 l4 -6 l6 6 l-5 6Z" fill={dress.trim} /></>}
      {stage === 'kingdom' && <><path d="M23 119 L45 108 L52 119 M97 119 L76 108 L69 119" fill="none" stroke="#fff7e7" strokeWidth="9" /><path d="M66 131 l5 7 l-5 7 l-5 -7Z" fill={dress.trim} /><path d="M89 130 L102 150 M27 135 L21 150" stroke={dress.trim} strokeWidth="1.2" /></>}
      <g transform={`rotate(${lean * .55} 60 100)`}>
        <path d="M33 55 Q26 17 60 19 Q95 17 88 57 L92 111 L78 121 L74 78 H45 L43 118 L29 106Z" fill="#d9d4bc" stroke="#aaa990" strokeWidth="1" />
        <path d="M38 50 Q38 31 60 31 Q83 31 82 53 L79 79 Q76 92 60 99 Q44 93 41 79Z" fill="#f0cfb4" />
        <path d="M41 56 Q41 82 60 98 Q46 92 42 79Z" fill="#c59b87" opacity=".35" />
        <path d="M36 57 Q34 30 59 24 Q86 26 85 58 Q76 38 60 36 Q46 41 36 57Z" fill="#eee8d2" />
        <path d="M60 26 Q48 28 40 44 M63 28 Q75 31 81 45" fill="none" stroke="#bfc0a8" strokeWidth="1.5" />
        <path d="M36 48 Q32 81 38 109 M84 48 Q90 84 82 112" fill="none" stroke="#f5eed6" strokeWidth="6" />
        <path d="M36 55 l3 5 l-5 5 l5 5 l-4 5 l4 5 l-4 5 l4 5 l-3 5 M84 55 l-3 5 l5 5 l-5 5 l4 5 l-4 5 l4 5 l-4 5 l3 5" fill="none" stroke="#aaa990" strokeWidth="1.3" />
        <path d={grim ? 'M44 58 L54 61 M76 58 L66 61' : 'M44 58 Q50 55 55 59 M65 59 Q70 55 76 58'} fill="none" stroke="#9b887a" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M44 65 Q50 61 55 65 M65 65 Q71 61 76 65" fill="none" stroke="#655a58" strokeWidth="1.4" />
        <ellipse cx="50" cy="65" rx="2" ry={grim ? 1.3 : 2.5} fill="#7d748d" /><ellipse cx="70" cy="65" rx="2" ry={grim ? 1.3 : 2.5} fill="#7d748d" />
        <path d="M60 67 L57 77 Q60 79 63 77" fill="none" stroke="#bd957f" strokeWidth="1" />
        <path d={grim ? 'M53 85 Q60 82 67 85' : pleased ? 'M53 83 Q60 90 67 83' : 'M54 85 Q60 86 66 85'} fill="none" stroke="#a96d67" strokeWidth="1.7" strokeLinecap="round" />
        {stage === 'town' && <path d="M36 43 Q60 35 84 43" fill="none" stroke={dress.trim} strokeWidth="2" />}
        {stage === 'kingdom' && <><path d="M36 40 L36 28 L47 34 L51 24 L60 31 L69 24 L74 34 L84 28 L84 40 Q60 34 36 40Z" fill={dress.trim} stroke="#9e8149" strokeWidth="1" /><path d="M60 31 l3 4 l-3 4 l-3 -4Z" fill="#915654" /></>}
      </g>
    </svg>;
  }

  return (
    <svg
      viewBox="0 0 120 150"
      width={size}
      height={(size / 120) * 150}
      role="img"
      aria-label={monarch.name}
      className="block"
    >
      {/* the frame, which is the wall behind them */}
      <rect x="0" y="0" width="120" height="150" rx="8" className="fill-ink-line" />

      {/* shoulders, in the gold, and something on them: a collar, a chain, and
          the fall of a garment. A monarch drawn as one dark hill was a monarch
          in a bag. */}
      <path d="M18 150 Q22 112 60 108 Q98 112 102 150 Z" fill={monarch.id === 'vaelis' ? ROYAL_WARDROBE[stage].cloth : '#c8a24a'} />
      <path
        d="M42 116 Q60 130 78 116"
        fill="none"
        className="stroke-parchment-dim"
        strokeWidth="1.6"
        opacity="0.5"
      />
      <path
        d="M46 113 Q60 126 74 113 L74 150 L46 150 Z"
        className="fill-parchment-dim"
        opacity="0.14"
      />
      <g className="fill-seal" opacity="0.55">
        {monarch.id !== 'vaelis' && <circle cx="60" cy="128" r="3.4" />}
      </g>
      {garment(monarch.id, stage)}
      {/* neck */}
      <path d="M52 90 h16 v22 h-16 z" className="fill-parchment" opacity="0.9" />
      <path d="M52 104 q8 8 16 0 l0 8 h-16 z" className="fill-ink" opacity="0.12" />

      {/* head */}
      <ellipse cx="60" cy={headY(monarch.id)} rx={headRx(monarch.id)} ry="30" className="fill-parchment" />
      {/* the shaded half, so a head is a head and not a coin */}
      <path
        d={`M60 ${headY(monarch.id) - 30} a${headRx(monarch.id)} 30 0 0 0 0 60 z`}
        className="fill-ink"
        opacity="0.06"
      />
      {/* ears, under whatever the hair is doing */}
      <g className="fill-parchment">
        <ellipse cx={60 - headRx(monarch.id)} cy={headY(monarch.id) + 4} rx="3.4" ry="5" />
        <ellipse cx={60 + headRx(monarch.id)} cy={headY(monarch.id) + 4} rx="3.4" ry="5" />
      </g>

      <g transform={`rotate(${lean} 60 90)`}>
        {hair(monarch.id, headRx(monarch.id), headY(monarch.id))}
        {(monarch.id !== 'vaelis' || stage !== 'village') && crown(monarch.id)}
        {eyes(monarch.id, grim, pleased)}
        {nose(monarch.id, headY(monarch.id))}
        {mouth(monarch.id, grim, pleased)}
        {furious && furiousBrows()}
        {!furious && bracing >= 0.5 && bracedBrows()}
        {delighted && delightedCheeks()}
      </g>
      {furious && steam()}
      {prop(monarch.id)}
    </svg>
  );
}

/**
 * What one of them is wearing, when it is not what the rest are wearing. A high
 * collar that comes up past the jaw, a shoulder built to be seen from the far
 * side of a field, and a clasp holding it that is worth more than the field.
 */
function garment(id: string, stage: Stage) {
  if (id !== 'vaelis') return null;
  const dim = ROYAL_WARDROBE[stage].trim;
  if (stage === 'village') return <path d="M42 116 Q60 138 78 116 M60 127 V150" fill="none" stroke={dim} strokeWidth="2" />;
  return (
    <g>
      <path d="M18 150 Q20 118 42 113 L48 150Z" fill={ROYAL_WARDROBE[stage].cloak} />
      {stage === 'kingdom' && <><path d="M28 121 Q60 139 92 121" fill="none" stroke="#fff6e4" strokeWidth="9" /><path d="M34 124 Q60 144 86 124" fill="none" stroke={dim} strokeWidth="2" /><path d="M59 137 l5 5 l-5 5 l-5 -5Z" fill={dim} /></>}
      {/* the raised shoulder, one side only, the way a coat is cut */}
      <path d="M18 150 Q20 116 44 111 L52 150 Z" fill={dim} opacity="0.2" />
      {/* the collar, standing */}
      <path d="M46 116 L52 98 L60 112 L68 98 L74 116 Q60 128 46 116 Z" fill={dim} opacity="0.24" />
      <path
        d="M52 98 L60 112 L68 98"
        fill="none"
        stroke={dim}
        strokeWidth="1.4"
        opacity="0.7"
      />
      {/* the clasp, and the chain off it */}
      <g opacity="0.85">
        <path d="M44 118 l4 -5 l5 4 l-4 5 z" fill={dim} />
        <path
          d="M48 122 q3 6 7 8"
          fill="none"
          stroke={dim}
          strokeWidth="1.1"
          opacity="0.6"
        />
      </g>
    </g>
  );
}

/**
 * Hair, which every one of these five went without until now. It is the
 * difference between five people and one oval wearing five hats, and it is
 * drawn under the crown so the crown still sits on something.
 */
function hair(id: string, rx: number, cy: number) {
  const dim = 'var(--color-hair)';
  switch (id) {
    case 'marigold': // scraped back so hard it counts as a decision
      return (
        <g fill={dim}>
          <path d={`M${60 - rx} ${cy - 8} q0 -26 ${rx} -26 q${rx} 0 ${rx} 26 q-4 -16 -${rx} -16 q-${rx} 0 -${rx} 16 z`} />
          <ellipse cx="60" cy={cy - 30} rx="7" ry="5" />
        </g>
      );
    case 'aldous': // what is left of it, and it is not much, and it is fluffy
      return (
        <g fill={dim}>
          <circle cx={60 - rx + 2} cy={cy - 14} r="7" />
          <circle cx={60 + rx - 2} cy={cy - 14} r="7" />
          <circle cx={60 - rx - 1} cy={cy - 6} r="5" />
          <circle cx={60 + rx + 1} cy={cy - 6} r="5" />
        </g>
      );
    case 'ottiline': // a great deal of it, and none of it tidy
      return (
        <g fill={dim}>
          <path d={`M${60 - rx - 2} ${cy - 8} q0 -24 ${rx + 2} -24 q${rx + 2} 0 ${rx + 2} 24 q-7 -13 -${rx + 2} -13 q-${rx + 2} 0 -${rx + 2} 13 z`} />
          <circle cx={60 - rx - 1} cy={cy - 6} r="6.5" />
          <circle cx={60 + rx + 1} cy={cy - 6} r="6.5" />
        </g>
      );
    case 'corvin': // going back at the temples, and a beard doing the work
      return (
        <g fill={dim}>
          {/* what is left of it: thin over the top, and further back on each
              side than it was ten years ago */}
          <path d={`M${60 - rx} ${cy - 18} q${rx} -12 ${rx * 2} 0 q-4 -5 -${rx} -5 q-${rx - 4} 0 -${rx} 5 z`} />
          <path d={`M${60 - rx} ${cy - 18} q-2 8 0 14 q3 -8 4 -13 z`} />
          <path d={`M${60 + rx} ${cy - 18} q2 8 0 14 q-3 -8 -4 -13 z`} />
          {/* and the beard, which is a jaw with hair on it and not a bar */}
          <path
            d={`M${60 - rx + 1} ${cy + 4}
                q0 ${rx} ${rx - 1} ${rx + 4}
                q${rx - 1} -4 ${rx - 1} -${rx + 4}
                q-5 6 -${rx - 1} 6
                q-${rx - 1} 0 -${rx - 1} -6 z`}
          />
        </g>
      );
    case 'vaelis': // pale, parted, and a braid to the collarbone
      return (
        <g fill="var(--color-parchment-dim)" opacity="0.95">
          {/* swept back off the face, not hanging beside it */}
          <path d={`M${60 - rx - 1} ${cy - 4} q-2 -28 ${rx + 1} -28 q${rx + 1} 0 ${rx + 1} 28 q-5 -17 -${rx + 1} -17 q-${rx + 1} 0 -${rx + 1} 17 z`} />
          {/* the braid work across the crown */}
          <g stroke="var(--color-ink)" strokeWidth="0.8" opacity="0.28" fill="none">
            <path d={`M${60 - rx + 3} ${cy - 20} q${rx - 3} -6 ${(rx - 3) * 2} 0`} />
            <path d={`M${60 - rx + 5} ${cy - 26} q${rx - 5} -5 ${(rx - 5) * 2} 0`} />
          </g>
          {/* the braid, three turns of it, over the near shoulder */}
          <path d={`M${60 + rx - 2} ${cy + 6} q8 6 6 14 q-2 8 -4 16`} stroke="var(--color-parchment-dim)" strokeWidth="5" fill="none" opacity="0.95" strokeLinecap="round" />
          <g stroke="var(--color-ink)" strokeWidth="0.9" opacity="0.35" fill="none">
            <path d={`M${60 + rx + 1} ${cy + 13} l5 1`} />
            <path d={`M${60 + rx + 2} ${cy + 20} l5 1`} />
            <path d={`M${60 + rx + 1} ${cy + 27} l5 1`} />
          </g>
        </g>
      );
    default: // beatrix: loud hair, to match
      return (
        <g fill={dim}>
          <path d={`M${60 - rx - 2} ${cy - 6} q-2 -26 ${rx + 2} -26 q${rx + 2} 0 ${rx + 2} 26 q-5 -14 -${rx + 2} -14 q-${rx + 2} 0 -${rx + 2} 14 z`} />
          <path d={`M${60 - rx - 5} ${cy - 12} q-7 7 -3 15 q6 -6 5 -13 z`} />
          <path d={`M${60 + rx + 5} ${cy - 12} q7 7 3 15 q-6 -6 -5 -13 z`} />
        </g>
      );
  }
}

/**
 * A nose, drawn the way everything else here is drawn: as the shadow one casts
 * rather than as an outline of one. The stroked version read as a letter L
 * sitting on the face. Five shapes, because the length of a nose is most of
 * what makes a face somebody's.
 */
function nose(id: string, cy: number) {
  const ink = 'var(--color-ink)';
  const long = id === 'corvin' || id === 'marigold' ? 13 : id === 'ottiline' ? 8 : 10;
  const wide = id === 'ottiline' || id === 'aldous' ? 5 : 3.6;
  const top = cy + 3;
  return (
    <path
      d={`M60 ${top} q-1.2 ${long * 0.6} -${wide} ${long} q${wide} 2.4 ${wide * 1.5} -1`}
      fill={ink}
      opacity="0.22"
    />
  );
}

/** Brows every monarch shares when the patience runs out. */
function furiousBrows() {
  const ink = 'var(--color-ink)';
  return (
    <g stroke={ink} strokeWidth="2.6" strokeLinecap="round">
      <path d="M42 56 L58 62" />
      <path d="M78 56 L62 62" />
    </g>
  );
}

/** The brows of somebody waiting to hear what you are going to say. */
function bracedBrows() {
  const ink = 'var(--color-ink)';
  return (
    <g stroke={ink} strokeWidth="2" strokeLinecap="round" opacity="0.75">
      <path d="M43 55 L57 58" />
      <path d="M77 55 L63 58" />
    </g>
  );
}

/** Warmth that only shows near the top of the dial. */
function delightedCheeks() {
  const seal = 'var(--color-seal)';
  return (
    <g fill={seal} opacity="0.35">
      <circle cx="44" cy="76" r="4.5" />
      <circle cx="76" cy="76" r="4.5" />
    </g>
  );
}

/** The kettle noise above the crown when the patience is gone. */
function steam() {
  const dim = 'var(--color-parchment-dim)';
  return (
    <g stroke={dim} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.8">
      <path d="M40 22 q-3 -5 0 -10" />
      <path d="M60 16 q-3 -5 0 -10" />
      <path d="M80 22 q-3 -5 0 -10" />
    </g>
  );
}

function headY(id: string): number {
  if (id === 'corvin') return 66;
  if (id === 'vaelis') return 67;
  return 68;
}

function headRx(id: string): number {
  if (id === 'vaelis') return 20;
  if (id === 'marigold') return 20;
  if (id === 'ottiline') return 27;
  if (id === 'corvin') return 19;
  return 24;
}

function crown(id: string) {
  const gold = 'var(--color-seal)';
  switch (id) {
    case 'marigold': // a crown she had resized to save metal
      return (
        <path d="M46 40 l4 -10 l5 7 l5 -9 l5 9 l5 -7 l4 10 z" fill={gold} opacity="0.9" />
      );
    case 'aldous': // soft, oversized, slightly melted
      return (
        <path
          d="M34 40 q2 -20 12 -14 q4 -12 14 -12 q10 0 14 12 q10 -6 12 14 z"
          fill={gold}
          opacity="0.85"
        />
      );
    case 'ottiline': // a crown of forks
      return (
        <g fill={gold} opacity="0.9">
          <rect x="38" y="36" width="44" height="6" rx="1" />
          {[42, 52, 62, 72].map((x) => (
            <g key={x}>
              <rect x={x} y="20" width="2" height="16" />
              <rect x={x + 4} y="20" width="2" height="16" />
              <rect x={x} y="20" width="6" height="3" />
            </g>
          ))}
        </g>
      );
    case 'corvin': // thin, plain, worn low
      return (
        <g fill={gold} opacity="0.8">
          <rect x="42" y="36" width="36" height="5" rx="1" />
          <path d="M48 36 l0 -8 l4 5 l4 -7 l4 7 l4 -5 l0 8 z" />
        </g>
      );
    case 'vaelis': // a circlet, thin, and older than this kingdom
      return (
        <g fill={gold} opacity="0.85">
          <path d="M40 40 q20 -10 40 0 q-20 -4 -40 0 z" />
          <path d="M56 34 l4 -8 l4 8 z" />
        </g>
      );
    default: // beatrix, askew
      return (
        <g transform="rotate(-12 60 36)" fill={gold} opacity="0.9">
          <rect x="40" y="34" width="40" height="6" rx="1" />
          <path d="M44 34 l3 -12 l6 8 l7 -12 l7 12 l6 -8 l3 12 z" />
        </g>
      );
  }
}

function eyes(id: string, grim: boolean, pleased: boolean) {
  const ink = 'var(--color-ink)';
  const seal = 'var(--color-seal)';

  if (id === 'marigold') {
    // one eye is a coin. she has never explained it
    return (
      <g fill={ink}>
        <circle cx="51" cy="66" r="2.6" />
        <circle cx="69" cy="66" r="5" fill={seal} opacity="0.8" />
        <circle cx="69" cy="66" r="2" fill={ink} />
        {grim && <path d="M45 58 l12 4 M75 58 l-12 4" stroke={ink} strokeWidth="1.6" fill="none" />}
      </g>
    );
  }

  if (id === 'aldous') {
    // permanently, alarmingly delighted
    return (
      <g stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round">
        <path d={pleased ? 'M45 68 q6 -7 12 0' : 'M45 66 q6 -6 12 0'} />
        <path d={pleased ? 'M63 68 q6 -7 12 0' : 'M63 66 q6 -6 12 0'} />
      </g>
    );
  }

  if (id === 'ottiline') {
    return (
      <g fill={ink}>
        <ellipse cx="50" cy="66" rx="4.5" ry={grim ? 2 : 5} />
        <ellipse cx="70" cy="66" rx="4.5" ry={grim ? 2 : 5} />
      </g>
    );
  }

  if (id === 'corvin') {
    // heavy brows, and he is reading something you have not seen
    return (
      <g>
        <rect x="42" y="58" width="14" height="3" fill={ink} />
        <rect x="64" y="58" width="14" height="3" fill={ink} />
        <circle cx="49" cy="67" r="2.4" fill={ink} />
        <circle cx="71" cy="67" r="2.4" fill={ink} />
      </g>
    );
  }

  if (id === 'vaelis') {
    // pale, level, and they do not widen at anything
    return (
      <g>
        <g fill={ink}>
          <ellipse cx="51" cy="66" rx="3.6" ry={grim ? 1.6 : 3} />
          <ellipse cx="69" cy="66" rx="3.6" ry={grim ? 1.6 : 3} />
        </g>
        <g stroke={ink} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.55">
          <path d={pleased ? 'M45 58 q6 -3 12 -1' : 'M45 59 q6 -2 12 -1'} />
          <path d={pleased ? 'M75 58 q-6 -3 -12 -1' : 'M75 59 q-6 -2 -12 -1'} />
        </g>
      </g>
    );
  }

  // beatrix: one eye considerably more open than the other
  return (
    <g fill={ink}>
      <circle cx="49" cy="65" r={pleased ? 7 : 6} />
      <circle cx="49" cy="65" r="2.5" fill="var(--color-parchment)" />
      <path d="M64 66 q6 -4 12 0" stroke={ink} strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </g>
  );
}

function mouth(id: string, grim: boolean, pleased: boolean) {
  const ink = 'var(--color-ink)';
  const stroke = { stroke: ink, strokeWidth: 2.2, fill: 'none', strokeLinecap: 'round' as const };

  if (grim) {
    return <path d="M50 84 q10 -5 20 0" {...stroke} />;
  }

  switch (id) {
    case 'marigold':
      return <path d="M53 84 h14" {...stroke} />;
    case 'aldous':
      return <path d={pleased ? 'M46 80 q14 14 28 0' : 'M48 81 q12 10 24 0'} {...stroke} />;
    case 'ottiline':
      return (
        <g>
          <ellipse cx="60" cy="84" rx="9" ry={pleased ? 8 : 6} fill={ink} />
          <path d="M53 84 q7 5 14 0" stroke="var(--color-parchment)" strokeWidth="1.2" fill="none" />
        </g>
      );
    case 'corvin':
      return <path d="M50 85 h20" {...stroke} />;
    case 'vaelis':
      return <path d={pleased ? 'M52 83 q8 5 16 0' : 'M53 84 h14'} {...stroke} />;
    default:
      return (
        <g>
          <ellipse cx="60" cy="85" rx="11" ry="7" fill={ink} />
          <path
            d="M74 80 q6 -3 8 -8 M76 86 q7 0 11 -3 M74 92 q6 3 8 8"
            stroke="var(--color-seal)"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      );
  }
}

function prop(id: string) {
  const seal = 'var(--color-seal)';
  const dim = 'var(--color-parchment-dim)';
  switch (id) {
    case 'marigold': // a ledger, held like a shield
      return (
        <g>
          <rect x="22" y="120" width="24" height="18" rx="1" fill={dim} opacity="0.7" />
          <path d="M26 125 h16 M26 129 h16 M26 133 h10" stroke="var(--color-ink)" strokeWidth="1" />
        </g>
      );
    case 'aldous': // a spoon
      return (
        <g>
          <rect x="90" y="112" width="2.5" height="26" fill={dim} />
          <ellipse cx="91" cy="110" rx="6" ry="8" fill={dim} />
        </g>
      );
    case 'ottiline': // a leg of something, already started
      return (
        <g>
          <path d="M86 138 q-6 -12 4 -18 q12 -6 14 6 q2 10 -8 12 z" fill={seal} opacity="0.75" />
          <rect x="82" y="136" width="10" height="3" rx="1.5" fill={dim} />
        </g>
      );
    case 'corvin': // a candle, lit at both ends
      return (
        <g>
          <rect x="24" y="116" width="5" height="22" fill={dim} />
          <ellipse cx="26.5" cy="112" rx="3" ry="5" fill={seal} opacity="0.85" />
        </g>
      );
    case 'vaelis': // the map, with the thing on it that does not live anywhere
      return (
        <g>
          <rect x="86" y="114" width="26" height="22" rx="1.5" fill={dim} opacity="0.75" />
          <g opacity="0.9">
            {/* drawn by somebody who has never seen one, from a description */}
            <path
              d="M91 130 q5 -8 11 -6 q-4 -4 1 -6 q3 3 6 2 q-4 3 -3 6 q4 1 5 5 q-9 -5 -20 -1 z"
              fill={seal}
            />
          </g>
          <path d="M86 114 l26 0 M86 136 l26 0" stroke={dim} strokeWidth="1.6" opacity="0.9" />
        </g>
      );
    default: // beatrix: a speaking trumpet
      return (
        <path d="M86 132 l16 -8 v20 z" fill={dim} opacity="0.8" />
      );
  }
}
