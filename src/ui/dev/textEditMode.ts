import { useSyncExternalStore } from 'react';

/**
 * Whether the pencils are out.
 *
 * The wired pencils (`DevText` and friends) used to appear the moment dev mode
 * did, which put a superscript pencil beside a dozen lines of every screen
 * somebody had turned dev mode on to look at the *numbers* on. They belong to
 * the same switch as the click-anything layer: one toggle, "edit any text",
 * and both are either out or not.
 *
 * A module singleton rather than a prop because the pencils are eight levels
 * down from `App` in six different trees, and threading a second boolean
 * through every one of them to say the same thing twice is how a prop named
 * `dev` came to mean three different things already.
 */
let on = false;
const listeners = new Set<() => void>();

export function setTextEditMode(next: boolean): void {
  if (next === on) return;
  on = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const read = () => on;

export function useTextEditMode(): boolean {
  return useSyncExternalStore(subscribe, read, read);
}
