import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { AVENUES, WORLD_D, WORLD_W, type Tower } from '@/components/city/cityData';

function mulberry(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ------------------------------------------------- R5: studio rig + grounding */

/**
 * R5 contact shadow. ONE 256px radial luminance ramp, used as an ALPHA MAP on a
 * black unlit material — every grounded hero object (fab chips + pedestals, vault
 * monuments, NOW machines) shares the same texture AND the same material instance,
 * so the whole set costs one upload and never breaks batching. Deliberately NOT
 * drei's <ContactShadows/>: that re-renders the scene into an off-screen target
 * every frame, which this six-station rail cannot afford.
 *
 * Peak opacity lives on the material (0.35); the plane's scale makes it elliptical.
 */
let blobShadowTexture: THREE.CanvasTexture | null = null;

export function makeBlobShadowTexture(): THREE.CanvasTexture {
  if (blobShadowTexture) return blobShadowTexture;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);
  // white = fully shadowed, black = clear. Extra mid stops keep the penumbra
  // soft (a plain 2-stop ramp reads as a hard disc with a halo).
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.32, 'rgba(255,255,255,0.84)');
  g.addColorStop(0.58, 'rgba(255,255,255,0.38)');
  g.addColorStop(0.82, 'rgba(255,255,255,0.09)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  // it is an alpha ramp, not colour — no sRGB decode
  texture.colorSpace = THREE.NoColorSpace;
  blobShadowTexture = texture;
  return texture;
}

/**
 * Blob shadows are decoration, never a hit target: without this they would widen
 * the IT1 hover areas (a vault would light up while the pointer is on bare
 * ground) and add pointless work to every raycast.
 */
export const NO_RAYCAST: THREE.Object3D['raycast'] = () => {};

let blobShadowMaterial: THREE.MeshBasicMaterial | null = null;

/**
 * Shared material for every blob shadow. `depthWrite: false` (plus the ~0.02 y
 * bias each caller applies) is what keeps it off the ground/pedestal z-fight —
 * coplanar transparent planes that never write depth simply blend in renderOrder.
 * `fog: false` stops the far-station fog from tinting the shadow back to sky.
 */
export function getBlobShadowMaterial(): THREE.MeshBasicMaterial {
  if (blobShadowMaterial) return blobShadowMaterial;
  blobShadowMaterial = new THREE.MeshBasicMaterial({
    color: '#000000',
    transparent: true,
    opacity: 0.35,
    alphaMap: makeBlobShadowTexture(),
    depthWrite: false,
    toneMapped: false,
    fog: false
  });
  return blobShadowMaterial;
}

/**
 * RectAreaLight needs its LTC lookup textures uploaded once per renderer session
 * before any such light renders. Both studio rigs (fab shelf, NOW bench) call
 * this from a useMemo, so the init happens exactly once on the client.
 */
let rectAreaReady = false;

export function ensureRectAreaLights(): void {
  if (rectAreaReady) return;
  rectAreaReady = true;
  RectAreaLightUniformsLib.init();
}

/**
 * RectAreaLight has no `target`, and Object3D.lookAt() inside a rotated group
 * needs an up-to-date world matrix. Resolving the aim on a parentless dummy gives
 * the LOCAL euler directly — correct on the very first frame, no effect needed.
 */
export function aimRotation(
  from: [number, number, number],
  at: [number, number, number]
): [number, number, number] {
  const dummy = new THREE.Object3D();
  dummy.position.set(from[0], from[1], from[2]);
  dummy.lookAt(at[0], at[1], at[2]);
  return [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z];
}

/**
 * R5 silkscreen: the white legend layer a real PCB carries — part numbers, a rev
 * stamp, routing tick marks. Off-white only (the ≤2 accent hue rule stands), laid
 * over the substrate at low opacity so it reads as printed ink, not as a label.
 */
export function makeSilkscreenTexture(): THREE.CanvasTexture {
  const w = 2048;
  const h = 1774; // matches the 1500 × 1300 substrate aspect
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);

  const ink = 'rgba(226,232,220,0.9)';
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.textBaseline = 'middle';

  // the die outline sits in the middle of the substrate — everything is placed
  // OUTSIDE it so the silkscreen never prints across the city itself
  const dieW = (WORLD_W / 1500) * w;
  const dieH = (WORLD_D / 1300) * h;
  const cx = w / 2;
  const cy = h / 2;

  // package outline + pin-1 chamfer
  ctx.lineWidth = 3;
  ctx.strokeRect(cx - dieW / 2 - 70, cy - dieH / 2 - 70, dieW + 140, dieH + 140);
  ctx.beginPath();
  ctx.moveTo(cx - dieW / 2 - 70, cy - dieH / 2 + 30);
  ctx.lineTo(cx - dieW / 2 + 30, cy - dieH / 2 - 70);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx - dieW / 2 - 130, cy - dieH / 2 - 130, 16, 0, Math.PI * 2);
  ctx.fill();

  const label = (text: string, x: number, y: number, px: number, align: CanvasTextAlign = 'left') => {
    ctx.font = `500 ${px}px "JetBrains Mono", Consolas, monospace`;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
  };

  label('PHONG-CAO  REV 5.0', cx - dieW / 2 - 60, cy - dieH / 2 - 130, 34);
  label('ZL-2026', cx + dieW / 2 + 60, cy - dieH / 2 - 130, 34, 'right');
  label('U1  PHONG.SYSTEMS', cx - dieW / 2 - 60, cy + dieH / 2 + 140, 30);
  label('MADE ON EARTH  ·  4-LAYER  ·  ENIG', cx + dieW / 2 + 60, cy + dieH / 2 + 140, 26, 'right');
  label('J1 UPLINK', cx + dieW / 2 + 320, cy + dieH / 2 + 300, 26);
  label('TP1', cx - dieW / 2 - 320, cy + dieH / 2 + 300, 24, 'right');
  label('FID', cx - dieW / 2 - 320, cy - dieH / 2 - 300, 24, 'right');

  // routing tick marks along the pad rows — the "this board was actually laid
  // out" tell. Every 5th tick is long, like a ruler.
  ctx.lineWidth = 2;
  const tick = (x: number, y: number, dx: number, dy: number, len: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx * len, y + dy * len);
    ctx.stroke();
  };
  for (let i = 0; i < 60; i += 1) {
    const len = i % 5 === 0 ? 34 : 16;
    const x = cx - dieW / 2 - 100 + (i / 59) * (dieW + 200);
    tick(x, cy - dieH / 2 - 190, 0, -1, len);
    tick(x, cy + dieH / 2 + 190, 0, 1, len);
  }
  for (let i = 0; i < 50; i += 1) {
    const len = i % 5 === 0 ? 34 : 16;
    const y = cy - dieH / 2 - 100 + (i / 49) * (dieH + 200);
    tick(cx - dieW / 2 - 190, y, -1, 0, len);
    tick(cx + dieW / 2 + 190, y, 1, 0, len);
  }

  // dashed courtyard boxes for the passives nobody models
  ctx.setLineDash([14, 10]);
  ctx.lineWidth = 2;
  const rand = mulberry(31337);
  for (let i = 0; i < 14; i += 1) {
    const side = i % 4;
    const along = (rand() - 0.5) * (side < 2 ? dieW + 400 : dieH + 400);
    const off = 300 + rand() * 340;
    const bx = side < 2 ? cx + along : cx + (side === 2 ? -1 : 1) * (dieW / 2 + off);
    const by = side < 2 ? cy + (side === 0 ? -1 : 1) * (dieH / 2 + off) : cy + along;
    const bw = 60 + rand() * 90;
    ctx.strokeRect(bx - bw / 2, by - 22, bw, 44);
  }
  ctx.setLineDash([]);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
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
