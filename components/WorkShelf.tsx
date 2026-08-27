'use client';

import { useCallback, useEffect, useState } from 'react';
import { SITE_CONTENT, type Project } from '@/lib/content';
import { useJourney } from '@/lib/journey';

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

/** compact "how it works" architecture diagrams, one per project */
function ArchBox({ x, y, w, label, accent }: { x: number; y: number; w: number; label: string; accent?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={22} rx={4} fill="rgba(10,14,10,.9)" stroke={accent ?? 'rgba(226,232,221,.3)'} strokeWidth={accent ? 1.6 : 1} />
      <text x={x + w / 2} y={y + 14.5} textAnchor="middle" className="arch-label" fill={accent ?? undefined}>
        {label}
      </text>
    </g>
  );
}

function Arrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 5;
  const tip = (a: number) => `${x2 - size * Math.cos(angle + a)},${y2 - size * Math.sin(angle + a)}`;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(155,225,93,.45)" strokeWidth={1.4} />
      <polygon points={`${x2},${y2} ${tip(0.5)} ${tip(-0.5)}`} fill="rgba(155,225,93,.6)" />
    </g>
  );
}

const ARCH_ART: Record<string, (accent: string) => React.ReactNode> = {
  flashml: (accent) => (
    <svg className="casebook__arch-svg" viewBox="0 0 340 96">
      <ArchBox x={4} y={37} w={58} label="SUBMIT" />
      <Arrow x1={62} y1={48} x2={86} y2={48} />
      <ArchBox x={88} y={37} w={62} label="QUEUE" accent={accent} />
      <Arrow x1={150} y1={44} x2={186} y2={16} />
      <Arrow x1={150} y1={48} x2={186} y2={48} />
      <Arrow x1={150} y1={52} x2={186} y2={80} />
      <ArchBox x={188} y={5} w={94} label="FAST · PULLS 61" accent={accent} />
      <ArchBox x={188} y={37} w={94} label="MID · PULLS 39" />
      <ArchBox x={188} y={69} w={94} label="DIES → RETURNS" />
      <Arrow x1={282} y1={48} x2={302} y2={48} />
      <ArchBox x={304} y={37} w={34} label="OUT" />
    </svg>
  ),
  'captain-ddoski': (accent) => (
    <svg className="casebook__arch-svg" viewBox="0 0 340 96">
      <ArchBox x={4} y={37} w={80} label="AGENT ACTION" />
      <Arrow x1={84} y1={48} x2={112} y2={48} />
      <ArchBox x={114} y={37} w={104} label="CREDIBILITY SCORE" accent={accent} />
      <Arrow x1={218} y1={44} x2={248} y2={20} />
      <Arrow x1={218} y1={52} x2={248} y2={76} />
      <ArchBox x={250} y={9} w={86} label="HIGH → AUTO" />
      <ArchBox x={250} y={65} w={86} label="LOW → HUMAN" accent={accent} />
    </svg>
  ),
  'on-device-qa': (accent) => (
    <svg className="casebook__arch-svg" viewBox="0 0 340 96">
      <ArchBox x={4} y={37} w={70} label="FLAN-T5" />
      <Arrow x1={74} y1={48} x2={102} y2={48} />
      <ArchBox x={104} y={37} w={98} label="ONNX + 14 VARIANTS" />
      <Arrow x1={202} y1={48} x2={230} y2={48} />
      <ArchBox x={232} y={37} w={104} label="ARM64 · 163MS" accent={accent} />
    </svg>
  ),
  'hospital-nav': (accent) => (
    <svg className="casebook__arch-svg" viewBox="0 0 340 96">
      <ArchBox x={4} y={37} w={82} label="147 KIOSKS" />
      <Arrow x1={86} y1={48} x2={114} y2={48} />
      <ArchBox x={116} y={37} w={110} label="EXPRESS / PRISMA" />
      <Arrow x1={226} y1={48} x2={254} y2={48} />
      <ArchBox x={256} y={37} w={80} label="A* ROUTE" accent={accent} />
    </svg>
  )
};

/**
 * Scroll thresholds within station 2 (the work chapter) at which the shelf
 * auto-advances to the next chip. The chapter is a tall track, so each
 * project gets a real stretch of scroll before the next one takes over.
 */
const WORK_THRESHOLDS = [0, 0.3, 0.48, 0.66] as const;

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
            {project.image ? (
              <div className="casebook__img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.image}
                  alt={`${project.title} repository card`}
                  onError={(event) => {
                    (event.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <span>AUTO IMAGE FROM GITHUB — REAL SCREENSHOTS COMING</span>
              </div>
            ) : (
              <div className="casebook__shot">
                [ REAL SCREENSHOT / DEMO GIF ]
                <br />
                coming from Phong
              </div>
            )}
            <div className="casebook__cover casebook__cover--compact">
              {COVER_ART[project.slug]}
              <span>{project.title}</span>
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
              <div className="casebook__label">HOW IT WORKS</div>
              <div className="casebook__arch">{ARCH_ART[project.slug]?.(project.accent)}</div>
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

/** the auto-opened case file that rides the sticky work stage — no OPEN click.
 *  All four render; `live` marks the scroll-focused one (desktop shows only it,
 *  small screens stack them all in normal flow). */
function InlineCase({ project, index, total, live }: { project: Project; index: number; total: number; live: boolean }) {
  return (
    <aside
      className={`work-case${live ? ' is-live' : ''}`}
      style={{ '--card-accent': project.accent } as React.CSSProperties}
      aria-label={`${project.title} case study`}
      data-lenis-prevent
    >
      <div className="casebook__meta">
        <span className="casebook__badge">{project.badge}</span>
        <span className="work-case__index">
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </div>
      <h3>{project.tagline}</h3>
      {/* one line of WHY — everything else is the diagram and the numbers */}
      <p className="casebook__text work-case__why">{project.problem}</p>
      <div className="casebook__arch">{ARCH_ART[project.slug]?.(project.accent)}</div>
      <div className="casebook__metrics">
        {project.measured.map((metric) => (
          <div key={metric.label} className="casebook__metric">
            <b>{metric.value}</b>
            <span>{metric.label}</span>
          </div>
        ))}
      </div>
      {project.links.length ? (
        <div className="work-case__links">
          {project.links.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
              ↗ {link.label}
            </a>
          ))}
        </div>
      ) : null}
    </aside>
  );
}

export default function WorkShelf() {
  const projects = SITE_CONTENT.projects;
  // the journey store is the single source of truth — the 3D chips write to it too
  const focus = useJourney((s) => s.workFocus);
  const openSlug = useJourney((s) => s.workOpen);
  const tier = useJourney((s) => s.tier);

  const openProject = useCallback(
    (slug: string) => {
      useJourney.getState().setWork(focus, slug);
      window.history.replaceState(null, '', `#work/${slug}`);
    },
    [focus]
  );

  const closeProject = useCallback(() => {
    useJourney.getState().setWork(useJourney.getState().workFocus, null);
    window.history.replaceState(null, '', '#work');
  }, []);

  useEffect(() => {
    const applyHash = () => {
      const match = window.location.hash.match(/^#work\/([\w-]+)$/);
      if (match) {
        const index = projects.findIndex((p) => p.slug === match[1]);
        if (index >= 0) {
          useJourney.getState().setWork(index, match[1]);
          // land the visitor at the scroll depth that DERIVES this project,
          // otherwise the scroll-driven focus would immediately clobber the
          // deep link back to the first chip
          const workEl = document.getElementById('work');
          const roadEl = document.getElementById('road');
          if (useJourney.getState().tier !== 'off' && workEl && roadEl) {
            const start = workEl.offsetTop - window.innerHeight * 0.35;
            const span = roadEl.offsetTop - workEl.offsetTop;
            window.scrollTo(0, Math.max(0, start + (WORK_THRESHOLDS[index] + 0.05) * span));
          } else {
            workEl?.scrollIntoView();
          }
        }
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, [projects]);

  // SCROLL-DRIVEN SHELF: focus is DERIVED from scroll position through the tall
  // work track (same pattern as the receipts vaults) — scrolling walks the chips
  // in order and each case file opens itself, no OPEN click required. Chip
  // clicks / arrow keys still override until the next threshold crossing.
  useEffect(() => {
    if (tier === 'off') return;
    let derived = -1;
    const update = () => {
      const state = useJourney.getState();
      const { station, localT } = state;
      let idx: number;
      if (station < 2) idx = 0;
      else if (station > 2) idx = projects.length - 1;
      else {
        idx = 0;
        WORK_THRESHOLDS.forEach((t, i) => {
          if (localT >= t && i < projects.length) idx = i;
        });
      }
      if (idx !== derived) {
        derived = idx;
        state.setWork(idx, state.workOpen);
      }
    };
    const unsubscribe = useJourney.subscribe(update);
    update();
    return () => unsubscribe();
  }, [tier, projects.length]);

  const step = useCallback(
    (delta: number) => {
      const state = useJourney.getState();
      state.setWork((state.workFocus + delta + projects.length) % projects.length, state.workOpen);
    },
    [projects.length]
  );

  // arrow keys browse the 3D shelf while the work chapter is on screen
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const { station, workOpen } = useJourney.getState();
      if (station !== 2 || workOpen) return;
      if (event.key === 'ArrowLeft') step(-1);
      else if (event.key === 'ArrowRight') step(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step]);

  const focused = projects[focus];
  const openProjectData = openSlug ? projects.find((p) => p.slug === openSlug) ?? null : null;

  return (
    <section
      className={`work section-shell${tier === 'off' ? ' section-pad' : ' work--track'}`}
      id="work"
      aria-labelledby="work-title"
    >
      <div className={tier === 'off' ? undefined : 'work__sticky'}>
      <div className="section-head reveal">
        <div>
          <p className="eyebrow">CHAPTER 02 — THE WORK</p>
          <h2 id="work-title">
            Four real projects.
            <br />
            {tier === 'off' ? 'Open one.' : 'They open themselves.'}
          </h2>
        </div>
        <p className="receipts__note text-scrim">
          {tier === 'off'
            ? 'Only shipped, verifiable work makes the shelf. Select a project and OPEN unfolds the full case study.'
            : 'Only shipped, verifiable work makes the shelf. Keep scrolling — each chip slides into focus and its case file opens on its own.'}
        </p>
      </div>

      <div className="shelf reveal">
        {tier === 'off' ? (
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
                onClick={() =>
                  index === focus
                    ? openProject(project.slug)
                    : useJourney.getState().setWork(index, null)
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    if (index === focus) openProject(project.slug);
                    else useJourney.getState().setWork(index, null);
                  }
                }}
              >
                <span className="shelf-card__badge">{project.badge.split(' · ').slice(0, 2).join(' · ')}</span>
                {project.image ? (
                  <div className="shelf-card__img">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={project.image}
                      alt=""
                      loading="lazy"
                      onError={(event) => {
                        (event.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  COVER_ART[project.slug]
                )}
                <div className="shelf-card__meta">
                  <strong>{project.title}</strong>
                  <span>{project.stack.slice(0, 2).join(' · ')}</span>
                </div>
              </div>
            );
          })}
        </div>
        ) : (
          <div className="work-stage">
            <div className="work-stage__window" aria-hidden="true">
              <b
                key={focused.slug}
                className="work-giant"
                style={{ '--org': focused.accent } as React.CSSProperties}
              >
                {focused.title}
              </b>
              <div className="shelf__dashes">
                {projects.map((project, index) => (
                  <span key={project.slug} className={index === focus ? 'is-on' : ''} />
                ))}
              </div>
              <span className="shelf__window-hint">SCROLL — THE SHELF TURNS ITSELF · ← → TO BROWSE</span>
            </div>
            <div className="work-cases">
              {projects.map((project, index) => (
                <InlineCase
                  key={project.slug}
                  project={project}
                  index={index}
                  total={projects.length}
                  live={index === focus}
                />
              ))}
            </div>
          </div>
        )}

        {tier === 'off' ? (
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
        ) : null}
      </div>
      </div>

      <CaseBook project={openProjectData} onClose={closeProject} />
    </section>
  );
}
