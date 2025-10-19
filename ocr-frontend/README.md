## OCR Suite Frontend

This is a Next.js app (App Router) for the OCR Suite dashboard and landing experience.

## Requirements
- Node.js 18+ (recommended LTS)
- pnpm (preferred) or npm/yarn/bun

## Install
```bash
pnpm install
# or
npm install
```

## Development
```bash
pnpm dev
```
- Runs Next.js with Turbopack on http://localhost:3000
- Hot reload enabled

## Build & Run
```bash
pnpm build
pnpm start
```
- Builds (Turbopack) and starts a production server

## Lint
```bash
pnpm lint
```

## Environment variables
- Create `.env.local` if needed for your environment.
- If API calls are used in the UI, ensure your API base URL is configured appropriately (for example via a `NEXT_PUBLIC_...` variable). Consult `components/UploadForm.tsx` and any `lib/api` utilities for specifics.

## Project structure (high-level)
- `app/` — App Router pages and routes
  - `app/(main)/layout.tsx` — dashboard shell (navbar, sidenav overlay)
  - `app/(main)/dashboard/` — dashboard pages
  - `app/page.tsx` — landing page
- `components/`
  - `components/navigation/` — `SideNav`, `NavBar`
  - `components/home/` — `FeatureCard`, `BenefitStat`, `StepCard`
  - `components/ui/Modal.tsx` — reusable modal used for uploads
  - `components/UploadForm.tsx` — upload + verify flow (used inside modal)
- `store/` — client state (e.g., `useUploadsStore`)
- `styles/` (if present) — global styles

## Theming
- Tailwind CSS v4
- Dark theme palette centered on `blue-950` with subtle borders/overlays
- Components follow the dashboard theme for consistency

## Common tasks
- Change port: `PORT=3001 pnpm dev`
- Analyze build without telemetry: `NEXT_TELEMETRY_DISABLED=1 pnpm build`

## Scripts (package.json)
- `dev` — `next dev --turbopack`
- `build` — `next build --turbopack`
- `start` — `next start`
- `lint` — `eslint`
