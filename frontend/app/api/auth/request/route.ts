import { NextResponse } from "next/server";
import prisma from "../../../../lib/db";
import { getAnalystFromRequest } from "../../../../lib/session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Create new AccessRequest in SQLite
    const newReq = await prisma.accessRequest.create({
      data: {
        employeeName: body.employeeName,
        employeeEmail: body.employeeEmail,
        department: body.department,
        photoUrl: body.photoUrl,
        lat: body.location?.lat || 0,
        lng: body.location?.lng || 0,
        locationName: body.location?.formatted || "Unknown",
        deviceType: body.deviceType || "Unknown Device",
        status: "pending",
      }
    });
    
    return NextResponse.json({ id: newReq.id, status: newReq.status });
  } catch (e) {
    console.error("Access Request Error:", e);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}


export async function GET() {
  const analyst = await getAnalystFromRequest();
  if (!analyst) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Return all pending requests for the analyst queue
  const requests = await prisma.accessRequest.findMany({
    where: { status: "pending" }
  });
  
  const mappedRequests = requests.map(req => ({
    ...req,
    location: {
      lat: req.lat,
      lng: req.lng,
      formatted: req.locationName
    }
  }));

  return NextResponse.json(mappedRequests);
}
