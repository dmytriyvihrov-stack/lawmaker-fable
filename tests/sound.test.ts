import { afterEach, describe, expect, it, vi } from 'vitest';
import { CHARACTERS } from '../src/content/meta';
import { CASES } from '../src/content/cases';
import { MONARCHS } from '../src/content/monarchs';
import { HUSHED_CASES, VOICES, VOICE_OF, voiceOf } from '../src/content/sound';

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

/**
 * The music, which is a different sound card from the effects above: one
 * master gain with either a recorded track or the pad under it. What is
 * checked here is the one thing a player asked for and cannot see in a test
 * of content: that a grave scene takes it almost all the way down and that
 * the end of the scene brings it back.
 */
describe('the music behind a grave scene', () => {
  it('ducks the master gain to a fraction and lifts it again', async () => {
    const { ctx, context } = audioMock();
    const gains: { gain: ReturnType<typeof Object> }[] = [];
    const createGain = () => {
      const g = context.createGain();
      gains.push(g as never);
      return g;
    };
    vi.stubGlobal('window', {
      AudioContext: function () {
        return { ...context, createGain } as unknown as AudioContext;
      },
      localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
      setInterval: () => 1,
      clearInterval: () => {},
      atob: (s: string) => s,
    });
    void ctx;

    const music = await import('../src/ui/music');
    music.start();
    expect(music.isPlaying(), 'the toggle is on').toBe(true);

    // whatever it was ramped to when it started is the loud one
    const master = gains[0] as unknown as { gain: { linearRampToValueAtTime: { mock: { calls: number[][] } } } };
    const ramps = () => master.gain.linearRampToValueAtTime.mock.calls.map((c) => c[0]);
    const loud = ramps()[0];
    expect(loud).toBeGreaterThan(0);

    music.hush(true);
    const ducked = ramps()[ramps().length - 1];
    expect(ducked, 'a grave scene is nearly silent').toBeLessThan(loud / 5);
    expect(ducked, 'and not a hard cut to nothing').toBeGreaterThan(0);

    // asked for twice over, it does not reschedule the same ramp
    const before = ramps().length;
    music.hush(true);
    expect(ramps().length).toBe(before);

    music.hush(false);
    expect(ramps()[ramps().length - 1], 'and the room comes back').toBe(loud);
    music.stop();
  });
});

/**
 * And the one thing the switch does not remember for good.
 *
 * Turning the music off is an answer to the evening somebody is having.
 * A browser that kept it off for ever meant a player who muted one reign
 * late at night never heard the soundtrack again, so a new reign asks for
 * the room back and the note in the corner is told about it.
 */
describe('the music at the start of a reign', () => {
  it('comes back on, and says so to whoever is drawing the switch', async () => {
    const { context } = audioMock();
    const store = new Map<string, string>();
    vi.stubGlobal('window', {
      AudioContext: function () {
        return { ...context } as unknown as AudioContext;
      },
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => { store.set(k, v); },
        removeItem: (k: string) => { store.delete(k); },
      },
      setInterval: () => 1,
      clearInterval: () => {},
      atob: (s: string) => s,
    });

    const music = await import('../src/ui/music');
    let told = 0;
    const stop = music.subscribeMusic(() => { told += 1; });

    music.start();
    music.stop();
    expect(music.musicWanted(), 'turned off, it stays off inside the reign').toBe(false);

    const before = told;
    music.wantMusic();
    expect(music.musicWanted(), 'and a new reign opens with the room full').toBe(true);
    expect(music.isPlaying(), 'and it is actually playing').toBe(true);
    expect(told, 'the switch in the corner is told').toBeGreaterThan(before);

    music.stop();
    stop();
  });
});

describe('what is left to hear', () => {
  /**
   * The effects layer is gone: the cues, the voices at the door, the click on
   * the river and the switch that carried them. This is the guard on that, and
   * it reads the tree rather than a mock, because a module that comes back
   * comes back as a file first.
   */
  it('has no effects layer to switch on', () => {
    const modules = Object.keys(import.meta.glob('../src/ui/**/*.{ts,tsx}'));
    expect(modules.length).toBeGreaterThan(10);
    expect(modules.filter((f) => f.includes('/ui/audio/'))).toEqual([]);
    expect(modules.filter((f) => f.includes('Soundscape'))).toEqual([]);
  });

  /**
   * Two voices, and every caller reads down to one of them. The Monarch is
   * the exception on purpose: who is upstairs comes off the seed, so the
   * voice comes off the monarch, and every one of the six carries one.
   */
  it('keeps the two readings a voice would be made from, and hushes real cases', () => {
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

  /**

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
});
