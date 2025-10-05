# API Integration Stubs

This folder will contain small mock servers and API contracts used by the dashboard during development.

Suggested mock endpoints:

- `GET /api/risk-top` - top taxpayers by risk
- `GET /api/ghost-alerts` - recent ghost company/employee alerts
- `POST /api/ghost-check` - upload payroll for a company check
- `POST /api/report` - whistleblower report submission (mock)
- `GET /api/forecast` - predictive analytics scenarios

You can implement these with simple Express servers or static JSON files for the demo.

Proxy mode
----------

The mock server supports forwarding `/api/ghost-check` to a real GhostBuster endpoint. To enable proxying set the following environment variables before `npm start`:

- `GHOSTBUSTER_MODE=proxy` - switches the handler from mock logic to proxy mode
- `GHOSTBUSTER_URL` - the full URL to the upstream GhostBuster endpoint (POST)

Example (PowerShell):

$env:GHOSTBUSTER_MODE = 'proxy'; $env:GHOSTBUSTER_URL = 'https://your-ghostbuster.example.com/ghost-check'; npm start

The server will return the upstream response (status and JSON) or a 502 if the proxy fails. For production use, prefer injecting auth via a secure mechanism instead of embedding credentials in env vars.

Runtime config endpoints
------------------------

The mock server provides local-only endpoints to read/update the runtime proxy config without restarting the server:

- GET /api/_ghost-config - returns current config
- POST /api/_ghost-config - accepts { mode: 'mock'|'proxy', url: '<upstream-url>' } and persists to `.ghost-config.json`. POST is restricted to local requests.

Use these endpoints from the machine running the mock server (or via `curl` from the same host) to switch modes at runtime.

