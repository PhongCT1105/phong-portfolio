'use client';

import { useEffect, useRef } from 'react';

export default function CursorOrbit() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor || window.matchMedia('(pointer: coarse)').matches) return;

    const move = (event: PointerEvent) => {
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
    };
    const heat = () => cursor.classList.add('is-hot');
    const cool = () => cursor.classList.remove('is-hot');

    window.addEventListener('pointermove', move, { passive: true });
    const targets = document.querySelectorAll('a,.tilt-card,.work-row,.affiliation-item');
    targets.forEach((el) => {
      el.addEventListener('pointerenter', heat);
      el.addEventListener('pointerleave', cool);
    });

    return () => {
      window.removeEventListener('pointermove', move);
      targets.forEach((el) => {
        el.removeEventListener('pointerenter', heat);
        el.removeEventListener('pointerleave', cool);
      });
    };
  }, []);

  return <div ref={cursorRef} className="cursor-orbit" aria-hidden="true" />;
}
