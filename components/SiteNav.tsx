'use client';

import { useCallback, useEffect, useState } from 'react';
import { railScrollTo } from '@/components/SmoothScroll';

export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

  // nav rides the scroll rail: the city keeps travelling under the camera
  // instead of teleporting a chapter ahead.
  const onNavClick = useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    const href = event.currentTarget.getAttribute('href');
    if (!href?.startsWith('#')) return;
    const el = document.getElementById(href.slice(1));
    if (!el) return;
    event.preventDefault();
    railScrollTo(el);
    window.history.replaceState(null, '', href);
  }, []);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <header className={`site-nav${scrolled ? ' is-scrolled' : ''}`}>
      <a className="site-nav__brand magnetic" href="#phong" aria-label="Phong Cao home" onClick={onNavClick}>
        <span className="status-dot" />
        PHONG.CAO / SYSTEMS
      </a>
      <nav className="site-nav__links" aria-label="Primary navigation">
        <a href="#receipts" onClick={onNavClick}>
          01 Receipts
        </a>
        <a href="#work" onClick={onNavClick}>
          02 Work
        </a>
        <a href="#road" onClick={onNavClick}>
          03 Road
        </a>
        <a href="#now" onClick={onNavClick}>
          04 Now
        </a>
        <a className="nav-cta magnetic" href="#contact" onClick={onNavClick}>
          Connect ↗
        </a>
      </nav>
    </header>
  );
}
