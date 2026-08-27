'use client';

import { useEffect, useRef } from 'react';
import { SITE_CONTENT } from '@/lib/content';
import { prefersReducedMotion } from '@/lib/session';
import IconLinks from '@/components/IconLinks';

const WORDS = ['systems', 'infra', 'pipelines', 'platforms'];
const SCRAMBLE_CHARS = '01<>[]{}#/\\*+=';

export default function Hero() {
  const scrambleRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = scrambleRef.current;
    if (!el || prefersReducedMotion()) return;

    let wordIndex = 0;
    let scrambleTimer = 0;
    const cycle = window.setInterval(() => {
      wordIndex = (wordIndex + 1) % WORDS.length;
      const target = WORDS[wordIndex];
      const length = Math.max(el.textContent?.length ?? 0, target.length);
      let frame = 0;
      const total = 13; // short decode — the settled word owns most of the cycle
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
    }, 3200);

    return () => {
      window.clearInterval(cycle);
      window.clearInterval(scrambleTimer);
    };
  }, []);

  return (
    <section className="hero2 section-shell" id="phong" aria-labelledby="hero-name">
      <div className="reveal">
        <p className="eyebrow">{SITE_CONTENT.hero.eyebrow}</p>
        <h1 className="hero2__name" id="hero-name">
          <span className="hero2__sheen">PHONG</span>
          <br />
          <span className="hero2__outline">CAO</span>
        </h1>
        <p className="hero2__statement">
          I build{' '}
          <span className="hero2__scramble" ref={scrambleRef}>
            systems
          </span>{' '}
          that survive failure.
        </p>
        <p className="hero2__sub text-scrim">{SITE_CONTENT.hero.sub}</p>
        <div className="hero2__actions">
          <IconLinks />
        </div>
      </div>
    </section>
  );
}
