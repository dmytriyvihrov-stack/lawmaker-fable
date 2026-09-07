/**
 * One answer to "does this person want things to move", and the build this
 * page is running.
 *
 * The motion check was written out five times, identically, in five files, and
 * a rule copied five times is a rule that will be four places out of date the
 * first time it changes. The build id was a compile-time constant baked into
 * the bundle, which meant an unchanged source tree produced a different
 * content hash every time it was built and every deploy committed a fresh
 * three quarters of a megabyte of identical minified JavaScript; it comes off
 * a meta tag in the page now, so the script is the same bytes until the source
 * changes and the timestamp lives outside it.
 */

export function reducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** The name of the tag the build writes into the page. */
export const BUILD_META = 'lawmaker-build';

export function buildId(): string {
  if (typeof document === 'undefined') return 'dev';
  const tag = document.querySelector(`meta[name="${BUILD_META}"]`);
  return tag?.getAttribute('content') ?? 'dev';
}
