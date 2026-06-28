import { NextResponse } from "next/server";

import { getMessageTracking } from "../../../../../lib/api";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const payload = await getMessageTracking(params.id);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
