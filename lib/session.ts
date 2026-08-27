const SESSION_KEY = 'phong.systems.session';
export const BOOT_KEY = 'phong.systems.booted';

export function makeSessionId(randomFn: () => number = Math.random): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i += 1) {
    out += alphabet[Math.floor(randomFn() * alphabet.length) % alphabet.length];
  }
  return out;
}

export function getOrCreateSessionId(): string {
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = makeSessionId();
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return makeSessionId();
  }
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

const FOCUS_STATES = [
  { label: 'AVAILABLE', utilization: 96, bandwidth: 100 },
  { label: 'CONNECTING', utilization: 92, bandwidth: 88 },
  { label: 'COMMUNICATING', utilization: 82, bandwidth: 74 },
  { label: 'CONGESTED', utilization: 58, bandwidth: 34 },
  { label: 'WAITING', utilization: 34, bandwidth: 22 }
] as const;

export function focusStage(progress: number): number {
  const p = clamp01(progress);
  if (p < 0.2) return 0;
  if (p < 0.42) return 1;
  if (p < 0.64) return 2;
  if (p < 0.82) return 3;
  return 4;
}

export function sceneState(progress: number) {
  const stage = focusStage(progress);
  return { stage, ...FOCUS_STATES[stage] };
}
