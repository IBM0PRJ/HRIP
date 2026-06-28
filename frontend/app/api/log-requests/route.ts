import { NextResponse } from "next/server";
import prisma from "../../../lib/db";

// GET /api/log-requests?email=...
// Fetches pending requests for the employee portal
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.toLowerCase();
  const status = searchParams.get("status");

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const whereClause: any = { email };
  if (status) {
    whereClause.status = status;
  }

  try {
    const requests = await prisma.logRequest.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Fetch LogRequests Error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/log-requests
// Called by Analyst Dashboard to create a new request
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, startTime, endTime } = body;

    if (!email || !startTime || !endTime) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const logRequest = await prisma.logRequest.create({
      data: {
        email: email.toLowerCase(),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, request: logRequest });
  } catch (error) {
    console.error("Create LogRequest Error:", error);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}
