# Zero-Trust Authentication Pipeline Analysis & Fix Strategy

This report details the findings and proposed implementation plan for Milestone 2: Zero-Trust Authentication Pipeline.

---

## 1. Session Cookie Removal (`login/route.ts` & `verify-otp/route.ts`)

### Findings
- **File**: `frontend/app/api/auth/login/route.ts`
  - **Lines 31-36**: Currently calls `setEmployeeCookie(res, ...)` to immediately write the `emp_session` cookie to the response on successful login of an employee, then redirects to `/dashboard`.
- **File**: `frontend/app/api/auth/verify-otp/route.ts`
  - **Lines 47-51**: Currently calls `setEmployeeCookie(response, ...)` to write the `emp_session` cookie immediately when verifying an employee's OTP signup, then redirects to `/onboarding`.

### Proposed Changes
- In `login/route.ts`, modify the employee block to NOT call `setEmployeeCookie` and instead return a JSON response directing the employee to the `/onboarding` page with their profile details passed as query parameters (`email`, `name`, `dept`), just like `verify-otp` does.
- In `verify-otp/route.ts`, modify the employee signup verification block to NOT call `setEmployeeCookie` and simply return the JSON response directing them to `/onboarding`.

#### Proposed Diff for `frontend/app/api/auth/login/route.ts`
```typescript
<<<<
      const res = NextResponse.json({ success: true, redirectTo: "/dashboard" });
      return setEmployeeCookie(res, {
        id: employee.id,
        email: employee.email,
        name: employee.name
      });
====
      return NextResponse.json({
        success: true,
        redirectTo: `/onboarding?email=${encodeURIComponent(employee.email)}&name=${encodeURIComponent(employee.name)}&dept=${encodeURIComponent(employee.department)}`
      });
>>>>
```

#### Proposed Diff for `frontend/app/api/auth/verify-otp/route.ts`
```typescript
<<<<
        // Log them in
        response = setEmployeeCookie(response, {
          id: employee.id,
          email: employee.email,
          name: employee.name
        });
        
        const responseData = await response.json();
        return NextResponse.json({ ...responseData, redirectTo: `/onboarding?email=${encodeURIComponent(email)}&name=${encodeURIComponent(employee.name)}&dept=${encodeURIComponent(employee.department)}` });
====
        return NextResponse.json({
          success: true,
          redirectTo: `/onboarding?email=${encodeURIComponent(email)}&name=${encodeURIComponent(employee.name)}&dept=${encodeURIComponent(employee.department)}`
        });
>>>>
```

---

## 2. New Session Issuance Endpoint (`session/issue/route.ts`)

### Design
- **Path**: `frontend/app/api/auth/session/issue/route.ts`
- **Method**: `POST`
- **Request Body**: `{ requestId: string }`
- **Logic**:
  1. Accepts `requestId` from the request JSON.
  2. Queries `AccessRequest` from the database.
  3. Returns a `404 Not Found` if the access request doesn't exist.
  4. Checks if the request status is `"approved"`. If not, returns `403 Forbidden` (or `401 Unauthorized`) with `{ error: "Access request is not approved (status: <status>)" }`.
  5. Queries the `Employee` record by the email address associated with the approved request. If the employee does not exist, returns `404 Not Found`.
  6. Uses `setEmployeeCookie` from `lib/session` to write the session token to the cookie.
  7. Returns `{ success: true, redirectTo: "/dashboard" }`.

### Proposed Code for `frontend/app/api/auth/session/issue/route.ts`
```typescript
import { NextResponse } from "next/server";
import prisma from "../../../../../lib/db";
import { setEmployeeCookie } from "../../../../../lib/session";

export async function POST(request: Request) {
  try {
    const { requestId } = await request.json();

    if (!requestId) {
      return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
    }

    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id: requestId },
    });

    if (!accessRequest) {
      return NextResponse.json({ error: "Access request not found" }, { status: 404 });
    }

    if (accessRequest.status !== "approved") {
      return NextResponse.json(
        { error: `Access request is not approved (status: ${accessRequest.status})` },
        { status: 403 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { email: accessRequest.employeeEmail },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const res = NextResponse.json({ success: true, redirectTo: "/dashboard" });
    return setEmployeeCookie(res, {
      id: employee.id,
      email: employee.email,
      name: employee.name,
    });
  } catch (error) {
    console.error("Issue session error:", error);
    return NextResponse.json({ error: "Failed to issue session" }, { status: 500 });
  }
}
```

---

## 3. Onboarding Flow & Frontend Redesign (`onboarding/page.tsx`)

### Design & Requirements
1. **Initial Screen**: Renders onboarding details without camera active. Features a "Start Identity Verification" button.
2. **Camera Popup**: A polished, modern "liquid glass" popup layout featuring a blurred backdrop (`backdrop-filter: blur(12px)`), semi-transparent gradient container, visible camera viewfinder with a scanning line animation, and active GPS status indicator.
3. **Strict Geolocation Enforcement**: If geolocation is disabled, denied, or fails, the user is presented with a clear error block, and the submission button is disabled.
4. **Immersive Holding Screen**: When step is `"holding"`, shows an active status check board containing details like the `requestId`, geolocation coordinates, active tunnel logs, and a loading spinner.
5. **Polling & Session Cookie Request**: Polls `/api/auth/request/${requestId}` every 2 seconds. When the analyst approves, calls `/api/auth/session/issue` to obtain the cookie, then shifts to the integrations panel.
6. **Correct Dashboard Redirect**: The Employee Dashboard maps to `/dashboard` (group route `(employee)` is ignored). We must change the redirect from the incorrect `/employee/dashboard` to `/dashboard`.

### Proposed Changes for `frontend/app/(auth)/onboarding/page.tsx`
- Add CSS variables or a `<style>` block for the premium "liquid glass" styling and keyframe animations.
- Implement camera and geolocation states (`showCameraPopup`, `geoError`, `cameraError`).
- Replace the inline camera viewfinder with the popup modal.
- Modify the polling logic to trigger the new `/api/auth/session/issue` endpoint.
- Correct the router push to `/dashboard`.

#### Code Sketch / Props Implementation Diffs
```typescript
// Add new states inside OnboardingContent:
const [showCameraPopup, setShowCameraPopup] = useState(false);
const [cameraError, setCameraError] = useState<string | null>(null);
const [geoError, setGeoError] = useState<string | null>(null);

// Geolocation and Camera Hook:
useEffect(() => {
  let activeStream: MediaStream | null = null;
  if (showCameraPopup) {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((s) => {
        activeStream = s;
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
        setCameraError(null);
      })
      .catch((err) => {
        console.error("Camera error:", err);
        setCameraError("Camera access is required for identity verification.");
      });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            formatted: `Coordinates: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
          });
          setGeoError(null);
        },
        (err) => {
          console.error("Geolocation error:", err);
          let errMsg = "Geolocation permission is required for Zero-Trust verification.";
          if (err.code === err.PERMISSION_DENIED) {
            errMsg = "Geolocation permission denied. Please allow location access in your browser to proceed.";
          }
          setGeoError(errMsg);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGeoError("Geolocation is not supported by your browser.");
    }
  }
  return () => {
    if (activeStream) {
      activeStream.getTracks().forEach(t => t.stop());
    }
  };
}, [showCameraPopup]);

// Update polling block:
useEffect(() => {
  if (step === "holding" && requestId) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/request/${requestId}`);
        const data = await res.json();
        if (data.status === "approved") {
          // Call issue session route to set cookie
          const issueRes = await fetch("/api/auth/session/issue", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ requestId })
          });
          const issueData = await issueRes.json();
          if (issueData.success) {
            setStep("integrations");
          } else {
            console.error("Failed to issue session:", issueData.error);
          }
        } else if (data.status === "denied") {
          router.push("/login?error=denied");
        }
      } catch (e) {
        console.error("Error polling request status:", e);
      }
    }, 2000);
    return () => clearInterval(interval);
  }
}, [step, requestId, router, email]);

// Update final redirect in 'analyzing' step:
setTimeout(() => router.push("/dashboard"), 500);
```

---

## 4. Route Protection & Middleware adjustment (`middleware.ts`)

### Findings
- **File**: `frontend/middleware.ts`
- **Lines 13-17**: Currently blocks access to `/onboarding` if the user does not have the `emp_session` cookie:
```typescript
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding') || pathname.startsWith('/api/employee')) {
    const hasEmpSession = request.cookies.has('emp_session');
    if (!hasEmpSession) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
```

### Proposed Changes
- Remove `pathname.startsWith('/onboarding')` from the employee cookie check. This will allow the user to access `/onboarding` immediately after credential checks (since they do not have the session cookie yet).
- `/dashboard` remains protected, verifying that the `emp_session` cookie is present.

#### Proposed Diff for `frontend/middleware.ts`
```typescript
<<<<
  // Employee routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding') || pathname.startsWith('/api/employee')) {
====
  // Employee routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/employee')) {
>>>>
```
