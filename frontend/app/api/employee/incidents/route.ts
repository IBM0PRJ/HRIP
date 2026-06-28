import { NextResponse } from "next/server";
import prisma from "../../../../lib/db";
import { getEmployeeFromRequest } from "../../../../lib/session";

export async function GET(request: Request) {
  try {
    const employee = await getEmployeeFromRequest();
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const incidents = await prisma.incidentReport.findMany({
      where: { employeeId: employee.id },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ incidents });
  } catch (error) {
    console.error("Employee incidents GET error:", error);
    return NextResponse.json({ error: "Failed to fetch incidents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const employee = await getEmployeeFromRequest();
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { senderEmail, subject, description } = await request.json();

    const incident = await prisma.incidentReport.create({
      data: {
        employeeId: employee.id,
        senderEmail,
        subject,
        description,
        status: "pending_review"
      }
    });

    // Create an alert for the analyst to see
    await prisma.employeeAlert.create({
      data: {
        employeeId: employee.id,
        type: "phishing_detected",
        severity: "medium", // Default for user-reported
        title: "Employee Reported Suspicious Email",
        description: `Subject: ${subject}\nSender: ${senderEmail}\n\n${description}`,
        isRead: false
      }
    });

    // Increase risk score when reporting an incident
    await prisma.employee.update({
      where: { id: employee.id },
      data: { riskScore: Math.min(100, employee.riskScore + 15.0) }
    });

    return NextResponse.json({ success: true, incident });
  } catch (error) {
    console.error("Employee incidents POST error:", error);
    return NextResponse.json({ error: "Failed to create incident report" }, { status: 500 });
  }
}
