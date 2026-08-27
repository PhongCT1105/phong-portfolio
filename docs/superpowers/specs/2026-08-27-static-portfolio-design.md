# Phong Cao Portfolio — Static Vercel Build Design

## Goal

Build a production-quality personal portfolio for Phong Cao as a framework-free static website using only HTML, CSS, and vanilla JavaScript. The final package must be deployable to Vercel, GitHub Pages, Cloudflare Pages, or any static host without Base44, Lovable, React, a build step, or proprietary runtime dependencies.

The site must preserve the current visual direction: dark technical editorial styling, subtle grid, lime accent, distributed-node motif, large typography, Apple-style scroll choreography, fast scanability, and strong affiliation/credibility signals.

The portfolio must feel like a personal site about Phong, not a long explainer for FlashML or distributed computing.

---

## Primary Visitor Takeaway

Within 5–10 seconds, a visitor should understand:

- Phong Cao
- Software engineer focused on AI infrastructure and distributed systems
- Incoming SWE @ NVIDIA
- Founder @ Zolli AI
- 10× hackathon winner
- Research presented at IEEE MIT URTC
- BS + MS at WPI

Within 20–30 seconds, the visitor should also understand:

- the current technical focus: utilization/bandwidth constraints in fragmented compute
- selected proof of work
- recognizable affiliations and awards
- research depth
- how to reach GitHub, LinkedIn, resume, and email

---

## Technical Architecture

No framework.

Use:

- `index.html` for semantic page structure
- modular CSS files for layout, components, responsive behavior, and animation states
- modular vanilla JS for boot flow, animation orchestration, canvas network, scroll-linked scenes, ticker behavior, and interactions
- local assets for logos/icons whenever legally/practically appropriate
- data/config JS files for affiliations, projects, wins, and links so content changes do not require rewriting markup
- `vercel.json` only for static-host behavior and security headers
- no backend required for v1

No runtime npm dependency and no build process.

The site must work by opening `index.html` locally, except features that inherently require HTTP behavior such as some browser security policies.

---

## File Structure

```text
phong-portfolio/
├── index.html
├── css/
│   ├── tokens.css
│   ├── base.css
│   ├── layout.css
│   ├── components.css
│   ├── motion.css
│   └── responsive.css
├── js/
│   ├── content.js
│   ├── boot.js
│   ├── network.js
│   ├── scroll.js
│   ├── interactions.js
│   └── app.js
├── assets/
│   ├── logos/
│   ├── icons/
│   └── images/
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-08-27-static-portfolio-design.md
├── README.md
├── DEPLOY.md
└── vercel.json
```

---

## Story Structure

### 00 — Boot / Connection

Short first-visit entrance, 1.5–2.5 seconds maximum.

Visual flow:

```text
PHONG.SYSTEMS
ESTABLISHING CONNECTION...
SESSION 8F3A1
AI INFRASTRUCTURE
DISTRIBUTED SYSTEMS
10× BUILDER
CONNECTED
```

Requirements:

- generate a real client-side session identifier rather than fake visitor count
- save boot-complete state in `sessionStorage`
- first visit gets full sequence
- subsequent refresh/navigation in same session gets only a 200–400ms transition
- reuse the same node/grid visual system as the hero so boot transforms into the page rather than disappearing
- respect `prefers-reduced-motion`

A real global visitor counter is excluded from v1 because it requires backend state and is not necessary to ship the static portfolio.

---

### 01 — Hero / Identity

Primary content:

```text
PHONG CAO

I build systems.
```

Supporting identity:

```text
Incoming SWE @ NVIDIA
Founder @ Zolli AI
AI Infrastructure / Distributed Systems
10× Hackathon Winner
Research @ IEEE MIT URTC
```

Actions:

- GitHub
- LinkedIn
- Resume
- Email

Use icon-forward actions and minimal labels.

No biography paragraph above the fold.

Hero includes a subtle interactive distributed-node canvas behind the content.

---

### 02 — Affiliation Ticker

A high-signal horizontal moving rail.

Format:

```text
[LOGO/ICON] ORGANIZATION — RELATIONSHIP
```

Initial content:

- NVIDIA — Incoming SWE
- Adobe — Campus Ambassador
- Runpod — Grand Prize / 1st Place
- NSF — REU / Research
- UC Berkeley — Hackathon Recognition
- Stanford — Hackathon Recognition
- IEEE — Research Presentation · MIT URTC
- WPI — BS + MS
- NASA Space Apps — Local People’s Choice
- FPT Software — Applied AI / MLOps
- Zolli AI — Founder

Behavior:

- continuous slow movement
- pauses/slows on pointer hover
- each item has icon/logo + relationship
- items never imply employment where relationship is award/research/education
- no colorful sponsor-wall layout
- protected institution marks can fall back to neutral text + contextual icon where logo use is restricted
- Zolli AI uses a placeholder until official asset is supplied

---

### 03 — Numbers / Fast Proof

Large editorial proof blocks, not cards.

Initial set:

- `10×` — Hackathon Wins
- `400+` — Research Experiments
- `1ST` — Runpod
- `IEEE @ MIT` — Research Presentation
- `BS + MS` — WPI

This section should be readable in seconds and fit roughly one viewport or less.

Numbers animate once on entry where useful.

---

### 04 — Current Technical Focus

One compact sticky-scroll or one-view interactive scene.

Headline:

```text
Distributed compute is abundant.
Bandwidth isn’t.
```

Supporting copy:

```text
Exploring the utilization and communication bottlenecks that prevent fragmented GPU capacity from behaving like one useful pool of compute.
```

Visual sequence:

```text
AVAILABLE GPU NODES
→ CONNECT THEM
→ CONGESTION
→ WORKERS WAIT
→ UTILIZATION DROPS
```

Network visual semantics:

- node brightness = utilization
- line thickness = bandwidth
- particles = communication
- stalled particles = congestion
- pulsing nodes = synchronization wait
- disappearing/dim nodes = failure or unavailable worker

End line:

```text
Make more compute useful.
```

Tags:

- UTILIZATION
- BANDWIDTH
- PLACEMENT
- COMMUNICATION
- RECOVERY

The section must not consume more than one compact sticky sequence. FlashML is not the headline here.

---

### 05 — Proof of Work

Horizontal interactive rows instead of generic cards.

Initial entries:

1. FlashML — Distributed ML infrastructure exploring fragmented compute — Runpod 1st Place
2. Captain Ddoski — Human-in-the-loop credibility infrastructure for AI agents — UC Berkeley recognition
3. Cortex — AI learning diagnostics — Stanford recognition
4. GPU Validation — AI-assisted test-plan/test-case generation for GPU validation — NVIDIA

Each row supports:

- project number
- title
- one-line description
- organization/award marker
- optional GitHub/demo/external link
- hover/keyboard focus animation
- entire row clickable only when a valid URL is configured

FlashML receives one row only. No multi-screen FlashML explainer.

---

### 06 — 10× Hackathon Wins

Visual signature section.

Layout:

- giant sticky `10×`
- vertical progress/trophy rail
- recognizable affiliations first

Initial high-signal events:

- Runpod
- UC Berkeley
- Stanford
- NASA Space Apps
- WPI / additional wins

Each event exposes:

- logo/text marker
- project
- placement
- year

No ten-card grid.

Progress line animates with scroll.

---

### 07 — Research

One premium research section.

Affiliations:

- NSF REU
- IEEE MIT URTC

Headline:

```text
LLMs × Time Series × Retrieval
```

Metrics:

- `157` features
- `400+` experiments
- `−60%` RMSE vs no RAG
- `IEEE @ MIT` presented

Include compact retrieval → feature selection → forecast → evaluation animation.

No resume-bullet dump.

---

### 08 — Selected Experience

Compact timeline.

Initial entries:

- NVIDIA — Software Engineering / GPU Validation
- Zolli AI — Founder
- Adobe — Campus Ambassador
- NSF REU — AI/ML Infrastructure Research
- FPT Software — Applied AI / MLOps

Use small logo/icon markers.

Details stay compressed because LinkedIn/resume hold the full history.

---

### 09 — Education

WPI only as the primary education marker:

```text
WORCESTER POLYTECHNIC INSTITUTE
BS + MS
```

Keep concise.

---

### 10 — Contact / Terminal Ending

Mirror the opening connection state.

Example:

```text
phong@systems:~$ connect _
SESSION_8F3A1
CONNECTION ACTIVE
```

Links:

- GitHub
- LinkedIn
- Email
- Resume

The distributed graph visually collapses or simplifies toward the terminal cursor.

---

## Visual System

### Palette

- near-black background
- warm off-white primary text
- soft gray secondary text
- restrained electric lime accent

The lime accent should mark active state, system activity, or selected proof. It should not flood the interface.

### Typography

- modern sans-serif for hero/headlines
- system/native sans stack to avoid external font dependency in v1
- monospace stack for labels, metrics, status, and system metadata
- oversized editorial scale
- strong whitespace and asymmetry

### Grid

- approximately 1200–1400px desktop max width
- responsive gutters
- thin borders
- subtle technical grid backdrop
- rounded corners used selectively, not everywhere

---

## Motion System

The site must feel sophisticated even without a framework.

Motion includes:

- boot-to-hero transform
- canvas network simulation
- requestAnimationFrame-based pointer response
- IntersectionObserver reveals
- scroll progress calculations for sticky sections
- affine transforms / opacity for GPU-friendly animation
- proof ticker
- number transitions
- network packet animations
- hackathon progress rail
- subtle magnetic/hover interaction
- optional text scramble used sparingly
- parallax only where it reinforces depth

Do not animate layout-heavy properties continuously.

Respect `prefers-reduced-motion`.

On reduced motion:

- no continuous canvas animation
- no large parallax
- no boot delay
- no continuous marquee requirement
- preserve simple reveals and full information access

---

## Accessibility

- semantic headings and landmarks
- keyboard focus styles
- all icon links have accessible labels
- logos have meaningful alt text including relationship where appropriate
- sufficient color contrast
- no information available only on hover
- reduced-motion support
- interactive rows use anchors/buttons rather than click handlers on generic divs

---

## Responsive Design

Mobile is redesigned rather than merely shrunk.

Changes:

- no custom cursor
- reduced canvas node count
- vertical architecture/focus visualization
- ticker remains horizontally moving but slower and touch-safe
- giant metrics remain dominant
- sticky `10×` transitions to a normal large header if viewport height/width makes stickiness awkward
- one-column proof rows where needed
- navigation collapses to a compact menu or minimal icon/button treatment

---

## Performance Targets

- no framework payload
- no large video background
- no required external fonts
- defer noncritical JS where practical
- canvas devicePixelRatio capped
- canvas animations paused on hidden tabs
- requestAnimationFrame only while needed
- images lazy-loaded
- logo assets kept compact
- static page should remain responsive on modern mid-range mobile devices

---

## Content Safety / Accuracy

Do not invent:

- company employment relationships
- URLs
- funding
- customers
- startup traction
- research publication claims
- award placements
- metrics

Missing project links remain disabled or clearly configured as empty data values.

Affiliation relationship labels must remain explicit.

---

## Deployment

Vercel deployment must require no build command.

`vercel.json` should:

- serve static files
- route `/` to `index.html`
- add reasonable security/cache headers without breaking local/static behavior

Documentation should include:

1. GitHub push workflow
2. Vercel import workflow
3. custom domain connection
4. editing links/content
5. replacing Zolli/logo assets
6. local preview instructions

---

## Definition of Done

The package is complete only when:

- all source files are included
- site works as pure HTML/CSS/JS
- no Base44/Lovable dependency exists
- hero, ticker, numbers, focus scene, work, wins, research, experience, education, and contact are implemented
- full boot sequence works once per session
- reduced-motion behavior exists
- desktop and mobile layouts are checked
- no broken internal links
- no fake external URLs
- deployment docs are included
- ZIP is ready for GitHub/Vercel
