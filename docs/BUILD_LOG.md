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

