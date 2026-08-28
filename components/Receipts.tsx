'use client';

import { useEffect, useRef } from 'react';
import { SITE_CONTENT } from '@/lib/content';
import { prefersReducedMotion } from '@/lib/session';
import { useJourney } from '@/lib/journey';
import { VAULT_THRESHOLDS } from '@/components/city/Vaults';

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
        {/* LABEL CLEARANCE: the curve runs 48 → 10, so the only band it never
            crosses on the right is BELOW it. The old y=30 put this label straight
            through the rising line; y=46 clears the curve (y≈27 at x=182) by ~12
            units and still reads as the end-of-line callout because it is anchored
            on the same x as the endpoint dot. Above the endpoint is not an option —
            the curve tops out at y=10 and the dot owns that last 10 units. */}
        <text x="286" y="46" textAnchor="end" className="viz-label">
          100+ PILOT USERS
        </text>
        {/* pulled up from y=38: at the 10.5px floor this label is ~86 wide, and the
            curve sits at y≈41.5 by the time it clears the last glyph */}
        <text x="14" y="34" className="viz-label">
          PYPI RELEASE
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
      {/* was x=90 y=6 centred over the tall bar: at 9.5px the cap-height already
          clipped against the top of the viewBox, and the 10.5px floor makes it
          worse. The bar's top is y=8, so there is no room above it — moved into
          the empty gutter to its left instead, anchored to the bar edge. */}
      <text x="56" y="16" textAnchor="end" className="viz-label">
        NO RAG
      </text>
      <text x="210" y="28" textAnchor="middle" className="viz-label">
        WITH RAG
      </text>
    </svg>
  );
}

/** the 2-second message: a giant org-tinted numeral lands in the stage as each vault opens */
function GiantValue() {
  const focusIdx = useJourney((s) => s.receiptFocus);
  const receipt = SITE_CONTENT.receipts[focusIdx];
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.textContent = receipt.value;
      return;
    }
    animateValue(el, receipt.value);
  }, [focusIdx, receipt.value]);

  return (
    <b
      key={focusIdx}
      ref={ref}
      className="receipt-giant"
      style={{ '--org': receipt.color } as React.CSSProperties}
      aria-hidden="true"
    >
      {receipt.value}
    </b>
  );
}

/** 3D tiers: one compact readout follows the opening vaults — the vaults own the frame.
 *  The GIANT numeral above carries the value; the readout carries only the story. */
function ReceiptReadout() {
  const focusIdx = useJourney((s) => s.receiptFocus);
  const receipt = SITE_CONTENT.receipts[focusIdx];

  return (
    <div
      className="receipt-readout text-scrim"
      style={{ '--dot-color': receipt.color } as React.CSSProperties}
    >
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
            {/* DOM → 3D crosstalk: hovering dot i flares vault i out in the city */}
            {SITE_CONTENT.receipts.map((r, i) => (
              <button
                key={r.title}
                className={i === focusIdx ? 'is-on' : ''}
                style={{ '--dot-color': r.color } as React.CSSProperties}
                aria-label={`Show ${r.title}`}
                onClick={() => useJourney.getState().setReceiptFocus(i)}
                onPointerEnter={() => useJourney.getState().setReceiptHover(i)}
                onPointerLeave={() => useJourney.getState().setReceiptHover(null)}
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

  // ORDER FIX: the focused receipt is DERIVED from scroll position — strictly
  // monotonic with the scrollbar, so it can never strobe back to a stale number
  // the way per-vault open announcements could. Dot clicks still override until
  // the next threshold crossing.
  useEffect(() => {
    if (tier === 'off') return;
    let derived = -1;
    const update = () => {
      const { station, localT } = useJourney.getState();
      let idx: number;
      if (station < 1) idx = 0;
      else if (station > 1) idx = VAULT_THRESHOLDS.length - 1;
      else {
        idx = 0;
        // a door counts once it is mostly open (threshold + most of the 0.08 swing)
        VAULT_THRESHOLDS.forEach((t, i) => {
          if (localT >= t + 0.05) idx = i;
        });
      }
      if (idx !== derived) {
        derived = idx;
        useJourney.getState().setReceiptFocus(idx);
      }
    };
    const unsubscribe = useJourney.subscribe(update);
    update();
    return () => unsubscribe();
  }, [tier]);

  const head = (
    <div className="section-head reveal">
      <div>
        <p className="eyebrow">CHAPTER 01 — RECEIPTS</p>
        <h2 id="receipts-title">Proof, with sources.</h2>
      </div>
      <p className="receipts__note text-scrim">
        Every number here traces to a contract, a prize, a release, or a paper — nothing decorative.
      </p>
    </div>
  );

  if (tier === 'off') {
    return (
      <section className="receipts section-shell section-pad" id="receipts" aria-labelledby="receipts-title">
        {head}
        <ReceiptCards />
      </section>
    );
  }

  // tall scroll track + sticky stage: the chapter owns ~3 viewports of scroll so
  // each vault/number gets real viewing time instead of flashing past
  return (
    <section className="receipts section-shell receipts--track" id="receipts" aria-labelledby="receipts-title">
      <div className="receipts__sticky">
        {head}
        <div className="receipts__stage reveal">
          <div className="receipts__window">
            <span className="shelf__window-hint">SCROLL — THE VAULTS OPEN · CLICK A VAULT</span>
          </div>
          <div style={{ position: 'relative' }}>
            <GiantValue />
            <ReceiptReadout />
          </div>
        </div>
      </div>
    </section>
  );
}
