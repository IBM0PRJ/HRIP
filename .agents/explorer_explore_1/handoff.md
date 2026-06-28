# Handoff Report - Frontend & Auth Exploration

This report synthesizes the read-only investigation of the Frontend & Auth components in the HRIP repository.

---

## 1. Observation

### Authentication & Cookies
*   **Session Middleware**: `frontend/middleware.ts` handles session checks:
    ```typescript
    // Employee routes
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding') || pathname.startsWith('/api/employee')) {
      const hasEmpSession = request.cookies.has('emp_session');
      if (!hasEmpSession) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      return NextResponse.next();
    }

    // Analyst routes (Dashboard, alerts, users, etc.)
    const analystRoutes = ['/', '/alerts', '/users', '/access-requests', '/incidents', '/pending-signups'];
    const isAnalystRoute = analystRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
    const isAnalystApi = pathname.startsWith('/api/analyst');
    
    if (isAnalystRoute || isAnalystApi) {
      const hasAnalystSession = request.cookies.has('analyst_session');
      if (!hasAnalystSession) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      return NextResponse.next();
    }
    ```
*   **Cookie Issuance**:
    *   `frontend/lib/session.ts` defines `setEmployeeCookie` and `setAnalystCookie`:
        ```typescript
        export function setEmployeeCookie(response: NextResponse, employee: { id: string; email: string; name: string }) {
          const token = createJWT({ id: employee.id, email: employee.email, name: employee.name, role: "employee" });
          response.cookies.set("emp_session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 7 * 24 * 60 * 60 });
          return response;
        }
        ```
    *   Employee sessions are set:
        1.  In `frontend/app/api/auth/verify-otp/route.ts` upon completing `employee_signup` OTP check.
        2.  In `frontend/app/api/auth/login/route.ts` upon successful email/password verification for `role === "employee"`.
    *   Analyst sessions are set in `frontend/app/api/auth/login/route.ts` upon successful credentials check if they are approved (`isApproved === true`).

### Prisma Database Schema
*   **AccessRequest Model**: Found in `frontend/prisma/schema.prisma` lines 11–23:
    ```prisma
    model AccessRequest {
      id            String   @id @default(cuid())
      employeeName  String
      employeeEmail String
      department    String
      photoUrl      String   
      lat           Float
      lng           Float
      locationName  String
      deviceType    String
      status        String   // "pending" | "approved" | "denied"
      createdAt     DateTime @default(now())
    }
    ```

### Analyst Verification Queue
*   **Route**: `frontend/app/(dashboard)/access-requests/page.tsx` implements the Live Verifications queue.
*   **Approved/Deny Action**:
    *   The page polls `/api/auth/request` (GET) every 3 seconds to fetch pending requests.
    *   Approve/Deny buttons trigger `handleAction(id, "approved" | "denied")` which posts to `/api/auth/request/${id}`:
        ```typescript
        await fetch(`/api/auth/request/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        ```
    *   Backend logic in `frontend/app/api/auth/request/[id]/route.ts` handles POST:
        ```typescript
        if (action === "approved" || action === "denied") {
          await prisma.accessRequest.update({
            where: { id: params.id },
            data: { status: action }
          });
          
          if (action === "approved") {
            const reqData = await prisma.accessRequest.findUnique({ where: { id: params.id } });
            if (reqData) {
              await prisma.session.upsert({
                where: { email: reqData.employeeEmail },
                update: { state: "active" },
                create: {
                  userId: reqData.employeeEmail,
                  email: reqData.employeeEmail,
                  state: "active"
                }
              });
            }
          }
          return NextResponse.json({ success: true, status: action });
        }
        ```

### Employee Dashboard Layout & Features
*   **Page**: `frontend/app/(employee)/dashboard/page.tsx`
*   **Layout CSS Conflict**: In `frontend/app/(employee)/layout.tsx`, the return value is:
    ```typescript
    return (
      <div className="layout">
        <div className="appHeaderWrap" style={{ left: 0, width: "100%" }}>
          <header className="appHeader">...</header>
        </div>
        <main className="content" style={{ ... }}>{children}</main>
      </div>
    );
    ```
    However, `.layout` is defined in `frontend/app/globals.css` as a 2-column grid template:
    ```css
    .layout {
      display: grid;
      grid-template-columns: 280px minmax(0, 1fr);
      min-height: 100vh;
      position: relative;
      z-index: 1;
    }
    ```
    As a result, `.appHeaderWrap` is treated as the first grid column (squeezed to 280px width) and the main content gets pushed to the second column, breaking layout.
*   **Dashboard Features**:
    1.  *Telemetry Toggles*: Toggles active integrations (`email`, `usb`, `network`). Triggers POST `/api/telemetry` to persist state.
    2.  *Security Alerts*: Fetches from `/api/employee/alerts`. Acknowledge button hits PATCH `/api/employee/alerts/[id]/read`.
    3.  *Incident Reports*: List reports fetched from `/api/employee/incidents` and allows creating one via a modal that POSTs to the same route.
    4.  *Training Quizzes*: Lists training modules from `/api/employee/training` and launches an MCQ modal. Submits score via POST to `/api/employee/training`.

### Testing & Build Setup
*   `frontend/package.json` contains:
    ```json
    "scripts": {
      "dev": "next dev",
      "build": "next build",
      "start": "next start"
    }
    ```
    No `test` script exists in the frontend package.
*   Root `Makefile` exposes:
    ```makefile
    test:
        pytest
    ```
*   `npm run build` ran successfully and compiled the next project with 0 errors.

---

## 2. Logic Chain

1.  **Cookie Auth**: Because `middleware.ts` enforces `hasEmpSession` on employee routes and `hasAnalystSession` on analyst routes, session security is strictly separated. The cookie is verified via JWT decryption inside `frontend/lib/session.ts` to ensure users are authenticated.
2.  **Access Approval**: The analyst queue updates the status of the `AccessRequest` model in the SQLite database and upserts the `Session` model. This allows the background systems (or gateway) to know the session state is "active".
3.  **Layout Malfunction**: Because `layout.tsx` uses the `.layout` class which styles a 2-column grid template (`280px minmax(0, 1fr)`), and because it lacks a `.sidebar` first child, the `.appHeaderWrap` is parsed as the sidebar grid item. This squeezes the header into a 280px container and misaligns the dashboard.
4.  **Testing Harness**: The presence of `Makefile` with a `test` target executing `pytest` indicates testing is currently set up on the python backend only. Frontend compilation is verified through the `next build` command.

---

## 3. Caveats

*   **Database Engine**: SQLite is used in frontend dev/testing (`dev.db` and database URL configuration). Ensure that production environments replace this appropriately.
*   **Quiz Score Evaluation**: The quiz modal currently submits a hardcoded or approximated score (`score = answers.length === 3 ? 3 : 2`) rather than validating specific correct/incorrect answers dynamically on the client side.

---

## 4. Conclusion & Proposed Implementation Details

### Recommended Layout Fixes
To resolve the broken employee portal top header, modify `frontend/app/(employee)/layout.tsx` using one of two approaches:

#### Option A: Single-Column Container Layout (Top Header style)
Change the container class in `frontend/app/(employee)/layout.tsx` from `layout` to `employeePortalLayout` (or similar) and style it in `globals.css` as a single-column layout.
*   **File to modify**: `frontend/app/(employee)/layout.tsx`
*   **Before**:
    ```typescript
    return (
      <div className="layout">
        <div className="appHeaderWrap" style={{ left: 0, width: "100%" }}>
    ```
*   **After**:
    ```typescript
    return (
      <div className="employeePortalLayout">
        <div className="appHeaderWrap">
    ```
*   **Add CSS in `globals.css`**:
    ```css
    .employeePortalLayout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    ```

#### Option B: Left-Aligned Sidebar Layout
Add an employee-specific sidebar navigation by reusing or subclassing the `.sidebar` class.
*   **File to modify**: `frontend/app/(employee)/layout.tsx`
*   **Proposed Structure**:
    ```typescript
    return (
      <div className="layout">
        <aside className="sidebar">
          {/* Employee branding and logout links */}
        </aside>
        <main className="content">
          <header className="appHeader">...</header>
          {children}
        </main>
      </div>
    );
    ```

---

## 5. Verification Method

1.  **Frontend Build**:
    ```bash
    cd frontend
    npm run build
    ```
    *Build must output `✓ Compiled successfully` with 0 failures.*
2.  **Layout Verification**:
    Launch the server (`npm run dev`) and navigate to `/dashboard` (after completing OTP or bypass/login). Inspect the DOM structure to ensure that the header spans the viewport (or fits nicely alongside the sidebar) without being squashed into a 280px grid column.
3.  **Backend Tests**:
    ```bash
    make test
    ```
    *Ensure `pytest` executes and completes successfully.*
