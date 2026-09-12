import { useEffect, useSyncExternalStore } from 'react';
import { UI } from '../../content/ui-strings';
import type { Season } from '../../engine/types';
import { hush, isPlaying, musicWanted, setSeason, setSeed, subscribeMusic, toggle } from '../music';

interface Props {
  seed: number;
  season: Season;
  /**
   * A grave scene is on the screen, so the music comes almost all the way
   * down. Absent on the menu, where there is no scene to be grave.
   */
  hushed?: boolean;
}

/**
 * The switch for the music, and nothing else.
 *
 * It starts on, and it starts silent, because those are two different facts. A
 * browser will not make a sound until somebody has clicked something, so the
 * card opens on the first click anywhere and the note in the corner says so
 * from the start: drawn struck through until then, it read as a game with the
 * music switched off, and the first thing a player did about it was press the
 * one control that turns it off.
 *
 * Turned off, it stays off for the rest of that reign and no longer: a new
 * one opens with the room full again (`wantMusic`). Which is why this reads
 * the preference rather than keeping its own copy of it - the thing that
 * turns it back on is a new reign, and that happens with this on the screen.
 */
export function MusicToggle({ seed, season, hushed = false }: Props) {
  const on = useSyncExternalStore(subscribeMusic, musicWanted, musicWanted);

  useEffect(() => {
    setSeed(seed);
  }, [seed]);

  useEffect(() => {
    setSeason(season);
  }, [season]);

  useEffect(() => {
    hush(hushed);
  }, [hushed]);

  // it was on last time, so it is on this time, at the first thing they click
  useEffect(() => {
    if (!musicWanted() || isPlaying()) return;
    const wake = (): void => {
      if (!isPlaying()) toggle();
      window.removeEventListener('pointerdown', wake);
    };
    window.addEventListener('pointerdown', wake);
    return () => window.removeEventListener('pointerdown', wake);
  }, []);

  return (
    <button
      type="button"
      onClick={() => toggle()}
      title={on ? UI.music.off : UI.music.on}
      aria-label={on ? UI.music.off : UI.music.on}
      aria-pressed={on}
      className={`rounded-md border border-ink-line bg-ink/80 px-1.5 py-0.5 text-[13px] leading-none transition-opacity ${
        on ? 'text-parchment opacity-90' : 'text-parchment-dim opacity-40 hover:opacity-80'
      }`}
    >
      <span aria-hidden className={on ? undefined : 'line-through decoration-1'}>
        ♪
      </span>
    </button>
  );
}
