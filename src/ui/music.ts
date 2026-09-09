import { rand01 } from '../engine/rng';
import type { Season } from '../engine/types';

/**
 * The music.
 *
 * There are no sound files, because there are no dependencies and no network
 * requests: every note here is made out of an oscillator and an envelope, in
 * the browser, the moment it is heard. That constraint turns out to suit the
 * game.
 *
 * What it plays is what a settlement being built wants under it: a warm pad
 * of four voices that never stops, a chord that changes about every half
 * minute and takes six seconds to get there, one low breath under the whole
 * thing, and a bell over the top now and then. Nothing marches. The first cut
 * of this file was a drone and a plucked line, which is a lute in an empty
 * room; a place with people in it wants harmony that moves, because that is
 * what says the year is going somewhere.
 *
 * The year picks the mode and the progression. Spring and summer are open and
 * major, autumn drops to the minor, and the long winter is the same chords,
 * lower, slower and further apart. Which chord comes next and which bell rings
 * over it are `rng.ts`, seeded from the reign, so the same reign always sounds
 * the same way.
 *
 * This is UI, not engine: it is all side effect, it holds a handle to the
 * sound card, and nothing in `src/engine` knows it exists.
 */

const STORE_KEY = 'lawmaker_music_v1';

/**
 * One chord, as four voices in semitones over the root of the season.
 *
 * Four and not three: a triad played flat is a chord being demonstrated, and
 * the fourth voice sitting a ninth or a sixth off the root is the whole
 * difference between a pad and an organ. The voicings are kept inside two
 * octaves, because two voices a fifth apart down at the bottom is mud.
 */
type Chord = [number, number, number, number];

/** Root, colour and pace of one season. */
interface Mode {
  root: number;
  /** The chords it moves through, in order, before the seed shuffles them. */
  chords: Chord[];
  /** Which notes a bell may ring, in semitones over the root. */
  bells: number[];
  /** Seconds a chord is held before it starts moving to the next one. */
  hold: number;
  /** Seconds between bells. */
  pace: number;
  /** How often a bell is simply not rung, 0..1. */
  rest: number;
  padGain: number;
}

/* Open and major for the growing half of the year: the root with its fifth
   under a third and a ninth, then a sixth, then a fourth, then back through
   the fifth. Nothing here resolves hard, because a settlement is never
   finished. */
const OPEN: Chord[] = [
  [0, 7, 16, 26],
  [-3, 4, 12, 21],
  [-5, 2, 9, 19],
  [-5, 7, 14, 19],
];

/* And the same shapes with the third pulled down, for the half of the year
   the place is spending what it made. */
const CLOSED: Chord[] = [
  [0, 7, 15, 26],
  [-4, 3, 12, 20],
  [-5, 2, 10, 19],
  [-5, 7, 14, 22],
];

const MODES: Record<Season, Mode> = {
  spring: { root: 220.0, chords: OPEN, bells: [12, 14, 16, 19, 21, 24], hold: 24, pace: 5.5, rest: 0.3, padGain: 0.15 },
  summer: { root: 196.0, chords: OPEN, bells: [12, 14, 16, 19, 21, 24], hold: 27, pace: 6.5, rest: 0.34, padGain: 0.16 },
  autumn: { root: 164.81, chords: CLOSED, bells: [12, 15, 17, 19, 22, 24], hold: 30, pace: 7.5, rest: 0.4, padGain: 0.15 },
  winter: { root: 146.83, chords: CLOSED, bells: [12, 15, 17, 19, 22], hold: 36, pace: 9.5, rest: 0.5, padGain: 0.17 },
};

/** How loud the whole thing ever gets. Quiet enough to think over. */
const MASTER = 0.16;
/** How far ahead the sound card is written into, in seconds. */
const LOOKAHEAD = 2.5;
/** How long a chord takes to become the next one. Slow enough to be weather. */
const GLIDE = 6;

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
/** The four voices of the pad, the breath under them, and the gain over them. */
let pad: { voices: OscillatorNode[]; sub: OscillatorNode; gain: GainNode } | null = null;
let timer: number | null = null;
let nextBellAt = 0;
let nextChordAt = 0;
let bell = 0;
let bar = 0;
let seed = 1;
let season: Season = 'spring';
let playing = false;

/** Which chord is under the bells right now, so a bell is never a wrong note. */
let chordNow: Chord = OPEN[0];

/**
 * Which chord the place moves to next.
 *
 * Round the four in order, mostly, with the seed pulling one out of turn every
 * so often. Four chords in a fixed circle is a loop, and a loop is the one
 * thing an ambience may not be: the ear finds it in about three minutes and
 * then hears nothing else.
 */
function chordAt(step: number): Chord {
  const mode = MODES[season];
  const straight = step % mode.chords.length;
  const wander = rand01(seed, 'chord', step) > 0.72
    ? (straight + 1 + Math.floor(rand01(seed, 'skip', step) * (mode.chords.length - 1))) %
      mode.chords.length
    : straight;
  return mode.chords[wander];
}

/**
 * One bell over the pad: two barely detuned voices, a soft attack and a very
 * long tail. It is the same shape as the plucked note that used to be the
 * whole melody, opened out: an attack of four hundredths reads as a string
 * being plucked and this is a place, not a lute.
 */
function ring(at: number, freq: number, level: number): void {
  if (!ctx || !master) return;
  const voice = ctx.createGain();
  voice.gain.setValueAtTime(0, at);
  voice.gain.linearRampToValueAtTime(level, at + 0.5);
  voice.gain.exponentialRampToValueAtTime(0.0001, at + 5.2);

  const soften = ctx.createBiquadFilter();
  soften.type = 'lowpass';
  soften.frequency.setValueAtTime(1500, at);
  soften.frequency.exponentialRampToValueAtTime(520, at + 4.5);

  for (const [type, detune, mix] of [
    ['sine', 0, 1],
    ['triangle', 6, 0.32],
  ] as [OscillatorType, number, number][]) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    osc.detune.setValueAtTime(detune, at);
    const trim = ctx.createGain();
    trim.gain.value = mix;
    osc.connect(trim).connect(soften);
    osc.start(at);
    osc.stop(at + 5.4);
  }

  soften.connect(voice).connect(master);
}

/**
 * Move the pad onto a chord, over six seconds, starting at a given moment.
 *
 * Every voice glides. Nothing is stopped and nothing is started: the four
 * oscillators run from the first click to the last, and a chord change is four
 * frequencies being walked somewhere else, which is why it is never heard as
 * an event.
 */
function moveTo(chord: Chord, at: number): void {
  if (!ctx || !pad) return;
  const root = MODES[season].root;
  pad.voices.forEach((osc, i) => {
    osc.frequency.cancelScheduledValues(at);
    osc.frequency.setValueAtTime(osc.frequency.value, at);
    osc.frequency.linearRampToValueAtTime(semitone(root, chord[i]), at + GLIDE);
  });
  pad.sub.frequency.cancelScheduledValues(at);
  pad.sub.frequency.setValueAtTime(pad.sub.frequency.value, at);
  pad.sub.frequency.linearRampToValueAtTime(semitone(root, chord[0] - 24), at + GLIDE);
}

/**
 * Write whatever falls inside the look-ahead window into the sound card and
 * get out of the way. This is a scheduler for audio, not for the game: the
 * reign does not advance by a millisecond because of anything in this file.
 */
function schedule(): void {
  if (!ctx) return;
  const mode = MODES[season];
  const horizon = ctx.currentTime + LOOKAHEAD;

  while (nextChordAt < horizon) {
    const chord = chordAt(bar);
    moveTo(chord, nextChordAt);
    chordNow = chord;
    // the hold wanders, so no two turns of the harmony are the same length
    nextChordAt += mode.hold * (0.8 + rand01(seed, 'hold', bar) * 0.55);
    bar += 1;
  }

  while (nextBellAt < horizon) {
    if (rand01(seed, 'ring', bell) > mode.rest) {
      const pick = Math.floor(rand01(seed, 'bell', bell) * mode.bells.length);
      /* Off the chord under it, not off a scale: a bell is a note anybody in
         the square could be whistling, and it is never a note the pad is
         arguing with. Two of three land on a voice of the chord itself. */
      const onChord = rand01(seed, 'lean', bell) > 0.34;
      const step = onChord
        ? chordNow[1 + Math.floor(rand01(seed, 'voice', bell) * 3)] + 12
        : mode.bells[pick];
      const level = 0.12 + rand01(seed, 'level', bell) * 0.1;
      ring(nextBellAt, semitone(mode.root, step), level);
    }
    nextBellAt += mode.pace * (0.7 + rand01(seed, 'gap', bell) * 0.9);
    bell += 1;
  }
}

/**
 * The pad, built once and never rebuilt.
 *
 * Four voices through one gentle lowpass, with a second oscillator so slow it
 * is not a note at all wired into that filter's cutoff: the light on the pad
 * moves over about half a minute, which is what stops four held notes from
 * being an organ chord somebody left their hand on. Under all of it one sine
 * two octaves below the root, at a fifth of the level, which is the weight.
 */
function buildPad(): void {
  if (!ctx || !master) return;
  const mode = MODES[season];
  const gain = ctx.createGain();
  gain.gain.value = mode.padGain;

  const soften = ctx.createBiquadFilter();
  soften.type = 'lowpass';
  soften.frequency.value = 900;
  soften.Q.value = 0.7;

  const sway = ctx.createOscillator();
  sway.type = 'sine';
  sway.frequency.value = 0.031;
  const swayDepth = ctx.createGain();
  swayDepth.gain.value = 420;
  sway.connect(swayDepth).connect(soften.frequency);
  sway.start();

  const voices: OscillatorNode[] = [];
  chordNow = mode.chords[0];
  chordNow.forEach((steps, i) => {
    const osc = ctx!.createOscillator();
    /* Triangles at the bottom and sines over them. A sawtooth is a string
       section and this room has four people in it. */
    osc.type = i < 2 ? 'triangle' : 'sine';
    osc.frequency.value = semitone(mode.root, steps);
    // nothing is in tune with anything, which is what makes it breathe
    osc.detune.value = [-6, 5, -3, 7][i];
    const trim = ctx!.createGain();
    trim.gain.value = [0.5, 0.42, 0.3, 0.22][i];
    osc.connect(trim).connect(soften);
    osc.start();
    voices.push(osc);
  });

  const sub = ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.value = semitone(mode.root, chordNow[0] - 24);
  const subTrim = ctx.createGain();
  subTrim.gain.value = 0.2;
  sub.connect(subTrim).connect(soften);
  sub.start();

  soften.connect(gain).connect(master);
  pad = { voices, sub, gain };
}

/**
 * Move to the season without stopping. A year turns, it does not cut.
 *
 * The root is not ramped here. It arrives with the next chord change, which is
 * a walk of six seconds that was going to happen anyway: a season that pulled
 * every voice down a tone on the spot is a key change, and nobody in this
 * valley announces the autumn.
 */
export function setSeason(next: Season): void {
  season = next;
  if (!ctx || !pad) return;
  pad.gain.gain.linearRampToValueAtTime(MODES[next].padGain, ctx.currentTime + 4);
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
      buildPad();
    }
    void ctx.resume();
    master?.gain.cancelScheduledValues(ctx.currentTime);
    master?.gain.linearRampToValueAtTime(MASTER, ctx.currentTime + 4);
    // the first chord is the one already under the fingers, so it only moves
    nextChordAt = ctx.currentTime + MODES[season].hold * 0.5;
    nextBellAt = ctx.currentTime + 3.5;
    schedule();
    timer = window.setInterval(schedule, 700);
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
  master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.6);
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
