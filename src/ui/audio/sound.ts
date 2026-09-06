import type { Season } from '../../engine/types';
import { cue, murmur, texture } from './synthesis';
import type { Cue } from './synthesis';

/**
 * There is no ambience any more.
 *
 * Three versions of a background bed were written and all three were heard as
 * something wrong with the room. First a pair of wooden taps every ten
 * seconds. Then a hushed crowd murmur every eight, which is three descending
 * tones at 165 Hz and is a hall clock on the hour. Then a continuous pair of
 * wind loops with rare cues over them, which was reported as worse than either.
 *
 * So the conclusion is not "tune it again", it is that this game does not want
 * one. Every sound left in here is the answer to something the player just
 * did: a seal pressed, a ruling read out, a word taken off the bench, a click
 * on the river, the voice of whoever is at the door. Silence in between is
 * correct, and the music toggle is there for anybody who wants the room filled,
 * which is what that toggle is for.
 *
 * If atmosphere is ever wanted back, it does not go here. It goes in
 * `music.ts`, behind the toggle somebody has already opted into.
 */

const KEY = 'lawmaker_sound_v1';
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambience: GainNode | null = null;
let buffer: AudioBuffer | null = null;
let wanted = true;
let volume = .55;
let mounted = false;
let quiet = false;
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
    void ctx.resume().then(mix).catch(() => { /* Try the next gesture. */ });
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

/**
 * How grave the thing on screen is.
 *
 * All that is left of what used to be a whole weather system: whether the next
 * voice should be a hushed one and how far down to pull everything while a
 * scene is being acted out. The season and the size of the place no longer
 * change anything, because nothing plays on its own any more, but the call
 * keeps its shape so the caller does not have to know that.
 */
export function environment(_season: Season, hushed: boolean, _populated: boolean): void {
  quiet = hushed;
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
  if (ctx) void ctx.close().catch(() => {});
  ctx = null;
  master = null;
  ambience = null;
  buffer = null;
  voiceUntil = 0;
  recent.clear();
}
