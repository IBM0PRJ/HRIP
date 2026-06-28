"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

type Step = "camera" | "holding" | "integrations" | "analyzing" | "dashboard";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "employee@company.com";
  const name = searchParams.get("name") || "Unknown Employee";
  const dept = searchParams.get("dept") || "General";
  // If returning from OAuth, jump straight to integrations
  const initialStep = searchParams.get("step") as Step || "camera";
  
  const [step, setStep] = useState<Step>(initialStep);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<{lat: number, lng: number, formatted: string} | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  
  // Integrations state
  const [intEmail, setIntEmail] = useState(initialStep === "integrations"); // Assume email is true if returning from OAuth
  const [intSms, setIntSms] = useState(false);
  const [intVoice, setIntVoice] = useState(false);
  
  // V2 Endpoint Permissions
  const [intProcess, setIntProcess] = useState(false);
  const [intUsb, setIntUsb] = useState(false);
  const [intNetwork, setIntNetwork] = useState(false);
  const [intFiles, setIntFiles] = useState(false);
  const [intClipboard, setIntClipboard] = useState(false);
  
  const [aiProgress, setAiProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isCameraPopupOpen, setIsCameraPopupOpen] = useState(false);

  // Helper function to acquire geolocation
  const getGeolocation = (): Promise<{lat: number, lng: number, formatted: string}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const msg = "Geolocation is not supported by this browser.";
        setGeoError(msg);
        reject(new Error(msg));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            formatted: `Coordinates: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
          };
          setLocation(loc);
          setGeoError(null);
          resolve(loc);
        },
        (error) => {
          let msg = "Failed to acquire location coordinates.";
          if (error.code === error.PERMISSION_DENIED) {
            msg = "Geolocation permission was denied. You must allow location access to proceed.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = "Location information is unavailable.";
          } else if (error.code === error.TIMEOUT) {
            msg = "The request to get user location timed out.";
          }
          setGeoError(msg);
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  // Fetch Geolocation on mount/step change
  useEffect(() => {
    if (step === "camera") {
      getGeolocation().catch(() => {});
    }
  }, [step]);

  // Handle camera stream based on popup status
  useEffect(() => {
    if (step === "camera" && isCameraPopupOpen) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((s) => {
          setStream(s);
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch((err) => {
          console.error("Camera access failed:", err);
        });
    } else {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        setStream(null);
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [step, isCameraPopupOpen]);

  // Handle capture and send to backend
  const handleCapture = async () => {
    if (!videoRef.current) return;

    // Enforce geolocation permission / presence
    if (!location) {
      setGeoError("Geolocation coordinates are missing. Submission blocked.");
      setIsCameraPopupOpen(false);
      return;
    }

    // Flash animation
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 400);

    // Capture photo from video to canvas (scaled down to avoid 413 Payload Too Large)
    const canvas = document.createElement("canvas");
    const scale = 0.5; // Scale down by 50%
    canvas.width = videoRef.current.videoWidth * scale;
    canvas.height = videoRef.current.videoHeight * scale;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const photoData = canvas.toDataURL("image/jpeg", 0.7);
    setPhoto(photoData);

    // Close camera popup
    setIsCameraPopupOpen(false);

    // Detect basic device type from User Agent
    let detectedDevice = "Unknown Device";
    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes("windows")) detectedDevice = "Windows PC";
      else if (ua.includes("mac")) detectedDevice = "MacBook / macOS";
      else if (ua.includes("linux")) detectedDevice = "Linux PC";
      else if (ua.includes("android")) detectedDevice = "Android Device";
      else if (ua.includes("iphone") || ua.includes("ipad")) detectedDevice = "iOS Device";
    }

    // Send request to API
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
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      setRequestId(data.id);
      setStep("holding");
    } catch (e) {
      console.error(e);
      alert("Failed to submit request. Check console for details.");
    }
  };

  // Poll for approval status
  useEffect(() => {
    if (step === "holding" && requestId) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/auth/request/${requestId}`);
          const data = await res.json();
          if (data.status === "approved") {
            // Obtain cookie from new session issue endpoint
            const issueRes = await fetch("/api/auth/session/issue", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ requestId })
            });
            if (issueRes.ok) {
              setStep("integrations");
            } else {
              console.error("Failed to issue session cookie");
            }
          } else if (data.status === "denied") {
            router.push("/login?error=denied");
          }
        } catch (e) {}
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [step, requestId, router, email]);

  const toggleIntegration = async (name: string, currentVal: boolean, setter: (val: boolean) => void) => {
    const newVal = !currentVal;
    setter(newVal); // Optimistic UI update
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
      setter(currentVal); // Revert on failure
    }
  };

  // OAuth Trigger
  const handleOAuth = () => {
    if (intEmail) {
      toggleIntegration("email", intEmail, setIntEmail);
      return;
    }
    // Genuine Google OAuth Redirect
    signIn("google", { callbackUrl: `/onboarding?step=integrations&email=${encodeURIComponent(email)}` });
  };

  // Simulated AI analysis progress
  useEffect(() => {
    if (step === "analyzing") {
      let prog = 0;
      const interval = setInterval(() => {
        prog += 2;
        setAiProgress(Math.min(prog, 100));
        if (prog >= 100) {
          clearInterval(interval);
          setTimeout(() => router.push("/dashboard"), 500);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [step]);

  return (
    <div className="loginContainer" style={{ padding: 40, alignItems: "flex-start", overflowY: "auto" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: 10%; }
          50% { top: 90%; }
          100% { top: 10%; }
        }
        .liquid-glass-popup {
          animation: popupFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes popupFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
      `}} />

      {/* ── STEP 1: CAMERA & LOCATION ── */}
      {step === "camera" && (
        <div className="loginCard fadeIn delay0" style={{ margin: "0 auto", maxWidth: "460px" }}>
          <h2 style={{ textAlign: "center", marginBottom: 8 }}>Identity Verification</h2>
          <p className="muted" style={{ textAlign: "center", marginBottom: 24, fontSize: "0.85rem" }}>
            Zero-Trust policy requires live biometric and location verification.
          </p>

          <div style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "24px"
          }}>
            <h4 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>📍</span> Geolocation Telemetry
            </h4>

            {location ? (
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: "var(--success)",
                  boxShadow: "0 0 8px var(--success)"
                }} />
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--success)" }}>Location Verified</div>
                  <div className="muted" style={{ fontSize: "0.75rem", marginTop: "2px" }}>
                    {location.formatted}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    backgroundColor: geoError ? "var(--error)" : "var(--warning)",
                    boxShadow: geoError ? "0 0 8px var(--error)" : "0 0 8px var(--warning)",
                    animation: geoError ? "none" : "pulse 1.5s infinite"
                  }} />
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                      {geoError ? "Location Blocked" : "Acquiring Coordinates..."}
                    </div>
                    <div className="muted" style={{ fontSize: "0.75rem", marginTop: "2px" }}>
                      {geoError || "Awaiting GPS signal authorization..."}
                    </div>
                  </div>
                </div>

                {geoError && (
                  <div style={{
                    marginTop: "16px",
                    padding: "12px",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    color: "#f87171"
                  }}>
                    <strong>Access Blocked:</strong> {geoError}
                  </div>
                )}
              </div>
            )}
          </div>

          {!location ? (
            <button 
              className="buttonPrimary" 
              style={{ width: "100%", justifyContent: "center" }}
              onClick={getGeolocation}
            >
              Authorize Geolocation & Verify
            </button>
          ) : (
            <button 
              className="buttonPrimary" 
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => setIsCameraPopupOpen(true)}
            >
              Verify Biometrics (Open Camera)
            </button>
          )}

          {/* Liquid Glass Viewfinder Popup */}
          {isCameraPopupOpen && (
            <div style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
            }} className="liquid-glass-popup">
              <div style={{
                width: "90%",
                maxWidth: "460px",
                background: "rgba(255, 255, 255, 0.07)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "24px",
                padding: "32px",
                backdropFilter: "blur(25px)",
                WebkitBackdropFilter: "blur(25px)",
                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                color: "#fff"
              }}>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "8px", background: "linear-gradient(to right, #fff, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Biometric Verification
                </h3>
                <p className="muted" style={{ fontSize: "0.85rem", marginBottom: "20px", color: "rgba(255,255,255,0.7)" }}>
                  Please center your face inside the viewfinder for validation.
                </p>

                {/* Centered Circular Viewfinder */}
                <div style={{
                  position: "relative",
                  width: "280px",
                  height: "280px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "3px solid rgba(255, 255, 255, 0.3)",
                  boxShadow: "0 0 30px rgba(99, 102, 241, 0.2)",
                  background: "#0d0e15",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center"
                }}>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transform: "scaleX(-1)"
                    }} 
                  />
                  
                  {/* Dotted Face Centering Guide */}
                  <div style={{
                    position: "absolute",
                    top: "12%",
                    left: "18%",
                    right: "18%",
                    bottom: "12%",
                    border: "2px dashed rgba(255, 255, 255, 0.5)",
                    borderRadius: "50% / 60%",
                    pointerEvents: "none",
                    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.4)"
                  }} />
                  
                  {/* Animated Scanning Line */}
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: "linear-gradient(to right, transparent, #6366f1, transparent)",
                    animation: "scan 4s infinite ease-in-out",
                    boxShadow: "0 0 10px #6366f1",
                    pointerEvents: "none"
                  }} />

                  {/* Camera Flash */}
                  <div className={`cameraFlash ${isFlashing ? "active" : ""}`} />

                  {!stream && (
                    <div style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#0d0e15",
                      color: "rgba(255,255,255,0.6)",
                      fontSize: "0.9rem"
                    }}>
                      <div className="spinner" style={{ marginBottom: "12px" }} />
                      <span>Initializing Camera...</span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "12px", width: "100%", marginTop: "28px" }}>
                  <button 
                    className="buttonSecondary"
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={() => setIsCameraPopupOpen(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="buttonPrimary" 
                    style={{ flex: 2, justifyContent: "center" }}
                    onClick={handleCapture}
                    disabled={!stream || !location}
                  >
                    Capture Selfie
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: HOLDING SCREEN ── */}
      {step === "holding" && (
        <div className="loginCard fadeIn delay0" style={{ margin: "auto", maxWidth: 500, border: "1px solid rgba(99, 102, 241, 0.3)", boxShadow: "0 0 30px rgba(99, 102, 241, 0.15)" }}>
          <div className="holdingScreen" style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
              <div className="spinner" style={{ width: 64, height: 64, border: "3px solid rgba(255,255,255,0.05)", borderTopColor: "var(--accent)" }} />
            </div>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: 16 }}>
              Security Clearance Pending: Analyst Review in Progress
            </h3>
            <p className="muted" style={{ lineHeight: 1.7, fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>
              Your identity request has been securely transmitted. A Security Operations analyst is currently reviewing your live biometric capture and GPS telemetry.
            </p>
            
            <div style={{ 
              marginTop: 32, 
              padding: 16, 
              background: "rgba(255,255,255,0.02)", 
              border: "1px solid rgba(255,255,255,0.05)", 
              borderRadius: 12,
              textAlign: "left"
            }}>
              <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Telemetry Transmission</div>
              <div style={{ fontSize: "0.85rem", color: "var(--success)", display: "flex", alignItems: "center", gap: 8 }}>
                <span className="statusDot" style={{ background: "var(--success)" }} /> Secure GPS: Locked
              </div>
              <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span className="statusDot" style={{ background: "#6366f1" }} /> Selfie Biometrics: Transmitted
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: INTEGRATIONS ── */}
      {step === "integrations" && (
        <div className="loginCard fadeIn delay0" style={{ margin: "auto", maxWidth: 600 }}>
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

            {/* V2 Endpoint Permissions */}
            <div className="statLabel" style={{ marginTop: 20, marginBottom: 8, paddingLeft: 8 }}>Endpoint Telemetry (Work Laptop)</div>
            
            <div className={`integrationRow ${intProcess ? "enabled" : ""}`}>
              <div>
                <div style={{ fontWeight: 600 }}>System Process Logs</div>
                <div className="muted" style={{ fontSize: "0.75rem", marginTop: 2 }}>Track running software & after-hours usage</div>
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

            <div className={`integrationRow ${intFiles ? "enabled" : ""}`}>
              <div>
                <div style={{ fontWeight: 600 }}>Local File System Scanning</div>
                <div className="muted" style={{ fontSize: "0.75rem", marginTop: 2 }}>Scan documents for sensitive keywords</div>
              </div>
              <div className={`toggleSwitch ${intFiles ? "on" : ""}`} onClick={() => toggleIntegration("files", intFiles, setIntFiles)} />
            </div>

            <div className={`integrationRow ${intClipboard ? "enabled" : ""}`}>
              <div>
                <div style={{ fontWeight: 600 }}>Clipboard & Keystroke Monitoring</div>
                <div className="muted" style={{ fontSize: "0.75rem", marginTop: 2 }}>Detect copy/pasting of sensitive data</div>
              </div>
              <div className={`toggleSwitch ${intClipboard ? "on" : ""}`} onClick={() => toggleIntegration("clipboard", intClipboard, setIntClipboard)} />
            </div>
          </div>

          <button 
            className="buttonPrimary" 
            style={{ width: "100%", justifyContent: "center", marginTop: 24 }}
            disabled={!intEmail && !intSms && !intVoice && !intProcess && !intUsb && !intNetwork && !intFiles && !intClipboard}
            onClick={() => setStep("analyzing")}
          >
            Start Device Analysis
          </button>
        </div>
      )}

      {/* ── STEP 4: AI ANALYSIS ── */}
      {step === "analyzing" && (
        <div className="loginCard fadeIn delay0" style={{ margin: "auto" }}>
          <div className="holdingScreen">
            <div className="aiLoader" style={{ position: "relative", width: 160, height: 160, margin: "0 auto 24px auto" }}>
              <svg viewBox="0 0 100 100" className="speedometer" style={{ width: "100%", height: "100%" }}>
                <path className="track" d="M 10,80 A 40,40 0 1,1 90,80" style={{ fill: "none", stroke: "rgba(255,255,255,0.1)", strokeWidth: 8, strokeLinecap: "round" }} />
                <path 
                  className="fill" 
                  d="M 10,80 A 40,40 0 1,1 90,80" 
                  style={{ fill: "none", stroke: "var(--teal, #5eead4)", strokeWidth: 8, strokeLinecap: "round", strokeDasharray: 200, strokeDashoffset: 200 - (aiProgress / 100) * 200, transition: "stroke-dashoffset 0.1s linear" }}
                />
              </svg>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.5rem" }}>
                {Math.round(aiProgress)}%
              </div>
            </div>
            <h3>Analyzing baseline data</h3>
            <p className="muted" style={{ marginTop: 8 }}>Scanning historical communications...</p>
          </div>
        </div>
      )}

      {/* ── STEP 5: FINAL DASHBOARD (Mock) ── */}
      {step === "dashboard" && (
        <div style={{ width: "100%", maxWidth: 1000, margin: "0 auto" }}>
          {/* We will implement Employee Dashboard component next */}
          <EmployeeDashboard email={email} />
        </div>
      )}


    </div>
  );
}

function EmployeeDashboard({ email }: { email: string }) {
  // Check for lockout state periodically
  const [locked, setLocked] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/session/${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data.state === "isolated" || data.state === "reauth_required") {
          setLocked(true);
        } else {
          setLocked(false);
        }

        // Poll for pending log requests
        const logReqRes = await fetch(`/api/log-requests?email=${encodeURIComponent(email)}&status=PENDING`);
        const logReqData = await logReqRes.json();
        if (logReqData.requests && logReqData.requests.length > 0) {
          setPendingRequest(logReqData.requests[0]);
        } else {
          setPendingRequest(null);
        }
      } catch(e) {}
    }, 3000);
    return () => clearInterval(interval);
  }, [email]);

  const handleConsent = async (status: "APPROVED" | "REJECTED") => {
    if (!pendingRequest) return;
    try {
      await fetch(`/api/log-requests/${pendingRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      setPendingRequest(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fadeIn delay0">
      <header style={{ display: "flex", justifyContent: "space-between", marginBottom: 40 }}>
        <div className="brandMark"><span>HRIP</span></div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 600 }}>{email}</div>
          <div className="muted" style={{ fontSize: "0.8rem" }}>Employee Security Portal</div>
        </div>
      </header>

      <div className="grid" style={{ gap: 24 }}>
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <p className="eyebrow">Your Risk Score</p>
          <div style={{ fontSize: "4rem", fontFamily: "var(--font-serif)", fontWeight: 700, margin: "10px 0" }}>
            24 <span style={{ fontSize: "1.5rem", color: "var(--muted)" }}>/100</span>
          </div>
          <span className="badge low">Low Risk</span>
          <p className="muted" style={{ marginTop: 20, maxWidth: 400, margin: "20px auto 0" }}>
            Your device integration is active. The AI is monitoring incoming communications for threats.
          </p>
        </div>

        <div className="card">
          <h3>Assigned Training</h3>
          <div className="emptyState" style={{ padding: "40px 0" }}>
            <div className="emptyStateIcon">🎓</div>
            <p className="muted">You are all caught up! No mandatory training required.</p>
          </div>
        </div>
      </div>

      {/* Consent Modal for Forensic Audit */}
      {pendingRequest && (
        <div className="lockoutOverlay">
          <div className="lockoutModal" style={{ borderColor: "var(--warning)" }}>
            <div className="lockoutIcon" style={{ background: "rgba(226,170,83,0.1)", color: "var(--warning)" }}>🔍</div>
            <h2>Forensic Audit Request</h2>
            <p className="muted" style={{ marginTop: 12, marginBottom: 24 }}>
              Security Operations has requested authorization to extract your device activity logs for the following timeframe:
            </p>
            <div style={{ background: "rgba(255,255,255,0.05)", padding: 16, borderRadius: 8, marginBottom: 24, textAlign: "left" }}>
              <div style={{ marginBottom: 8 }}><strong>Start:</strong> {new Date(pendingRequest.startTime).toLocaleString()}</div>
              <div><strong>End:</strong> {new Date(pendingRequest.endTime).toLocaleString()}</div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="buttonSecondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => handleConsent("REJECTED")}>
                Decline
              </button>
              <button className="buttonPrimary" style={{ flex: 1, justifyContent: "center", background: "var(--success)" }} onClick={() => handleConsent("APPROVED")}>
                Grant Access
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lockout Overlay */}
      {locked && (
        <div className="lockoutOverlay">
          <div className="lockoutModal">
            <div className="lockoutIcon">⚠️</div>
            <h2>Access Revoked</h2>
            <p className="muted" style={{ marginTop: 12, marginBottom: 24 }}>
              Your session has been isolated by Security Operations. 
              Please contact your IT department immediately.
            </p>
            <button className="buttonPrimary" style={{ width: "100%", justifyContent: "center" }} onClick={() => router.push("/login")}>
              Return to Login
            </button>
          </div>
        </div>
      )}
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
