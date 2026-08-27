'use client';

import { useEffect, useRef } from 'react';
import { SITE_CONTENT } from '@/lib/content';
import { prefersReducedMotion } from '@/lib/session';
import { useJourney } from '@/lib/journey';

function animateValue(el: HTMLElement, target: string) {
  const match = target.match(/^([^0-9−-]*)(−|-)?(\d+)(.*)$/);
  if (!match) {
    el.textContent = target;
    return;
  }
  const [, prefix, sign, digits, suffix] = match;
  const end = parseInt(digits, 10);
  const start = performance.now();
  const duration = 1100;
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = `${prefix}${sign ?? ''}${Math.round(end * eased)}${suffix}`;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export default function Receipts() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll<HTMLElement>('.receipt-card'));
    const reduced = prefersReducedMotion();
    const fired = cards.map(() => false);

    // hold values at zero until each vault door opens (non-reduced motion only)
    if (!reduced) {
      cards.forEach((card) => {
        const el = card.querySelector<HTMLElement>('.receipt-card__value');
        const target = el?.dataset.value ?? '';
        const match = target.match(/^([^0-9−-]*)(−|-)?(\d+)(.*)$/);
        if (el && match) el.textContent = `${match[1]}${match[2] ?? ''}0${match[4]}`;
      });
    }

    // count-up fires in lockstep with the 3D vault doors (same staggered thresholds)
    const check = () => {
      const { station, localT } = useJourney.getState();
      cards.forEach((card, i) => {
        if (fired[i]) return;
        const openT =
          station > 1 ? 1 : station < 1 ? 0 : Math.max(0, (localT - (0.32 + i * 0.12)) / 0.09);
        if (openT > 0.01) {
          fired[i] = true;
          card.classList.add('is-lit');
          const el = card.querySelector<HTMLElement>('.receipt-card__value');
          if (el && !reduced) animateValue(el, el.dataset.value ?? el.textContent ?? '');
        }
      });
      if (fired.every(Boolean)) unsubscribe();
    };
    const unsubscribe = useJourney.subscribe(check);
    check();
    return () => unsubscribe();
  }, []);

  return (
    <section className="receipts section-shell section-pad" id="receipts" aria-labelledby="receipts-title">
      <div className="section-head reveal">
        <div>
          <p className="eyebrow">CHAPTER 01 — RECEIPTS</p>
          <h2 id="receipts-title">Proof, with sources.</h2>
        </div>
        <p className="receipts__note text-scrim">
          Every number here traces to a contract, a prize, a release, or a paper — nothing decorative.
        </p>
      </div>
      <div className="receipts__grid" ref={gridRef}>
        {SITE_CONTENT.receipts.map((receipt) => (
          <article
            key={receipt.title}
            className={`receipt-card reveal${receipt.featured ? ' receipt-card--featured' : ''}`}
            style={{ '--dot-color': receipt.color } as React.CSSProperties}
          >
            <div className="receipt-card__value" data-value={receipt.value}>
              {receipt.value}
            </div>
            <div className="receipt-card__title">{receipt.title}</div>
            <p className="receipt-card__body">{receipt.body}</p>
            <div className="receipt-card__source">
              <i />
              {receipt.source}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
