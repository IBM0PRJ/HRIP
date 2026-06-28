# Scope: E2E Testing Suite

## Architecture
- Custom Node/TypeScript HTTP client (`TestClient`) in `frontend/tests/e2e/harness.ts` that manages a cookie jar, handles JSON and HTML responses, and verifies page layouts.
- Database access helper directly importing project's Prisma client `frontend/lib/db.ts` to inspect tables (`Employee`, `Analyst`, `AccessRequest`, `Session`, `OTPCode`, `LogRequest`, `IncidentReport`, `EmployeeAlert`, `TelemetryLog`).
- Test runner command-line runner `frontend/tests/e2e/run.ts` that resets the database state, runs all test cases, gathers statistics, and generates a test summary.
- Test cases organized in `frontend/tests/e2e/cases/` by tier (Tier 1, Tier 2, Tier 3, Tier 4).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Test Harness & CLI Runner | Create `harness.ts` and `run.ts` in `frontend/tests/e2e` | none | IN_PROGRESS |
| 2 | Tier 1 & Tier 2 Test Cases | Implement all 40 Tier 1 and 40 Tier 2 cases | M1 | PLANNED |
| 3 | Tier 3 & Tier 4 Scenarios | Implement 10 Tier 3 and 3 Tier 4 scenarios | M2 | PLANNED |
| 4 | Verification & Audit | Run E2E test runner, verify 100% pass, run Forensic Auditor, publish TEST_READY.md | M3 | PLANNED |
