export function makeSessionId(randomFn = Math.random) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i += 1) {
    out += alphabet[Math.floor(randomFn() * alphabet.length) % alphabet.length];
  }
  return out;
}

export function isSafeExternalUrl(value) {
  if (!value || typeof value !== 'string') return false;
  try {
    const url = new URL(value, 'https://portfolio.local');
    return ['https:', 'http:', 'mailto:'].includes(url.protocol) && !value.trim().startsWith('#');
  } catch {
    return false;
  }
}

export function formatRelationshipLabel(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

export function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

export function focusStage(progress) {
  const p = clamp01(progress);
  if (p < 0.2) return 0;
  if (p < 0.42) return 1;
  if (p < 0.64) return 2;
  if (p < 0.82) return 3;
  return 4;
}
