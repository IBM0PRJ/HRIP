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
      where: { isVerified: false },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, department: true, createdAt: true }
    });

    const analysts = await prisma.analyst.findMany({
      where: { isApproved: false },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, createdAt: true }
    });

    return NextResponse.json({ employees, analysts });
  } catch (error) {
    console.error("Analyst pending signups GET error:", error);
    return NextResponse.json({ error: "Failed to fetch pending signups" }, { status: 500 });
  }
}
