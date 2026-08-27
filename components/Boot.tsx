'use client';

import { useEffect, useRef, useState } from 'react';
import { BOOT_KEY, getOrCreateSessionId, prefersReducedMotion } from '@/lib/session';

type LogLine = { text: string; cls: string; dots?: boolean };

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export default function Boot() {
  const [done, setDone] = useState(false);
  const [lines, setLines] = useState<LogLine[]>([]);
  const [meter, setMeter] = useState(0);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    let cancelled = false;

    const run = async () => {
      const sessionId = getOrCreateSessionId();
      const already = window.sessionStorage.getItem(BOOT_KEY) === '1';

      if (prefersReducedMotion()) {
        setDone(true);
        window.dispatchEvent(new Event('phong:booted'));
        return;
      }

      document.body.classList.add('is-booting');

      if (already) {
        setLines([{ text: `SESSION ${sessionId} · CONNECTED`, cls: 'ok' }]);
        setMeter(100);
        await sleep(260);
      } else {
        const script: LogLine[] = [
          { text: 'ESTABLISHING CONNECTION', cls: '', dots: true },
          { text: `SESSION ${sessionId}`, cls: 'ok' },
          { text: 'AI INFRASTRUCTURE', cls: '' },
          { text: 'DISTRIBUTED SYSTEMS', cls: '' },
          { text: '10× BUILDER', cls: '' },
          { text: 'CONNECTED', cls: 'ok' }
        ];
        for (let i = 0; i < script.length; i += 1) {
          if (cancelled) return;
          setLines(script.slice(0, i + 1));
          setMeter(Math.round(((i + 1) / script.length) * 100));
          await sleep(i === 0 ? 360 : 235);
        }
        await sleep(250);
      }

      if (cancelled) return;
      window.sessionStorage.setItem(BOOT_KEY, '1');
      setDone(true);
      document.body.classList.remove('is-booting');
      window.dispatchEvent(new Event('phong:booted'));
    };

    run();
    return () => {
      cancelled = true;
      document.body.classList.remove('is-booting');
    };
  }, []);

  return (
    <div className={`boot${done ? ' is-done' : ''}`} aria-hidden="true">
      <div className="boot__grid" aria-hidden="true" />
      <div className="boot__panel">
        <p className="boot__brand">PHONG.SYSTEMS</p>
        <div className="boot__log">
          {lines.map((line, i) => (
            <div key={i} className={line.cls}>
              {line.text}
              {line.dots ? <span className="boot-dots">...</span> : null}
            </div>
          ))}
        </div>
        <div className="boot__meter" aria-hidden="true">
          <span style={{ width: `${meter}%` }} />
        </div>
      </div>
    </div>
  );
}
