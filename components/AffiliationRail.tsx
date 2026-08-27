import { SITE_CONTENT, formatRelationshipLabel, type Affiliation } from '@/lib/content';

function AffiliationItem({ item }: { item: Affiliation }) {
  const image = item.asset || item.icon || '';
  return (
    <div className={`affiliation-item${item.asset ? '' : ' affiliation-item--protected'}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt={`${item.name} — ${item.relationship}`} loading="lazy" />
      <div className="affiliation-item__text">
        <strong>{item.name}</strong>
        <span>{formatRelationshipLabel(item.relationship)}</span>
      </div>
    </div>
  );
}

export default function AffiliationRail() {
  return (
    <section className="affiliation-rail" aria-label="Affiliations and recognition">
      <div className="affiliation-rail__track">
        {SITE_CONTENT.affiliations.map((item) => (
          <AffiliationItem key={item.name} item={item} />
        ))}
        {/* duplicate pass for the seamless ticker loop */}
        <div aria-hidden="true" style={{ display: 'contents' }}>
          {SITE_CONTENT.affiliations.map((item) => (
            <AffiliationItem key={`${item.name}-dup`} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
