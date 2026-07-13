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
  const [showPassword, setShowPassword] = useState(false);
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

      router.push(data.redirectTo || "/analyst");
    } catch {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="glassLoginContainer">
      {/* Ambient Orbs */}
      <div className="glassOrb glassOrb--tl" />
      <div className="glassOrb glassOrb--br" />

      {/* Main Glass Card */}
      <div className="glassLoginCard">

        {/* Logo Badge */}
        <div className="glassLogoBadge">
          <span>HRIP</span>
        </div>

        {/* Header */}
        <div className="glassLoginHeader">
          <h2 className="glassLoginTitle">Human Risk Intelligence</h2>
          <p className="glassLoginSubtitle">
            {!role
              ? "Please select your role to continue"
              : role === "analyst" && analystStep === "otp"
              ? "Two-Factor Authentication"
              : role === "analyst"
              ? "Security Operations Sign In"
              : "Employee Sign In"}
          </p>
        </div>

        {/* Role Selection */}
        {!role ? (
          <div className="glassRoleList">
            <button
              className="glassRoleCard"
              onClick={() => { setRole("employee"); setError(null); }}
            >
              <div className="glassRoleIconWrap glassRoleIconWrap--purple">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div className="glassRoleText">
                <span className="glassRoleLabel">Employee Portal</span>
                <span className="glassRoleDesc">Device integration and training</span>
              </div>
              <span className="glassRoleChevron">&#8250;</span>
            </button>

            <button
              className="glassRoleCard"
              onClick={() => { setRole("analyst"); setError(null); }}
            >
              <div className="glassRoleIconWrap glassRoleIconWrap--blue">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
              </div>
              <div className="glassRoleText">
                <span className="glassRoleLabel">Security Operations</span>
                <span className="glassRoleDesc">Analyst dashboard and triage</span>
              </div>
              <span className="glassRoleChevron">&#8250;</span>
            </button>
          </div>

        ) : role === "analyst" && analystStep === "otp" ? (
          /* Analyst OTP Step */
          <form className="glassForm fadeIn delay0" onSubmit={handleAnalystOtp}>
            <div className="glassOtpBanner">
              <span className="glassOtpBannerIcon">&#9993;</span>
              <div>
                <div className="glassOtpBannerTitle">Verification code sent</div>
                <p className="glassOtpBannerText">
                  A 6-digit code was sent to{" "}
                  <strong style={{ color: "var(--accent-2)" }}>{analystEmail}</strong>.
                  Check your inbox.
                </p>
              </div>
            </div>

            {error && <div className="glassErrorText">{error}</div>}

            <div className="glassInputGroup">
              <label className="glassLabel">6-Digit Security Code</label>
              <input
                className="glassInput glassInput--analyst"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="&bull; &bull; &bull; &bull; &bull; &bull;"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                required
                style={{ letterSpacing: "0.35em", fontSize: "1.4rem", textAlign: "center" }}
                autoFocus
              />
            </div>

            <button type="submit" className="glassSubmitBtn glassSubmitBtn--analyst"
              disabled={isLoading || otpCode.length !== 6}>
              {isLoading ? "Verifying…" : "Verify & Access Console →"}
            </button>

            <div className="glassFormFooter">
              <button type="button" className="glassTextBtn"
                onClick={() => { setAnalystStep("credentials"); setOtpCode(""); setError(null); }}>
                ← Back
              </button>
              <button type="button" className="glassTextBtn glassTextBtn--accent"
                onClick={() => handleLogin({ preventDefault: () => {} } as React.FormEvent)}>
                Resend code
              </button>
            </div>
          </form>

        ) : role === "analyst" ? (
          /* Analyst Credentials Step */
          <form className="glassForm fadeIn delay0" onSubmit={handleLogin}>
            <p className="glassFormNote">
              A verification code will be sent to your email after credentials are confirmed.
            </p>
            {error && <div className="glassErrorText">{error}</div>}
            <div className="glassInputGroup">
              <label className="glassLabel">Email Address</label>
              <input className="glassInput glassInput--analyst" type="email"
                placeholder="analyst@company.com" value={email}
                onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="glassInputGroup">
              <label className="glassLabel">Password</label>
              <div style={{ position: "relative" }}>
                <input className="glassInput glassInput--analyst" type={showPassword ? "text" : "password"}
                  placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: "4px" }} title={showPassword ? "Hide password" : "Show password"}>{showPassword ? "👁️‍🗨️" : "👁️"}</button>
              </div>
            </div>
            <button type="submit" className="glassSubmitBtn glassSubmitBtn--analyst"
              disabled={isLoading}>
              {isLoading ? "Verifying…" : "Continue →"}
            </button>
            <div className="glassFormFooter">
              <button type="button" className="glassTextBtn" onClick={() => setRole(null)}>
                ← Back
              </button>
            </div>
            <div className="glassAdminNote">
              &#128274; Analyst accounts are provisioned by administrators only.
            </div>
          </form>

        ) : (
          /* Employee Credentials Step */
          <form className="glassForm fadeIn delay0" onSubmit={handleLogin}>
            <p className="glassFormNote">
              Zero-Trust onboarding requires live device verification.
            </p>
            {error && <div className="glassErrorText">{error}</div>}
            <div className="glassInputGroup">
              <label className="glassLabel">Work Email</label>
              <input className="glassInput glassInput--employee" type="email"
                placeholder="sarah.j@company.com" value={email}
                onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="glassInputGroup">
              <label className="glassLabel">Password</label>
              <div style={{ position: "relative" }}>
                <input className="glassInput glassInput--employee" type={showPassword ? "text" : "password"}
                  placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: "4px" }} title={showPassword ? "Hide password" : "Show password"}>{showPassword ? "👁️‍🗨️" : "👁️"}</button>
              </div>
            </div>
            <button type="submit" className="glassSubmitBtn glassSubmitBtn--employee"
              disabled={isLoading}>
              {isLoading ? "Signing In…" : "Continue to Verification →"}
            </button>
            <div className="glassFormFooter">
              <button type="button" className="glassTextBtn" onClick={() => setRole(null)}>
                ← Back
              </button>
              <Link href="/signup/employee" className="glassTextBtn glassTextBtn--accent">
                Create Account →
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
