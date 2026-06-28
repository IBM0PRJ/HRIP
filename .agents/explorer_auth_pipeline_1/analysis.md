# Zero-Trust Authentication Pipeline Analysis Report

This analysis outlines the current mechanism of cookie handling and access requests in the HRIP application and provides a detailed design for establishing a Zero-Trust Authentication Pipeline.

---

## 1. Cookie Setting in Login and OTP Verification

### Current Behavior
In the current implementation, the `emp_session` cookie is issued immediately after credentials verification or OTP verification:
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

### Proposed Changes
To transition to a Zero-Trust pipeline, the cookie must NOT be set until the manual access request is approved. 

1. **`frontend/app/api/auth/login/route.ts`**:
   Remove the call to `setEmployeeCookie`. Instead, return a JSON response containing `success: true` and redirect to the onboarding page with query parameters to pass basic employee details:
   ```typescript
   // BEFORE:
   const res = NextResponse.json({ success: true, redirectTo: "/dashboard" });
   return setEmployeeCookie(res, {
     id: employee.id,
     email: employee.email,
     name: employee.name
   });

   // AFTER:
   return NextResponse.json({
     success: true,
     redirectTo: `/onboarding?email=${encodeURIComponent(employee.email)}&name=${encodeURIComponent(employee.name)}&dept=${encodeURIComponent(employee.department)}`
   });
   ```

2. **`frontend/app/api/auth/verify-otp/route.ts`**:
   Remove the `setEmployeeCookie` invocation. Directly return the JSON redirect response to onboarding:
   ```typescript
   // BEFORE:
   response = setEmployeeCookie(response, {
     id: employee.id,
     email: employee.email,
     name: employee.name
   });
   const responseData = await response.json();
   return NextResponse.json({ ...responseData, redirectTo: `/onboarding?email=${encodeURIComponent(email)}&name=${encodeURIComponent(employee.name)}&dept=${encodeURIComponent(employee.department)}` });

   // AFTER:
   return NextResponse.json({
     success: true,
     redirectTo: `/onboarding?email=${encodeURIComponent(email)}&name=${encodeURIComponent(employee.name)}&dept=${encodeURIComponent(employee.department)}`
   });
   ```

---

## 2. Design of Session Issue Endpoint
We will create a new API route at `frontend/app/api/auth/session/issue/route.ts`. This endpoint verifies the manual approval status in the database before granting the `emp_session` cookie.

### Design Specifications
- **Method**: `POST`
- **Payload**: `{ requestId: string }`
- **Validation**:
  1. Checks if `requestId` is provided.
  2. Queries the SQLite database for the `AccessRequest` object.
  3. Verifies that the access request `status === "approved"`.
  4. Looks up the `Employee` record by the email specified in the access request to retrieve their unique database ID and name.
- **Session Issuance**: Uses `setEmployeeCookie` to sign a JWT cookie.
- **Response**: Returns `{ success: true, redirectTo: "/dashboard" }`.

### Proposed Code for `frontend/app/api/auth/session/issue/route.ts`
```typescript
import { NextResponse } from "next/server";
import prisma from "../../../../lib/db";
import { setEmployeeCookie } from "../../../../lib/session";

export async function POST(req: Request) {
  try {
    const { requestId } = await req.json();

    if (!requestId) {
      return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
    }

    // 1. Fetch access request from DB
    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id: requestId }
    });

    if (!accessRequest) {
      return NextResponse.json({ error: "Access request not found" }, { status: 404 });
    }

    // 2. Validate request status is approved
    if (accessRequest.status !== "approved") {
      return NextResponse.json({ 
        error: "Access request is pending or denied" 
      }, { status: 403 });
    }

    // 3. Find the corresponding employee to fetch ID
    const employee = await prisma.employee.findUnique({
      where: { email: accessRequest.employeeEmail }
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee profile not found" }, { status: 404 });
    }

    // 4. Issue the cookie and return redirect target
    const response = NextResponse.json({ success: true, redirectTo: "/dashboard" });
    return setEmployeeCookie(response, {
      id: employee.id,
      email: employee.email,
      name: employee.name
    });

  } catch (error) {
    console.error("Session issue error:", error);
    return NextResponse.json({ error: "Failed to establish session" }, { status: 500 });
  }
}
```

---

## 3. Frontend Onboarding Redesign

### Target File: `frontend/app/(auth)/onboarding/page.tsx`

### Redesign Goals:
1. **Geolocation Enforcement**: Block camera access and submission if GPS coordinates cannot be acquired or permission is denied.
2. **"Liquid Glass" Popup Viewfinder**: Capture the selfie inside a premium, glassmorphism modal with animated glows and scanlines instead of inline.
3. **Analyst Review Holding Screen**: Keep the user on a clean, styled clearance pending screen.
4. **Cookie & Integration Transition**: Once approved, fetch `/api/auth/session/issue` to obtain the cookie, then transition to integrations.

### Key Changes
- Add state variables:
  - `showCameraPopup` (`boolean`) to toggle the glassmorphism modal.
  - `geoError` (`string | null`) to show error alerts.
- Request geolocation on load or button-click using high accuracy and standard timeout.
- Implement the "Liquid Glass" camera popup modal.

### Proposed Code Implementation for `onboarding/page.tsx`

```tsx
"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

type Step = "landing" | "holding" | "integrations" | "analyzing" | "dashboard";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const name = searchParams.get("name") || "Employee";
  const dept = searchParams.get("dept") || "General";
  const initialStep = (searchParams.get("step") as Step) || "landing";

  const [step, setStep] = useState<Step>(initialStep);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<{lat: number, lng: number, formatted: string} | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [showCameraPopup, setShowCameraPopup] = useState(false);

  // Integrations state
  const [intEmail, setIntEmail] = useState(initialStep === "integrations");
  const [intSms, setIntSms] = useState(false);
  const [intVoice, setIntVoice] = useState(false);
  const [intProcess, setIntProcess] = useState(false);
  const [intUsb, setIntUsb] = useState(false);
  const [intNetwork, setIntNetwork] = useState(false);
  const [intFiles, setIntFiles] = useState(false);
  const [intClipboard, setIntClipboard] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Request location permissions
  const requestLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          formatted: `Coordinates: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
        });
      },
      (err) => {
        console.error("GPS Lock Failed:", err);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError("Location access denied. Zero-Trust policy requires GPS validation.");
        } else {
          setGeoError("Failed to lock GPS coordinates. Please check your system settings.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  // Trigger camera stream
  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Unable to access camera. Please verify permissions.");
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Initiate verification process
  const startVerificationFlow = () => {
    requestLocation();
    setShowCameraPopup(true);
    startCamera();
  };

  // Watch popup state to handle camera mount/cleanup
  useEffect(() => {
    if (showCameraPopup) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [showCameraPopup]);

  // Capture image
  const handleCapture = async () => {
    if (!videoRef.current || !location) return;

    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 400);

    const canvas = document.createElement("canvas");
    const scale = 0.5; // Scale down to avoid oversized requests
    canvas.width = videoRef.current.videoWidth * scale;
    canvas.height = videoRef.current.videoHeight * scale;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const photoData = canvas.toDataURL("image/jpeg", 0.7);
    setPhoto(photoData);

    // Turn off camera and close popup
    stopCamera();
    setShowCameraPopup(false);

    // Detect device metadata
    let detectedDevice = "Unknown Device";
    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes("windows")) detectedDevice = "Windows PC";
      else if (ua.includes("mac")) detectedDevice = "MacBook / macOS";
      else if (ua.includes("linux")) detectedDevice = "Linux PC";
      else if (ua.includes("android")) detectedDevice = "Android Device";
      else if (ua.includes("iphone") || ua.includes("ipad")) detectedDevice = "iOS Device";
    }

    // POST access request to /api/auth/request
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeName: name,
          employeeEmail: email,
          department: dept,
          photoUrl: photoData,
          location: location,
          deviceType: detectedDevice,
        })
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setRequestId(data.id);
      setStep("holding");
    } catch (e) {
      console.error(e);
      alert("Failed to submit clearance request. Please retry.");
    }
  };

  // Poll request status and perform transition
  useEffect(() => {
    if (step === "holding" && requestId) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/auth/request/${requestId}`);
          const data = await res.json();
          if (data.status === "approved") {
            clearInterval(interval);
            
            // Call session issue endpoint to set the cookie
            const issueRes = await fetch("/api/auth/session/issue", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ requestId })
            });

            if (issueRes.ok) {
              setStep("integrations");
            } else {
              const err = await issueRes.json();
              alert(`Session establishment failed: ${err.error}`);
            }
          } else if (data.status === "denied") {
            clearInterval(interval);
            router.push("/login?error=denied");
          }
        } catch (e) {
          console.error("Error polling request status:", e);
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [step, requestId, router]);

  const toggleIntegration = async (name: string, currentVal: boolean, setter: (val: boolean) => void) => {
    const newVal = !currentVal;
    setter(newVal);
    try {
      await fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          integration: name,
          status: newVal
        })
      });
    } catch (e) {
      console.error(e);
      setter(currentVal); // Rollback
    }
  };

  const handleOAuth = () => {
    if (intEmail) {
      toggleIntegration("email", intEmail, setIntEmail);
      return;
    }
    signIn("google", { callbackUrl: `/onboarding?step=integrations&email=${encodeURIComponent(email)}` });
  };

  useEffect(() => {
    if (step === "analyzing") {
      let prog = 0;
      const interval = setInterval(() => {
        prog += 2;
        setAiProgress(Math.min(prog, 100));
        if (prog >= 100) {
          clearInterval(interval);
          setTimeout(() => router.push("/dashboard"), 500); // FIXED redirect path
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [step, router]);

  return (
    <div className="loginContainer" style={{ padding: 40, overflowY: "auto" }}>
      
      {/* ── LANDING / INITIAL CLEARANCE STEP ── */}
      {step === "landing" && (
        <div className="loginCard fadeIn" style={{ margin: "0 auto", textAlign: "center" }}>
          <h2>Zero-Trust Access Clearance</h2>
          <p className="muted" style={{ marginTop: 12, marginBottom: 24, fontSize: "0.9rem" }}>
            Welcome, <strong>{name}</strong> ({dept}). To comply with corporate zero-trust policies, we must verify your current physical location and capture a live security selfie before establishing a session.
          </p>

          {geoError && (
            <div style={{
              background: "rgba(255, 133, 120, 0.1)",
              border: "1px solid var(--danger)",
              borderRadius: "8px",
              padding: "12px",
              color: "#ffd2cb",
              fontSize: "0.85rem",
              marginBottom: 20,
              textAlign: "left"
            }}>
              ⚠️ {geoError}
              <button 
                onClick={requestLocation} 
                style={{ 
                  background: "none", 
                  border: "none", 
                  color: "var(--accent)", 
                  textDecoration: "underline", 
                  cursor: "pointer", 
                  marginLeft: 8, 
                  fontSize: "0.85rem" 
                }}
              >
                Retry GPS Lock
              </button>
            </div>
          )}

          {location && (
            <div className="locationPanel" style={{ display: "flex", justifyContent: "center" }}>
              <div className="locPulse" />
              <span style={{ fontSize: "0.85rem" }}>GPS Locked: {location.formatted}</span>
            </div>
          )}

          <button
            className="buttonPrimary"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={startVerificationFlow}
          >
            Start Identity Verification
          </button>
        </div>
      )}

      {/* ── HOLDING SCREEN ── */}
      {step === "holding" && (
        <div className="loginCard fadeIn" style={{ margin: "auto" }}>
          <div className="holdingScreen">
            <div className="spinner" />
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", color: "var(--accent)" }}>
              Security Clearance Pending
            </h3>
            <p className="muted" style={{ marginTop: 16, lineHeight: 1.7, fontSize: "0.9rem" }}>
              Your secure selfie and GPS coordinates have been routed to the Security Operations Center (SOC). 
              <br/><br/>
              An analyst is actively reviewing your request. Please wait; your session will initialize automatically upon approval.
            </p>
          </div>
        </div>
      )}

      {/* ── INTEGRATIONS STEP ── */}
      {step === "integrations" && (
        <div className="loginCard fadeIn" style={{ margin: "auto", maxWidth: 600 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div className="roleIcon" style={{ color: "var(--success)" }}>✓</div>
            <h2>Identity Verified</h2>
            <p className="muted" style={{ marginTop: 8 }}>
              Please grant permissions to analyze your corporate devices for social engineering threats.
            </p>
          </div>

          <div className="integrationList">
            <div className={`integrationRow ${intEmail ? "enabled" : ""}`}>
              <div>
                <div style={{ fontWeight: 600 }}>Corporate Email (OAuth)</div>
                <div className="muted" style={{ fontSize: "0.75rem", marginTop: 2 }}>Analyze inbox for phishing</div>
              </div>
              <div className={`toggleSwitch ${intEmail ? "on" : ""}`} onClick={handleOAuth} />
            </div>
            
            <div className={`integrationRow ${intSms ? "enabled" : ""}`}>
              <div>
                <div style={{ fontWeight: 600 }}>Work SMS / Messages</div>
                <div className="muted" style={{ fontSize: "0.75rem", marginTop: 2 }}>Monitor text messages for smishing</div>
              </div>
              <div className={`toggleSwitch ${intSms ? "on" : ""}`} onClick={() => toggleIntegration("sms", intSms, setIntSms)} />
            </div>

            <div className={`integrationRow ${intVoice ? "enabled" : ""}`}>
              <div>
                <div style={{ fontWeight: 600 }}>VoIP & Call Recordings</div>
                <div className="muted" style={{ fontSize: "0.75rem", marginTop: 2 }}>Analyze voice transcripts for vishing</div>
              </div>
              <div className={`toggleSwitch ${intVoice ? "on" : ""}`} onClick={() => toggleIntegration("voice", intVoice, setIntVoice)} />
            </div>

            <div className="statLabel" style={{ marginTop: 20, marginBottom: 8, paddingLeft: 8 }}>Endpoint Telemetry (Work Laptop)</div>
            
            <div className={`integrationRow ${intProcess ? "enabled" : ""}`}>
              <div>
                <div style={{ fontWeight: 600 }}>System Process Logs</div>
                <div className="muted" style={{ fontSize: "0.75rem", marginTop: 2 }}>Track running software</div>
              </div>
              <div className={`toggleSwitch ${intProcess ? "on" : ""}`} onClick={() => toggleIntegration("process", intProcess, setIntProcess)} />
            </div>

            <div className={`integrationRow ${intUsb ? "enabled" : ""}`}>
              <div>
                <div style={{ fontWeight: 600 }}>USB & Peripheral History</div>
                <div className="muted" style={{ fontSize: "0.75rem", marginTop: 2 }}>Detect unauthorized mass storage</div>
              </div>
              <div className={`toggleSwitch ${intUsb ? "on" : ""}`} onClick={() => toggleIntegration("usb", intUsb, setIntUsb)} />
            </div>

            <div className={`integrationRow ${intNetwork ? "enabled" : ""}`}>
              <div>
                <div style={{ fontWeight: 600 }}>Network & VPN Logs</div>
                <div className="muted" style={{ fontSize: "0.75rem", marginTop: 2 }}>Check for anomalous IP connections</div>
              </div>
              <div className={`toggleSwitch ${intNetwork ? "on" : ""}`} onClick={() => toggleIntegration("network", intNetwork, setIntNetwork)} />
            </div>
          </div>

          <button 
            className="buttonPrimary" 
            style={{ width: "100%", justifyContent: "center", marginTop: 24 }}
            disabled={!intEmail && !intSms && !intVoice && !intProcess && !intUsb && !intNetwork}
            onClick={() => setStep("analyzing")}
          >
            Start Device Analysis
          </button>
        </div>
      )}

      {/* ── AI ANALYSIS STEP ── */}
      {step === "analyzing" && (
        <div className="loginCard fadeIn" style={{ margin: "auto" }}>
          <div className="holdingScreen">
            <div className="aiRing" style={{ margin: "0 auto 24px" }}>
              <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%" }}>
                <circle className="bg" cx="60" cy="60" r="54" fill="none" strokeWidth="6" />
                <circle 
                  className="progress" 
                  cx="60" 
                  cy="60" 
                  r="54" 
                  fill="none" 
                  strokeWidth="6" 
                  style={{ strokeDashoffset: 339 - (aiProgress / 100) * 339 }}
                />
              </svg>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.2rem", color: "var(--accent)" }}>
                {Math.round(aiProgress)}%
              </div>
            </div>
            <h3>Analyzing baseline data</h3>
            <p className="muted" style={{ marginTop: 8 }}>Scanning historical communications...</p>
          </div>
        </div>
      )}

      {/* ── PREMIUM LIQUID GLASS VIEWVIEWFINDER MODAL ── */}
      {showCameraPopup && (
        <div className="liquid-glass-backdrop">
          <div className="liquid-glass-popup">
            <div className="liquid-glow-1" />
            <div className="liquid-glow-2" />
            
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "1.3rem", color: "var(--accent)", fontFamily: "var(--font-serif)" }}>
                  Biometric Scanner
                </h3>
                <button 
                  onClick={() => setShowCameraPopup(false)}
                  style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1.2rem" }}
                >
                  ✕
                </button>
              </div>
              
              <p className="muted" style={{ fontSize: "0.85rem", margin: 0, lineHeight: 1.5 }}>
                Ensure your face is centered. Zero-Trust requires active presence validation.
              </p>
              
              <div className="cameraContainer" style={{ margin: 0, position: "relative", border: "1px solid rgba(212, 180, 113, 0.2)" }}>
                <video ref={videoRef} autoPlay playsInline muted className="videoFeed" />
                <div className="scanningOverlay" />
                <div className={`cameraFlash ${isFlashing ? "active" : ""}`} />
                
                {!stream && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#050b12" }}>
                    <span className="muted" style={{ fontSize: "0.85rem" }}>Initializing security feed...</span>
                  </div>
                )}
              </div>

              {location ? (
                <div style={{ fontSize: "0.75rem", color: "var(--success)", display: "flex", gap: "6px", alignItems: "center" }}>
                  <div className="locPulse" style={{ width: 6, height: 6 }} />
                  <span>GPS Secured: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
                </div>
              ) : (
                <div style={{ fontSize: "0.75rem", color: "var(--warning)" }}>
                  ⚠️ Waiting for GPS lock... Camera capture disabled.
                </div>
              )}

              <div style={{ display: "flex", gap: "12px", marginTop: 8 }}>
                <button
                  className="buttonSecondary"
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={() => setShowCameraPopup(false)}
                >
                  Cancel
                </button>
                <button
                  className="buttonPrimary"
                  style={{ flex: 2, justifyContent: "center" }}
                  onClick={handleCapture}
                  disabled={!stream || !location}
                >
                  Confirm & Capture
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTOM INJECTED CSS FOR LIQUID GLASS EFFECTS ── */}
      <style>{`
        .liquid-glass-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(5, 11, 18, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          animation: fadeIn 300ms ease-out;
        }
        .liquid-glass-popup {
          width: 90%;
          max-width: 460px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.15);
          padding: 28px;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .liquid-glow-1 {
          position: absolute;
          top: -20%;
          left: -20%;
          width: 70%;
          height: 70%;
          background: radial-gradient(circle, rgba(212, 180, 113, 0.15) 0%, transparent 70%);
          filter: blur(40px);
          pointer-events: none;
          z-index: 0;
        }
        .liquid-glow-2 {
          position: absolute;
          bottom: -20%;
          right: -20%;
          width: 70%;
          height: 70%;
          background: radial-gradient(circle, rgba(141, 208, 194, 0.12) 0%, transparent 70%);
          filter: blur(40px);
          pointer-events: none;
          z-index: 0;
        }
      `}</style>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}
```

---

## 4. Middleware Route Protection

### Target File: `frontend/middleware.ts`

### Requirements
- `/onboarding` must be accessible WITHOUT the `emp_session` cookie.
- `/dashboard` (and `/api/employee`) must remain protected.

### Proposed Changes
In the current middleware code, the check for `pathname.startsWith('/onboarding')` redirects the user to `/login` if `emp_session` is missing. We will split this block so that `/onboarding` is excluded from the cookie check.

```typescript
// BEFORE:
// Employee routes
if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding') || pathname.startsWith('/api/employee')) {
  const hasEmpSession = request.cookies.has('emp_session');
  if (!hasEmpSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

// AFTER:
// Employee routes
if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/employee')) {
  const hasEmpSession = request.cookies.has('emp_session');
  if (!hasEmpSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

// /onboarding is now bypass-allowed and proceeds to render directly
if (pathname.startsWith('/onboarding')) {
  return NextResponse.next();
}
```

This ensures:
1. Users who just signed up/verified OTP are allowed to load `/onboarding`.
2. Users who are currently on the onboarding page are allowed to interact with `/api/auth/request` and `/api/auth/request/${requestId}` (both are public under `/api/auth` prefix).
3. If they attempt to access `/dashboard` or telemetry routes, the middleware redirects them to `/login` until `/api/auth/session/issue` successfully sets the cookie.
