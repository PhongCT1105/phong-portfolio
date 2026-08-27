'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useJourney } from '@/lib/journey';
import {
  CRANES,
  IDENTITY_QUAT,
  WORLD_D,
  WORLD_W,
  generateTowers,
  type Tower
} from '@/components/city/cityData';
import { makeGroundTexture, makeSignTexture, makeWindowTexture } from '@/components/city/textures';
import Vaults from '@/components/city/Vaults';
import Fab from '@/components/city/Fab';
import Gates from '@/components/city/Gates';
import Scheduler from '@/components/city/Scheduler';
import Board from '@/components/city/Board';
import Greebles from '@/components/city/Greebles';

/** emissive brightness tiers — downtown 2× districts 2× outskirts (G2) */
const TIER_EMISSIVE = [1.7, 0.85, 0.4];
/** lit-window probability per tier — downtown dense, outskirts sparse (defect 4) */
const TIER_LIT_PROB = [0.22, 0.11, 0.05];
/** world size of one window cell; UV repeats keep cells ~square per batch (defect 1) */
const TARGET_CELL = 0.55;

const BOX = new THREE.BoxGeometry();
const median = (xs: number[]) => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)];

interface Batch {
  key: string;
  towers: Tower[];
  emissive: number;
  litProb: number;
  seed: number;
}

/** smooth power ramp: each batch ignites once boot passes its threshold */
function powerRamp(boot: number, threshold: number): number {
  const t = Math.max(0, Math.min(1, (boot - threshold) / 0.2));
  return t * t * (3 - 2 * t);
}

function TowerBatch({ batch }: { batch: Batch }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const threshold = useMemo(() => ((batch.seed * 37) % 100) / 100 * 0.5, [batch.seed]);

  const materials = useMemo(() => {
    const medW = median(batch.towers.map((t) => t.w));
    const medH = median(batch.towers.map((t) => t.h));
    const texture = makeWindowTexture(batch.seed, batch.litProb);
    // canvas is 12.8 × 25.6 cells; fractional repeats keep cells ≈ TARGET_CELL world units
    texture.repeat.set(medW / (12.8 * TARGET_CELL), medH / (25.6 * TARGET_CELL));
    const side = new THREE.MeshStandardMaterial({
      color: '#080d08',
      roughness: 0.78,
      metalness: 0.22,
      emissive: new THREE.Color('#ffffff'),
      emissiveMap: texture,
      emissiveIntensity: batch.emissive
    });
    // just above void so buildings read as masses from orbit (M4 critic, M8)
    const roof = new THREE.MeshStandardMaterial({ color: '#0a120c', roughness: 0.9, metalness: 0.15 });
    // box material order: +x, -x, +y (roof), -y, +z, -z
    return [side, side, roof, roof, side, side];
  }, [batch]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const Y = new THREE.Vector3(0, 1, 0);
    batch.towers.forEach((t, i) => {
      pos.set(t.x, t.h / 2, t.z);
      scale.set(t.w, t.h, t.d);
      quat.setFromAxisAngle(Y, t.rot);
      matrix.compose(pos, quat, scale);
      mesh.setMatrixAt(i, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [batch]);

  useFrame(() => {
    const side = materials[0] as THREE.MeshStandardMaterial;
    side.emissiveIntensity = batch.emissive * powerRamp(useJourney.getState().boot, threshold);
  });

  return <instancedMesh ref={ref} args={[BOX, materials, batch.towers.length]} frustumCulled={false} />;
}

/** wider low bases under ~25% of buildings — podium + tower massing */
function Podiums({ towers }: { towers: Tower[] }) {
  const podiums = useMemo(() => towers.filter((t) => t.podium), [towers]);
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const scale = new THREE.Vector3();
    podiums.forEach((t, i) => {
      const p = t.podium!;
      pos.set(t.x, p.h / 2, t.z);
      scale.set(p.w, p.h, p.d);
      matrix.compose(pos, IDENTITY_QUAT, scale);
      mesh.setMatrixAt(i, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [podiums]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, podiums.length]} frustumCulled={false}>
      <boxGeometry />
      <meshStandardMaterial color="#0c110c" roughness={0.7} metalness={0.3} emissive="#ffe9c4" emissiveIntensity={0.06} />
    </instancedMesh>
  );
}

/** lit billboard panels on the towers the HERO camera actually frames —
    each must read as a distinct 30-60px lit slab from (-10,14,118) */
function Billboards({ towers }: { towers: Tower[] }) {
  const panels = useMemo(() => {
    // pick by REAL perspective projection from the hero camera: reject edge-on
    // facades and panels hidden behind nearer towers' projected screen rects
    const cam = new THREE.PerspectiveCamera(55, 1440 / 900, 0.5, 900);
    cam.position.set(-10, 14, 118);
    cam.lookAt(42, 11, 2);
    cam.updateMatrixWorld();
    const ndc = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z).project(cam);

    const candidates = towers
      .filter((t) => t.h > 9 && Math.hypot(t.x - 35, t.z - 10) < 62)
      .map((t) => {
        const px = t.x;
        const py = t.h * 0.72;
        const pz = t.z + t.d / 2 + 0.1;
        const toCam = new THREE.Vector3(-10 - px, 14 - py, 118 - pz).normalize();
        return { t, px, py, pz, facing: toCam.z, dist: Math.hypot(-10 - px, 118 - pz) };
      })
      // facade normal is +z; require the camera at least ~25° off edge-on
      .filter((c) => c.facing > 0.42)
      .sort((a, b) => a.dist - b.dist); // nearest first

    const accepted: typeof candidates = [];
    for (const c of candidates) {
      const p = ndc(c.px, c.py, c.pz);
      if (Math.abs(p.x) > 1 || Math.abs(p.y) > 1) continue; // off-frame
      const blocked = accepted.some((a) => {
        const left = ndc(a.t.x - a.t.w / 2, 0, a.t.z + a.t.d / 2);
        const right = ndc(a.t.x + a.t.w / 2, 0, a.t.z + a.t.d / 2);
        const top = ndc(a.t.x, a.t.h, a.t.z + a.t.d / 2);
        return p.x > Math.min(left.x, right.x) && p.x < Math.max(left.x, right.x) && p.y < top.y;
      });
      if (!blocked) accepted.push(c);
      if (accepted.length >= 6) break;
    }
    return accepted.map((c, i) => ({
      x: c.px,
      y: c.py,
      z: c.pz,
      w: Math.max(3, c.t.w * 0.62),
      h: Math.max(3.2, c.t.h * 0.24),
      warm: i % 2 === 0
    }));
  }, [towers]);

  return (
    <group>
      {panels.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <planeGeometry args={[p.w, p.h]} />
          <meshStandardMaterial
            color="#050805"
            emissive={p.warm ? '#ffe9c4' : '#9effc0'}
            emissiveIntensity={p.warm ? 1.4 : 1.6}
          />
        </mesh>
      ))}
    </group>
  );
}

/** lit vertical corner edges on the tallest downtown towers — skyscraper accents */
function EdgeLights({ towers }: { towers: Tower[] }) {
  const strips = useMemo(() => {
    const talls = towers
      .filter((t) => t.tier === 0 && t.h > 13)
      .sort((a, b) => b.h - a.h)
      .slice(0, 8);
    const out: { x: number; y: number; z: number; h: number }[] = [];
    for (const t of talls) {
      // two corners facing the hero camera (+z side)
      out.push({ x: t.x - t.w / 2, y: t.h / 2, z: t.z + t.d / 2, h: t.h });
      out.push({ x: t.x + t.w / 2, y: t.h / 2, z: t.z + t.d / 2, h: t.h });
    }
    return out;
  }, [towers]);
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const scale = new THREE.Vector3();
    strips.forEach((s, i) => {
      pos.set(s.x, s.y, s.z);
      scale.set(0.14, s.h, 0.14);
      matrix.compose(pos, IDENTITY_QUAT, scale);
      mesh.setMatrixAt(i, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [strips]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, strips.length]} frustumCulled={false}>
      <boxGeometry />
      <meshStandardMaterial color="#0a0f0a" emissive="#9effc0" emissiveIntensity={0.55} />
    </instancedMesh>
  );
}

function Crowns({ towers }: { towers: Tower[] }) {
  const crowns = useMemo(() => towers.filter((t) => t.crown), [towers]);
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const scale = new THREE.Vector3();
    crowns.forEach((t, i) => {
      const c = t.crown!;
      pos.set(t.x, t.h + c.h / 2, t.z);
      scale.set(c.w, c.h, c.d);
      matrix.compose(pos, IDENTITY_QUAT, scale);
      mesh.setMatrixAt(i, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [crowns]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, crowns.length]} frustumCulled={false}>
      <boxGeometry />
      <meshStandardMaterial color="#0a120c" roughness={0.85} metalness={0.15} emissive="#9effc0" emissiveIntensity={0.05} />
    </instancedMesh>
  );
}

/** M3/M7 — stepped crowns + antenna masts with BREATHING beacons (300ms rise, slow decay) */
function CrownsAndBeacons({ towers }: { towers: Tower[] }) {
  const beaconRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  const masts = useMemo(() => {
    const base: { x: number; z: number; base: number; h: number; phase: number }[] = [
      { x: 38, z: 8, base: 25.5, h: 5, phase: 0 },
      { x: 24, z: 26, base: 20.5, h: 4, phase: 0.9 }
    ];
    // two more on the tallest west / south towers, phase-offset (M7 guidance)
    const west = towers.filter((t) => t.x < -40).sort((a, b) => b.h - a.h)[0];
    const south = towers.filter((t) => t.z > 60).sort((a, b) => b.h - a.h)[0];
    if (west) base.push({ x: west.x, z: west.z, base: west.h + (west.crown?.h ?? 0), h: 4, phase: 0.45 });
    if (south) base.push({ x: south.x, z: south.z, base: south.h + (south.crown?.h ?? 0), h: 4, phase: 1.4 });
    return base;
  }, [towers]);

  useFrame((state) => {
    const boot = useJourney.getState().boot;
    beaconRefs.current.forEach((material, i) => {
      if (!material) return;
      const phase = (state.clock.elapsedTime + (masts[i]?.phase ?? 0) * 2) % 2;
      // breathing: ~300ms rise, ~600ms exponential decay
      const envelope = phase < 0.3 ? phase / 0.3 : Math.exp(-(phase - 0.3) * 2.4);
      material.emissiveIntensity = boot >= 0.9 ? 0.12 + 2.0 * envelope : 0.05;
    });
  });

  return (
    <group>
      {/* second setback step on the main hero tower */}
      <mesh position={[38, 26.1, 8]}>
        <boxGeometry args={[3.2, 1.2, 3.2]} />
        <meshStandardMaterial color="#060906" roughness={0.85} />
      </mesh>
      {masts.map((m, i) => (
        <group key={i} position={[m.x, 0, m.z]}>
          <mesh position={[0, m.base + m.h / 2, 0]}>
            <boxGeometry args={[0.2, m.h, 0.2]} />
            <meshStandardMaterial color="#0a0f0a" roughness={0.9} />
          </mesh>
          <mesh position={[0, m.base + m.h + 0.2, 0]}>
            <boxGeometry args={[0.38, 0.38, 0.38]} />
            <meshStandardMaterial
              ref={(mat) => {
                beaconRefs.current[i] = mat;
              }}
              color="#0a0f0a"
              emissive="#ffe9c4"
              emissiveIntensity={0.1}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** thin emissive parapet banners on the hero towers (defect 5) */
function HeroBanners() {
  const banners: { pos: [number, number, number]; w: number; rotY: number }[] = [
    { pos: [38, 21.4, 12.6], w: 8.6, rotY: 0 },
    { pos: [52, 18.5, 26.1], w: 7.6, rotY: 0 },
    { pos: [27.6, 17.5, 26], w: 6.6, rotY: 0 }
  ];
  return (
    <group>
      {banners.map((b, i) => (
        <mesh key={i} position={b.pos} rotation={[0, b.rotY, 0]}>
          <planeGeometry args={[b.w, 0.42]} />
          <meshStandardMaterial color="#041006" emissive="#9effc0" emissiveIntensity={1.5} />
        </mesh>
      ))}
    </group>
  );
}

function CraneSilhouettes() {
  return (
    <group>
      {CRANES.map((c, i) => (
        <group key={i} position={[c.x, 0, c.z]} rotation={[0, c.rotY, 0]}>
          <mesh position={[0, c.h / 2, 0]}>
            <boxGeometry args={[0.9, c.h, 0.9]} />
            <meshStandardMaterial color="#0b0f0b" roughness={0.9} />
          </mesh>
          {/* jib — long working arm */}
          <mesh position={[c.arm / 2, c.h, 0]}>
            <boxGeometry args={[c.arm * 1.25, 0.85, 0.85]} />
            <meshStandardMaterial color="#0c110c" roughness={0.9} />
          </mesh>
          {/* counter-jib */}
          <mesh position={[-c.arm * 0.35, c.h, 0]}>
            <boxGeometry args={[c.arm * 0.55, 0.75, 0.75]} />
            <meshStandardMaterial color="#0c110c" roughness={0.9} />
          </mesh>
          {/* hook cable */}
          <mesh position={[c.arm * 0.9, c.h - 2.6, 0]}>
            <boxGeometry args={[0.16, 5.2, 0.16]} />
            <meshStandardMaterial color="#0b0f0b" roughness={0.9} />
          </mesh>
          {/* cab light */}
          <mesh position={[0, c.h + 0.85, 0]}>
            <boxGeometry args={[0.6, 1, 0.6]} />
            <meshStandardMaterial emissive="#ffe9c4" emissiveIntensity={1.2} color="#0b0f0b" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * G5 — rooftop signage on the tallest downtown tower, aimed at the hero camera.
 * Fades out past the receipts station so it never bleeds over later DOM text
 * (and can't read as a ghost slab from the far stations).
 */
function Signage() {
  const texture = useMemo(() => makeSignTexture(), []);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  // hero tower at (38, 8), h=22 + crown; hero camera ≈ (-10, 14, 118)
  const rotY = Math.atan2(-10 - 38, 118 - 8);

  const flickerStart = useRef<number | null>(null);

  useFrame((state) => {
    const material = materialRef.current;
    if (!material) return;
    const { progress, boot } = useJourney.getState();
    // sign waits for CONNECTED, then flickers on like a neon tube (M3)
    let ignite = 0;
    if (boot >= 0.99) {
      if (flickerStart.current === null) flickerStart.current = state.clock.elapsedTime;
      const since = state.clock.elapsedTime - flickerStart.current;
      if (since < 1.2) {
        const buzz = Math.sin(since * 47) * Math.sin(since * 13.7);
        ignite = since / 1.2 > Math.abs(buzz) ? 1 : 0.15;
      } else {
        ignite = 1;
      }
    }
    // full at hero/receipts, gone by 40% scroll
    const t = Math.max(0, Math.min(1, (progress - 0.25) / 0.15));
    const fade = (1 - t * t * (3 - 2 * t)) * ignite;
    material.opacity = fade;
    material.emissiveIntensity = 2.5 * fade;
    material.visible = fade > 0.01;
  });

  return (
    <group position={[38, 28.2, 8]} rotation={[0, rotY, 0]}>
      <mesh>
        <planeGeometry args={[34, 5.4]} />
        <meshStandardMaterial
          ref={materialRef}
          map={texture}
          transparent
          emissive="#f4fff0"
          emissiveMap={texture}
          emissiveIntensity={2.5}
          color="#000000"
        />
      </mesh>
    </group>
  );
}

function GroundPlane({ texture }: { texture: THREE.CanvasTexture }) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = 0.32 * powerRamp(useJourney.getState().boot, 0.05);
    }
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[WORLD_W, WORLD_D]} />
      <meshStandardMaterial
        ref={materialRef}
        map={texture}
        roughness={0.92}
        metalness={0.15}
        emissive="#ffffff"
        emissiveMap={texture}
        emissiveIntensity={0}
      />
    </mesh>
  );
}

export default function City({ density = 1 }: { density?: number }) {
  const towers = useMemo(() => generateTowers(density), [density]);
  const groundTexture = useMemo(() => makeGroundTexture(towers), [towers]);

  const batches = useMemo(() => {
    // batch by (tier, variant 0-2, height bucket) — square-ish window cells per batch
    const map = new Map<string, Batch>();
    for (const t of towers) {
      const bucket = t.h < 4.5 ? 0 : t.h < 9 ? 1 : 2;
      const variant = t.variant % 3;
      const key = `${t.tier}-${variant}-${bucket}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          towers: [],
          emissive: TIER_EMISSIVE[t.tier],
          litProb: TIER_LIT_PROB[t.tier],
          seed: 777 + t.tier * 917 + variant * 131 + bucket * 37
        });
      }
      map.get(key)!.towers.push(t);
    }
    return Array.from(map.values());
  }, [towers]);

  return (
    <group>
      <GroundPlane texture={groundTexture} />
      {batches.map((batch) => (
        <TowerBatch key={batch.key} batch={batch} />
      ))}
      <Crowns towers={towers} />
      <CrownsAndBeacons towers={towers} />
      <Greebles towers={towers} />
      <Podiums towers={towers} />
      <EdgeLights towers={towers} />
      <Billboards towers={towers} />
      <Vaults />
      <Fab />
      <Gates />
      <Scheduler />
      <Board />
      <HeroBanners />
      <CraneSilhouettes />
      <Signage />
    </group>
  );
}
