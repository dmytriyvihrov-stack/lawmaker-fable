import { afterEach, describe, expect, it, vi } from 'vitest';
import { CHARACTERS } from '../src/content/meta';
import { CASES } from '../src/content/cases';
import { MONARCHS } from '../src/content/monarchs';
import { HUSHED_CASES, VOICES, VOICE_OF, voiceOf } from '../src/content/sound';
import { cue, murmur, texture } from '../src/ui/audio/synthesis';

function audioMock() {
  const sources: ReturnType<typeof node>[] = [];
  const param = () => ({ value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(), setTargetAtTime: vi.fn(), cancelScheduledValues: vi.fn() });
  function node() {
    const value = { gain: param(), frequency: param(), detune: param(), Q: param(), threshold: param(), ratio: param(),
      playbackRate: param(), loop: false, buffer: null as unknown, type: '' as string,
      connect: vi.fn((next: unknown) => next), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(),
      onended: (() => {}) as () => void };
    return value;
  }
  const source = () => { const value = node(); sources.push(value); return value; };
  const context = {
    sampleRate: 8000, currentTime: 0, state: 'running', destination: node(),
    createGain: node, createBiquadFilter: node, createDynamicsCompressor: node,
    createOscillator: vi.fn(source), createBufferSource: vi.fn(source),
    createBuffer: (_channels: number, length: number) => {
      const data = new Float32Array(length);
      return { getChannelData: () => data };
    },
    resume: vi.fn(() => Promise.resolve()), close: vi.fn(() => Promise.resolve()),
  };
  return { context, ctx: context as unknown as AudioContext, sources };
}

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('settlement audio', () => {
  /**
   * Two voices, and every caller reads down to one of them. The Monarch is
   * the exception on purpose: who is upstairs comes off the seed, so the
   * voice comes off the monarch, and every one of the six carries one.
   */
  it('reads every caller down to one of the two voices, and hushes real cases', () => {
    expect(Object.keys(VOICES)).toEqual(['man', 'woman']);
    const named = Object.keys(CHARACTERS).filter((id) => id !== 'monarch');
    expect(named.every((id) => VOICE_OF[id])).toBe(true);
    expect(Object.keys(VOICE_OF).every((id) => CHARACTERS[id])).toBe(true);
    expect(MONARCHS.every((m) => VOICES[m.voice])).toBe(true);
    expect(voiceOf('monarch', 'woman')).toBe('woman');
    expect(voiceOf('iva', 'man')).toBe('woman');
    expect(voiceOf(undefined, 'woman')).toBe('man');
    expect([...HUSHED_CASES].every((id) => CASES.some((c) => c.id === id))).toBe(true);
  });

  it('bounds the texture and stops and disconnects every short sound source', () => {
    const { ctx, sources } = audioMock();
    const buffer = texture(ctx);
    const samples = buffer.getChannelData(0);
    expect(samples.every((n) => Number.isFinite(n) && Math.abs(n) <= 1)).toBe(true);
    expect(samples.some((n) => Math.abs(n) > .1)).toBe(true);
    for (const name of ['seal', 'ruling', 'wood', 'rustle', 'water', 'stone', 'bird', 'strain', 'fire'] as const) {
      cue(ctx, ctx.destination, buffer, name);
    }
    murmur(ctx, ctx.destination, 'man');
    murmur(ctx, ctx.destination, 'woman', true);
    for (const source of sources) {
      expect(source.stop).toHaveBeenCalledOnce();
      const at = source.start.mock.calls[0][0] as number;
      const stop = source.stop.mock.calls[0][0] as number;
      expect(stop).toBeGreaterThan(at);
      expect(stop - at).toBeLessThan(1);
      source.onended();
      expect(source.disconnect).toHaveBeenCalledOnce();
    }
  });

  it('waits for interaction, throttles clicks, honours mute and releases audio on exit', async () => {
    vi.useFakeTimers();
    vi.resetModules();
    const { context, sources } = audioMock();
    const win = new EventTarget();
    const doc = new EventTarget();
    Object.assign(doc, { hidden: false });
    Object.assign(win, { AudioContext: function () { return context; }, setInterval, clearInterval });
    vi.stubGlobal('window', win);
    vi.stubGlobal('document', doc);
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn() });
    const sound = await import('../src/ui/audio/sound');
    const detach = sound.attach();
    expect(sources.length).toBe(0);
    sound.play('seal');
    expect(sources.length).toBe(0);
    win.dispatchEvent(new Event('pointerdown'));
    await Promise.resolve();
    expect(context.resume).toHaveBeenCalledOnce();
    sound.play('wood');
    const count = sources.length;
    sound.play('wood');
    expect(sources.length).toBe(count);
    expect(sound.speak('man', false)).toBe(true);
    expect(sound.speak('woman', false)).toBe(false);
    sound.setEnabled(false);
    expect(context.close).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
    const muted = sources.length;
    sound.play('seal');
    win.dispatchEvent(new Event('pointerdown'));
    expect(sources.length).toBe(muted);
    sound.setEnabled(true);
    await Promise.resolve();
    Object.assign(doc, { hidden: true });
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(vi.getTimerCount()).toBe(0);
    Object.assign(doc, { hidden: false });
    doc.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();
    detach();
    expect(vi.getTimerCount()).toBe(0);
    const calls = context.resume.mock.calls.length;
    win.dispatchEvent(new Event('pointerdown'));
    expect(context.resume.mock.calls.length).toBe(calls);
  });

  /**
   * There is no bed. Three versions of one were written and every one of them
   * was heard as something wrong with the room, so the rule now is the strong
   * one and this is what holds it: left alone, this module makes no sound of
   * any kind, for as long as you leave it alone.
   */
  it('makes no sound at all until somebody does something', async () => {
    vi.useFakeTimers();
    vi.resetModules();
    const { context, sources } = audioMock();
    const win = new EventTarget();
    const doc = new EventTarget();
    Object.assign(doc, { hidden: false });
    Object.assign(win, { AudioContext: function () { return context; }, setInterval, clearInterval });
    vi.stubGlobal('window', win);
    vi.stubGlobal('document', doc);
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn() });
    const sound = await import('../src/ui/audio/sound');
    const detach = sound.attach();
    win.dispatchEvent(new Event('pointerdown'));
    await Promise.resolve();
    sound.environment('summer', false, true);

    // ten minutes of a player reading a card
    for (let t = 0; t < 600; t += 2) {
      context.currentTime = t;
      vi.advanceTimersByTime(1000);
    }
    expect(sources.length, 'the room is making noise on its own').toBe(0);
    // and nothing is left running that could start
    expect(vi.getTimerCount(), 'something is still on a clock').toBe(0);

    // but the answer to a thing the player did still arrives
    sound.play('seal');
    expect(sources.length).toBeGreaterThan(0);
    detach();
  });

  /**
   * The music is the one thing here that is allowed to repeat, because a
   * harmony that never comes back is not a harmony. What it may not do is
   * arrive on the beat: four chords in a fixed circle at a fixed length is a
   * loop, the ear finds it in about three minutes, and after that it hears
   * nothing else. So the pad is four voices that never stop and never jump,
   * the chord walks over six seconds, and no two turns of it are the same
   * length.
   */
  it('walks the pad to a new chord, never on the beat, and stops clean', async () => {
    vi.useFakeTimers();
    vi.resetModules();
    const { context, sources } = audioMock();
    const win = new EventTarget();
    Object.assign(win, { AudioContext: function () { return context; }, setInterval, clearInterval });
    vi.stubGlobal('window', win);
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn() });
    const music = await import('../src/ui/music');
    music.setSeed(4242);
    music.start();
    expect(music.isPlaying()).toBe(true);
    // the light over the pad, its four voices, and the weight under them
    expect(sources.length, 'the pad is not four voices and a floor').toBe(6);

    const voice = sources[1];
    const ranTo = () => voice.frequency.linearRampToValueAtTime.mock.calls as [number, number][];
    expect(ranTo().length, 'the pad moved before anybody could have heard it').toBe(0);

    // ten minutes of somebody laying out a town
    for (let t = 0; t < 600; t += 2) {
      context.currentTime = t;
      vi.advanceTimersByTime(1000);
      if (t === 300) music.setSeason('autumn');
    }

    const walks = ranTo();
    expect(walks.length, 'the harmony never moved').toBeGreaterThan(8);
    expect(walks.every(([hz]) => Number.isFinite(hz) && hz > 20 && hz < 4000)).toBe(true);
    // every move is a walk and not a cut: the ramp lands six seconds on
    for (const [, at] of walks) expect(Number.isFinite(at)).toBe(true);
    const holds = walks.slice(1).map(([, at], i) => Math.round(at - walks[i][1]));
    expect(new Set(holds).size, 'the chords turn on a metronome').toBeGreaterThan(3);
    // and the bells over it are sounds, not silence
    expect(sources.length, 'nothing rang over the pad').toBeGreaterThan(6);

    music.stop();
    expect(music.isPlaying()).toBe(false);
    expect(vi.getTimerCount(), 'the music is still on a clock').toBe(0);
  });

  it('stays playable when storage and audio are unavailable', async () => {
    vi.resetModules();
    vi.stubGlobal('window', Object.assign(new EventTarget(), { setInterval, clearInterval }));
    vi.stubGlobal('document', Object.assign(new EventTarget(), { hidden: false }));
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('unavailable'); },
      setItem: () => { throw new Error('unavailable'); } });
    const sound = await import('../src/ui/audio/sound');
    expect(sound.preference()).toEqual({ on: true, volume: .55 });
    const detach = sound.attach();
    expect(() => { sound.wake(); sound.setEnabled(true); sound.play('seal'); detach(); }).not.toThrow();
  });
});
