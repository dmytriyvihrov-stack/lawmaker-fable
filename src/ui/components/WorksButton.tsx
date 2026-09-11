import { UI } from '../../content/ui-strings';
import { shelfNews, workSpent } from '../../engine/simulation';
import type { GameState } from '../../engine/types';

interface Props {
  state: GameState;
  onOpen: () => void;
  /** The box it is drawn in, which belongs to the row or column it sits in. */
  className: string;
  disabled?: boolean;
}

/**
 * The mark that opens the shelf.
 *
 * The year of work used to be a card that came up when the year reached it
 * and at no other time, so the one question a player asks all year, "what
 * could I put up, and what would it cost", had no answer until the autumn.
 * This opens the same shelf in any season. Two things are on the mark
 * itself: a count when something is on the shelf that was not there the
 * last time it was read (a chain step that opened, a thing the place worked
 * out how to spend a year on, a board that made a building thinkable), and
 * a dimming when the year is already spent, because then the shelf can be
 * read and nothing on it taken.
 */
export function WorksButton({ state, onOpen, className, disabled = false }: Props) {
  const news = shelfNews(state);
  const spent = workSpent(state);
  const what =
    news.length > 1
      ? UI.works.news.replace('{n}', String(news.length))
      : news.length === 1
        ? UI.works.newsOne
        : spent
          ? UI.works.spentShort
          : '';
  const title = what ? `${UI.works.open}: ${what}` : UI.works.open;

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`relative ${className} ${spent ? 'opacity-60' : ''}`}
    >
      <span aria-hidden>{UI.works.openIcon}</span>
      <span className="sr-only">{title}</span>
      {news.length > 0 && (
        <span
          aria-hidden
          className="shelf-news absolute -right-1.5 -top-1.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-seal px-1 text-[10px] leading-none tabular-nums text-parchment"
        >
          {news.length}
        </span>
      )}
    </button>
  );
}
