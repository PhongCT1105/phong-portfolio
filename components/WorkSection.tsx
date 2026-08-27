import { SITE_CONTENT } from '@/lib/content';

export default function WorkSection() {
  return (
    <section className="work section-shell section-pad" id="work" aria-labelledby="work-title">
      <div className="section-intro reveal">
        <p className="eyebrow">03 / SELECTED PROOF OF WORK</p>
        <h2 id="work-title">
          Built, measured,
          <br />
          then shipped.
        </h2>
      </div>
      <div className="work-list">
        {SITE_CONTENT.projects.map((project) => {
          const link = project.links[0];
          const rowContent = (
            <>
              <span className="work-row__num">{project.number}</span>
              <strong className="work-row__title">{project.title}</strong>
              <span className="work-row__desc">{project.description}</span>
              <span className="work-row__recognition">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={project.marker} alt="" aria-hidden="true" />
                {project.recognition}
              </span>
              <span className="work-row__link">{link ? `${link.label} ↗` : 'DETAILS'}</span>
            </>
          );
          return link ? (
            <a key={project.number} className="work-row reveal" href={link.url} target="_blank" rel="noreferrer">
              {rowContent}
            </a>
          ) : (
            <div key={project.number} className="work-row reveal is-static">
              {rowContent}
            </div>
          );
        })}
      </div>
    </section>
  );
}
