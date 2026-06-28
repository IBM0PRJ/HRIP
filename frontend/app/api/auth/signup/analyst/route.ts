import { NextResponse } from "next/server";
import prisma from "../../../../../lib/db";
import { hashPassword, generateOTP } from "../../../../../lib/auth";
import { sendOTPEmail } from "../../../../../lib/email";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    // Check if email already registered
    const existingAnalyst = await prisma.analyst.findUnique({ where: { email: normalizedEmail } });
    const passwordHash = await hashPassword(password);

    if (existingAnalyst) {
      if (existingAnalyst.isApproved) {
        return NextResponse.json({ error: "Email already registered" }, { status: 400 });
      } else {
        // Update the unapproved record
        await prisma.analyst.update({
          where: { email: normalizedEmail },
          data: {
            name,
            passwordHash,
          }
        });
      }
    } else {
      // Create analyst record (unapproved)
      await prisma.analyst.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash,
          isApproved: false,
        }
      });
    }

    // Generate and save OTP
    const code = generateOTP();
    await prisma.oTPCode.create({
      data: {
        email: normalizedEmail,
        code,
        purpose: "analyst_signup",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 mins
      }
    });

    // Send OTP email
    await sendOTPEmail(normalizedEmail, code, "analyst_signup");

    return NextResponse.json({ success: true, message: "OTP sent" });
  } catch (error) {
    console.error("Analyst signup error:", error);
    return NextResponse.json({ error: "Failed to process signup" }, { status: 500 });
  }
}
