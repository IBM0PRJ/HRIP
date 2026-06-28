# Synthesis: Zero-Trust Authentication Pipeline Fix Strategy

## Consensus
- **Immediate Cookie Removal**: Remove the direct generation and setting of `emp_session` cookies in `frontend/app/api/auth/login/route.ts` and `frontend/app/api/auth/verify-otp/route.ts`. Instead, return a JSON response redirecting to the onboarding page with query parameters (`email`, `name`, `department`). (Cited: Explorer 1 Analysis §1, Explorer 3 Analysis §2.1)
- **New Session Issuance API**: Create `frontend/app/api/auth/session/issue/route.ts` (POST) to receive `requestId`, check that the `AccessRequest` status is `"approved"`, find the employee record, issue the cookie using `setEmployeeCookie`, and return success. (Cited: Explorer 1 Analysis §2, Explorer 3 Analysis §2.2)
- **Onboarding Page UX Redesign**:
  - Enforce native browser navigator.geolocation. Block camera access and submission if permission is denied.
  - Camera viewfinder displayed in a premium "liquid glass" style popup modal (using backdrop-filter and glassmorphism styling).
  - Submit request via `POST /api/auth/request` containing geolocation, photo base64, and device type.
  - Immersive holding screen with status polling every 2 seconds.
  - Once status changes to `"approved"`, call `POST /api/auth/session/issue` to establish the cookie before transitioning to the integrations screen. (Cited: Explorer 1 Analysis §3, Explorer 3 Analysis §2.3)
- **Middleware Exclusions**: Update `frontend/middleware.ts` to exclude `/onboarding` from requiring the `emp_session` cookie, while ensuring `/dashboard` (and `/api/employee`) is strictly protected. (Cited: Explorer 1 Analysis §4, Explorer 3 Analysis §2.4)

## Resolved Conflicts
- None. Both Explorers arrived at identical design specs for backend route deferrals, the new API route structure, and middleware bypass rules.

## Dissenting Views
- None.

## Gaps
- None identified.
