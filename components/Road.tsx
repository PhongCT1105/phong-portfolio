'use client';

import { useEffect, useRef } from 'react';
import { SITE_CONTENT } from '@/lib/content';
import { useJourney } from '@/lib/journey';

export default function Road() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const stops = Array.from(grid.querySelectorAll<HTMLElement>('.road-stop'));

    // activation mirrors the 3D gate ignitions: gate i at station-3 localT 0.08 + i*0.18
    const update = () => {
      const { station, localT } = useJourney.getState();
      stops.forEach((stop, i) => {
        // last stop activates earlier so its lit state is witnessable before
        // the card row scrolls out (gate 5's 3D ignition stays at 0.80)
        const threshold = i === 4 ? 0.62 : 0.08 + i * 0.18;
        const active = station > 3 || (station === 3 && localT >= threshold);
        stop.classList.toggle('is-active', active);
      });
    };
    const unsubscribe = useJourney.subscribe(update);
    update();
    return () => unsubscribe();
  }, []);

  return (
    <section className="road section-shell section-pad" id="road" aria-labelledby="road-title">
      <div className="section-head reveal">
        <div>
          <p className="eyebrow">CHAPTER 03 — THE ROAD</p>
          <h2 id="road-title">Five stops. One line each.</h2>
        </div>
      </div>

      <div className="road__track reveal">
        <div className="road__line" aria-hidden="true" />
        <div className="road__grid" ref={gridRef}>
          {SITE_CONTENT.road.map((stop) => (
            <article
              key={stop.org}
              className={`road-stop text-scrim${stop.current ? ' road-stop--current' : ''}`}
              style={{ '--stop-color': stop.color } as React.CSSProperties}
            >
              <span className="road-stop__dot" aria-hidden="true" />
              <div className="road-stop__year">{stop.year}</div>
              <div className="road-stop__org">{stop.org}</div>
              <div className="road-stop__role">{stop.role}</div>
              <div className="road-stop__metric">{stop.metric}</div>
            </article>
          ))}
        </div>
      </div>

      <div className="honors reveal">
        <span className="honors__label">HONORS — $10K+ PRIZE VALUE</span>
        {SITE_CONTENT.honors.map((honor) => (
          <span key={honor}>{honor}</span>
        ))}
      </div>
    </section>
  );
}
