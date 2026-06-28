import { NextResponse } from "next/server";
import prisma from "../../../../../lib/db";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  // We use decodeURIComponent because the frontend often passes an email here
  const idOrEmail = decodeURIComponent(params.userId);
  
  let session = await prisma.session.findFirst({
    where: {
      OR: [
        { userId: idOrEmail },
        { email: idOrEmail }
      ]
    }
  });

  if (!session) {
    return NextResponse.json({ state: "active" }); // Default if missing for demo
  }

  return NextResponse.json({ state: session.state });
}

export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const idOrEmail = decodeURIComponent(params.userId);
    const body = await request.json();
    const state = body.state;
    
    if (state === "active" || state === "isolated" || state === "reauth_required") {
      await prisma.session.upsert({
        where: { email: idOrEmail },
        update: { state },
        create: {
          userId: idOrEmail,
          email: idOrEmail,
          state: state,
        }
      });
      return NextResponse.json({ success: true, state });
    }
    
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  } catch (e) {
    console.error("Session Update Error:", e);
    return NextResponse.json({ error: "Failed to update state" }, { status: 500 });
  }
}
