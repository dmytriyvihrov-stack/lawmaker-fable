import { afterEach, describe, expect, it, vi } from 'vitest';
import { CHARACTERS } from '../src/content/meta';
import { CASES } from '../src/content/cases';
import { HUSHED_CASES, VOICES } from '../src/content/sound';
import { cue, murmur, texture } from '../src/ui/audio/synthesis';

function audioMock() {
  const sources: ReturnType<typeof node>[] = [];
  const param = () => ({ value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(), setTargetAtTime: vi.fn(), cancelScheduledValues: vi.fn() });
  function node() {
    const value = { gain: param(), frequency: param(), Q: param(), threshold: param(), ratio: param(),
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
  it('gives every named character a distinct authored voice, and hushes real cases', () => {
    expect(Object.keys(CHARACTERS).every((id) => VOICES[id])).toBe(true);
    expect(new Set(Object.values(VOICES).map(String)).size).toBe(Object.keys(VOICES).length);
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
    murmur(ctx, ctx.destination, 'tam');
    murmur(ctx, ctx.destination, 'iva', true);
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
    expect(sound.speak('tam', false)).toBe(true);
    expect(sound.speak('iva', false)).toBe(false);
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
