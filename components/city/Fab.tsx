'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useJourney } from '@/lib/journey';
import { prefersReducedMotion } from '@/lib/session';
import { getLenis } from '@/components/SmoothScroll';
import ChipModel from '@/components/city/ChipModel';
import {
  NO_RAYCAST,
  QUALITY,
  aimRotation,
  ensureRectAreaLights,
  getBlobShadowMaterial,
  getLightPoolMaterial,
  makeNameplateTexture
} from '@/components/city/textures';

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

/**
 * R5 studio rig for the shelf. The ROW group is rotated so its LOCAL +Z points at
 * the held work camera (150,16,-30) — so local −X is camera-LEFT and local +X is
 * camera-right, and these two lights are the classic warm-key / cool-fill pair.
 * RectAreaLights cast no shadows and cost one LTC lookup: cheap enough to keep on
 * the lite tier, where they do most of the work of separating chip from plinth.
 */
/**
 * IT6 WARMTH. Round 2 sampled the lit chip face at 26,26,26 — dead neutral, i.e.
 * the "warm key" was not measurably warm at all. Two reasons: #ffe8c2 only has a
 * 23-level red-green spread to begin with, and at intensity 4.2 the ceramic was
 * so far down the response curve that the tint never survived the grade. The key
 * is now #ffd9a8 (38-level spread) at 6.7 — 4.2 × 1.6 — which should land the
 * chip face's red-green delta comfortably past the 8-level target while the cool
 * fill on the opposite side keeps the shadow side from following it warm.
 */
const KEY_COLOR = '#ffd9a8';
const KEY_INTENSITY = 6.7;
const FILL_INTENSITY = 1.5;
const KEY_POS: [number, number, number] = [-26, 22, 17];
const FILL_POS: [number, number, number] = [25, 13, 15];
const KEY_ROT = aimRotation(KEY_POS, [-2, 5, 0]);
const FILL_ROT = aimRotation(FILL_POS, [4, 4, 0]);

/** ignore raycast clicks that actually landed on interactive DOM */
function domGuard(event: ThreeEvent<MouseEvent>): boolean {
  const target = event.nativeEvent.target as HTMLElement | null;
  return !!target?.closest('button, a, input, .casebook, .shelf__caption, .site-nav');
}

/* --------------------------------------------------------------- R7: the toy */

/** rad per pixel of drag — a 1440px sweep is ~11.5 rad of yaw, i.e. ~1.8 turns */
const ORBIT_SENS = 0.008;
/** pitch is clamped so the chip can never tumble past its readable faces */
const ORBIT_PITCH_MAX = 0.5;
/** past this much travel the gesture was a DRAG, so the pointerup must not open the casebook */
const DRAG_SLOP = 4;

/**
 * ONE writer for `document.body.style.cursor`, by hand.
 *
 * IT1 fixed the four-chips-clobber-each-other bug by handing the cursor to drei's
 * `useCursor`, which writes from an effect instead of per frame. But useCursor takes
 * its strings as defaults captured on the FIRST run and re-runs on the hover flag
 * alone — it cannot say "pointer" for a shelf chip, "grab" for the focused one and
 * "grabbing" mid-drag. This keeps IT1's discipline (one owner, writes only on change,
 * released only by the owner that claimed it) while allowing three cursors.
 */
let cursorOwner: symbol | null = null;
let cursorValue = 'auto';
function claimCursor(owner: symbol, value: string | null): void {
  if (typeof document === 'undefined') return;
  if (value === null) {
    // only the current owner may drop the cursor — a chip the pointer LEFT can
    // never wipe the cursor of the chip the pointer just entered
    if (cursorOwner !== owner) return;
    cursorOwner = null;
    if (cursorValue !== 'auto') {
      document.body.style.cursor = 'auto';
      cursorValue = 'auto';
    }
    return;
  }
  if (cursorOwner !== null && cursorOwner !== owner) return;
  cursorOwner = owner;
  if (cursorValue !== value) {
    document.body.style.cursor = value;
    cursorValue = value;
  }
}

/**
 * The HUD readout lives in the work chapter's DOM (WorkShelf's stage window). It is
 * written with `textContent` straight from the drag handler — no React state, so a
 * 120Hz drag never re-renders the tree. The element keeps its default copy in
 * `data-hint`, so restoring it needs no knowledge of the string here.
 */
const HUD_ID = 'work-orbit-hud';
function writeHud(text: string | null): void {
  const el = typeof document === 'undefined' ? null : document.getElementById(HUD_ID);
  if (!el) return;
  if (text === null) {
    el.textContent = el.dataset.hint ?? '';
    el.classList.remove('is-orbiting');
  } else {
    el.textContent = text;
    el.classList.add('is-orbiting');
  }
}

/** "ORBIT 023° · -18°" — yaw wrapped to 0..359, pitch signed */
function hudText(yaw: number, pitch: number): string {
  const deg = (r: number) => (r * 180) / Math.PI;
  const y = ((Math.round(deg(yaw)) % 360) + 360) % 360;
  return `ORBIT ${String(y).padStart(3, '0')}° · ${Math.round(deg(pitch))}°`;
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
  const lift = useRef(0);
  // R4 idle life: how much of the resting "breath" this chip is currently owed
  // (1 while it sits unfocused on the shelf, damped to 0 as it takes the stage)
  const idle = useRef(1);
  const hover = useRef(false);
  const [hovered, setHovered] = useState(false);
  const reduced = useMemo(() => prefersReducedMotion(), []);

  /* ------------------------------------------------------------- R7: the toy */
  // the additive orbit the visitor drags in. `spinRef` keeps owning the museum
  // turntable; this group sits under it, so the rest pose is rotation (0,0) —
  // exactly what the chip had before the toy existed.
  const orbitRef = useRef<THREE.Group>(null);
  const yaw = useRef(0);
  const pitch = useRef(0);
  const yawTarget = useRef(0);
  const pitchTarget = useRef(0);
  const dragging = useRef(false);
  const moved = useRef(0);
  const endDrag = useRef<(() => void) | null>(null);
  const hudTimer = useRef(0);
  const [dragActive, setDragActive] = useState(false);
  // this chip's claim ticket on the shared body cursor
  const owner = useMemo(() => Symbol('chip-cursor'), []);
  // reactive (NOT per-frame) — only flips when the shelf changes focus/station,
  // and it decides whether this chip is draggable and which cursor it shows
  const grabbable = useJourney(
    (s) => s.workFocus === index && s.station === 2 && s.workOpen === null
  );

  useEffect(() => {
    claimCursor(owner, dragActive ? 'grabbing' : hovered ? (grabbable ? 'grab' : 'pointer') : null);
  }, [owner, hovered, dragActive, grabbable]);

  useEffect(
    () => () => {
      const wasDragging = !!endDrag.current;
      endDrag.current?.();
      claimCursor(owner, null);
      // endDrag queues the 1s hand-back; unmounting mid-drag has to do it now,
      // or the readout would be stranded on the last angle
      window.clearTimeout(hudTimer.current);
      if (wasDragging) writeHud(null);
    },
    [owner]
  );
  const shadowMat = useMemo(() => getBlobShadowMaterial(), []);
  const poolMat = useMemo(() => getLightPoolMaterial(), []);
  // R6: the etched serial milled into the plinth face — a real display case
  // labels its exhibit. Cached per string inside the helper.
  const plate = useMemo(
    () => makeNameplateTexture(`ZL-0${index + 1} · ${label.toUpperCase()}`),
    [index, label]
  );

  useFrame((state, dt) => {
    const { station, workFocus, workOpen, boot } = useJourney.getState();
    const delta = Math.min(dt, 0.05);
    const speed = 1 - Math.exp(-delta * 5);

    const focused = workFocus === index;
    const opened = workOpen === slug;
    const atStation = station === 2;
    const bootRamp = Math.max(0, Math.min(1, (boot - 0.4) / 0.2));
    const hot = hover.current;

    // hover brightens the chip ~1.3x on top of whatever state it is in
    const glowBase = opened ? 1 : focused && atStation ? 0.9 : hot ? 0.45 : 0.06;
    const glowTarget = bootRamp * glowBase * (hot ? 1.3 : 1);
    glow.current = THREE.MathUtils.damp(glow.current, glowTarget, hot ? 8 : 5, delta);
    rise.current += ((opened ? 1.6 : focused && atStation ? 0.5 : 0) - rise.current) * speed;
    // the focused chip DOMINATES: ~1.85x scale vs its dim siblings
    scale.current += (((focused && atStation) || opened ? 1.85 : 1) - scale.current) * speed;
    // hover lift: a plain chip rises 0.25u; the already-scaled focused chip only
    // adds a hint (+0.1) so hover never competes with focus. Reduced motion keeps
    // the cursor + glow and skips the travel.
    const liftTarget = !hot || reduced ? 0 : (focused && atStation) || opened ? 0.1 : 0.25;
    lift.current = THREE.MathUtils.damp(lift.current, liftTarget, hot ? 8 : 5, delta);

    // R4: nothing sits perfectly still. The resting chips breathe on a
    // per-index phase; the focused/opened chip is deliberately steady, so the
    // breath is damped out rather than fighting the focus lift + 1.85x scale.
    // This is a separate ADDITIVE term — hover lift and focus rise are untouched.
    idle.current = THREE.MathUtils.damp(
      idle.current,
      reduced || (focused && atStation) || opened ? 0 : 1,
      5,
      delta
    );
    const t = state.clock.elapsedTime;
    const breath = Math.sin(t * 0.72 + index * 0.8) * 0.012 * idle.current;
    // pedestal light pulses ±8% on the same slow clock, offset ~1.1rad so the
    // glow and the lift never peak together
    const pulse = 1 + Math.sin(t * 0.72 + index * 0.8 + 1.1) * 0.08 * idle.current;

    if (groupRef.current) {
      groupRef.current.position.y = 3.4 + rise.current + lift.current + breath;
      groupRef.current.scale.setScalar(scale.current);
    }
    if (lightRef.current) lightRef.current.intensity = glow.current * 60 * pulse;

    // R7: the dragged orbit. While the pointer is down the chip DAMP-FOLLOWS the
    // drag (rate 8, the camera rate — it tracks the hand without snapping to it);
    // on release it springs back to the rest pose at rate 3, ≈1.2s to settle.
    // Reduced motion keeps the drag (it is user-driven, not an animation) and
    // makes only the return instant.
    if (dragging.current) {
      yaw.current = THREE.MathUtils.damp(yaw.current, yawTarget.current, 8, delta);
      pitch.current = THREE.MathUtils.damp(pitch.current, pitchTarget.current, 8, delta);
    } else if (yaw.current !== 0 || pitch.current !== 0) {
      if (reduced) {
        yaw.current = 0;
        pitch.current = 0;
      } else {
        yaw.current = THREE.MathUtils.damp(yaw.current, 0, 3, delta);
        pitch.current = THREE.MathUtils.damp(pitch.current, 0, 3, delta);
        // land on EXACTLY the rest pose so the turntable resumes bit-exact
        if (Math.abs(yaw.current) < 1e-4) yaw.current = 0;
        if (Math.abs(pitch.current) < 1e-4) pitch.current = 0;
      }
    }
    const orbiting = dragging.current || yaw.current !== 0 || pitch.current !== 0;
    if (orbitRef.current) {
      orbitRef.current.rotation.y = yaw.current;
      orbitRef.current.rotation.x = pitch.current;
    }

    if (spinRef.current) {
      // focused chip turntables slowly, like a museum piece — but the visitor's
      // hands win: the turntable holds while the orbit is away from rest
      const spinSpeed = orbiting ? 0 : opened ? 0.5 : focused && atStation ? 0.22 : 0;
      spinRef.current.rotation.y += spinSpeed * delta;
      if (!focused && !opened) {
        // ease back to the resting pose
        spinRef.current.rotation.y +=
          (Math.round(spinRef.current.rotation.y / (Math.PI * 2)) * Math.PI * 2 -
            spinRef.current.rotation.y) *
          speed;
      }
    }
  });

  /**
   * R7 drag start. Three things keep this from fighting the page scroll:
   *  1. it only ever begins on a pointerdown that RAYCAST-HIT the focused chip;
   *  2. r3f's `event.target.setPointerCapture` routes the rest of the gesture to
   *     the event source (document.body) so leaving the chip does not drop it;
   *  3. Lenis is stopped for the duration (verified API: `stop()` / `start()` /
   *     `isStopped` all exist in lenis 1.3), and native wheel/touchmove are
   *     preventDefault-ed for the duration too, which covers the trackpad and the
   *     touch tablets that land on the 'lite' tier.
   */
  const onPointerDown = (event: ThreeEvent<PointerEvent>) => {
    // cleared FIRST, before any early return: a stale drag distance must never
    // survive to swallow the next plain click on this chip
    moved.current = 0;
    const state = useJourney.getState();
    if (state.workFocus !== index || state.station !== 2 || state.workOpen !== null) return;
    if (domGuard(event as unknown as ThreeEvent<MouseEvent>)) return;
    event.stopPropagation();
    endDrag.current?.();

    const native = event.nativeEvent;
    const pointerId = native.pointerId;
    const startX = native.clientX;
    const startY = native.clientY;
    // a second drag picks up from wherever the spring-back currently is
    const baseYaw = yaw.current;
    const basePitch = pitch.current;
    yawTarget.current = baseYaw;
    pitchTarget.current = basePitch;
    dragging.current = true;
    setDragActive(true);
    window.clearTimeout(hudTimer.current);
    writeHud(hudText(baseYaw, basePitch));

    try {
      (event.target as unknown as { setPointerCapture?: (id: number) => void }).setPointerCapture?.(
        pointerId
      );
    } catch {
      /* capture is a nicety — the window listeners below are the real contract */
    }

    const lenis = getLenis();
    const stoppedLenis = !!lenis && !lenis.isStopped;
    if (lenis && stoppedLenis) lenis.stop();

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      moved.current = Math.max(moved.current, Math.abs(dx) + Math.abs(dy));
      yawTarget.current = baseYaw + dx * ORBIT_SENS;
      pitchTarget.current = THREE.MathUtils.clamp(
        basePitch + dy * ORBIT_SENS,
        -ORBIT_PITCH_MAX,
        ORBIT_PITCH_MAX
      );
      writeHud(hudText(yawTarget.current, pitchTarget.current));
    };
    const block = (e: Event) => e.preventDefault();
    const finish = () => {
      if (endDrag.current !== finish) return;
      endDrag.current = null;
      dragging.current = false;
      setDragActive(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('wheel', block);
      window.removeEventListener('touchmove', block);
      if (lenis && stoppedLenis) lenis.start();
      // the readout holds the last angle for a beat, then hands the line back
      window.clearTimeout(hudTimer.current);
      hudTimer.current = window.setTimeout(() => writeHud(null), 1000);
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      finish();
    };

    endDrag.current = finish;
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('wheel', block, { passive: false });
    window.addEventListener('touchmove', block, { passive: false });
  };

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    if (domGuard(event)) return;
    event.stopPropagation();
    // a gesture that travelled was a DRAG, not a click — it must not open the case
    if (moved.current > DRAG_SLOP) {
      moved.current = 0;
      return;
    }
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
      {/* R5 grounding: the pedestal's contact shadow on the plinth (top y=0.7),
          and the chip's shadow on the pedestal cap (top y=3.0). The chip is wider
          (5.6u) than the cap (3u), so its blob is CLAMPED to the cap rather than
          hanging off into space — it reads as the whole top going dark under it. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.72, 0]} scale={[3.45, 3.45, 1]} raycast={NO_RAYCAST} renderOrder={-1} material={shadowMat}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 3.02, 0]} scale={[2.9, 2.9, 1]} raycast={NO_RAYCAST} renderOrder={-1} material={shadowMat}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      {/* IT6 light pools — laid a hair ABOVE each blob shadow (y +0.01, renderOrder
          0 vs −1) and UNDER the object, at ~1.6× the shadow's footprint. The plinth
          strip is only 6u deep, so the ground pool is clamped to 5.2 in z rather
          than the full 5.5. Additive: it can only add. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.73, 0]} scale={[5.5, 5.2, 1]} raycast={NO_RAYCAST} material={poolMat}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 3.03, 0]} scale={[4.6, 4.6, 1]} raycast={NO_RAYCAST} material={poolMat}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      {/* R6 chamfered plinth. Four stacked parts — block, engraved groove, collar,
          chamfer cap — replacing the bare 3×3×3 cube. The stack still tops out at
          EXACTLY y=3.0, so the chip pose, both blob shadows and the pedestal light
          above are untouched; only the silhouette changed. All decoration, so all
          of it opts out of raycasting (the chip alone owns the hover). */}
      <mesh position={[0, 1.15, 0]} raycast={NO_RAYCAST}>
        <boxGeometry args={[3, 2.3, 3]} />
        <meshStandardMaterial color="#0c120c" roughness={0.55} metalness={0.45} />
      </mesh>
      {/* engraved edge line: inset 0.14u and near-black, so the ring reads as a
          machined groove catching a thread of the chip's own colour */}
      <mesh position={[0, 2.37, 0]} raycast={NO_RAYCAST}>
        <boxGeometry args={[2.86, 0.14, 2.86]} />
        <meshStandardMaterial
          color="#050805"
          roughness={0.9}
          metalness={0.2}
          emissive={color}
          emissiveIntensity={0.14}
        />
      </mesh>
      <mesh position={[0, 2.57, 0]} raycast={NO_RAYCAST}>
        <boxGeometry args={[3, 0.26, 3]} />
        <meshStandardMaterial color="#0c120c" roughness={0.55} metalness={0.45} />
      </mesh>
      {/* chamfer cap: 5% oversized and rounded, so the RectAreaLight key draws a
          bright lip along the top edge instead of dying on a hard corner */}
      <RoundedBox args={[3.15, 0.3, 3.15]} radius={0.075} smoothness={2} position={[0, 2.85, 0]} raycast={NO_RAYCAST}>
        <meshStandardMaterial color="#131a13" roughness={0.42} metalness={0.6} />
      </RoundedBox>
      {/* etched serial nameplate, on the face the held work camera looks at
          (the ROW group's local +Z aims straight at it) */}
      <mesh position={[0, 1.74, 1.53]} raycast={NO_RAYCAST}>
        <planeGeometry args={[2.2, 0.3]} />
        <meshStandardMaterial
          map={plate}
          emissive="#ffffff"
          emissiveMap={plate}
          emissiveIntensity={0.3}
          roughness={0.75}
          metalness={0.35}
        />
      </mesh>
      <pointLight ref={lightRef} position={[0, 7.5, 1.5]} color={color} intensity={0} distance={20} decay={2} />
      {/* resting pose shows the etched label; the focused chip turntables,
          revealing the gold pin field + die lid as it spins */}
      <group ref={groupRef} position={[0, 3.4, 0]}>
        <group ref={spinRef}>
          {/* R7: the dragged orbit rides UNDER the turntable and OVER the chip's
              display tilt, so yaw reads as spinning the piece in its case and
              pitch as tipping it toward the visitor. Rest pose is (0,0). */}
          <group ref={orbitRef}>
            <group
              rotation={[-1.05, 0, 0]}
              onClick={onClick}
              onPointerDown={onPointerDown}
              onPointerOver={(event) => {
                if (domGuard(event as unknown as ThreeEvent<MouseEvent>)) return;
                event.stopPropagation();
                hover.current = true;
                setHovered(true);
              }}
              onPointerOut={() => {
                hover.current = false;
                setHovered(false);
              }}
            >
              <ChipModel label={label} sub={sub} accent={color} />
            </group>
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
  // uploads the LTC lookup textures once, before any RectAreaLight renders
  useMemo(() => ensureRectAreaLights(), []);
  // IT6 adaptive quality: the cool fill is the first thing spent when the frame
  // budget blows out. Written per frame from a plain module flag rather than
  // React state so a toggle never re-renders the scene graph.
  const fillRef = useRef<THREE.RectAreaLight>(null);
  useFrame(() => {
    const fill = fillRef.current;
    if (fill) fill.intensity = QUALITY.fills ? FILL_INTENSITY : 0;
  });
  return (
    <group>
      <group position={[ROW.x, 0, ROW.z]} rotation={[0, ROW_ROT, 0]}>
        {/* R5 studio rig: warm key from camera-left, cool fill from camera-right.
            Static (no reduced-motion gating needed) and shadow-free, so both tiers
            keep them — they are what makes the ceramic slabs read as objects. */}
        <rectAreaLight args={[KEY_COLOR, KEY_INTENSITY, 24, 10]} position={KEY_POS} rotation={KEY_ROT} />
        <rectAreaLight ref={fillRef} args={['#d8e3e7', FILL_INTENSITY, 20, 8]} position={FILL_POS} rotation={FILL_ROT} />
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
