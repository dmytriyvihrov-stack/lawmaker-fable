import { useSyncExternalStore } from 'react';
import { getDevMarksSnapshot, subscribeDevMarks, type DevMark } from './devMarksStore';

/** The mark against one piece of content, if anybody has left one. */
export function useDevMark(id: string): DevMark | undefined {
  return useSyncExternalStore(subscribeDevMarks, getDevMarksSnapshot, getDevMarksSnapshot)[id];
}

export function useAllDevMarks(): Record<string, DevMark> {
  return useSyncExternalStore(subscribeDevMarks, getDevMarksSnapshot, getDevMarksSnapshot);
}
