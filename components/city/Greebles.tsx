'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { IDENTITY_QUAT, type Tower } from '@/components/city/cityData';

/**
 * Rooftop greebles — instanced procedural props (AC units, vents, antennas,
 * parapet pipes). At street/orbit camera distances these read like kit-made
 * detail, but stay in our material language and cost three draw calls.
 */

interface Placement {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  sz: number;
}

function mulberry(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function buildPlacements(towers: Tower[]) {
  const rand = mulberry(60947);
  const boxes: Placement[] = []; // AC units / plant rooms
  const drums: Placement[] = []; // round vents (cylinders)
  const masts: Placement[] = []; // thin antennas

  for (const t of towers) {
    if (t.h < 4 || t.crown) continue; // crowned roofs stay clean
    const roofY = t.h;
    const count = t.h > 9 ? 2 + Math.floor(rand() * 2) : rand() > 0.45 ? 1 : 0;
    for (let i = 0; i < count; i += 1) {
      const px = t.x + (rand() - 0.5) * (t.w - 1.6);
      const pz = t.z + (rand() - 0.5) * (t.d - 1.6);
      const kind = rand();
      if (kind < 0.45) {
        const s = 0.7 + rand() * 0.9;
        boxes.push({ x: px, y: roofY + s * 0.35, z: pz, sx: s * 1.4, sy: s * 0.7, sz: s });
      } else if (kind < 0.75) {
        const r = 0.35 + rand() * 0.4;
        drums.push({ x: px, y: roofY + r * 1.1, z: pz, sx: r, sy: r * 2.2, sz: r });
      } else {
        const h = 1.6 + rand() * 2.6;
        masts.push({ x: px, y: roofY + h / 2, z: pz, sx: 0.09, sy: h, sz: 0.09 });
      }
    }
  }
  return { boxes, drums, masts };
}

function Batch({
  placements,
  geometry
}: {
  placements: Placement[];
  geometry: 'box' | 'cylinder';
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const scale = new THREE.Vector3();
    placements.forEach((p, i) => {
      pos.set(p.x, p.y, p.z);
      scale.set(p.sx, p.sy, p.sz);
      matrix.compose(pos, IDENTITY_QUAT, scale);
      mesh.setMatrixAt(i, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [placements]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, placements.length]} frustumCulled={false}>
      {geometry === 'box' ? <boxGeometry /> : <cylinderGeometry args={[1, 1, 1, 8]} />}
      <meshStandardMaterial color="#0d130d" roughness={0.75} metalness={0.35} />
    </instancedMesh>
  );
}

export default function Greebles({ towers }: { towers: Tower[] }) {
  const { boxes, drums, masts } = useMemo(() => buildPlacements(towers), [towers]);
  return (
    <group>
      <Batch placements={boxes} geometry="box" />
      <Batch placements={drums} geometry="cylinder" />
      <Batch placements={masts} geometry="box" />
    </group>
  );
}
