import { NextResponse } from "next/server";

export async function GET() {
  try {
    const gatewayUrl = process.env.FRONTEND_GATEWAY_URL || "http://localhost:8001";
    
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

    const res = await fetch(`${gatewayUrl}/api/v1/training/modules`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
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
