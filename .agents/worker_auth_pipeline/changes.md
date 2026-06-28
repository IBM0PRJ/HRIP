# Changes Implemented

This document summarizes the changes made to implement the Zero-Trust Authentication Pipeline.

## Summary of Changes

### 1. `frontend/app/api/auth/login/route.ts`
- **Modification**: Modified the `employee` login block so that it does not immediately set the `emp_session` cookie on credentials check.
- **Redirect Path**: Returns a JSON response containing `redirectTo` pointing to `/onboarding` with URL-encoded query parameters for `email`, `name`, and `department`.
  ```typescript
  const redirectTo = `/onboarding?email=${encodeURIComponent(employee.email)}&name=${encodeURIComponent(employee.name)}&dept=${encodeURIComponent(employee.department)}`;
  return NextResponse.json({ success: true, redirectTo });
  ```

### 2. `frontend/app/api/auth/verify-otp/route.ts`
- **Modification**: Modified the `employee_signup` OTP verification block to not set the `emp_session` cookie immediately.
- **Redirect Path**: Directly returns a JSON response containing the success and `redirectTo` pointing to `/onboarding` with URL-encoded parameters for `email`, `name`, and `department`.
  ```typescript
  return NextResponse.json({ success: true, redirectTo: `/onboarding?email=${encodeURIComponent(email)}&name=${encodeURIComponent(employee.name)}&dept=${encodeURIComponent(employee.department)}` });
  ```

### 3. `frontend/app/api/auth/session/issue/route.ts`
- **Creation**: Created a new Next.js API endpoint to handle session issuance.
- **Behavior**:
  - Handles POST requests containing `{ requestId: string }`.
  - Queries `AccessRequest` in the SQLite database by `id`.
  - Verifies that status is `"approved"`.
  - Fetches the employee using the email from the `AccessRequest` record.
  - Calls `setEmployeeCookie` from `lib/session.ts` to set the `emp_session` cookie in the employee's browser.
  - Returns `{ success: true, redirectTo: "/dashboard" }`.
  - Returns appropriate errors (403 for unapproved requests, 404 for missing request/employee, 400 for bad input).

### 4. `frontend/app/(auth)/onboarding/page.tsx`
- **Modification**:
  - Added states to track geolocation permissions and errors (`geoError`, `isCameraPopupOpen`).
  - Added a helper function to query geolocation and handle permission errors.
  - Added a premium, polished "liquid glass" style viewfinder popup overlay.
  - Blocked camera popup opening and request submission if geolocation permission is denied or coordinates cannot be acquired, displaying clear text error to the user.
  - Centered the face inside the viewfinder using a dotted guide frame and an animated scanning line overlay.
  - Modified the status polling check to POST to `/api/auth/session/issue` once the access request status becomes `"approved"` to obtain the session cookie before transitioning to the integrations screen.
  - Changed final AI analysis redirect from `/employee/dashboard` to `/dashboard`.

### 5. `frontend/middleware.ts`
- **Modification**: Excluded `/onboarding` from requiring the session cookie while keeping `/dashboard` protected.
  ```typescript
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/employee')) {
  ```
