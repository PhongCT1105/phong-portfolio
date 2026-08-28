'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { measureStationRanges, useJourney } from '@/lib/journey';
import { prefersReducedMotion } from '@/lib/session';

/** the single live Lenis instance — nav + deep links ride the same rail */
let lenisRef: Lenis | null = null;
export const getLenis = (): Lenis | null => lenisRef;

/** expo-out, matching the site's cubic-bezier(.16,1,.3,1) motion token */
const expoOut = (t: number): number => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * In-page navigation that rides the scroll rail instead of teleporting.
 * Duration scales with distance (1.6s next-door → 2.6s hero→contact).
 * Reduced motion (and the pre-Lenis window before mount) keeps the instant jump.
 */
export function railScrollTo(target: number | HTMLElement, offset = 0, instant = false): void {
  const top = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY;
  const dest = Math.max(0, top + offset);
  const lenis = lenisRef;
  if (instant || !lenis || prefersReducedMotion()) {
    // go through Lenis when it owns the scroll so its internal target stays in sync
    if (lenis) lenis.scrollTo(dest, { immediate: true });
    else window.scrollTo(0, dest);
    return;
  }
  const viewports = Math.abs(dest - window.scrollY) / Math.max(1, window.innerHeight);
  const duration = Math.min(2.6, 1.6 + viewports * 0.18);
  lenis.scrollTo(dest, { duration, easing: expoOut });
}

export default function SmoothScroll() {
  useEffect(() => {
    const { setProgress, setRanges } = useJourney.getState();

    const measure = () => setRanges(measureStationRanges());
    measure();
    window.addEventListener('resize', measure, { passive: true });
    const settle = window.setTimeout(measure, 600);
    // fonts/lazy chunks shift layout late — re-measure once more after full settle
    const settleLate = window.setTimeout(measure, 2600);

    const nativeProgress = () => {
      const doc = document.documentElement;
      const total = Math.max(1, doc.scrollHeight - window.innerHeight);
      setProgress(window.scrollY / total);
    };

    if (prefersReducedMotion()) {
      nativeProgress();
      window.addEventListener('scroll', nativeProgress, { passive: true });
      return () => {
        window.removeEventListener('scroll', nativeProgress);
        window.removeEventListener('resize', measure);
        window.clearTimeout(settle);
        window.clearTimeout(settleLate);
      };
    }

    const lenis = new Lenis({ smoothWheel: true, lerp: 0.11 });
    lenisRef = lenis;
    lenis.on('scroll', (e: { progress: number }) => setProgress(e.progress));
    let raf = 0;
    const tick = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    nativeProgress();

    return () => {
      cancelAnimationFrame(raf);
      if (lenisRef === lenis) lenisRef = null;
      lenis.destroy();
      window.removeEventListener('resize', measure);
      window.clearTimeout(settle);
      window.clearTimeout(settleLate);
    };
  }, []);

  return null;
}
