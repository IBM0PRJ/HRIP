import { NextResponse } from "next/server";
import prisma from "../../../lib/db";

// GET: Employee polls for pending requests
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const requests = await prisma.permissionRequest.findMany({
      where: {
        employeeEmail: email.toLowerCase(),
        status: "PENDING"
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("GET permission-requests error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Analyst creates a new permission request
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeeEmail, permissionKey, reason } = body;

    if (!employeeEmail || !permissionKey || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const request = await prisma.permissionRequest.create({
      data: {
        employeeEmail: employeeEmail.toLowerCase(),
        permissionKey,
        reason,
        status: "PENDING"
      }
    });

    return NextResponse.json({ success: true, request });
  } catch (error) {
    console.error("POST permission-requests error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
