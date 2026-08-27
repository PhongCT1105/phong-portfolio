'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useJourney } from '@/lib/journey';
import { makeChipTexture } from '@/components/city/textures';

/** order matches SITE_CONTENT.projects: flashml, captain-ddoski, on-device-qa, hospital-nav */
const CHIPS = [
  { slug: 'flashml', color: '#9be15d' },
  { slug: 'captain-ddoski', color: '#7ba7ff' },
  { slug: 'on-device-qa', color: '#ffb45a' },
  { slug: 'hospital-nav', color: '#e04050' }
] as const;

/** ~110u from the held work camera (150,16,-30) → hall spans ~30% of frame */
const HALL = { x: 196, z: -128 };
const HALL_ROT = Math.atan2(150 - HALL.x, -30 - HALL.z);
const LAYER_COUNT = 5;
const RIB_XS = [-26, -13, 0, 13, 26];

function Chip({ index, slug, color }: { index: number; slug: string; color: string }) {
  const riseRef = useRef<THREE.Group>(null);
  const layerRefs = useRef<(THREE.Group | null)[]>([]);
  const layerMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const lightRef = useRef<THREE.PointLight>(null);
  const rise = useRef(0);
  const fan = useRef(0);
  const glow = useRef(0);
  const topMat = useRef<THREE.MeshStandardMaterial>(null);

  const materials = useMemo(() => {
    const texture = makeChipTexture(color);
    const side = new THREE.MeshStandardMaterial({ color: '#0a0f0a', roughness: 0.45, metalness: 0.6 });
    const top = new THREE.MeshStandardMaterial({
      color: '#060a06',
      roughness: 0.35,
      metalness: 0.55,
      emissive: '#ffffff',
      emissiveMap: texture,
      emissiveIntensity: 0.2
    });
    topMat.current = top;
    return [side, side, top, side, side, side];
  }, [color]);

  useFrame((_, dt) => {
    const { station, workFocus, workOpen, boot } = useJourney.getState();
    const delta = Math.min(dt, 0.05);
    const speed = 1 - Math.exp(-delta * 5);

    const focused = workFocus === index;
    const opened = workOpen === slug;
    const atStation = station === 2;
    const bootRamp = Math.max(0, Math.min(1, (boot - 0.4) / 0.2));

    const glowTarget = bootRamp * (opened ? 1 : focused && atStation ? 0.82 : 0.07);
    glow.current += (glowTarget - glow.current) * speed;
    rise.current += ((opened ? 1 : 0) - rise.current) * speed;
    fan.current += ((opened ? 1 : 0) - fan.current) * speed * 0.8;

    if (riseRef.current) riseRef.current.position.y = rise.current * 4.6;
    if (topMat.current) topMat.current.emissiveIntensity = 0.15 + glow.current * 2.6;
    // the focused chip is the district's one light source — visible from any angle
    if (lightRef.current) lightRef.current.intensity = glow.current * 55;
    layerRefs.current.forEach((layer, li) => {
      // pages lie flat on the chip (−90°) and fan upward like a book opening
      if (layer) layer.rotation.x = -Math.PI / 2 + fan.current * (0.62 + li * 0.12);
    });
    layerMats.current.forEach((m, li) => {
      if (m) m.emissiveIntensity = 0.06 + glow.current * (0.85 - li * 0.09);
    });
  });

  const lx = (index - (CHIPS.length - 1) / 2) * 9.5;

  return (
    <group position={[lx, 2.2, 2]}>
      <mesh position={[0, 1.4, 0]}>
        <boxGeometry args={[2.2, 2.8, 2.2]} />
        <meshStandardMaterial color="#0a100a" roughness={0.6} metalness={0.4} />
      </mesh>
      <group ref={riseRef}>
        <pointLight ref={lightRef} position={[0, 5.4, 1]} color={color} intensity={0} distance={22} decay={2} />
        <mesh position={[0, 3.1, 0]} material={materials}>
          <boxGeometry args={[4.6, 0.5, 4.6]} />
        </mesh>
        {Array.from({ length: LAYER_COUNT }, (_, li) => (
          <group
            key={li}
            ref={(g) => {
              layerRefs.current[li] = g;
            }}
            position={[0, 3.42 + li * 0.03, -2.3]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            {/* page extends from the hinge; bottom edge AT the hinge, no piercing */}
            <mesh position={[0, 2.15, 0]}>
              <planeGeometry args={[4.2, 4.3]} />
              <meshStandardMaterial
                ref={(m) => {
                  layerMats.current[li] = m;
                }}
                color="#081008"
                roughness={0.5}
                metalness={0.5}
                emissive={color}
                emissiveIntensity={0.06}
                transparent
                opacity={0.94}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/** The Fab: a real glass assembly hall — portal ribs, ridge, glass volume, 4 pedestals. */
export default function Fab() {
  const ribRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  useFrame(() => {
    const { boot, station } = useJourney.getState();
    const ramp = Math.max(0, Math.min(1, (boot - 0.35) / 0.25));
    const near = station === 2 ? 1 : 0.5;
    ribRefs.current.forEach((m) => {
      if (m) m.emissiveIntensity = 0.9 * ramp * near;
    });
  });

  let ribIdx = 0;

  return (
    <group position={[HALL.x, 0, HALL.z]} rotation={[0, HALL_ROT, 0]}>
      {/* platform */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[60, 2, 20]} />
        <meshStandardMaterial color="#0a100a" roughness={0.7} metalness={0.35} />
      </mesh>

      {/* portal ribs: two columns + crossbeam each, warm-lit */}
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
      {/* continuous ridge beam */}
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

      {/* glass volume — visible panes, bloom-kissed edges */}
      {(
        [
          { p: [0, 10, -9.6] as [number, number, number], r: [0, 0, 0] as [number, number, number], w: 52, h: 17.6 },
          { p: [0, 10, 9.6] as [number, number, number], r: [0, 0, 0] as [number, number, number], w: 52, h: 17.6 },
          { p: [-26.2, 10, 0] as [number, number, number], r: [0, Math.PI / 2, 0] as [number, number, number], w: 19.2, h: 17.6 },
          { p: [26.2, 10, 0] as [number, number, number], r: [0, Math.PI / 2, 0] as [number, number, number], w: 19.2, h: 17.6 }
        ]
      ).map((pane, i) => (
        <mesh key={i} position={pane.p} rotation={pane.r}>
          <planeGeometry args={[pane.w, pane.h]} />
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

      {CHIPS.map((chip, i) => (
        <Chip key={chip.slug} index={i} slug={chip.slug} color={chip.color} />
      ))}
    </group>
  );
}
