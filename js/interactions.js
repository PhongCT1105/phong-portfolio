function initCursor() {
  const cursor = document.querySelector('#cursor-orbit');
  if (!cursor || window.matchMedia('(pointer: coarse)').matches) return;
  const move = (event) => {
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
  };
  window.addEventListener('pointermove', move, { passive:true });
  document.querySelectorAll('a,.tilt-card,.work-row,.affiliation-item').forEach((el) => {
    el.addEventListener('pointerenter', () => cursor.classList.add('is-hot'));
    el.addEventListener('pointerleave', () => cursor.classList.remove('is-hot'));
  });
}

function initTilt() {
  if (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.tilt-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      card.style.transform = `perspective(1100px) rotateX(${y * -3.2}deg) rotateY(${x * 4}deg) translateY(-2px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

function initMagnetic() {
  if (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.magnetic').forEach((el) => {
    el.addEventListener('pointermove', (event) => {
      const rect = el.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * .12}px, ${y * .12}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

function initTerminalCycle() {
  const el = document.querySelector('#terminal-cycle');
  if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const lines = ['connect', 'build → benchmark → repeat', 'distributed systems / applied AI', 'shipping > talking'];
  let index = 0;
  window.setInterval(() => {
    index = (index + 1) % lines.length;
    el.animate([{ opacity:1 }, { opacity:0 }, { opacity:1 }], { duration:430, easing:'ease-out' });
    window.setTimeout(() => { el.textContent = lines[index]; }, 205);
  }, 3200);
}

export function initInteractions() {
  initCursor();
  initTilt();
  initMagnetic();
  initTerminalCycle();
}
