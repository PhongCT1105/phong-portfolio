# Build Log — Silicon City overnight run

Format per entry: milestone · rounds · validator verdict · critic verdict · notes.

## M0 — 2D flow tier
- Commit 7c9bc23. Built before the loop; verified manually in browser (hero chips, receipts,
  shelf + case-study modal with #work/<slug> deep links, road, scheduler section).
- Phong's reaction: structure OK but flat — drove the city-first replan (commit b0403be).

## M1 — Foundation (r3f canvas, tiers, Lenis journey store, camera rail, post)
- 3 rounds. Round 1 FAIL: opaque body background painted over the negative-z city layer
  (CSS painting-order bug; fix = transparent body, html keeps the bg). Round 2 validator PASS.
  Critic: FIX FIRST — top-down cameras (no horizon), flat fog, flood-lit placeholders, body
  text over bright geometry, interpenetrating boxes. All five fixed: rail re-aimed to shallow
  pitch (−8..−15°, lift-off exempt), fog #050c07 @0.005 with bg match, near-black ambient +
  faint emissives, .text-scrim panels on all body-copy blocks, grid-snapped footprints.
- Round 3 validator PASS: measured aerial falloff (near G≈123 → far G≈4), horizon in every
  ground shot, all text on scrims, no fusion, console clean. Screenshots: scratchpad shots-r3/.
- Critic's M2 guidance (G1–G5) recorded in BUILD_PLAN.md.
- Validator method note: claude-in-chrome had no responsive local browser overnight; validators
  drive local headless Chrome via CDP (SwiftShader). Protocol updated in ACCEPTANCE.md.

## M2 — Instanced city (skyline, windows, trace ground, signage)
- 3 rounds. Round 1 FAIL (7 defects): windowed roofs + UV stretch, hero camera above roofline,
  sign undersized, no brightness hierarchy, flat crown slabs, bare-pole cranes, faint ground
  traces. Fixed via height-bucketed instanced batches with per-batch square-cell UV repeats +
  per-tier lit densities (0.22/0.11/0.05), multi-material dark roofs, hero rail dropped to
  y14 below the 22u hero tower, sign doubled, jib+counter-jib cranes, brighter infill + vias.
- Round 2 validator PASS on all 7. Critic: FIX FIRST — sign glowed over honors text at 75%
  (now distance-faded to 0 past 40% scroll), single-sided banners (ghost slabs gone).
- Round 3 targeted validator PASS: hero unchanged, no sign bleed, dark roofs from above,
  terminal legible. Critic's hero-shot verdict: "would survive on threeui.com".
- Critic's later-milestone guidance (ground v2 PCB routing, mid-field density, stepped crowns
  + beacons, 35% composition, brand banner tints) recorded in BUILD_PLAN.md.
- Screenshots: scratchpad shots-m2r1/, shots-m2r2/, shots-m2r3/.

## M3 — Boot power-on + hero integration
- 2 rounds. Round 1 validator PASS on mechanics (translucent overlay, monotonic power-on,
  sign flicker, 2s beacons, fast-boot path). Critic: FIX FIRST — power-on read as a delayed
  fade-in, not a moment: dead air, imperceptible per-line deltas, stacked payoffs, panel
  covering downtown.
- Fixes: lighter scrim (.58 edge), power thresholds compressed to [0,0.5] with per-line boot
  steps 0.16..0.8, tighter line pacing (240/200ms), CONNECTED staged as a beat (hold →
  1.5×-size line → overlay fade → sign flicker 250ms into fade via boot 0.9→1.0 gate at 0.99),
  boot panel anchored lower-left (x≈86, top 54%).
- Round 2 validator PASS with frame-level ordering + luma-step measurements confirming every
  prescribed fix (critic's close condition met). Caveat noted: SwiftShader's ~1.7s first WebGL
  frame collapses lines 1–4's deltas in headless; real GPUs paint from line 1.
- Protocol hardened: validators must use a dedicated --user-data-dir and never taskkill
  chrome.exe by name (round 1 killed the user's own Chrome — logged for the morning summary).
- Critic's later guidance (beacon breathing + extra masts, hero mid-ground tier, tagline
  seating, THREE.Clock cleanup) recorded in BUILD_PLAN.md.
- Screenshots: scratchpad shots-m3r1/, shots-m3r2/.

## M4 — Memory vaults + receipts sync + ground v2 (7 rounds — the hard one)
- r1 FAIL: plaques occluded INSIDE vault bodies, no stagger read, DOM out of sync, ground
  bundles too faint. r2 PASS mechanics after: plaque moved proud of body face, per-approach
  edge gating, thresholds lowered, values held at $0K until door-open, corridor cleared,
  brighter PCB bundles. Critic: FIX — flat saturated pads (carnival), hierarchy inverted,
  wrong-value-under-card, station exit polluted chapter 02's shot.
- r3–r6: pads→thin rings, hierarchy plaque>frame>ring, exit strike-the-set (all vault light
  →0 at localT .82–.98) all landed and stayed green; but per-card ALIGNMENT kept failing —
  camera trucked through the station (fixed with a camera HOLD: rail + look-at both freeze
  through localT 0.3–0.85; hold verified byte-identical), yet the world→screen projection of
  a fixed row can never track a responsive DOM grid (measured pitch 373px vs card 319px, and
  it varies with viewport). Root cause was the DESIGN, not calibration.
- r7 PASS with the revised design (the critic's own "one-number discipline"): vaults open
  onto soft org-color light facing the held camera; the DOM card alone carries the number,
  counting up in lockstep with its door. Order + choreography are the contract — robust at
  any viewport. Exit clean, console clean.
- LESSON (recorded for M5–M8): never pin 3D world objects 1:1 to responsive DOM elements;
  sync ORDER and TIMING, let one medium own each piece of content.
- Also: SmoothScroll re-measures station ranges at 2.6s (late layout shift made ranges stale);
  validator settle rule extended for SwiftShader (poll to byte-identical).
- Screenshots: scratchpad shots-m4r1..r7/.

## M5 — The Fab (4 rounds)
- r1 validator PASS on mechanics (focus sync by order, open/close rise+fan, deep links, modal
  authoritative). Critic: FIX — hall read as broken sticks at 15% width behind cards, chips
  matte with invisible focus glow, fan crumpled/self-intersecting and unseen behind the modal.
- Rebuild: 5 portal ribs + continuous ridge + glass volume, hall enlarged and repositioned
  into the frame's dead zone; chip trace-inlay tops; per-chip POINT LIGHTS keyed to focus/open
  (the lighting switch is now measured at ±36/255 with a colored pool on the platform — vs
  ≤1.5/255 before); fan pages re-hinged to lie flat and open upward like a book (no piercing);
  the case-study modal waits 600ms so the rise+fan is witnessed (close instant); focused DOM
  card lift reduced so it never covers the chip row.
- r3 all-but-one: rib span 24.6% vs ≥28% gate → ribs widened ±26 on a 60u platform.
- r4 micro-check PASS: span 29.0%, ridge clears the note card, console clean. Critic's three
  must-lands all landed → closed.
- Screenshots: scratchpad shots-m5r1..r4/.

## M6 — The Avenue (5 rounds; found + fixed a foundational rail bug)
- r1 FAIL exposed the root cause: the rail fed PAGE progress into arc-length getPointAt, so
  stations never landed on their keyframes — the camera drove the avenue during the work
  chapter and was airborne during the road chapter. Fixed with per-segment mapping
  (station+localT)/segments via getPoint.
- r2: remap correct in principle but two composition breaks — no ignition lead (camera reached
  each gate exactly at its threshold) and the Catmull segment bowed off the corridor. Fixed:
  station 3 drives a STRAIGHT z-locked path x 72→−52 (15–25u lead at every ignition) with the
  look-target held down the avenue; gate standby emissive 0.3.
- r3: road shots now cinema — validator measured each igniting gate's hue DOMINATING its frame
  (e.g. 11k hue-0 pixels, meanV .94 for Adobe) with colored pools, DOM cards exact at every
  threshold, Zolli dot hollow until active. One regression: station-2 hold landed at the
  reshaped segment's near corner (hall at 90% width close-up).
- r4/r5: station 2 holds AT its keyframe with frozen look; hall moved to ~110u distance —
  measured 33% width, coherent ribs+ridge, focus glow switch verified. PASS.
- Rail architecture now: per-segment mapping + holds at stations 1 (vault reveal), 2 (fab),
  3 (straight avenue drive). Honors strip verified. Console clean throughout.
- Screenshots: scratchpad shots-m6r1..r5/.

## M7 — Scheduler hall (3 rounds; closed PARTIAL at round budget)
- Built: depot tower + 3 bays + 36 instanced crates arcing depot→bays at the real 3.7× speed
  spread; ~14s bay-death loop (bay dims salmon, crates arc back and reroute); NVIDIA-green
  horizon rises at station end; DOM 47% counter fires on station entry (clamped, no negative
  frame); mid-field low-rise fill near the rail; breathing beacons (300ms rise/600ms decay)
  with 2 extra phase-offset masts on the tallest west/south towers; station-4 camera hold.
- r1: hall hidden behind the DOM stat panel + crates lockstep-clumped (parking erased phase
  spread). Fixed: continuous flow, 1.15u crates, lit structure + plaza point light, DOM cards
  narrowed to open a center gap, camera panned, counter threshold lowered.
- r2: mostly passing (7 distinct crates, death seen 3/7 shots, counter verified) except the
  fast bay sat behind the copy card. Fixed: fast bay moved to CENTER, slow/dying right;
  crate rate raised so slow crates traverse inside the death cycle.
- r3 micro-check FAIL on: right-bay traffic not seen in 4 shots, death state missed (4.9s
  window / 4 samples — probabilistic miss), stream partially clipped at edges. ROUND BUDGET
  REACHED → closed PARTIAL; residuals queued for M10 polish + Phong's morning review.
- Screenshots: scratchpad shots-m7r1..r3/.

## M8 — Lift-off / chip-on-board reveal (2 rounds)
- Built: orbit keyframe raised to (−30,500,300) after numeric FOV check (die + board must
  fit); fog thins dynamically with camera altitude; PCB reveal fades in at station 5 — board
  plane, package rim, gold pin-pad rows on all four sides; uplink beam at the I/O corner
  blinking on the terminal caret's ~0.9s cycle; roofs lifted just above void for the orbit
  read; contact section now fills the viewport (96svh) so the reveal owns the frame.
- r1 FAIL: pin-pad instance matrices were set in a microtask before the mesh mounted (never
  applied) → no pads/rim visible; near die edge cut; climb too late; ch-04 DOM bleed.
- r2 PASS, no defects: rim + pad rows verified on all four sides, die ~60% of frame with all
  edges in, ch-04 provably out of view, climb visible by 93%, terminal legible, console clean.
- Screenshots: scratchpad shots-m8r1/, shots-m8r2/.

