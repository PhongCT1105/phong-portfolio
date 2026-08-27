'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { measureStationRanges, useJourney } from '@/lib/journey';
import { prefersReducedMotion } from '@/lib/session';

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
      lenis.destroy();
      window.removeEventListener('resize', measure);
      window.clearTimeout(settle);
      window.clearTimeout(settleLate);
    };
  }, []);

  return null;
}
