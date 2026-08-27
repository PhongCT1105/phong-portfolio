# Phong Cao — Static Portfolio

A framework-free personal portfolio built with HTML, CSS, vanilla JavaScript, Canvas 2D, and browser-native animation APIs.

There is no build step and no Base44/Lovable dependency.

## What is included

- 1.5–2.5s first-session systems boot animation
- generated session ID instead of a fake visitor counter
- Phong-first hero with high-signal identity chips
- continuously moving affiliation/recognition strip with local icons
- large-number proof section
- compact Apple-style sticky distributed-compute/bandwidth scene
- selected proof-of-work rows (FlashML is intentionally only one row)
- sticky `10×` hackathon timeline
- NSF / IEEE MIT URTC research section
- selected experience and WPI education sections
- terminal-style contact ending
- responsive mobile layout
- reduced-motion mode
- local static verification + Node tests
- Vercel configuration and deployment guide

## Quick local preview

Because the JavaScript uses ES modules, preview through a tiny local HTTP server rather than double-clicking `index.html`:

```bash
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173
```

## Edit your links first

Open `js/content.js` and update:

```js
links: {
  linkedin: 'https://www.linkedin.com/in/phong-cao/',
  github: '',
  resume: '',
  email: ''
}
```

Empty links intentionally render as disabled controls rather than fake URLs.

For email use:

```js
email: 'mailto:you@example.com'
```

## Project links

Each project has a `links` array in `js/content.js`. Example:

```js
links: [
  { label: 'GitHub', url: 'https://github.com/...' },
  { label: 'Demo', url: 'https://...' }
]
```

The whole project row becomes clickable using the first configured safe URL.

## Logos and affiliation icons

See `assets/BRAND-SOURCES.md`.

The package deliberately uses text + neutral contextual icons for some institutions where official marks have personal-use restrictions. NVIDIA and Adobe assets are locally included; Adobe should be swapped to a neutral icon if your ambassador agreement does not permit corporate-logo use.

Replace the neutral Zolli AI founder icon with the real Zolli logo when you have it.

## Tests

```bash
node --test tests/*.test.mjs
python3 scripts/verify_static.py
```

## Architecture

- `index.html` — semantic structure
- `css/` — visual system + responsive motion
- `js/content.js` — editable portfolio content
- `js/boot.js` — session boot sequence
- `js/network.js` — background distributed-node canvas
- `js/scroll.js` — focus/wins/reveal scroll choreography
- `js/interactions.js` — cursor, tilt, magnetic links, terminal cycle
- `assets/` — all local interface icons/marks
- `vercel.json` — static Vercel settings

## Visitor count

The current release does **not** fake a global visitor number. It displays a real random session identifier stored in `sessionStorage`. If you later want a true global visitor counter, add a small persistent backend such as Vercel KV/Postgres or another counter service.
