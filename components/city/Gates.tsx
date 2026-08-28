'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROAD_THRESHOLDS, useJourney } from '@/lib/journey';
import { NO_RAYCAST } from '@/components/city/textures';

/** gate order matches the road stops: FPT, NSF, Adobe, Zolli, NVIDIA */
export const GATES = [
  { x: 38, color: '#f26f21' },
  { x: 18, color: '#00a0dc' },
  { x: -2, color: '#fa0f00' },
  { x: -22, color: '#9be15d' },
  { x: -42, color: '#76b900' }
] as const;

const AVENUE_Z = -95;
/** ignition threshold for gate i within station 3 (3D timing, shared with the DOM road) */
export function gateThreshold(index: number): number {
  return ROAD_THRESHOLDS[index] ?? 1;
}

/* ---------------------------------------------------------- R6 gantry frame
   A highway sign gantry, not a neon staple: each leg is a two-post lattice
   braced at four heights, the crossbar carries a Warren-truss top chord, and a
   dark blade sign hangs under it. The three emissive tubes are untouched — they
   are the identity — and simply mount on the new steel.
   Mesh budget: 12 lattice + 7 truss + 3 sign + 2 pads + 3 tubes = 27 per gate. */

/** the two legs, at either shoulder of the avenue */
const LEG_Z = [-7, 7] as const;
/** lattice posts straddle the emissive tube by ±0.6u along the gate plane */
const POST_OFFSETS = [-0.6, 0.6] as const;
/** horizontal cross braces up each leg */
const BRACE_YS = [2.2, 5, 7.8, 10.6] as const;
/** truss diagonals along the crossbar, alternating like a Warren truss */
const TRUSS_ZS = [-6, -3.6, -1.2, 1.2, 3.6, 6] as const;
/** hangers for the blade sign */
const HANGER_ZS = [-0.9, 0.9] as const;

function Gate({ x, color, index }: { x: number; color: string; index: number }) {
  const matRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const lightRef = useRef<THREE.PointLight>(null);
  const level = useRef(0.3);

  // one steel material + one sign material per gate: 24 structure meshes share
  // them, so the near-fade is two opacity writes per frame, not two dozen
  const [steel, blade] = useMemo(() => {
    const s = new THREE.MeshStandardMaterial({
      color: '#0b110c',
      roughness: 0.76,
      metalness: 0.62,
      transparent: true,
      opacity: 1
    });
    const b = new THREE.MeshStandardMaterial({
      color: '#060a06',
      roughness: 0.92,
      metalness: 0.25,
      transparent: true,
      opacity: 1
    });
    return [s, b] as const;
  }, []);
  useEffect(
    () => () => {
      steel.dispose();
      blade.dispose();
    },
    [steel, blade]
  );

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

    // R6 LAYERING FIX. The DOM road cards sit ABOVE the canvas and are only
    // semi-opaque, so a gate crossing the middle of the frame prints its posts
    // straight through the card text. The camera rail here is x = 72 − 124·localT
    // at z = AVENUE_Z, i.e. it drives THROUGH every gate, so proximity is the
    // whole story: fade now starts at 40u (was 32) and hits a 0.05 floor by 14u.
    // At 40u a post is ~10° off centre — already over the card grid — and by 14u
    // the gate is effectively gone, well before it fills the frame.
    const prox = Math.abs(state.camera.position.x - x);
    const nearFade = station === 3 ? Math.max(0.05, Math.min(1, (prox - 14) / 26)) : 1;

    // IT6 — the proximity fade alone was NOT enough: round 2 caught a far gate
    // (Zolli, 26u away at the t=0.43 hold, i.e. nearFade ≈ 0.46) printing fully
    // saturated through the card band, and mid-transit posts slicing Adobe/Zolli.
    // `station === 3` is EXACTLY the condition "a DOM card band is on screen", so
    // every gate is capped to half alpha for the whole chapter, on top of the
    // proximity fade. Combined with the now-opaque card scrim (v2.css) a gate
    // behind a card contributes under 3% of the pixel. The ignition flash is
    // untouched: it is thrown by the pool light below, which has its own gentler
    // curve, and a 0.5-alpha tube still reads as colour against the black avenue.
    const stationCap = station === 3 ? 0.5 : 1;
    const alpha = nearFade * stationCap;

    // emissive dims by nearFade² so a crossing tube dims perceptually (bloom
    // would otherwise keep a saturated core even at low alpha)
    const intensity = level.current * bootRamp * nearFade * nearFade;
    matRefs.current.forEach((m) => {
      if (m) {
        m.emissiveIntensity = intensity;
        // floors at 0.025 during station 3 — the tube goes with the structure
        m.opacity = alpha;
      }
    });
    // the steel goes with it, otherwise a black lattice would still slice the cards
    steel.opacity = alpha;
    blade.opacity = alpha;

    // The pool the igniting gate throws is on the GROUND, below the card band,
    // so it keeps the older, gentler curve. Ignition fires ~21-30u out, which the
    // new structure fade has already dimmed past this light's 0.6 gate — without
    // its own fade the road would stop flashing colour at every stop, and that
    // flash IS the chapter's beat.
    const poolFade = station === 3 ? Math.max(0.1, Math.min(1, (prox - 10) / 22)) : 1;
    const pool = level.current * bootRamp * poolFade * poolFade;
    if (lightRef.current) lightRef.current.intensity = Math.max(0, pool - 0.6) * 55;
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
      {/* R6 lattice legs: two steel posts straddling each emissive tube, cross
          braced at four heights. This is what turns a glowing staple into a
          structure that could actually hold the tube up. */}
      {LEG_Z.map((lz) => (
        <group key={lz} position={[0, 0, lz]}>
          {/* IT6 GAUGE: 0.16u posts / 0.12u braces vanished at the mid-distance
              the road actually shows them at — a 0.16u member 60u from a 55°
              camera on a 1440px frame is ~0.16 / (2·60·tan27.5°) · 1440 ≈ 1.8px
              BEFORE the near-fade multiplies its alpha, so the lattice read as
              nothing at all and the gantry collapsed back to a glowing staple.
              0.30u / 0.22u puts them at ~3.5px / 2.5px, which survives the fade. */}
          {POST_OFFSETS.map((oz) => (
            <mesh key={oz} position={[0, 6.1, oz]} material={steel} raycast={NO_RAYCAST}>
              <boxGeometry args={[0.3, 11.8, 0.3]} />
            </mesh>
          ))}
          {BRACE_YS.map((by) => (
            <mesh key={by} position={[0, by, 0]} material={steel} raycast={NO_RAYCAST}>
              <boxGeometry args={[0.22, 0.22, 1.2]} />
            </mesh>
          ))}
          {/* seated on a pad wide enough for the new footprint */}
          <mesh position={[0, 0.25, 0]} material={steel} raycast={NO_RAYCAST}>
            <boxGeometry args={[1.6, 0.5, 2.2]} />
          </mesh>
        </group>
      ))}
      {/* crossbar truss: a top chord 0.9u above the emissive tube, tied to it by
          alternating diagonals — the depth cue that reads at 60u */}
      <mesh position={[0, 13, 0]} material={steel} raycast={NO_RAYCAST}>
        <boxGeometry args={[0.14, 0.14, 14.4]} />
      </mesh>
      {TRUSS_ZS.map((tz, i) => (
        <mesh
          key={tz}
          position={[0, 12.55, tz]}
          rotation={[i % 2 === 0 ? 0.72 : -0.72, 0, 0]}
          material={steel}
          raycast={NO_RAYCAST}
        >
          <boxGeometry args={[0.11, 1.35, 0.11]} />
        </mesh>
      ))}
      {/* blade sign hanging under the crossbar — dark and unlit on purpose: the
          tubes stay the only bright thing on the gantry */}
      {HANGER_ZS.map((hz) => (
        <mesh key={hz} position={[0, 11.85, hz]} material={steel} raycast={NO_RAYCAST}>
          <boxGeometry args={[0.09, 0.6, 0.09]} />
        </mesh>
      ))}
      <mesh position={[0, 10.9, 0]} material={blade} raycast={NO_RAYCAST}>
        <boxGeometry args={[0.12, 1.3, 4.6]} />
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
