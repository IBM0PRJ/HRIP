import { NextResponse } from "next/server";
import prisma from "../../../../lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const employeeEmail = email.toLowerCase();

    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { email: employeeEmail }
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Generate a secure API token
    const token = crypto.randomBytes(32).toString("hex");

    // Upsert the token for the employee
    const agentToken = await prisma.agentToken.upsert({
      where: { employeeEmail },
      update: {
        token: token,
        lastSeenAt: new Date()
      },
      create: {
        employeeEmail,
        token: token
      }
    });

    // We also make sure the Session exists for this employee
    await prisma.session.upsert({
      where: { email: employeeEmail },
      update: {},
      create: {
        userId: employee.id,
        email: employeeEmail,
        state: "active"
      }
    });

    // DEMO CONVENIENCE: Write the config.json locally so the agent is ready to run
    const fs = require('fs');
    const path = require('path');
    try {
      const configPath = path.join(process.cwd(), '..', 'agent', 'config.json');
      fs.writeFileSync(configPath, JSON.stringify({
        api_url: "http://localhost:3000",
        api_token: token
      }, null, 2));
    } catch(err) {
      console.log("Could not write config.json:", err);
    }

    return NextResponse.json({ success: true, token: agentToken.token });
  } catch (error) {
    console.error("Provisioning error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
