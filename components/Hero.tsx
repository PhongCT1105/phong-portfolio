'use client';

import { useEffect, useRef, useState } from 'react';
import { SITE_CONTENT } from '@/lib/content';
import { getOrCreateSessionId, prefersReducedMotion } from '@/lib/session';
import IconLinks from '@/components/IconLinks';

const SCRAMBLE_CHARS = '01<>[]{}#/\\*+=';

export default function Hero() {
  const scrambleRef = useRef<HTMLSpanElement>(null);
  const [sessionId, setSessionId] = useState('------');

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  useEffect(() => {
    const el = scrambleRef.current;
    if (!el || prefersReducedMotion()) return;

    const words = SITE_CONTENT.hero.scrambleWords;
    let wordIndex = 0;
    let scrambleTimer = 0;

    const cycle = window.setInterval(() => {
      wordIndex = (wordIndex + 1) % words.length;
      const target = words[wordIndex];
      const length = Math.max(el.textContent?.length ?? 0, target.length);
      let frame = 0;
      const total = 18;
      window.clearInterval(scrambleTimer);
      scrambleTimer = window.setInterval(() => {
        let out = '';
        for (let i = 0; i < length; i += 1) {
          if (i / length < frame / total) out += target[i] ?? '';
          else out += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
        el.textContent = out;
        frame += 1;
        if (frame > total) {
          window.clearInterval(scrambleTimer);
          el.textContent = target;
        }
      }, 28);
    }, 3000);

    return () => {
      window.clearInterval(cycle);
      window.clearInterval(scrambleTimer);
    };
  }, []);

  return (
    <section className="hero section-shell" id="phong" aria-labelledby="hero-name">
      <div className="hero__copy reveal">
        <p className="eyebrow">{SITE_CONTENT.hero.eyebrow}</p>
        <h1 className="hero__name" id="hero-name">
          PHONG
          <br />
          <span>CAO</span>
        </h1>
        <div className="hero__statement" aria-label="Primary statement">
          <span>I build</span>
          <span className="hero__scramble" ref={scrambleRef}>
            systems
          </span>
          <span>.</span>
        </div>
        <p className="hero__subhead">{SITE_CONTENT.hero.subhead}</p>
        <div className="hero__identity" aria-label="Highlights">
          {SITE_CONTENT.hero.identity.map((item) => (
            <span key={item} className="identity-chip">
              {item}
            </span>
          ))}
        </div>
        <div className="hero__actions">
          <IconLinks />
        </div>
      </div>

      <aside className="hero__telemetry reveal" aria-label="Current status">
        <div className="telemetry-card telemetry-card--live tilt-card">
          <div className="telemetry-card__head">
            <span>CURRENT SIGNAL</span>
            <span className="live-pill">
              <i /> LIVE
            </span>
          </div>
          <p>Making fragmented compute more useful.</p>
          <div className="mini-network" aria-hidden="true">
            <span style={{ '--x': '12%', '--y': '66%' } as React.CSSProperties} />
            <span style={{ '--x': '35%', '--y': '28%' } as React.CSSProperties} />
            <span style={{ '--x': '62%', '--y': '48%' } as React.CSSProperties} />
            <span style={{ '--x': '84%', '--y': '20%' } as React.CSSProperties} />
            <svg viewBox="0 0 100 40" preserveAspectRatio="none">
              <path d="M12 28 L35 11 L62 20 L84 8" />
            </svg>
          </div>
        </div>
        <div className="telemetry-grid">
          <div className="telemetry-card tilt-card">
            <small>LOCATION</small>
            <b>Bay Area ↗</b>
          </div>
          <div className="telemetry-card tilt-card">
            <small>SESSION</small>
            <b>{sessionId}</b>
          </div>
        </div>
      </aside>

      <div className="hero__scroll-cue" aria-hidden="true">
        <span>SCROLL TO TRACE</span>
        <i />
      </div>
    </section>
  );
}
