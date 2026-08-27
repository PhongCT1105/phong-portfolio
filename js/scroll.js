import { clamp01 } from './utils.js';
import { sceneState } from './scroll-model.js';

function progressForSection(section) {
  const rect = section.getBoundingClientRect();
  const total = Math.max(1, section.offsetHeight - window.innerHeight);
  return clamp01((-rect.top) / total);
}

function initReveals() {
  const items = [...document.querySelectorAll('.reveal')];
  if (!items.length) return;
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    }
  }, { threshold:.12, rootMargin:'0px 0px -5% 0px' });
  items.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 4, 3) * 55}ms`;
    observer.observe(item);
  });
}

function initFocusScene() {
  const section = document.querySelector('#focus');
  const stageLabel = document.querySelector('#focus-stage-label');
  const bandwidthFill = document.querySelector('#bandwidth-fill');
  const nodes = [...document.querySelectorAll('.gpu-node')];
  if (!section) return;

  const update = () => {
    const state = sceneState(progressForSection(section));
    section.dataset.stage = String(state.stage);
    stageLabel.textContent = state.label;
    bandwidthFill.style.width = `${state.bandwidth}%`;
    nodes.forEach((node, i) => {
      const delta = [0, -4, -10, -15, -7][i] ?? 0;
      const value = Math.max(18, state.utilization + delta);
      const valueEl = node.querySelector('b');
      if (valueEl) valueEl.textContent = `${value}%`;
      node.style.setProperty('--utilization', `${value}%`);
    });
  };
  update();
  window.addEventListener('scroll', update, { passive:true });
  window.addEventListener('resize', update, { passive:true });
}

function initWinsRail() {
  const rail = document.querySelector('#wins-rail');
  if (!rail) return;
  const items = [...rail.querySelectorAll('.win-item')];
  const update = () => {
    const rect = rail.getBoundingClientRect();
    const target = window.innerHeight * .68;
    const progress = clamp01((target - rect.top) / Math.max(1, rect.height * .9));
    rail.style.setProperty('--rail-progress', `${progress * 100}%`);
    items.forEach((item) => {
      const r = item.getBoundingClientRect();
      item.classList.toggle('is-active', r.top < target && r.bottom > window.innerHeight * .15);
    });
  };
  update();
  window.addEventListener('scroll', update, { passive:true });
}

function initNavState() {
  const nav = document.querySelector('#site-nav');
  const update = () => nav?.classList.toggle('is-scrolled', window.scrollY > 24);
  update();
  window.addEventListener('scroll', update, { passive:true });
}

export function initScrollScenes() {
  initReveals();
  initFocusScene();
  initWinsRail();
  initNavState();
}
