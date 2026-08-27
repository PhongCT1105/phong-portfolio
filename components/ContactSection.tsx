'use client';

import { useEffect, useRef, useState } from 'react';
import { getOrCreateSessionId, prefersReducedMotion } from '@/lib/session';
import IconLinks from '@/components/IconLinks';

const TERMINAL_LINES = [
  'connect',
  'build → benchmark → repeat',
  'distributed systems / applied AI',
  'shipping > talking'
];

export default function ContactSection() {
  const cycleRef = useRef<HTMLSpanElement>(null);
  const [sessionId, setSessionId] = useState('------');

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  useEffect(() => {
    const el = cycleRef.current;
    if (!el || prefersReducedMotion()) return;
    let index = 0;
    const interval = window.setInterval(() => {
      index = (index + 1) % TERMINAL_LINES.length;
      el.animate([{ opacity: 1 }, { opacity: 0 }, { opacity: 1 }], {
        duration: 430,
        easing: 'ease-out'
      });
      window.setTimeout(() => {
        el.textContent = TERMINAL_LINES[index];
      }, 205);
    }, 3200);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <footer className="contact section-shell" id="contact">
      <div className="contact__terminal reveal">
        <p>
          <span className="terminal-prompt">phong@systems:~$</span>{' '}
          <span ref={cycleRef}>connect</span>
          <i className="terminal-caret" />
        </p>
        <div className="contact__status">
          <span>
            SESSION <b>{sessionId}</b>
          </span>
          <span>
            <i className="status-dot" /> CONNECTION ACTIVE
          </span>
        </div>
      </div>
      <div className="contact__links">
        <IconLinks />
      </div>
      <div className="contact__foot">
        <span>© {new Date().getFullYear()} Phong Cao</span>
        <span>Next.js · TypeScript · Vercel</span>
      </div>
    </footer>
  );
}
