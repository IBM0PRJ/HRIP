"use client";

import { useState } from "react";
import Link from "next/link";

export default function AnalystSignupPage() {
  const [step, setStep] = useState(1); // 1 = info, 2 = otp, 3 = pending
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [otp, setOtp] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/signup/analyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        setIsLoading(false);
        return;
      }

      setStep(2);
      setIsLoading(false);
    } catch (err) {
      setError("An error occurred during signup");
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp, purpose: "analyst_signup" })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed");
        setIsLoading(false);
        return;
      }

      setStep(3); // Pending approval screen
      setIsLoading(false);
    } catch (err) {
      setError("An error occurred during verification");
      setIsLoading(false);
    }
  };

  return (
    <div className="glassLoginContainer">
      {/* Ambient Orbs */}
      <div className="glassOrb glassOrb--tl" style={{ background: "radial-gradient(circle, rgba(59,130,246,0.35) 0%, transparent 60%)" }} />
      <div className="glassOrb glassOrb--br" style={{ background: "radial-gradient(circle, rgba(14,165,233,0.3) 0%, transparent 60%)" }} />

      <div className="glassLoginCard">
        <div className="glassLoginHeader">
          <div className="glassLogoBadge">
            <span>HRIP</span>
          </div>
          <h2 className="glassLoginTitle">Analyst Application</h2>
          <p className="glassLoginSubtitle">
            Apply for Security Operations access
          </p>
        </div>

        {step === 1 && (
          <form className="glassForm fadeIn delay0" onSubmit={handleSignup}>
            {error && <div className="glassErrorText">{error}</div>}
            
            <div className="glassInputGroup">
              <label className="glassLabel">Full Name</label>
              <input 
                type="text" 
                className="glassInput glassInput--analyst"
                placeholder="John Doe" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
            
            <div className="glassInputGroup">
              <label className="glassLabel">Work Email</label>
              <input 
                type="email" 
                className="glassInput glassInput--analyst"
                placeholder="analyst@company.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            
            <div className="glassInputGroup">
              <label className="glassLabel">Password</label>
              <div style={{ position: "relative" }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="glassInput glassInput--analyst"
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.5)",
                    cursor: "pointer",
                    padding: "4px"
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "👁️‍🗨️" : "👁️"}
                </button>
              </div>
            </div>
            
            <button type="submit" className="glassSubmitBtn glassSubmitBtn--analyst" style={{ marginTop: "12px" }} disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit Application"}
            </button>
            
            <div className="glassFormFooter">
              <div style={{ flex: 1 }} />
              <Link href="/login" className="glassTextBtn glassTextBtn--accent">
                Already have an account? Sign in →
              </Link>
            </div>
          </form>
        )}

        {step === 2 && (
          <form className="glassForm fadeIn delay0" onSubmit={handleVerifyOTP}>
            <div className="glassOtpBanner">
              <span className="glassOtpBannerIcon">&#9993;</span>
              <div>
                <div className="glassOtpBannerTitle">Verify your email</div>
                <div className="glassOtpBannerText">
                  We've sent a 6-digit verification code to <strong style={{ color: "var(--accent-2)" }}>{email}</strong>
                </div>
              </div>
            </div>
            
            {error && <div className="glassErrorText">{error}</div>}
            
            <div className="glassInputGroup" style={{ marginTop: "16px" }}>
              <label className="glassLabel" style={{ textAlign: "center" }}>Verification Code</label>
              <input 
                type="text" 
                inputMode="numeric"
                className="glassInput glassInput--analyst"
                placeholder="&bull; &bull; &bull; &bull; &bull; &bull;" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                style={{ textAlign: "center", letterSpacing: "0.35em", fontSize: "1.4rem", fontWeight: "600", padding: "16px" }}
                autoFocus
                required 
              />
            </div>
            
            <button type="submit" className="glassSubmitBtn glassSubmitBtn--analyst" style={{ marginTop: "12px" }} disabled={isLoading || otp.length !== 6}>
              {isLoading ? "Verifying..." : "Verify Email →"}
            </button>
            
            <div className="glassFormFooter">
              <button type="button" className="glassTextBtn" onClick={() => setStep(1)}>
                ← Use a different email
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="glassForm fadeIn delay0" style={{ textAlign: "center", padding: "20px 0" }}>
            <div className="glassLogoBadge" style={{ margin: "0 auto 24px", background: "rgba(59, 130, 246, 0.15)", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
              <span>⏳</span>
            </div>
            <h3 style={{ marginBottom: "12px", color: "#fff", fontSize: "1.2rem", fontWeight: "600" }}>Application Under Review</h3>
            <p className="glassFormNote" style={{ fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "24px" }}>
              Your email has been verified. Your application for Analyst access is now pending approval by a Senior Analyst.
            </p>
            <p className="glassFormNote" style={{ fontSize: "0.85rem", marginBottom: "32px" }}>
              You will receive an email once your account has been reviewed.
            </p>
            
            <Link href="/login" className="glassSubmitBtn glassSubmitBtn--analyst" style={{ display: "block", textDecoration: "none" }}>
              Return to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
