import { NextRequest, NextResponse } from "next/server";

import { updateAlertStatus } from "../../../../lib/api";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = await request.json();
    const updated = await updateAlertStatus(params.id, payload.status);
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
