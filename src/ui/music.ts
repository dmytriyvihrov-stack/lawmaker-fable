import { rand01 } from '../engine/rng';
import type { Season } from '../engine/types';

/**
 * The music.
 *
 * Behind the toggle is a recorded track when the build carries one, and a
 * synthesised pad when it does not. `bundle.mjs` sews whatever it finds in
 * `assets/music/*.mp3` into the page as `window.__lawmakerMusic`, a plain
 * object of base64 data URIs keyed by filename; this file looks for that
 * object the moment somebody first asks for music, and falls back to the pad
 * below when the object is missing or a track fails to decode. The dev
 * server never has one, so `npm run dev` always plays the pad. Nothing here
 * is a network request either way: a data URI is decoded locally with
 * `atob`, never fetched. See `AUDIO.md` for how a track gets made.
 *
 * Which track plays is drawn from the reign's seed once, the moment the
 * sound card is first opened, the same way the pad below is built once and
 * never rebuilt. A reign that starts after music is already playing keeps
 * the track already chosen; that is judged the lesser oddity against
 * rebuilding a live audio graph for a preference nobody asked to change.
 *
 * The pad, when it is what plays: a warm bed of four voices that never
 * stops, a chord that changes about every half minute and takes six seconds
 * to get there, one low breath under the whole thing, and a bell over the
 * top now and then. Nothing marches. The year picks the mode and the
 * progression: spring and summer are open and major, autumn drops to the
 * minor, and the long winter is the same chords, lower, slower and further
 * apart. Which chord comes next and which bell rings over it are `rng.ts`,
 * seeded from the reign, so the same reign always sounds the same way. A
 * recorded track does not follow the season; the room the game is set in
 * does not change key four times a year, and neither does a place playing
 * behind it.
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
/**
 * And how loud it is while somebody is dying in front of you.
 *
 * The sound effects have hushed themselves round death, punishment and
 * collapse since V50 (`HUSHED_CASES`), and the music went on being weather
 * over the top of it, at the one moment in the game where the room should go
 * quiet. This is that share of the master gain: not nothing, because a cut to
 * silence is its own noise and the scene would announce itself, but far enough
 * down that what is left is the wind. It rides on the master gain, so it works
 * the same behind a recorded track as behind the pad.
 */
const HUSHED = 0.08;
/** How long the room takes to go quiet, and how long it takes to come back. */
const DUCK = 2.2;
const LIFT = 5;
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

/** What `bundle.mjs` leaves on `window` when a build carries recorded music. */
function recordedTracks(): Record<string, string> | undefined {
  return (window as unknown as { __lawmakerMusic?: Record<string, string> }).__lawmakerMusic;
}

/** A base64 data URI, decoded locally. Never a fetch, never a network request. */
function decodeDataUri(dataUri: string): ArrayBuffer {
  const base64 = dataUri.slice(dataUri.indexOf(',') + 1);
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
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
/** True while a grave scene is on the screen. See `hush()`. */
let hushed = false;

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
 * Never called while a recorded track is playing; a loop on tape schedules
 * nothing.
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
 * (Re)arm the chord and bell scheduler. Called from `start()` every time
 * playback resumes, the same as before a recorded track existed at all;
 * never called while a recorded track is the thing playing, because a loop
 * on tape does not need a look-ahead window written into it every 700ms.
 */
function startPad(): void {
  if (!ctx) return;
  nextChordAt = ctx.currentTime + MODES[season].hold * 0.5;
  nextBellAt = ctx.currentTime + 3.5;
  schedule();
  timer = window.setInterval(schedule, 700);
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
 * True from the moment `start()` decides to reach for a recorded track,
 * whether or not the decode behind it has finished yet. `start()` reads this
 * synchronously to know whether to arm the pad scheduler; `buildRecorded`
 * flips it back on any failure, decode included.
 */
let usingRecorded = false;

/**
 * Decode the reign's chosen track and start it looping into `master`. Built
 * once, the same as the pad: once a source is running its `loop` flag keeps
 * it going for good, and every later toggle only ramps `master`, never
 * touches this again. Falls back to the pad on any failure, so a corrupt or
 * missing track never leaves the toggle silent. Decoding is asynchronous, so
 * if playback has already been asked for by the time it settles into the
 * fallback, the pad scheduler is armed here rather than left for a `start()`
 * call that already happened.
 */
async function buildRecorded(): Promise<void> {
  const tracks = recordedTracks();
  const keys = tracks ? Object.keys(tracks).sort() : [];
  if (!ctx || !master || !tracks || keys.length === 0) {
    usingRecorded = false;
    buildPad();
    if (playing) startPad();
    return;
  }
  const key = keys[Math.min(keys.length - 1, Math.floor(rand01(seed, 'music-track') * keys.length))];
  try {
    const buffer = await ctx.decodeAudioData(decodeDataUri(tracks[key]));
    if (!ctx || !master) return; // torn down while decoding
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(master);
    source.start();
  } catch {
    usingRecorded = false;
    buildPad();
    if (playing) startPad();
  }
}

/**
 * Move to the season without stopping. A year turns, it does not cut.
 *
 * Only touches the pad, so it is a silent no-op behind a recorded track: the
 * room a mp3 was recorded in does not change key because the calendar did.
 * The root is not ramped here either way. It arrives with the next chord
 * change, which is a walk of six seconds that was going to happen anyway: a
 * season that pulled every voice down a tone on the spot is a key change,
 * and nobody in this valley announces the autumn.
 */
export function setSeason(next: Season): void {
  season = next;
  if (!ctx || !pad) return;
  pad.gain.gain.linearRampToValueAtTime(MODES[next].padGain, ctx.currentTime + 4);
}

/**
 * The reign the pad's notes are drawn from, and the reign whose seed picks a
 * recorded track the first time the sound card opens. A reign that starts
 * after the card is already open keeps whichever track is already running.
 */
export function setSeed(next: number): void {
  seed = next;
}

export function isPlaying(): boolean {
  return playing;
}

/** What the master gain should be sitting at right now. */
function level(): number {
  return hushed ? MASTER * HUSHED : MASTER;
}

/**
 * Down for a grave scene, back up when it is over.
 *
 * Called with what is on the screen and nothing else, every render, so it
 * checks before it touches the sound card: a ramp rescheduled sixty times a
 * second never arrives. Remembered whether or not anything is playing, so a
 * toggle pressed in the middle of a hard scene comes up quiet rather than
 * coming up loud and then ducking.
 */
export function hush(on: boolean): void {
  if (on === hushed) return;
  hushed = on;
  if (!ctx || !master || !playing) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
  master.gain.linearRampToValueAtTime(level(), ctx.currentTime + (on ? DUCK : LIFT));
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
      if (recordedTracks()) {
        usingRecorded = true;
        void buildRecorded();
      } else {
        buildPad();
      }
    }
    void ctx.resume();
    master?.gain.cancelScheduledValues(ctx.currentTime);
    master?.gain.linearRampToValueAtTime(level(), ctx.currentTime + 4);
    // a recorded track loops on its own; only the pad needs its scheduler rearmed
    if (!usingRecorded) startPad();
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
