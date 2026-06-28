# Scope: Zero-Trust Authentication Pipeline (Milestone 2)

## Architecture
The authentication flow is a zero-trust verification pipeline.
- Employee credentials or OTP signup verification does NOT immediately issue a session.
- User is placed on the `/onboarding` page, where they must supply geolocation and biometric verification.
- An `AccessRequest` is created on onboarding submit.
- The user polls for the request to be approved.
- Once approved, the user hits `/api/auth/session/issue` to receive their `emp_session` cookie and can then access the dashboard.
- Middleware protects `/dashboard` and API endpoints, redirecting to `/login` if `emp_session` cookie is missing.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Backend Cookie Deferral | Remove immediate `emp_session` cookie issue from `login/route.ts` and `verify-otp/route.ts` | None | PLANNED |
| 2 | Session Issue Route | Create `api/auth/session/issue/route.ts` checking for `approved` status, issuing the cookie via `setEmployeeCookie` | 1 | PLANNED |
| 3 | Onboarding UI and Flow | Native geolocation, premium liquid glass camera viewfinder popup, submit `AccessRequest`, analyst pending clearance screen, polling, session issue on approval | 2 | PLANNED |
| 4 | Middleware Route Protection | Remove `/onboarding` requirement for `emp_session`, ensure `/dashboard` requires it, verify access is blocked when not approved | 3 | PLANNED |

## Interface Contracts
### `/api/auth/session/issue` (POST)
- Request: `{ requestId: string }`
- Response:
  - Success (200): `{ success: true, redirectTo: "/dashboard" }` + sets `emp_session` cookie
  - Error (401/403): `{ error: "Access request not approved" }`
