import type { People } from '../engine/types';

/**
 * The names of the places over the hill.
 *
 * Drawn without replacement the year the crown arrives, so no two neighbours
 * share a name and no two reigns share a set. They are names and nothing else:
 * what a neighbour is like is written by its laws, not by what it is called.
 */
export const NEIGHBOUR_NAMES = [
  'Ashby', 'Corrow', 'Dunmere', 'Ellswick', 'Fennmoor', 'Garrow',
  'Holt', 'Iskerry', 'Kell', 'Lindow', 'Marrick', 'Nethercote',
];

/**
 * The four parts of a kingdom, in the order they are read.
 *
 * Who came through which gate is the first thing that tells a crowd apart, so
 * the share of people who came through yours is set by your own law on
 * strangers and the rest of the count divides behind it.
 */
export const PEOPLE_IDS: People['id'][] = ['founders', 'comers', 'trades', 'river'];
