import { SITE_CONTENT } from '@/lib/content';

export default function ResearchSection() {
  const { research } = SITE_CONTENT;
  return (
    <section className="research section-shell section-pad" id="research" aria-labelledby="research-title">
      <div className="research-card reveal tilt-card">
        <div className="research-card__top">
          <div>
            <p className="eyebrow">05 / RESEARCH</p>
            <div className="research-card__affiliations">
              {research.affiliations.flatMap((name, i) =>
                i > 0
                  ? [<i key={`sep-${name}`} />, <span key={name}>{name}</span>]
                  : [<span key={name}>{name}</span>]
              )}
            </div>
          </div>
          <div className="research-card__signal" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
        <h2 id="research-title">{research.headline}</h2>
        <p className="research-card__body">{research.body}</p>
        <div className="research-flow" aria-hidden="true">
          <span>RETRIEVE</span>
          <i />
          <span>SELECT</span>
          <i />
          <span>FORECAST</span>
          <i />
          <span>EVALUATE</span>
        </div>
        <div className="research-metrics">
          {research.metrics.map((metric) => (
            <div key={metric.label} className="research-metric">
              <b>{metric.value}</b>
              <span>{metric.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
