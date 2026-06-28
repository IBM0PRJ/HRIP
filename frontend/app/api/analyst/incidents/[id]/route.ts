import { NextResponse } from "next/server";
import prisma from "../../../../../lib/db";
import { getAnalystFromRequest } from "../../../../../lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const analyst = await getAnalystFromRequest();
    if (!analyst) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status, analystNote } = await request.json();

    const incident = await prisma.incidentReport.update({
      where: { id: params.id },
      data: { status, analystNote }
    });

    // Recalculate risk score on resolution or false positive
    if (status === "resolved" || status === "false_positive") {
      const emp = await prisma.employee.findUnique({ where: { id: incident.employeeId } });
      if (emp) {
        await prisma.employee.update({
          where: { id: emp.id },
          data: { riskScore: Math.max(0, emp.riskScore - 15.0) }
        });
      }
    }

    return NextResponse.json({ success: true, incident });
  } catch (error) {
    console.error("Analyst incident update PATCH error:", error);
    return NextResponse.json({ error: "Failed to update incident" }, { status: 500 });
  }
}
