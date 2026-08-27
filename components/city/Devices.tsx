'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';

/**
 * Procedural device props for the NOW chapter — a MacBook, a tower PC, and a
 * PCIe GPU card (the CPU is the existing ChipModel). Built M.C.M.T like the
 * chip: macro silhouette first, then the few components that carry identity
 * (open lid + glowing keyboard = laptop; glass side + fans = tower; twin
 * axial fans + fin stack = GPU card). Brand-neutral: no logos.
 */

const ALUMINUM = { color: '#b7bdc4', metalness: 0.85, roughness: 0.38, envMapIntensity: 1.1 };
const CASE_DARK = { color: '#12161b', metalness: 0.7, roughness: 0.45, envMapIntensity: 0.9 };

function makeTerminalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#04120a';
  ctx.fillRect(0, 0, 512, 320);
  // title bar
  ctx.fillStyle = '#0a1f12';
  ctx.fillRect(0, 0, 512, 34);
  ctx.fillStyle = '#9be15d';
  ctx.font = '600 17px "JetBrains Mono", monospace';
  ctx.fillText('flashml — worker', 16, 24);
  // terminal lines
  const lines = [
    '$ flashml worker --join cluster',
    '> connected · pull mode',
    '> claimed job 0412  [██████____]',
    '> claimed job 0413  [████______]',
    '> throughput 0.27x · alive'
  ];
  ctx.font = '500 19px "JetBrains Mono", monospace';
  lines.forEach((line, i) => {
    ctx.fillStyle = i === 0 ? '#e6f2dc' : '#8fd45f';
    ctx.fillText(line, 16, 74 + i * 40);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeKeyboardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#191d22';
  ctx.fillRect(0, 0, 512, 256);
  // key grid, 14 x 5 + spacebar row
  ctx.fillStyle = '#23282e';
  const kw = 30;
  const kh = 30;
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 14; col += 1) {
      ctx.beginPath();
      ctx.roundRect(14 + col * (kw + 5), 14 + row * (kh + 6), kw, kh, 4);
      ctx.fill();
    }
  }
  ctx.beginPath();
  ctx.roundRect(14 + 4 * 35, 14 + 5 * 36, 6 * 35 - 5, kh, 4);
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** open laptop, base ~8 x 5.6, lid tilted back — the SLOW worker */
export function MacBookModel() {
  const screen = useMemo(() => makeTerminalTexture(), []);
  const keys = useMemo(() => makeKeyboardTexture(), []);
  return (
    <group>
      {/* base slab */}
      <RoundedBox args={[8, 0.4, 5.6]} radius={0.12} smoothness={2} position={[0, 0.2, 0]}>
        <meshStandardMaterial {...ALUMINUM} />
      </RoundedBox>
      {/* keyboard field + trackpad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.41, -0.95]}>
        <planeGeometry args={[7, 3]} />
        <meshStandardMaterial map={keys} roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.41, 1.85]}>
        <planeGeometry args={[3, 1.5]} />
        <meshStandardMaterial color="#9fa6ad" metalness={0.7} roughness={0.5} />
      </mesh>
      {/* lid, hinged at the back edge, open ~110 degrees */}
      <group position={[0, 0.35, -2.75]} rotation={[1.22, 0, 0]}>
        <RoundedBox args={[8, 0.28, 5.4]} radius={0.12} smoothness={2} position={[0, 0, -2.7]}>
          <meshStandardMaterial {...ALUMINUM} />
        </RoundedBox>
        {/* screen faces the keyboard/camera */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, -2.7]}>
          <planeGeometry args={[7.3, 4.7]} />
          <meshStandardMaterial
            map={screen}
            emissive="#d9ffd0"
            emissiveMap={screen}
            emissiveIntensity={1.5}
            color="#000000"
          />
        </mesh>
      </group>
    </group>
  );
}

function Fan({
  radius,
  position,
  speed,
  accent
}: {
  radius: number;
  position: [number, number, number];
  speed: number;
  accent: string;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z -= Math.min(dt, 0.05) * speed;
  });
  return (
    <group position={position}>
      {/* lit rim reads as an RGB fan ring */}
      <mesh>
        <torusGeometry args={[radius, 0.08, 8, 28]} />
        <meshStandardMaterial color="#0a0f0a" emissive={accent} emissiveIntensity={1.3} />
      </mesh>
      <group ref={ref}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <mesh key={i} rotation={[0, 0, (i / 7) * Math.PI * 2]} position={[0, 0, 0]}>
            <boxGeometry args={[radius * 1.7, 0.22, 0.05]} />
            <meshStandardMaterial color="#20262c" roughness={0.6} metalness={0.4} />
          </mesh>
        ))}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[radius * 0.3, radius * 0.3, 0.14, 12]} />
          <meshStandardMaterial color="#171b20" roughness={0.5} metalness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

/** glass-sided tower PC, ~5.5 x 10 x 9 — the FAST worker */
export function TowerModel({ accent }: { accent: string }) {
  return (
    <group>
      {/* case shell — front face recedes to z=3.8 so the lit interior
          components (z 4.1–4.35) sit IN FRONT of it, behind the glass */}
      <RoundedBox args={[5.5, 10, 7.6]} radius={0.18} smoothness={2} position={[0, 5, -0.7]}>
        <meshStandardMaterial {...CASE_DARK} />
      </RoundedBox>
      {/* glass front panel (faces the camera) with interior on show */}
      <mesh position={[0, 5.4, 4.53]}>
        <planeGeometry args={[4.6, 8.2]} />
        <meshStandardMaterial color="#0a0e14" metalness={0.9} roughness={0.1} transparent opacity={0.15} />
      </mesh>
      {/* bay frame enclosing the glass so the front window reads as part of the case */}
      {(
        [
          { p: [0, 9.75, 4.15] as [number, number, number], s: [5.5, 0.5, 0.9] as [number, number, number] },
          { p: [0, 1.05, 4.15] as [number, number, number], s: [5.5, 0.5, 0.9] as [number, number, number] },
          { p: [-2.6, 5.4, 4.15] as [number, number, number], s: [0.4, 8.2, 0.9] as [number, number, number] },
          { p: [2.6, 5.4, 4.15] as [number, number, number], s: [0.4, 8.2, 0.9] as [number, number, number] }
        ]
      ).map((f, i) => (
        <mesh key={i} position={f.p}>
          <boxGeometry args={f.s} />
          <meshStandardMaterial {...CASE_DARK} />
        </mesh>
      ))}
      {/* interior: horizontal GPU with lit edge, vertical RGB strip, PSU shroud */}
      <mesh position={[0, 5.6, 4.1]}>
        <boxGeometry args={[3.9, 0.5, 0.7]} />
        <meshStandardMaterial color="#151a20" roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh position={[0, 5.32, 4.15]}>
        <boxGeometry args={[3.9, 0.08, 0.62]} />
        <meshStandardMaterial color="#0a0f0a" emissive={accent} emissiveIntensity={1.6} />
      </mesh>
      <mesh position={[-1.95, 5.4, 4.2]}>
        <boxGeometry args={[0.12, 8, 0.12]} />
        <meshStandardMaterial color="#0a0f0a" emissive={accent} emissiveIntensity={1.1} />
      </mesh>
      <mesh position={[0, 1.6, 4.2]}>
        <boxGeometry args={[4.4, 1.6, 0.5]} />
        <meshStandardMaterial color="#171b20" roughness={0.55} metalness={0.5} />
      </mesh>
      {/* twin intake fans behind the glass */}
      <Fan radius={0.95} position={[0.9, 7.6, 4.35]} speed={9} accent={accent} />
      <Fan radius={0.95} position={[0.9, 3.9, 4.35]} speed={8.2} accent={accent} />
      {/* power LED */}
      <mesh position={[2.2, 9.3, 4.56]}>
        <boxGeometry args={[0.25, 0.08, 0.05]} />
        <meshStandardMaterial color="#0a0f0a" emissive="#e6f2dc" emissiveIntensity={1.6} />
      </mesh>
    </group>
  );
}

/** standing PCIe GPU card, ~9.4 x 4.4 face-on — the MID worker (dies each cycle) */
export function GpuCardModel({ accent }: { accent: string }) {
  return (
    <group>
      {/* shroud face */}
      <RoundedBox args={[9.4, 4.4, 1.3]} radius={0.16} smoothness={2}>
        <meshStandardMaterial {...CASE_DARK} />
      </RoundedBox>
      {/* accent identity stripe along the top edge */}
      <mesh position={[0, 2.06, 0.28]}>
        <boxGeometry args={[8.6, 0.14, 0.9]} />
        <meshStandardMaterial color="#0a0f0a" emissive={accent} emissiveIntensity={1.4} />
      </mesh>
      {/* twin axial fans */}
      <Fan radius={1.45} position={[-2.25, -0.1, 0.72]} speed={10} accent={accent} />
      <Fan radius={1.45} position={[2.25, -0.1, 0.72]} speed={11} accent={accent} />
      {/* radiator fin stack peeking between the fans */}
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} position={[-0.45 + i * 0.1, -0.1, 0.68]}>
          <boxGeometry args={[0.04, 2.6, 0.5]} />
          <meshStandardMaterial color="#3a4149" metalness={0.85} roughness={0.35} />
        </mesh>
      ))}
      {/* gold PCIe edge connector along the bottom */}
      <mesh position={[0.6, -2.32, 0]}>
        <boxGeometry args={[5.4, 0.35, 0.5]} />
        <meshStandardMaterial color="#e8bd4a" metalness={1} roughness={0.3} emissive="#7a5c12" emissiveIntensity={0.25} />
      </mesh>
      {/* IO bracket */}
      <mesh position={[-4.85, 0, 0]}>
        <boxGeometry args={[0.18, 4.6, 1.1]} />
        <meshStandardMaterial color="#8f979e" metalness={0.9} roughness={0.35} />
      </mesh>
    </group>
  );
}
