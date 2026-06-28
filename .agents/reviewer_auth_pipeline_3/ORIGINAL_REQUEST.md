## 2026-06-29T00:48:24Z

You are Reviewer 3 for Milestone 2: Zero-Trust Authentication Pipeline.
Your working directory is C:\Users\rahul\Desktop\hrip\.agents\reviewer_auth_pipeline_3.
Your task is to review the correctness, completeness, robustness, and interface conformance of the Zero-Trust Authentication Pipeline (including the security fixes).

Verify that:
1. Session cookies are not set immediately on password or OTP verification.
2. The endpoint `/api/auth/session/issue` correctly validates `AccessRequest` approved status and employee profile, then issues the cookie.
3. Onboarding page has native geolocation error blocking, circular camera viewfinder glass popup, polling status, and fetch `/api/auth/session/issue` on approval.
4. Middleware excludes `/onboarding` from the session cookie check but protects `/dashboard`.
5. Access request GET queue and update POST route are secured by `getAnalystFromRequest()`, while GET `[id]` remains public.
6. DB session isolation checks are active in `getEmployeeFromRequest()` and the layout redirects if not active.
7. Next.js app compiles cleanly (`npm run build` in `C:\Users\rahul\Desktop\hrip\frontend`).

Document your review in C:\Users\rahul\Desktop\hrip\.agents\reviewer_auth_pipeline_3\review.md and handoff.md.
When done, call send_message to the sub-orchestrator (conv ID: 6d23acbe-bdcf-43ab-ab2b-49789395addc).
