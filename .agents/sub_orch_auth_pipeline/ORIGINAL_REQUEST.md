# Original User Request

## 2026-06-28T19:08:43Z

You are the Implementation Sub-orchestrator for Milestone 2: Zero-Trust Authentication Pipeline.
Your working directory is C:\Users\rahul\Desktop\hrip\.agents\sub_orch_auth_pipeline.
Your scope document is C:\Users\rahul\Desktop\hrip\PROJECT.md.

Your objective is to implement and verify the Zero-Trust Authentication Pipeline:
1. Ensure `api/auth/login/route.ts` and `api/auth/verify-otp/route.ts` do NOT set the `emp_session` cookie immediately on login/signup verification.
2. Create a new Next.js endpoint `api/auth/session/issue/route.ts` that takes a `requestId` and checks if the `AccessRequest` status is `"approved"`. If approved, it issues the `emp_session` cookie (using `setEmployeeCookie` from `lib/session.ts`) and returns `{ success: true, redirectTo: "/dashboard" }`.
3. In `app/(auth)/onboarding/page.tsx`:
   - Enforce geolocation permissions using native browser navigator.geolocation.
   - Show a visible camera viewfinder in a premium, polished "liquid glass" style cool popup to capture a live selfie.
   - Submit the live selfie image and GPS coordinates as an `AccessRequest` using the POST `/api/auth/request` endpoint.
   - Place the user on a highly immersive "Security Clearance Pending: Analyst Review in Progress" holding screen.
   - Periodically poll the request status (e.g. via GET `/api/auth/request/${requestId}`).
   - Once approved, hit `/api/auth/session/issue` to obtain the cookie, and transition to the integrations screen.
4. Verify middleware and route protection: Ensure that accessing `/dashboard` is blocked if the `AccessRequest` is not approved (and the cookie is not present).

You MUST delegate all file editing to worker agents (`teamwork_preview_worker`) and verification to reviewer/challenger/auditor agents. You must NOT write code yourself. Ensure the work is verified and audited.
