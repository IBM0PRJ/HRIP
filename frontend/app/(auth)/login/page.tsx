"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"employee" | "analyst" | null>(null);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Analyst OTP step
  const [analystStep, setAnalystStep] = useState<"credentials" | "otp">("credentials");
  const [otpCode, setOtpCode] = useState("");
  const [analystEmail, setAnalystEmail] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setIsLoading(false);
        return;
      }

      // Analyst: switch to OTP step
      if (data.step === "otp") {
        setAnalystEmail(data.email);
        setAnalystStep("otp");
        setIsLoading(false);
        return;
      }

      router.push(data.redirectTo);
    } catch {
      setError("An error occurred during login");
      setIsLoading(false);
    }
  };

  const handleAnalystOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: analystEmail, code: otpCode, purpose: "analyst_login" })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid OTP");
        setIsLoading(false);
        return;
      }

      router.push(data.redirectTo || "/");
    } catch {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="loginContainer">
      <div className="loginCard">
        <div className="loginHeader">
          <div className="brandMark" style={{ margin: "0 auto 16px" }}>
            <span>HRIP</span>
          </div>
          <h2>Human Risk Intelligence</h2>
          <p className="muted" style={{ marginTop: 8 }}>
            {!role ? "Please select your role to continue" : 
             role === "analyst" && analystStep === "otp" ? "Two-Factor Authentication" :
             "Secure sign in"}
          </p>
        </div>

        {/* ── Role Selection ── */}
        {!role ? (
          <div className="roleSelection">
            <button className="roleCard" onClick={() => { setRole("employee"); setError(null); }}>
              <div className="roleIcon">👤</div>
              <h3>Employee Portal</h3>
              <p className="muted">Device integration and training</p>
            </button>

            <button className="roleCard accent" onClick={() => { setRole("analyst"); setError(null); }}>
              <div className="roleIcon">🛡️</div>
              <h3>Security Operations</h3>
              <p className="muted">Analyst dashboard and triage</p>
            </button>
          </div>

        /* ── Analyst: OTP Step ── */
        ) : role === "analyst" && analystStep === "otp" ? (
          <form className="loginForm fadeIn delay0" onSubmit={handleAnalystOtp}>
            <div style={{
              background: "rgba(141,208,194,0.08)",
              border: "1px solid rgba(141,208,194,0.2)",
              borderRadius: 14, padding: "16px 20px",
              marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 12
            }}>
              <span style={{ fontSize: "1.3rem" }}>✉️</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 4 }}>
                  Verification code sent
                </div>
                <p className="muted" style={{ fontSize: "0.82rem" }}>
                  A 6-digit code was sent to <strong style={{ color: "var(--accent)" }}>{analystEmail}</strong>.
                  Check your inbox and enter it below.
                </p>
              </div>
            </div>

            {error && <div className="errorText" style={{ marginBottom: 16 }}>{error}</div>}

            <div className="inputGroup">
              <label>6-Digit Security Code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="• • • • • •"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                required
                style={{ letterSpacing: "0.3em", fontSize: "1.3rem", textAlign: "center" }}
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="buttonPrimary"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={isLoading || otpCode.length !== 6}
            >
              {isLoading ? "Verifying..." : "Verify & Access Console →"}
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
              <button
                type="button"
                className="textButton"
                onClick={() => { setAnalystStep("credentials"); setOtpCode(""); setError(null); }}
              >
                ← Back to credentials
              </button>
              <button
                type="button"
                className="textButton"
                onClick={() => handleLogin({ preventDefault: () => {} } as any)}
                style={{ color: "var(--accent)" }}
              >
                Resend code
              </button>
            </div>
          </form>

        /* ── Analyst: Credentials Step ── */
        ) : role === "analyst" ? (
          <form className="loginForm fadeIn delay0" onSubmit={handleLogin}>
            <h3>Analyst Sign In</h3>
            <p className="muted" style={{ fontSize: "0.85rem", marginBottom: 20 }}>
              A verification code will be sent to your email after credentials are confirmed.
            </p>
            {error && <div className="errorText" style={{ marginBottom: 16 }}>{error}</div>}
            <div className="inputGroup">
              <label>Email Address</label>
              <input type="email" placeholder="analyst@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="inputGroup">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button
              type="submit"
              className="buttonPrimary"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Continue →"}
            </button>

            <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 16 }}>
              <button type="button" className="textButton" onClick={() => setRole(null)}>
                ← Back
              </button>
            </div>

            <div style={{
              marginTop: 20, padding: "12px 16px",
              background: "rgba(255,255,255,0.02)", borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.06)"
            }}>
              <p className="muted" style={{ fontSize: "0.78rem", textAlign: "center" }}>
                🔒 Analyst accounts are provisioned by administrators only.
              </p>
            </div>
          </form>

        /* ── Employee: Credentials Step ── */
        ) : (
          <form className="loginForm fadeIn delay0" onSubmit={handleLogin}>
            <h3>Employee Sign In</h3>
            <p className="muted" style={{ fontSize: "0.85rem", marginBottom: 20 }}>
              Zero-Trust onboarding requires live device verification.
            </p>
            {error && <div className="errorText" style={{ marginBottom: 16 }}>{error}</div>}
            <div className="inputGroup">
              <label>Work Email</label>
              <input type="email" placeholder="sarah.j@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="inputGroup">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button
              type="submit"
              className="buttonPrimary"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Continue to Verification →"}
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
              <button type="button" className="textButton" onClick={() => setRole(null)}>
                ← Back
              </button>
              <Link href="/signup/employee" className="textLink" style={{ fontSize: "0.9rem" }}>
                Create Account →
              </Link>
            </div>
          </form>
        )}
      </div>

      {/* Decorative blobs */}
      <div className="glowBlob" style={{ top: "-20%", left: "-10%", background: "var(--accent)", opacity: 0.15 }} />
      <div className="glowBlob" style={{ bottom: "-20%", right: "-10%", background: "var(--danger)", opacity: 0.1 }} />
    </div>
  );
}
