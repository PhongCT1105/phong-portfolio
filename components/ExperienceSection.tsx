import { SITE_CONTENT } from '@/lib/content';

export default function ExperienceSection() {
  return (
    <section className="experience section-shell section-pad" aria-labelledby="experience-title">
      <div className="section-intro reveal">
        <p className="eyebrow">06 / SELECTED EXPERIENCE</p>
        <h2 id="experience-title">
          Enough context.
          <br />
          No résumé dump.
        </h2>
      </div>
      <div className="experience-list">
        {SITE_CONTENT.experience.map((item) => (
          <article key={`${item.org}-${item.role}`} className="experience-row reveal">
            <div className="experience-row__when">{item.when}</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.marker} alt="" aria-hidden="true" />
            <div className="experience-row__org">{item.org}</div>
            <div className="experience-row__role">{item.role}</div>
          </article>
        ))}
      </div>
    </section>
  );
}
