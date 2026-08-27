import { formatRelationshipLabel, isSafeExternalUrl } from './utils.js';

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function linkDescriptor(label, url, icon) {
  return {
    enabled: isSafeExternalUrl(url),
    label,
    url: isSafeExternalUrl(url) ? url : '',
    icon
  };
}

export function affiliationMarkup(item) {
  const image = item.asset || item.icon;
  const protectedClass = item.asset ? '' : ' affiliation-item--protected';
  return `<div class="affiliation-item${protectedClass}">
    <img src="${escapeHtml(image)}" alt="${escapeHtml(item.name)} — ${escapeHtml(item.relationship)}" loading="lazy">
    <div class="affiliation-item__text">
      <strong>${escapeHtml(item.name)}</strong>
      <span>${escapeHtml(formatRelationshipLabel(item.relationship))}</span>
    </div>
  </div>`;
}

export function projectLinkDescriptor(project) {
  const first = project.links.find((link) => isSafeExternalUrl(link.url));
  return first ?? null;
}
