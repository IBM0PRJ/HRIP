# Project: HRIP Employee Dashboard Redesign & Zero-Trust Authentication Pipeline

## Architecture
The frontend is built with Next.js (App Router) and Prisma (SQLite database).
- **Authentication**: Zero-Trust security model. Cookies (`emp_session`, `analyst_session`) are issued as JWTs.
- **Access Verification**:
  - Employee signups and logins do NOT immediately receive a session cookie.
  - Verification context (selfie photo and GPS geolocation coordinates) is collected on onboarding and stored as an `AccessRequest`.
  - The employee is held on a pending screen.
  - Analysts approve/deny requests in `/access-requests` via `/api/auth/request/[id]`.
  - Once approved, the client polls the status, calls `/api/auth/session/issue` to receive the cookie, and enters the dashboard.

## Code Layout
- `frontend/app/api/auth/login/route.ts`: Login credentials check.
- `frontend/app/api/auth/verify-otp/route.ts`: OTP verification endpoint.
- `frontend/app/api/auth/session/issue/route.ts`: **NEW** endpoint to issue session cookie for approved requests.
- `frontend/app/(auth)/onboarding/page.tsx`: Webcam & Geolocation capture and AccessRequest holding/polling.
- `frontend/app/(employee)/layout.tsx`: Employee sidebar layout.
- `frontend/app/(employee)/dashboard/page.tsx`: Employee dashboard UI and telemetry/alert/report/quiz functionality.
- `frontend/middleware.ts`: Redirect rules for session validation.

## Milestones
| # | Name | Scope | Dependencies | Status | Conversation ID |
|---|------|-------|-------------|--------|-----------------|
| 1 | E2E Testing Suite | Create E2E test harness and Tier 1-4 test cases; publish TEST_READY.md | none | PLANNED | TBD |
| 2 | Zero-Trust Auth Pipeline | Do not set cookie in login/verify-otp; add /api/auth/session/issue; webcam/gps UI popup & holding screen | M1 | PLANNED | TBD |
| 3 | Employee Dashboard Redesign | Sidebar layout conversion & dark luxury visual overhaul, wire all buttons/forms | M2 | PLANNED | TBD |
| 4 | Final Verification & Hardening | Adversarial tests, run all tests, Forensic Audit checks | M3 | PLANNED | TBD |

## Interface Contracts
### `/api/auth/session/issue` (POST)
- Request: `{ requestId: string }`
- Response:
  - Success (200): `{ success: true, redirectTo: "/dashboard" }` + sets `emp_session` cookie
  - Error (401/403): `{ error: "Access request not approved" }`
