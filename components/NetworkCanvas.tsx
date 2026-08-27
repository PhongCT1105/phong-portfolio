'use client';

import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '@/lib/session';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
  hot: boolean;
}

export default function NetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion()) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pointer = { x: window.innerWidth * 0.65, y: window.innerHeight * 0.35, active: false };
    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let visible = true;
    let nodes: Node[] = [];

    const makeNodes = () => {
      const target = Math.max(44, Math.min(86, Math.floor(width / 18)));
      nodes = Array.from({ length: target }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: 0.7 + Math.random() * 1.2,
        phase: Math.random() * Math.PI * 2,
        hot: i % 9 === 0
      }));
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeNodes();
    };

    const tick = (time: number) => {
      if (!visible) return;
      ctx.clearRect(0, 0, width, height);
      const scrollFactor = Math.min(1, window.scrollY / Math.max(1, height * 3));

      for (const node of nodes) {
        node.x += node.vx * (1 + scrollFactor * 0.25);
        node.y += node.vy;
        if (node.x < -30) node.x = width + 30;
        if (node.x > width + 30) node.x = -30;
        if (node.y < -30) node.y = height + 30;
        if (node.y > height + 30) node.y = -30;

        if (pointer.active) {
          const dx = pointer.x - node.x;
          const dy = pointer.y - node.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 150 && dist > 0.1) {
            const force = (150 - dist) / 150;
            node.x -= (dx / dist) * force * 1.35;
            node.y -= (dy / dist) * force * 1.35;
          }
        }

        const pulse = node.hot ? 0.55 + Math.sin(time * 0.0015 + node.phase) * 0.18 : 0.28;
        ctx.beginPath();
        ctx.fillStyle = node.hot ? `rgba(155,225,93,${pulse})` : `rgba(222,228,216,${pulse})`;
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 118) {
            const alpha = (1 - dist / 118) * (a.hot || b.hot ? 0.16 : 0.075);
            ctx.beginPath();
            ctx.strokeStyle = a.hot || b.hot ? `rgba(155,225,93,${alpha})` : `rgba(222,228,216,${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    };
    const onPointerLeave = () => {
      pointer.active = false;
    };
    const onVisibility = () => {
      visible = !document.hidden;
      if (visible) raf = requestAnimationFrame(tick);
      else cancelAnimationFrame(raf);
    };

    resize();
    raf = requestAnimationFrame(tick);
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="network-canvas" aria-hidden="true" />;
}
