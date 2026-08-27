'use client';

import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { suspend } from 'suspend-react';
// CC0 night HDRI bundled locally (no CDN) — real reflections on every surface
const nightHdri = import('@pmndrs/assets/hdri/night.exr').then((m) => m.default);
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
  [85, 20, 60], // 01 receipts — raised so vault plaques clear the DOM card bottoms
  [150, 16, -30], // 02 work — the fab, east side (raised per M5 composition guidance)
  [72, 7, -95], // 03 road — avenue entrance (station 3 drives a straight z-locked path)
  [-85, 14, -45], // 04 now — scheduler hall
  [-30, 500, 300] // 05 contact — orbit high enough that all four die edges + pads fit
];

const LOOK_TARGETS: [number, number, number][] = [
  [42, 11, 2], // downtown cluster breaks the horizon, right of frame
  [120, 4, -20],
  [180, 6, -90],
  [-70, 6, -95], // held down the avenue while the gates pass
  [-140, 6, -2], // panned so the hall sits in the DOM center gap
  [0, 0, 0]
];

/** image-based lighting: bundled CC0 night HDRI gives metals/glass real reflections */
function EnvironmentLight() {
  const file = suspend(nightHdri, ['city-night-hdri']) as string;
  return <Environment files={file} environmentIntensity={0.35} />;
}

/** fog thins as the camera climbs so the whole die stays visible from orbit */
function FogRig() {
  useFrame((state, dt) => {
    const fog = state.scene.fog as THREE.FogExp2 | null;
    if (!fog) return;
    const target = state.camera.position.y > 100 ? 0.0012 : 0.005;
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * 2.5);
    fog.density += (target - fog.density) * k;
  });
  return null;
}

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
    const { station, localT } = useJourney.getState();
    const delta = Math.min(dt, 0.05);

    // per-segment mapping: station i travels rail segment i, so every station
    // lands exactly on its keyframe (page progress ≠ curve arc length).
    // Station 1 holds for the vault reveal; station 2 holds so the fab stays
    // framed; station 3 bypasses the curve for a straight z-locked avenue
    // drive with a ~20u lead ahead of each igniting gate.
    let l = localT;
    if (station === 1) {
      // hold AT the receipts keyframe (85,20,60) — the vault row is staged for it
      l = l < 0.85 ? 0 : ((l - 0.85) / 0.15) * 0.9;
    } else if (station === 2) {
      // hold AT the keyframe (fab view), exit late
      l = l < 0.8 ? 0 : ((l - 0.8) / 0.2) * 0.9;
    } else if (station === 4) {
      // scheduler hold; earlier exit gives the lift-off climb more runway
      l = l < 0.65 ? 0 : ((l - 0.65) / 0.35) * 0.9;
    }
    if (station === 3) {
      scratch.current.set(72 - 124 * localT, 7, -95);
    } else {
      const segments = RAIL_POINTS.length - 1;
      const u = Math.min(1, (station + l) / segments);
      curve.getPoint(u, scratch.current);
    }
    easing.damp3(pos.current, scratch.current, 0.45, delta);

    const nextStation = Math.min(station + 1, LOOK_TARGETS.length - 1);
    // holds freeze the look-at too; the avenue holds its vanishing point until exit
    const lookLerp =
      station >= 1 && station <= 4
        ? localT < 0.85
          ? 0
          : ((localT - 0.85) / 0.15) * 0.5
        : localT * 0.5;
    scratch.current
      .fromArray(LOOK_TARGETS[station])
      .lerp(scratch2.current.fromArray(LOOK_TARGETS[nextStation]), lookLerp);
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
      <Suspense fallback={null}>
        <EnvironmentLight />
      </Suspense>
      <City density={tier === 'lite' ? 0.6 : 1} />
      <CameraRig />
      <FogRig />
      {tier === 'full' ? (
        <EffectComposer>
          <Bloom mipmapBlur intensity={0.7} luminanceThreshold={0.9} luminanceSmoothing={0.2} />
          <Vignette darkness={0.55} offset={0.28} />
        </EffectComposer>
      ) : null}
    </Canvas>
  );
}
