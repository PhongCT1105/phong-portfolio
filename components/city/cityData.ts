import * as THREE from 'three';

export interface Tower {
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
  /** 0 = downtown (brightest), 1 = district, 2 = outskirts */
  tier: 0 | 1 | 2;
  /** which window-texture variant */
  variant: number;
  /** y-rotation (0 or 90°) — varies facade orientation so blocks don't repeat */
  rot: number;
  crown?: { w: number; h: number; d: number };
  /** wider low base under the tower — podium + tower composition */
  podium?: { w: number; h: number; d: number };
}

export const WORLD_W = 560;
export const WORLD_D = 480;
export const DOWNTOWN = { x: 35, z: 10, r: 55 };

/** district centers used for avenues + later milestones */
export const DISTRICTS = {
  downtown: [35, 10],
  vaults: [115, -25],
  fab: [175, -85],
  avenueEnd: [-45, -95],
  scheduler: [-135, 5]
} as const;

/** ground avenues (world-space segments) — the city's data-bus roads */
export const AVENUES: [number, number, number, number][] = [
  [35, 10, 115, -25],
  [115, -25, 175, -85],
  [175, -85, 55, -95],
  [55, -95, -45, -95],
  [-45, -95, -135, 5],
  [-135, 5, 35, 10]
];

function mulberry(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const HERO_TOWERS: Tower[] = [
  { x: 38, z: 8, w: 9, h: 22, d: 9, tier: 0, variant: 0, rot: 0, crown: { w: 5.5, h: 3.5, d: 5.5 }, podium: { w: 14, h: 2.6, d: 14 } },
  { x: 52, z: 22, w: 8, h: 19, d: 8, tier: 0, variant: 1, rot: 0, podium: { w: 12.5, h: 2.2, d: 12.5 } },
  { x: 24, z: 26, w: 7, h: 18, d: 7, tier: 0, variant: 2, rot: 0, crown: { w: 4, h: 2.5, d: 4 } }
];

function nearAvenue(x: number, z: number, margin: number): boolean {
  for (const [ax, az, bx, bz] of AVENUES) {
    const abx = bx - ax;
    const abz = bz - az;
    const len2 = abx * abx + abz * abz;
    const t = Math.max(0, Math.min(1, ((x - ax) * abx + (z - az) * abz) / len2));
    const px = ax + abx * t;
    const pz = az + abz * t;
    if (Math.hypot(x - px, z - pz) < margin) return true;
  }
  return false;
}

/** Deterministic city. G1: log-normal-ish heights, downtown spike, varied footprints. */
export function generateTowers(density = 1): Tower[] {
  const rand = mulberry(20260828);
  const towers: Tower[] = [...HERO_TOWERS];
  const CELL = 16;
  for (let gx = -Math.floor(WORLD_W / 2 / CELL); gx * CELL < WORLD_W / 2; gx += 1) {
    for (let gz = -Math.floor(WORLD_D / 2 / CELL); gz * CELL < WORLD_D / 2; gz += 1) {
      const roll = rand();
      const cx = gx * CELL;
      const cz = gz * CELL;
      // mid-field low-rise fill near the rail (M7 guidance): denser, capped low
      const nearRailMid = cx > -130 && cx < 50 && cz > -150 && cz < -30;
      if (roll > (nearRailMid ? 0.68 : 0.5) * density) continue;
      if (nearAvenue(cx, cz, 7)) continue;
      // memory-quarter plaza + approach corridor — keep clear for the M4 vaults
      if (cx > 80 && cx < 174 && cz > -70 && cz < 36) continue;
      // fab hall plaza + sightline corridor from the work camera — M5 assembly hall
      if (cx > 136 && cx < 206 && cz > -84 && cz < -18) continue;
      if (cx > 160 && cx < 232 && cz > -164 && cz < -92) continue;
      // scheduler hall plaza + sightline from the now-station camera
      if (cx > -168 && cx < -102 && cz > -30 && cz < 40) continue;
      const dDown = Math.hypot(cx - DOWNTOWN.x, cz - DOWNTOWN.z);
      const downtown = dDown < DOWNTOWN.r;
      if (downtown && Math.hypot(cx - 38, cz - 8) < 14) continue; // hero tower plaza

      const r = rand();
      let h: number;
      if (r < 0.65) h = 2 + rand() * 3;
      else if (r < 0.93) h = 5 + rand() * 4;
      else h = 10 + rand() * 6;
      if (downtown) h *= 1.35 + rand() * 0.4;
      if (nearRailMid) h = Math.min(h, 5.5); // low-rise tier only near the rail

      const w = 4 + rand() * 6;
      const d = 4 + rand() * 6;
      const x = cx + (rand() - 0.5) * (CELL - w - 3);
      const z = cz + (rand() - 0.5) * (CELL - d - 3);
      const tier: 0 | 1 | 2 = downtown ? 0 : dDown < 150 ? 1 : 2;
      const tower: Tower = {
        x,
        z,
        w,
        h,
        d,
        tier,
        variant: Math.floor(rand() * 5),
        rot: rand() > 0.5 ? Math.PI / 2 : 0
      };
      if (h > 11 && rand() > 0.72) tower.crown = { w: w * 0.55, h: 1.5 + rand() * 2, d: d * 0.55 };
      // ~1 in 4 mid/tall buildings get a wider podium base — real-city massing
      if (h > 7 && rand() > 0.74) {
        tower.podium = { w: w * 1.55, h: 1.6 + rand() * 1.4, d: d * 1.55 };
      }
      towers.push(tower);
    }
  }
  return towers;
}

export interface Crane {
  x: number;
  z: number;
  h: number;
  arm: number;
  rotY: number;
}

export const CRANES: Crane[] = [
  { x: 70, z: -6, h: 16, arm: 11, rotY: 0.7 },
  { x: 12, z: 40, h: 13, arm: 9, rotY: -1.9 }
];

export const IDENTITY_QUAT = new THREE.Quaternion();
