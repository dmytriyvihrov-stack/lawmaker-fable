import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { HUSHED_CASES, SOUND_UI, voiceOf } from '../../content/sound';
import { monarchOf } from '../../engine/monarch';
import { getCase } from '../../engine/registry';
import type { GameState, Season } from '../../engine/types';
import { attach, environment, play, preference, setEnabled, setVolume, speak } from '../audio/sound';

interface Props {
  game: GameState;
  season: Season;
  ready: boolean;
  zoomed: boolean;
  mapRef: RefObject<HTMLDivElement>;
}

/** Effects follow visible events. Audio never dispatches a game action. */
export function Soundscape({ game, season, ready, zoomed, mapRef }: Props) {
  const [settings, setSettings] = useState(preference);
  const supported = typeof window.AudioContext === 'function'
    || typeof (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext === 'function';
  const current = game.current?.kind === 'case' ? getCase(game.current.id) : undefined;
  const hushed = !!current && HUSHED_CASES.has(current.id);
  const last = game.log[game.log.length - 1];
  const logKey = last ? `${last.turn}:${last.kind}:${last.refId}:${last.choiceId}` : '';
  const previousLog = useRef(logKey);
  const greeted = useRef('');

  useEffect(attach, []);
  useEffect(() => {
    environment(season, hushed || zoomed, game.population >= 18);
  }, [season, hushed, zoomed, game.population]);

  useEffect(() => {
    if (logKey !== previousLog.current && last) {
      play(last.kind === 'law' ? 'seal' : last.kind === 'work' ? 'wood' : 'ruling');
    }
    previousLog.current = logKey;
  }, [logKey, last]);

  useEffect(() => {
    if (!ready || !current) return;
    const key = `${game.seed}:${game.turn}:${current.id}`;
    const greet = () => {
      const voice = voiceOf(current.character, monarchOf(game.seed).voice);
      if (greeted.current !== key && speak(voice, hushed)) greeted.current = key;
    };
    greet();
    // A saved scene or the prototype may precede the browser's first gesture.
    window.addEventListener('pointerup', greet);
    window.addEventListener('keyup', greet);
    return () => {
      window.removeEventListener('pointerup', greet);
      window.removeEventListener('keyup', greet);
    };
  }, [ready, current, game.seed, game.turn, hushed]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || zoomed) return;
    const click = (event: MouseEvent) => {
      if (event.button !== 0 || !(event.target instanceof Element)) return;
      const svg = event.target.closest<SVGSVGElement>('svg.city-world');
      // Cards, pegs and the person knocking already have their own action.
      if (!svg || event.target.closest('[role="button"], button, a, input')) return;
      const matrix = svg.getScreenCTM();
      if (!matrix) return;
      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
      const river = svg.querySelector<SVGPathElement>('[data-river="water"]');
      if (river?.isPointInStroke(point)) play(season === 'winter' ? 'stone' : 'water', .2);
      else if (point.y < 275) { if (!hushed && season !== 'winter') play('bird', .8); }
      else if (event.target.closest('.town-folk')) play('rustle', .2);
      else play(point.x < 420 || point.x > 1120 ? 'rustle' : 'wood', .18);
    };
    map.addEventListener('click', click);
    return () => map.removeEventListener('click', click);
  }, [mapRef, zoomed, season, hushed]);

  return (
    <div className="flex items-center gap-1 rounded-md border border-ink-line bg-ink/90 px-1.5 py-1">
      <button type="button" disabled={!supported} aria-pressed={settings.on && supported}
        aria-label={!supported ? SOUND_UI.unavailable : settings.on ? SOUND_UI.off : SOUND_UI.on}
        title={!supported ? SOUND_UI.unavailable : settings.on ? SOUND_UI.off : SOUND_UI.on}
        onClick={() => {
          const on = !settings.on;
          setEnabled(on);
          setSettings({ ...settings, on });
        }}
        className={`text-[11px] ${settings.on && supported ? 'text-parchment' : 'text-parchment-dim line-through'}`}>
        {SOUND_UI.label}
      </button>
      <input type="range" min="0" max="100" step="5" value={Math.round(settings.volume * 100)}
        disabled={!supported} aria-label={SOUND_UI.volume} title={SOUND_UI.volume}
        className="h-3 w-14 accent-[#c5ae80]"
        onChange={(event) => {
          const volume = Number(event.target.value) / 100;
          setVolume(volume);
          setSettings({ ...settings, volume });
        }} />
    </div>
  );
}
