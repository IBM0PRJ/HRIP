import { NextResponse } from "next/server";
import prisma from "../../../../lib/db";
import { getAnalystFromRequest } from "../../../../lib/session";
import { sendApprovalEmail } from "../../../../lib/email";

export async function POST(request: Request) {
  try {
    const analyst = await getAnalystFromRequest();
    if (!analyst) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, id, action } = await request.json(); // type: "employee" | "analyst", action: "approve" | "deny"

    if (!type || !id || !action) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    let targetEmail = "";

    if (type === "employee") {
      const target = await prisma.employee.findUnique({ where: { id } });
      if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
      targetEmail = target.email;
      
      if (action === "approve") {
        await prisma.employee.update({
          where: { id },
          data: { isVerified: true }
        });
      } else {
        await prisma.employee.delete({ where: { id } });
      }
    } else if (type === "analyst") {
      const target = await prisma.analyst.findUnique({ where: { id } });
      if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
      targetEmail = target.email;

      if (action === "approve") {
        await prisma.analyst.update({
          where: { id },
          data: { isApproved: true, approvedBy: analyst.email }
        });
      } else {
        await prisma.analyst.delete({ where: { id } });
      }
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // Send email notification
    await sendApprovalEmail(targetEmail, type as "employee" | "analyst", action as "approve" | "deny");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analyst approve signup POST error:", error);
    return NextResponse.json({ error: "Failed to process approval" }, { status: 500 });
  }
}
