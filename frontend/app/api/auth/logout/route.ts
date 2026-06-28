import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });
  // Clear both cookies just in case
  res.cookies.delete("emp_session");
  res.cookies.delete("analyst_session");
  return res;
}
