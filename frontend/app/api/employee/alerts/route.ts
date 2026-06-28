import { NextResponse } from "next/server";
import prisma from "../../../../lib/db";
import { getEmployeeFromRequest } from "../../../../lib/session";

export async function GET(request: Request) {
  try {
    const employee = await getEmployeeFromRequest();
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alerts = await prisma.employeeAlert.findMany({
      where: { employeeId: employee.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error("Employee alerts error:", error);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}
