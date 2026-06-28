import { NextResponse } from "next/server";
import prisma from "../../../../../lib/db";
import { hashPassword, generateOTP } from "../../../../../lib/auth";
import { sendOTPEmail } from "../../../../../lib/email";

export async function POST(request: Request) {
  try {
    const { name, email, department, password } = await request.json();
    
    if (!name || !email || !department || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    // Check if email already registered
    const existingEmployee = await prisma.employee.findUnique({ where: { email: normalizedEmail } });
    const passwordHash = await hashPassword(password);

    if (existingEmployee) {
      if (existingEmployee.isVerified) {
        return NextResponse.json({ error: "Email already registered" }, { status: 400 });
      } else {
        // Update the unverified record
        await prisma.employee.update({
          where: { email: normalizedEmail },
          data: {
            name,
            department,
            passwordHash,
          }
        });
      }
    } else {
      // Create new employee record (unverified)
      await prisma.employee.create({
        data: {
          name,
          email: normalizedEmail,
          department,
          passwordHash,
          isVerified: false,
        }
      });
    }

    // Generate and save OTP
    const code = generateOTP();
    await prisma.oTPCode.create({
      data: {
        email: normalizedEmail,
        code,
        purpose: "employee_signup",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 mins
      }
    });

    // Send OTP email
    await sendOTPEmail(normalizedEmail, code, "employee_signup");

    return NextResponse.json({ success: true, message: "OTP sent" });
  } catch (error) {
    console.error("Employee signup error:", error);
    return NextResponse.json({ error: "Failed to process signup" }, { status: 500 });
  }
}
