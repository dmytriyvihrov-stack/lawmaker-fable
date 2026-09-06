import { useEffect, useState } from 'react';
import { UI } from '../../content/ui-strings';
import type { Season } from '../../engine/types';
import { isPlaying, musicWanted, setSeason, setSeed, toggle } from '../music';

interface Props {
  seed: number;
  season: Season;
}

/**
 * The switch for the music, and nothing else. It starts off: a browser will
 * not make a sound before somebody asks, and neither should a game. Once it
 * has been asked once, it remembers, and the next reign starts already playing.
 */
export function MusicToggle({ seed, season }: Props) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setSeed(seed);
  }, [seed]);

  useEffect(() => {
    setSeason(season);
  }, [season]);

  // it was on last time, so it is on this time, at the first thing they click
  useEffect(() => {
    if (!musicWanted() || isPlaying()) return;
    const wake = (): void => {
      if (!isPlaying()) setOn(toggle());
      window.removeEventListener('pointerdown', wake);
    };
    window.addEventListener('pointerdown', wake);
    return () => window.removeEventListener('pointerdown', wake);
  }, []);

  return (
    <button
      type="button"
      onClick={() => setOn(toggle())}
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
