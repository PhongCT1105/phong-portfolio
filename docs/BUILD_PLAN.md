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
- [ ] M1 — Foundation: r3f canvas + quality tiers + Lenis/zustand journey store + camera rail + post baseline
- [ ] M2 — City ground: traces, instanced window-lit towers, downtown + PHONG CAO signage
- [ ] M3 — Boot power-on + hero DOM over the city (network-canvas retired)
- [ ] M4 — Memory vaults + receipts sync
- [ ] M5 — The Fab: chip pedestals + chip-book case studies
- [ ] M6 — The Avenue: 5 gates + road sync
- [ ] M7 — Scheduler hall + 47% counter
- [ ] M8 — Lift-off reveal + contact orbit
- [ ] M9 — Mobile-lite + fallback polish
- [ ] M10 — Full-journey QA + log complete

## Tech pins
- three, @react-three/fiber, @react-three/drei, @react-three/postprocessing, lenis, zustand, maath
- One fixed <Canvas>; scenes mounted per station-neighborhood; instancing everywhere; DPR ≤ 1.75
- Journey store: lenis scroll progress → { progress, station, localT }; camera = CatmullRomCurve3
- Covers/case studies stay DOM (SEO); 3D only stages them

## Links
- FlashML: github.com/Zolli-Labs/flashml · On-Device: PhongCT1105/On-Device-Real-Estate-Assistant
- Berkeley repo candidate: PhongCT1105/AI_Hack_Berkeley (confirm with Phong)
- Temp project images: https://opengraph.githubassets.com/1/<owner>/<repo>
