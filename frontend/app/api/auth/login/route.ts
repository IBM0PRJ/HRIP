import { NextResponse } from "next/server";
import prisma from "../../../../lib/db";
import { verifyPassword } from "../../../../lib/auth";
import { setAnalystCookie } from "../../../../lib/session";
import { generateOTP } from "../../../../lib/auth";
import { sendOTPEmail } from "../../../../lib/email";

export async function POST(request: Request) {
  try {
    const { email, password, role } = await request.json();

    if (!email || !password || !role) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    if (role === "employee") {
      const employee = await prisma.employee.findUnique({ where: { email: normalizedEmail } });
      if (!employee) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      const isValid = await verifyPassword(password, employee.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      if (!employee.isVerified) {
        return NextResponse.json({ error: "Account not verified" }, { status: 403 });
      }

      // Employee does NOT get a cookie here — goes through Zero-Trust onboarding
      const redirectTo = `/onboarding?email=${encodeURIComponent(employee.email)}&name=${encodeURIComponent(employee.name)}&dept=${encodeURIComponent(employee.department)}`;
      return NextResponse.json({ success: true, redirectTo });

    } else if (role === "analyst") {
      const analyst = await prisma.analyst.findUnique({ where: { email: normalizedEmail } });
      if (!analyst) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      const isValid = await verifyPassword(password, analyst.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      if (!analyst.isApproved) {
        return NextResponse.json({ error: "Account not approved. Contact your administrator." }, { status: 403 });
      }

      // Generate OTP and send via email — do NOT issue cookie yet
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Invalidate any previous unused OTPs for this analyst
      await prisma.oTPCode.updateMany({
        where: { email: normalizedEmail, purpose: "analyst_login", used: false },
        data: { used: true }
      });

      await prisma.oTPCode.create({
        data: { email: normalizedEmail, code: otp, purpose: "analyst_login", expiresAt }
      });

      try {
        await sendOTPEmail(normalizedEmail, otp, "analyst_login");
      } catch (emailErr) {
        console.error("OTP email failed:", emailErr);
        return NextResponse.json({ error: "Failed to send OTP email. Check SMTP configuration." }, { status: 500 });
      }

      // Signal frontend to show OTP step
      return NextResponse.json({ success: true, step: "otp", email: normalizedEmail });
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Failed to process login" }, { status: 500 });
  }
}
