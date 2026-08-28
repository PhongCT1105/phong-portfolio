'use client';

import { useEffect, useRef, useState } from 'react';
import { BOOT_KEY, getOrCreateSessionId, prefersReducedMotion } from '@/lib/session';
import { useJourney } from '@/lib/journey';

type LogLine = { text: string; cls: string; dots?: boolean };
/** a narrative label + the boot value at which it has actually been earned */
type Stage = LogLine & { at: number };

/**
 * R8 ARRIVAL — the loader now measures something.
 *
 * The old sequence was five `await sleep(200)`s: the meter was a stopwatch, and it
 * hit 100% while the city was still compiling shaders. This version integrates
 * toward a CEILING that only real readiness lifts:
 *
 *   0 → .55   always available (the connection beat)
 *   .55 → .90 unlocked by document.fonts.ready — the type the page is about to
 *             draw is actually resident
 *   .90 → 1   unlocked by the FIRST PAINTED 3D FRAME (journey.firstFrame, set from
 *             a useFrame in CityScene after one full render), or immediately on the
 *             2D fallback tier where there is no frame to wait for
 *
 * The labels are read OFF that value, so they are descriptions of progress rather
 * than a script running beside it. A deadline caps the whole thing so a stalled
 * font file or a dead GL context can never trap a visitor behind the overlay.
 */
const FRESH_DEADLINE_MS = 3200;
const RETURN_DEADLINE_MS = 1600;
/** approach rate toward the current ceiling (per second, exponential) */
const FRESH_RATE = 2.2;
const RETURN_RATE = 8;

export default function Boot() {
  const [done, setDone] = useState(false);
  const [lines, setLines] = useState<LogLine[]>([]);
  const meterRef = useRef<HTMLSpanElement>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    let cancelled = false;
    let raf = 0;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, ms));
    };

    const sessionId = getOrCreateSessionId();
    const already = window.sessionStorage.getItem(BOOT_KEY) === '1';
    const { setBoot } = useJourney.getState();

    if (prefersReducedMotion()) {
      setBoot(1);
      setDone(true);
      window.dispatchEvent(new Event('phong:booted'));
      return;
    }

    document.body.classList.add('is-booting');

    const stages: Stage[] = already
      ? [{ at: 0, text: `SESSION ${sessionId} · RECONNECTING`, cls: '', dots: true }]
      : [
          { at: 0, text: 'ESTABLISHING CONNECTION', cls: '', dots: true },
          { at: 0.18, text: `SESSION ${sessionId}`, cls: 'ok' },
          { at: 0.36, text: 'POWERING THE GRID', cls: '' },
          { at: 0.58, text: 'LIGHTING DOWNTOWN', cls: '' },
          { at: 0.8, text: 'OPENING THE VAULTS', cls: '' }
        ];

    // real gate 1: the fonts this page is about to lay out
    let fontsReady = false;
    if (document.fonts?.ready) document.fonts.ready.then(() => (fontsReady = true));
    else fontsReady = true;
    // real gate 2: a painted 3D frame — or none owed, on the 2D fallback tier
    const painted = () => {
      const state = useJourney.getState();
      return state.firstFrame || state.tier === 'off';
    };

    const deadline = performance.now() + (already ? RETURN_DEADLINE_MS : FRESH_DEADLINE_MS);
    const rate = already ? RETURN_RATE : FRESH_RATE;

    let value = 0;
    let shown = 0;
    let sentBoot = -1;
    let last = performance.now();

    const tick = (now: number) => {
      if (cancelled) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const overdue = now > deadline;
      const ceiling = overdue ? 1 : !fontsReady ? 0.55 : painted() ? 1 : 0.9;
      value = Math.max(value, value + (ceiling - value) * (1 - Math.exp(-dt * rate)));
      // an exponential approach never arrives — close enough IS arrived
      if (ceiling - value < 0.004) value = ceiling;

      if (meterRef.current) meterRef.current.style.width = `${Math.round(value * 100)}%`;
      // the city lights behind the overlay off the SAME number the meter shows
      if (value - sentBoot > 0.004) {
        sentBoot = value;
        setBoot(value);
      }
      const next = stages.filter((s) => value >= s.at).length;
      if (next !== shown) {
        shown = next;
        setLines(stages.slice(0, next));
      }

      if (value >= 1) {
        // CONNECTED is the beat: it lands only once the city is genuinely up
        setLines([...stages, { text: 'CONNECTED', cls: 'ok boot-line--big' }]);
        setBoot(0.94);
        later(() => {
          if (cancelled) return;
          window.sessionStorage.setItem(BOOT_KEY, '1');
          setDone(true); // overlay fade begins…
          document.body.classList.remove('is-booting');
          // …sign flickers on 250ms in. boot hitting exactly 1 is also what arms
          // the intro dolly in CityScene's CameraRig — i.e. the camera starts
          // moving as the loader clears, not before.
          later(() => setBoot(1), 250);
          window.dispatchEvent(new Event('phong:booted'));
        }, 320);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
      document.body.classList.remove('is-booting');
    };
  }, []);

  return (
    <div className={`boot${done ? ' is-done' : ''}`} aria-hidden="true">
      <div className="boot__grid" aria-hidden="true" />
      <div className="boot__panel">
        <p className="boot__brand">PHONG.SYSTEMS</p>
        <div className="boot__log">
          {lines.map((line, i) => (
            <div key={i} className={line.cls}>
              {line.text}
              {line.dots ? <span className="boot-dots">...</span> : null}
            </div>
          ))}
        </div>
        <div className="boot__meter" aria-hidden="true">
          <span ref={meterRef} style={{ width: 0 }} />
        </div>
      </div>
    </div>
  );
}
