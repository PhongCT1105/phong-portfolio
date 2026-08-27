'use client';

import { useEffect, useRef, useState } from 'react';
import { SITE_CONTENT } from '@/lib/content';
import { ROAD_THRESHOLDS, useJourney } from '@/lib/journey';

export default function Road() {
  const gridRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(-1);
  const tier = useJourney((s) => s.tier);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const stops = Array.from(grid.querySelectorAll<HTMLElement>('.road-stop'));

    // activation mirrors the 3D gate ignitions; the LATEST stop is the spotlight
    const update = () => {
      const { station, localT } = useJourney.getState();
      let latest = -1;
      stops.forEach((stop, i) => {
        const active = station > 3 || (station === 3 && localT >= ROAD_THRESHOLDS[i]);
        stop.classList.toggle('is-active', active);
        if (active) latest = i;
      });
      stops.forEach((stop, i) => stop.classList.toggle('is-current', i === latest));
      setCurrent(latest);
    };
    const unsubscribe = useJourney.subscribe(update);
    update();
    return () => unsubscribe();
  }, []);

  const spotlight = current >= 0 ? SITE_CONTENT.road[current] : SITE_CONTENT.road[0];
  const yearLabel = spotlight.year.includes('NEXT')
    ? '2026'
    : spotlight.year.replace(' · NOW', '');

  return (
    <section
      className={`road section-shell${tier === 'off' ? ' section-pad' : ' road--track'}`}
      id="road"
      aria-labelledby="road-title"
    >
      <div className={tier === 'off' ? undefined : 'road__sticky'}>
      {/* sticky so every ignition's year swap is on screen through the whole chapter */}
      <div className="road-year-wrap" aria-hidden="true">
        <b
          key={current}
          className={`road-year-giant${current >= 0 ? ' is-live' : ''}`}
          style={{ '--org': spotlight.color } as React.CSSProperties}
        >
          {yearLabel}
        </b>
      </div>
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
      </div>
    </section>
  );
}
