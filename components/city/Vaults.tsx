'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useJourney } from '@/lib/journey';

/** row calibrated from measured screen positions at the held station camera
    (fit: start ≈ (85.7,−29.9), step ≈ (+12.8,−4.3) — vault i centers under card i) */
export const VAULTS = [
  { x: 86, z: -30, color: '#f26f21', value: '$30K' },
  { x: 98.8, z: -34.3, color: '#7c3aed', value: '$8K' },
  { x: 111.6, z: -38.6, color: '#9be15d', value: '100+' },
  { x: 124.4, z: -42.9, color: '#00a0dc', value: '−60%' }
] as const;

/** door-open progress for vault i, shared with the DOM receipt sync */
export function vaultOpenTarget(station: number, localT: number, index: number): number {
  if (station > 1) return 1;
  if (station < 1) return 0;
  // reveal happens entirely inside the camera-hold window (localT 0.3–0.85)
  return Math.max(0, Math.min(1, (localT - (0.32 + index * 0.12)) / 0.09));
}

function Vault({
  x,
  z,
  color,
  value,
  index
}: {
  x: number;
  z: number;
  color: string;
  value: string;
  index: number;
}) {
  const doorRef = useRef<THREE.Mesh>(null);
  const plaqueRef = useRef<THREE.MeshStandardMaterial>(null);
  const padRef = useRef<THREE.MeshStandardMaterial>(null);
  const edgeRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const open = useRef(0);
  // face the HELD station camera (≈ 110, 17, 25 on the rail during the dwell)
  const rotY = Math.atan2(110 - x, 25 - z);

  useFrame((_, dt) => {
    const { station, localT, boot, receiptHover } = useJourney.getState();
    const target = vaultOpenTarget(station, localT, index);
    const speed = 1 - Math.exp(-Math.min(dt, 0.05) * 5);
    open.current += (target - open.current) * speed;

    // strike the set: all vault light fades to zero leaving the station,
    // so chapter 02's establishing shot carries no vault color
    let exitFade = 1;
    if (station > 1) exitFade = 0;
    else if (station === 1) {
      const t = Math.max(0, Math.min(1, (localT - 0.82) / 0.16));
      exitFade = 1 - t * t * (3 - 2 * t);
    }
    const bootRamp = Math.max(0, Math.min(1, (boot - 0.3) / 0.25));
    // hovering this vault's DOM card flares it — one linked system, not two
    const hovered = receiptHover === index;
    const light = Math.max(open.current, hovered ? 0.6 : 0) * exitFade * bootRamp;

    if (doorRef.current) doorRef.current.position.x = -open.current * 7.0;
    // one-number discipline: the vault reveals LIGHT in its org color; the DOM
    // card owns the number. Interior glow > frame > pad.
    if (plaqueRef.current) plaqueRef.current.emissiveIntensity = 0.04 * exitFade + light * 1.5;
    if (padRef.current) padRef.current.emissiveIntensity = 0.05 * exitFade + light * 0.22;
    edgeRefs.current.forEach((m) => {
      if (m)
        m.emissiveIntensity =
          (0.16 + open.current * 0.85 + (hovered ? 0.7 : 0)) * exitFade * bootRamp;
    });
  });

  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      {/* thin inset ring — seats the vault without flooding the frame with color */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 1]}>
        <ringGeometry args={[5.9, 6.5, 40]} />
        <meshStandardMaterial
          ref={padRef}
          color="#050805"
          emissive={color}
          emissiveIntensity={0.05}
          roughness={0.85}
        />
      </mesh>
      {/* vault body — visible dark mass (front face at z=3.5) */}
      <mesh position={[0, 6.5, 0]}>
        <boxGeometry args={[10, 13, 7]} />
        <meshStandardMaterial color="#0c130c" roughness={0.5} metalness={0.55} />
      </mesh>
      {/* interior glow — the vault opens onto light in its org color */}
      <mesh position={[0, 6.5, 3.62]}>
        <planeGeometry args={[6.6, 7.6]} />
        <meshStandardMaterial ref={plaqueRef} emissive={color} emissiveIntensity={0.04} color="#020402" />
      </mesh>
      {/* sliding door — brushed metal so its motion reads against the body */}
      <mesh ref={doorRef} position={[0, 6.5, 4.0]}>
        <boxGeometry args={[7.6, 8.6, 0.45]} />
        <meshStandardMaterial color="#161d16" roughness={0.35} metalness={0.7} />
      </mesh>
      {/* org-colored edge light framing the door */}
      {(
        [
          { p: [0, 11.2, 4.05] as [number, number, number], s: [8.4, 0.3, 0.3] as [number, number, number] },
          { p: [-4.15, 6.5, 4.05] as [number, number, number], s: [0.3, 9.2, 0.3] as [number, number, number] },
          { p: [4.15, 6.5, 4.05] as [number, number, number], s: [0.3, 9.2, 0.3] as [number, number, number] }
        ]
      ).map((strip, i) => (
        <mesh key={i} position={strip.p}>
          <boxGeometry args={strip.s} />
          <meshStandardMaterial
            ref={(m) => {
              edgeRefs.current[i] = m;
            }}
            color="#050805"
            emissive={color}
            emissiveIntensity={0}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function Vaults() {
  return (
    <group>
      {VAULTS.map((v, i) => (
        <Vault key={v.value} x={v.x} z={v.z} color={v.color} value={v.value} index={i} />
      ))}
    </group>
  );
}
