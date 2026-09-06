import { useSyncExternalStore } from 'react';
import {
  getDevEditsSnapshot,
  resetDevEdit,
  saveDevEdit,
  subscribeDevEdits,
  type DevEdit,
} from './devEditsStore';

/**
 * One piece of text, and the edit sitting on top of it if there is one.
 * `id` has to be stable and unique across the whole game: it is the thing an
 * edit is filed under, so `case:v1_idle_hand:question` and not `question`.
 */
export function useDevEdit(
  id: string,
  original: string,
): {
  value: string;
  edit: DevEdit | undefined;
  save: (text: string, note: string) => void;
  reset: () => void;
} {
  const store = useSyncExternalStore(subscribeDevEdits, getDevEditsSnapshot, getDevEditsSnapshot);
  const edit = store[id];
  return {
    value: edit?.text ?? original,
    edit,
    save: (text: string, note: string) => saveDevEdit(id, original, text, note),
    reset: () => resetDevEdit(id),
  };
}

export function useAllDevEdits(): Record<string, DevEdit> {
  return useSyncExternalStore(subscribeDevEdits, getDevEditsSnapshot, getDevEditsSnapshot);
}
