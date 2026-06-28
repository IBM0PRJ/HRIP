# Security and Logic Fixes Changelog

## Modified Files

### 1. `frontend/app/api/auth/request/route.ts`
- **Change**: Imported `getAnalystFromRequest` from `../../../../lib/session`.
- **Change**: Enforced analyst authentication on the `GET` endpoint. If the user is not an analyst, it returns a 401 Unauthorized response.
- **Rationale**: Restricts the analyst queue endpoints to authenticated analysts only. The `POST` (create request) endpoint remains public for onboarding clients.

### 2. `frontend/app/api/auth/request/[id]/route.ts`
- **Change**: Imported `getAnalystFromRequest` from `../../../../../lib/session`.
- **Change**: Enforced analyst authentication on the `POST` handler (which approves or denies requests). If the user is not an analyst, it returns a 401 Unauthorized response.
- **Rationale**: Ensures only authorized analysts can approve/deny onboarding access requests. The `GET` (poll request status) endpoint remains public to allow unauthenticated onboarding clients to poll their request state.

### 3. `frontend/lib/session.ts`
- **Change**: Modified `getEmployeeFromRequest` to query the SQLite database (`prisma.session.findUnique`) using the employee's email.
- **Change**: Validates that a session record exists in the database and its `state` is exactly `"active"`. If not, returns `null`.
- **Rationale**: Enforces database-level session isolation. Even if a client possesses a valid signed JWT, the session must be `"active"` (not `"isolated"` or `"reauth_required"`) in the SQLite database to be considered valid.

### 4. `frontend/app/(employee)/layout.tsx`
- **Change**: Converted the `EmployeeLayout` component into an `async` function.
- **Change**: Replaced the raw cookie presence check with a call to `await getEmployeeFromRequest()`.
- **Change**: If it returns `null` (indicating no valid, active DB session), redirects the user to `/login`.
- **Rationale**: Enforces strict database-level session validation for all employee routes nested under the `(employee)` group layout.
