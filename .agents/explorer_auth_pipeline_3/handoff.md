# Handoff Report — Zero-Trust Authentication Pipeline

## 1. Observation
We observed the following relevant code snippets in the repository:

* **File**: `frontend/app/api/auth/login/route.ts` (lines 31–36)
  ```typescript
        const res = NextResponse.json({ success: true, redirectTo: "/dashboard" });
        return setEmployeeCookie(res, {
          id: employee.id,
          email: employee.email,
          name: employee.name
        });
  ```

* **File**: `frontend/app/api/auth/verify-otp/route.ts` (lines 46–54)
  ```typescript
          // Log them in
          response = setEmployeeCookie(response, {
            id: employee.id,
            email: employee.email,
            name: employee.name
          });
          
          const responseData = await response.json();
          return NextResponse.json({ ...responseData, redirectTo: `/onboarding?email=${encodeURIComponent(email)}&name=${encodeURIComponent(employee.name)}&dept=${encodeURIComponent(employee.department)}` });
  ```

* **File**: `frontend/middleware.ts` (lines 13–19)
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

* **File**: `frontend/app/(auth)/onboarding/page.tsx` (lines 129–141)
  ```typescript
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
            }
  ```

---

## 2. Logic Chain
1. **Security Bypass Vulnerability**: Currently, during password verification (`login/route.ts`) and OTP verification (`verify-otp/route.ts`), the backend calls `setEmployeeCookie`, setting the `emp_session` cookie immediately (Observation 1 & 2). 
2. **Access Control Leak**: Under `middleware.ts`, access to `/dashboard` and `/api/employee/*` depends entirely on the presence of the `emp_session` cookie (Observation 3). Therefore, any user who completes the login/OTP step can bypass `/onboarding` and visit `/dashboard` directly, violating zero-trust requirements.
3. **Delayed Cookie Issuance**: To correct this, the backend must not set the `emp_session` cookie immediately in `login/route.ts` and `verify-otp/route.ts` (Conclusion). Instead, it should return user metadata and redirect to `/onboarding`.
4. **Accessing Onboarding**: For the user to access `/onboarding` without the cookie, the middleware must exclude `/onboarding` from the protected routes (Observation 3).
5. **Secure Session Generation**: Once `/onboarding` has polled and verified that the manual analyst approval status is `"approved"` (Observation 4), the frontend must trigger session creation. This is done by querying a new endpoint `/api/auth/session/issue`, which validates that the corresponding `AccessRequest` in the database is marked as `"approved"`, retrieves user info, and sets the `emp_session` cookie via `setEmployeeCookie` before redirecting the client (Conclusion).

---

## 3. Caveats
* **Camera / Browser Support**: Browser compatibility with WebRTC media devices (`navigator.mediaDevices.getUserMedia`) can vary, but standard Modern Chrome/Edge/Firefox will support it.
* **Testing without Webcam**: Real hardware-level camera simulation might be needed for automation, but using mock parameters or dummy devices is standard in integration environments.
* **Network Isolation**: As our network mode is `CODE_ONLY`, we must verify that all packages/modules (e.g. Next.js, Prisma client) are available locally. They are already installed in `node_modules`.

---

## 4. Conclusion
We recommend modifying the codebase according to the plan in `analysis.md`:
1. Delay session creation: remove `setEmployeeCookie` calls from `login/route.ts` and `verify-otp/route.ts`, pointing redirect outputs to `/onboarding`.
2. Exclude `/onboarding` from requiring `emp_session` inside `middleware.ts`.
3. Add `frontend/app/api/auth/session/issue/route.ts` to validate the approved request status and securely issue the session cookie.
4. Redesign `onboarding/page.tsx` to handle geolocation blocking, provide the "liquid glass" viewfinder modal, render the holding screen, poll request status, and call `/api/auth/session/issue` upon approval.

---

## 5. Verification Method
1. **Manual Inspection**: Verify that when password login or OTP verification is triggered, the response does not set the `emp_session` cookie in the browser.
2. **Middleware Access Check**: Clear all cookies. Try to visit `/onboarding`. It should load successfully. Try to visit `/dashboard`. It should redirect back to `/login`.
3. **Endpoint Validation**: Perform `POST /api/auth/session/issue` with a fake request ID or an unapproved request ID. Verify that the response returns `403 Forbidden` (or `404 Not Found` if the ID doesn't exist) and does not set the cookie.
4. **End-to-End Simulation**:
   - Run the frontend application (e.g., `npm run dev` in `frontend` folder).
   - Sign up/log in as an employee. Ensure you are redirected to `/onboarding`.
   - Deny geolocation permission. Ensure you get an error message and the verification trigger is blocked.
   - Grant permission. Open the Verification scanner popup, verify that the webcam works, and click verify.
   - Observe transition to the pending holding screen.
   - Use the analyst dashboard to approve the access request.
   - Verify that the frontend automatically transitions to the integrations screen after the analyst approves, and that the `emp_session` cookie is now successfully present in the browser.
