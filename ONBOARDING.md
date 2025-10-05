# TaxGuard AI - Quick Onboarding

Quick steps to get the project running locally and in Docker for demos.

Requirements
- Node 18+ (or compatible LTS)
- npm
- Docker & Docker Compose (optional for containerized runs)

Run locally (frontend + mock API)

1. Start mock API:

```powershell
cd dashboard_integration\api_integration
npm install
npm start
```

2. Start frontend:

```powershell
cd dashboard_integration\frontend
npm install
npm start
```

Run with Docker Compose

```powershell
docker compose up --build
```

Notes
- Frontend proxied to mock API via `proxy` in `frontend/package.json` (http://localhost:4000)
- Tailwind is configured; if you change versions, re-check `postcss.config.js` plugin format.
