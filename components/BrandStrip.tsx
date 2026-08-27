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

/** full-bleed animated affiliation strip — real brand marks in real brand colors */
export default function BrandStrip() {
  return (
    <section className="brand-strip" aria-label="Affiliations">
      <div className="brand-strip__track">
        {SITE_CONTENT.affiliations.map((item) => (
          <BrandItem key={item.name} item={item} />
        ))}
        <div aria-hidden="true" style={{ display: 'contents' }}>
          {SITE_CONTENT.affiliations.map((item) => (
            <BrandItem key={`${item.name}-dup`} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
