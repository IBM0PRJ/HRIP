import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const gatewayUrl = process.env.FRONTEND_GATEWAY_URL || "http://localhost:8001";
    
    // We should ideally pass the access token, but for now we simulate it or login as admin
    const loginRes = await fetch(`${gatewayUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: process.env.DEFAULT_ADMIN_EMAIL || "admin@example.com", 
        password: process.env.DEFAULT_ADMIN_PASSWORD || "ChangeMe123!" 
      }),
    });
    
    let token = "";
    if (loginRes.ok) {
      const data = await loginRes.json();
      token = data.access_token;
    }

    const usersRes = await fetch(`${gatewayUrl}/api/v1/users`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    });
    let adminId = "00000000-0000-0000-0000-000000000000";
    if (usersRes.ok) {
       const users = await usersRes.json();
       const admin = users.find((u: any) => u.email === (process.env.DEFAULT_ADMIN_EMAIL || "admin@example.com"));
       if (admin) adminId = admin.id;
    }

    const riskUrl = process.env.RISK_SERVICE_URL || "http://risk:8004";
    const res = await fetch(`${riskUrl}/api/v1/risk/override`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        user_id: body.user_id,
        new_score: body.new_score,
        reason: body.reason,
        analyst_id: adminId
      })
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    } else {
      const error = await res.json();
      return NextResponse.json({ detail: error.detail }, { status: res.status });
    }
  } catch (error) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
