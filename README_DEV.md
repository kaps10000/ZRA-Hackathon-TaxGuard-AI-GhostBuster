# Dev quickstart — TaxGuard Investigator Dashboard

This workspace contains a demo investigator dashboard (frontend) and a local mock API with an optional runtime proxy to a real GhostBuster endpoint.

Quick goals:
- Run the mock API server
- Run the frontend (Vite)
- Open the app and use Settings to toggle between Mock and Proxy modes

Files of interest:
- `dashboard_integration/frontend` — React + Vite frontend
- `dashboard_integration/api_integration` — Express mock API and runtime config

Quick run (Windows PowerShell)

1. Open PowerShell in the repository root.
2. Install dependencies for both projects if you haven't already:

```powershell
cd dashboard_integration\api_integration; npm install; cd ..\frontend; npm install; cd ..\..
```

3. Start both servers (recommended):

```powershell
.\dev-start.ps1
```

This script will open two new PowerShell windows: one runs the mock API (port 4000) and the other runs the Vite dev server (port 3000). The frontend is configured to proxy API calls to `http://localhost:4000` by default.

Notes
- Settings -> GhostBuster runtime allows switching between `mock` and `proxy` and will POST the runtime config to the mock API endpoint `/api/_ghost-config`.
- Session reports are stored in `localStorage` under `taxguard:reports`.

If you'd like a cross-platform runner instead (for macOS/Linux), tell me and I can add an npm script that uses `concurrently` instead.
