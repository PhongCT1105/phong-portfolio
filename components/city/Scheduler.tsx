'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useJourney } from '@/lib/journey';

const HALL = { x: -135, z: 5 };
/** face the now-station camera at (−85,14,−45) */
const HALL_ROT = Math.atan2(-85 - HALL.x, -45 - HALL.z);

/** bay speeds spanning the real 3.7× range from the resume */
const BAY_SPEEDS = [1.0, 0.55, 0.27];
/** fast bay CENTER (the dense stream must be fully visible in the DOM gap),
    mid left (may clip behind the copy card), slow/dying bay right */
const BAY_X = [0, -11, 11];
const CRATE_COUNT = 36;
const DEATH_CYCLE = 14; // seconds; bay C dies each cycle and its crates return

interface Crate {
  bay: number;
  t: number;
  arc: number;
  returning: boolean;
}

export default function Scheduler() {
  const crateRef = useRef<THREE.InstancedMesh>(null);
  const bayMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const depotMat = useRef<THREE.MeshStandardMaterial>(null);
  const horizonMat = useRef<THREE.MeshStandardMaterial>(null);
  const crates = useRef<Crate[]>(
    Array.from({ length: CRATE_COUNT }, (_, i) => ({
      bay: i % 3,
      t: (i * 0.27) % 1,
      arc: 2 + (i % 5) * 0.5,
      returning: false
    }))
  );
  const scratchMatrix = useMemo(() => new THREE.Matrix4(), []);
  const scratchPos = useMemo(() => new THREE.Vector3(), []);
  const scratchScale = useMemo(() => new THREE.Vector3(1.15, 1.15, 1.15), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);

  useFrame((state, dt) => {
    const { station, boot, localT } = useJourney.getState();
    const delta = Math.min(dt, 0.05);
    const bootRamp = Math.max(0, Math.min(1, (boot - 0.35) / 0.25));

    // bay C death cycle
    const phase = (state.clock.elapsedTime % DEATH_CYCLE) / DEATH_CYCLE;
    const dead = phase > 0.55 && phase < 0.9;

    // bay lights
    bayMats.current.forEach((m, i) => {
      if (!m) return;
      if (i === 2) {
        m.emissive.set(dead ? '#ff8b7a' : '#9be15d');
        m.emissiveIntensity = bootRamp * (dead ? 0.5 : 0.7 * BAY_SPEEDS[i] + 0.35);
      } else {
        m.emissiveIntensity = bootRamp * (0.7 * BAY_SPEEDS[i] + 0.35);
      }
    });
    if (depotMat.current) depotMat.current.emissiveIntensity = bootRamp * 0.9;

    // NVIDIA-green horizon rises at the end of the now chapter
    if (horizonMat.current) {
      const rise = station > 4 ? 1 : station === 4 ? Math.max(0, (localT - 0.6) / 0.4) : 0;
      horizonMat.current.emissiveIntensity = rise * 0.55 * bootRamp;
    }

    // crates
    const mesh = crateRef.current;
    if (!mesh) return;
    // crates flow continuously — parking them erased the phase spread and
    // made every crate launch in lockstep (validator m7r1 defect 2)
    crates.current.forEach((crate, i) => {
      if (crate.bay === 2 && dead && !crate.returning && crate.t > 0.05) {
        crate.returning = true; // death: this bay's work arcs back to the depot
      } else if (crate.returning) {
        crate.t -= delta * 0.5;
        if (crate.t <= 0) {
          crate.t = 0;
          crate.returning = false;
          crate.bay = phase > 0.9 || phase < 0.55 ? 2 : i % 2; // reroute while dead
        }
      } else {
        // rate chosen so even the slow bay (0.27×) traverses inside the 14s death cycle
        crate.t += delta * 0.3 * BAY_SPEEDS[crate.bay];
        if (crate.t >= 1) {
          crate.t = 0;
          if (crate.bay !== 2 && phase > 0.55 && phase < 0.9) crate.bay = i % 2;
          else crate.bay = i % 3;
        }
      }
      // path: depot mouth (0,3,-6) → bay mouth (BAY_X, 1.2, 10), parabolic arc
      const t = Math.max(0, Math.min(1, crate.t));
      const x = BAY_X[crate.bay] * t;
      const z = -6 + 16 * t;
      const y = 3 + (1.2 - 3) * t + Math.sin(t * Math.PI) * crate.arc;
      scratchPos.set(x, y, z);
      scratchMatrix.compose(scratchPos, quat, scratchScale);
      mesh.setMatrixAt(i, scratchMatrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={[HALL.x, 0, HALL.z]} rotation={[0, HALL_ROT, 0]}>
      {/* soft work light over the plaza so the structure reads against the void */}
      <pointLight position={[0, 16, 6]} color="#9be15d" intensity={34} distance={64} decay={2} />
      {/* plaza slab */}
      <mesh position={[0, 0.5, 2]}>
        <boxGeometry args={[40, 1, 30]} />
        <meshStandardMaterial color="#0d130d" roughness={0.7} metalness={0.3} />
      </mesh>
      {/* depot tower with lit edge trim */}
      <mesh position={[0, 10, -10]}>
        <boxGeometry args={[9, 18, 9]} />
        <meshStandardMaterial color="#101810" roughness={0.5} metalness={0.5} />
      </mesh>
      {[-4.6, 4.6].map((ex) => (
        <mesh key={ex} position={[ex, 10, -5.4]}>
          <boxGeometry args={[0.25, 18, 0.25]} />
          <meshStandardMaterial color="#0a0f0a" emissive="#9be15d" emissiveIntensity={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 10, -5.4]}>
        <planeGeometry args={[7, 14]} />
        <meshStandardMaterial
          ref={depotMat}
          color="#061006"
          emissive="#9be15d"
          emissiveIntensity={0}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* three work bays */}
      {BAY_X.map((bx, i) => (
        <group key={i} position={[bx, 0, 12]}>
          <mesh position={[0, 3, 0]}>
            <boxGeometry args={[6.4, 6, 5]} />
            <meshStandardMaterial color="#101810" roughness={0.5} metalness={0.5} />
          </mesh>
          <mesh position={[0, 3.2, 2.6]}>
            <planeGeometry args={[5, 4.6]} />
            <meshStandardMaterial
              ref={(m) => {
                bayMats.current[i] = m;
              }}
              color="#050805"
              emissive="#9be15d"
              emissiveIntensity={0}
              transparent
              opacity={0.92}
            />
          </mesh>
        </group>
      ))}
      {/* job crates */}
      <instancedMesh ref={crateRef} args={[undefined, undefined, CRATE_COUNT]} frustumCulled={false}>
        <boxGeometry />
        <meshStandardMaterial color="#0a120a" emissive="#b8ff72" emissiveIntensity={1.1} roughness={0.5} />
      </instancedMesh>
      {/* NVIDIA-green horizon glow — behind the hall, the road continues */}
      <mesh position={[0, 12, -90]}>
        <planeGeometry args={[140, 26]} />
        <meshStandardMaterial
          ref={horizonMat}
          color="#040804"
          emissive="#76b900"
          emissiveIntensity={0}
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  );
}
