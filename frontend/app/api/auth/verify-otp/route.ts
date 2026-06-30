import { NextResponse } from "next/server";
import prisma from "../../../../lib/db";
import { setEmployeeCookie, setAnalystCookie } from "../../../../lib/session";

export async function POST(request: Request) {
  try {
    const { email, code, purpose } = await request.json();

    if (!email || !code || !purpose) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    // Find the latest valid OTP
    const otpRecord = await prisma.oTPCode.findFirst({
      where: {
        email: normalizedEmail,
        code,
        purpose,
        used: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: "desc" }
    });

    if (!otpRecord) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    // Mark OTP as used
    await prisma.oTPCode.update({
      where: { id: otpRecord.id },
      data: { used: true }
    });

    if (purpose === "employee_signup") {
      const employee = await prisma.employee.findUnique({ where: { email: normalizedEmail } });
      if (employee) {
        await prisma.employee.update({
          where: { id: employee.id },
          data: { isVerified: true }
        });
        // Zero-Trust: redirect to onboarding, no cookie yet
        return NextResponse.json({
          success: true,
          redirectTo: `/onboarding?email=${encodeURIComponent(normalizedEmail)}&name=${encodeURIComponent(employee.name)}&dept=${encodeURIComponent(employee.department)}`
        });
      }
    } else if (purpose === "analyst_login") {
      // OTP confirmed — now issue the analyst session cookie
      const analyst = await prisma.analyst.findUnique({ where: { email: normalizedEmail } });
      if (!analyst) {
        return NextResponse.json({ error: "Analyst account not found" }, { status: 404 });
      }
      const res = NextResponse.json({ success: true, redirectTo: "/analyst" });
      return setAnalystCookie(res, {
        id: analyst.id,
        email: analyst.email,
        name: analyst.name
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 });
  }
}
