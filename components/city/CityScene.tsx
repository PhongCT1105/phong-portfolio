'use client';

import { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  Vignette,
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
import { setQualityFills } from '@/components/city/textures';

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

/**
 * IT6 GRAIN FLOOR — replaces the SOFT_LIGHT NoiseEffect, which round 2 measured
 * at 0.2 8-bit levels in the blacks (target 1.5–3). SOFT_LIGHT is multiplicative
 * around the input: on a near-black pixel it has almost nothing to modulate, so
 * the grain died exactly where film grain is supposed to live. This is ADDITIVE
 * and CENTERED — `(n - 0.5) * amplitude`, so it neither lifts nor crushes the
 * mean — and it is applied in an approximately DISPLAY-referred domain rather
 * than the linear one the composer works in.
 *
 * On that last point I am deliberately departing from the brief's wording ("adds
 * … in linear space"). The effect chain runs before the linear→sRGB encode, and
 * near black the sRGB transfer has a slope of ~12.9: a ±0.006 linear nudge on
 * the #050c07 sky (linear ≈ 0.0043) swings roughly ±20 8-bit levels, which is
 * not grain, it is dirt. Perturbing in sqrt space (a cheap gamma-2.0 stand-in
 * for sRGB) makes the amplitude constant in DISPLAY levels from blacks to
 * highlights, which is what the 1.5–3 level target actually asks for:
 *   sigma = amplitude / sqrt(12) * 255 = 0.022 / 3.464 * 255 ≈ 1.6 levels
 *   peak  = amplitude / 2      * 255 = ±2.8 levels
 */
const GRAIN_FRAG = `
uniform float grainTime;
uniform float grainAmp;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
	// one hash per pixel per frame; the time offset decorrelates consecutive frames
	float n = rand(uv + vec2(grainTime, grainTime * 1.618));
	vec3 d = sqrt(max(inputColor.rgb, 0.0));
	d += (n - 0.5) * grainAmp;
	outputColor = vec4(max(d, 0.0) * max(d, 0.0), inputColor.a);
}
`;

interface GrainOptions {
  amplitude?: number;
  animated?: boolean;
}

/**
 * `animated: false` is the prefers-reduced-motion variant: the time uniform is
 * frozen, so the frame keeps its film texture but the grain never crawls.
 */
class GrainEffect extends Effect {
  private readonly animated: boolean;

  constructor({ amplitude = 0.022, animated = true }: GrainOptions = {}) {
    super('GrainEffect', GRAIN_FRAG, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform>([
        ['grainAmp', new THREE.Uniform(amplitude)],
        ['grainTime', new THREE.Uniform(0)]
      ])
    });
    this.animated = animated;
  }

  update(_renderer: THREE.WebGLRenderer, _inputBuffer: THREE.WebGLRenderTarget, deltaTime = 0): void {
    if (!this.animated) return;
    const u = this.uniforms.get('grainTime');
    // wrapped so the float never loses precision on a long-lived tab
    if (u) u.value = (u.value + deltaTime * 60) % 1000;
  }
}

const SplitTone = wrapEffect(SplitToneEffect);
const Grain = wrapEffect(GrainEffect);

const GRAIN_ARGS: [GrainOptions] = [{ amplitude: 0.022, animated: true }];
const GRAIN_STATIC_ARGS: [GrainOptions] = [{ amplitude: 0.022, animated: false }];

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
function FilmPass({ reduced, degraded }: { reduced: boolean; degraded: boolean }) {
  // IT6 ADAPTIVE QUALITY: on a machine that cannot hold the frame, the chain
  // collapses to the two effects that carry the look (glow + falloff) and drops
  // the three per-pixel ones. Same single EffectPass, ~half the ALU.
  if (degraded) {
    return (
      <EffectComposer>
        <Bloom mipmapBlur intensity={0.7} luminanceThreshold={0.9} luminanceSmoothing={0.2} />
        <Vignette darkness={0.55} offset={0.28} />
      </EffectComposer>
    );
  }
  return (
    <EffectComposer>
      {/* edge-weighted: modulationOffset keeps the middle ~40% of the frame clean */}
      <ChromaticAberration offset={[0.0009, 0.0006]} radialModulation modulationOffset={0.42} />
      <Bloom mipmapBlur intensity={0.7} luminanceThreshold={0.9} luminanceSmoothing={0.2} />
      <SplitTone args={SPLIT_TONE_ARGS} blendFunction={BlendFunction.NORMAL} />
      <Vignette darkness={0.55} offset={0.28} />
      <Grain args={reduced ? GRAIN_STATIC_ARGS : GRAIN_ARGS} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}

/* -------------------------------------------------------- IT6 adaptive quality */

/** rolling window used for the frame-time mean */
const FT_WINDOW = 60;
/** sustained mean above this (ms) drops the quality tier */
const FT_DEGRADE = 40;
/** sustained mean below this (ms) restores it — the gap IS the hysteresis */
const FT_RESTORE = 22;
/** how long the mean has to stay past a threshold before anything happens */
const FT_DWELL = 3;
/** a toggle can only fire this often, so the two thresholds can never flap */
const FT_COOLDOWN = 30;

/**
 * Round 2 measured SwiftShader fps roughly halving once the film pass and the
 * RectAreaLights landed. On a real GPU that is probably free; on a weak one it
 * is not, and we cannot know which we got. So: sample the frame time, and if the
 * full tier genuinely cannot hold it, spend the two most expensive things —
 * the three per-pixel effects and the two cool-fill RectAreaLights — rather than
 * ship a slideshow. Both thresholds need FT_DWELL seconds of sustained evidence
 * and only one toggle can fire per FT_COOLDOWN, so a machine sitting near the
 * boundary settles instead of oscillating.
 */
function AdaptiveQuality({ onChange }: { onChange: (degraded: boolean) => void }) {
  const samples = useRef<number[]>([]);
  const cursor = useRef(0);
  const sum = useRef(0);
  const overSince = useRef(-1);
  const underSince = useRef(-1);
  const degraded = useRef(false);
  const lastToggle = useRef(-FT_COOLDOWN);

  useFrame((state, dt) => {
    // a tab returning from the background reports one enormous dt — not evidence
    if (dt > 0.5 || dt <= 0) return;
    const ms = dt * 1000;
    const ring = samples.current;
    if (ring.length < FT_WINDOW) {
      ring.push(ms);
      sum.current += ms;
    } else {
      sum.current += ms - ring[cursor.current];
      ring[cursor.current] = ms;
      cursor.current = (cursor.current + 1) % FT_WINDOW;
    }
    if (ring.length < FT_WINDOW) return;

    const mean = sum.current / FT_WINDOW;
    const now = state.clock.elapsedTime;
    overSince.current = mean > FT_DEGRADE ? (overSince.current < 0 ? now : overSince.current) : -1;
    underSince.current = mean < FT_RESTORE ? (underSince.current < 0 ? now : underSince.current) : -1;
    if (now - lastToggle.current < FT_COOLDOWN) return;

    if (!degraded.current && overSince.current >= 0 && now - overSince.current > FT_DWELL) {
      degraded.current = true;
      lastToggle.current = now;
      setQualityFills(false);
      onChange(true);
    } else if (degraded.current && underSince.current >= 0 && now - underSince.current > FT_DWELL) {
      degraded.current = false;
      lastToggle.current = now;
      setQualityFills(true);
      onChange(false);
    }
  });
  return null;
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

/**
 * R8: flips `journey.firstFrame` after the first fully PAINTED frame. useFrame runs
 * BEFORE the render for that frame, so the flag waits for the second invocation —
 * by then one complete frame of the city exists on the canvas. The boot loader holds
 * its last 10% on this, which is what makes the meter's 100% an honest claim.
 */
function FirstFrameFlag() {
  const seen = useRef(0);
  useFrame(() => {
    if (seen.current > 1) return;
    seen.current += 1;
    if (seen.current === 2) useJourney.getState().setFirstFrame();
  });
  return null;
}

/** R8 intro dolly: how far back along the view axis, how much wider, for how long */
const INTRO_BACK = 10;
const INTRO_FOV = 4;
const INTRO_SECONDS = 2;
/** page-progress movement that counts as "the visitor took the wheel" */
const INTRO_CANCEL = 0.0006;

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
  // R8 intro dolly state: -1 = armed and waiting for the loader to clear,
  // 0..1 = playing, 1 = spent. `introW` is the additive weight, and it is the
  // ONLY thing that touches the finished pose.
  const introT = useRef(-1);
  const introW = useRef(0);
  const introKilled = useRef(false);
  const introAnchor = useRef(0);
  const baseFov = useRef(0);
  const lastFov = useRef(-1);
  const reduced = useMemo(() => prefersReducedMotion(), []);

  useFrame((state, dt) => {
    const { station, localT, boot, progress } = useJourney.getState();
    const delta = Math.min(dt, 0.05);
    const cam = state.camera as THREE.PerspectiveCamera;
    // captured before anything below can touch it, so it is the rail's true FOV
    if (baseFov.current === 0 && cam.isPerspectiveCamera) baseFov.current = cam.fov;

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

    // R8 ARRIVAL DOLLY — same contract as the wobble above: a purely ADDITIVE
    // offset on the finished pose that decays to EXACTLY zero, so from the moment
    // it is spent the rail is bit-exact again. It arms when boot reaches 1 (which
    // Boot.tsx does 250ms into the overlay fade, i.e. as the loader clears) and
    // eases expo-out from +10u back along the view axis and +4° of FOV into the
    // hero keyframe. Any scroll during those 2s hands the camera straight back.
    if (!reduced && introT.current < 1) {
      if (introT.current < 0) {
        if (boot >= 1) {
          introT.current = 0;
          introW.current = 1;
          introAnchor.current = progress;
        }
      } else {
        if (!introKilled.current && Math.abs(progress - introAnchor.current) > INTRO_CANCEL) {
          introKilled.current = true;
        }
        if (introKilled.current) {
          // the visitor took the wheel: fold the offset away fast
          introW.current = THREE.MathUtils.damp(introW.current, 0, 8, delta);
          if (introW.current < 0.002) {
            introW.current = 0;
            introT.current = 1;
          }
        } else {
          introT.current += delta / INTRO_SECONDS;
          const t = Math.min(1, introT.current);
          // expo-out on the REMAINING offset — 1 at t=0, exactly 0 at t=1
          introW.current = t >= 1 ? 0 : Math.pow(2, -10 * t);
          if (t >= 1) introT.current = 1;
        }
      }
    }
    if (introW.current > 0) {
      const w = introW.current;
      // pull straight back along the view axis: the orientation lookAt just set
      // stays valid, so the shot only widens — it never swings
      scratch2.current.copy(state.camera.position).sub(look.current).normalize();
      state.camera.position.addScaledVector(scratch2.current, INTRO_BACK * w);
      if (cam.isPerspectiveCamera) {
        const fov = baseFov.current + INTRO_FOV * w;
        if (fov !== lastFov.current) {
          cam.fov = fov;
          cam.updateProjectionMatrix();
          lastFov.current = fov;
        }
      }
    } else if (cam.isPerspectiveCamera && lastFov.current !== -1 && cam.fov !== baseFov.current) {
      cam.fov = baseFov.current;
      cam.updateProjectionMatrix();
      lastFov.current = baseFov.current;
    }
  });

  return null;
}

export default function CityScene({ tier }: { tier: QualityTier }) {
  // NOTE: CityLayer maps prefers-reduced-motion to tier 'off' (2D fallback), so
  // this is defensive — it only fires if the OS setting flips after tier detection.
  const reduced = useMemo(() => prefersReducedMotion(), []);
  // IT6: only the full tier can degrade — 'lite' already has no composer, and
  // its rigs stay at full light because they are the whole look there.
  const [degraded, setDegraded] = useState(false);
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
      <FirstFrameFlag />
      {tier === 'full' ? <AdaptiveQuality onChange={setDegraded} /> : null}
      {tier === 'full' ? <FilmPass reduced={reduced} degraded={degraded} /> : null}
    </Canvas>
  );
}
