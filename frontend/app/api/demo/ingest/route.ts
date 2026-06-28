import { NextRequest, NextResponse } from "next/server";

import { getGatewayUrl } from "../../../../lib/api";

const scenarios = {
  email_ceo_fraud: {
    path: "/api/v1/ingest/email",
    buildRequest: () => ({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: "ceo@example.com",
        receiver: "cfo@example.com",
        subject: "Urgent vendor banking update",
        body: "Urgent wire transfer required. Click here to approve the new beneficiary before 4 PM.",
        sender_ip: "185.44.22.10"
      })
    })
  },
  sms_kyc: {
    path: "/api/v1/ingest/sms",
    buildRequest: () => ({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: "TRAI-ALERT",
        receiver: "ops.manager@example.com",
        body: "Your SIM block request starts today. Complete KYC now to avoid deactivation."
      })
    })
  },
  voice_otp: {
    path: "/api/v1/ingest/voice",
    buildRequest: () => {
      const form = new FormData();
      const blob = new Blob(["RIFFFAKEAUDIO"], { type: "audio/wav" });
      form.set("file", blob, "urgent-otp-call.wav");
      form.set("sender", "voice-bot@example.com");
      form.set("receiver", "cfo@example.com");
      return {
        method: "POST",
        body: form
      };
    }
  }
} as const;

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as { scenario?: keyof typeof scenarios };
    const scenario = payload.scenario;
    if (!scenario || !(scenario in scenarios)) {
      return NextResponse.json({ error: "Unsupported scenario" }, { status: 400 });
    }
    const selected = scenarios[scenario];
    const gatewayResponse = await fetch(`${getGatewayUrl()}${selected.path}`, selected.buildRequest());
    const body = await gatewayResponse.text();
    return new NextResponse(body, {
      status: gatewayResponse.status,
      headers: { "Content-Type": gatewayResponse.headers.get("content-type") || "application/json" }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
