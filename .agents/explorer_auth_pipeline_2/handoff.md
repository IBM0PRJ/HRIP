# Handoff Report — Zero-Trust Authentication Pipeline Exploration

## 1. Observation

Direct observations made in the codebase:

### Session Cookies in Login and OTP Verification
- **Login Route**: `frontend/app/api/auth/login/route.ts` (lines 31-36)
  ```typescript
  const res = NextResponse.json({ success: true, redirectTo: "/dashboard" });
  return setEmployeeCookie(res, {
    id: employee.id,
    email: employee.email,
    name: employee.name
  });
  ```
- **OTP Verification Route**: `frontend/app/api/auth/verify-otp/route.ts` (lines 47-51)
  ```typescript
  response = setEmployeeCookie(response, {
    id: employee.id,
    email: employee.email,
    name: employee.name
  });
  ```

### Onboarding & Session Verification Polling
- **Onboarding Page**: `frontend/app/(auth)/onboarding/page.tsx` (lines 125-146)
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
- **Incorrect Redirect Path** in `onboarding/page.tsx` (line 186):
  ```typescript
  setTimeout(() => router.push("/employee/dashboard"), 500);
  ```

### Route Protection Middleware
- **Middleware Rules**: `frontend/middleware.ts` (lines 13-17)
  ```typescript
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding') || pathname.startsWith('/api/employee')) {
    const hasEmpSession = request.cookies.has('emp_session');
    if (!hasEmpSession) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  ```

---

## 2. Logic Chain

1. **Session Cookie Setting**: Since `login/route.ts` and `verify-otp/route.ts` invoke `setEmployeeCookie(...)` directly, any employee logging in or completing signup gets active session privileges before passing biometric or geolocation verification. To fix this, these invocations must be replaced with simple redirects to `/onboarding?email=...&name=...&dept=...` without modifying cookies.
2. **Access Control**: When these cookies are removed, a user navigating to `/onboarding` will lack the `emp_session` cookie. In the current `middleware.ts`, `/onboarding` requires `emp_session`, causing an immediate redirect loop to `/login`. Removing `/onboarding` from the middleware route checks resolves the loop, allowing unauthenticated employees to complete identity verification.
3. **Session Issuance Endpoint**: We need a secure, verified path to issue the cookie once manual analyst sign-off is completed. A new endpoint `/api/auth/session/issue` (POST) that accepts `requestId`, checks if the `AccessRequest` status in the DB is indeed `"approved"`, retrieves employee credentials, and sets the cookie using `setEmployeeCookie` satisfies the zero-trust architecture.
4. **Client-Side Verification**: In `onboarding/page.tsx`, we must enforce camera and geolocation permissions, disable the submit button upon refusal/errors, display a premium "liquid glass" modal, and change the polling resolution to POST `/api/auth/session/issue` to obtain the cookie before advancing to integrations.
5. **Route Mapping**: The file `app/(employee)/dashboard/page.tsx` belongs to the `(employee)` Route Group in Next.js. The actual HTTP path is `/dashboard`. Redirecting to `/employee/dashboard` on success results in a `404 Not Found`. Changing this to `/dashboard` fixes the redirection.

---

## 3. Caveats

- We assume that the employee email addresses in `AccessRequest` and the `Employee` model match exactly (case-sensitive) to fetch the details required by `setEmployeeCookie`.
- We assume the camera and geolocation API are accessed over HTTPS (or localhost during development) as browsers block these APIs on insecure origins.

---

## 4. Conclusion

The Zero-Trust Authentication Pipeline can be safely implemented by:
1. Modifying `login/route.ts` and `verify-otp/route.ts` to redirect to `/onboarding` without writing cookies.
2. Modifying `middleware.ts` to allow access to `/onboarding` without `emp_session` cookies.
3. Implementing the `/api/auth/session/issue` API route to validate the `AccessRequest` status and issue the `emp_session` cookie.
4. Refactoring `onboarding/page.tsx` to handle permission validation, render the webcam feed inside a glassy popup, fetch the session cookie upon approved status, and redirect the user to `/dashboard` on completion.

---

## 5. Verification Method

To verify the proposed implementation:
1. **Route Access Checks**:
   - Clear cookies and try to access `/dashboard`. You should be redirected to `/login`.
   - Try to access `/onboarding`. You should be allowed (will render with default names/emails if query parameters are omitted).
2. **Credentials and Onboarding Flow**:
   - Log in as an employee. Ensure that you are redirected to `/onboarding?...` and that the `emp_session` cookie is NOT set in the browser's developer tools.
   - Refuse camera or geolocation permissions. The page should show a permission warning, and the "Verify Presence" button should be disabled.
   - Grant permissions. Click the button. Ensure that the popup closes and you are held on the pending clearance screen.
3. **Analyst Action & Session Issuance**:
   - Log in as an analyst in another session, navigate to `/access-requests` and approve the pending request.
   - Ensure the employee page automatically detects the approval, makes a request to `/api/auth/session/issue`, sets the `emp_session` cookie, and moves to the integrations page.
   - Proceed through integrations, and check that you are successfully redirected to `/dashboard` (not `/employee/dashboard`).
