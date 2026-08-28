'use client';

import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useJourney } from '@/lib/journey';
import { prefersReducedMotion } from '@/lib/session';
import { MacBookModel, TowerModel, GpuCardModel } from '@/components/city/Devices';
import ChipModel from '@/components/city/ChipModel';
import {
  NO_RAYCAST,
  QUALITY,
  aimRotation,
  ensureRectAreaLights,
  getBlobShadowMaterial,
  getLightPoolMaterial,
  makeDepotBoardTexture,
  makePacketCoreTexture
} from '@/components/city/textures';

const HALL = { x: -135, z: 5 };
/** face the now-station camera at (−85,14,−45) */
const HALL_ROT = Math.atan2(-85 - HALL.x, -45 - HALL.z);

/**
 * R5 studio rig for the NOW bench, same warm-key / cool-fill pattern as the fab
 * shelf. HALL_ROT points local +Z at the held camera, so local −X is camera-left.
 * The key is pulled slightly green to sit inside this chapter's accent instead of
 * fighting it; the fill stays neutral-cool so the metal has somewhere to go.
 */
/**
 * IT6 WARMTH — same finding as the fab shelf (round 2: chip face 26,26,26). The
 * green-leaning key was the worst offender of the two: #e6f2c6 has a NEGATIVE
 * red-green spread (230 vs 242), so it was actively cooling the lit side. It is
 * now the same #ffd9a8 as the fab key at 6.4 (4 × 1.6). The bench's green
 * identity is unchanged — it comes from the two accent point lights above and
 * from the machines' own emissives, not from the key.
 */
const KEY_COLOR = '#ffd9a8';
const KEY_INTENSITY = 6.4;
const FILL_INTENSITY = 1.5;
const KEY_POS: [number, number, number] = [-17, 20, 30];
const FILL_POS: [number, number, number] = [31, 13, 28];
const KEY_ROT = aimRotation(KEY_POS, [7, 5, 12]);
const FILL_ROT = aimRotation(FILL_POS, [10, 4, 12]);

/**
 * R5 contact shadows, sized per machine (they are four different objects on one
 * bench) and laid on the PEDESTAL cap at y=1.7, not the plaza. Static: the hover
 * lift and the idle breath move the machine, the shadow stays put — which is what
 * sells the lift as a lift.
 */
const MACHINE_SHADOWS: { w: number; d: number; z: number }[] = [
  { w: 9.0, d: 6.4, z: 0.44 }, // MacBook, 8×5.6 base at scale 1.1
  { w: 6.4, d: 4.6, z: 0.6 }, // CPU chip, 5.6 slab tilted back
  { w: 9.6, d: 4.0, z: 0.4 }, // GPU card, 9.4 wide and edge-on
  { w: 6.2, d: 7.8, z: -0.6 } // tower, 5.5×7.6
];

/**
 * The NOW chapter made literal: four MISMATCHED real machines — a laptop, a
 * CPU, a GPU card, a tower — pulling glowing jobs from one queue at their own
 * speeds (the real 3.7× range). The GPU card dies every cycle and its jobs
 * arc back to the queue. This IS FlashML's pitch, staged.
 */
const DEVICES = [
  { x: -3, speed: 0.27, name: 'MACBOOK', sub: '0.27× · SLOWEST' },
  { x: 5, speed: 0.5, name: 'CPU NODE', sub: '0.5× · 208-PIN' },
  { x: 12.8, speed: 0.75, name: 'GPU CARD', sub: '0.75× · DIES + RECOVERS' },
  { x: 20.4, speed: 1.0, name: 'GPU TOWER', sub: '1.0× · PULLS MOST' }
] as const;
const DEATH_INDEX = 2;
const ALIVE = [0, 1, 3];
const CRATE_COUNT = 40;
/**
 * R6 packet elongation. Every crate runs the same parabola from the depot mouth to
 * its bay intake, so its ground-plane heading is CONSTANT per bay — precompute the
 * yaw once and the per-frame cost is a single setFromAxisAngle. Stretching local Z
 * along that heading gives each packet a faint motion streak while everything stays
 * in the one instanced mesh.
 */
const BAY_YAW = DEVICES.map((d) => Math.atan2(d.x, 16.5));
const UP_AXIS = new THREE.Vector3(0, 1, 0);
const DEATH_CYCLE = 14; // seconds; the GPU card dies each cycle, jobs return

const ACCENT = '#9be15d';

function makeLabelTexture(name: string, sub: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 512, 128);
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(240,244,236,0.95)';
  ctx.font = '700 46px "JetBrains Mono", monospace';
  ctx.fillText(name, 256, 52);
  ctx.fillStyle = 'rgba(200,214,192,0.75)';
  ctx.font = '500 26px "JetBrains Mono", monospace';
  ctx.fillText(sub, 256, 98);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

interface Crate {
  bay: number;
  t: number;
  arc: number;
  returning: boolean;
  /** per-instance size, 0.8–1.3, fixed at construction from the crate index */
  size: number;
}

export default function Scheduler() {
  const crateRef = useRef<THREE.InstancedMesh>(null);
  const stripMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const machineRefs = useRef<(THREE.Group | null)[]>([]);
  // hover lives in refs only: these machines are not clickable, so they need no
  // cursor change and no store field — they just answer the pointer.
  const hoveredDevice = useRef<number | null>(null);
  const hoverLift = useRef<number[]>(DEVICES.map(() => 0));
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const shadowMat = useMemo(() => getBlobShadowMaterial(), []);
  const poolMat = useMemo(() => getLightPoolMaterial(), []);
  // uploads the RectAreaLight LTC textures once, before the rig renders
  useMemo(() => ensureRectAreaLights(), []);
  // IT6 adaptive quality: the cool fill goes first when the frame budget blows out
  const fillRef = useRef<THREE.RectAreaLight>(null);
  const depotMat = useRef<THREE.MeshStandardMaterial>(null);
  const horizonMat = useRef<THREE.MeshStandardMaterial>(null);
  const labels = useMemo(() => DEVICES.map((d) => makeLabelTexture(d.name, d.sub)), []);
  const queueLabel = useMemo(() => makeLabelTexture('JOB QUEUE', 'PULL, DON’T ASSIGN'), []);
  const crates = useRef<Crate[]>(
    Array.from({ length: CRATE_COUNT }, (_, i) => ({
      bay: i % DEVICES.length,
      t: (i * 0.27) % 1,
      arc: 2 + (i % 5) * 0.5,
      returning: false,
      // 0.80 → 1.30 in 0.05 steps, walked by a stride coprime with 11 so adjacent
      // crates never land on the same size — a queue of differently sized jobs
      size: 0.8 + ((i * 5) % 11) * 0.05
    }))
  );
  const scratchMatrix = useMemo(() => new THREE.Matrix4(), []);
  const scratchPos = useMemo(() => new THREE.Vector3(), []);
  const scratchScale = useMemo(() => new THREE.Vector3(1.1, 1.1, 1.1), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);
  const depotBoard = useMemo(() => makeDepotBoardTexture(), []);
  const packetCore = useMemo(() => makePacketCoreTexture(), []);

  useFrame((state, dt) => {
    const { station, boot, localT } = useJourney.getState();
    const delta = Math.min(dt, 0.05);
    const bootRamp = Math.max(0, Math.min(1, (boot - 0.35) / 0.25));
    if (fillRef.current) fillRef.current.intensity = QUALITY.fills ? FILL_INTENSITY : 0;

    // death cycle for the GPU card
    const phase = (state.clock.elapsedTime % DEATH_CYCLE) / DEATH_CYCLE;
    const dead = phase > 0.55 && phase < 0.9;

    // pedestal status strips: brightness tracks pull speed; dead goes red
    const t = state.clock.elapsedTime;
    const breathe = 0.85 + Math.sin(t * 2.2) * 0.15;
    DEVICES.forEach((device, i) => {
      // hover: the pointed-at machine's strip runs ~1.6x hot and the machine
      // lifts 0.15u off its pedestal, both spring-damped (8 in / 5 out)
      const hot = hoveredDevice.current === i;
      hoverLift.current[i] = THREE.MathUtils.damp(hoverLift.current[i], hot ? 1 : 0, hot ? 8 : 5, delta);
      const boost = 1 + hoverLift.current[i] * 0.6;
      const m = stripMats.current[i];
      if (m) {
        if (i === DEATH_INDEX && dead) {
          m.emissive.set('#ff8b7a');
          m.emissiveIntensity = bootRamp * 0.9 * boost;
        } else {
          m.emissive.set(ACCENT);
          m.emissiveIntensity = bootRamp * (0.35 + device.speed * 1.0) * breathe * boost;
        }
      }
      const group = machineRefs.current[i];
      // R4 idle life: the machines breathe on a per-index phase, ADDED to the
      // hover lift so the pointer response is unchanged — a rack of live boxes,
      // not four props bolted to their pedestals.
      const breath = reduced ? 0 : Math.sin(t * 0.72 + i * 0.8) * 0.02;
      if (group) group.position.y = (reduced ? 0 : hoverLift.current[i] * 0.15) + breath;
    });
    // depot face: a slow ±10% roll (one long swell + one faster ripple) so the
    // queue board reads like a live CRT instead of a painted rectangle. The board
    // texture now carries the per-row values, so this scales the WHOLE board: at
    // 0.9 the header glyphs sit just under the 0.9 bloom threshold and cross it
    // only at the top of the swell, while every queue row stays well below it.
    const depotPulse = reduced ? 1 : 1 + 0.07 * Math.sin(t * 0.55) + 0.03 * Math.sin(t * 2.9);
    if (depotMat.current) depotMat.current.emissiveIntensity = bootRamp * 0.9 * depotPulse;

    // NVIDIA-green horizon rises at the end of the now chapter
    if (horizonMat.current) {
      const rise = station > 4 ? 1 : station === 4 ? Math.max(0, (localT - 0.6) / 0.4) : 0;
      horizonMat.current.emissiveIntensity = rise * 0.55 * bootRamp;
    }

    // job crates: queue → device, rate ∝ device speed (pull-based)
    const mesh = crateRef.current;
    if (!mesh) return;
    crates.current.forEach((crate, i) => {
      if (crate.bay === DEATH_INDEX && dead && !crate.returning && crate.t > 0.05) {
        crate.returning = true; // death: this device's jobs arc back to the queue
      } else if (crate.returning) {
        crate.t -= delta * 0.5;
        if (crate.t <= 0) {
          crate.t = 0;
          crate.returning = false;
          crate.bay = dead ? ALIVE[i % ALIVE.length] : DEATH_INDEX;
        }
      } else {
        crate.t += delta * 0.3 * DEVICES[crate.bay].speed;
        if (crate.t >= 1) {
          crate.t = 0;
          if (crate.bay !== DEATH_INDEX && dead) crate.bay = ALIVE[i % ALIVE.length];
          else crate.bay = i % DEVICES.length;
        }
      }
      // path: depot mouth (0,3,-6) → device intake (x, 2.6, 10.5), parabolic arc
      const t = Math.max(0, Math.min(1, crate.t));
      const x = DEVICES[crate.bay].x * t;
      const z = -6 + 16.5 * t;
      const y = 3 + (2.6 - 3) * t + Math.sin(t * Math.PI) * crate.arc;
      scratchPos.set(x, y, z);
      // R6: per-instance size + a 1.45x stretch along the bay heading. Both are set
      // here in the compose, so the whole fleet is still one instanced draw.
      quat.setFromAxisAngle(UP_AXIS, BAY_YAW[crate.bay]);
      scratchScale.set(crate.size, crate.size, crate.size * 1.45);
      scratchMatrix.compose(scratchPos, quat, scratchScale);
      mesh.setMatrixAt(i, scratchMatrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={[HALL.x, 0, HALL.z]} rotation={[0, HALL_ROT, 0]}>
      {/* soft work light over the plaza so the machines read against the void */}
      <pointLight position={[0, 16, 8]} color="#9be15d" intensity={40} distance={70} decay={2} />
      <pointLight position={[0, 8, 18]} color="#cfe8c0" intensity={18} distance={44} decay={2} />
      {/* R5 studio rig: warm-green key from camera-left, cool fill from the right.
          Static and shadow-free — both tiers keep them. */}
      <rectAreaLight args={[KEY_COLOR, KEY_INTENSITY, 34, 10]} position={KEY_POS} rotation={KEY_ROT} />
      <rectAreaLight ref={fillRef} args={['#d8e3e7', FILL_INTENSITY, 26, 8]} position={FILL_POS} rotation={FILL_ROT} />
      {/* plaza slab */}
      <mesh position={[0, 0.5, 3]}>
        <boxGeometry args={[46, 1, 34]} />
        <meshStandardMaterial color="#0d130d" roughness={0.7} metalness={0.3} />
      </mesh>
      {/* depot tower = the job queue */}
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
      {/* R6 queue board: a painted CRT, not a lime rectangle. emissiveMap only —
          the material colour stays black so the ONLY light this face throws is the
          board's own rows, and the CRT-roll pulse below scales all of them at once. */}
      <mesh position={[0, 9, -5.4]}>
        <planeGeometry args={[7, 12]} />
        <meshStandardMaterial
          ref={depotMat}
          color="#000000"
          emissive="#ffffff"
          emissiveMap={depotBoard}
          emissiveIntensity={0}
          roughness={0.9}
          metalness={0}
          transparent
          opacity={0.95}
        />
      </mesh>
      {/* queue sign on the depot face */}
      <mesh position={[0, 16.6, -5.35]}>
        <planeGeometry args={[7.6, 1.9]} />
        <meshStandardMaterial
          map={queueLabel}
          transparent
          emissive="#f0f4ec"
          emissiveMap={queueLabel}
          emissiveIntensity={0.8}
          color="#000000"
        />
      </mesh>

      {/* four mismatched machines on lit pedestals */}
      {DEVICES.map((device, i) => (
        <group
          key={device.name}
          position={[device.x, 0, 12]}
          onPointerOver={(event: ThreeEvent<PointerEvent>) => {
            const dom = event.nativeEvent.target as HTMLElement | null;
            if (dom?.closest('button, a, .site-nav, .casebook')) return;
            event.stopPropagation();
            hoveredDevice.current = i;
          }}
          onPointerOut={() => {
            if (hoveredDevice.current === i) hoveredDevice.current = null;
          }}
        >
          {/* pedestal */}
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[11, 1.4, 8]} />
            <meshStandardMaterial color="#111811" roughness={0.5} metalness={0.5} />
          </mesh>
          {/* R5 grounding: contact shadow on the pedestal cap (top y=1.7) */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 1.72, MACHINE_SHADOWS[i].z]}
            scale={[MACHINE_SHADOWS[i].w, MACHINE_SHADOWS[i].d, 1]}
            raycast={NO_RAYCAST} renderOrder={-1}
            material={shadowMat}
          >
            <planeGeometry args={[1, 1]} />
          </mesh>
          {/* IT6 light pool, over the shadow and under the machine. 1.55× rather
              than 1.6×: the pedestal cap is only 11×8, and the pool has to stay on
              it — a halo hanging off the edge into the void reads as a bug, not as
              grounding. The MacBook and GPU-card blobs are the wide ones, so their
              pools are the ones that would have spilled. */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 1.73, MACHINE_SHADOWS[i].z]}
            scale={[Math.min(MACHINE_SHADOWS[i].w * 1.55, 10.8), Math.min(MACHINE_SHADOWS[i].d * 1.55, 7.8), 1]}
            raycast={NO_RAYCAST}
            material={poolMat}
          >
            <planeGeometry args={[1, 1]} />
          </mesh>
          {/* status strip: brightness = pull speed, red = dead */}
          <mesh position={[0, 1.15, 4.05]}>
            <planeGeometry args={[9.4, 0.55]} />
            <meshStandardMaterial
              ref={(m) => {
                stripMats.current[i] = m;
              }}
              color="#050805"
              emissive={ACCENT}
              emissiveIntensity={0}
            />
          </mesh>
          {/* the machine itself — lifts on hover */}
          <group
            ref={(g) => {
              machineRefs.current[i] = g;
            }}
          >
            {i === 0 ? (
              <group position={[0, 1.7, 0.4]} scale={1.1}>
                <MacBookModel />
              </group>
            ) : i === 1 ? (
              <group position={[0, 3.6, 0.6]} rotation={[-1.05, 0, 0]} scale={1.05}>
                <ChipModel label="FLASHML" sub="CPU NODE · 0.5X" accent={ACCENT} />
              </group>
            ) : i === 2 ? (
              <group position={[0, 4.2, 0.4]}>
                <GpuCardModel accent={ACCENT} />
                {/* display stand */}
                <mesh position={[0, -2.9, 0]}>
                  <boxGeometry args={[3.4, 1.2, 2.4]} />
                  <meshStandardMaterial color="#141a14" roughness={0.6} metalness={0.4} />
                </mesh>
              </group>
            ) : (
              <group position={[0, 1.7, 0]}>
                <TowerModel accent={ACCENT} />
              </group>
            )}
          </group>
          {/* nameplate */}
          <mesh position={[0, 13.2, 2]}>
            <planeGeometry args={[8.4, 2.1]} />
            <meshStandardMaterial
              map={labels[i]}
              transparent
              emissive="#f0f4ec"
              emissiveMap={labels[i]}
              emissiveIntensity={0.55}
              color="#000000"
            />
          </mesh>
        </group>
      ))}

      {/* job crates — R6: one instanced draw still, but each packet now has a warm
          near-white core falling off to a dark rim (emissiveMap) and its own size. */}
      <instancedMesh ref={crateRef} args={[undefined, undefined, CRATE_COUNT]} frustumCulled={false}>
        <boxGeometry />
        <meshStandardMaterial
          color="#0b1206"
          emissive="#ffffff"
          emissiveMap={packetCore}
          emissiveIntensity={0.85}
          roughness={0.45}
          metalness={0.1}
        />
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
