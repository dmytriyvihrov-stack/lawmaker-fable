import { useState } from 'react';
import { UI } from '../../content/ui-strings';

/**
 * The corner of the window nothing else was using.
 *
 * Everything else along the top is the reign: what it holds, how it feels,
 * what year it is. This is the one control here that is about the game rather
 * than about the place, so it stands apart at the end of the row and holds
 * exactly one thing: the way out of a reign that has stopped being
 * interesting. There is no way to leave one otherwise short of closing the
 * window, and a reign you cannot walk away from is a reign nobody starts a
 * second time.
 *
 * The warning is asked here rather than by the browser: a page asking whether
 * you are sure is a different voice from the game asking, and in some windows
 * that voice is not heard at all.
 */
export function Menu({ onBeginAnew }: { onBeginAnew: () => void }) {
  const [open, setOpen] = useState(false);
  const [sure, setSure] = useState(false);

  const close = () => {
    setOpen(false);
    setSure(false);
  };

  return (
    <span className="relative">
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-label={UI.menu.open}
        title={UI.menu.open}
        className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-ink-line px-2.5 text-[14px] leading-none text-parchment-dim hover:border-parchment-dim/60"
      >
        <span aria-hidden>{UI.menu.icon}</span>
        <span className="sr-only">{UI.menu.open}</span>
      </button>

      {open && (
        <>
          {/* anywhere else is the way out of it */}
          <span
            className="fixed inset-0 z-40 block cursor-default"
            onClick={close}
            aria-hidden
          />
          <span className="absolute right-0 top-10 z-50 block w-[248px] rounded-lg border border-ink-line bg-ink p-3 text-left shadow-[0_14px_30px_rgba(0,0,0,0.5)]">
            <span className="block text-[10px] uppercase tracking-[0.15em] text-parchment-dim">
              {UI.menu.heading}
            </span>

            {sure ? (
              <>
                <span className="mt-2 block text-[12px] leading-snug text-parchment/90">
                  {UI.menu.anewWarning}
                </span>
                <span className="mt-2.5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      onBeginAnew();
                    }}
                    className="min-h-[34px] flex-1 rounded-md bg-seal px-3 text-[12px] tracking-[0.1em] text-parchment"
                  >
                    {UI.menu.anewYes}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSure(false)}
                    className="min-h-[34px] flex-1 rounded-md border border-ink-line px-3 text-[12px] text-parchment-dim"
                  >
                    {UI.menu.anewNo}
                  </button>
                </span>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setSure(true)}
                className="mt-2 block w-full rounded-md border border-ink-line px-3 py-2 text-left text-[13px] text-parchment hover:border-parchment-dim/60"
              >
                {UI.menu.anew}
                <span className="mt-0.5 block text-[11px] leading-snug text-parchment-dim">
                  {UI.menu.anewLine}
                </span>
              </button>
            )}
          </span>
        </>
      )}
    </span>
  );
}
