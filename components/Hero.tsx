import { SITE_CONTENT } from '@/lib/content';
import IconLinks from '@/components/IconLinks';

export default function Hero() {
  return (
    <section className="hero2 section-shell" id="phong" aria-labelledby="hero-name">
      <div className="reveal">
        <p className="eyebrow">{SITE_CONTENT.hero.eyebrow}</p>
        <h1 className="hero2__name" id="hero-name">
          PHONG
          <br />
          <span>CAO</span>
        </h1>
        <p className="hero2__statement">{SITE_CONTENT.hero.statement}</p>
        <p className="hero2__sub text-scrim">{SITE_CONTENT.hero.sub}</p>
        <div className="hero2__actions">
          <IconLinks />
        </div>
      </div>

      <div className="affiliation-strip reveal" aria-label="Affiliations">
        <span className="affiliation-strip__label">AFFILIATIONS — FULL COLOR, ONE PASS</span>
        <div className="affiliation-strip__row">
          {SITE_CONTENT.affiliations.map((item) => (
            <div
              key={item.name}
              className="brand-chip"
              style={{ '--chip-color': item.color } as React.CSSProperties}
            >
              <b>{item.name}</b>
              <span>{item.role}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
