import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearAllDevMarks,
  clearDevMark,
  formatDevMarksForExport,
  getDevMarksSnapshot,
  markDev,
  noteDev,
} from '../src/ui/dev/devMarksStore';

/**
 * The thumbs a run leaves behind it.
 *
 * Two rules carry the whole thing. A mark is filed against the content and
 * never against the reign, so walking the same case twice is one mark and not
 * two; and the same thumb pressed again takes it back, because a mark made in
 * one click has to be undone in one click or nobody will risk making it.
 */

describe('the marks a run leaves', () => {
  beforeEach(() => clearAllDevMarks());

  it('a thumb is filed against the content, with the year it was made in', () => {
    markDev('case:v1_idle_hand', 'The Idle Hand', 'up', 13);
    const mark = getDevMarksSnapshot()['case:v1_idle_hand'];
    expect(mark.verdict).toBe('up');
    expect(mark.label).toBe('The Idle Hand');
    expect(mark.turn).toBe(13);
  });

  it('the same thumb again takes it back; the other one turns it over', () => {
    markDev('moment:the_rod', 'The rod', 'up', 4);
    markDev('moment:the_rod', 'The rod', 'down', 4);
    expect(getDevMarksSnapshot()['moment:the_rod'].verdict).toBe('down');
    markDev('moment:the_rod', 'The rod', 'down', 4);
    expect(getDevMarksSnapshot()['moment:the_rod']).toBeUndefined();
  });

  it('marking the same thing in a later reign does not open a second mark', () => {
    markDev('case:v1_idle_hand', 'The Idle Hand', 'down', 3);
    markDev('case:v1_idle_hand', 'The Idle Hand', 'up', 19);
    const all = Object.values(getDevMarksSnapshot());
    expect(all).toHaveLength(1);
    expect(all[0].verdict).toBe('up');
    // the year is the year it was first said, not the last time it came round
    expect(all[0].turn).toBe(3);
  });

  it('a note outlives the thumb, because it is the half that says why', () => {
    markDev('proposal:pv1_work', 'The work of this place', 'down', 6);
    noteDev('proposal:pv1_work', 'The work of this place', 'all four read the same', 6);
    markDev('proposal:pv1_work', 'The work of this place', 'down', 6);
    const mark = getDevMarksSnapshot()['proposal:pv1_work'];
    expect(mark.verdict).toBeUndefined();
    expect(mark.note).toBe('all four read the same');
    // and an empty note on a mark with no thumb left is not a mark at all
    noteDev('proposal:pv1_work', 'The work of this place', '  ', 6);
    expect(getDevMarksSnapshot()['proposal:pv1_work']).toBeUndefined();
  });

  it('hands over a batch that reads without the game beside it', () => {
    markDev('case:v1_idle_hand', 'The Idle Hand', 'up', 13);
    noteDev('case:v1_idle_hand', 'The Idle Hand', 'the third answer is the only real one', 13);
    markDev('moment:the_rod', 'The rod', 'down', 4);

    const text = formatDevMarksForExport(getDevMarksSnapshot());
    // oldest year first, so the batch reads in the order it was played
    expect(text.indexOf('The rod')).toBeLessThan(text.indexOf('The Idle Hand'));
    expect(text).toContain('POOR: The rod');
    expect(text).toContain('GOOD: The Idle Hand');
    expect(text).toContain('NOTE: the third answer is the only real one');
    expect(text).toContain('(year 13)');
  });

  it('one mark can be taken back without touching the rest', () => {
    markDev('a', 'A', 'up', 1);
    markDev('b', 'B', 'down', 2);
    clearDevMark('a');
    expect(Object.keys(getDevMarksSnapshot())).toEqual(['b']);
    expect(formatDevMarksForExport({})).toBe('');
  });
});
