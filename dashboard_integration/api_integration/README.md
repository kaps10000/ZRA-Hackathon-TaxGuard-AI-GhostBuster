# API Integration Stubs

This folder will contain small mock servers and API contracts used by the dashboard during development.

Suggested mock endpoints:

- `GET /api/risk-top` - top taxpayers by risk
- `GET /api/ghost-alerts` - recent ghost company/employee alerts
- `POST /api/ghost-check` - upload payroll for a company check
- `POST /api/report` - whistleblower report submission (mock)
- `GET /api/forecast` - predictive analytics scenarios

You can implement these with simple Express servers or static JSON files for the demo.
