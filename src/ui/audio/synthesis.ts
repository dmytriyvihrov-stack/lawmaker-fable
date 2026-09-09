import { VOICES } from '../../content/sound';
import type { VoiceKind } from '../../content/sound';

export type Cue = 'seal' | 'ruling' | 'wood' | 'rustle' | 'water' | 'stone' | 'bird' | 'strain' | 'fire';

/** All short sources stop and disconnect, including notes scheduled ahead. */
export function tone(ctx: BaseAudioContext, out: AudioNode, at: number, hz: number,
  endHz: number, seconds: number, level: number, type: OscillatorType = 'sine', formant = 0): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  osc.type = type;
  osc.frequency.setValueAtTime(hz, at);
  osc.frequency.exponentialRampToValueAtTime(endHz, at + seconds);
  filter.type = formant ? 'bandpass' : 'lowpass';
  filter.frequency.value = formant || 2200;
  filter.Q.value = formant ? 2.5 : .5;
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(level, at + Math.min(.018, seconds / 4));
  gain.gain.exponentialRampToValueAtTime(.0001, at + seconds);
  osc.connect(filter).connect(gain).connect(out);
  osc.onended = () => { osc.disconnect(); filter.disconnect(); gain.disconnect(); };
  osc.start(at);
  osc.stop(at + seconds + .01);
}

/** An inharmonic, periodic texture. No random generator or game seed. */
export function texture(ctx: BaseAudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) {
    const phase = Math.PI * i / ctx.sampleRate;
    samples[i] = (Math.sin(phase * 173 + 11 * Math.sin(phase * 317))
      + Math.sin(phase * 239 + 17 * Math.sin(phase * 557))
      + Math.sin(phase * 431 + 23 * Math.sin(phase * 1091))) / 3;
  }
  return buffer;
}

export function brush(ctx: BaseAudioContext, out: AudioNode, buffer: AudioBuffer,
  at: number, seconds: number, level: number, hz: number): void {
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  source.loop = true;
  filter.type = 'bandpass';
  filter.frequency.value = hz;
  filter.Q.value = .6;
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(level, at + Math.min(.08, seconds / 3));
  gain.gain.exponentialRampToValueAtTime(.0001, at + seconds);
  source.connect(filter).connect(gain).connect(out);
  source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
  source.start(at);
  source.stop(at + seconds + .01);
}

export function cue(ctx: BaseAudioContext, out: AudioNode, buffer: AudioBuffer,
  name: Cue, at = ctx.currentTime, level = 1): void {
  const note = (hz: number, end: number, length: number, gain: number, delay = 0,
    type: OscillatorType = 'sine') => tone(ctx, out, at + delay, hz, end, length, gain * level, type);
  const noise = (length: number, gain: number, hz: number, delay = 0) =>
    brush(ctx, out, buffer, at + delay, length, gain * level, hz);
  switch (name) {
    case 'seal': noise(.15, .33, 650); note(170, 58, .22, .5); note(360, 130, .07, .13, .1); break;
    case 'ruling': noise(.24, .18, 1600); note(235, 105, .14, .23, .12, 'triangle'); break;
    case 'wood': note(310, 120, .1, .35, 0, 'triangle'); note(720, 430, .045, .12); break;
    case 'stone': note(980, 720, .14, .2); note(1430, 1000, .06, .1); break;
    case 'rustle': noise(.24, .3, 1800); break;
    case 'strain': noise(.2, .16, 700); note(165, 95, .18, .12, 0, 'triangle'); break;
    case 'fire': noise(.28, .24, 1100); note(410, 170, .035, .09); break;
    case 'water': noise(.3, .2, 2500); note(620, 190, .14, .19); note(870, 310, .12, .14, .09); break;
    case 'bird': note(1900, 3100, .105, .13); note(2800, 2100, .14, .10, .16); break;
  }
}

/**
 * A little voiced breath: somebody is at the door and about to speak.
 *
 * Two things changed here at once, and both are easy to put back. The voice
 * is one of two now, `man` or `woman`, instead of one per caller, because the
 * only thing a player was ever hearing was which of the two it was. And the
 * body of it is a triangle where it used to be a sawtooth, which is the wave
 * `tests/sound.test.ts` refuses to allow anywhere in the bed because it reads
 * as a murmuring crowd. It read as one here too, four times a year.
 *
 * Four syllables open, three when the scene is a grave one, and the hushed
 * one is lower as well as slower: a hush is not the same voice turned down.
 */
export function murmur(ctx: BaseAudioContext, out: AudioNode, voice: VoiceKind,
  hushed = false, at = ctx.currentTime): void {
  const [pitch, vowel, pace] = VOICES[voice] ?? VOICES.man;
  const phrase = hushed ? [.94, .9, .84] : [1, 1.11, .95, .88];
  phrase.forEach((ratio, i) => {
    const time = at + i * pace * (hushed ? 1.3 : 1);
    const frequency = pitch * ratio;
    tone(ctx, out, time, frequency, frequency * .94, pace * .84,
      hushed ? .2 : .28, 'triangle', vowel * (i % 2 ? 1.12 : .92));
    tone(ctx, out, time, frequency, frequency * .94, pace * .88,
      hushed ? .05 : .07, 'sine');
  });
}
