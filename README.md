# Phong Cao — Portfolio

Personal portfolio of **Phong Cao** — software engineer focused on AI infrastructure and distributed systems.

Built with **Next.js (App Router) + TypeScript**, deployed on **Vercel**.

## Highlights

- Server-rendered content for SEO (Open Graph, JSON-LD person schema, sitemap, robots)
- Terminal/systems visual identity: boot sequence, live network canvas, session telemetry
- Scroll-driven "fragmented compute" visualization (GPU nodes, bandwidth meter, stage transitions)
- Fully responsive, honors `prefers-reduced-motion`, keyboard accessible

## Stack

| Layer     | Choice                              |
| --------- | ----------------------------------- |
| Framework | Next.js 15 (App Router)             |
| Language  | TypeScript + React 19               |
| Styling   | Hand-written CSS (design tokens)    |
| Fonts     | Inter + JetBrains Mono via next/font |
| Hosting   | Vercel                              |

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Structure

```
app/          layout (metadata, fonts), page, robots, sitemap
components/   one component per section + effects (boot, canvas, cursor, reveals)
lib/          content data + session/scene logic
styles/       design tokens, base, layout, components, motion, responsive
public/       logos, icons, resume PDF
```

All site copy lives in `lib/content.ts` — edit that file to update content.

## Deploy

Push to `main` — Vercel auto-deploys. Set `NEXT_PUBLIC_SITE_URL` in Vercel project settings once a custom domain is attached.

## Roadmap

- [ ] Three.js hero scene (react-three-fiber) — inspired by [threeui.com](https://threeui.com/browse)
- [ ] Project detail pages / case studies
- [ ] OG image generation (`@vercel/og`)
