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
    const t = Math.min(1, Math.max(0, (now - start) / duration));
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = `${prefix}${sign ?? ''}${Math.round(end * eased)}${suffix}`;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/** per-receipt micro-visualization (animates via .is-lit on cards, always-on in the readout) */
function ReceiptViz({ viz, color }: { viz: string; color: string }) {
  if (viz === 'steps') {
    return (
      <svg className="receipt-viz" viewBox="0 0 300 56" aria-hidden="true">
        <line className="viz-draw" x1="16" y1="20" x2="284" y2="20" stroke={color} strokeWidth="1.6" />
        {[
          { x: 16, label: 'POC' },
          { x: 150, label: '97% R@5' },
          { x: 284, label: '$30K SIGNED' }
        ].map((step, i) => (
          <g key={step.label} className="viz-step" style={{ transitionDelay: `${400 + i * 260}ms` }}>
            <circle cx={step.x} cy="20" r="5" fill="#070907" stroke={color} strokeWidth="2" />
            <text x={step.x} y="46" textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'} className="viz-label">
              {step.label}
            </text>
          </g>
        ))}
      </svg>
    );
  }
  if (viz === 'podium') {
    return (
      <svg className="receipt-viz" viewBox="0 0 300 56" aria-hidden="true">
        {[
          { x: 76, h: 20, place: '2', accent: false },
          { x: 132, h: 34, place: '1', accent: true },
          { x: 188, h: 14, place: '3', accent: false }
        ].map((bar, i) => (
          <g key={bar.place}>
            <rect
              className="viz-bar"
              x={bar.x}
              y={50 - bar.h}
              width="36"
              height={bar.h}
              rx="2"
              fill={bar.accent ? color : 'rgba(226,232,221,.16)'}
              style={{ transitionDelay: `${350 + i * 140}ms`, transformOrigin: '50% 50px' }}
            />
            <text x={bar.x + 18} y={46 - bar.h} textAnchor="middle" className="viz-label" fill={bar.accent ? color : undefined}>
              {bar.place}
            </text>
          </g>
        ))}
      </svg>
    );
  }
  if (viz === 'spark') {
    return (
      <svg className="receipt-viz" viewBox="0 0 300 56" aria-hidden="true">
        <path
          className="viz-draw"
          d="M14 48 C 70 46, 110 42, 150 34 C 200 24, 244 16, 286 10"
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
        <circle className="viz-step" cx="286" cy="10" r="4.5" fill={color} style={{ transitionDelay: '900ms' }} />
        <text x="14" y="38" className="viz-label">
          PYPI RELEASE
        </text>
        <text x="286" y="30" textAnchor="end" className="viz-label">
          100+ PILOT USERS
        </text>
      </svg>
    );
  }
  return (
    <svg className="receipt-viz" viewBox="0 0 300 56" aria-hidden="true">
      <rect className="viz-bar" x="60" y="8" width="60" height="42" rx="2" fill="rgba(226,232,221,.16)" style={{ transformOrigin: '50% 50px' }} />
      <rect
        className="viz-bar"
        x="180"
        y="33"
        width="60"
        height="17"
        rx="2"
        fill={color}
        style={{ transitionDelay: '400ms', transformOrigin: '50% 50px' }}
      />
      <text x="90" y="6" textAnchor="middle" className="viz-label">
        NO RAG
      </text>
      <text x="210" y="28" textAnchor="middle" className="viz-label">
        WITH RAG
      </text>
    </svg>
  );
}

/** 3D tiers: one compact readout follows the opening vaults — the vaults own the frame */
function ReceiptReadout() {
  const focusIdx = useJourney((s) => s.receiptFocus);
  const receipt = SITE_CONTENT.receipts[focusIdx];
  const valueRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = valueRef.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.textContent = receipt.value;
      return;
    }
    animateValue(el, receipt.value);
  }, [focusIdx, receipt.value]);

  return (
    <div
      className="receipt-readout text-scrim"
      style={{ '--dot-color': receipt.color } as React.CSSProperties}
      onPointerEnter={() => useJourney.getState().setReceiptHover(focusIdx)}
      onPointerLeave={() => useJourney.getState().setReceiptHover(null)}
    >
      <b className="receipt-readout__value" ref={valueRef}>
        {receipt.value}
      </b>
      <div className="receipt-readout__main">
        <strong>{receipt.title}</strong>
        <p>{receipt.body}</p>
        <div className="receipt-card__secondary">
          {receipt.secondary.map((chip) => (
            <span key={chip}>{chip}</span>
          ))}
        </div>
      </div>
      <div className="receipt-readout__side">
        <ReceiptViz viz={receipt.viz} color={receipt.color} />
        <div className="receipt-readout__foot">
          <span className="receipt-card__source">
            <i />
            {receipt.source}
          </span>
          <span className="receipt-readout__dots">
            {SITE_CONTENT.receipts.map((r, i) => (
              <button
                key={r.title}
                className={i === focusIdx ? 'is-on' : ''}
                style={{ '--dot-color': r.color } as React.CSSProperties}
                aria-label={`Show ${r.title}`}
                onClick={() => useJourney.getState().setReceiptFocus(i)}
              />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}

/** fallback tier: the original four cards with vault-threshold count-ups */
function ReceiptCards() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll<HTMLElement>('.receipt-card'));
    const reduced = prefersReducedMotion();
    const fired = cards.map(() => false);

    const check = () => {
      const { station, localT } = useJourney.getState();
      cards.forEach((card, i) => {
        if (fired[i]) return;
        const openT =
          station > 1 ? 1 : station < 1 ? 0 : Math.max(0, (localT - (0.3 + i * 0.13)) / 0.1);
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
    <div className="receipts__grid" ref={gridRef}>
      {SITE_CONTENT.receipts.map((receipt, index) => (
        <article
          key={receipt.title}
          className={`receipt-card reveal${receipt.featured ? ' receipt-card--featured' : ''}`}
          style={{ '--dot-color': receipt.color } as React.CSSProperties}
          onPointerEnter={() => useJourney.getState().setReceiptHover(index)}
          onPointerLeave={() => useJourney.getState().setReceiptHover(null)}
        >
          <div className="receipt-card__value" data-value={receipt.value}>
            {receipt.value}
          </div>
          <div className="receipt-card__title">{receipt.title}</div>
          <ReceiptViz viz={receipt.viz} color={receipt.color} />
          <p className="receipt-card__body">{receipt.body}</p>
          <div className="receipt-card__secondary">
            {receipt.secondary.map((chip) => (
              <span key={chip}>{chip}</span>
            ))}
          </div>
          <div className="receipt-card__source">
            <i />
            {receipt.source}
          </div>
        </article>
      ))}
    </div>
  );
}

export default function Receipts() {
  const tier = useJourney((s) => s.tier);

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
      {tier === 'off' ? (
        <ReceiptCards />
      ) : (
        <div className="receipts__stage reveal">
          <div className="receipts__window" aria-hidden="true">
            <span className="shelf__window-hint">SCROLL — THE VAULTS OPEN · CLICK A VAULT</span>
          </div>
          <ReceiptReadout />
        </div>
      )}
    </section>
  );
}
