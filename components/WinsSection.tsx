'use client';

import { useEffect, useRef, useState } from 'react';
import { SITE_CONTENT } from '@/lib/content';
import { clamp01 } from '@/lib/session';

export default function WinsSection() {
  const railRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [activeFlags, setActiveFlags] = useState<boolean[]>(() =>
    SITE_CONTENT.wins.map(() => false)
  );

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const items = Array.from(rail.querySelectorAll<HTMLElement>('.win-item'));

    const update = () => {
      const rect = rail.getBoundingClientRect();
      const target = window.innerHeight * 0.68;
      setProgress(clamp01((target - rect.top) / Math.max(1, rect.height * 0.9)) * 100);
      setActiveFlags(
        items.map((item) => {
          const r = item.getBoundingClientRect();
          return r.top < target && r.bottom > window.innerHeight * 0.15;
        })
      );
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <section className="wins section-pad" id="wins" aria-labelledby="wins-title">
      <div className="section-shell wins__layout">
        <div className="wins__sticky reveal">
          <p className="eyebrow">04 / HACKATHONS</p>
          <div className="wins__number" aria-hidden="true">
            <span>10</span>×
          </div>
          <h2 id="wins-title">
            Hackathon
            <br />
            wins.
          </h2>
          <p>Repeated proof that I can build quickly under ambiguous constraints.</p>
        </div>
        <div
          ref={railRef}
          className="wins-rail"
          style={{ '--rail-progress': `${progress}%` } as React.CSSProperties}
        >
          {SITE_CONTENT.wins.map((win, i) => (
            <article key={`${win.org}-${win.year}`} className={`win-item reveal${activeFlags[i] ? ' is-active' : ''}`}>
              <div className="win-item__year">{win.year}</div>
              <div className="win-item__org">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={win.marker} alt="" aria-hidden="true" />
                <strong>{win.org}</strong>
              </div>
              <div className="win-item__placement">{win.placement}</div>
              <div className="win-item__project">{win.project}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
