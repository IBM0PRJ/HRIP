# Original User Request

## Initial Request — 2026-06-28T14:21:02Z

Redesign the HRIP Employee Dashboard for a premium, polished look, fix broken UI layouts, and enforce a strict Zero-Trust Analyst-approval pipeline (involving location/webcam biometrics context) for all employee signups and logins before granting access.

Working directory: C:\Users\rahul\Desktop\hrip\frontend
Integrity mode: development

## Requirements

### R1. Zero-Trust Authentication Pipeline
- When an employee signs in or creates an account, they must be prompted to grant webcam and geolocation permissions.
- **Biometric Capture**: Show a visible camera viewfinder to the employee (use a visible liquid glass type cool looking popup) so they know they are taking a selfie.
- **Location API**: Use the native browser `navigator.geolocation` which asks the user for permission via a popup.
- The frontend must capture the live selfie image and GPS coordinates, and submit them as an `AccessRequest` (this model already exists in `prisma/schema.prisma`).
- The login API must **not** issue the session cookie immediately.
- The employee must be placed on a "Holding Screen" that periodically checks the status of their `AccessRequest`.
- **Holding Screen Design**: Build a highly immersive "Security Clearance Pending: Analyst Review in Progress" screen.
- An endpoint `/api/auth/session/issue` must be created to securely issue the `emp_session` cookie ONLY if the `AccessRequest` status is `approved`.

### R2. Analyst Verification
- Analysts must see a queue of pending `AccessRequest` items on their dashboard (already implemented in `/access-requests`).
- Analysts can review the selfie, location, and device info, and click "Approve" or "Deny".
- Once approved, the employee's holding screen polling will detect the approval, hit the `/api/auth/session/issue` endpoint to get the cookie, and redirect them to the employee dashboard.

### R3. Employee Dashboard Redesign & Wiring
- Completely redesign `app/(employee)/layout.tsx` to use the standard `.sidebar` class instead of `.appHeaderWrap` so it matches the Analyst layout correctly.
- Overhaul `app/(employee)/dashboard/page.tsx` for a polished, premium aesthetic that matches the luxury dark-mode theme of the login page.
- Ensure all dashboard features are fully functional: telemetry integration toggles, marking alerts as read, submitting incident reports, and submitting training quizzes.

## Acceptance Criteria

### Authentication Pipeline
- [ ] Employee cannot access `/dashboard` without an approved `AccessRequest` for that session.
- [ ] Holding screen automatically transitions to dashboard upon analyst approval.

### Employee Dashboard
- [ ] UI is fully responsive, polished, and free of CSS/layout regressions.
- [ ] Layout utilizes a left-aligned sidebar rather than the squished top-header bug.
- [ ] Telemetry toggles successfully send API requests and update the UI state.
- [ ] Incident forms clear out and submit properly.
