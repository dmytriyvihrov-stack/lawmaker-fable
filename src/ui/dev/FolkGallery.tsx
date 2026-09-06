import { CityScape } from '../components/CityScape';
import { FolkIcon } from '../components/Folk';
import { PersonPortrait } from '../components/PersonPortrait';
import { FOLK, STATIONS } from '../../content/folk';
import type { Doing } from '../../content/folk';
import { characterMeta } from '../../content/meta';
import type { FolkPin } from '../../engine/folk';
import type { StatId } from '../../engine/types';

/**
 * Dev only: ?folk=1 puts everybody in the picture at once.
 *
 * Twenty seven people and twenty two things to be doing is more combinations
 * than a reign will ever show, and the only way to know whether a hood reads
 * at eight pixels is to look at all of them side by side next to the portrait
 * they are supposed to be the same person as.
 */

const DOINGS = Object.keys(STATIONS) as Doing[];

const STATS: Record<StatId, number> = {
  crownSanity: 70,
  mood: 72,
  health: 60,
  economy: 60,
  army: 50,
  culture: 55,
};

export function FolkGallery() {
  // one of everybody, each doing something different, all in the town at once
  const everyone = Object.keys(FOLK).filter((c) => c !== 'monarch' && c !== 'crowd');
  const pins: FolkPin[] = everyone.map((character, i) => {
    const doing = FOLK[character].doing;
    const station = STATIONS[doing];
    return {
      character,
      label: characterMeta(character).label,
      doing,
      x: station.x,
      y: station.y,
      turn: i + 1,
      dur: `${11 + ((i * 7) % 9)}s`,
      delay: `-${(i * 1.9) % 8}s`,
      span: `${station.span}px`,
    };
  });

  // and one figure per doing, so every drawing gets looked at whether or not
  // anybody in this reign ever ended up doing it
  const allDoings: FolkPin[] = DOINGS.filter((d) => d !== 'gone').map((doing, i) => ({
    character: 'digger',
    label: doing,
    doing,
    x: -40 + i * 26,
    y: 140,
    turn: 1,
    dur: '14s',
    delay: '0s',
    span: '0px',
  }));

  return (
    <div className="space-y-6 p-4">
      <div className="h-[240px] w-full overflow-hidden border border-ink-line">
        <CityScape
          stats={STATS}
          cityFlags={[]}
          population={40}
          stage="town"
          season="summer"
          folk={pins}
        />
      </div>

      <div className="h-[200px] w-full overflow-hidden border border-ink-line">
        <CityScape
          stats={STATS}
          cityFlags={[]}
          population={6}
          stage="town"
          season="autumn"
          folk={allDoings}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        {DOINGS.map((doing) => (
          <figure key={doing} className="w-[120px]">
            <FolkIcon character="digger" doing={doing} size={120} />
            <figcaption className="mt-1 text-[10px] text-parchment-dim">{doing}</figcaption>
          </figure>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {Object.keys(FOLK).map((character) => (
          <figure key={character} className="w-[96px]">
            <PersonPortrait character={character} size={96} />
            <FolkIcon character={character} doing={FOLK[character].doing} size={96} />
            <figcaption className="mt-1 text-[10px] text-parchment-dim">
              {characterMeta(character).label}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
