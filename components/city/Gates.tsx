'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useJourney } from '@/lib/journey';

/** gate order matches the road stops: FPT, NSF, Adobe, Zolli, NVIDIA */
export const GATES = [
  { x: 38, color: '#f26f21' },
  { x: 18, color: '#00a0dc' },
  { x: -2, color: '#fa0f00' },
  { x: -22, color: '#9be15d' },
  { x: -42, color: '#76b900' }
] as const;

const AVENUE_Z = -95;
/** ignition threshold for gate i within station 3 (3D timing) */
export function gateThreshold(index: number): number {
  return 0.08 + index * 0.18;
}

function Gate({ x, color, index }: { x: number; color: string; index: number }) {
  const matRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const lightRef = useRef<THREE.PointLight>(null);
  const level = useRef(0.3);

  useFrame((state, dt) => {
    const { station, localT, boot } = useJourney.getState();
    const delta = Math.min(dt, 0.05);
    const speed = 1 - Math.exp(-delta * 4);
    const bootRamp = Math.max(0, Math.min(1, (boot - 0.35) / 0.25));
    const t = gateThreshold(index);

    // standby 0.3 (tubes read even unlit) -> ignite 2.2 -> settle ~25% once passed
    let target = 0.3;
    if (station > 3) target = 0.55;
    else if (station === 3) {
      if (localT >= t && localT < t + 0.12) target = 2.2;
      else if (localT >= t + 0.12) target = 0.55;
    }
    level.current += (target - level.current) * speed;

    // a gate about to swallow the camera would flood the frame and occlude the
    // DOM year/cards, so it fades out inside ~16u of the camera
    const prox = Math.abs(state.camera.position.x - x);
    // fade begins ~32u out, floor by ~12u — frames never cross the DOM at full opacity
    const nearFade = station === 3 ? Math.max(0.1, Math.min(1, (prox - 10) / 22)) : 1;

    // emissive dims by nearFade² so a crossing tube dims perceptually (bloom
    // would otherwise keep a saturated core even at low alpha)
    const intensity = level.current * bootRamp * nearFade * nearFade;
    matRefs.current.forEach((m) => {
      if (m) {
        m.emissiveIntensity = intensity;
        m.opacity = 0.15 + 0.85 * nearFade;
      }
    });
    // igniting gate throws a colored pool on the road
    if (lightRef.current) lightRef.current.intensity = Math.max(0, intensity - 0.6) * 55;
  });

  return (
    <group position={[x, 0, AVENUE_Z]}>
      <pointLight ref={lightRef} position={[0, 7, 0]} color={color} intensity={0} distance={30} decay={2} />
      {/* two columns + crossbar as emissive tubes */}
      <mesh position={[0, 6, -7]}>
        <cylinderGeometry args={[0.22, 0.22, 12, 10]} />
        <meshStandardMaterial
          ref={(m) => {
            matRefs.current[0] = m;
          }}
          color="#060906"
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={1}
        />
      </mesh>
      <mesh position={[0, 6, 7]}>
        <cylinderGeometry args={[0.22, 0.22, 12, 10]} />
        <meshStandardMaterial
          ref={(m) => {
            matRefs.current[1] = m;
          }}
          color="#060906"
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={1}
        />
      </mesh>
      <mesh position={[0, 12.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 14.4, 10]} />
        <meshStandardMaterial
          ref={(m) => {
            matRefs.current[2] = m;
          }}
          color="#060906"
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={1}
        />
      </mesh>
      {/* base pads seat the columns */}
      <mesh position={[0, 0.25, -7]}>
        <boxGeometry args={[1.4, 0.5, 1.4]} />
        <meshStandardMaterial color="#0a0f0a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.25, 7]}>
        <boxGeometry args={[1.4, 0.5, 1.4]} />
        <meshStandardMaterial color="#0a0f0a" roughness={0.8} />
      </mesh>
    </group>
  );
}

export default function Gates() {
  return (
    <group>
      {GATES.map((gate, i) => (
        <Gate key={gate.color} x={gate.x} color={gate.color} index={i} />
      ))}
    </group>
  );
}
