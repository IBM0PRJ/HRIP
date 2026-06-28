import { NextResponse } from "next/server";
import prisma from "../../../../lib/db";
import { getEmployeeFromRequest } from "../../../../lib/session";

export async function GET(request: Request) {
  try {
    const employee = await getEmployeeFromRequest();
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get session to check active integrations
    const session = await prisma.session.findUnique({
      where: { email: employee.email }
    });

    return NextResponse.json({
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        riskScore: employee.riskScore,
      },
      session: session ? {
        state: session.state,
        integrations: {
          email: session.intEmail,
          sms: session.intSms,
          voice: session.intVoice,
          process: session.intProcess,
          usb: session.intUsb,
          network: session.intNetwork,
          files: session.intFiles,
          clipboard: session.intClipboard
        }
      } : null
    });
  } catch (error) {
    console.error("Employee profile error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
