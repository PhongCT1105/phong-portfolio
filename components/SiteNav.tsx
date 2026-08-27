'use client';

import { useEffect, useState } from 'react';

export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <header className={`site-nav${scrolled ? ' is-scrolled' : ''}`}>
      <a className="site-nav__brand magnetic" href="#phong" aria-label="Phong Cao home">
        <span className="status-dot" />
        PHONG.CAO / SYSTEMS
      </a>
      <nav className="site-nav__links" aria-label="Primary navigation">
        <a href="#phong">Phong</a>
        <a href="#focus">Focus</a>
        <a href="#work">Work</a>
        <a href="#wins">Wins</a>
        <a href="#research">Research</a>
        <a className="nav-cta magnetic" href="#contact">
          Connect ↗
        </a>
      </nav>
    </header>
  );
}
