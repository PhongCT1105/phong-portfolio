import { SITE_CONTENT, type Affiliation } from '@/lib/content';

function BrandItem({ item }: { item: Affiliation }) {
  return (
    <div className="brand-item">
      <span
        className={`brand-item__logo${item.wide ? ' brand-item__logo--wide' : ''}`}
        style={
          {
            '--brand': item.color,
            '--logo': `url(${item.asset})`
          } as React.CSSProperties
        }
        role="img"
        aria-label={item.name}
      />
      <span className="brand-item__text">
        <strong>{item.name}</strong>
        <span>{item.role}</span>
      </span>
    </div>
  );
}

/** full-bleed animated affiliation strip — real brand marks in real brand colors.
 *  Four copies: the ticker translates exactly two copies' width (-50%), so the
 *  loop is seamless AND the track still covers ultra-wide viewports. */
export default function BrandStrip() {
  return (
    <section className="brand-strip" aria-label="Affiliations">
      <div className="brand-strip__track">
        {[0, 1, 2, 3].map((copy) => (
          <div key={copy} aria-hidden={copy > 0 ? 'true' : undefined} style={{ display: 'contents' }}>
            {SITE_CONTENT.affiliations.map((item) => (
              <BrandItem key={`${item.name}-${copy}`} item={item} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
