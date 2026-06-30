import { NextResponse } from "next/server";
import prisma from "../../../../lib/db";

export async function GET(req: Request) {
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

    // Update last seen
    await prisma.agentToken.update({
      where: { token },
      data: { lastSeenAt: new Date() }
    });

    const session = await prisma.session.findUnique({
      where: { email: agentToken.employeeEmail }
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Return the active permissions
    return NextResponse.json({
      success: true,
      permissions: {
        intProcess: session.intProcess,
        intUsb: session.intUsb,
        intNetwork: session.intNetwork,
        intFiles: session.intFiles,
        intClipboard: session.intClipboard
      }
    });
  } catch (error) {
    console.error("Config error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
