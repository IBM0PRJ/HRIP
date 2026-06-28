import { NextResponse } from "next/server";
import prisma from "../../../../../../lib/db";
import { getEmployeeFromRequest } from "../../../../../../lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const employee = await getEmployeeFromRequest();
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alert = await prisma.employeeAlert.findUnique({
      where: { id: params.id }
    });

    if (!alert || alert.employeeId !== employee.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updatedAlert = await prisma.employeeAlert.update({
      where: { id: params.id },
      data: { isRead: true }
    });

    return NextResponse.json({ success: true, alert: updatedAlert });
  } catch (error) {
    console.error("Mark alert read error:", error);
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 });
  }
}
