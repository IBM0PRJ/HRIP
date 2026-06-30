import { NextResponse } from "next/server";
import prisma from "../../../../lib/db";
import { getAnalystFromRequest } from "../../../../lib/session";

export async function GET(request: Request) {
  try {
    const analyst = await getAnalystFromRequest();
    if (!analyst) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { alerts: { where: { resolvedAt: null } } }
        }
      }
    });

    const sessions = await prisma.session.findMany();
    const agentTokens = await prisma.agentToken.findMany();
    
    const formattedEmployees = employees.map(emp => {
      const session = sessions.find(s => s.email === emp.email);
      const hasAgent = agentTokens.some(t => t.employeeEmail === emp.email);
      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        department: emp.department,
        riskScore: emp.riskScore,
        isVerified: emp.isVerified,
        openAlerts: emp._count.alerts,
        sessionState: session?.state || "inactive",
        agentDeployed: hasAgent,
        integrations: session ? {
          email: session.intEmail,
          sms: session.intSms,
          voice: session.intVoice,
          process: session.intProcess,
          usb: session.intUsb,
          network: session.intNetwork,
          files: session.intFiles,
          clipboard: session.intClipboard
        } : null
      };
    });

    return NextResponse.json({ employees: formattedEmployees });
  } catch (error) {
    console.error("Analyst employees GET error:", error);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}
