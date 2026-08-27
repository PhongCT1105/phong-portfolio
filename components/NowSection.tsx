'use client';

import { useEffect, useRef } from 'react';
import { SITE_CONTENT } from '@/lib/content';
import { useJourney } from '@/lib/journey';
import { prefersReducedMotion } from '@/lib/session';

export default function NowSection() {
  const { now } = SITE_CONTENT;
  const statRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = statRef.current;
    if (!el || prefersReducedMotion()) return;
    let fired = false;
    el.textContent = '0% faster';
    const check = () => {
      const { station, localT } = useJourney.getState();
      if (fired || !(station > 4 || (station === 4 && localT > 0.02))) return;
      fired = true;
      unsubscribe();
      const start = performance.now();
      const tick = (nowT: number) => {
        const t = Math.min(1, Math.max(0, (nowT - start) / 1100));
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = `${Math.round(47 * eased)}% faster`;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const unsubscribe = useJourney.subscribe(check);
    check();
    return () => unsubscribe();
  }, []);
  return (
    <section className="section-shell section-pad" id="now" aria-labelledby="now-title">
      <div className="now">
        <div className="now__copy text-scrim reveal">
          <p className="eyebrow">{now.eyebrow}</p>
          <h2 id="now-title">{now.headline}</h2>
          <p className="now__body">{now.body}</p>
          <div className="now__tags">
            {now.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <p className="now__next">
            Next chapter: AI-assisted GPU validation at <b>NVIDIA</b>.
          </p>
        </div>

        <div className="scheduler reveal" aria-label="FlashML scheduling model">
          <div className="scheduler__head">
            <span>THE ACTUAL FLASHML MODEL — NOT A DECORATIVE GRAPH</span>
            <span>LIVE</span>
          </div>
          <div className="scheduler__queue">JOB QUEUE — 128 PENDING</div>
          <svg className="scheduler__paths" viewBox="0 0 540 44" aria-hidden="true">
            <line x1="270" y1="0" x2="90" y2="44" stroke="rgba(155,225,93,.5)" strokeWidth="1.4" />
            <line x1="270" y1="0" x2="270" y2="44" stroke="rgba(155,225,93,.5)" strokeWidth="1.4" />
            <line x1="270" y1="0" x2="450" y2="44" stroke="rgba(255,139,122,.5)" strokeWidth="1.4" strokeDasharray="5 5" />
          </svg>
          <div className="scheduler__workers">
            <div className="scheduler-worker">
              <small>WORKER A · FAST</small>
              <i>
                <em style={{ '--fill': '88%' } as React.CSSProperties} />
              </i>
              <b>CLAIMED 61 JOBS</b>
            </div>
            <div className="scheduler-worker">
              <small>WORKER B · MID</small>
              <i>
                <em style={{ '--fill': '52%' } as React.CSSProperties} />
              </i>
              <b>CLAIMED 39 JOBS</b>
            </div>
            <div className="scheduler-worker scheduler-worker--dead">
              <small>WORKER C · DIED</small>
              <i>
                <em style={{ '--fill': '20%' } as React.CSSProperties} />
              </i>
              <b>28 JOBS → BACK TO QUEUE</b>
            </div>
          </div>
          <div className="scheduler__foot">
            <small>BATCH COMPLETION VS STATIC SCHEDULING</small>
            <b ref={statRef}>47% faster</b>
          </div>
        </div>
      </div>
    </section>
  );
}
