import { NextResponse } from "next/server";
import prisma from "../../../../lib/db";

// PATCH /api/log-requests/[id]
// Updates the status of a log request (e.g. APPROVED, REJECTED)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "Missing status" }, { status: 400 });
    }

    const logRequest = await prisma.logRequest.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json({ success: true, request: logRequest });
  } catch (error) {
    console.error("Update LogRequest Error:", error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}
