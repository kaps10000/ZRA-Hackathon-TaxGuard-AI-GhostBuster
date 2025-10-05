Dashboard Onboarding (Thomas)

Goals:
- Provide a central place to run the demo and integrate other modules.
- Ensure the dashboard can consume mock APIs for development.

Setup checklist:
1. Install Node.js 18+ and npm
2. cd dashboard_integration/frontend
3. npm install
4. npm start (dev server)

Recommended next steps:
- Create mock APIs in `api_integration/` using Express
- Add initial pages under `frontend/pages/` for: Overview, Ghost Alerts, Risk Scoring, Reports, Forecasts
- Wire simple axios calls to mocked endpoints
- Add role-based skeleton (investigator/admin)

Notes:
- Keep API contracts simple JSON for hackathon demo; production security can be added later.
