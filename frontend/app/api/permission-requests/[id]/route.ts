import { NextResponse } from "next/server";
import prisma from "../../../../lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { action } = body; // "approve" or "deny"

    if (action !== "approve" && action !== "deny") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const permissionRequest = await prisma.permissionRequest.findUnique({
      where: { id: params.id }
    });

    if (!permissionRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const newStatus = action === "approve" ? "APPROVED" : "DENIED";

    await prisma.permissionRequest.update({
      where: { id: params.id },
      data: { status: newStatus }
    });

    if (newStatus === "APPROVED") {
      // Find the session and update the permission
      const session = await prisma.session.findUnique({
        where: { email: permissionRequest.employeeEmail }
      });

      if (session) {
        await prisma.session.update({
          where: { id: session.id },
          data: {
            [permissionRequest.permissionKey]: true
          }
        });

        // Log the change
        await prisma.telemetryLog.create({
          data: {
            sessionId: session.id,
            message: `[System] Integration '${permissionRequest.permissionKey.replace("int", "").toLowerCase()}' approved by employee.`
          }
        });
      }

      // DEMO MAGIC: Automatically spawn the Python native agent locally when employee approves
      try {
        const { spawn, exec } = require('child_process');
        const path = require('path');
        const agentDir = path.join(process.cwd(), '..', 'agent');
        
        console.log("Cleaning up old Python agent instances...");
        exec('taskkill /F /IM python.exe', (err: any) => {
          // Ignore errors (like "no process found")
          console.log("Spawning new Python agent in background at:", agentDir);
          // We use detached: true to let it run in the background
          const pyProcess = spawn('python', ['agent.py'], {
            cwd: agentDir,
            detached: true,
            stdio: 'ignore'
          });
          pyProcess.unref(); // Detach the process so Node doesn't wait for it
        });
      } catch (err) {
        console.error("Failed to auto-spawn agent:", err);
      }
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error("PATCH permission-requests error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
