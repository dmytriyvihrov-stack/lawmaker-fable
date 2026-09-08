import { STATS } from '../../content/meta';
import { UI } from '../../content/ui-strings';
import { movePoints } from '../../engine/format';
import { isActiveStat, type Place } from '../../engine/simulation';
import type { Effects, StatId } from '../../engine/types';
import { feelingWord, isFeeling } from './Feeling';

interface Props {
  /** What happens the moment it happens. */
  once?: Effects;
  /** What happens every year after, for as long as it stands. */
  every?: Effects;
  /** A one time change to the count of souls, in percent of the place. */
  souls?: number;
  /**
   * The place, so a line about a board it has not opened yet can say so. A
   * promise about the watch, made to a settlement that has not decided it
   * keeps one, is banked and not felt, and saying so is the difference between
   * a promise and a lie.
   */
  place?: Place;
  /** Shown when neither list has anything in it. */
  emptyLine?: string;
  /**
   * Drop the every-year tag from the end of each row. In a rail 176 pixels
   * wide, under a heading that already says these are the yearly ones, the tag
   * was the same two words repeated down the column, pushing every label onto
   * two lines to say nothing new.
   */
  bare?: boolean;
  /**
   * Lay the moves out along one line instead of down a column. A card in the
   * year of work is four times the width of the rail these were designed for,
   * and stacking three one-word rows down the middle of it made every card
   * five lines tall for the sake of nine characters.
   */
  row?: boolean;
  /**
   * Spell the feelings out as numbers as well as words.
   *
   * The rule everywhere a choice is being weighed is that how the square and
   * the crown feel is a word and never a count: "-6" invites arithmetic this
   * game does not reward, and a player doing arithmetic is a player not
   * reading. That rule is about *deciding*. Afterwards is a different job:
   * once the answer is given, the screen owes the player the plain figure of
   * what it did, and the aftermath and the small things on the map both say
   * it. You never get a number to choose by; you always get one to learn from.
   */
  numeric?: boolean;
  /**
   * A number and nothing else: no word beside it, and no mark for when it
   * lands.
   *
   * For the two places that report what already happened and say when it
   * landed once, for the whole row. The aftermath used to print "+3.6 rises"
   * on one line and "-1.2" on the next, so one row carried a tenth and an
   * adjective and its neighbour carried only the tenth, four times over,
   * each with its own "at once" beside it.
   */
  plain?: boolean;
  className?: string;
}

const signed = movePoints;

/**
 * What a move looks like on the page. Health and the store are counts, so they
 * are numbers. How the square and the crown feel about you is not a count, so
 * it is a word: "falls hard" is the whole of what a player needs, and "-6" is
 * an invitation to arithmetic that nothing in this game rewards.
 */
function amount(
  id: StatId,
  delta: number,
  numeric = false,
  plain = false,
): { text: string; wide: boolean } {
  if (!isFeeling(id) || plain) return { text: signed(delta), wide: false };
  return numeric
    ? { text: `${signed(delta)} ${feelingWord(delta)}`, wide: true }
    : { text: feelingWord(delta), wide: true };
}

function rows(effects: Effects | undefined) {
  if (!effects) return [];
  return STATS.filter((s) => effects[s.id] !== undefined && effects[s.id] !== 0).map((s) => ({
    id: s.id as StatId,
    delta: effects[s.id] as number,
    emoji: s.emoji,
    label: s.label,
  }));
}

/**
 * What a thing will do to the boards, in the units the place will feel. Used
 * wherever a decision is being weighed: a decree at the drafting table, an
 * answer at the bench, a building in the year of work. One shape everywhere,
 * so the numbers under a dilemma read the same as the numbers under a law.
 */
export function MovedBoards({ once, every, souls, place, emptyLine, bare, row, numeric, plain, className }: Props) {
  const nowRows = rows(once);
  const yearRows = rows(every);

  /**
   * How wide the number is allowed to be.
   *
   * Down a column the values are stacked and want a common width, or the
   * marks that say when each one lands come out ragged. Along a row they are
   * side by side and a common width is dead air: "lifts a little" is fourteen
   * characters and the box was twenty-eight, so the mark that says *every
   * year* sat most of an inch to the right of the board it belonged to, and
   * a card with two feelings on it needed two lines to say what fits on one.
   * A row sizes to its own words.
   */
  const widthFor = (wide: boolean): string => (row ? '' : wide ? 'w-28' : 'w-8');

  /** Whether the place is big enough to have this board at all yet. */
  const felt = (id: StatId): boolean => place === undefined || isActiveStat(place, id);

  if (nowRows.length === 0 && yearRows.length === 0 && !souls) {
    return emptyLine ? (
      <p className={`text-[12px] leading-snug text-parchment-dim ${className ?? ''}`}>
        {emptyLine}
      </p>
    ) : null;
  }

  /**
   * A row is a mark, a number, and when it lands. The board's name used to be
   * spelled out beside its own icon, in every one of these lists, which is the
   * same fact twice and the wider half of the row; it is under the pointer
   * now, and under a screen reader. When it lands is a mark for the same
   * reason: "every year" was two words repeated down every column in the game.
   */
  const Row = ({
    emoji,
    label,
    value,
    tone,
    width,
    dim,
    when,
    whenLabel,
  }: {
    emoji: string;
    label: string;
    value: string;
    tone: string;
    width: string;
    dim?: boolean;
    when?: string;
    whenLabel?: string;
  }) => (
    /* One group, left-aligned, mark next to the number it marks. `justify-between`
       used to split this across the full width of the row, so on anything wider
       than the rail - a card in the year of work, easily four times as wide -
       the "when" mark drifted most of a foot away from the number it was
       marking, joined to it by nothing but a straight line a reader had to
       draw themselves. */
    <li className={`flex items-baseline gap-1.5 text-[12px] ${dim ? 'opacity-55' : ''}`}>
      <span aria-hidden title={label} className="w-4 shrink-0 cursor-help">
        {emoji}
      </span>
      <span className={`${width} shrink-0 tabular-nums ${tone}`}>{value}</span>
      <span className="sr-only">{label}</span>
      {when !== undefined && (
        <span aria-hidden title={whenLabel} className="cursor-help text-[10px] leading-none">
          {when}
        </span>
      )}
      {whenLabel !== undefined && <span className="sr-only">{whenLabel}</span>}
    </li>
  );

  return (
    <ul
      className={`${row ? 'flex flex-wrap items-baseline gap-x-3 gap-y-0.5' : 'space-y-0.5'} ${className ?? ''}`}
    >
      {nowRows.map((row) => (
        <Row
          key={`o${row.id}`}
          emoji={row.emoji}
          label={row.label}
          value={amount(row.id, row.delta, numeric, plain).text}
          tone={row.delta > 0 ? 'text-good' : 'text-bad'}
          width={widthFor(amount(row.id, row.delta, numeric, plain).wide)}
          dim={!felt(row.id)}
          when={plain ? undefined : felt(row.id) ? UI.seal.onceIcon : UI.seal.whenTownIcon}
          whenLabel={plain ? undefined : felt(row.id) ? UI.seal.once : UI.seal.whenTown}
        />
      ))}
      {yearRows.map((row) => (
        <Row
          key={`e${row.id}`}
          emoji={row.emoji}
          label={row.label}
          value={amount(row.id, row.delta, numeric, plain).text}
          tone={row.delta > 0 ? 'text-good' : 'text-bad'}
          width={widthFor(amount(row.id, row.delta, numeric, plain).wide)}
          dim={!felt(row.id)}
          when={bare ? undefined : felt(row.id) ? UI.seal.everyYearIcon : UI.seal.whenTownIcon}
          whenLabel={bare ? undefined : felt(row.id) ? UI.seal.everyYear : UI.seal.whenTown}
        />
      ))}
      {souls !== undefined && souls !== 0 && (
        <Row
          emoji={UI.court.peopleIcon}
          label={UI.caseScreen.souls}
          value={`${signed(souls)}%`}
          tone={souls > 0 ? 'text-good' : 'text-bad'}
          width={widthFor(false)}
          when={plain ? undefined : UI.seal.onceIcon}
          whenLabel={plain ? undefined : UI.seal.once}
        />
      )}
    </ul>
  );
}

/**
 * Which boards an answer touches, with no number, no direction and nothing to
 * click. A dilemma keeps the weight of what it moves a secret until the
 * aftermath - which way it moves is part of that secret, not a preview of it.
 * A player weighing two answers can see that one leans on health and the
 * other on the store without being told which way or by how much.
 */
export function AffectedStats({
  once,
  every,
  souls,
  place,
  className,
}: {
  once?: Effects;
  every?: Effects;
  souls?: number;
  place?: Place;
  className?: string;
}) {
  const lean = new Set<StatId>();
  for (const effects of [once, every]) {
    if (!effects) continue;
    for (const s of STATS) {
      if (effects[s.id]) lean.add(s.id);
    }
  }
  const touched = STATS.filter(
    (s) => lean.has(s.id) && (place === undefined || isActiveStat(place, s.id)),
  );
  if (touched.length === 0 && !souls) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ''}`}>
      {touched.map((s) => (
        <span
          key={s.id}
          title={s.label}
          className="flex items-center text-[12px] leading-none text-parchment-dim"
        >
          <span aria-hidden>{s.emoji}</span>
          <span className="sr-only">{s.label}</span>
        </span>
      ))}
      {souls !== undefined && souls !== 0 && (
        <span
          title={UI.caseScreen.souls}
          className="flex items-center text-[12px] leading-none text-parchment-dim"
        >
          <span aria-hidden>{UI.court.peopleIcon}</span>
          <span className="sr-only">{UI.caseScreen.souls}</span>
        </span>
      )}
    </div>
  );
}
