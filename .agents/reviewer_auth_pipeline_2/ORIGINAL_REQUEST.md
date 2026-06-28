## 2026-06-29T00:43:58+05:30
You are Reviewer 2 for Milestone 2: Zero-Trust Authentication Pipeline.
Your working directory is C:\Users\rahul\Desktop\hrip\.agents\reviewer_auth_pipeline_2.
Your task is to review the correctness, completeness, robustness, and interface conformance of the implemented Zero-Trust Authentication Pipeline.

Files modified:
1. `frontend/app/api/auth/login/route.ts`
2. `frontend/app/api/auth/verify-otp/route.ts`
3. `frontend/app/api/auth/session/issue/route.ts`
4. `frontend/app/(auth)/onboarding/page.tsx`
5. `frontend/middleware.ts`

Review Criteria:
1. Ensure the session cookie is not set immediately on password or OTP verification.
2. Verify that `/api/auth/session/issue` correctly validates `AccessRequest` approved status, fetches the employee, and issues the `emp_session` cookie via `setEmployeeCookie`.
3. Check the onboarding page UI and flow: geolocation enforcement and error handling, camera viewfinder popup styling (liquid glass), polling status, and fetching the session issue route.
4. Verify middleware route protection: `/onboarding` must bypass the `emp_session` check, while `/dashboard` and `/api/employee` must strictly require it.
5. Run build/compilation checks in `C:\Users\rahul\Desktop\hrip\frontend` using `npm run build` using the run_command tool.

Write your review report to C:\Users\rahul\Desktop\hrip\.agents\reviewer_auth_pipeline_2\review.md and handoff.md.
When done, call send_message to the sub-orchestrator (conv ID: 6d23acbe-bdcf-43ab-ab2b-49789395addc) with a summary.
