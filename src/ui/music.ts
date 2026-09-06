import { rand01 } from '../engine/rng';
import type { Season } from '../engine/types';

/**
 * The music.
 *
 * There are no sound files, because there are no dependencies and no network
 * requests: every note here is made out of an oscillator and an envelope, in
 * the browser, the moment it is heard. That constraint turns out to suit the
 * game. What a place like this wants is not a soundtrack, it is weather with
 * pitch: a low drone that is simply the room, and single notes falling into it
 * at about the rate somebody would pluck them if they were not really thinking
 * about it.
 *
 * The year picks the mode. Spring and summer are open fifths and a major
 * pentatonic; autumn drops to the minor; the long winter is the same notes,
 * lower, slower, and further apart. Which note comes next is `rng.ts`, seeded
 * from the reign, so the same reign always sounds the same way.
 *
 * This is UI, not engine: it is all side effect, it holds a handle to the
 * sound card, and nothing in `src/engine` knows it exists.
 */

const STORE_KEY = 'lawmaker_music_v1';

/** Root, scale and pace of one season, in semitones over the root. */
interface Mode {
  root: number;
  scale: number[];
  /** Seconds between plucked notes. */
  pace: number;
  /** How often a note is simply not played, 0..1. */
  rest: number;
  droneGain: number;
}

const MAJOR = [0, 2, 4, 7, 9, 12, 14];
const MINOR = [0, 3, 5, 7, 10, 12, 15];

const MODES: Record<Season, Mode> = {
  spring: { root: 220.0, scale: MAJOR, pace: 1.7, rest: 0.22, droneGain: 0.1 },
  summer: { root: 196.0, scale: MAJOR, pace: 2.0, rest: 0.26, droneGain: 0.12 },
  autumn: { root: 164.81, scale: MINOR, pace: 2.3, rest: 0.3, droneGain: 0.11 },
  winter: { root: 146.83, scale: MINOR, pace: 3.3, rest: 0.42, droneGain: 0.14 },
};

/** How loud the whole thing ever gets. Quiet enough to think over. */
const MASTER = 0.16;
/** How far ahead notes are written into the sound card, in seconds. */
const LOOKAHEAD = 1.2;

function semitone(root: number, steps: number): number {
  return root * Math.pow(2, steps / 12);
}

export function musicWanted(): boolean {
  try {
    return window.localStorage.getItem(STORE_KEY) === 'on';
  } catch {
    return false;
  }
}

function remember(on: boolean): void {
  try {
    window.localStorage.setItem(STORE_KEY, on ? 'on' : 'off');
  } catch {
    // a browser that will not remember it is a browser that asks every time
  }
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let drone: { osc: OscillatorNode[]; gain: GainNode } | null = null;
let timer: number | null = null;
let nextNoteAt = 0;
let step = 0;
let seed = 1;
let season: Season = 'spring';
let playing = false;

/** One plucked note: two barely detuned voices, and a long soft tail. */
function pluck(at: number, freq: number, level: number): void {
  if (!ctx || !master) return;
  const voice = ctx.createGain();
  voice.gain.setValueAtTime(0, at);
  voice.gain.linearRampToValueAtTime(level, at + 0.04);
  voice.gain.exponentialRampToValueAtTime(0.0001, at + 2.6);

  const soften = ctx.createBiquadFilter();
  soften.type = 'lowpass';
  soften.frequency.setValueAtTime(1800, at);
  soften.frequency.exponentialRampToValueAtTime(600, at + 2.2);

  for (const [type, detune, mix] of [
    ['sine', 0, 1],
    ['triangle', 7, 0.45],
  ] as [OscillatorType, number, number][]) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    osc.detune.setValueAtTime(detune, at);
    const trim = ctx.createGain();
    trim.gain.value = mix;
    osc.connect(trim).connect(soften);
    osc.start(at);
    osc.stop(at + 2.8);
  }

  soften.connect(voice).connect(master);
}

/**
 * Write whatever notes fall inside the look-ahead window into the sound card
 * and get out of the way. This is a scheduler for audio, not for the game: the
 * reign does not advance by a millisecond because of anything in this file.
 */
function schedule(): void {
  if (!ctx) return;
  const mode = MODES[season];
  while (nextNoteAt < ctx.currentTime + LOOKAHEAD) {
    const roll = rand01(seed, 'note', step);
    if (roll > mode.rest) {
      const pickRoll = rand01(seed, 'pitch', step);
      const degree = Math.floor(pickRoll * mode.scale.length) % mode.scale.length;
      // a quieter note now and then, so the line breathes instead of marching
      const level = 0.22 + rand01(seed, 'level', step) * 0.18;
      pluck(nextNoteAt, semitone(mode.root, mode.scale[degree]), level);
      // and every so often the fifth above it, which is the whole harmony
      if (rand01(seed, 'pair', step) > 0.78) {
        pluck(nextNoteAt + 0.19, semitone(mode.root, mode.scale[degree] + 7), level * 0.55);
      }
    }
    // the pace wanders a little, because nothing in this place is on a metronome
    nextNoteAt += mode.pace * (0.78 + rand01(seed, 'gap', step) * 0.5);
    step += 1;
  }
}

function buildDrone(): void {
  if (!ctx || !master) return;
  const gain = ctx.createGain();
  gain.gain.value = MODES[season].droneGain;
  const soften = ctx.createBiquadFilter();
  soften.type = 'lowpass';
  soften.frequency.value = 420;
  const osc: OscillatorNode[] = [];
  for (const [steps, detune, type] of [
    [-12, -4, 'sine'],
    [-12, 5, 'sine'],
    [-5, 0, 'triangle'],
  ] as [number, number, OscillatorType][]) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = semitone(MODES[season].root, steps);
    o.detune.value = detune;
    const trim = ctx.createGain();
    trim.gain.value = type === 'triangle' ? 0.3 : 0.55;
    o.connect(trim).connect(soften);
    o.start();
    osc.push(o);
  }
  soften.connect(gain).connect(master);
  drone = { osc, gain };
}

/** Move the drone to the season without stopping it. A year turns, it does not cut. */
export function setSeason(next: Season): void {
  season = next;
  if (!ctx || !drone) return;
  const mode = MODES[next];
  const at = ctx.currentTime;
  drone.gain.gain.linearRampToValueAtTime(mode.droneGain, at + 3);
  const steps = [-12, -12, -5];
  drone.osc.forEach((o, i) => {
    o.frequency.linearRampToValueAtTime(semitone(mode.root, steps[i]), at + 3);
  });
}

/** The reign the notes are drawn from, so one seed always sounds like itself. */
export function setSeed(next: number): void {
  seed = next;
}

export function isPlaying(): boolean {
  return playing;
}

/**
 * Start. Must be called from a real click: every browser refuses to make a
 * sound until somebody has asked for one, which is the correct policy.
 */
export function start(): void {
  if (playing) return;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      buildDrone();
    }
    void ctx.resume();
    master?.gain.cancelScheduledValues(ctx.currentTime);
    master?.gain.linearRampToValueAtTime(MASTER, ctx.currentTime + 2.5);
    nextNoteAt = ctx.currentTime + 0.4;
    schedule();
    timer = window.setInterval(schedule, 400);
    playing = true;
    remember(true);
  } catch {
    // no sound card, no sound. The game is not about the sound.
  }
}

/** Stop, over a couple of seconds, because a hard cut is its own noise. */
export function stop(): void {
  if (!playing || !ctx || !master) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
  if (timer !== null) window.clearInterval(timer);
  timer = null;
  playing = false;
  remember(false);
}

export function toggle(): boolean {
  if (playing) stop();
  else start();
  return playing;
}
