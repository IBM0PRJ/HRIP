# Handoff Report — Milestone 2 Reviewer 1

## 1. Observation

- **Login Route (`frontend/app/api/auth/login/route.ts`)**:
  ```typescript
  if (role === "employee") {
    ...
    if (!employee.isVerified) {
      return NextResponse.json({ error: "Account not verified" }, { status: 403 });
    }

    const redirectTo = `/onboarding?email=${encodeURIComponent(employee.email)}&name=${encodeURIComponent(employee.name)}&dept=${encodeURIComponent(employee.department)}`;
    return NextResponse.json({ success: true, redirectTo });
  ```
  No cookie is set here; redirect is sent to `/onboarding`.

- **OTP Verification Route (`frontend/app/api/auth/verify-otp/route.ts`)**:
  ```typescript
  if (purpose === "employee_signup") {
    const employee = await prisma.employee.findUnique({ where: { email } });
    if (employee) {
      // Mark verified
      await prisma.employee.update({
        where: { id: employee.id },
        data: { isVerified: true }
      });
      
      // Do NOT log them in immediately (zero-trust auth flow)
      return NextResponse.json({ success: true, redirectTo: `/onboarding?email=${encodeURIComponent(email)}&name=${encodeURIComponent(employee.name)}&dept=${encodeURIComponent(employee.department)}` });
    }
  }
  ```
  No cookie is set here either.

- **Session Issue Route (`frontend/app/api/auth/session/issue/route.ts`)**:
  ```typescript
  const accessRequest = await prisma.accessRequest.findUnique({
    where: { id: requestId }
  });

  if (!accessRequest) {
    return NextResponse.json({ error: "Access request not found" }, { status: 404 });
  }

  if (accessRequest.status !== "approved") {
    return NextResponse.json({ error: "Access request is not approved" }, { status: 403 });
  }
  ...
  let response: NextResponse<any> = NextResponse.json({ success: true, redirectTo: "/dashboard" });
  response = setEmployeeCookie(response, {
    id: employee.id,
    email: employee.email,
    name: employee.name
  });
  return response;
  ```

- **Onboarding Page UI (`frontend/app/(auth)/onboarding/page.tsx`)**:
  - Enforces geolocation permission inside `handleCapture`:
    ```typescript
    if (!location) {
      setGeoError("Geolocation coordinates are missing. Submission blocked.");
      setIsCameraPopupOpen(false);
      return;
    }
    ```
  - Viewfinder modal style configures:
    ```typescript
    background: "rgba(255, 255, 255, 0.07)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: "24px",
    padding: "32px",
    backdropFilter: "blur(25px)",
    ```
  - Polling interval set to 2000ms:
    ```typescript
    const interval = setInterval(async () => {
      ...
      const res = await fetch(`/api/auth/request/${requestId}`);
      ...
      if (data.status === "approved") {
        const issueRes = await fetch("/api/auth/session/issue", {
          ...
    ```

- **Middleware (`frontend/middleware.ts`)**:
  - Public paths bypass:
    ```typescript
    if (pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/api/auth')) {
      return NextResponse.next();
    }
    ```
  - Employee routes:
    ```typescript
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/employee')) {
      const hasEmpSession = request.cookies.has('emp_session');
      if (!hasEmpSession) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      return NextResponse.next();
    }
    ```

- **Build Output**:
  - Executed `npm run build` inside `frontend/` directory. Result: `The command completed successfully.` compilation completed with all pages optimized.

---

## 2. Logic Chain

1. **Criterion 1 (No immediate cookie)**: The `login` and `verify-otp` endpoints redirect directly to `/onboarding` without invoking `setEmployeeCookie` or altering headers to add `emp_session`. This satisfies the zero-trust initial flow block.
2. **Criterion 2 (Session issuance)**: `/api/auth/session/issue` checks the SQLite db for the corresponding `requestId`, confirms its status is `"approved"`, fetches the Employee, and invokes `setEmployeeCookie` before returning the redirect command.
3. **Criterion 3 (Onboarding flow)**: `onboarding/page.tsx` checks navigator geolocation, handles errors using pos/timeout/denied mappings, prompts the webcam view within a popup containing a CSS blur, inset-shadow overlay (liquid glass) styling, and polls `/api/auth/request/[id]` to trigger the `/api/auth/session/issue` endpoint.
4. **Criterion 4 (Middleware protection)**: `/dashboard` and `/api/employee` require the presence of the `emp_session` cookie; `/onboarding` is not matching the protected rules and is allowed to run without `emp_session`.
5. **Criterion 5 (Build compilation)**: The compilation step completed successfully with 0 errors.

*However, during adversarial assessment, the following security bypass logic chains were identified:*
- **Public endpoint leakage**: Since the middleware allows all requests starting with `/api/auth` to pass without verification, and since the `GET /api/auth/request` and `POST /api/auth/request/[id]` endpoints reside within `/api/auth/`, any client can query pending requests and update their approval state to `"approved"`.
- **Incomplete isolation checking**: Since the backend API and middleware do not query the database for session state (`"isolated"`, `"reauth_required"`), a user whose session has been isolated on the database is only locked out client-side; raw API requests using their cookie will still succeed.

---

## 3. Caveats

- **No live user validation**: We only verified that the Next.js compilation succeeds and the code logic is correct. We did not spin up the Next.js development server to interactively test the webcam capture in the browser, as we are running in CODE_ONLY network mode and reviewing statically.
- **SQLite seed data**: The integration tests run `pytest` and use standard seed data. The database integrity is assumed based on test suite execution.

---

## 4. Conclusion

The implementation functions correctly as specified under standard operational expectations and matches the requested criteria. However, because of the two critical security vulnerabilities (public access request approval and lack of database session state checks on API endpoints), we must issue a verdict of **REQUEST_CHANGES**.

---

## 5. Verification Method

To independently verify:
1. Run `pytest` from the project root directory:
   ```cmd
   pytest
   ```
2. Run Next.js build:
   ```cmd
   cd frontend
   npm run build
   ```
3. Inspect `review.md` for detailed findings and challenges.
