'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { easing } from 'maath';
import { useJourney } from '@/lib/journey';
import type { QualityTier } from '@/components/city/CityLayer';
import City from '@/components/city/City';

/**
 * Camera rail through the six stations (city on XZ plane, Y up).
 * Critic F1: shallow pitch (−8°..−15°) everywhere except the lift-off finale —
 * every station shows a horizon with the city dissolving into fog.
 */
const RAIL_POINTS: [number, number, number][] = [
  [-10, 14, 118], // 00 hero — eye below the hero-tower roofline, downtown ahead-right
  [85, 16, 60], // 01 receipts — gliding toward the memory quarter
  [150, 14, -30], // 02 work — the fab, east side
  [55, 8, -95], // 03 road — street level on the avenue
  [-85, 14, -45], // 04 now — scheduler hall
  [-30, 230, 130] // 05 contact — lift-off (the one steep shot)
];

const LOOK_TARGETS: [number, number, number][] = [
  [42, 11, 2], // downtown cluster breaks the horizon, right of frame
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
      <City density={tier === 'lite' ? 0.6 : 1} />
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
