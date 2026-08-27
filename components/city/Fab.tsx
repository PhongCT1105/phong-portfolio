'use client';

import { useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useJourney } from '@/lib/journey';
import ChipModel from '@/components/city/ChipModel';

/** order matches SITE_CONTENT.projects */
const CHIPS = [
  { slug: 'flashml', label: 'FlashML', sub: 'A-FLASHML-47 · ZOLLI', color: '#9be15d' },
  { slug: 'captain-ddoski', label: 'Ddoski', sub: 'A-DDOSKI-02 · BERKELEY', color: '#7ba7ff' },
  { slug: 'on-device-qa', label: 'OnDevice', sub: 'A-ONNX-163MS · ARM64', color: '#ffb45a' },
  { slug: 'hospital-nav', label: 'HospNav', sub: 'A-ASTAR-147 · WPI', color: '#e04050' }
] as const;

/** interactive display row ~38u ahead of the held work camera (150,16,-30) */
const ROW = { x: 167, z: -64 };
const ROW_ROT = Math.atan2(150 - ROW.x, -30 - ROW.z);
/** backdrop hall deep in the fab district */
const HALL = { x: 196, z: -128 };
const HALL_ROT = Math.atan2(150 - HALL.x, -30 - HALL.z);
const RIB_XS = [-26, -13, 0, 13, 26];

/** ignore raycast clicks that actually landed on interactive DOM */
function domGuard(event: ThreeEvent<MouseEvent>): boolean {
  const target = event.nativeEvent.target as HTMLElement | null;
  return !!target?.closest('button, a, input, .casebook, .shelf__caption, .site-nav');
}

function InteractiveChip({
  index,
  slug,
  label,
  sub,
  color
}: {
  index: number;
  slug: string;
  label: string;
  sub: string;
  color: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const rise = useRef(0);
  const glow = useRef(0);
  const scale = useRef(1);
  const hover = useRef(false);

  useFrame((state, dt) => {
    const { station, workFocus, workOpen, boot } = useJourney.getState();
    const delta = Math.min(dt, 0.05);
    const speed = 1 - Math.exp(-delta * 5);

    const focused = workFocus === index;
    const opened = workOpen === slug;
    const atStation = station === 2;
    const bootRamp = Math.max(0, Math.min(1, (boot - 0.4) / 0.2));

    const glowTarget =
      bootRamp * (opened ? 1 : focused && atStation ? 0.9 : hover.current ? 0.45 : 0.06);
    glow.current += (glowTarget - glow.current) * speed;
    rise.current += ((opened ? 1.6 : focused && atStation ? 0.5 : 0) - rise.current) * speed;
    // the focused chip DOMINATES: ~1.85x scale vs its dim siblings
    scale.current += (((focused && atStation) || opened ? 1.85 : 1) - scale.current) * speed;

    if (groupRef.current) {
      groupRef.current.position.y = 3.4 + rise.current;
      groupRef.current.scale.setScalar(scale.current);
    }
    if (lightRef.current) lightRef.current.intensity = glow.current * 60;
    if (spinRef.current) {
      // focused chip turntables slowly, like a museum piece
      const spinSpeed = opened ? 0.5 : focused && atStation ? 0.22 : 0;
      spinRef.current.rotation.y += spinSpeed * delta;
      if (!focused && !opened) {
        // ease back to the resting pose
        spinRef.current.rotation.y +=
          (Math.round(spinRef.current.rotation.y / (Math.PI * 2)) * Math.PI * 2 -
            spinRef.current.rotation.y) *
          speed;
      }
    }
    document.body.style.cursor = hover.current ? 'pointer' : '';
  });

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    if (domGuard(event)) return;
    event.stopPropagation();
    const state = useJourney.getState();
    if (state.workFocus === index) {
      state.setWork(index, slug);
      window.history.replaceState(null, '', `#work/${slug}`);
    } else {
      state.setWork(index, null);
    }
  };

  const lx = (index - (CHIPS.length - 1) / 2) * 9.6;

  return (
    <group position={[lx, 0, 0]}>
      {/* pedestal */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[3, 3, 3]} />
        <meshStandardMaterial color="#0c120c" roughness={0.55} metalness={0.45} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 7.5, 1.5]} color={color} intensity={0} distance={20} decay={2} />
      {/* resting pose shows the etched label; the focused chip turntables,
          revealing the gold pin field + die lid as it spins */}
      <group ref={groupRef} position={[0, 3.4, 0]}>
        <group ref={spinRef}>
          <group
            rotation={[-1.05, 0, 0]}
            onClick={onClick}
            onPointerOver={(event) => {
              if (domGuard(event as unknown as ThreeEvent<MouseEvent>)) return;
              event.stopPropagation();
              hover.current = true;
            }}
            onPointerOut={() => {
              hover.current = false;
            }}
          >
            <ChipModel label={label} sub={sub} accent={color} />
          </group>
        </group>
      </group>
    </group>
  );
}

/** backdrop glass hall (non-interactive scenery) */
function HallBackdrop() {
  const ribRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  useFrame(() => {
    const { boot, station } = useJourney.getState();
    const ramp = Math.max(0, Math.min(1, (boot - 0.35) / 0.25));
    // the hall is scenery — it must not compete with the chips at the work station
    const near = station === 2 ? 0.22 : 0.5;
    ribRefs.current.forEach((m) => {
      if (m) m.emissiveIntensity = 0.9 * ramp * near;
    });
  });
  let ribIdx = 0;
  return (
    <group position={[HALL.x, 0, HALL.z]} rotation={[0, HALL_ROT, 0]}>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[60, 2, 20]} />
        <meshStandardMaterial color="#0a100a" roughness={0.7} metalness={0.35} />
      </mesh>
      {RIB_XS.map((rx) => (
        <group key={rx} position={[rx, 0, 0]}>
          {(
            [
              { p: [0, 10, -9.6] as [number, number, number], s: [0.55, 18, 0.55] as [number, number, number] },
              { p: [0, 10, 9.6] as [number, number, number], s: [0.55, 18, 0.55] as [number, number, number] },
              { p: [0, 18.8, 0] as [number, number, number], s: [0.55, 0.55, 19.6] as [number, number, number] }
            ]
          ).map((part, i) => (
            <mesh key={i} position={part.p}>
              <boxGeometry args={part.s} />
              <meshStandardMaterial
                ref={(m) => {
                  ribRefs.current[ribIdx++] = m;
                }}
                color="#0a0f0a"
                emissive="#ffe9c4"
                emissiveIntensity={0}
              />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 19.15, 0]}>
        <boxGeometry args={[52.6, 0.5, 0.5]} />
        <meshStandardMaterial
          ref={(m) => {
            ribRefs.current[ribIdx++] = m;
          }}
          color="#0a0f0a"
          emissive="#ffe9c4"
          emissiveIntensity={0}
        />
      </mesh>
      {(
        [
          { p: [0, 10, -9.6] as [number, number, number], r: 0, w: 52 },
          { p: [0, 10, 9.6] as [number, number, number], r: 0, w: 52 },
          { p: [-26.2, 10, 0] as [number, number, number], r: Math.PI / 2, w: 19.2 },
          { p: [26.2, 10, 0] as [number, number, number], r: Math.PI / 2, w: 19.2 }
        ]
      ).map((pane, i) => (
        <mesh key={i} position={pane.p} rotation={[0, pane.r, 0]}>
          <planeGeometry args={[pane.w, 17.6]} />
          <meshStandardMaterial
            color="#12241a"
            transparent
            opacity={0.16}
            roughness={0.12}
            metalness={0.25}
            emissive="#1e4430"
            emissiveIntensity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      <mesh position={[0, 18.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[52, 19]} />
        <meshStandardMaterial color="#12241a" transparent opacity={0.1} roughness={0.12} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** The Fab: interactive PGA-chip shelf in the foreground, glass hall behind. */
export default function Fab() {
  return (
    <group>
      <group position={[ROW.x, 0, ROW.z]} rotation={[0, ROW_ROT, 0]}>
        {/* display plinth strip */}
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[42, 0.7, 6]} />
          <meshStandardMaterial color="#0d130d" roughness={0.6} metalness={0.4} />
        </mesh>
        {CHIPS.map((chip, i) => (
          <InteractiveChip key={chip.slug} index={i} slug={chip.slug} label={chip.label} sub={chip.sub} color={chip.color} />
        ))}
      </group>
      <HallBackdrop />
    </group>
  );
}
