import { NextResponse } from "next/server";
import prisma from "../../../../lib/db";
import { publishToStream, REDIS_STREAMS } from "../../../../lib/redis";
import { randomUUID } from "crypto";

/**
 * Maps a telemetry category to the correct Redis stream name
 * and builds the event payload matching the Pydantic contract
 * that the hrip-triage service expects.
 */
function buildTriageEvent(
  category: string,
  eventData: any,
  employeeEmail: string
): { stream: string; payload: Record<string, unknown> } | null {
  const now = new Date().toISOString();
  const eventId = randomUUID();

  switch (category) {
    case "usb":
      return {
        stream: REDIS_STREAMS.USB,
        payload: {
          event_id: eventId,
          username: employeeEmail,
          device_name: eventData.device || "Unknown USB Device",
          vid_pid: eventData.vid_pid || null,
          action: eventData.event || "connected",
          file_size_bytes: eventData.file_size_bytes || null,
          timestamp: now,
        },
      };

    case "network":
      return {
        stream: REDIS_STREAMS.NETWORK,
        payload: {
          event_id: eventId,
          username: employeeEmail,
          ip_address: eventData.ip || null,
          status: eventData.isVpnSuspected ? "vpn_detected" : "normal",
          reason: eventData.connectionType || null,
          timestamp: now,
        },
      };

    case "files":
      // Build a file access event for each flagged file, or one summary event
      return {
        stream: REDIS_STREAMS.FILE_ACCESS,
        payload: {
          event_id: eventId,
          username: employeeEmail,
          file_path: eventData.scanPath || "~/Documents",
          action:
            eventData.flaggedNames?.length > 0
              ? "mass_download"
              : "read",
          timestamp: now,
        },
      };

    case "clipboard":
      return {
        stream: REDIS_STREAMS.CLIPBOARD,
        payload: {
          event_id: eventId,
          username: employeeEmail,
          content_type: eventData.patternMatched === "general" ? "text" : "credential_pattern",
          size_bytes: eventData.preview?.length || 0,
          patterns_detected: eventData.patternMatched !== "general" ? [eventData.patternMatched] : [],
          source_app: null,
          dest_app: null,
          timestamp: now,
        },
      };

    default:
      return null;
  }
}

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
    let aiTriageCount = 0;

    for (const event of events) {
      const category = event.category;
      const dataStr = JSON.stringify(event.data);
      let flagged = false;
      let riskLevel = "low";
      let alertTitle = null;
      let alertDesc = null;

      // ─── Existing hardcoded Risk Engine (kept for backward compat) ───
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
        // ─── Deduplication: skip if identical unread alert exists within last 60 minutes ───
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const alertType = category === "usb" ? "usb_alert" : category === "files" || category === "clipboard" ? "data_exfil" : "suspicious_login";
        const existingAlert = await prisma.employeeAlert.findFirst({
          where: {
            employeeId: employee.id,
            type: alertType,
            title: alertTitle,
            isRead: false,
            createdAt: { gte: oneHourAgo }
          }
        });
        if (!existingAlert) {
          alertsToCreate.push({
            employeeId: employee.id,
            type: alertType,
            severity: riskLevel,
            title: alertTitle,
            description: alertDesc
          });
        } else {
          // Don't add to risk score if alert was deduplicated
          riskScoreIncrease = Math.max(0, riskScoreIncrease - (riskLevel === "critical" ? 12 : riskLevel === "high" ? (category === "process" ? 15 : 10) : riskLevel === "medium" ? (category === "usb" ? 5 : 8) : 3));
        }
      }

      // ─── NEW: Publish to Redis Stream for AI Triage (Qwen) ───
      const triageEvent = buildTriageEvent(category, event.data, employeeEmail);
      if (triageEvent) {
        const published = await publishToStream(triageEvent.stream, triageEvent.payload);
        if (published) aiTriageCount++;
      }
    }

    if (dbEvents.length > 0) {
      await prisma.telemetryEvent.createMany({ data: dbEvents });
    }

    if (alertsToCreate.length > 0) {
      await prisma.employeeAlert.createMany({ data: alertsToCreate });
    }

    if (riskScoreIncrease > 0) {
      // ─── CRITICAL FIX: Cap risk score at 100, never use raw increment ───
      const newScore = Math.min(100, Math.max(0, employee.riskScore + riskScoreIncrease));
      await prisma.employee.update({
        where: { id: employee.id },
        data: { riskScore: newScore }
      });
    }

    return NextResponse.json({
      success: true,
      processed: events.length,
      ai_triage_queued: aiTriageCount,
    });
  } catch (error) {
    console.error("Telemetry error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
