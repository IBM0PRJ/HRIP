import { NextResponse } from "next/server";
import prisma from "../../../lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, integration, status } = body;

    // Find the session for this email
    const session = await prisma.session.findUnique({
      where: { email: email }
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Map integration names to DB fields
    const fieldMap: Record<string, keyof typeof session> = {
      "process": "intProcess",
      "usb": "intUsb",
      "network": "intNetwork",
      "files": "intFiles",
      "clipboard": "intClipboard",
      "voice": "intVoice",
      "sms": "intSms",
      "email": "intEmail"
    };

    const dbField = fieldMap[integration];
    if (dbField) {
      // Update session integration state
      await prisma.session.update({
        where: { id: session.id },
        data: {
          [dbField]: status
        }
      });
    }

    // Generate a telemetry log message
    let action = status ? "initialized" : "disabled";
    let message = `[System] Integration '${integration}' monitoring ${action}.`;
    
    // Check if body has revokedByAnalyst
    if (body.revokedByAnalyst && status === false) {
        message = `[Analyst] Revoked '${integration}' permission.`;
    }

    const log = await prisma.telemetryLog.create({
      data: {
        sessionId: session.id,
        message: message
      }
    });

    return NextResponse.json({ success: true, log });
  } catch (e) {
    console.error("Telemetry Error:", e);
    return NextResponse.json({ error: "Failed to record telemetry" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    const session = await prisma.session.findUnique({
      where: { email: normalizedEmail },
      include: {
        telemetryLogs: {
          orderBy: { createdAt: 'desc' },
          take: 50 // Limit to recent 50 logs
        }
      }
    });

    if (!session) {
      return NextResponse.json({ logs: [] });
    }

    return NextResponse.json({ logs: session.telemetryLogs });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch telemetry" }, { status: 500 });
  }
}
