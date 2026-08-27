import { SITE_CONTENT } from '@/lib/content';

export default function EducationSection() {
  return (
    <section className="education section-shell section-pad" aria-labelledby="education-title">
      <div className="education-card reveal">
        <div className="education-card__mark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SITE_CONTENT.education.marker} alt="WPI" />
        </div>
        <div>
          <p className="eyebrow">07 / EDUCATION</p>
          <h2 id="education-title">Worcester Polytechnic Institute</h2>
          <p>{SITE_CONTENT.education.degree}</p>
        </div>
        <div className="education-card__coords" aria-hidden="true">
          42.2746°N
          <br />
          71.8063°W
        </div>
      </div>
    </section>
  );
}
