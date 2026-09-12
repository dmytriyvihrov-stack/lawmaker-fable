import type { ReactNode } from 'react';
import { BOND_UI, bondWord } from '../../content/bonds';
import { characterTitle, STATS } from '../../content/meta';
import { UI } from '../../content/ui-strings';
import { DOING_LINES, folkLook } from '../../content/folk';
import { CONFIG } from '../../engine/config';
import { metCharacters } from '../../engine/story';
import { agesNow, doingsNow } from '../../engine/folk';
import {
  bondLevel,
  bondOf,
  giftAgainAt,
  giftBlock,
  visitAgainAt,
  visitBlock,
  isLover,
  isPerson,
  loverBlock,
} from '../../engine/bonds';
import { PersonPortrait } from '../components/PersonPortrait';
import { FolkIcon } from '../components/Folk';
import type { GameState, Season } from '../../engine/types';

interface Props {
  state: GameState;
  /** What month it is out there, which decides what half of them are doing. */
  season: Season;
  /** Two off the store, one rung, once every other year. */
  onGift: (character: string) => void;
  /** And the one that is not bought, only admitted. */
  onTake: (character: string) => void;
  /** The one you took, coming up to the house. Costs nothing, every other year. */
  onVisit: (character: string) => void;
  onClose: () => void;
}

/**
 * Every face that has stood in front of you, in the order they first did, with
 * what happened, what you said about it, and what they have thought of you
 * ever since.
 *
 * The history half is drawn straight off the log and needs nothing of its own
 * in the save. The other half is the only reading in this game that is about
 * one person rather than about the place, and this is the only page where a
 * lawmaker can spend anything on somebody instead of on something.
 */
/**
 * What a button on this page costs and does, under the pointer, in the game's
 * own lettering.
 *
 * It was a `title` and a grey line of ten point text under the row. The line
 * said the same sentence beside every face in a register of thirty, which is
 * three lines of furniture per person and the reason the page scrolled; the
 * `title` was the browser's own tooltip, in the browser's own box, wherever
 * the pointer happened to be. The sentence starts with the price, because the
 * price is the thing anybody is hovering to find out. Asked for by the user.
 *
 * And now the name of the thing as well. On the face of the button it was
 * four or five words per button and three buttons per person, which is a row
 * of prose where a row of marks would do: what the button is stays under the
 * pointer with what it costs and what it does, and the button itself is the
 * gift, the heart or the kiss and the two numbers. Asked for by the user.
 */
function Hint({ label, line, children }: { label: string; line: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute left-0 top-full z-50 mt-1.5 hidden w-[250px] rounded-lg border border-ink-line bg-ink p-2.5 text-left shadow-[0_14px_30px_rgba(0,0,0,0.5)] group-hover:block">
        <span className="block text-[12px] leading-snug text-parchment">{label}</span>
        <span className="mt-1 block text-[11px] leading-snug text-parchment-dim">{line}</span>
      </span>
    </span>
  );
}

export function Register({ state, season, onGift, onTake, onVisit, onClose }: Props) {
  const people = metCharacters(state);
  // what each of them is up to now, which is the same reading the town draws,
  // in the same weather the town is drawing it in
  const doings = doingsNow(state, season);
  const ages = agesNow(state);

  /** Whether the store can pay for a kindness at all this year. */
  const storePoor = state.stats.economy < CONFIG.bond.giftCost;

  /* The crown's own mark, so what a bond gives back can be read off the
     button rather than out of a sentence: the store pays for this and the
     person upstairs is the one it is paid for. */
  const crownMark = STATS.find((st) => st.id === 'crownSanity')?.emoji ?? '';
  /** A line with its own two numbers in it: what the store pays, what the
      crown gets. */
  const fill = (line: string, cost: number, crown: number): string =>
    line.replace('{n}', String(cost)).replace('{c}', String(crown));

  const act =
    'min-h-[30px] rounded-md border px-2 py-1 text-[11px] leading-tight disabled:opacity-40';

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-xl border border-ink-line bg-ink p-4 sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg tracking-wide">📇 {UI.register.heading}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={UI.register.close}
            className="min-h-[44px] min-w-[44px] shrink-0 rounded-md border border-ink-line text-parchment-dim"
          >
            ✕
          </button>
        </header>

        {people.length === 0 && (
          <p className="text-[14px] text-parchment-dim">{UI.register.empty}</p>
        )}

        {/* An empty store is a fact about the store, and it used to be printed
            under every single person on the page: "The store cannot spare it."
            three times running, once per face, about the same store. Said once,
            over the list, and the buttons under it are simply grey. */}
        {storePoor && people.length > 0 && (
          <p className="mb-3 rounded-md border border-bad/40 bg-bad/[0.07] px-3 py-2 text-[12px] leading-snug text-parchment-dim">
            {BOND_UI.giftPoor}
          </p>
        )}

        {/* Several to a page, portrait first, the way a register actually
            reads: the page turns are left to the scrollbar rather than built,
            since nothing here is long enough yet to need turning. */}
        <ul className="space-y-4">
          {people.map((person) => {
            const who = person.character;
            const level = bondLevel(state, who);
            const feeling = bondWord(level);
            const bond = bondOf(state, who);
            const mine = isLover(state, who);
            const gift = giftBlock(state, who);
            const take = loverBlock(state, who);
            const visit = visitBlock(state, who);
            const canBeLiked = isPerson(who) && doings.get(who) !== 'gone';
            /* The thing at the woodpile is somebody and is not a person, so
               the two buttons say what they actually do to a wolf. */
            const beast = who === 'wolf';

            /* What each of the three buttons is, in words, for the card under
               the pointer and for a reader who cannot see the marks. */
            const giftLabel = beast ? BOND_UI.wolfGiftLabel : BOND_UI.giftLabel;
            const takeLabel = beast ? BOND_UI.wolfTakeLabel : BOND_UI.loverLabel;
            const kissLabel = beast ? BOND_UI.wolfKissLabel : BOND_UI.kissLabel;

            const giftWhy =
              gift === null
                ? fill(BOND_UI.giftLine, CONFIG.bond.giftCost, 0)
                : gift === 'top'
                  ? BOND_UI.giftTop
                  : gift === 'poor'
                    ? BOND_UI.giftPoor
                    : gift === 'gone'
                      ? BOND_UI.giftGone
                      : BOND_UI.giftWait.replace('{n}', String(giftAgainAt(state, who)));

            const takeWhy = mine
              ? BOND_UI.loverSince.replace('{n}', String(bond.loverSince ?? state.turn))
              : take === null
                ? fill(
                    beast ? BOND_UI.wolfTakeLine : BOND_UI.loverLine,
                    CONFIG.bond.loverCost,
                    CONFIG.bond.loverSanity,
                  )
                : take === 'taken'
                  ? BOND_UI.loverHas
                  : take === 'poor'
                    ? BOND_UI.giftPoor
                    : take === 'gone'
                      ? BOND_UI.giftGone
                      : take === 'child'
                        ? BOND_UI.loverChild
                        : BOND_UI.loverNeeds;

            const kissWhy =
              visit === null
                ? fill(BOND_UI.kissLine, 0, CONFIG.bond.kissSanity)
                : visit === 'waiting'
                  ? BOND_UI.kissWait.replace('{n}', String(visitAgainAt(state, who)))
                  : visit === 'gone'
                    ? BOND_UI.giftGone
                    : BOND_UI.kissNotYours;

            return (
              <li
                key={who}
                className={`flex items-start gap-3 rounded-md border bg-ink-soft p-3 ${
                  mine ? 'border-seal/70' : 'border-ink-line'
                }`}
              >
                <PersonPortrait character={who} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    {/* How they feel about you, in one mark, before their
                        name: a register of thirty faces is read at a glance,
                        and the glance lands here. The words are under the
                        pointer.

                        Under the pointer, and in a card of the game's own
                        making. It was a `title`, which the browser draws in
                        its own grey lettering, at its own moment, wherever
                        the pointer happens to be: it landed across the name
                        and the line under it, so resting on the mark hid the
                        person it was about. This opens under the mark, out of
                        the way of the row, with the rung in the game's words
                        over the line in the town's. Asked for by the user. */}
                    {canBeLiked && (
                      <span className="group relative text-[14px] leading-none">
                        <span aria-hidden className="cursor-help">
                          {feeling.mark}
                        </span>
                        <span className="sr-only">
                          {person.label} {feeling.word}. {feeling.line}
                        </span>
                        <span className="pointer-events-none absolute left-0 top-full z-50 mt-1.5 hidden w-[240px] rounded-lg border border-ink-line bg-ink p-2.5 text-left shadow-[0_14px_30px_rgba(0,0,0,0.5)] group-hover:block">
                          <span className="block text-[12px] leading-snug text-parchment">
                            {person.label} {feeling.word}
                          </span>
                          <span className="mt-1 block text-[11px] leading-snug text-parchment-dim">
                            {feeling.line}
                          </span>
                        </span>
                      </span>
                    )}
                    <span className="text-[15px] text-parchment">{characterTitle(who)}</span>
                    {mine && (
                      <span className="text-[11px] text-seal">
                        <span aria-hidden>{BOND_UI.loverMark}</span> {BOND_UI.loverIs}
                      </span>
                    )}
                    {/* How old they are now, not how old they were: a girl of
                        nine who came to the door in year three is twenty six by
                        the end of a long reign, and that is the one fact about
                        her the log cannot tell you. */}
                    {ages.has(who) && (
                      <span className="text-[11px] text-parchment-dim">
                        {UI.register.aged.replace('{n}', String(ages.get(who)))}
                      </span>
                    )}
                    <span className="text-[11px] text-parchment-dim">
                      {UI.register.metOn.replace('{turn}', String(person.entries[0].turn))}
                    </span>
                  </div>

                  <p className="mt-1 text-[12px] leading-snug text-parchment/85">
                    {DOING_LINES[doings.get(who) ?? folkLook(who).doing]}
                  </p>

                  {canBeLiked && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Hint label={giftLabel} line={giftWhy}>
                        <button
                          type="button"
                          disabled={gift !== null}
                          onClick={() => onGift(who)}
                          className={`${act} ${
                            gift === null
                              ? 'border-seal/60 bg-seal/15 text-parchment'
                              : 'border-ink-line text-parchment-dim'
                          }`}
                        >
                          <span aria-hidden>🎁</span>
                          <span className="ml-1 tabular-nums text-parchment-dim">
                            {CONFIG.bond.giftCost}
                          </span>
                          <span className="sr-only">
                            {giftLabel}. {giftWhy}
                          </span>
                        </button>
                      </Hint>
                      <Hint label={takeLabel} line={takeWhy}>
                      <button
                        type="button"
                        disabled={mine || take !== null}
                        onClick={() => onTake(who)}
                        className={`${act} ${
                          !mine && take === null
                            ? 'border-seal/60 bg-seal/15 text-parchment'
                            : 'border-ink-line text-parchment-dim'
                        }`}
                      >
                        <span className="sr-only">
                          {takeLabel}. {takeWhy}
                        </span>
                        <span aria-hidden>{BOND_UI.loverMark}</span>
                        <span className="ml-1 tabular-nums text-parchment-dim">
                          {CONFIG.bond.loverCost}
                        </span>
                        {/* and what it gives back, which is the one steady thing in a
                            whole reign and was only ever said in a sentence */}
                        <span
                          className="ml-1.5 tabular-nums text-good"
                          title={BOND_UI.crownGain.replace(
                            '{n}',
                            String(CONFIG.bond.loverSanity),
                          )}
                        >
                          <span aria-hidden>{crownMark}</span> +{CONFIG.bond.loverSanity}
                        </span>
                      </button>
                      </Hint>
                      {/* And the one that only ever appears beside one face in
                          the whole register: the one you took, and only every
                          other year. It costs nothing, which is why it is the
                          only button here with no number on it. */}
                      {mine && (
                        <Hint label={kissLabel} line={kissWhy}>
                          <button
                            type="button"
                            disabled={visit !== null}
                            onClick={() => onVisit(who)}
                            className={`${act} ${
                              visit === null
                                ? 'border-seal/60 bg-seal/15 text-parchment'
                                : 'border-ink-line text-parchment-dim'
                            }`}
                          >
                            <span className="sr-only">
                              {kissLabel}. {kissWhy}
                            </span>
                            <span aria-hidden>{BOND_UI.kissMark}</span>
                            <span className="ml-1.5 tabular-nums text-good">
                              <span aria-hidden>{crownMark}</span> +{CONFIG.bond.kissSanity}
                            </span>
                          </button>
                        </Hint>
                      )}
                      {/* And no line of grey text under the row. It said what
                          a gift costs and what it does beside every face in
                          the register, which is the same sentence thirty times
                          down one page. It is on the button it belongs to now,
                          under the pointer. Asked for by the user. */}
                    </div>
                  )}

                  <ul className="mt-1.5 space-y-1.5">
                    {person.entries.map((entry, i) => (
                      <li key={i} className="text-[12px] leading-snug">
                        <span className="text-parchment/85">{entry.title}</span>
                        <span className="text-parchment-dim"> - {entry.decision}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* What they are doing now, drawn the way the town draws them.
                    It sits on the far side of the card rather than under the
                    name: two pictures of one person touching each other read as
                    one broken picture, and this one is the answer to a different
                    question than the face is. */}
                <div className="self-center">
                  <FolkIcon
                    character={who}
                    doing={doings.get(who) ?? folkLook(who).doing}
                    size={44}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
