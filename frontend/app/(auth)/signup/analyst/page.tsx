"use client";

import { useState } from "react";
import Link from "next/link";

export default function AnalystSignupPage() {
  const [step, setStep] = useState(1); // 1 = info, 2 = otp, 3 = pending
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
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
    <div className="loginContainer">
      <div className="loginCard">
        <div className="loginHeader">
          <div className="brandMark" style={{ margin: "0 auto 16px" }}>
            <span>HRIP</span>
          </div>
          <h2>Analyst Application</h2>
          <p className="muted" style={{ marginTop: 8 }}>
            Apply for Security Operations access
          </p>
        </div>

        {step === 1 && (
          <form className="loginForm fadeIn delay0" onSubmit={handleSignup}>
            {error && <div className="errorText" style={{ marginBottom: 16 }}>{error}</div>}
            
            <div className="inputGroup">
              <label>Full Name</label>
              <input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            
            <div className="inputGroup">
              <label>Work Email</label>
              <input type="email" placeholder="analyst@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            
            <div className="inputGroup">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            
            <button type="submit" className="buttonPrimary" style={{ width: "100%", justifyContent: "center" }} disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit Application"}
            </button>
            
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link href="/login" className="textLink" style={{ fontSize: '0.9rem' }}>
                Already have an account? Sign in
              </Link>
            </div>
          </form>
        )}

        {step === 2 && (
          <form className="loginForm fadeIn delay0" onSubmit={handleVerifyOTP}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div className="roleIcon" style={{ margin: "0 auto 16px" }}>✉️</div>
              <h3>Verify your email</h3>
              <p className="muted" style={{ fontSize: "0.85rem", marginTop: 8 }}>
                We've sent a 6-digit verification code to<br />
                <strong style={{ color: "#fff" }}>{email}</strong>
              </p>
            </div>
            
            {error && <div className="errorText" style={{ marginBottom: 16 }}>{error}</div>}
            
            <div className="inputGroup">
              <label>Verification Code</label>
              <input 
                type="text" 
                placeholder="123456" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                style={{ textAlign: "center", letterSpacing: "4px", fontSize: "1.2rem" }}
                required 
              />
            </div>
            
            <button type="submit" className="buttonPrimary" style={{ width: "100%", justifyContent: "center" }} disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify Email"}
            </button>
            
            <button type="button" className="textButton" style={{ marginTop: 16, width: "100%", justifyContent: "center" }} onClick={() => setStep(1)}>
              Use a different email
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="loginForm fadeIn delay0" style={{ textAlign: "center" }}>
            <div className="roleIcon" style={{ margin: "0 auto 24px", background: "rgba(225, 179, 107, 0.1)", color: "var(--warning)", border: "1px solid rgba(225, 179, 107, 0.2)" }}>
              ⏳
            </div>
            <h3 style={{ marginBottom: 12 }}>Application Under Review</h3>
            <p className="muted" style={{ fontSize: "0.95rem", lineHeight: 1.6, marginBottom: 24 }}>
              Your email has been verified. Your application for Analyst access is now pending approval by a Senior Analyst.
            </p>
            <p className="muted" style={{ fontSize: "0.85rem", marginBottom: 24 }}>
              You will receive an email once your account has been reviewed.
            </p>
            
            <Link href="/login" className="buttonSecondary" style={{ width: "100%", justifyContent: "center" }}>
              Return to Login
            </Link>
          </div>
        )}
      </div>

      <div className="glowBlob" style={{ top: "-20%", left: "-10%", background: "var(--accent)", opacity: 0.15 }} />
      <div className="glowBlob" style={{ bottom: "-20%", right: "-10%", background: "var(--danger)", opacity: 0.1 }} />
    </div>
  );
}
