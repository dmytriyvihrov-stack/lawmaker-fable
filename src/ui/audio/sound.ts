import type { Season } from '../../engine/types';
import { brush, cue, murmur, texture } from './synthesis';
import type { Cue } from './synthesis';

const KEY = 'lawmaker_sound_v1';
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambience: GainNode | null = null;
let buffer: AudioBuffer | null = null;
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
}

function schedule(): void {
  if (!audible() || !ctx || !ambience || !buffer) return;
  if (ctx.currentTime < nextAt) return;
  const at = ctx.currentTime + .02;
  // A short overlapping wind bed; no queue is accumulated while a tab is hidden.
  brush(ctx, ambience, buffer, at, 3.8, season === 'winter' ? .12 : .065, season === 'winter' ? 480 : 800);
  if (season !== 'winter') brush(ctx, ambience, buffer, at, 3.8, .07, 2600);
  if (!quiet) {
    if ((season === 'spring' || season === 'summer') && beat % 3 === 1) cue(ctx, ambience, buffer, 'bird', at + .4, .55);
    if (season === 'autumn') brush(ctx, ambience, buffer, at, 3.5, .09, 3500);
    // A settled place used to knock twice on a fixed beat, which is a clock and
    // not a village: two dry wooden taps every ten seconds is the one sound a
    // room notices and cannot stop noticing. What is left is voices, which
    // wander, and the wind, which does not repeat.
    if (settled && beat % 3 === 2) murmur(ctx, ambience, 'crowd', true, at + .3);
  }
  beat++;
  nextAt = at + 2.6;
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
  if (ctx) void ctx.close().catch(() => {});
  ctx = null;
  master = null;
  ambience = null;
  buffer = null;
  nextAt = 0;
  voiceUntil = 0;
  recent.clear();
}
