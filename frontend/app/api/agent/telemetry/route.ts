import { NextResponse } from "next/server";
import prisma from "../../../../lib/db";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    const agentToken = await prisma.agentToken.findUnique({
      where: { token }
    });

    if (!agentToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const employeeEmail = agentToken.employeeEmail;

    const employee = await prisma.employee.findUnique({
      where: { email: employeeEmail }
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const body = await req.json();
    const { events } = body;

    if (!events || !Array.isArray(events)) {
      return NextResponse.json({ error: "Invalid payload: events array required" }, { status: 400 });
    }

    let riskScoreIncrease = 0;
    const dbEvents = [];
    const alertsToCreate = [];

    for (const event of events) {
      const category = event.category;
      const dataStr = JSON.stringify(event.data);
      let flagged = false;
      let riskLevel = "low";
      let alertTitle = null;
      let alertDesc = null;

      // Risk Engine
      if (category === "process") {
        if (event.data.isAfterHours && event.data.activeWindow?.toLowerCase().includes("game")) {
          flagged = true; riskLevel = "medium"; riskScoreIncrease += 3;
          alertTitle = "After Hours Gaming"; alertDesc = "Employee playing games after hours.";
        }
        const suspiciousProcesses = ["anydesk", "teamviewer", "ngrok"];
        const hasSuspicious = event.data.processes?.some((p: any) => suspiciousProcesses.some(sp => p.name.toLowerCase().includes(sp)));
        if (hasSuspicious) {
          flagged = true; riskLevel = "high"; riskScoreIncrease += 15;
          alertTitle = "Remote Access Tool Detected"; alertDesc = "Unauthorized remote access tool found running.";
        }
      } else if (category === "usb") {
        flagged = true; riskLevel = "medium"; riskScoreIncrease += 5;
        alertTitle = "USB Device Connected"; alertDesc = `USB Storage Connected: ${event.data.device}`;
      } else if (category === "network") {
        if (event.data.isVpnSuspected) {
          flagged = true; riskLevel = "high"; riskScoreIncrease += 10;
          alertTitle = "VPN or Proxy Detected"; alertDesc = `Suspicious IP connection: ${event.data.ip}`;
        }
      } else if (category === "files") {
        if (event.data.flaggedNames && event.data.flaggedNames.length > 0) {
          flagged = true; riskLevel = "medium"; riskScoreIncrease += 8;
          alertTitle = "Sensitive Files Scanned"; alertDesc = `Found ${event.data.flaggedNames.length} sensitive files.`;
        }
      } else if (category === "clipboard") {
        if (event.data.patternMatched === "credit_card" || event.data.patternMatched === "api_key") {
          flagged = true; riskLevel = "critical"; riskScoreIncrease += 12;
          alertTitle = "Sensitive Data Copied"; alertDesc = `Pattern matched: ${event.data.patternMatched}`;
        }
      }

      dbEvents.push({
        employeeEmail,
        category,
        data: dataStr,
        flagged,
        riskLevel: flagged ? riskLevel : null,
        alertCreated: !!alertTitle
      });

      if (alertTitle) {
        alertsToCreate.push({
          employeeId: employee.id,
          type: category === "usb" ? "usb_alert" : category === "files" || category === "clipboard" ? "data_exfil" : "suspicious_login",
          severity: riskLevel,
          title: alertTitle,
          description: alertDesc
        });
      }
    }

    if (dbEvents.length > 0) {
      await prisma.telemetryEvent.createMany({ data: dbEvents });
    }

    if (alertsToCreate.length > 0) {
      await prisma.employeeAlert.createMany({ data: alertsToCreate });
    }

    if (riskScoreIncrease > 0) {
      await prisma.employee.update({
        where: { id: employee.id },
        data: { riskScore: { increment: riskScoreIncrease } }
      });
    }

    return NextResponse.json({ success: true, processed: events.length });
  } catch (error) {
    console.error("Telemetry error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
