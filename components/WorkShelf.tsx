'use client';

import { useCallback, useEffect, useState } from 'react';
import { SITE_CONTENT, type Project } from '@/lib/content';

const COVER_ART: Record<string, React.ReactNode> = {
  flashml: (
    <svg width="150" height="110" viewBox="0 0 150 110">
      <line x1="20" y1="90" x2="75" y2="30" stroke="rgba(155,225,93,.5)" strokeWidth="1.2" />
      <line x1="75" y1="30" x2="130" y2="70" stroke="rgba(155,225,93,.5)" strokeWidth="1.2" />
      <line x1="20" y1="90" x2="130" y2="70" stroke="rgba(155,225,93,.25)" strokeWidth="1" />
      <circle cx="20" cy="90" r="6" fill="#9be15d" />
      <circle cx="75" cy="30" r="8" fill="#b8ff72" />
      <circle cx="130" cy="70" r="5" fill="#9be15d" />
    </svg>
  ),
  'captain-ddoski': (
    <svg width="110" height="86" viewBox="0 0 110 86">
      <path d="M14 66 L38 30 L62 52 L96 18" stroke="#7ba7ff" strokeWidth="2" fill="none" />
      <circle cx="96" cy="18" r="5" fill="#7ba7ff" />
      <rect x="10" y="70" width="90" height="4" rx="2" fill="rgba(123,167,255,.3)" />
    </svg>
  ),
  'on-device-qa': (
    <svg width="110" height="86" viewBox="0 0 110 86">
      <rect x="30" y="12" width="50" height="62" rx="8" stroke="#ffb45a" strokeWidth="2" fill="none" />
      <rect x="44" y="60" width="22" height="4" rx="2" fill="#ffb45a" />
      <path d="M42 34 L52 44 L68 26" stroke="#ffb45a" strokeWidth="2" fill="none" />
    </svg>
  ),
  'hospital-nav': (
    <svg width="110" height="86" viewBox="0 0 110 86">
      <path d="M20 70 L20 40 L44 40 L44 70" stroke="#e04050" strokeWidth="2" fill="none" />
      <path d="M44 54 L66 54 L66 30 L90 30 L90 70" stroke="#e04050" strokeWidth="2" fill="none" />
      <circle cx="20" cy="40" r="4" fill="#e04050" />
      <circle cx="90" cy="30" r="4" fill="#e04050" />
      <path d="M50 14 h10 M55 9 v10" stroke="#e04050" strokeWidth="2.4" />
    </svg>
  )
};

const CARD_TONES: Record<string, { hi: string; lo: string }> = {
  flashml: { hi: '#101710', lo: '#0a0d0a' },
  'captain-ddoski': { hi: '#0b1020', lo: '#080a12' },
  'on-device-qa': { hi: '#171107', lo: '#0e0a06' },
  'hospital-nav': { hi: '#180a0d', lo: '#0e0608' }
};

function CaseBook({ project, onClose }: { project: Project | null; onClose: () => void }) {
  useEffect(() => {
    if (!project) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [project, onClose]);

  return (
    <div
      className={`casebook${project ? ' is-open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={project ? `${project.title} case study` : undefined}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {project ? (
        <div className="casebook__panel" style={{ '--card-accent': project.accent } as React.CSSProperties}>
          <button className="casebook__close" onClick={onClose} aria-label="Close case study">
            ×
          </button>
          <div className="casebook__side">
            <div className="casebook__cover">
              {COVER_ART[project.slug]}
              <span>{project.title}</span>
            </div>
            <div className="casebook__shot">
              [ REAL SCREENSHOT / DEMO GIF ]
              <br />
              coming from Phong
            </div>
            <div className="casebook__links">
              {project.links.length ? (
                project.links.map((link) => (
                  <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
                    ↗ {link.label}
                  </a>
                ))
              ) : (
                <span style={{ color: 'var(--muted-2)' }}>Links coming soon</span>
              )}
            </div>
          </div>
          <div className="casebook__main">
            <div className="casebook__meta">
              <span className="casebook__badge">{project.badge}</span>
              <span className="casebook__period">{project.period}</span>
            </div>
            <h3>{project.tagline}</h3>
            <div>
              <div className="casebook__label">PROBLEM</div>
              <p className="casebook__text">{project.problem}</p>
            </div>
            <div>
              <div className="casebook__label">BUILT</div>
              <p className="casebook__text">{project.built}</p>
            </div>
            <div>
              <div className="casebook__label">MEASURED</div>
              <div className="casebook__metrics">
                {project.measured.map((metric) => (
                  <div key={metric.label} className="casebook__metric">
                    <b>{metric.value}</b>
                    <span>{metric.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="casebook__stack">
              {project.stack.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function WorkShelf() {
  const projects = SITE_CONTENT.projects;
  const [focus, setFocus] = useState(0);
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const openProject = useCallback((slug: string) => {
    setOpenSlug(slug);
    window.history.replaceState(null, '', `#work/${slug}`);
  }, []);

  const closeProject = useCallback(() => {
    setOpenSlug(null);
    window.history.replaceState(null, '', '#work');
  }, []);

  useEffect(() => {
    const applyHash = () => {
      const match = window.location.hash.match(/^#work\/([\w-]+)$/);
      if (match) {
        const index = projects.findIndex((p) => p.slug === match[1]);
        if (index >= 0) {
          setFocus(index);
          setOpenSlug(match[1]);
        }
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, [projects]);

  const step = (delta: number) => {
    setFocus((prev) => (prev + delta + projects.length) % projects.length);
  };

  const focused = projects[focus];
  const openProjectData = openSlug ? projects.find((p) => p.slug === openSlug) ?? null : null;

  return (
    <section className="work section-shell section-pad" id="work" aria-labelledby="work-title">
      <div className="section-head reveal">
        <div>
          <p className="eyebrow">CHAPTER 02 — THE WORK</p>
          <h2 id="work-title">
            Four real projects.
            <br />
            Open one.
          </h2>
        </div>
        <p className="receipts__note">
          Only shipped, verifiable work makes the shelf. Select a project and OPEN unfolds the full case study.
        </p>
      </div>

      <div className="shelf reveal">
        <div className="shelf__stage" role="listbox" aria-label="Projects" aria-activedescendant={`shelf-${focused.slug}`}>
          {projects.map((project, index) => {
            const tones = CARD_TONES[project.slug] ?? CARD_TONES.flashml;
            return (
              <div
                key={project.slug}
                id={`shelf-${project.slug}`}
                role="option"
                aria-selected={index === focus}
                tabIndex={0}
                className={`shelf-card${index === focus ? ' is-focused' : ''}`}
                style={
                  {
                    '--card-accent': project.accent,
                    '--card-hi': tones.hi,
                    '--card-lo': tones.lo
                  } as React.CSSProperties
                }
                onClick={() => (index === focus ? openProject(project.slug) : setFocus(index))}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    if (index === focus) openProject(project.slug);
                    else setFocus(index);
                  }
                }}
              >
                <span className="shelf-card__badge">{project.badge.split(' · ').slice(0, 2).join(' · ')}</span>
                {COVER_ART[project.slug]}
                <div className="shelf-card__meta">
                  <strong>{project.title}</strong>
                  <span>{project.stack.slice(0, 2).join(' · ')}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="shelf__caption">
          <span className="shelf__caption-index">
            {String(focus + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}
          </span>
          <span className="shelf__caption-title">{focused.title}</span>
          <span className="shelf__caption-desc">{focused.tagline}</span>
          <div className="shelf__controls">
            <button className="shelf__arrow" onClick={() => step(-1)} aria-label="Previous project">
              ‹
            </button>
            <button className="shelf__open" onClick={() => openProject(focused.slug)}>
              OPEN →
            </button>
            <button className="shelf__arrow" onClick={() => step(1)} aria-label="Next project">
              ›
            </button>
          </div>
          <div className="shelf__dashes" aria-hidden="true">
            {projects.map((project, index) => (
              <span key={project.slug} className={index === focus ? 'is-on' : ''} />
            ))}
          </div>
          <span className="shelf__hint">ARROWS · SELECT · OPEN</span>
        </div>
      </div>

      <CaseBook project={openProjectData} onClose={closeProject} />
    </section>
  );
}
