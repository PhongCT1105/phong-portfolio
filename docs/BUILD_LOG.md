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

