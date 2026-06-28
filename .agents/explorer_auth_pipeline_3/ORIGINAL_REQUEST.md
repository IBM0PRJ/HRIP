## 2026-06-28T19:09:32Z
You are Explorer 3 for Milestone 2: Zero-Trust Authentication Pipeline.
Your working directory is C:\Users\rahul\Desktop\hrip\.agents\explorer_auth_pipeline_3.
Your task is to explore the codebase and recommend a detailed fix strategy for the Zero-Trust Authentication Pipeline.
Do NOT write code or modify files. Only analyze and document.

Scope and Requirements:
1. Identify how `frontend/app/api/auth/login/route.ts` and `frontend/app/api/auth/verify-otp/route.ts` set the session cookie, and how to change them so they do NOT set the `emp_session` cookie immediately.
2. Design a new endpoint `frontend/app/api/auth/session/issue/route.ts` that takes a POST request containing `requestId` (JSON), checks if the `AccessRequest` status in the DB is "approved", issues the `emp_session` cookie using `setEmployeeCookie` from `lib/session.ts`, and returns `{ success: true, redirectTo: "/dashboard" }`. If not approved, return appropriate error status and message.
3. Review `frontend/app/(auth)/onboarding/page.tsx` and design the frontend implementation:
   - Enforce geolocation permissions using navigator.geolocation.
   - Show a visible camera viewfinder in a premium, polished "liquid glass" style popup to capture a live selfie.
   - Submit the live selfie and GPS coordinates to POST `/api/auth/request`.
   - Place user on an immersive "Security Clearance Pending: Analyst Review in Progress" holding screen.
   - Periodically poll the status via GET `/api/auth/request/${requestId}`.
   - Once approved, call POST `/api/auth/session/issue` to get the cookie, and transition to the integrations screen.
4. Review `frontend/middleware.ts` and ensure `/onboarding` is accessible without the `emp_session` cookie, while `/dashboard` is protected.

Provide a detailed report in C:\Users\rahul\Desktop\hrip\.agents\explorer_auth_pipeline_3\analysis.md detailing your findings, exact files to modify, and proposed code changes.
When done, write analysis.md and then call send_message to the sub-orchestrator (conv ID: 6d23acbe-bdcf-43ab-ab2b-49789395addc) with a summary.
