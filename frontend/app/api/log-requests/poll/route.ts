import { NextResponse } from "next/server";
import prisma from "../../../../lib/db";

// GET /api/log-requests/poll?email=...
// The background PowerShell agent polls this endpoint to see if there are APPROVED requests
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    // We only want the OLDEST APPROVED request so we process them chronologically
    const request = await prisma.logRequest.findFirst({
      where: { 
        email: email,
        status: "APPROVED"
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ request });
  } catch (error) {
    console.error("Poll LogRequests Error:", error);
    return NextResponse.json({ error: "Failed to poll" }, { status: 500 });
  }
}
