import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearAllDevEdits,
  findDevEdit,
  formatDevEditsForExport,
  getDevEditsSnapshot,
  idForText,
  resetDevEdit,
  saveDevEdit,
} from '../src/ui/dev/devEditsStore';

/**
 * The scratch pad the dev-mode pencils write on.
 *
 * The one rule that matters here is that a line edited twice is still one
 * entry. What a pick reads off the page is whatever the page is showing, and
 * once a rewrite has landed that is the rewrite - so filing by what was read
 * opened a second entry whose "before" was the first go, and the batch handed
 * over a diff against something no content file has ever said.
 */

describe('the pending edits', () => {
  beforeEach(() => clearAllDevEdits());

  it('files a rewrite under the original, and finds it again by either', () => {
    const was = 'One thing, or nothing.';
    saveDevEdit(idForText(was), was, 'One thing, or none.', '');

    expect(findDevEdit(was)?.text).toBe('One thing, or none.');
    // and by what the page is showing now, which is the rewrite
    expect(findDevEdit('One thing, or none.')?.original).toBe(was);
    expect(Object.keys(getDevEditsSnapshot())).toHaveLength(1);
  });

  it('a second rewrite of the same line is still one entry', () => {
    const was = 'One thing, or nothing.';
    saveDevEdit(idForText(was), was, 'FIRST GO', '');
    // the pick reads "FIRST GO" off the page and comes back to the original
    const again = findDevEdit('FIRST GO');
    saveDevEdit(idForText(again!.original), again!.original, 'SECOND GO', '');

    const all = Object.values(getDevEditsSnapshot());
    expect(all).toHaveLength(1);
    expect(all[0].original).toBe(was);
    expect(all[0].text).toBe('SECOND GO');
    expect(formatDevEditsForExport(getDevEditsSnapshot())).toContain(`WAS: ${was}`);
  });

  it('a rewrite back to what it said is not an entry at all', () => {
    const was = 'Nothing binds you to this answer.';
    saveDevEdit(idForText(was), was, 'something else', '');
    saveDevEdit(idForText(was), was, was, '');
    expect(Object.keys(getDevEditsSnapshot())).toHaveLength(0);
  });

  it('a note with no rewrite is a request, and keeps the line as it stands', () => {
    const was = 'The founding';
    saveDevEdit(idForText(was), was, was, 'needs a joke here');
    const entry = findDevEdit(was);
    expect(entry?.text).toBeUndefined();
    expect(entry?.note).toBe('needs a joke here');
    expect(formatDevEditsForExport(getDevEditsSnapshot())).toContain('NOTE: needs a joke here');
  });

  it('a cut line is a different request from a line that says nothing', () => {
    const was = 'Spring. Five of you.';
    saveDevEdit(idForText(was), was, was, '', true);
    expect(findDevEdit(was)?.removed).toBe(true);
    resetDevEdit(idForText(was));
    expect(findDevEdit(was)).toBeUndefined();
  });
});
