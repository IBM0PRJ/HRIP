# Zero-Trust Authentication Pipeline Fix Strategy Analysis

This report outlines the detailed findings and proposed modifications to implement the Zero-Trust Authentication Pipeline. Currently, a session cookie `emp_session` is issued immediately upon login or OTP verification, allowing users to bypass biometric/location identity clearance at `/onboarding` and directly access the employee `/dashboard`. 

Below is the strategy to prevent immediate session generation, enforce onboarding verification, implement a secure cookie issuance endpoint, update the onboarding UI with high-fidelity glassmorphism, and align the Next.js middleware.

---

## 1. Context & Architecture Analysis

### Current Session Generation Pattern
Currently, when an employee attempts to log in or verify their OTP:
* **Password Login (`app/api/auth/login/route.ts`)**: Generates and issues `emp_session` cookie via `setEmployeeCookie` and instructs the frontend to redirect to `/dashboard`.
* **OTP Verification (`app/api/auth/verify-otp/route.ts`)**: Issues `emp_session` cookie via `setEmployeeCookie` and redirects to `/onboarding`.

### Vulnerability Identified
Because `emp_session` is issued *before* the biometric selfie and GPS validation are reviewed/approved, a user has a valid authenticated session from the start. Under the current `middleware.ts`, anyone with `emp_session` has access to `/dashboard` and `/api/employee/*` endpoints. Thus, a malicious actor or unverified user can bypass `/onboarding` entirely by navigating directly to `/dashboard`.

---

## 2. Recommended Changes: Step-by-Step

### Step 1: Remove Immediate Cookie Placement
We must delay session creation. No session token or `emp_session` cookie should be issued during password verification or OTP verification. Instead, these steps should only return user metadata and redirect the client to `/onboarding`.

#### Target File A: `frontend/app/api/auth/login/route.ts`
* **File Location**: Lines 31–36
* **Current Implementation**:
  ```typescript
  const res = NextResponse.json({ success: true, redirectTo: "/dashboard" });
  return setEmployeeCookie(res, {
    id: employee.id,
    email: employee.email,
    name: employee.name
  });
  ```
* **Proposed Replacement**:
  ```typescript
  return NextResponse.json({
    success: true,
    redirectTo: `/onboarding?email=${encodeURIComponent(employee.email)}&name=${encodeURIComponent(employee.name)}&dept=${encodeURIComponent(employee.department)}`
  });
  ```

#### Target File B: `frontend/app/api/auth/verify-otp/route.ts`
* **File Location**: Lines 46–54
* **Current Implementation**:
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
* **Proposed Replacement**:
  ```typescript
  return NextResponse.json({
    success: true,
    redirectTo: `/onboarding?email=${encodeURIComponent(email)}&name=${encodeURIComponent(employee.name)}&dept=${encodeURIComponent(employee.department)}`
  });
  ```

---

### Step 2: Establish the Cookie Issuance Endpoint
Create a new Next.js API route that issues the `emp_session` cookie *only* after confirming the manually-reviewed `AccessRequest` has been marked as `approved` in the SQLite database.

#### Target File C: `frontend/app/api/auth/session/issue/route.ts`
* **File Action**: Create new file
* **Proposed Code**:
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

      // Query the database for the access request
      const accessRequest = await prisma.accessRequest.findUnique({
        where: { id: requestId }
      });

      if (!accessRequest) {
        return NextResponse.json({ error: "Access request not found" }, { status: 404 });
      }

      // Enforce zero-trust clearance checks
      if (accessRequest.status !== "approved") {
        return NextResponse.json(
          { error: `Access request status is currently: ${accessRequest.status}` },
          { status: 403 }
        );
      }

      // Locate corresponding employee info to populate JWT payload
      const employee = await prisma.employee.findUnique({
        where: { email: accessRequest.employeeEmail }
      });

      if (!employee) {
        return NextResponse.json({ error: "Employee profile not found" }, { status: 404 });
      }

      // Establish session response and attach employee cookie
      const response = NextResponse.json({ success: true, redirectTo: "/dashboard" });
      return setEmployeeCookie(response, {
        id: employee.id,
        email: employee.email,
        name: employee.name
      });
    } catch (error) {
      console.error("Session issue endpoint error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
  ```

---

### Step 3: Implement Onboarding UI and Flow Changes
Modify `/onboarding` to:
1. Block progress if geolocation permissions are denied.
2. Present a premium "liquid glass" style viewfinder popup.
3. Submit verification data to `POST /api/auth/request`.
4. Render an immersive clearance status holding screen.
5. Poll approval status and subsequently trigger cookie issuance via `POST /api/auth/session/issue` upon analyst approval.

#### Target File D: `frontend/app/(auth)/onboarding/page.tsx`
* **Changes to Make**:
  1. Add states for location error enforcement and popup visibility:
     ```typescript
     const [locationError, setLocationError] = useState<string | null>(null);
     const [showCameraPopup, setShowCameraPopup] = useState<boolean>(false);
     ```
  2. Implement strict location-checking inside camera and location `useEffect`:
     ```typescript
     useEffect(() => {
       if (step === "camera" && showCameraPopup) {
         navigator.mediaDevices.getUserMedia({ video: true })
           .then((s) => {
             setStream(s);
             if (videoRef.current) videoRef.current.srcObject = s;
           })
           .catch((err) => {
             console.error("Camera access error:", err);
           });

         if (navigator.geolocation) {
           navigator.geolocation.getCurrentPosition(
             (pos) => {
               setLocation({
                 lat: pos.coords.latitude,
                 lng: pos.coords.longitude,
                 formatted: `Coordinates: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
               });
               setLocationError(null);
             },
             (err) => {
               console.error("Location access denied:", err);
               setLocationError("Zero-Trust policy requires geolocation access. Access cannot be granted without GPS coordinates.");
             }
           );
         } else {
           setLocationError("Geolocation is not supported by your browser.");
         }
       }
       return () => {
         if (stream) stream.getTracks().forEach(t => t.stop());
       };
     }, [step, showCameraPopup]);
     ```
  3. Modify the polling effect to fetch the session issue route:
     ```typescript
     useEffect(() => {
       if (step === "holding" && requestId) {
         const interval = setInterval(async () => {
           try {
             const res = await fetch(`/api/auth/request/${requestId}`);
             const data = await res.json();
             
             if (data.status === "approved") {
               // Hit the new session issuance endpoint to acquire cookie
               const issueRes = await fetch("/api/auth/session/issue", {
                 method: "POST",
                 headers: { "Content-Type": "application/json" },
                 body: JSON.stringify({ requestId })
               });
               
               if (issueRes.ok) {
                 const issueData = await issueRes.json();
                 if (issueData.success) {
                   setStep("integrations");
                 }
               } else {
                 console.error("Cookie issuance failed");
               }
             } else if (data.status === "denied") {
               router.push("/login?error=denied");
             }
           } catch (e) {
             console.error("Clearance polling error:", e);
           }
         }, 2000);
         return () => clearInterval(interval);
       }
     }, [step, requestId, router]);
     ```
  4. Redesign the JSX content for `step === "camera"` and step `step === "holding"`. 
     * Inside `step === "camera"`, display a screen prompting to launch the verification check.
     * Use custom inline-CSS styles to achieve the "liquid glass" modal look.
     
     **Example Liquid Glass Styles**:
     ```typescript
     const glassOverlay = {
       position: "fixed" as const,
       top: 0, left: 0,
       width: "100vw", height: "100vh",
       background: "rgba(3, 8, 14, 0.75)",
       backdropFilter: "blur(12px)",
       WebkitBackdropFilter: "blur(12px)",
       display: "flex",
       alignItems: "center",
       justifyContent: "center",
       zIndex: 1000,
       padding: 20
     };

     const glassCard = {
       background: "rgba(15, 27, 40, 0.45)",
       backdropFilter: "blur(20px)",
       WebkitBackdropFilter: "blur(20px)",
       border: "1px solid rgba(212, 180, 113, 0.2)",
       borderRadius: "24px",
       padding: "32px",
       maxWidth: "500px",
       width: "100%",
       boxShadow: "0 22px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
       textAlign: "center" as const
     };
     ```
     * Inside `step === "holding"`, display an immersive `"Security Clearance Pending: Analyst Review in Progress"` holding screen.

---

### Step 4: Adjust Next.js Middleware Route Exclusions
We must allow public, unauthenticated access to `/onboarding`, otherwise a user redirected there by `login/route.ts` will immediately be sent back to `/login` by the middleware. `/dashboard` and `/api/employee/*` will remain locked.

#### Target File E: `frontend/middleware.ts`
* **File Location**: Lines 13–19
* **Current Implementation**:
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
* **Proposed Replacement**:
  ```typescript
  // Employee routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/employee')) {
    const hasEmpSession = request.cookies.has('emp_session');
    if (!hasEmpSession) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }
  ```

---

## 3. End-to-End Execution Sequence
1. **User Action**: Employee logs in (or verifies OTP).
2. **Backend**: Validates password (or OTP), returns success, does **NOT** issue `emp_session` cookie, redirects to `/onboarding?email=...&name=...`.
3. **Middleware**: Allows user to load `/onboarding` (bypass rule).
4. **User Action**: Clicks "Start Verification Scanner" on onboarding.
5. **Frontend**: Requests Geolocation. If denied, displays warning and blocks proceed action. If approved, prompts camera preview inside the glassmorphic modal.
6. **User Action**: Clicks "Scan & Verify" inside the glassmorphic modal.
7. **Frontend**: Captures webcam image, stops webcam stream, calls `POST /api/auth/request` with selfie payload, GPS coordinates, name, email, department, and User Agent device type. Transitions into the holding screen.
8. **Security Operations / Analyst Action**: Analyst loads the admin panel, reviews the location and selfie, and clicks Approve. This marks `AccessRequest.status = "approved"` in the database.
9. **Frontend**: Polling endpoint detects the status update to `"approved"`.
10. **Frontend**: Hits `POST /api/auth/session/issue` sending `{ requestId }`.
11. **Backend (`session/issue/route.ts`)**: Checks DB for approved request, generates `emp_session` JWT, places cookie in client header, and returns `{ success: true, redirectTo: "/dashboard" }`.
12. **Frontend**: Steps user forward to `"integrations"` and then `/dashboard` under a fully-authorized secure cookie.
