## 2026-06-29T00:41:24Z
You are Worker 1 for Milestone 2: Zero-Trust Authentication Pipeline.
Your working directory is C:\Users\rahul\Desktop\hrip\.agents\worker_auth_pipeline.
Your task is to implement the Zero-Trust Authentication Pipeline.

Objective and Scope:
1. Modify `frontend/app/api/auth/login/route.ts` to NOT set the `emp_session` cookie immediately on credentials check. Redirect employee role to `/onboarding` using query parameters:
   `/onboarding?email=${encodeURIComponent(employee.email)}&name=${encodeURIComponent(employee.name)}&dept=${encodeURIComponent(employee.department)}`
2. Modify `frontend/app/api/auth/verify-otp/route.ts` to NOT set the `emp_session` cookie immediately on OTP verification. Redirect `employee_signup` to `/onboarding` using query parameters:
   `/onboarding?email=${encodeURIComponent(email)}&name=${encodeURIComponent(employee.name)}&dept=${encodeURIComponent(employee.department)}`
3. Create a new Next.js endpoint `frontend/app/api/auth/session/issue/route.ts` that handles POST requests containing `{ requestId: string }`.
   - Checks if `AccessRequest` in the SQLite DB is approved (`status === "approved"`).
   - If approved, fetches the corresponding employee by email (found in the `AccessRequest` record).
   - Issues the `emp_session` cookie using `setEmployeeCookie` from `lib/session.ts` and returns `{ success: true, redirectTo: "/dashboard" }`.
   - If not approved, returns appropriate error (403).
4. Update `frontend/app/(auth)/onboarding/page.tsx`:
   - Enforce geolocation permissions using native browser navigator.geolocation. Block camera popup opening and request submission if geolocation permission is denied or coordinates cannot be acquired. Show a clear text error if coordinates are missing/blocked.
   - Show a visible camera viewfinder in a premium, polished "liquid glass" style cool popup to capture a live selfie. CENTER the face in the viewfinder. Make it look beautiful and high fidelity (using backdrop-filter and glassmorphism styling).
   - Submit the live selfie image and GPS coordinates as an `AccessRequest` using the POST `/api/auth/request` endpoint.
   - Place the user on a highly immersive "Security Clearance Pending: Analyst Review in Progress" holding screen.
   - Periodically poll the request status (e.g. via GET `/api/auth/request/${requestId}`) every 2 seconds.
   - Once approved, call POST `/api/auth/session/issue` to obtain the cookie, and then transition to the integrations screen.
5. Update `frontend/middleware.ts` to exclude `/onboarding` from requiring the session cookie while keeping `/dashboard` protected.

Execution Instructions:
1. Make the modifications and creations in the source code as detailed.
2. In the `C:\Users\rahul\Desktop\hrip\frontend` directory, run the build command `npm run build` using the run_command tool to ensure there are no compilation errors or TypeScript errors.
3. Verify that your changes compile successfully and the app builds.
4. Document the exact changes you made in C:\Users\rahul\Desktop\hrip\.agents\worker_auth_pipeline\changes.md and write a handoff.md in C:\Users\rahul\Desktop\hrip\.agents\worker_auth_pipeline\ detailing your verification commands and outputs.
5. Call send_message to the sub-orchestrator (conv ID: 6d23acbe-bdcf-43ab-ab2b-49789395addc) with a summary when done.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT
hardcode test results, create dummy/facade implementations, or
circumvent the intended task. A Forensic Auditor will independently
verify your work. Integrity violations WILL be detected and your
work WILL be rejected.
