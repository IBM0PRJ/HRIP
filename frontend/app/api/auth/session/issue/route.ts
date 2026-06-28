import { NextResponse } from "next/server";
import prisma from "../../../../../lib/db";
import { setEmployeeCookie } from "../../../../../lib/session";

export async function POST(request: Request) {
  try {
    const { requestId } = await request.json();
    if (!requestId) {
      return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
    }

    // Check AccessRequest in the SQLite DB
    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id: requestId }
    });

    if (!accessRequest) {
      return NextResponse.json({ error: "Access request not found" }, { status: 404 });
    }

    if (accessRequest.status !== "approved") {
      return NextResponse.json({ error: "Access request is not approved" }, { status: 403 });
    }

    // Fetch corresponding employee by email
    const employee = await prisma.employee.findUnique({
      where: { email: accessRequest.employeeEmail }
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Issue the emp_session cookie using setEmployeeCookie
    let response: NextResponse<any> = NextResponse.json({ success: true, redirectTo: "/dashboard" });
    response = setEmployeeCookie(response, {
      id: employee.id,
      email: employee.email,
      name: employee.name
    });

    return response;
  } catch (error) {
    console.error("Session issue error:", error);
    return NextResponse.json({ error: "Failed to issue session" }, { status: 500 });
  }
}
