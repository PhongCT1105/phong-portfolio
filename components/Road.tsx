import { SITE_CONTENT } from '@/lib/content';

export default function Road() {
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
        <div className="road__grid">
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
