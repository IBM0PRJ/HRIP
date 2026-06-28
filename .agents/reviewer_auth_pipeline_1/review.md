# Milestone 2: Zero-Trust Authentication Pipeline Review Report

## Review Summary

**Verdict**: REQUEST_CHANGES

This review assessed the correctness, completeness, robustness, and interface conformance of the Zero-Trust Authentication Pipeline. While the requested features (preventing immediate cookies on password/OTP, session issue endpoint, onboarding UI/flow, middleware checks, and Next.js compilation) were successfully implemented, two critical security and logic vulnerabilities were discovered during adversarial review that must be resolved before approval.

---

## Findings

### [Critical] Finding 1: Unprotected Analyst Endpoints for Access Requests
- **What**: Public exposure of sensitive analyst endpoints.
- **Where**: `frontend/middleware.ts` (lines 8-10) and `frontend/app/api/auth/request/[id]/route.ts` / `frontend/app/api/auth/request/route.ts`.
- **Why**: The middleware permits all requests under `/api/auth` to bypass authentication. This means `GET /api/auth/request` (which lists all pending employee names, emails, photos, and GPS coords) and `POST /api/auth/request/[id]` (which approves/denies requests and activates sessions) are publicly accessible. Any user can view all pending requests and approve them, bypassing the analyst queue entirely.
- **Suggestion**: Protect `GET /api/auth/request` and `POST /api/auth/request/[id]` in middleware or internally by verifying that the request comes from an authenticated analyst session.

### [Critical] Finding 2: Incomplete Session Isolation Enforcement
- **What**: Backend employee API routes and middleware do not verify if a session is isolated or revoked.
- **Where**: `frontend/middleware.ts` (lines 13-19) and `frontend/app/api/employee/*` (e.g., `/api/employee/me/route.ts`).
- **Why**: When an analyst isolates an employee session (setting state to `"isolated"` or `"reauth_required"` in the SQLite `Session` table), the middleware only checks if the `emp_session` cookie exists, and backend routes only parse the JWT. Neither checks the actual session state in the database. Consequently, an isolated employee can continue to successfully query all `/api/employee` endpoints using their cookie.
- **Suggestion**: Update `getEmployeeFromRequest` (or the middleware / API endpoints) to verify that the active session in the database has the state `"active"`. If it is `"isolated"` or `"reauth_required"`, block the request and return a 403 status.

---

## Verified Claims

- **Session cookie is not set immediately on password or OTP verification** → verified via code inspection of `login/route.ts` and `verify-otp/route.ts` → PASS
- **`/api/auth/session/issue` correctly validates approved `AccessRequest`, fetches employee, and issues cookie** → verified via code inspection of `session/issue/route.ts` and successful build checks → PASS
- **Onboarding page UI and flow implements geolocation enforcement, camera viewfinder with liquid glass popup, and polling status** → verified via code inspection of `onboarding/page.tsx` → PASS
- **Next.js compilation compiles without errors** → verified via `npm run build` in `frontend` → PASS
- **Middleware protects `/dashboard` and `/api/employee` while allowing `/onboarding` to bypass `emp_session`** → verified via code inspection of `middleware.ts` → PASS

---

## Coverage Gaps

- None. All files in scope were fully analyzed.

---

## Unverified Items

- None.

---

# Adversarial Challenge Report

**Overall risk assessment**: HIGH

## Challenges

### [Critical] Challenge 1: Authorization Bypass on Access Request Approval
- **Assumption challenged**: The system assumes only authorized analysts can approve employee access requests.
- **Attack scenario**: An attacker registers an employee account, submits an access request, and intercepts the response to get the `requestId`. They then make a direct HTTP POST request to `/api/auth/request/[requestId]` with `{"action": "approved"}`. Because the route has no session checks and middleware marks `/api/auth` as public, the request is approved. The attacker then polls `/api/auth/session/issue` and logs in successfully.
- **Blast radius**: Complete bypass of zero-trust biometric and location verification.
- **Mitigation**: Require an analyst session cookie/token validation in the `POST` request to `/api/auth/request/[id]`.

### [High] Challenge 2: Client-side Only Session Isolation (Logic Bypass)
- **Assumption challenged**: Restricting access in the UI is sufficient to enforce session isolation.
- **Attack scenario**: A malicious employee whose session has been isolated blocks JS execution in the browser or makes direct API requests to `/api/employee/me`, `/api/employee/alerts`, or other employee backend endpoints using their existing cookie. Because the backend doesn't check session state from the DB, the request succeeds.
- **Blast radius**: Bypass of isolation/incident containment.
- **Mitigation**: Query the `Session` table in `getEmployeeFromRequest` or in individual API routes to verify session state is `"active"` before returning data.

---

## Stress Test Results

- **Raw API Requests while Isolated** → Expected: 403 Forbidden → Actual: 200 OK (data returned) → FAIL
- **Direct approval post to `/api/auth/request/[id]`** → Expected: 401/403 Unauthorized → Actual: 200 OK (request approved) → FAIL
