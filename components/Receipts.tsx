'use client';

import { useEffect, useRef } from 'react';
import { SITE_CONTENT } from '@/lib/content';
import { prefersReducedMotion } from '@/lib/session';

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
    const values = Array.from(grid.querySelectorAll<HTMLElement>('.receipt-card__value'));
    if (prefersReducedMotion()) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            animateValue(el, el.dataset.value ?? el.textContent ?? '');
            observer.unobserve(el);
          }
        }
      },
      { threshold: 0.6 }
    );
    values.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="receipts section-shell section-pad" id="receipts" aria-labelledby="receipts-title">
      <div className="section-head reveal">
        <div>
          <p className="eyebrow">CHAPTER 01 — RECEIPTS</p>
          <h2 id="receipts-title">Proof, with sources.</h2>
        </div>
        <p className="receipts__note">
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
