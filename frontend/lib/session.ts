import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT, createJWT } from "./auth";
import prisma from "./db";

export async function getEmployeeFromRequest() {
  const cookieStore = cookies();
  const token = cookieStore.get("emp_session")?.value;
  
  if (!token) return null;
  
  const payload = verifyJWT(token);
  if (!payload || !payload.id) return null;
  
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: payload.id }
    });
    
    if (!employee) return null;

    const session = await prisma.session.findUnique({
      where: { email: employee.email }
    });

    if (!session || session.state !== "active") {
      return null;
    }

    return employee;
  } catch (e) {
    return null;
  }
}

export async function getAnalystFromRequest() {
  const cookieStore = cookies();
  const token = cookieStore.get("analyst_session")?.value;
  
  if (!token) return null;
  
  // Backwards compatibility with the fake boolean cookie during transition
  if (token === "true") {
    // If it's the old fake cookie, maybe we just mock it for a second, but realistically we should clear it
    return null; 
  }
  
  const payload = verifyJWT(token);
  if (!payload || !payload.id) return null;
  
  try {
    const analyst = await prisma.analyst.findUnique({
      where: { id: payload.id }
    });
    return analyst;
  } catch (e) {
    return null;
  }
}

export function setEmployeeCookie(response: NextResponse, employee: { id: string; email: string; name: string }) {
  const token = createJWT({ id: employee.id, email: employee.email, name: employee.name, role: "employee" });
  response.cookies.set("emp_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 // 7 days
  });
  return response;
}

export function setAnalystCookie(response: NextResponse, analyst: { id: string; email: string; name: string }) {
  const token = createJWT({ id: analyst.id, email: analyst.email, name: analyst.name, role: "analyst" });
  response.cookies.set("analyst_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 // 7 days
  });
  return response;
}
