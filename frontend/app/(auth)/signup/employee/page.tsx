"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EmployeeSignupPage() {
  const router = useRouter();
  
  const [step, setStep] = useState(1); // 1 = info, 2 = otp
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
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
      const res = await fetch("/api/auth/signup/employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, department, password })
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
        body: JSON.stringify({ email, code: otp, purpose: "employee_signup" })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed");
        setIsLoading(false);
        return;
      }

      router.push(data.redirectTo);
    } catch (err) {
      setError("An error occurred during verification");
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
        <div className="glassLoginHeader">
          <div className="glassLogoBadge">
            <span>HRIP</span>
          </div>
          <h2 className="glassLoginTitle">Create Employee Account</h2>
          <p className="glassLoginSubtitle">
            Join the Human Risk Intelligence Platform
          </p>
        </div>

        {step === 1 ? (
          <form className="glassForm fadeIn delay0" onSubmit={handleSignup}>
            {error && <div className="glassErrorText">{error}</div>}
            
            <div className="glassInputGroup">
              <label className="glassLabel">Full Name</label>
              <input 
                type="text" 
                className="glassInput glassInput--employee"
                placeholder="Sarah Jones" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
            
            <div className="glassInputGroup">
              <label className="glassLabel">Work Email</label>
              <input 
                type="email" 
                className="glassInput glassInput--employee"
                placeholder="sarah.j@company.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            
            <div className="glassInputGroup">
              <label className="glassLabel">Department</label>
              <input 
                type="text" 
                className="glassInput glassInput--employee"
                placeholder="Engineering" 
                value={department} 
                onChange={(e) => setDepartment(e.target.value)} 
                required 
              />
            </div>
            
            <div className="glassInputGroup">
              <label className="glassLabel">Password</label>
              <div style={{ position: "relative" }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="glassInput glassInput--employee"
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
            
            <button type="submit" className="glassSubmitBtn glassSubmitBtn--employee" style={{ marginTop: "12px" }} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Account"}
            </button>
            
            <div className="glassFormFooter">
              <div style={{ flex: 1 }} />
              <Link href="/login" className="glassTextBtn glassTextBtn--accent">
                Already have an account? Sign in →
              </Link>
            </div>
          </form>
        ) : (
          <form className="glassForm fadeIn delay0" onSubmit={handleVerifyOTP}>
            <div className="glassOtpBanner">
              <span className="glassOtpBannerIcon">&#9993;</span>
              <div>
                <div className="glassOtpBannerTitle">Verification code sent</div>
                <div className="glassOtpBannerText">
                  We've sent a 6-digit verification code to <strong style={{ color: "var(--accent-2)" }}>{email}</strong>
                </div>
              </div>
            </div>
            
            {error && <div className="glassErrorText">{error}</div>}
            
            <div className="glassInputGroup" style={{ marginTop: "16px" }}>
              <label className="glassLabel" style={{ textAlign: "center" }}>6-Digit Security Code</label>
              <input 
                type="text" 
                inputMode="numeric"
                className="glassInput glassInput--employee"
                placeholder="&bull; &bull; &bull; &bull; &bull; &bull;" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                style={{ textAlign: "center", letterSpacing: "0.35em", fontSize: "1.4rem", fontWeight: "600", padding: "16px" }}
                autoFocus
                required 
              />
            </div>
            
            <button type="submit" className="glassSubmitBtn glassSubmitBtn--employee" style={{ marginTop: "12px" }} disabled={isLoading || otp.length !== 6}>
              {isLoading ? "Verifying..." : "Verify & Continue →"}
            </button>
            
            <div className="glassFormFooter">
              <button type="button" className="glassTextBtn" onClick={() => setStep(1)}>
                ← Use a different email
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
