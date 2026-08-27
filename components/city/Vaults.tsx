'use client';

import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { useJourney } from '@/lib/journey';

/**
 * Bank-style vault monuments: a circular steel door with radial spokes, rim
 * bolts, and a hub, swinging open on a hinge to spill org-color light. The
 * DOM readout owns the numbers (one-number discipline); vaults carry only
 * the org identity. Row sits ~40u from the held receipts camera (85,20,60).
 */
export const VAULTS = [
  { x: 86, z: 17, color: '#f26f21', org: 'FPT SOFTWARE' },
  { x: 96, z: 21.5, color: '#7c3aed', org: 'RUNPOD' },
  { x: 106, z: 26, color: '#9be15d', org: 'ZOLLI LABS' },
  { x: 116, z: 30.5, color: '#00a0dc', org: 'NSF · IEEE' }
] as const;

/**
 * Evenly spread door thresholds across the (now tall) receipts scroll track —
 * each number owns ~1/6 of the chapter so viewers have time to read it.
 * Must stay in sync with RECEIPT_THRESHOLDS in components/Receipts.tsx.
 */
export const VAULT_THRESHOLDS = [0.14, 0.31, 0.48, 0.65] as const;

/** door-open progress for vault i — inside the camera-hold window */
export function vaultOpenTarget(station: number, localT: number, index: number): number {
  if (station > 1) return 1;
  if (station < 1) return 0;
  return Math.max(0, Math.min(1, (localT - VAULT_THRESHOLDS[index]) / 0.08));
}

function makeOrgTexture(label: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 512, 96);
  ctx.font = '600 44px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(240,244,236,0.9)';
  ctx.fillText(label, 256, 50);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const STEEL = { color: '#9aa598', metalness: 0.92, roughness: 0.32, envMapIntensity: 1.2 };

function Vault({
  x,
  z,
  color,
  org,
  index
}: {
  x: number;
  z: number;
  color: string;
  org: string;
  index: number;
}) {
  const doorRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.MeshStandardMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const edgeRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const open = useRef(0);
  const label = useMemo(() => makeOrgTexture(org), [org]);
  // face the held receipts camera
  const rotY = Math.atan2(85 - x, 60 - z);

  useFrame((_, dt) => {
    const { station, localT, boot, receiptHover, receiptFocus } = useJourney.getState();
    const target = vaultOpenTarget(station, localT, index);
    const speed = 1 - Math.exp(-Math.min(dt, 0.05) * 5);
    open.current += (target - open.current) * speed;

    // (the readout's focus is derived deterministically from scroll in
    // components/Receipts.tsx — vaults only animate; no per-vault announces)

    // strike the set on exit
    let exitFade = 1;
    if (station > 1) exitFade = 0;
    else if (station === 1) {
      const t = Math.max(0, Math.min(1, (localT - 0.84) / 0.14));
      exitFade = 1 - t * t * (3 - 2 * t);
    }
    const bootRamp = Math.max(0, Math.min(1, (boot - 0.3) / 0.25));
    const spotlight = receiptFocus === index || receiptHover === index;
    const light = Math.max(open.current, spotlight ? 0.5 : 0) * exitFade * bootRamp;

    // the circular door swings on its hinge
    if (doorRef.current) doorRef.current.rotation.y = -open.current * 1.9;
    if (glowRef.current) glowRef.current.emissiveIntensity = 0.06 + light * 2.6;
    if (lightRef.current) lightRef.current.intensity = light * 46;
    edgeRefs.current.forEach((m) => {
      if (m) m.emissiveIntensity = (0.14 + light * 1.1) * exitFade * bootRamp;
    });
  });

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    const target = event.nativeEvent.target as HTMLElement | null;
    if (target?.closest('button, a, .receipt-readout, .site-nav, .casebook')) return;
    event.stopPropagation();
    useJourney.getState().setReceiptFocus(index);
  };

  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]} onClick={onClick}>
      {/* monument slab */}
      <RoundedBox args={[10, 13, 2.6]} radius={0.12} smoothness={2} position={[0, 6.5, 0]}>
        <meshStandardMaterial color="#0d130f" roughness={0.5} metalness={0.55} envMapIntensity={0.8} />
      </RoundedBox>
      {/* org-color edge frame */}
      {(
        [
          { p: [0, 13.15, 0] as [number, number, number], s: [10.2, 0.22, 2.7] as [number, number, number] },
          { p: [-5.05, 6.5, 0] as [number, number, number], s: [0.22, 13, 2.7] as [number, number, number] },
          { p: [5.05, 6.5, 0] as [number, number, number], s: [0.22, 13, 2.7] as [number, number, number] }
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
      {/* etched org nameplate */}
      <mesh position={[0, 11.6, 1.36]}>
        <planeGeometry args={[7, 1.3]} />
        <meshStandardMaterial map={label} transparent emissive="#f0f4ec" emissiveMap={label} emissiveIntensity={0.4} color="#000000" />
      </mesh>
      {/* interior glow disc revealed by the door */}
      <mesh position={[0, 5.6, 1.15]}>
        <circleGeometry args={[3.15, 36]} />
        <meshStandardMaterial ref={glowRef} color="#040604" emissive={color} emissiveIntensity={0.06} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 6, 5]} color={color} intensity={0} distance={26} decay={2} />
      {/* circular steel door, hinged at its left edge */}
      <group position={[-3.5, 5.6, 1.45]}>
        <group ref={doorRef}>
          <group position={[3.5, 0, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[3.3, 3.3, 0.5, 32]} />
              <meshStandardMaterial {...STEEL} />
            </mesh>
            <mesh>
              <torusGeometry args={[3.05, 0.16, 10, 40]} />
              <meshStandardMaterial {...STEEL} roughness={0.25} />
            </mesh>
            {/* radial spokes */}
            {[0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4].map((angle) => (
              <mesh key={angle} rotation={[0, 0, angle]} position={[0, 0, 0.28]}>
                <boxGeometry args={[5.6, 0.26, 0.14]} />
                <meshStandardMaterial {...STEEL} roughness={0.28} />
              </mesh>
            ))}
            {/* hub */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.34]}>
              <cylinderGeometry args={[0.75, 0.75, 0.3, 18]} />
              <meshStandardMaterial {...STEEL} roughness={0.2} />
            </mesh>
            {/* rim bolts */}
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
              return (
                <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[Math.cos(a) * 2.55, Math.sin(a) * 2.55, 0.28]}>
                  <cylinderGeometry args={[0.16, 0.16, 0.2, 10]} />
                  <meshStandardMaterial {...STEEL} roughness={0.22} />
                </mesh>
              );
            })}
          </group>
        </group>
      </group>
      {/* seated ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 1.6]}>
        <ringGeometry args={[5.4, 5.9, 40]} />
        <meshStandardMaterial color="#050805" emissive={color} emissiveIntensity={0.08} roughness={0.85} />
      </mesh>
    </group>
  );
}

export default function Vaults() {
  return (
    <group>
      {VAULTS.map((v, i) => (
        <Vault key={v.org} x={v.x} z={v.z} color={v.color} org={v.org} index={i} />
      ))}
    </group>
  );
}
