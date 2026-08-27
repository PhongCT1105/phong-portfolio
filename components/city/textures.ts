import * as THREE from 'three';
import { AVENUES, WORLD_D, WORLD_W, type Tower } from '@/components/city/cityData';

function mulberry(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * G2: window texture — dark facade, 15–25% windows lit, ~70% warm white / 30% pale green.
 * Several variants so neighboring towers don't repeat.
 */
export function makeWindowTexture(seed: number, litProb = 0.2): THREE.CanvasTexture {
  const rand = mulberry(seed);
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size * 2;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#050805';
  ctx.fillRect(0, 0, size, size * 2);
  const cell = 10;
  const win = 5;
  for (let y = 4; y < size * 2 - cell; y += cell) {
    for (let x = 4; x < size - cell; x += cell) {
      if (rand() > litProb) continue;
      const warm = rand() < 0.7;
      const bright = 0.55 + rand() * 0.45;
      ctx.fillStyle = warm
        ? `rgba(255, 233, 196, ${bright})`
        : `rgba(158, 255, 192, ${bright})`;
      ctx.fillRect(x, y, win, win + 2);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** G5: rooftop signage — canvas text, the brightest emissive in the scene. */
export function makeSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = '700 108px "JetBrains Mono", Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f4fff0';
  ctx.fillText('PHONG CAO', 512, 84);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** M5: chip top-face trace inlay — dark substrate with glowing circuit traces. */
export function makeChipTexture(accent: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#040604';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  const rand = mulberry(9091);
  for (let i = 0; i < 9; i += 1) {
    const y = 14 + i * 12 + rand() * 4;
    const x1 = 10 + rand() * 24;
    const bend = 44 + rand() * 40;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(bend, y);
    ctx.lineTo(bend + 12, y + (rand() > 0.5 ? 8 : -8));
    ctx.lineTo(118, y + (rand() > 0.5 ? 8 : -8));
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x1, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // central die pad
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(52, 52, 24, 24);
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** M4: glowing value plaque inside a vault (e.g. "$30K"), tinted per org. */
export function makeValueTexture(value: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#020402';
  ctx.fillRect(0, 0, 256, 256);
  const glow = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
  glow.addColorStop(0, `${color}55`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 256, 256);
  ctx.font = '700 64px "JetBrains Mono", Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f4fff0';
  ctx.fillText(value, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * G3: circuit-trace ground — avenues linking districts, thin infill traces,
 * via dots at junctions, and dark contact gradients under every tower.
 */
export function makeGroundTexture(towers: Tower[]): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const sx = size / WORLD_W;
  const sz = size / WORLD_D;
  const toU = (x: number) => (x + WORLD_W / 2) * sx;
  const toV = (z: number) => (z + WORLD_D / 2) * sz;

  ctx.fillStyle = '#030503';
  ctx.fillRect(0, 0, size, size);

  // PCB-style routing: a bundle of parallel traces with a 45° dogleg bend
  const drawBundle = (
    ax: number,
    az: number,
    bx: number,
    bz: number,
    count: number,
    color: string,
    width: number,
    gap: number
  ) => {
    const dx = bx - ax;
    const dz = bz - az;
    const len = Math.hypot(dx, dz) || 1;
    const nx = -dz / len;
    const nz = dx / len;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < count; i += 1) {
      const off = (i - (count - 1) / 2) * gap;
      const ox = nx * off;
      const oz = nz * off;
      // dogleg: dominant axis first, then 45°, then finish
      const midX = ax + dx * 0.55 + ox;
      const midZ = az + dz * 0.35 + oz;
      ctx.beginPath();
      ctx.moveTo(toU(ax + ox), toV(az + oz));
      ctx.lineTo(toU(midX), toV(midZ));
      ctx.lineTo(toU(bx + ox), toV(bz + oz));
      ctx.stroke();
      // via dots at the bend
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(toU(midX), toV(midZ), width * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // infill: scattered short trace bundles at ~30% of avenue brightness
  const rand = mulberry(4242);
  for (let i = 0; i < 62; i += 1) {
    const ax = (rand() - 0.5) * WORLD_W * 0.94;
    const az = (rand() - 0.5) * WORLD_D * 0.94;
    const angle = [0, Math.PI / 4, Math.PI / 2, -Math.PI / 4][Math.floor(rand() * 4)];
    const len = 30 + rand() * 70;
    const bx = ax + Math.cos(angle) * len;
    const bz = az + Math.sin(angle) * len;
    drawBundle(ax, az, bx, bz, 2 + Math.floor(rand() * 3), 'rgba(30, 74, 54, 0.8)', 2, 4 * sx);
  }

  // avenues — the data-bus roads, 3-trace bundles, 2-3x infill brightness
  for (const [ax, az, bx, bz] of AVENUES) {
    drawBundle(ax, az, bx, bz, 3, '#2a6a4e', 4, 8 * sx);
  }
  // via dots at junctions (both endpoints of every avenue)
  ctx.fillStyle = '#2f7a5c';
  for (const [ax, az, bx, bz] of AVENUES) {
    for (const [px, pz] of [
      [ax, az],
      [bx, bz]
    ]) {
      ctx.beginPath();
      ctx.arc(toU(px), toV(pz), 4.5 * sx, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // contact darkening under towers so nothing floats
  for (const t of towers) {
    const r = Math.max(t.w, t.d) * 1.5 * sx;
    const g = ctx.createRadialGradient(toU(t.x), toV(t.z), r * 0.2, toU(t.x), toV(t.z), r);
    g.addColorStop(0, 'rgba(0,0,0,0.62)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(toU(t.x), toV(t.z), r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
