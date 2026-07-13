import { NextResponse } from "next/server";
import prisma from "../../../../lib/db";
import { getAnalystFromRequest } from "../../../../lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const analyst = await getAnalystFromRequest();
    if (!analyst) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const incidents = await prisma.incidentReport.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        employee: { select: { name: true, email: true, department: true } }
      }
    });

    return NextResponse.json({ incidents });
  } catch (error) {
    console.error("Analyst incidents GET error:", error);
    return NextResponse.json({ error: "Failed to fetch incidents" }, { status: 500 });
  }
}
