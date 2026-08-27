'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';

/**
 * Procedural ceramic PGA chip package, reconstructed from reference photos of
 * an Intel 80486DX2 (Wikimedia Commons, CC BY-SA 2.0 — used as visual reference
 * only; this model is original procedural code) via the img2threejs M.C.M.T
 * pipeline: ceramic slab + 208-pin gold grid (17×17, 4 perimeter rows) +
 * central gold die lid + etched label texture + corner index dot.
 */

const SIZE = 5.6;
const THICK = 0.55;
const GRID = 17;
const RINGS = 4;
const PITCH = (SIZE * 0.92) / (GRID - 1);

function makeEtchTexture(label: string, sub: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 512, 512);
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(244,246,240,0.92)';
  ctx.font = 'italic 700 78px Inter, sans-serif';
  ctx.fillText(label.toLowerCase(), 256, 190);
  ctx.font = '500 30px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(244,246,240,0.8)';
  ctx.fillText(sub, 256, 292);
  ctx.font = '500 26px "JetBrains Mono", monospace';
  ctx.fillText('PHONG.SYSTEMS © 2026', 256, 348);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** pin positions: full 17×17 grid minus the interior (keeps 4 perimeter rings) */
function pinPositions(): [number, number][] {
  const out: [number, number][] = [];
  const half = (GRID - 1) / 2;
  for (let i = 0; i < GRID; i += 1) {
    for (let j = 0; j < GRID; j += 1) {
      const ring = Math.min(i, j, GRID - 1 - i, GRID - 1 - j);
      if (ring >= RINGS) continue;
      out.push([(i - half) * PITCH, (j - half) * PITCH]);
    }
  }
  return out;
}

const GOLD = new THREE.MeshStandardMaterial({
  color: '#e8bd4a',
  metalness: 1,
  roughness: 0.28,
  envMapIntensity: 1.4
});

export default function ChipModel({
  label,
  sub,
  accent
}: {
  label: string;
  sub: string;
  accent: string;
}) {
  const etch = useMemo(() => makeEtchTexture(label, sub), [label, sub]);
  const pins = useMemo(() => pinPositions(), []);

  const pinMeshes = useMemo(() => {
    const shaft = new THREE.CylinderGeometry(0.032, 0.032, 0.5, 6);
    const base = new THREE.CylinderGeometry(0.078, 0.05, 0.09, 8);
    const shaftMesh = new THREE.InstancedMesh(shaft, GOLD, pins.length);
    const baseMesh = new THREE.InstancedMesh(base, GOLD, pins.length);
    const matrix = new THREE.Matrix4();
    pins.forEach(([px, pz], i) => {
      // pins protrude from the TOP face in display orientation (pin-side up)
      matrix.setPosition(px, THICK / 2 + 0.25, pz);
      shaftMesh.setMatrixAt(i, matrix);
      matrix.setPosition(px, THICK / 2 + 0.045, pz);
      baseMesh.setMatrixAt(i, matrix);
    });
    shaftMesh.instanceMatrix.needsUpdate = true;
    baseMesh.instanceMatrix.needsUpdate = true;
    return { shaftMesh, baseMesh };
  }, [pins]);

  return (
    <group>
      {/* ceramic body */}
      <RoundedBox args={[SIZE, THICK, SIZE]} radius={0.06} smoothness={2}>
        <meshStandardMaterial color="#9d92a0" metalness={0.06} roughness={0.55} envMapIntensity={0.7} />
      </RoundedBox>
      {/* accent identity: thin emissive edge band around the ceramic */}
      <mesh position={[0, -THICK / 2 + 0.06, 0]}>
        <boxGeometry args={[SIZE + 0.02, 0.05, SIZE + 0.02]} />
        <meshStandardMaterial color="#0a0f0a" emissive={accent} emissiveIntensity={0.9} />
      </mesh>
      {/* gold die lid centered in the pin field (pin-side up, like the reference) */}
      <RoundedBox args={[2.15, 0.07, 2.15]} radius={0.05} smoothness={2} position={[0, THICK / 2 + 0.035, 0]}>
        <primitive object={GOLD} attach="material" />
      </RoundedBox>
      {/* gold pin grid — two instanced draws */}
      <primitive object={pinMeshes.shaftMesh} />
      <primitive object={pinMeshes.baseMesh} />
      {/* etched label on the ceramic underside (faces camera when tilted) */}
      <mesh position={[0, -THICK / 2 - 0.005, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[SIZE * 0.9, SIZE * 0.9]} />
        <meshStandardMaterial
          map={etch}
          transparent
          emissive="#f4f6f0"
          emissiveMap={etch}
          emissiveIntensity={0.32}
          color="#000000"
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* corner index dot */}
      <mesh position={[-SIZE / 2 + 0.4, THICK / 2 + 0.002, -SIZE / 2 + 0.4]}>
        <cylinderGeometry args={[0.11, 0.11, 0.03, 12]} />
        <meshStandardMaterial color="#7c7280" roughness={0.6} />
      </mesh>
    </group>
  );
}
