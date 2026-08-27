import { SITE_CONTENT } from '@/lib/content';

export default function NumbersSection() {
  return (
    <section className="numbers section-shell section-pad" aria-labelledby="numbers-title">
      <div className="section-intro reveal">
        <p className="eyebrow">01 / FAST PROOF</p>
        <h2 id="numbers-title">
          Read the signal.
          <br />
          Skip the résumé.
        </h2>
      </div>
      <div className="numbers__grid">
        {SITE_CONTENT.numbers.map((item) => (
          <article key={item.label} className="number-card reveal">
            <b>{item.value}</b>
            <span>{item.label}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
