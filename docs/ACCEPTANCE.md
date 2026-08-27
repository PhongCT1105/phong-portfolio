# Acceptance — Silicon City

The rubric for the overnight loop. The VALIDATOR checks the boxes; the CRITIC enforces the
constitution. A milestone is DONE only when both pass. Design source of truth:
https://claude.ai/code/artifact/1822c13b-f203-44e9-aa0e-899f4173798f (pages "Silicon City" + "Page Flow").

## Taste constitution (applies to every milestone)

1. PLACE, NOT PARTICLES — everything on screen must read as part of one physical city at night.
   No floating abstract dots, no decorative geometry with no story meaning.
2. MOTIVATED LIGHT — brightness comes from sources in the world (windows, the packet, gates,
   signage). Bloom threshold high: only emissives glow. If everything glows, nothing does.
3. RESTRAINT — void #050705, fog for depth, max 2 accent hues on screen at once beyond the
   green base. Film grain subtle. No lens-flare kitsch.
4. MOTION IS HONEST AND EASED — every animation depicts something true (jobs, power, travel).
   Durations 300–800ms for UI, 1.5–6s for world moves; easing cubic-bezier(.16,1,.3,1) or
   spring-damped. Nothing linear except conveyor-like loops.
5. TYPE RHYTHM — DOM text must stay legible over the city (panel scrims where needed,
   contrast ≥ 4.5:1 for body text). Section vertical rhythm: generous, no cramped blocks.
6. PERFORMANCE IS PART OF TASTE — 60fps desktop target; scroll never stutters; total added
   JS for 3D ≤ ~250KB gz; draw calls < 40.
7. THE ANSWER TO "WOULD THIS IMPRESS ON THREEUI.COM?" MUST BE YES before a milestone closes.

## Validator protocol

- Start/refresh production server: `npm run build` then `npm start` (kill the old one first).
- Browser: if the claude-in-chrome extension has no responsive local browser, use local headless
  Chrome driven over CDP (SwiftShader WebGL works) at 1440x900; save screenshots under the
  session scratchpad. This path is proven — see M1 round 1.
- NEVER `taskkill /IM chrome.exe` or otherwise kill Chrome processes you did not launch — that
  closes the user's own browser. Launch headless Chrome with a dedicated
  `--user-data-dir=<scratchpad temp dir>` for a fresh session/profile, and terminate ONLY the
  process id you started.
- Desktop pass at default window; capture screenshots at these scroll depths:
  top (hero), ~15% (receipts), ~35% (work), ~55% (road), ~75% (now), bottom (contact).
- IMPORTANT: wait ≥3s after each scroll before shooting — the camera is damped and needs
  ~1.5–2.5s to settle after a large jump; early shots produce phantom framing defects.
- Under SwiftShader headless the effective settle is MUCH longer (low FPS × Lenis lerp ×
  camera damping): for alignment-critical shots wait 10–12s, or poll two captures 2s apart
  until pixel-stable before judging.
- Mobile pass: resize window to 390px wide, repeat top/middle/bottom.
- Compare against the milestone checklist below AND the storyboards. Report:
  PASS or FAIL + numbered concrete defects ("towers uniform height = looks extruded-box",
  "name signage unreadable at hero station"), each with a suggested fix.
- Check console for errors (read_console_messages) — any red error = FAIL.

## Critic protocol

- Look only at the screenshots from the validator round (or take fresh ones).
- Judge against the constitution + the Kage/Complete Shelf bar: composition per shot,
  lighting hierarchy, whether each station has ONE clear focal point, whether motion
  would feel alive. Output: ranked list of the 3–5 highest-impact improvements, concrete
  enough to implement ("add 6–10 tower height variance and 2 crane silhouettes on the
  skyline", not "make it nicer").

## Milestone checklists

### M1 — Foundation (canvas, tiers, scroll, camera rail)
- [ ] r3f Canvas fixed full-viewport behind DOM; DOM scrolls over it; site still SSR-complete
- [ ] Quality tiers: desktop full / mobile lite / reduced-motion or no-WebGL → canvas unmounted, 2D intact
- [ ] Lenis smooth scroll feeding a zustand journey store (progress, station, localT)
- [ ] Camera on CatmullRom rail through 6 stations; damped follow; mouse parallax ±1.5°
- [ ] Fog + Bloom + vignette baseline; 60fps with placeholder ground

### M2 — City ground + downtown
- [ ] Die-boundary ground plane with trace grid (not a plain grid — trace-like circuits)
- [ ] Instanced towers, window-lit (canvas texture), height/footprint variance, district clustering
- [ ] Downtown cluster taller; rooftop "PHONG CAO" signage readable from hero station
- [ ] Brand-color banner accents on select towers
- [ ] Skyline silhouette interesting from hero camera (validator screenshot vs SceneHero/SiliconRide shot 2)

### M3 — Boot power-on + hero integration
- [ ] Boot log lines each switch on a city block (staged emissive ramp); CONNECTED = full skyline
- [ ] Old network-canvas removed; hero DOM sits over the city with legible type
- [ ] Session id survives; reduced-motion users skip straight to lit city / 2D tier

### M4 — Memory vaults (receipts)
- [ ] 4 vault structures in the memory quarter, org-colored edge light
- [ ] Doors open as camera approaches; DOM receipt count-up syncs with door-open
- [ ] Receipts DOM cards restyled to sit in-world (scrim panels, aligned to vaults)

### M5 — The Fab (projects + chip-book)
- [ ] Glass hall + 4 chip pedestals; focused chip glows; browse via arrows/keys/click
- [ ] OPEN: chip rises + layers fan open (hinged planes), case-study DOM aligned to the spread
- [ ] Deep links #work/<slug> still work; ESC folds back; mobile falls back to 2D modal

### M6 — The Avenue (road)
- [ ] Light-trail road + 5 gate frames (FPT/NSF/Adobe/Zolli/NVIDIA colors)
- [ ] Passing a gate: gate ignites + brief scene tint + matching DOM road card activates
- [ ] Honors strip present at the end of the avenue

### M7 — Scheduler hall (now)
- [ ] Depot + 3 bays; instanced crates flow at 3.7× ratios; death loop returns crates
- [ ] 47% DOM counter ticks when hall is in view; NVIDIA horizon glow at station end

### M8 — Lift-off reveal (contact)
- [ ] Camera climbs; city LOD-swaps to chip-on-PCB reveal; uplink beacon syncs with caret
- [ ] Terminal + links legible over the orbit shot

### M9 — Fallback + mobile polish
- [ ] Mobile-lite: reduced instances, no postprocessing, stable 40fps mid-range
- [ ] Reduced-motion + no-WebGL: 2D page coherent and polished on its own
- [ ] 390px pass on every section; no horizontal scroll

### M10 — Full-journey QA
- [ ] One continuous scroll top→bottom: no pops, no station jump-cuts, transitions eased
- [ ] Console clean; build green; Lighthouse perf ≥ 85 desktop
- [ ] BUILD_LOG.md complete with per-milestone screenshots
