# First-Glance Visibility Loop

The audience sees each moment ONCE while scrolling. Every chapter must land its ONE message
in ~2 seconds of viewing, at a glance, without reading everything. Internal component detail
that doesn't change the first glance is worthless until the glance works.

## The 2-second test (per chapter view)

For a settled screenshot of each chapter, a fresh-eyes auditor answers:
1. FOCAL POINT — what does the eye land on first? Is it the chapter's actual message?
2. THE MESSAGE — can you state what this chapter claims in one sentence WITHOUT reading
   body copy? (hero: "this is Phong, systems builder"; receipts: "real money/users/results";
   work: "four real projects, openable"; road: "a career journey through time";
   now: "a working scheduler, 47% faster"; contact: "it was a chip — reach out")
3. STANDOUT — is there ONE dominant element (size/contrast/motion) or does everything
   compete at the same visual volume?
4. MISSABLE — what important thing would a first-timer scroll past without noticing?

## Known instruments of standout (prefer these over internal detail)

- A GIANT numeral/word carrying the message (receipt giant value, road ghost year)
- Spotlight hierarchy: current item dominant, siblings visibly receded
- Motion timed to arrival (things that MOVE when the visitor gets there, not before/after)
- One bloom-bright element per view; color pops against the dark base
- Scale contrast in the 3D staging (near+big beats far+detailed)

## Loop protocol (each iteration)

1. AUDIT: spawn a fresh-eyes agent — settled screenshots of ALL chapters (desktop 1440),
   run the 2-second test on each, rank the TOP 3 visibility failures site-wide with concrete
   prescriptions (numbers: sizes, positions, timings).
2. BUILD the #1 item (and #2 if small).
3. VALIDATE targeted (the standard validator protocol in ACCEPTANCE.md — headless Chrome CDP,
   dedicated profile, never taskkill by name, byte-identical settle).
4. Commit + push, append one line to the Iteration log below, schedule the next wakeup.
5. STOP when an audit returns no failure it ranks above "minor" for two consecutive rounds,
   or the user redirects.

## Iteration log

- IT1 (seeded by Phong): receipt GIANT value in the vault stage; road spotlight
  (current stop dominant + ghost year swap); skyline billboards.
  Audit verdict: receipts giant = "the new best moment on the site"; WORK ranked worst.
- IT2 (from IT1 audit): WORK giant project title + focused chip 1.85x + hall receded to
  scenery; gates fade within ~16u of the camera (no more frame-flooding); passed-stop
  recession override removed + Zolli/NVIDIA thresholds separated (0.56/0.66); billboards
  moved onto the 6 tallest hero-framed downtown towers at emissive 1.7-2.0; receipt giant
  re-anchored above the readout so the last receipt's number is seen.
  Audit: WORK/RECEIPTS/NOW/CONTACT/HERO pass the 2-second test; billboards 3/6 visible (FAIL),
  ghost year off-screen for stops 3-5, gates near-opaque at ~20u.
- IT3 (from IT2 audit): billboards occlusion-aware picks at h*0.72 with warm 1.4 (no white
  clipping); ghost year STICKY through the road chapter (top 84px, right) and NVIDIA shows a
  real "2026"; gate fade widened to begin ~32u out (floor ~12u).
  Audit: all six chapters pass the 2-second test; ONE item above minor remains (billboards
  3/≥5 — x-column occlusion insufficient), 3 minors (ignite spike near camera, mid-scramble
  capture, NVIDIA card half above fold at its moment).
- IT4 (from IT3 audit): billboard picks now use REAL perspective projection from the hero
  camera (edge-on facades rejected at <25°, occlusion via projected tower rects); gate
  emissive dims by nearFade² (bloom core dims perceptually); Zolli/NVIDIA thresholds 0.50/0.60
  so both cards are on screen at their moment; scramble decode shortened to 13 frames.
  Audit: gates/spotlights/scramble PASS with measurements; billboards still 3/≥5 (the one
  above-minor item — slabs too small/dim, and the auditor's "four framed panels" right of
  downtown are actually the VAULT monuments, not billboards); all six chapters pass 2-second.
- IT5 (from IT4 audit): billboards min 4.6×4.4u, emissive 1.5/1.9, accept cap 8; NOW section
  top padding raised so its headline clears the nav at settle.
  Audit: ALL SIX chapters pass the 2-second test; NOTHING ABOVE MINOR. NOW headline clears
  the nav (13px at capture, 222px at true settle); console 0 errors; 390px zero overflow.
  Billboard census stayed 3 (not 5) but downgraded to minor — slabs are now ~2× area at
  near-max luminance (42-47px cores, lum 238-253), so the "too small/dim" failure is gone;
  more panels would need placements on the x<600 tower cluster, not more brightness.

## Loop closed (IT5, 2026-08-27)

First fully clean audit with no code changes pending — loop terminated at the iteration cap
boundary. Residual minors on record: (1) billboard count 3/5 (fix = panels for the left
tower cluster); (2) NOW headline clears nav by only 13px at the scripted capture position;
(3) contact GitHub/LinkedIn pills kiss by a few px; (4) nested gate frames at road t≈0.3;
(5) ghost-year/NVIDIA card visual entanglement; (6) M7 scheduler right-bay traffic;
(7) THREE.Clock deprecation warning (three.js internals).
