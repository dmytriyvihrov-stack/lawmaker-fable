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
   * The settlement bed used to knock twice on a fixed beat, and a room hears
   * that as a clock. Nothing in the ambience may be percussive and periodic:
   * the wind overlaps and the voices wander, and neither of them repeats.
   */
  it('never strikes a fixed beat while it is just being a place', async () => {
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
    // a place with people in it, in the season with the most going on
    sound.environment('summer', false, true);

    // six minutes of a place being a place
    for (let t = 0; t < 360; t += 2) {
      context.currentTime = t;
      vi.advanceTimersByTime(400);
    }

    // 310 is the wood note, and a wood note is a tap on a table
    const taps = sources.filter(
      (source) => source.frequency.setValueAtTime.mock.calls[0]?.[0] === 310,
    );
    expect(taps.length, 'the ambience is knocking on something').toBe(0);

    // No voice in the bed. A hushed murmur is three descending tones and that
    // is a hall clock on the hour, which is exactly how it was heard.
    expect(
      sources.some((source) => source.type === 'sawtooth'),
      'the ambience is talking to itself',
    ).toBe(false);

    // The wind starts once and never restarts, so it has no attack to count.
    const loops = sources.filter((source) => source.loop === true);
    expect(loops.length, 'the wind is not one continuous thing').toBe(2);
    for (const loop of loops) expect(loop.start).toHaveBeenCalledOnce();

    // and everything else is rare, and never twice at the same distance
    const events = sources
      .filter((source) => source.loop !== true)
      .map((source) => source.start.mock.calls[0][0] as number)
      .sort((a, b) => a - b);
    expect(events.length, 'six minutes of this is not a soundtrack').toBeLessThan(24);
    const gaps = events.slice(1).map((at, i) => Math.round((at - events[i]) * 10) / 10);
    // A fixed period has one gap and no spread. This has neither. (The gaps
    // read here are quantised by how coarsely the test moves the clock, so the
    // shape is what is asserted, not the individual numbers.)
    const wide = gaps.filter((g) => g > 5);
    expect(wide.length, 'nothing happened at all').toBeGreaterThan(2);
    expect(new Set(wide).size, 'the bed is on a period').toBeGreaterThan(2);
    expect(Math.max(...wide) - Math.min(...wide), 'the gaps barely differ').toBeGreaterThan(8);
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
