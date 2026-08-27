# Static Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build and package a high-quality, framework-free personal portfolio for Phong Cao that preserves the current dark systems aesthetic, icon-based affiliation ticker, strong numbers, and heavy purposeful scroll animation, and deploys directly to Vercel.

**Architecture:** Static semantic HTML with modular CSS and vanilla ES-module JavaScript. Content is centralized in `js/content.js`, animation behavior is split by responsibility, and all deployable assets live locally so the site has no Base44/Lovable runtime dependency.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript ES modules, Canvas 2D, IntersectionObserver, requestAnimationFrame, Node built-in test runner, Vercel static hosting.

**Spec:** `docs/superpowers/specs/2026-08-27-static-portfolio-design.md`

## Global Constraints

- No React, framework, bundler, npm runtime dependency, or build step.
- Preserve the black technical editorial style, lime system accent, moving icon ticker, distributed-node motif, and large-number storytelling.
- The first 1–2 viewports must establish Phong, NVIDIA, Zolli AI, 10× hackathon wins, distributed systems/AI infrastructure, and IEEE MIT URTC research.
- FlashML appears once under Proof of Work and must not dominate the site.
- No fake global visitor count; use a real session identifier in v1.
- No invented URLs or employment relationships.
- Respect `prefers-reduced-motion`, keyboard access, semantic markup, and responsive mobile design.
- Site must open as static files and deploy to Vercel without a build command.

---

### Task 1: Scaffold, content model, and pure utilities

**Files:**
- Create: `index.html`
- Create: `js/content.js`
- Create: `js/utils.js`
- Create: `tests/utils.test.mjs`
- Create: `tests/content.test.mjs`

**Interfaces:**
- Produces: `SITE_CONTENT`, `makeSessionId()`, `isSafeExternalUrl()`, `formatRelationshipLabel()`.

- [x] Write Node tests for deterministic relationship formatting, session ID shape, safe URL behavior, required affiliation fields, and project-link behavior.
- [x] Run `node --test tests/*.test.mjs` and verify failure before implementation.
- [x] Implement minimal utilities and content data.
- [x] Re-run tests and verify pass.
- [x] Commit scaffold and content model.

### Task 2: Core HTML structure and visual system

**Files:**
- Create: `css/tokens.css`
- Create: `css/base.css`
- Create: `css/layout.css`
- Create: `css/components.css`
- Create: `css/motion.css`
- Create: `css/responsive.css`
- Modify: `index.html`

**Interfaces:**
- Consumes: content rendered by `js/app.js` in later tasks.
- Produces: semantic section anchors `#phong`, `#focus`, `#work`, `#wins`, `#research`, `#contact` and reusable CSS classes.

- [x] Create semantic shell and no-JS fallback copy.
- [x] Implement dark editorial tokens, layout grid, hero scale, affiliation rail shell, number wall, sticky focus scene, proof rows, hackathon rail, research panel, timeline, and terminal footer.
- [x] Add visible keyboard focus states and reduced-motion CSS.
- [x] Verify responsive layout via static viewport inspection rules and lint-like reference checks.
- [x] Commit visual system.

### Task 3: Boot sequence, content rendering, and affiliation ticker

**Files:**
- Create: `js/boot.js`
- Create: `js/app.js`
- Modify: `index.html`
- Create/modify: `assets/logos/*`

**Interfaces:**
- Consumes: `SITE_CONTENT`, utilities.
- Produces: `runBootSequence()`, dynamic hero identity chips, ticker items, proof rows, wins, research metrics, experience, links.

- [x] Add tests for boot-state decisions and render-safe link state.
- [x] Verify tests fail.
- [x] Implement once-per-session boot with generated session ID and fast repeat transition.
- [x] Render affiliation ticker from content data with exact relationship labels.
- [x] Render project rows with disabled link state when URLs are absent.
- [x] Verify tests pass and inspect generated DOM strings via pure render helper tests.
- [x] Commit boot and content rendering.

### Task 4: Distributed network and purposeful scroll motion

**Files:**
- Create: `js/network.js`
- Create: `js/scroll.js`
- Create: `js/interactions.js`
- Modify: `js/app.js`
- Modify: `css/motion.css`

**Interfaces:**
- Produces: `initNetworkCanvas()`, `initScrollScenes()`, `initInteractions()`.

- [x] Add tests for scroll-progress clamping and focus-scene stage mapping as pure functions.
- [x] Verify tests fail.
- [x] Implement canvas node field with capped DPR, visibility pausing, pointer response, and reduced-motion fallback.
- [x] Implement IntersectionObserver reveals, focus scene progress, bandwidth/congestion visual stages, hackathon progress rail, marquee pause behavior, and subtle magnetic/pointer treatments.
- [x] Verify pure-function tests pass.
- [x] Commit motion system.

### Task 5: Affiliation/logo asset pack integration

**Files:**
- Create/modify: `assets/logos/*`
- Modify: `js/content.js`
- Create: `assets/icons/trophy.svg`
- Create: `assets/icons/research.svg`
- Create: `assets/icons/school.svg`
- Create: `assets/icons/founder.svg`
- Create: `assets/icons/external.svg`
- Create: `assets/icons/github.svg`
- Create: `assets/icons/linkedin.svg`
- Create: `assets/icons/mail.svg`
- Create: `assets/icons/resume.svg`

**Interfaces:**
- Every affiliation receives a local asset path or a neutral local contextual icon.

- [x] Integrate locally available NVIDIA, Adobe, Runpod, NSF, IEEE, WPI, NASA Space Apps, FPT assets when safely downloadable.
- [x] Use text + neutral trophy icon for Stanford and UC Berkeley by default because their primary marks have personal-use restrictions.
- [x] Use a neutral founder mark for Zolli AI until an official Zolli asset is supplied.
- [x] Run local-reference verifier and ensure every referenced asset exists.
- [x] Commit assets.

### Task 6: Accessibility, responsive quality, and static verification

**Files:**
- Create: `scripts/verify_static.py`
- Modify: HTML/CSS/JS as failures reveal issues.

**Interfaces:**
- Verifier checks local asset/script/style references, required section IDs, missing alt text on images, forbidden placeholder hrefs, and key metadata.

- [x] Write verifier checks and run against an intentionally incomplete state to observe failures where applicable.
- [x] Fix all static-reference/accessibility failures.
- [x] Run Node tests and Python verifier.
- [x] Serve site locally with `python3 -m http.server 4173` and fetch key files with curl.
- [x] Commit quality fixes.

### Task 7: Vercel config, docs, and release package

**Files:**
- Create: `vercel.json`
- Create: `README.md`
- Create: `DEPLOY.md`
- Create: `.gitignore`

**Interfaces:**
- Produces deployable repository and ZIP.

- [x] Add Vercel static config and conservative security headers.
- [x] Document local preview, content editing, logo replacement, GitHub push, Vercel import, and custom-domain steps.
- [x] Run full verification suite.
- [x] Create final git checkpoint commit.
- [x] Zip repository excluding `.git` and temporary files.
