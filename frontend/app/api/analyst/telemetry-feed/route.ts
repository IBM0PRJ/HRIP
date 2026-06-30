import { NextResponse } from "next/server";
import prisma from "../../../../lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filterEmail = searchParams.get("email");

    const whereClause: any = {};
    if (filterEmail) {
      whereClause.employeeEmail = filterEmail;
    }

    const events = await prisma.telemetryEvent.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 100
    });

    // We can also fetch employee names to attach them
    const employees = await prisma.employee.findMany();
    const empMap = employees.reduce((acc, emp) => {
      acc[emp.email] = emp.name;
      return acc;
    }, {} as Record<string, string>);

    const formattedEvents = events.map(e => ({
      id: e.id,
      employeeName: empMap[e.employeeEmail] || e.employeeEmail,
      employeeEmail: e.employeeEmail,
      category: e.category,
      data: JSON.parse(e.data),
      flagged: e.flagged,
      riskLevel: e.riskLevel,
      createdAt: e.createdAt
    }));

    return NextResponse.json({ events: formattedEvents });
  } catch (error) {
    console.error("GET telemetry-feed error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
