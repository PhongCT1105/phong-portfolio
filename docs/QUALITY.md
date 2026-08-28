# The $10K Loop — overnight quality pass (2026-08-28)

THE BAR: the orchestrator looks at the settled page as a buyer with a $10,000 budget for a
personal landing page. Would they pay? Every audit answers per chapter: BUY / HESITATE / WALK,
with the exact reason. The loop runs until two consecutive audits say BUY on every chapter
with nothing above minor, or morning.

Reference recipes (measured from the ThreeUI demos' shipped code — see session research):
damp rates mouse≈2.5 / scroll≈5 / camera≈8 / UI≈18; expo-out token cubic-bezier(.16,1,.3,1)
at .4–.8s; film pass = animated grain ~0.02 + vignette + bloom(threshold .86, strength .34)
+ edge CA + split-tone (teal shadows / warm highlights); studio rig = warm key + cool fill +
RectAreaLights + env reflections + contact shadows; idle life = phase-offset sine breathing
`sin(t*0.72+i*0.8)*0.012` + light flicker + hand-held wobble; one earned "toy" interaction.

## Hard rails (violating any = revert)

- `npm run build` stays green; zero console errors at 1440/2560/390.
- DO NOT REGRESS: camera rail per-segment mapping + holds; scroll-derived focus order
  (receipts/work/road monotonic); tier system ('off' = 2D fallback untouched unless listed);
  text ≥4.5:1; facts trace to the resume; ≤2 accent hues at full luminance per view;
  prefers-reduced-motion honored for every new animation; film pass full-tier only.
- Validators: local headless Chrome CDP SwiftShader 1440x900, ONE dedicated --user-data-dir
  deleted at end, NEVER taskkill chrome.exe by name (own PID only), settle ≥10s (13s hero),
  screenshots to session scratchpad only, no repo writes, finish SYNCHRONOUSLY.
- Implementers: edit only files their brief names; build before returning; no new deps
  without orchestrator sign-off (exception: @react-three/drei is already installed —
  ContactShadows/RectAreaLight/useCursor are fair game).
- Commit + push per iteration; verify `git log origin/main -1`.

## Backlog (seeded from the 2026-08-27 interactivity + design audits)

R1 RESPONSE BUGS (hours, flips the feel)
  - Fab.tsx chip cursor clobber: four per-frame `document.body.style.cursor` writers,
    last-write-wins → pointer never shows. One shared hover source (store index or module
    ref), one writer. Same for any other per-frame cursor writer.
  - Vaults: add onPointerOver/Out → setReceiptHover(index) (the flare path already exists
    and works) + pointer cursor. Remove the no-op readout-hover flare (flares focusIdx).
  - Nav/deep-link scrolling rides the rail: expose the Lenis instance; anchors use
    lenis.scrollTo with easing, no instant jump.
  - Focus outlines on contact icon pills + receipt dots (2px accent, match case links).
  - Brand strip: stop promising interaction it doesn't have (drop hover bg) OR make items
    real links to proof; keep marquee hover-pause.
  - Hero verb cycle grammar: only plural nouns ('systems','pipelines','platforms',
    'clusters') so "…that survive failure" always agrees.
R2 OBJECT HOVER RESPONSE (the "like the book" ingredient)
  - Hovered chip/vault/NOW machine: lift ~0.03 of its height + emissive/light brighten,
    damp rate ≈8 in, ≈5 out; drei useCursor for pointer.
R3 FILM PASS (full tier only)
  - Add animated grain (~0.02), edge-weighted chromatic aberration, split-tone via
    @react-three/postprocessing in Effects.tsx; keep bloom discipline (one bright element
    per view); tune, don't stack until mushy. Guard: lite tier keeps current chain.
R4 IDLE LIFE
  - Phase-offset breathing on chips, vaults, NOW machines; window/beacon flicker phase
    spread; subtle hand-held camera wobble (sin(t*0.21)*0.13 pos + 0.004 roll) added to the
    rig AFTER rail+parallax, attenuated during transits; reduced-motion disables.
R5 STUDIO LIGHT + MATERIALS
  - ContactShadows (or faked blob shadows) under chips, vaults, NOW machines, contact chip.
  - RectAreaLight warm key + cool fill on the fab shelf and NOW bench.
  - Vault doors: envMapIntensity up, roughness variation, rim light; frame emissive with
    gradient falloff (kill the aliased stair-step).
  - Contact PCB: gold pads → metalness 1 / env response + bevel; silkscreen micro-text
    canvas texture on substrate.
R6 GEOMETRY + PAINTED DETAIL (the 30%)
  - Chip pedestals: chamfered plinth + engraved serial edge + contact shadow (no bare cubes).
  - Road gates: gantry truss geometry; LAYERING FIX — gates must never slice DOM cards
    (fade/occlude behind card layer at hold).
  - Hero-framed towers (6–8 only): facade ribs/parapet variation; window temperature +
    intensity variance in the window texture; fade .global-grid where canvas owns the frame.
  - NOW: depot board canvas texture (queue rows/scanlines, not one lime rectangle); packet
    emissive falloff; fan hubs+blades already exist — verify read.
  - Receipt viz label collision (spark line strikes "100+ PILOT USERS") → offset labels.
  - Casebook: diagram fills its panel (no half-empty container); restyle GitHub OG images
    dark (duotone/dark-crop container), caption to quiet "IMAGERY · GITHUB" (real shots
    come from Phong later — do not fabricate screenshots).
  - Micro-type floor 10px; mono reserved for data values, not every label.
R7 THE TOY
  - Drag-to-orbit the FOCUSED chip (and/or contact chip): pointer-drag yaw/pitch clamped,
    spring-back on release, contextual cursor (grab/grabbing), one-line mono HUD readout
    echoing the interaction. Must not fight page scroll (drag starts only on the object).
R8 ARRIVAL
  - Boot loader: staged narrative labels tied to real readiness (fonts + first rendered
    frame gate the last 10%), then a ~2s intro dolly easing into the hero keyframe.
- (STRETCH) chapter dip-to-black dissolve at station boundaries, Gaussian in scroll space.

## Loop protocol (each iteration)

1. Orchestrator picks the top backlog slice (1–2 groups max).
2. IMPLEMENTER subagent (Opus) builds it — tight brief, named files, builds green.
3. VALIDATOR+CRITIC subagent: verifies the slice with measurements, then runs the $10K
   test on every chapter (BUY/HESITATE/WALK + reasons), re-ranks remaining gaps, flags any
   regression on the rails.
4. Orchestrator fixes trivia inline, commits + pushes, appends one log line below,
   schedules the next wakeup.
5. Stop: two consecutive all-BUY audits with nothing above minor, or morning → summary.

## Critic-fed residuals (IT6+ queue, from the IT1 $10K audit)

- NOW bench occlusion AT THE HOLD: machines half-hidden behind the copy card at this
  audit's settle — shift bench/card/camera so all four machines + queue read at 1440x900.
- Focused vault (FPT, focus 0) hides behind the $30K numeral — offset row or numeral so
  the focused vault's flare plays on-stage.
- Casebook GitHub OG images show a "0 contributors · 0 stars" strip that un-sells the
  click — crop the stats strip (container overflow crop of the image bottom), don't fake it.
- Long nav rides (≥2 viewports): switch expo-out to ease-in-out so low-fps machines read
  travel, not jump-then-settle.
- Contact PCB: one glowing trace route from the terminal toward a device to anchor the
  board center at settle.

## Iteration log

- IT1 (response layer): pointer clobber fixed (44/44 stable samples), vault hover flare
  (48% px change), dot-i-flares-vault-i crosstalk, nav rides the rail (2.3s monotonic),
  focus rings, brand-strip honesty, hero grammar. Validator: ALL PASS; rails intact.
  First $10K audit: hero/receipts/contact BUY; work/road/now HESITATE (gates slicing cards
  = worst, casebook interior second, NOW bench occluded at hold).
- IT2 (film pass + idle life): CA→Bloom→SplitTone→Vignette→Grain in ONE merged pass;
  luminance-neutral split-tone; chips/machines breathe, vault flicker, depot CRT roll,
  hand-held wobble additive after rail (holds bit-exact); beacon phases truly spread.
  Committed 05ff921; validation rides with IT3's round.
- IT3 (studio light + materials): blob shadows under all hero objects; RectAreaLight
  key/fill on fab shelf + NOW bench; vault steel env 1.8 + per-part roughness + rim
  lights + frame falloff; PCB gold + silkscreen. tsc clean, committed 3d0ffde (build
  deferred behind running validator).
- IT4 (geometry + painted detail, two parallel implementers): chamfered plinths + serial
  plates; gate gantries + stronger near-fade (ignition pool preserved); hero facade ribs;
  window temperature variance; grid sky fade; depot queue-row board; packet variance; PCB
  pad chamfer; viz label fixes; casebook dark frame + full-width diagrams; 10px type floor.
  Committed 102d8a6.
- IT5 (toy + arrival + residuals): drag-to-orbit focused chip (capture, Lenis stop,
  spring-back, grab cursors, HUD); boot integrates real readiness (fonts + first painted
  frame) + narrative stages + 2s intro dolly (additive, decays to exact rail pose);
  long rides ease-in-out; OG stats crop attempt; PCB trace pulse. Committed 84c17f3.
- ROUND-2 AUDIT (on IT4 build; 42-45s converged settles — 10s settles are mid-transit on
  SwiftShader, so round-1's receipts BUY was judged on a non-final frame): hero BUY,
  receipts HESITATE ($30K numeral parks over the focused vault at the true hold), work
  BUY, road HESITATE (gate posts STILL print through cards at t=0.43 hold + transit —
  IT4a's proximity fade insufficient), NOW BUY (occlusion residual resolved), contact
  BUY. Also: film-pass grain invisible in blacks (0.2 levels vs 1.5-3 target); warm key
  reads neutral; blob shadows invisible on near-black grounds; IT5's OG crop measured
  ZERO effect (uncropped zeros row); SwiftShader fps halved (~1.7→~0.8) since film
  pass + RectAreaLights — real-GPU risk unknown, add adaptive quality; PCB trace enters
  off-frame, board center still unanchored; NOW stat caption grazes machine labels.
- ROUND-3 AUDIT (on IT5 build): same verdict line — hero/work/now/contact BUY, receipts/
  road HESITATE (both are the IT6 fixes, unbuilt at audit time). IT5 verified: arrival
  loader stages advance off real readiness, dolly plays then settles to the exact hold;
  orbit toy PASSES all seven checks (rotate/spring-back/no-scroll-fight/click-vs-drag
  slop/grab cursors/HUD); PCB trace pulse travels. NEW gaps: boot dt-clamp made loader
  fps-coupled (59.6s at 0.8fps); OG crop 118% too shallow; DRAG TO ORBIT hint printed
  over the chip; cold deep-link opened the casebook mid-ride.
- IT6 (round-2 fix pass): road cards actually opaque (the real culprit was the recession
  opacity ladder — now a brightness filter at opacity 1, scrim .955+) + station-3 gate
  alpha cap 0.5 + thicker lattice; numeral moved to the sky window (projection-verified);
  OG crop rebuilt as positioned img (133%) + stronger duotone; additive grain in sqrt
  space (σ≈1.6 display levels); warm keys #ffd9a8 ×1.6 + light pools; adaptive quality
  (40/22ms hysteresis, one toggle/30s) gating film pass + fills; trace to die rim; NOW
  stat lifted. Committed ef75dd9.
- IT7 (orchestrator inline, round-3 new gaps): boot integrates wall-clock (dt clamp
  0.05→0.5s) and SNAPS to 100% at the deadline; DRAG TO ORBIT hint bottom-anchored in
  stage air + hides after first drag; cold deep-link casebook opens only after the
  scroll settles (750ms stillness or 5s cap, token-cancelled on newer hash).
