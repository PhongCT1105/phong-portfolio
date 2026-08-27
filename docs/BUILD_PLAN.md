# Silicon City — Build Plan (v2, city-first)

Design: https://claude.ai/code/artifact/1822c13b-f203-44e9-aa0e-899f4173798f
Acceptance rubric + validator/critic protocols: docs/ACCEPTANCE.md
Progress log (append per iteration): docs/BUILD_LOG.md

## Loop rules
- City-first: the 3D world is the product; the 2D flow (already built, commit 7c9bc23) is the
  fallback tier only.
- Per milestone: BUILD → `npm run build` green → VALIDATOR agent (browser screenshots vs
  ACCEPTANCE.md) → CRITIC agent (taste) → apply fixes → repeat until BOTH pass (max 3 rounds,
  then log SKIPPED + move on) → tick box → commit + push → append BUILD_LOG.md entry.
- Iterate-until-impressive was chosen by Phong: do not close a milestone on "works but mediocre".
- Never break: SSR content, reduced-motion/no-WebGL 2D tier, deep links, build.
- No Vercel deploys. Facts trace to public/Phong_Cao_Resume.pdf.
- Pending from Phong (leave placeholders, do not block): project screenshots, FlashML PyPI
  name, Captain Ddoski repo/Devpost, ZolliAI URL.

## Milestones (criteria live in ACCEPTANCE.md)

- [x] M0 — 2D flow tier (done: commit 7c9bc23)
- [x] M1 — Foundation: r3f canvas + quality tiers + Lenis/zustand journey store + camera rail + post baseline
- [x] M2 — City ground: traces, instanced window-lit towers, downtown + PHONG CAO signage
- [x] M3 — Boot power-on + hero DOM over the city (network-canvas retired)
- [x] M4 — Memory vaults + receipts sync (revised: one-number design — vaults open onto org-color light; DOM owns the numbers)
- [x] M5 — The Fab: chip pedestals + chip-book case studies
- [x] M6 — The Avenue: 5 gates + road sync (also fixed the global rail: per-segment mapping + per-station holds)
- [x] M7 — Scheduler hall + 47% counter — PARTIAL: core verified (hall framed in DOM gap,
      continuous phase-spread streams, 47% counter, NVIDIA horizon, death cycle seen in r2);
      residuals for M10: right/slow bay traffic rarely visible, death state capture flaky in
      short windows, center stream partially clipped by card edges at some scrolls
- [x] M8 — Lift-off reveal + contact orbit
- [x] M9 — Mobile-lite + fallback polish (validated clean first pass; badge labels bumped 8→9px)
- [x] M10 — Full-journey QA + log complete (PASS, 0 critical / 3 minor logged)

## M2 guidance from the M1 critic (implement these; they are the acceptance bar)
- G1 Skyline: log-normal heights — ~65% of towers 1–3u, 28% 4–8u, 7% 10–16u, plus 2–3 hero towers
  18–22u in downtown (placed ahead-right of hero camera, right third of frame behind "CAO");
  footprints 1×1..3×2, 2 crane silhouettes, 1–2 stepped-setback towers; hero shot must show ≥8
  distinct height steps on the horizon.
- G2 Light: bodies near-black #080d08; canvas window texture, 15–25% windows lit, 70% warm-white
  #ffe9c4 / 30% pale green #9effc0, per-instance offset; bloom hits ONLY windows/signage/packet;
  brightness tiers downtown 2× districts 2× ground traces.
- G3 Ground: circuit-trace plane — 4–6u avenues (#1a4a3a low emissive) linking districts, 1u infill
  traces at 30% brightness, via-dots at junctions; dark contact gradient (1.5× footprint, →40%)
  under every tower so nothing floats.
- G4 Color discipline: ≤2 accent hues per screenshot; district accents on ≤10% of its lit windows
  (vault org colors, gate colors, NVIDIA horizon only at their stations).
- G5 Rooftop PHONG CAO signage on tallest downtown tower facing hero camera; letter height
  1.2–1.5u (~20–28px in the 1440 hero shot); emissive white ~1.5× window brightness — the single
  brightest thing in frame; flicker-on hook for M3 boot.

## Later-milestone guidance from the M2 critic (apply at the named milestones)
- (M4–M6) Ground v2: replace uniform grid with PCB routing — bundles of 3–5 parallel traces with
  45° bends, via dots, avenue traces 2–3× base brightness into each district. Highest-leverage
  fix for the 55%→bottom shots.
- (M7 window) Mid-field density: low-rise fill (0.15–0.3× downtown height, clustered per district)
  to ~25–35% ground coverage within 2 blocks of the rail — district clustering must read.
- (M3) Downtown roofline: stepped crowns on the 2–3 tallest (stacked boxes 60%/35% footprint),
  1–2 antenna masts with 2s blinking beacon; cranes already upgraded.
- (M5) 35% shot composition: light a crown band on near towers or raise the rail 10–15% at the
  work station so skyline (not a black mass) backs "Four real projects."
- (M5+) Brand banner tints: 4–6 towers per district in district-appropriate accents, max 2 accent
  hues per frame.

## Later guidance from the M3 critic
- (M7 window, with mid-field density) Beacons: 3–4px emissive core + bloom halo, ~300ms rise /
  600ms decay breathing (not binary blip); add 2 more masts at differing phases far-left/right.
- (M7 window) Hero mid-ground: dim mid-rise tier (30–40% window density) in the left void
  (x 0–450 screen) so fog separates three depth planes.
- (M9 polish) Tagline seating: nudge "I build systems…" up ~24px or dim windows behind its
  bounding box ~30% at the hero station (text-priority lighting).
- (M10) Silence THREE.Clock deprecation warnings if a clean fix exists.

## Later guidance from the M4 critic
- (M8) Orbit ground legibility: roofs just above void (~#0a120c) and LOD-swap window texture
  past ~150u to a coarser map (4× larger cells, 1/4 windows) — buildings currently break the
  orbit illusion as speckled crumbs.
- (M9 polish) Door-open as the Kage moment: solid door panel whose interior face is emissive,
  spilling a soft org-color pool (~2u radius, ~0.3 intensity) when open; stagger opens ~150ms.
- (M9 polish) One-number discipline: plaque inside the vault, visible only through the open
  doorway, so each value exists once until the door hands it to the world.

## Tech pins
- three, @react-three/fiber, @react-three/drei, @react-three/postprocessing, lenis, zustand, maath
- One fixed <Canvas>; scenes mounted per station-neighborhood; instancing everywhere; DPR ≤ 1.75
- Journey store: lenis scroll progress → { progress, station, localT }; camera = CatmullRomCurve3
- Covers/case studies stay DOM (SEO); 3D only stages them

## Links
- FlashML: github.com/Zolli-Labs/flashml · On-Device: PhongCT1105/On-Device-Real-Estate-Assistant
- Berkeley repo candidate: PhongCT1105/AI_Hack_Berkeley (confirm with Phong)
- Temp project images: https://opengraph.githubassets.com/1/<owner>/<repo>
