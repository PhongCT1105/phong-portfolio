import { makeSessionId } from './utils.js';

const BOOT_KEY = 'phong.systems.booted';
const SESSION_KEY = 'phong.systems.session';

export function bootMode(alreadyBooted, reducedMotion) {
  if (reducedMotion) return 'instant';
  return alreadyBooted ? 'fast' : 'full';
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function getOrCreateSessionId(storage = window.sessionStorage) {
  let id = storage.getItem(SESSION_KEY);
  if (!id) {
    id = makeSessionId();
    storage.setItem(SESSION_KEY, id);
  }
  return id;
}

export async function runBootSequence() {
  const boot = document.querySelector('#boot');
  const log = document.querySelector('#boot-log');
  const meter = document.querySelector('#boot-meter');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const already = window.sessionStorage.getItem(BOOT_KEY) === '1';
  const mode = bootMode(already, reduced);
  const sessionId = getOrCreateSessionId();

  document.querySelector('#hero-session').textContent = sessionId;
  document.querySelector('#footer-session').textContent = sessionId;

  if (!boot || mode === 'instant') {
    boot?.classList.add('is-done');
    return sessionId;
  }

  document.body.classList.add('is-booting');
  const lines = [
    ['ESTABLISHING CONNECTION', ''],
    [`SESSION ${sessionId}`, 'ok'],
    ['AI INFRASTRUCTURE', ''],
    ['DISTRIBUTED SYSTEMS', ''],
    ['10× BUILDER', ''],
    ['CONNECTED', 'ok']
  ];

  if (mode === 'fast') {
    log.innerHTML = `<span class="ok">SESSION ${sessionId} · CONNECTED</span>`;
    meter.style.width = '100%';
    await sleep(260);
  } else {
    let rendered = '';
    for (let i = 0; i < lines.length; i += 1) {
      const [text, cls] = lines[i];
      rendered += `<div class="${cls}">${text}${i === 0 ? '<span class="boot-dots">...</span>' : ''}</div>`;
      log.innerHTML = rendered;
      meter.style.width = `${Math.round(((i + 1) / lines.length) * 100)}%`;
      await sleep(i === 0 ? 360 : 235);
    }
    await sleep(250);
  }

  window.sessionStorage.setItem(BOOT_KEY, '1');
  boot.classList.add('is-done');
  document.body.classList.remove('is-booting');
  return sessionId;
}
