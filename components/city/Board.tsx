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
 * CRITIC RESIDUAL — the contact board had no focal anchor: at settle the eye landed
 * on a field of empty substrate. This is ONE routed trace, drawn the way a real board
 * routes one: orthogonal runs joined by 45° doglegs, from a via out on the substrate
 * down into the gold pad cluster on the die's far face. A pulse crawls along it, so
 * the board reads as powered rather than printed.
 *
 * Coordinates are (x, z) on the board plane, and they are chosen against the ACTUAL
 * settle framing (camera [-30,500,300] → [0,0,0], fov 55): this route projects to
 * NDC y .93 → .68 just right of centre, i.e. the empty band above the die and below
 * the top of frame, where nothing else — 3D or DOM — is competing. The −Z pad row
 * spans z −295..−269, so the run stops at −302 and never overlaps it.
 */
const TRACE: [number, number][] = [
  [170, -452],
  [170, -400],
  [110, -340],
  [110, -316],
  [40, -316],
  [40, -302]
];
/** peak emissive at the head of the pulse (the rail caps this view's brights) */
const TRACE_PEAK = 1.2;
/** dim standing glow so the route still reads between pulses */
const TRACE_BASE = 0.16;
/** seconds for one head-to-tail pass, plus the dark gap before the next */
const TRACE_PERIOD = 5.2;

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

  /** the routed trace, pre-solved into segment transforms + normalised centres */
  const traceSegments = useMemo(() => {
    let run = 0;
    const raw = TRACE.slice(1).map((point, i) => {
      const [x0, z0] = TRACE[i];
      const [x1, z1] = point;
      const dx = x1 - x0;
      const dz = z1 - z0;
      const length = Math.hypot(dx, dz);
      const start = run;
      run += length;
      return {
        // local +X of a box rotated by `rot` about Y points at (cos, -sin) in (x,z)
        rot: Math.atan2(-dz, dx),
        position: [(x0 + x1) / 2, -0.15, (z0 + z1) / 2] as [number, number, number],
        // +1.6 so consecutive segments overlap and the doglegs have no gaps
        length: length + 1.6,
        mid: start + length / 2
      };
    });
    return raw.map((s) => ({ ...s, at: s.mid / run }));
  }, []);
  const traceMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

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

    // the pulse: a soft head travelling 0 → 1 along the route, then a dark gap.
    // Segments are STAGGERED by their own position on the route (not by index), so
    // the light crawls at a constant speed through the doglegs.
    if (traceMats.current.length) {
      const head = ((state.clock.elapsedTime % TRACE_PERIOD) / TRACE_PERIOD) * 1.34 - 0.17;
      traceSegments.forEach((seg, i) => {
        const m = traceMats.current[i];
        if (!m) return;
        const d = (head - seg.at) / 0.11;
        m.opacity = reveal.current * 0.9;
        m.emissiveIntensity = reveal.current * (TRACE_BASE + TRACE_PEAK * Math.exp(-d * d));
      });
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
          reading as four glowing bars.
          R6 BEVEL: the pads were sharp instanced boxes — one flat top and four
          walls that all take the same normal, so at orbit distance the edges
          vanished and each pad read as a painted rectangle. A 10-sided truncated
          cone (top radius 0.42 vs base 0.5) is the cheapest fix that keeps ONE
          instanced draw: the sloped wall picks up a bright ring off the HDRI right
          where the pad meets the substrate, so the edge reads without a second
          mesh, a second material, or any change to the matrices below — the
          existing (16|26, 0.8, 26|16) scale squashes the cylinder into exactly the
          same elliptical footprint the boxes occupied. */}
      <instancedMesh ref={padRef} args={[undefined, undefined, pads.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.42, 0.5, 1, 10]} />
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
      {/* CRITIC RESIDUAL — the routed trace + its start via. Accent green, the hue
          the uplink base already uses, so the view gains a focal point and NOT a
          third colour. It sits at y=-0.15: above the substrate (-0.6) and above the
          silkscreen plane (-0.3), which is depthWrite:false, so nothing z-fights. */}
      {traceSegments.map((seg, i) => (
        <mesh key={i} position={seg.position} rotation={[0, seg.rot, 0]} renderOrder={2}>
          <boxGeometry args={[seg.length, 0.5, 4.4]} />
          <meshStandardMaterial
            ref={(m) => {
              traceMats.current[i] = m;
            }}
            color="#0a140a"
            emissive="#9be15d"
            emissiveIntensity={0}
            roughness={0.4}
            metalness={0.6}
            transparent
            opacity={0}
          />
        </mesh>
      ))}
      <mesh position={[TRACE[0][0], -0.15, TRACE[0][1]]} renderOrder={2}>
        <cylinderGeometry args={[5.2, 5.2, 0.6, 12]} />
        <meshStandardMaterial
          ref={registerFade(0.9)}
          color="#0a140a"
          emissive="#9be15d"
          emissiveIntensity={0.35}
          roughness={0.4}
          metalness={0.6}
          transparent
          opacity={0}
        />
      </mesh>
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
