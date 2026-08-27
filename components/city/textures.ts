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

  // thin infill traces — a manhattan grid at ~30% of avenue brightness
  ctx.strokeStyle = 'rgba(26, 66, 46, 0.75)';
  ctx.lineWidth = 1.5;
  const step = 16 * sx;
  for (let u = 0; u < size; u += step) {
    ctx.beginPath();
    ctx.moveTo(u, 0);
    ctx.lineTo(u, size);
    ctx.stroke();
  }
  for (let v = 0; v < size; v += 16 * sz) {
    ctx.beginPath();
    ctx.moveTo(0, v);
    ctx.lineTo(size, v);
    ctx.stroke();
  }

  // avenues — the data-bus roads
  ctx.strokeStyle = '#1a4a3a';
  ctx.lineWidth = 5 * sx;
  ctx.lineCap = 'round';
  for (const [ax, az, bx, bz] of AVENUES) {
    ctx.beginPath();
    ctx.moveTo(toU(ax), toV(az));
    ctx.lineTo(toU(bx), toV(bz));
    ctx.stroke();
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
