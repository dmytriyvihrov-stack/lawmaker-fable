import { isWinter, yearsToWinter } from '../engine/simulation';
import { UI } from './ui-strings';
import type { Stage, StatId } from '../engine/types';

/**
 * The numbers are on screen, but somebody still says what they mean.
 * One short line per board, picked by band, plus the forecast.
 */

interface Band {
  /** Upper bound, inclusive. Bands are read in order. */
  upTo: number;
  line: string;
  urgent?: boolean;
}

const READINGS: Record<StatId, Band[]> = {
  crownSanity: [
    { upTo: 10, line: 'The monarch is legislating in a dressing gown, from the balcony.', urgent: true },
    { upTo: 30, line: 'The monarch signs your decrees without looking at them.', urgent: true },
    { upTo: 70, line: 'The monarch is content enough to be dangerous.' },
    { upTo: 100, line: 'The monarch has had your name embroidered on something.' },
  ],
  mood: [
    { upTo: 10, line: 'Somebody is burning something in the square tonight.', urgent: true },
    { upTo: 30, line: 'The square goes quiet when the guard walks through it.', urgent: true },
    { upTo: 60, line: 'The town grumbles at the usual volume.' },
    { upTo: 80, line: 'People are singing at the gate again, badly.' },
    { upTo: 100, line: 'Strangers are being given directions and also soup.' },
  ],
  health: [
    { upTo: 10, line: 'The long room has run out of floor.', urgent: true },
    { upTo: 30, line: 'The Healer has stopped writing things down.', urgent: true },
    { upTo: 60, line: 'The usual coughs, the usual bones.' },
    { upTo: 80, line: 'Nobody has died of anything interesting this year.' },
    { upTo: 100, line: 'The long room is empty and the Healer is bored.' },
  ],
  economy: [
    { upTo: 10, line: 'The market has three stalls and one of them sells the other two.', urgent: true },
    { upTo: 30, line: 'The Treasurer has started counting twice.', urgent: true },
    { upTo: 60, line: 'The market holds, more or less.' },
    { upTo: 80, line: 'There is building work on the east side again.' },
    { upTo: 100, line: 'Carts queue at the gate to get IN.' },
  ],
  army: [
    { upTo: 10, line: 'The wall is guarded by a rota of volunteers and one dog.', urgent: true },
    { upTo: 30, line: 'The Captain has stopped asking for men and started asking for luck.', urgent: true },
    { upTo: 60, line: 'The watch walks its rounds and mostly stays awake.' },
    { upTo: 80, line: 'The gate guard has matching boots this year.' },
    { upTo: 100, line: 'Other towns send their sergeants here to learn.' },
  ],
  culture: [
    { upTo: 10, line: 'Nobody has sung in the square since anyone can remember.', urgent: true },
    { upTo: 30, line: 'There is one fiddle in town and it is broken.' },
    { upTo: 60, line: 'The bell rings on the right days, mostly.' },
    { upTo: 80, line: 'Somebody has started painting the doors.' },
    { upTo: 100, line: 'Other towns send their children here to learn the songs.' },
  ],
};

/** The hamlet has its own vocabulary for the three boards it does have. */
const VILLAGE_READINGS: Partial<Record<StatId, Band[]>> = {
  health: [
    { upTo: 10, line: 'Two of you are coughing and there is nobody to send for.', urgent: true },
    { upTo: 30, line: 'Somebody has been in bed for a week and nobody says the word.', urgent: true },
    { upTo: 60, line: 'Everyone is upright, most mornings.' },
    { upTo: 80, line: 'Nobody has been ill since the thaw.' },
    { upTo: 100, line: 'Even the old ones are out in the field.' },
  ],
  economy: [
    { upTo: 10, line: 'The store is one sack and a promise.', urgent: true },
    { upTo: 30, line: 'The store will not reach spring and everybody knows the number.', urgent: true },
    { upTo: 60, line: 'There is enough in the store, if the winter is polite.' },
    { upTo: 80, line: 'The store is full and there is talk of a second barn.' },
    { upTo: 100, line: 'People have started burying grain because there is nowhere to put it.' },
  ],
};

function bandsFor(stage: Stage, stat: StatId): Band[] {
  if (stage === 'village' && VILLAGE_READINGS[stat]) return VILLAGE_READINGS[stat]!;
  return READINGS[stat];
}

export function readingFor(stat: StatId, value: number, stage: Stage = 'town'): string {
  const bands = bandsFor(stage, stat);
  for (const band of bands) {
    if (value <= band.upTo) return band.line;
  }
  return bands[bands.length - 1].line;
}

export function isUrgent(stat: StatId, value: number, stage: Stage = 'town'): boolean {
  const bands = bandsFor(stage, stat);
  for (const band of bands) {
    if (value <= band.upTo) return band.urgent === true;
  }
  return false;
}

/**
 * The line under the dials, and only ever one of them. A dial already says how
 * far down a board is; a sentence saying the same thing next to it is the same
 * fact twice. So the header speaks only when a board has gone somewhere a
 * player should be looking at, and says the worst of it, once. Everything
 * calmer than that is still there, on the dial, under the pointer.
 */
export function townReading(stats: Record<StatId, number>, stage: Stage = 'town'): string[] {
  const boards: StatId[] =
    stage === 'village' ? ['economy', 'health'] : ['economy', 'health', 'mood', 'army', 'culture'];
  const urgent = boards.filter((s) => isUrgent(s, stats[s], stage));
  if (urgent.length === 0) return [];
  const worst = urgent.reduce((a, b) => (stats[b] < stats[a] ? b : a));
  return [readingFor(worst, stats[worst], stage)];
}

/** The forecast line. Null when the winter is not worth mentioning yet. */
export function winterLine(turn: number): string | null {
  if (isWinter(turn)) return UI.court.winterHere;
  const left = yearsToWinter(turn);
  if (left <= 2) return UI.court.winterNear;
  return null;
}
