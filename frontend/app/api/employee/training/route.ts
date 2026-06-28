import { NextResponse } from "next/server";
import prisma from "../../../../lib/db";
import { getEmployeeFromRequest } from "../../../../lib/session";

export async function GET(request: Request) {
  try {
    const employee = await getEmployeeFromRequest();
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const modules = await prisma.trainingModule.findMany();
    const progress = await prisma.trainingProgress.findMany({
      where: { employeeId: employee.id }
    });

    return NextResponse.json({ modules, progress });
  } catch (error) {
    console.error("Employee training GET error:", error);
    return NextResponse.json({ error: "Failed to fetch training" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const employee = await getEmployeeFromRequest();
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { moduleId, score } = await request.json();

    const module = await prisma.trainingModule.findUnique({ where: { id: moduleId } });
    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    const progress = await prisma.trainingProgress.upsert({
      where: {
        employeeId_moduleId: {
          employeeId: employee.id,
          moduleId: module.id
        }
      },
      update: { score, completedAt: new Date() },
      create: {
        employeeId: employee.id,
        moduleId: module.id,
        score
      }
    });

    // Reduce risk score if passed
    if (score >= module.passMark) {
      await prisma.employee.update({
        where: { id: employee.id },
        data: { riskScore: Math.max(0, employee.riskScore - 2) } // reduce by 2 points
      });
    }

    return NextResponse.json({ success: true, progress });
  } catch (error) {
    console.error("Employee training POST error:", error);
    return NextResponse.json({ error: "Failed to save training progress" }, { status: 500 });
  }
}
