import { SITE_CONTENT } from './content.js';
import { affiliationMarkup, escapeHtml, linkDescriptor, projectLinkDescriptor } from './render.js';
import { runBootSequence } from './boot.js';
import { initNetworkCanvas } from './network.js';
import { initScrollScenes } from './scroll.js';
import { initInteractions } from './interactions.js';

function iconLinkHTML(descriptor, text = descriptor.label) {
  const cls = descriptor.enabled ? 'icon-link magnetic' : 'icon-link is-disabled';
  const href = descriptor.enabled ? ` href="${escapeHtml(descriptor.url)}" target="_blank" rel="noreferrer"` : '';
  return `<a class="${cls}"${href} aria-label="${escapeHtml(descriptor.label)}${descriptor.enabled ? '' : ' — link not configured'}">
    <img src="${escapeHtml(descriptor.icon)}" alt="" aria-hidden="true"><span>${escapeHtml(text)}</span>
  </a>`;
}

function renderHero() {
  document.querySelector('#hero-eyebrow').textContent = SITE_CONTENT.hero.eyebrow;
  document.querySelector('#hero-subhead').textContent = SITE_CONTENT.hero.subhead;
  document.querySelector('#hero-identity').innerHTML = SITE_CONTENT.hero.identity
    .map((item) => `<span class="identity-chip">${escapeHtml(item)}</span>`).join('');

  const actions = [
    linkDescriptor('GitHub', SITE_CONTENT.links.github, './assets/icons/github.svg'),
    linkDescriptor('LinkedIn', SITE_CONTENT.links.linkedin, './assets/icons/linkedin.svg'),
    linkDescriptor('Resume', SITE_CONTENT.links.resume, './assets/icons/resume.svg'),
    linkDescriptor('Email', SITE_CONTENT.links.email, './assets/icons/mail.svg')
  ];
  const markup = actions.map((item) => iconLinkHTML(item)).join('');
  document.querySelector('#hero-actions').innerHTML = markup;
  document.querySelector('#contact-links').innerHTML = markup;
}

function renderAffiliations() {
  const once = SITE_CONTENT.affiliations.map(affiliationMarkup).join('');
  document.querySelector('#affiliation-track').innerHTML = once + once;
}

function renderNumbers() {
  document.querySelector('#numbers-grid').innerHTML = SITE_CONTENT.numbers.map((item) => `
    <article class="number-card reveal">
      <b>${escapeHtml(item.value)}</b>
      <span>${escapeHtml(item.label)}</span>
    </article>`).join('');
}

function renderFocus() {
  document.querySelector('#focus-eyebrow').textContent = `02 / ${SITE_CONTENT.focus.eyebrow}`;
  document.querySelector('#focus-body').textContent = SITE_CONTENT.focus.body;
  document.querySelector('#focus-end').textContent = SITE_CONTENT.focus.end;
  document.querySelector('#focus-tags').innerHTML = SITE_CONTENT.focus.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('');
}

function renderProjects() {
  document.querySelector('#work-list').innerHTML = SITE_CONTENT.projects.map((project) => {
    const link = projectLinkDescriptor(project);
    const tag = link ? 'a' : 'div';
    const attrs = link ? ` href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer"` : '';
    return `<${tag} class="work-row reveal${link ? '' : ' is-static'}"${attrs}>
      <span class="work-row__num">${escapeHtml(project.number)}</span>
      <strong class="work-row__title">${escapeHtml(project.title)}</strong>
      <span class="work-row__desc">${escapeHtml(project.description)}</span>
      <span class="work-row__recognition"><img src="${escapeHtml(project.marker)}" alt="" aria-hidden="true">${escapeHtml(project.recognition)}</span>
      <span class="work-row__link">${link ? `${escapeHtml(link.label)} ↗` : 'DETAILS'}</span>
    </${tag}>`;
  }).join('');
}

function renderWins() {
  document.querySelector('#wins-rail').innerHTML = SITE_CONTENT.wins.map((win) => `
    <article class="win-item reveal">
      <div class="win-item__year">${escapeHtml(win.year)}</div>
      <div class="win-item__org"><img src="${escapeHtml(win.marker)}" alt="" aria-hidden="true"><strong>${escapeHtml(win.org)}</strong></div>
      <div class="win-item__placement">${escapeHtml(win.placement)}</div>
      <div class="win-item__project">${escapeHtml(win.project)}</div>
    </article>`).join('');
}

function renderResearch() {
  document.querySelector('#research-body').textContent = SITE_CONTENT.research.body;
  document.querySelector('#research-metrics').innerHTML = SITE_CONTENT.research.metrics.map((metric) => `
    <div class="research-metric"><b>${escapeHtml(metric.value)}</b><span>${escapeHtml(metric.label)}</span></div>`).join('');
}

function renderExperience() {
  document.querySelector('#experience-list').innerHTML = SITE_CONTENT.experience.map((item) => `
    <article class="experience-row reveal">
      <div class="experience-row__when">${escapeHtml(item.when)}</div>
      <img src="${escapeHtml(item.marker)}" alt="" aria-hidden="true">
      <div class="experience-row__org">${escapeHtml(item.org)}</div>
      <div class="experience-row__role">${escapeHtml(item.role)}</div>
    </article>`).join('');
}

function renderEducation() {
  document.querySelector('#education-mark').innerHTML = `<img src="${escapeHtml(SITE_CONTENT.education.marker)}" alt="WPI">`;
  document.querySelector('#education-degree').textContent = SITE_CONTENT.education.degree;
}

function initWordCycle() {
  const el = document.querySelector('#hero-scramble');
  const words = ['systems', 'infra', 'models', 'tools'];
  const chars = '01<>[]{}#/\\*+=';
  let wordIndex = 0;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  window.setInterval(() => {
    wordIndex = (wordIndex + 1) % words.length;
    const target = words[wordIndex];
    const length = Math.max(el.textContent.length, target.length);
    let frame = 0;
    const total = 18;
    const timer = window.setInterval(() => {
      let out = '';
      for (let i = 0; i < length; i += 1) {
        if (i / length < frame / total) out += target[i] ?? '';
        else out += chars[Math.floor(Math.random() * chars.length)];
      }
      el.textContent = out;
      frame += 1;
      if (frame > total) {
        window.clearInterval(timer);
        el.textContent = target;
      }
    }, 28);
  }, 3000);
}

function renderAll() {
  renderHero();
  renderAffiliations();
  renderNumbers();
  renderFocus();
  renderProjects();
  renderWins();
  renderResearch();
  renderExperience();
  renderEducation();
}

async function start() {
  renderAll();
  await runBootSequence();
  initNetworkCanvas();
  initScrollScenes();
  initInteractions();
  initWordCycle();
}

start();
