export function initNetworkCanvas() {
  const canvas = document.querySelector('#network-canvas');
  if (!canvas) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  const ctx = canvas.getContext('2d');
  const pointer = { x: window.innerWidth * .65, y: window.innerHeight * .35, active:false };
  let width = 0;
  let height = 0;
  let dpr = 1;
  let raf = 0;
  let visible = true;
  let nodes = [];

  const makeNodes = () => {
    const target = Math.max(44, Math.min(86, Math.floor(width / 18)));
    nodes = Array.from({ length: target }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - .5) * .22,
      vy: (Math.random() - .5) * .22,
      r: .7 + Math.random() * 1.2,
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

  const tick = (time) => {
    if (!visible) return;
    ctx.clearRect(0, 0, width, height);
    const scrollFactor = Math.min(1, window.scrollY / Math.max(1, height * 3));

    for (const node of nodes) {
      node.x += node.vx * (1 + scrollFactor * .25);
      node.y += node.vy;
      if (node.x < -30) node.x = width + 30;
      if (node.x > width + 30) node.x = -30;
      if (node.y < -30) node.y = height + 30;
      if (node.y > height + 30) node.y = -30;

      if (pointer.active) {
        const dx = pointer.x - node.x;
        const dy = pointer.y - node.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 150 && dist > .1) {
          const force = (150 - dist) / 150;
          node.x -= (dx / dist) * force * 1.35;
          node.y -= (dy / dist) * force * 1.35;
        }
      }

      const pulse = node.hot ? .55 + Math.sin(time * .0015 + node.phase) * .18 : .28;
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
          const alpha = (1 - dist / 118) * (a.hot || b.hot ? .16 : .075);
          ctx.beginPath();
          ctx.strokeStyle = a.hot || b.hot ? `rgba(155,225,93,${alpha})` : `rgba(222,228,216,${alpha})`;
          ctx.lineWidth = .7;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    raf = requestAnimationFrame(tick);
  };

  resize();
  raf = requestAnimationFrame(tick);
  window.addEventListener('resize', resize, { passive:true });
  window.addEventListener('pointermove', (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  }, { passive:true });
  window.addEventListener('pointerleave', () => { pointer.active = false; }, { passive:true });
  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    if (visible) raf = requestAnimationFrame(tick);
    else cancelAnimationFrame(raf);
  });
}
