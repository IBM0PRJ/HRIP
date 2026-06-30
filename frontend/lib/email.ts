import nodemailer from "nodemailer";

// ─── Permanent Safety Guard ──────────────────────────────────────────────────
// These domains are used ONLY by the e2e test suite and are never real addresses.
// Block them unconditionally at the module level, completely independent of env
// variables or how the server was started. This is the root-level fix to stop
// Gmail "Delivery Incomplete" bounce-back emails being sent to the developer.
const BLOCKED_TEST_DOMAINS = [
  "@company.com",
  "@example.net",
  "@test.com",
  "@localhost",
];

function isTestEmail(email: string): boolean {
  const lower = email.toLowerCase();
  return BLOCKED_TEST_DOMAINS.some((domain) => lower.endsWith(domain));
}
// ─────────────────────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: process.env.SMTP_USE_TLS === "false", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
  connectionTimeout: 5000,
  socketTimeout: 5000,
  greetingTimeout: 5000,
});

const getFromStr = () => `HRIP Security <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USERNAME}>`;

export async function sendOTPEmail(to: string, code: string, purpose: string): Promise<void> {
  // Block all test/fake domains before touching SMTP
  if (isTestEmail(to)) {
    console.log(`[Email Mock] Blocked test domain. Skipping OTP to ${to}: ${code} (${purpose})`);
    return;
  }

  const isEmployee = purpose === "employee_signup";
  
  const subject = isEmployee 
    ? "Verify your HRIP Employee Account" 
    : "Verify your HRIP Analyst Account";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #081019; color: #ffffff; padding: 40px; border-radius: 8px;">
      <h2 style="color: #d4b471;">HRIP Platform</h2>
      <p style="font-size: 16px; color: #e2e8f0;">Your verification code is:</p>
      <div style="background-color: #1e293b; padding: 20px; text-align: center; border-radius: 8px; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #8dd0c2;">${code}</span>
      </div>
      <p style="font-size: 14px; color: #94a3b8;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
    </div>
  `;

  try {
    if (process.env.SMTP_ENABLED === "false" || process.env.NODE_ENV === "test") {
      console.log(`[Email Mock] Sending OTP to ${to}: ${code} (${purpose})`);
      return;
    }
    await transporter.sendMail({
      from: getFromStr(),
      to: to,
      subject: subject,
      html: html,
    });
  } catch (error: any) {
    console.error("Nodemailer API error:", error);
    throw new Error(`SMTP error: ${error.message}`);
  }
}

export async function sendApprovalEmail(to: string, type: "employee" | "analyst", action: "approve" | "deny"): Promise<void> {
  // Block all test/fake domains before touching SMTP
  if (isTestEmail(to)) {
    console.log(`[Email Mock] Blocked test domain. Skipping approval email to ${to}: type=${type}, action=${action}`);
    return;
  }

  const isApproved = action === "approve";
  const subject = isApproved 
    ? `Your HRIP ${type === "employee" ? "Employee" : "Analyst"} Account is Approved` 
    : `Your HRIP ${type === "employee" ? "Employee" : "Analyst"} Account was Denied`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #081019; color: #ffffff; padding: 40px; border-radius: 8px;">
      <h2 style="color: #d4b471;">HRIP Platform</h2>
      <p style="font-size: 16px; color: #e2e8f0;">
        ${isApproved 
          ? `Good news! Your ${type} account has been approved by a senior analyst. You can now log in to the platform.` 
          : `We're sorry, but your ${type} account request has been denied. Please contact your administrator for more details.`}
      </p>
    </div>
  `;

  try {
    if (process.env.SMTP_ENABLED === "false" || process.env.NODE_ENV === "test") {
      console.log(`[Email Mock] Sending approval email to ${to}: type=${type}, action=${action}`);
      return;
    }
    await transporter.sendMail({
      from: getFromStr(),
      to: to,
      subject: subject,
      html: html,
    });
  } catch (error: any) {
    console.error("Nodemailer API error:", error);
    throw new Error(`SMTP error: ${error.message}`);
  }
}
