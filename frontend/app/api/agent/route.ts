import { NextResponse } from "next/server";
import prisma from "../../../lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body.email?.toLowerCase();
    const { logs } = body;

    if (!email || !logs || !Array.isArray(logs)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    let session = await prisma.session.findUnique({
      where: { email: email }
    });

    if (!session) {
      // Auto-create a session for testing if it doesn't exist yet
      session = await prisma.session.create({
        data: {
          userId: email,
          email: email,
          state: "active",
          intProcess: true,
          intNetwork: true,
          intClipboard: true,
          intUsb: true,
          intFiles: true
        }
      });
    }

    // Map log types to DB integration fields
    const integrationMap: Record<string, keyof typeof session> = {
      "process": "intProcess",
      "network": "intNetwork",
      "clipboard": "intClipboard",
      "usb": "intUsb",
      "files": "intFiles"
    };

    const validLogsToInsert = [];

    for (const log of logs) {
      // Historical logs are always accepted for a comprehensive security audit
      if (log.type === "history") {
        validLogsToInsert.push({
          sessionId: session.id,
          message: log.message,
          ...(log.timestamp && { createdAt: new Date(log.timestamp) })
        });
        continue;
      }

      // Live logs are only accepted if the corresponding UI toggle is turned ON and session is not isolated
      const dbField = integrationMap[log.type];
      if (dbField && session[dbField] === true && session.state !== "isolated") {
        validLogsToInsert.push({
          sessionId: session.id,
          message: log.message,
          ...(log.timestamp && { createdAt: new Date(log.timestamp) })
        });
      }
    }

    if (validLogsToInsert.length > 0) {
      await prisma.telemetryLog.createMany({
        data: validLogsToInsert
      });
    }

    return NextResponse.json({ success: true, inserted: validLogsToInsert.length });
  } catch (e) {
    console.error("Agent Receiver Error:", e);
    return NextResponse.json({ error: "Failed to process agent payload" }, { status: 500 });
  }
}
