import { rand01 } from '../../engine/rng';
import type { Season } from '../../engine/types';
import { brush, cue, murmur, texture } from './synthesis';
import type { Cue } from './synthesis';

/**
 * The bed is not on a clock.
 *
 * Twice now this file has been heard as a clock striking, and both times for
 * the same reason: something with a shape to it was fired on a fixed period.
 * First a pair of wooden taps every ten seconds. Then, worse, a hushed crowd
 * murmur every eight, which is three descending tones at 165 Hz and is what a
 * hall clock does on the hour.
 *
 * So there is now no periodic event of any kind. The wind is one continuous
 * pair of loops that start once and never restart, running at rates whose
 * ratio is irrational enough that the two-second texture underneath them never
 * lines up with itself. Everything else is rare: one sound every half minute
 * or so, at a gap that is different every time, and never a voice. Voices in
 * this game belong to people who are talking to you.
 */
/** Not the reign's. The weather is not something a seed should decide. */
const BED_SEED = 90210;

const KEY = 'lawmaker_sound_v1';
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambience: GainNode | null = null;
let buffer: AudioBuffer | null = null;
type WindVoice = {
  source: AudioBufferSourceNode;
  gain: GainNode;
  filter: BiquadFilterNode;
  tilt: number;
};
let wind: WindVoice[] = [];
let timer: number | null = null;
let wanted = true;
let volume = .55;
let mounted = false;
let season: Season = 'spring';
let quiet = false;
let settled = false;
let beat = 0;
let nextAt = 0;
let voiceUntil = 0;
const recent = new Map<string, number>();

export function preference(): { on: boolean; volume: number } {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (saved && typeof saved.on === 'boolean') wanted = saved.on;
    if (saved && Number.isFinite(saved.volume)) volume = Math.max(0, Math.min(1, saved.volume));
  } catch { /* A preference may be unavailable or from an older browser. */ }
  return { on: wanted, volume };
}

function remember(): void {
  try { localStorage.setItem(KEY, JSON.stringify({ on: wanted, volume })); }
  catch { /* The sound still works without storage. */ }
}

function audible(): boolean {
  return mounted && wanted && !document.hidden && ctx?.state === 'running';
}

function mix(): void {
  if (!ctx || !master || !ambience) return;
  const at = ctx.currentTime;
  master.gain.cancelScheduledValues(at);
  master.gain.setTargetAtTime(mounted && wanted && !document.hidden ? volume * .45 : 0, at, .035);
  ambience.gain.cancelScheduledValues(at);
  ambience.gain.setTargetAtTime(quiet ? .24 : .65, at, .25);
  weather();
}

/**
 * The wind. Started once, on the first gesture, and never started again.
 *
 * Two loops of the same two second texture at rates that do not divide into
 * each other, so the pattern underneath takes about three minutes to come
 * round and by then it has drifted anyway. Nothing here has an attack, so
 * there is nothing for an ear to count.
 */
function buildWind(): void {
  if (!ctx || !ambience || !buffer || wind.length) return;
  for (const [rate, tilt] of [[1, 1], [0.6187, 1.9]] as const) {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.playbackRate.value = rate;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800 * tilt;
    filter.Q.value = .45;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    source.connect(filter).connect(gain).connect(ambience);
    source.start();
    wind.push({ source, gain, filter, tilt });
  }
  weather();
}

/** What the wind is doing this season, moved into over seconds, never cut. */
function weather(): void {
  if (!ctx || !wind.length) return;
  const at = ctx.currentTime;
  const winter = season === 'winter';
  // The whole bed is quieter than the old one by about half. It is a floor for
  // the room to sit on, not something anybody should be able to point at.
  // and a place with roofs on it is a place standing out of the wind
  const shelter = settled ? .82 : 1;
  const level = (quiet ? .012 : winter ? .05 : season === 'autumn' ? .042 : .032) * shelter;
  const hz = winter ? 430 : season === 'autumn' ? 1150 : 900;
  for (const voice of wind) {
    voice.gain.gain.setTargetAtTime(level / voice.tilt, at, 4);
    voice.filter.frequency.setTargetAtTime(hz * voice.tilt, at, 5);
  }
}

/**
 * One rare thing, at a gap that is never the same twice.
 *
 * Half a minute is the floor and a minute is the ceiling, which for a scene
 * somebody reads in twenty seconds means most cards go by in nothing but wind.
 * That is the point: this is a place, not a soundtrack.
 */
function schedule(): void {
  if (!audible() || !ctx || !ambience || !buffer) return;
  if (ctx.currentTime < nextAt) return;
  const at = ctx.currentTime + .02;

  // The first pass only starts the wind and sets the next gap; a sound the
  // instant somebody clicks anything is a sound they will attribute to the click.
  if (beat > 0 && !quiet) {
    const roll = rand01(BED_SEED, 'cue', beat);
    if (season === 'spring' || season === 'summer') {
      if (roll > .34) {
        cue(ctx, ambience, buffer, 'bird', at, .34);
        if (roll > .82) cue(ctx, ambience, buffer, 'bird', at + .6 + roll * .7, .2);
      }
    } else if (season === 'autumn') {
      // a gust going through what is left on the trees, and no attack on it
      if (roll > .5) brush(ctx, ambience, buffer, at, 6.5, .035, 3200);
    } else if (roll > .72) {
      // winter: a long way off, and only now and then
      cue(ctx, ambience, buffer, 'wood', at, .1);
    }
  }

  beat++;
  // 30 to 62 seconds, and the gap itself never repeats
  nextAt = at + 30 + rand01(BED_SEED, 'gap', beat) * 32;
}

/** Called only from a pointer or keyboard gesture. Failure never affects play. */
export function wake(): void {
  if (!mounted || !wanted || document.hidden) return;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = 0;
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -14;
      limiter.ratio.value = 6;
      master.connect(limiter).connect(ctx.destination);
      ambience = ctx.createGain();
      ambience.connect(master);
      buffer = texture(ctx);
      buildWind();
    }
    mix();
    void ctx.resume().then(() => { mix(); schedule(); }).catch(() => { /* Try the next gesture. */ });
    if (timer === null) timer = window.setInterval(schedule, 400);
  } catch { /* Missing or unavailable sound hardware leaves the game playable. */ }
}

export function setEnabled(on: boolean): void {
  wanted = on;
  remember();
  mix();
  if (on) wake();
  else dispose();
}

export function setVolume(value: number): void {
  volume = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : .55;
  remember();
  mix();
}

export function environment(nextSeason: Season, hushed: boolean, populated: boolean): void {
  season = nextSeason;
  quiet = hushed;
  settled = populated;
  mix();
}

export function play(name: Cue, gap = .09): void {
  if (!audible() || !ctx || !master || !buffer) return;
  const now = ctx.currentTime;
  if (now - (recent.get(name) ?? -100) < gap) return;
  recent.set(name, now);
  cue(ctx, master, buffer, name);
}

export function speak(character: string, hushed: boolean): boolean {
  if (!audible() || !ctx || !master || ctx.currentTime < voiceUntil) return false;
  voiceUntil = ctx.currentTime + 1.1;
  murmur(ctx, master, character, hushed);
  return true;
}

export function attach(): () => void {
  mounted = true;
  const visibility = () => {
    mix();
    if (document.hidden) {
      // Closing discards queued voices as well as ambience on returning to the tab.
      dispose();
    } else wake();
  };
  window.addEventListener('pointerdown', wake, true);
  window.addEventListener('keydown', wake, true);
  document.addEventListener('visibilitychange', visibility);
  return () => {
    mounted = false;
    window.removeEventListener('pointerdown', wake, true);
    window.removeEventListener('keydown', wake, true);
    document.removeEventListener('visibilitychange', visibility);
    dispose();
  };
}

function dispose(): void {
  if (timer !== null) window.clearInterval(timer);
  timer = null;
  for (const voice of wind) {
    try { voice.source.stop(); } catch { /* already stopped with the context */ }
    voice.source.disconnect();
  }
  wind = [];
  beat = 0;
  if (ctx) void ctx.close().catch(() => {});
  ctx = null;
  master = null;
  ambience = null;
  buffer = null;
  nextAt = 0;
  voiceUntil = 0;
  recent.clear();
}
