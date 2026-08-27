'use client';

import { useEffect } from 'react';
import { prefersReducedMotion } from '@/lib/session';

function initReveals(): (() => void) | undefined {
  const items = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
  if (!items.length) return;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -5% 0px' }
  );
  items.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 4, 3) * 55}ms`;
    observer.observe(item);
  });
  return () => observer.disconnect();
}

function initTilt(): (() => void) | undefined {
  if (window.matchMedia('(pointer: coarse)').matches || prefersReducedMotion()) return;
  const cleanups: (() => void)[] = [];
  document.querySelectorAll<HTMLElement>('.tilt-card').forEach((card) => {
    const onMove = (event: PointerEvent) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(1100px) rotateX(${y * -3.2}deg) rotateY(${x * 4}deg) translateY(-2px)`;
    };
    const onLeave = () => {
      card.style.transform = '';
    };
    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerleave', onLeave);
    cleanups.push(() => {
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerleave', onLeave);
    });
  });
  return () => cleanups.forEach((fn) => fn());
}

function initMagnetic(): (() => void) | undefined {
  if (window.matchMedia('(pointer: coarse)').matches || prefersReducedMotion()) return;
  const cleanups: (() => void)[] = [];
  document.querySelectorAll<HTMLElement>('.magnetic').forEach((el) => {
    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
    };
    const onLeave = () => {
      el.style.transform = '';
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    cleanups.push(() => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    });
  });
  return () => cleanups.forEach((fn) => fn());
}

export default function Effects() {
  useEffect(() => {
    let cleanups: (undefined | (() => void))[] = [];
    let booted = false;

    const start = () => {
      if (booted) return;
      booted = true;
      cleanups = [initReveals(), initTilt(), initMagnetic()];
    };

    // Wait for the boot overlay so reveal animations don't play behind it.
    window.addEventListener('phong:booted', start, { once: true });
    const fallback = window.setTimeout(start, 3500);

    return () => {
      window.removeEventListener('phong:booted', start);
      window.clearTimeout(fallback);
      cleanups.forEach((fn) => fn?.());
    };
  }, []);

  return null;
}
