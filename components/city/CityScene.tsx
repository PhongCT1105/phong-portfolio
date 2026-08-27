'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { easing } from 'maath';
import { useJourney } from '@/lib/journey';
import type { QualityTier } from '@/components/city/CityLayer';

/**
 * Camera rail through the six stations (city on XZ plane, Y up).
 * Critic F1: shallow pitch (−8°..−15°) everywhere except the lift-off finale —
 * every station shows a horizon with the city dissolving into fog.
 */
const RAIL_POINTS: [number, number, number][] = [
  [0, 20, 150], // 00 hero — low over the grid, downtown ahead-right
  [85, 16, 60], // 01 receipts — gliding toward the memory quarter
  [150, 14, -30], // 02 work — the fab, east side
  [55, 8, -95], // 03 road — street level on the avenue
  [-85, 14, -45], // 04 now — scheduler hall
  [-30, 230, 130] // 05 contact — lift-off (the one steep shot)
];

const LOOK_TARGETS: [number, number, number][] = [
  [30, 10, 20], // horizon over downtown
  [120, 8, -20],
  [180, 6, -90],
  [-45, 6, -95], // straight down the avenue
  [-135, 6, 5],
  [0, 0, 0]
];

function CameraRig() {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(RAIL_POINTS.map((p) => new THREE.Vector3(...p)), false, 'centripetal', 0.5),
    []
  );
  const pos = useRef(new THREE.Vector3(...RAIL_POINTS[0]));
  const look = useRef(new THREE.Vector3(...LOOK_TARGETS[0]));
  const scratch = useRef(new THREE.Vector3());
  const scratch2 = useRef(new THREE.Vector3());

  useFrame((state, dt) => {
    const { progress, station, localT } = useJourney.getState();
    const delta = Math.min(dt, 0.05);

    curve.getPointAt(Math.max(0, Math.min(1, progress)), scratch.current);
    easing.damp3(pos.current, scratch.current, 0.45, delta);

    const nextStation = Math.min(station + 1, LOOK_TARGETS.length - 1);
    scratch.current
      .fromArray(LOOK_TARGETS[station])
      .lerp(scratch2.current.fromArray(LOOK_TARGETS[nextStation]), localT * 0.5);
    easing.damp3(look.current, scratch.current, 0.6, delta);

    state.camera.position.copy(pos.current);
    state.camera.lookAt(look.current);
    // spring-damped mouse parallax, ±~1.5°
    state.camera.rotateY(-state.pointer.x * 0.026);
    state.camera.rotateX(state.pointer.y * 0.02);
  });

  return null;
}

/**
 * M1 placeholder city. Critic fixes applied: grid-snapped footprints (F5, no
 * interpenetration), dark bodies with faint emissive so the night reads (F3),
 * downtown cluster ahead-right of the hero camera so shot 1 has a focal mass.
 * Fully replaced by the real instanced city in M2.
 */
function PlaceholderCity() {
  const blocks = useMemo(() => {
    let seed = 20260827;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const CELL = 16;
    const result: { x: number; z: number; h: number; w: number; d: number; glow: number }[] = [];
    for (let gx = -13; gx <= 13; gx += 1) {
      for (let gz = -11; gz <= 11; gz += 1) {
        if (rand() > 0.42) continue;
        const cx = gx * CELL;
        const cz = gz * CELL;
        // downtown: a cluster ahead-right of the hero camera (around x≈35, z≈10)
        const dDowntown = Math.hypot(cx - 35, cz - 10);
        const downtown = dDowntown < 55;
        const tall = downtown && rand() > 0.55;
        const h = 3 + rand() * (tall ? 26 : downtown ? 12 : 7);
        const w = 4 + rand() * 6;
        const d = 4 + rand() * 6;
        const x = cx + (rand() - 0.5) * (CELL - w - 2);
        const z = cz + (rand() - 0.5) * (CELL - d - 2);
        const glow = rand() > 0.6 ? 0.18 + rand() * 0.14 : 0;
        result.push({ x, z, h, w, d, glow });
      }
    }
    return result;
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[560, 480]} />
        <meshStandardMaterial color="#050805" roughness={0.9} metalness={0.25} />
      </mesh>
      <gridHelper args={[560, 70, '#0e2a14', '#081208']} position={[0, 0.02, 0]} />
      {blocks.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]}>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial
            color="#0a120a"
            roughness={0.7}
            metalness={0.3}
            emissive="#9be15d"
            emissiveIntensity={b.glow}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function CityScene({ tier }: { tier: QualityTier }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ fov: 55, near: 0.5, far: 900, position: RAIL_POINTS[0] }}
      gl={{ antialias: tier === 'lite', powerPreference: 'high-performance' }}
      eventSource={document.body}
      eventPrefix="client"
      style={{ pointerEvents: 'none' }}
    >
      {/* bg matches fog so the far city dissolves cleanly into void (critic F2) */}
      <color attach="background" args={['#050c07']} />
      <fogExp2 attach="fog" args={['#050c07', 0.005]} />
      {/* night lighting: near-black ambient, light is implied by emissives (critic F3) */}
      <ambientLight intensity={0.035} />
      <directionalLight position={[-120, 180, 80]} intensity={0.06} color="#cfd8ce" />
      <PlaceholderCity />
      <CameraRig />
      {tier === 'full' ? (
        <EffectComposer>
          <Bloom mipmapBlur intensity={0.7} luminanceThreshold={0.9} luminanceSmoothing={0.2} />
          <Vignette darkness={0.55} offset={0.28} />
        </EffectComposer>
      ) : null}
    </Canvas>
  );
}
