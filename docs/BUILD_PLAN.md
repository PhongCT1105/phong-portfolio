# Silicon City — Build Plan

Design source of truth: https://claude.ai/code/artifact/1822c13b-f203-44e9-aa0e-899f4173798f
(pages: Page Flow = 2D layout/content · Silicon City = 3D world map + ride)

Rules for the build loop:
- Work top to bottom; check a box only after `npm run build` passes and the change is verified.
- Commit after each milestone (local git; push to origin as backup — no Vercel work).
- Never break the 2D tier: it is the mobile / reduced-motion / no-WebGL fallback.
- All facts must trace to the resume (public/Phong_Cao_Resume.pdf). "Presented" (not "published") at IEEE MIT URTC.
- Pending from Phong (do NOT block on these, leave marked placeholders):
  - Screenshots: FlashML, Captain Ddoski, Hospital Nav frontends
  - FlashML PyPI package name · Captain Ddoski repo/Devpost link · ZolliAI site URL

## P1 — New 2D flow (the approved Page Flow mock)

- [x] P1.1 content.ts restructured: hero, color affiliations, receipts (sourced), 4 real projects
      (FlashML→github.com/Zolli-Labs/flashml, Captain Ddoski, On-Device Q&A→PhongCT1105/On-Device-Real-Estate-Assistant,
      Hospital Nav), road stops, honors (incl GPA 3.92), now-section copy
- [x] P1.2 Hero rebuilt: name, "I build systems that survive failure.", one-line sub,
      full-color affiliation chips (NO ticker), chapter nav (01 RECEIPTS / 02 WORK / 03 ROAD / 04 NOW / CONNECT)
- [x] P1.3 Receipts section (replaces Numbers): 4 cards, value + meaning + source dot, count-up on reveal
- [x] P1.4 Work shelf 2D (wheel-browse deferred to P3 3D shelf; arrows/click/keyboard/hash done): 4 project cards standing on a shelf line, focus state (click/arrows/wheel-over-shelf),
      caption bar (n/4 · title · desc · OPEN), case-study modal with problem/built/measured/stack/links,
      deep link via #work/<slug>, ESC closes
- [x] P1.5 Road section (replaces Wins+Experience+Education): 5-stop timeline with org colors + metric chips,
      honors strip (prizes, GPA 3.92 + Presidential Scholarship, WPI BS+MS '27)
- [x] P1.6 Now section (replaces Focus): scheduler diagram — queue, 3 workers (fast/mid/died), CSS-animated
      crates + counters, "47% faster" stat, NVIDIA next line
- [x] P1.7 Contact: keep terminal; email/GitHub/LinkedIn/Resume; remove "Built without a framework" remnants
- [x] P1.8 Delete dead sections/styles (old components deleted; unused CSS classes in components.css/layout.css remain — prune opportunistically) (AffiliationRail ticker, Numbers, Focus viz, Wins rail, Research card,
      Experience, Education) — content they held now lives in Receipts/Road; update metadata description if needed
- [ ] P1.9 Full check: npm run build green, browser pass desktop + 390px width, reduced-motion sane. Commit.

## P2 — The city ground + camera drive (3D tier 1)

- [ ] P2.1 Install three @react-three/fiber @react-three/drei @react-three/postprocessing lenis zustand maath;
      build still green
- [ ] P2.2 CityCanvas mounted fixed behind DOM, lazy-loaded after first paint; quality tiers:
      desktop full / mobile lite / no-WebGL or reduced-motion → unmount (2D stays)
- [ ] P2.3 useJourney store: Lenis scroll → progress 0..1 → station index + local t; DOM sections aligned
      to station ranges
- [ ] P2.4 Procedural city ground: die-boundary plane, trace grid, instanced buildings (canvas window texture,
      emissive), fog, Bloom, vignette; 60fps desktop / stable mobile-lite
- [ ] P2.5 Camera rail: CatmullRomCurve3 through 6 stations per SiliconMap, damped scroll follow,
      mouse parallax ±1.5°, station look-ats
- [ ] P2.6 Boot integration: boot log lines switch city blocks on (grid power-on), CONNECTED = full glow;
      session id kept
- [ ] P2.7 Downtown: taller core towers cluster + "PHONG CAO" rooftop signage (drei Text, emissive),
      brand-color banner strips on towers
- [ ] P2.8 Perf guard: DPR clamp 1.75, demand frameloop at idle stations, tab-hidden pause, draw calls < 30. Commit.

## P3 — The districts + the reveal (3D tier 2)

- [ ] P3.1 Memory Quarter: 4 vault blocks, doors slide open on approach, numbers glow inside
      (sync with DOM receipt count-up)
- [ ] P3.2 The Fab: glass hall + 4 chip pedestals; focused chip glows; OPEN = chip rises + layers fan
      open (hinged planes) synced with case-study modal
- [ ] P3.3 The Avenue: 5 checkpoint gates, org colors flood road + scene tint on pass; DOM road cards
      activate in sync
- [ ] P3.4 Scheduler Hall: depot + 3 bays, instanced crates flow at 3.7x speed ratios, bay-death loop
      returns crates; "47%" DOM counter sync
- [ ] P3.5 Lift-off reveal: camera climbs, city LOD swaps to chip-on-PCB (board plane + chip block),
      uplink beacon blink synced to terminal caret
- [ ] P3.6 Final polish: transitions between stations eased, chromatic pulse at gates only, film grain match;
      full journey test at 60fps; mobile-lite journey test. Commit.

## Notes / links
- FlashML org repo: github.com/Zolli-Labs/flashml (confirmed exists; flashml-cloud also exists)
- On-Device: github.com/PhongCT1105/On-Device-Real-Estate-Assistant
- Berkeley project repo candidates: AI_Hack_Berkeley / AI_HACK_BERKELEY_TERAC — needs Phong's confirm
- GitHub OG images usable as temp project images: https://opengraph.githubassets.com/1/<owner>/<repo>
