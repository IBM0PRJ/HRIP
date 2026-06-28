# Handoff Report — Zero-Trust Authentication Pipeline Explorer

## 1. Observation
The following file components and code blocks were examined directly:

- **`frontend/app/api/auth/login/route.ts`** (Lines 31-36):
  ```typescript
  const res = NextResponse.json({ success: true, redirectTo: "/dashboard" });
  return setEmployeeCookie(res, {
    id: employee.id,
    email: employee.email,
    name: employee.name
  });
  ```
- **`frontend/app/api/auth/verify-otp/route.ts`** (Lines 47-51):
  ```typescript
  response = setEmployeeCookie(response, {
    id: employee.id,
    email: employee.email,
    name: employee.name
  });
  ```
- **`frontend/middleware.ts`** (Lines 13-19):
  ```typescript
  // Employee routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding') || pathname.startsWith('/api/employee')) {
    const hasEmpSession = request.cookies.has('emp_session');
    if (!hasEmpSession) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }
  ```
- **`frontend/app/(auth)/onboarding/page.tsx`** (Lines 125-146):
  ```typescript
  // Poll for approval status
  useEffect(() => {
    if (step === "holding" && requestId) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/auth/request/${requestId}`);
          const data = await res.json();
          if (data.status === "approved") {
            // Also initialize session in DB
            await fetch(`/api/auth/session/${encodeURIComponent(email)}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ state: "active" })
            });
            setStep("integrations");
          } else if (data.status === "denied") {
            router.push("/login?error=denied");
          }
        } catch (e) {}
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [step, requestId, router, email]);
  ```

---

## 2. Logic Chain
1. **Immediate Cookie Issuance (Observation 1 & 2)**: Both `/api/auth/login` and `/api/auth/verify-otp` immediately invoke `setEmployeeCookie` which writes the `emp_session` cookie to the user's browser, establishing their session.
2. **Zero-Trust Constraint (Mission)**: Under a Zero-Trust architecture, the user must not have a session cookie until their biometric presence (selfie) and location constraints (GPS coordinates) have been manually approved by a security analyst.
3. **Middleware Block (Observation 3)**: If we prevent immediate cookie establishment, the user will be redirected to `/onboarding`. However, the current middleware redirects any request to `/onboarding` back to `/login` if `emp_session` is absent.
4. **Onboarding Bypass (Logic Step 3)**: Thus, we must modify the middleware block to exclude `/onboarding` from the `emp_session` check, allowing unauthenticated access to the onboarding path.
5. **Session Issue Endpoint (Observation 4)**: The current onboarding page transitions to the integrations step by calling `/api/auth/session/[userId]` to mark the session active in the database. But this does not write the `emp_session` cookie. We need a new endpoint (`/api/auth/session/issue`) that verifies that the `AccessRequest` has status `"approved"`, retrieves the employee info, and uses `setEmployeeCookie` to send the signed cookie.
6. **Onboarding Page (Onboarding Redesign)**: The onboarding page must be updated to enforce geolocation, show a glassmorphism camera popup, submit details to `/api/auth/request`, poll for approval, call the new `/api/auth/session/issue` endpoint, and then transition to integrations.

---

## 3. Caveats
- **OAuth Callback**: In the integrations screen, the Google OAuth trigger redirects back to `/onboarding?step=integrations`. When it redirects back, the `emp_session` cookie will have already been written by `/api/auth/session/issue` during the step 2 -> step 3 transition. Thus, returning to onboarding will not break.
- **AccessRequest Expiry**: The design does not enforce an expiration time on the approved `AccessRequest`. Any approved request ID can theoretically be used once to issue a session. However, session cookies are configured with a `maxAge` of 7 days.

---

## 4. Conclusion
To establish the Zero-Trust Authentication Pipeline, the implementer must:
1. Prevent immediate session cookie creation in `frontend/app/api/auth/login/route.ts` and `frontend/app/api/auth/verify-otp/route.ts`, redirecting to `/onboarding` with user metadata parameters.
2. Exclude `/onboarding` from the cookie requirement in `frontend/middleware.ts`.
3. Create the `frontend/app/api/auth/session/issue/route.ts` POST endpoint to validate and issue the `emp_session` cookie.
4. Redesign the `frontend/app/(auth)/onboarding/page.tsx` component to enforce location, implement the popup biometric scanner, poll status, request session issue, and handle integrations.

---

## 5. Verification Method
- **Locate Files**:
  Inspect proposed files in `C:\Users\rahul\Desktop\hrip\.agents\explorer_auth_pipeline_1\analysis.md`.
- **Run Tests**:
  Ensure the project compiles and next.js dev/build runs successfully:
  ```powershell
  cd frontend
  npm run build
  ```
- **Runtime Walkthrough**:
  1. Clear all cookies and access `/dashboard`. Expect redirect to `/login`.
  2. Perform employee signup (OTP) or login. Expect direct redirect to `/onboarding?email=...` without setting `emp_session` cookie.
  3. Deny location permission. Expect warning banner and disabled camera button.
  4. Grant location permission. Click "Start Identity Verification". Camera popup should display.
  5. Click capture. Expect transition to "Security Clearance Pending" holding screen.
  6. In analyst dashboard, approve the request.
  7. Expect page to automatically obtain `emp_session` cookie, and transition to Integrations.
