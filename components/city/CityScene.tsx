'use client';

import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  Vignette,
  Noise,
  ChromaticAberration,
  wrapEffect
} from '@react-three/postprocessing';
import { BlendFunction, Effect } from 'postprocessing';
import { suspend } from 'suspend-react';
// CC0 night HDRI bundled locally (no CDN) — real reflections on every surface
const nightHdri = import('@pmndrs/assets/hdri/night.exr').then((m) => m.default);
import * as THREE from 'three';
import { easing } from 'maath';
import { useJourney } from '@/lib/journey';
import { prefersReducedMotion } from '@/lib/session';
import type { QualityTier } from '@/components/city/CityLayer';
import City from '@/components/city/City';

/**
 * Camera rail through the six stations (city on XZ plane, Y up).
 * Critic F1: shallow pitch (−8°..−15°) everywhere except the lift-off finale —
 * every station shows a horizon with the city dissolving into fog.
 */
const RAIL_POINTS: [number, number, number][] = [
  [-10, 14, 118], // 00 hero — eye below the hero-tower roofline, downtown ahead-right
  [85, 20, 60], // 01 receipts — raised so vault plaques clear the DOM card bottoms
  [150, 16, -30], // 02 work — the fab, east side (raised per M5 composition guidance)
  [72, 7, -95], // 03 road — avenue entrance (station 3 drives a straight z-locked path)
  [-85, 14, -45], // 04 now — scheduler hall
  [-30, 500, 300] // 05 contact — orbit high enough that all four die edges + pads fit
];

const LOOK_TARGETS: [number, number, number][] = [
  [42, 11, 2], // downtown cluster breaks the horizon, right of frame
  [120, 4, -20],
  [180, 6, -90],
  [-70, 6, -95], // held down the avenue while the gates pass
  [-140, 6, -2], // panned so the hall sits in the DOM center gap
  [0, 0, 0]
];

/* ------------------------------------------------------------------ film pass */

/**
 * R3 split-tone: teal into the shadows, warm amber into the highlights, mixed
 * by luminance. Both tints are luminance-normalised in JS (divided by their own
 * Rec.709 luma) so they push HUE only — the grade never lifts or crushes the
 * exposure, which keeps the "one bright element per view" bloom discipline
 * intact. Runs as a merged effect inside the single EffectPass (no extra pass).
 */
const SPLIT_TONE_FRAG = `
uniform vec3 shadowTint;
uniform vec3 highlightTint;
uniform float toneStrength;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
	vec3 c = inputColor.rgb;
	float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
	float shadowWeight = 1.0 - smoothstep(0.0, 0.45, luma);
	float highlightWeight = smoothstep(0.35, 0.95, luma);
	vec3 toned = mix(c, c * shadowTint, shadowWeight * toneStrength);
	toned = mix(toned, toned * highlightTint, highlightWeight * toneStrength);
	outputColor = vec4(toned, inputColor.a);
}
`;

/** hue-only tint: scale the colour so its Rec.709 luma is exactly 1 */
function hueOnly(hex: string): THREE.Vector3 {
  const c = new THREE.Color(hex);
  const luma = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  if (luma > 1e-4) c.multiplyScalar(1 / luma);
  return new THREE.Vector3(c.r, c.g, c.b);
}

interface SplitToneOptions {
  shadows?: string;
  highlights?: string;
  strength?: number;
}

class SplitToneEffect extends Effect {
  constructor({ shadows = '#1a3038', highlights = '#ffd9b0', strength = 0.15 }: SplitToneOptions = {}) {
    super('SplitToneEffect', SPLIT_TONE_FRAG, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform>([
        ['shadowTint', new THREE.Uniform(hueOnly(shadows))],
        ['highlightTint', new THREE.Uniform(hueOnly(highlights))],
        ['toneStrength', new THREE.Uniform(strength)]
      ])
    });
  }
}

const STATIC_GRAIN_FRAG = `
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
	outputColor = vec4(vec3(rand(uv)), inputColor.a);
}
`;

/**
 * prefers-reduced-motion variant of the grain: identical to postprocessing's
 * NoiseEffect minus the `time` term, so the grain STAYS (the frame keeps its
 * film texture) but never crawls. Same blend/opacity, same merged pass.
 */
class StaticNoiseEffect extends Effect {
  constructor() {
    super('StaticNoiseEffect', STATIC_GRAIN_FRAG, { blendFunction: BlendFunction.SOFT_LIGHT });
  }
}

const SplitTone = wrapEffect(SplitToneEffect);
const StaticNoise = wrapEffect(StaticNoiseEffect);

const SPLIT_TONE_ARGS: [SplitToneOptions] = [
  { shadows: '#1a3038', highlights: '#ffd9b0', strength: 0.15 }
];

/**
 * The film pass, FULL TIER ONLY (the lite tier renders with no composer at all).
 * Child order is load-bearing:
 *  1. ChromaticAberration is the only CONVOLUTION effect here — it samples the
 *     raw inputBuffer for its R/B taps, so it must run FIRST or the shifted
 *     channels would disagree with an already-bloomed green channel. Being the
 *     only convolution effect, everything below still merges with it into ONE
 *     EffectPass (postprocessing only refuses to merge convolution + convolution;
 *     Bloom is NOT a convolution effect — it composites from its own mip chain).
 *  2. Bloom / 3. split-tone / 4. vignette / 5. grain, i.e. grade after glow,
 *     grain last so the vignette does not dim it.
 */
function FilmPass({ reduced }: { reduced: boolean }) {
  return (
    <EffectComposer>
      {/* edge-weighted: modulationOffset keeps the middle ~40% of the frame clean */}
      <ChromaticAberration offset={[0.0009, 0.0006]} radialModulation modulationOffset={0.42} />
      <Bloom mipmapBlur intensity={0.7} luminanceThreshold={0.9} luminanceSmoothing={0.2} />
      <SplitTone args={SPLIT_TONE_ARGS} blendFunction={BlendFunction.NORMAL} />
      <Vignette darkness={0.55} offset={0.28} />
      {reduced ? (
        <StaticNoise blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.025} />
      ) : (
        <Noise premultiply={false} blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.025} />
      )}
    </EffectComposer>
  );
}

/** image-based lighting: bundled CC0 night HDRI gives metals/glass real reflections */
function EnvironmentLight() {
  const file = suspend(nightHdri, ['city-night-hdri']) as string;
  return <Environment files={file} environmentIntensity={0.35} />;
}

/** fog thins as the camera climbs so the whole die stays visible from orbit */
function FogRig() {
  useFrame((state, dt) => {
    const fog = state.scene.fog as THREE.FogExp2 | null;
    if (!fog) return;
    const target = state.camera.position.y > 100 ? 0.0012 : 0.005;
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * 2.5);
    fog.density += (target - fog.density) * k;
  });
  return null;
}

function CameraRig() {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(RAIL_POINTS.map((p) => new THREE.Vector3(...p)), false, 'centripetal', 0.5),
    []
  );
  const pos = useRef(new THREE.Vector3(...RAIL_POINTS[0]));
  const look = useRef(new THREE.Vector3(...LOOK_TARGETS[0]));
  const scratch = useRef(new THREE.Vector3());
  const scratch2 = useRef(new THREE.Vector3());
  // R4 hand-held wobble: previous rail pose (for transit-speed estimation) and
  // the damped wobble amount. `pos.current` stays the untouched pose source.
  const prevPos = useRef(new THREE.Vector3(...RAIL_POINTS[0]));
  const wobble = useRef(1);
  const reduced = useMemo(() => prefersReducedMotion(), []);

  useFrame((state, dt) => {
    const { station, localT } = useJourney.getState();
    const delta = Math.min(dt, 0.05);

    // per-segment mapping: station i travels rail segment i, so every station
    // lands exactly on its keyframe (page progress ≠ curve arc length).
    // Station 1 holds for the vault reveal; station 2 holds so the fab stays
    // framed; station 3 bypasses the curve for a straight z-locked avenue
    // drive with a ~20u lead ahead of each igniting gate.
    let l = localT;
    if (station === 1) {
      // hold AT the receipts keyframe (85,20,60) — the vault row is staged for it
      l = l < 0.85 ? 0 : ((l - 0.85) / 0.15) * 0.9;
    } else if (station === 2) {
      // hold AT the keyframe (fab view), exit late
      l = l < 0.8 ? 0 : ((l - 0.8) / 0.2) * 0.9;
    } else if (station === 4) {
      // scheduler hold; earlier exit gives the lift-off climb more runway
      l = l < 0.65 ? 0 : ((l - 0.65) / 0.35) * 0.9;
    }
    if (station === 3) {
      scratch.current.set(72 - 124 * localT, 7, -95);
    } else {
      const segments = RAIL_POINTS.length - 1;
      const u = Math.min(1, (station + l) / segments);
      curve.getPoint(u, scratch.current);
    }
    easing.damp3(pos.current, scratch.current, 0.45, delta);

    const nextStation = Math.min(station + 1, LOOK_TARGETS.length - 1);
    // holds freeze the look-at too; the avenue holds its vanishing point until exit
    const lookLerp =
      station >= 1 && station <= 4
        ? localT < 0.85
          ? 0
          : ((localT - 0.85) / 0.15) * 0.5
        : localT * 0.5;
    scratch.current
      .fromArray(LOOK_TARGETS[station])
      .lerp(scratch2.current.fromArray(LOOK_TARGETS[nextStation]), lookLerp);
    easing.damp3(look.current, scratch.current, 0.6, delta);

    state.camera.position.copy(pos.current);
    state.camera.lookAt(look.current);
    // spring-damped mouse parallax, ±~1.5°
    state.camera.rotateY(-state.pointer.x * 0.026);
    state.camera.rotateX(state.pointer.y * 0.02);

    // R4 hand-held wobble — applied LAST, as a pure additive offset on top of the
    // finished rail pose. pos.current / look.current are never touched, so every
    // hold and keyframe still lands exactly where the rail computed it.
    const railSpeed = prevPos.current.distanceTo(pos.current) / Math.max(delta, 1e-4);
    prevPos.current.copy(pos.current);
    if (reduced) {
      wobble.current = 0;
    } else {
      // fast transits (station changes, the lift-off climb) damp the wobble to
      // 0.3 so the travel reads clean; holds get the full hand-held drift.
      const calm = 1 - 0.7 * Math.max(0, Math.min(1, (railSpeed - 8) / 40));
      wobble.current = THREE.MathUtils.damp(wobble.current, calm, 3, delta);
    }
    if (wobble.current > 0.001) {
      const t = state.clock.elapsedTime;
      const w = wobble.current;
      state.camera.position.x += Math.sin(t * 0.21) * 0.13 * w;
      state.camera.position.y += Math.sin(t * 0.17) * 0.09 * w;
      state.camera.rotation.z += Math.sin(t * 0.13) * 0.004 * w;
    }
  });

  return null;
}

export default function CityScene({ tier }: { tier: QualityTier }) {
  // NOTE: CityLayer maps prefers-reduced-motion to tier 'off' (2D fallback), so
  // this is defensive — it only fires if the OS setting flips after tier detection.
  const reduced = useMemo(() => prefersReducedMotion(), []);
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ fov: 55, near: 0.5, far: 900, position: RAIL_POINTS[0] }}
      gl={{ antialias: tier === 'lite', powerPreference: 'high-performance' }}
      eventSource={document.body}
      eventPrefix="client"
      style={{ pointerEvents: 'none' }}
    >
      {/* bg matches fog so the far city dissolves cleanly into void (critic F2) */}
      <color attach="background" args={['#050c07']} />
      <fogExp2 attach="fog" args={['#050c07', 0.005]} />
      {/* night lighting: near-black ambient, light is implied by emissives (critic F3) */}
      <ambientLight intensity={0.035} />
      <directionalLight position={[-120, 180, 80]} intensity={0.06} color="#cfd8ce" />
      <Suspense fallback={null}>
        <EnvironmentLight />
      </Suspense>
      <City density={tier === 'lite' ? 0.6 : 1} />
      <CameraRig />
      <FogRig />
      {tier === 'full' ? <FilmPass reduced={reduced} /> : null}
    </Canvas>
  );
}
