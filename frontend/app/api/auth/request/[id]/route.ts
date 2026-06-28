import { NextResponse } from "next/server";
import prisma from "../../../../../lib/db";
import { getAnalystFromRequest } from "../../../../../lib/session";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const req = await prisma.accessRequest.findUnique({
    where: { id: params.id }
  });
  
  if (!req) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ status: req.status });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const analyst = await getAnalystFromRequest();
    if (!analyst) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action;
    
    if (action === "approved" || action === "denied") {
      await prisma.accessRequest.update({
        where: { id: params.id },
        data: { status: action }
      });
      
      // If approved, create a session
      if (action === "approved") {
        const reqData = await prisma.accessRequest.findUnique({ where: { id: params.id } });
        if (reqData) {
          await prisma.session.upsert({
            where: { email: reqData.employeeEmail },
            update: { state: "active" },
            create: {
              userId: reqData.employeeEmail,
              email: reqData.employeeEmail,
              state: "active"
            }
          });
        }
      }
      
      return NextResponse.json({ success: true, status: action });
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    console.error("Error updating request:", e);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
