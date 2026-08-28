'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useJourney } from '@/lib/journey';
import { IDENTITY_QUAT, WORLD_D, WORLD_W } from '@/components/city/cityData';
import { makeSilkscreenTexture } from '@/components/city/textures';

/** the I/O corner — where the uplink leaves the die */
const UPLINK = { x: 210, z: 170 };

/**
 * M8 — the reveal: from orbit the city turns out to be one chip on a PCB.
 * Board, package rim, and gold pin pads fade in only at the lift-off station.
 */
export default function Board() {
  const fadeMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const beamMat = useRef<THREE.MeshStandardMaterial>(null);
  const reveal = useRef(0);
  let fadeIdx = 0;

  const pads = useMemo(() => {
    const list: { x: number; z: number; horizontal: boolean }[] = [];
    for (let x = -260; x <= 260; x += 40) {
      list.push({ x, z: -(WORLD_D / 2 + 42), horizontal: true });
      list.push({ x, z: WORLD_D / 2 + 42, horizontal: true });
    }
    for (let z = -220; z <= 220; z += 40) {
      list.push({ x: -(WORLD_W / 2 + 42), z, horizontal: false });
      list.push({ x: WORLD_W / 2 + 42, z, horizontal: false });
    }
    return list;
  }, []);

  const padRef = useRef<THREE.InstancedMesh>(null);
  const silkscreen = useMemo(() => makeSilkscreenTexture(), []);

  useFrame((state, dt) => {
    const { station, localT, boot } = useJourney.getState();
    const delta = Math.min(dt, 0.05);
    const k = 1 - Math.exp(-delta * 3);
    const bootRamp = Math.max(0, Math.min(1, (boot - 0.3) / 0.3));

    const target = station === 5 ? Math.min(1, localT * 1.8) : station > 5 ? 1 : 0;
    reveal.current += (target - reveal.current) * k;

    fadeMats.current.forEach((m) => {
      if (m) m.opacity = reveal.current * (m.userData.maxOpacity ?? 1);
    });
    if (padRef.current) {
      const m = padRef.current.material as THREE.MeshStandardMaterial;
      m.opacity = reveal.current;
    }

    // uplink beam blinks on the terminal caret's ~0.9s cycle
    if (beamMat.current) {
      const on = state.clock.elapsedTime % 0.9 < 0.45;
      const stationBoost = station >= 4 ? 1 : 0.25;
      beamMat.current.emissiveIntensity = (on ? 2.4 : 0.35) * stationBoost * bootRamp;
      beamMat.current.opacity = 0.25 + 0.55 * (on ? 1 : 0.4) * stationBoost * bootRamp;
    }
  });

  useLayoutEffect(() => {
    const mesh = padRef.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const scale = new THREE.Vector3();
    pads.forEach((pad, i) => {
      pos.set(pad.x, 0.4, pad.z);
      scale.set(pad.horizontal ? 16 : 26, 0.8, pad.horizontal ? 26 : 16);
      matrix.compose(pos, IDENTITY_QUAT, scale);
      mesh.setMatrixAt(i, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [pads]);

  const registerFade = (maxOpacity: number) => (m: THREE.MeshStandardMaterial | null) => {
    if (m) {
      m.userData.maxOpacity = maxOpacity;
      fadeMats.current[fadeIdx++] = m;
    }
  };

  return (
    <group>
      {/* the PCB itself */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
        <planeGeometry args={[1500, 1300]} />
        <meshStandardMaterial
          ref={registerFade(0.96)}
          color="#04100a"
          roughness={0.85}
          metalness={0.2}
          transparent
          opacity={0}
        />
      </mesh>
      {/* R5 silkscreen: the printed legend layer — part numbers, a rev stamp,
          routing ticks, dashed courtyards. Off-white ink at 0.22 opacity, so it
          reads as printing on the substrate and adds no third accent hue. The
          ink is drawn entirely OUTSIDE the die footprint, and the plane sits 0.3u
          above the substrate — the orbit camera is ~600u out, where the depth
          buffer resolves ~0.04u, so a tighter gap would z-fight. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]} renderOrder={1}>
        <planeGeometry args={[1500, 1300]} />
        <meshStandardMaterial
          ref={registerFade(0.22)}
          depthWrite={false}
          map={silkscreen}
          color="#e2e8dc"
          emissive="#e2e8dc"
          emissiveMap={silkscreen}
          emissiveIntensity={0.5}
          roughness={0.9}
          metalness={0}
          transparent
          opacity={0}
        />
      </mesh>
      {/* package rim around the die */}
      {(
        [
          { p: [0, 2, -(WORLD_D / 2 + 8)] as [number, number, number], s: [WORLD_W + 32, 5, 14] as [number, number, number] },
          { p: [0, 2, WORLD_D / 2 + 8] as [number, number, number], s: [WORLD_W + 32, 5, 14] as [number, number, number] },
          { p: [-(WORLD_W / 2 + 8), 2, 0] as [number, number, number], s: [14, 5, WORLD_D + 32] as [number, number, number] },
          { p: [WORLD_W / 2 + 8, 2, 0] as [number, number, number], s: [14, 5, WORLD_D + 32] as [number, number, number] }
        ]
      ).map((rim, i) => (
        <mesh key={i} position={rim.p}>
          <boxGeometry args={rim.s} />
          <meshStandardMaterial
            ref={registerFade(0.92)}
            color="#0c0f0c"
            emissive="#2a5a40"
            emissiveIntensity={0.5}
            roughness={0.6}
            metalness={0.4}
            transparent
            opacity={0}
          />
        </mesh>
      ))}
      {/* gold pin pads outside the die. R5: real ENIG gold is a MIRROR — full
          metalness with a tight roughness and a 1.6 env response lets the night
          HDRI do the selling, so the emissive can drop from 0.65 to 0.3 and stop
          reading as four glowing bars. */}
      <instancedMesh ref={padRef} args={[undefined, undefined, pads.length]} frustumCulled={false}>
        <boxGeometry />
        <meshStandardMaterial
          color="#d8b45a"
          emissive="#c9a227"
          emissiveIntensity={0.3}
          roughness={0.28}
          metalness={1}
          envMapIntensity={1.6}
          transparent
          opacity={0}
        />
      </instancedMesh>
      {/* uplink beam at the I/O corner — blinks with the terminal caret */}
      <mesh position={[UPLINK.x, 160, UPLINK.z]}>
        <boxGeometry args={[0.9, 320, 0.9]} />
        <meshStandardMaterial
          ref={beamMat}
          color="#0a120a"
          emissive="#b8ff72"
          emissiveIntensity={0}
          transparent
          opacity={0.3}
        />
      </mesh>
      <mesh position={[UPLINK.x, 1.2, UPLINK.z]}>
        <cylinderGeometry args={[3.2, 4.2, 2.4, 12]} />
        <meshStandardMaterial color="#0c120c" emissive="#9be15d" emissiveIntensity={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}
