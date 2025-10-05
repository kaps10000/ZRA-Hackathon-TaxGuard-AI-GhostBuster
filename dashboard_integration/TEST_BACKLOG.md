# Test Backlog — dashboard_integration frontend

This file lists high-value frontend tests to add later. We're taking a "move fast" approach for the current sprint: keep the two existing tests and the modal accessibility improvements, then add the tests below when convenient.

Priority guide: P0 = high (add ASAP), P1 = medium, P2 = low

---

## P0 — Critical smoke & integration tests

- Test: ReportModal focus-trap & focus-restore
  - Why: Prevent regressions to accessibility and keyboard support. The modal is a frequently used control in demos.
  - Acceptance: When modal opens, focus moves to first control; Tab/Shift+Tab cycles within the modal; Escape closes modal and focus returns to the previously focused element.
  - File(s): `src/components/ReportModal.jsx`, test: `src/components/ReportModal.a11y.test.jsx`
  - Estimate: 30-45m

- Test: SettingsPanel runtime-config save (GET/POST)
  - Why: Switching between demo and live depends on the runtime endpoints. This prevents config regressions and ensures UI correctly calls the backend.
  - Acceptance: Mock GET returns config and UI displays it; save triggers POST with expected payload and UI shows success.
  - File(s): `src/components/SettingsPanel.jsx`, test: `src/components/SettingsPanel.test.jsx`
  - Estimate: 45-60m

## P1 — Important component tests

- Test: ReportHistory open & clear
  - Why: Report recall is important for demos and presenter flow.
  - Acceptance: Clicking a history item opens the modal with correct report data; clicking Clear removes saved items and updates localStorage mock.
  - File(s): `src/components/ReportHistory.jsx`, test: `src/components/ReportHistory.test.jsx`
  - Estimate: 30-45m

- Test: GhostCheckForm error paths
  - Why: Ensure graceful handling when the backend returns errors or times out.
  - Acceptance: Show friendly error message and no modal on ghost-check failure; tests for network error and non-2xx status.
  - File(s): `src/components/GhostCheckForm.jsx`, test: `src/components/GhostCheckForm.errors.test.jsx`
  - Estimate: 30-45m

## P2 — Nice-to-have / integration

- Test: Integration-style test for ghost-check → create-report → modal flow
  - Why: High-level confidence across components.
  - Acceptance: Full flow completes and modal shows expected case id and proof.
  - File(s): tests/integration/ghostflow.test.jsx
  - Estimate: 60-90m

---

Notes
- Use React Testing Library + user-event; mock axios or the API adapter used by the frontend.
- Run tests locally with `npm test` from `dashboard_integration/frontend` (Jest config: `jest.config.cjs`).
- When adding tests that touch localStorage, mock/restore localStorage to avoid flakiness.

CI
- Add a lightweight GitHub Actions workflow that runs `npm ci` and `npm test` in `dashboard_integration/frontend` for PR safety (can be added after a small subset of tests exist).
