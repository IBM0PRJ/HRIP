import "dotenv/config";
import prisma from "../../lib/db";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "hrip_jwt_secret_2026_very_long_and_random";

export function createTestJWT(payload: any, expiresIn = "7d") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
}

export class TestClient {
  private cookies: Record<string, string> = {};
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.TEST_BASE_URL || "http://localhost:3000";
  }

  setAnalystSession(id: string, email: string) {
    const token = createTestJWT({ id, email, role: "analyst" });
    this.setCookie("analyst_session", token);
  }

  setEmployeeSession(id: string, email: string, name: string) {
    const token = createTestJWT({ id, email, name, role: "employee" });
    this.setCookie("emp_session", token);
  }

  async request(path: string, options: RequestInit = {}): Promise<Response> {
    const url = path.startsWith("http") ? path : `${this.baseUrl}${path}`;
    const headers = new Headers(options.headers || {});

    // Inject cookies from the cookie jar
    if (Object.keys(this.cookies).length > 0) {
      const cookieHeader = Object.entries(this.cookies)
        .map(([name, val]) => `${name}=${val}`)
        .join("; ");
      headers.set("Cookie", cookieHeader);
    }

    const response = await fetch(url, { ...options, headers });

    // Parse Set-Cookie headers
    let setCookies: string[] = [];
    if (typeof response.headers.getSetCookie === "function") {
      setCookies = response.headers.getSetCookie();
    } else {
      const singleHeader = response.headers.get("set-cookie");
      if (singleHeader) {
        setCookies = singleHeader.split(",").map(c => c.trim());
      }
    }

    for (const cookieStr of setCookies) {
      const mainPart = cookieStr.split(";")[0];
      const parts = mainPart.split("=");
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join("=").trim();
        if (value === "" || cookieStr.includes("Max-Age=0") || cookieStr.includes("Expires=Thu, 01 Jan 1970")) {
          delete this.cookies[key];
        } else {
          this.cookies[key] = value;
        }
      }
    }

    return response;
  }

  async get(path: string, headers?: Record<string, string>): Promise<Response> {
    return this.request(path, { method: "GET", headers });
  }

  async post(path: string, body: any, headers?: Record<string, string>): Promise<Response> {
    return this.request(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });
  }

  async patch(path: string, body: any, headers?: Record<string, string>): Promise<Response> {
    return this.request(path, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });
  }

  async delete(path: string, body?: any, headers?: Record<string, string>): Promise<Response> {
    return this.request(path, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  clearCookies() {
    this.cookies = {};
  }

  setCookie(name: string, value: string) {
    this.cookies[name] = value;
  }

  getCookie(name: string): string | undefined {
    return this.cookies[name];
  }

  getCookies(): Record<string, string> {
    return { ...this.cookies };
  }
}

// Database Helpers
export async function resetDatabase() {
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = OFF;");
  
  const tables = [
    "OTPCode",
    "AccessRequest",
    "TelemetryLog",
    "LogRequest",
    "EmployeeAlert",
    "TrainingProgress",
    "IncidentReport",
    "Session",
    "Employee",
    "Analyst"
  ];

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${table}";`);
  }

  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON;");

  const moduleCount = await prisma.trainingModule.count();
  if (moduleCount === 0) {
    const modules = [
      {
        title: "Phishing Identification Mastery",
        topic: "phishing",
        difficulty: "beginner",
        questions: JSON.stringify([
          { q: "What is the most common indicator of a phishing email?", options: ["Urgent language", "Correct spelling", "Known sender"], correct: 0 },
          { q: "Should you click links in unexpected emails?", options: ["Yes, to check them", "No, verify first", "Only if it looks official"], correct: 1 },
          { q: "What should you do with a suspected phishing email?", options: ["Reply and ask", "Forward to a friend", "Report to IT"], correct: 2 }
        ]),
        passMark: 2
      },
      {
        title: "Secure Password Practices",
        topic: "passwords",
        difficulty: "intermediate",
        questions: JSON.stringify([
          { q: "What makes a password strong?", options: ["Using your pet's name", "Using a mix of characters and length", "Using 'password123'"], correct: 1 },
          { q: "How often should you reuse passwords?", options: ["Always", "Only for unimportant accounts", "Never"], correct: 2 },
          { q: "What is MFA?", options: ["Multi-Factor Authentication", "Main File Access", "More Frequent Alerts"], correct: 0 }
        ]),
        passMark: 2
      },
      {
        title: "USB Security Basics",
        topic: "usb_security",
        difficulty: "beginner",
        questions: JSON.stringify([
          { q: "What should you do if you find a USB drive in the parking lot?", options: ["Plug it in to find the owner", "Give it to IT", "Keep it for personal use"], correct: 1 },
          { q: "Can a USB drive contain malware?", options: ["Yes, even if it looks empty", "No, they are safe", "Only if it's plugged into a Mac"], correct: 0 },
          { q: "Should you charge your phone using a public USB port?", options: ["Yes, it's convenient", "No, use a power adapter", "Only if it's urgent"], correct: 1 }
        ]),
        passMark: 2
      }
    ];

    for (const mod of modules) {
      await prisma.trainingModule.create({
        data: mod
      });
    }
  }
}

export async function getOTP(email: string, purpose: string) {
  return prisma.oTPCode.findFirst({
    where: { email, purpose, used: false },
    orderBy: { createdAt: "desc" }
  });
}

export async function getAccessRequest(email: string) {
  return prisma.accessRequest.findFirst({
    where: { employeeEmail: email },
    orderBy: { createdAt: "desc" }
  });
}

export async function getSession(email: string) {
  return prisma.session.findUnique({
    where: { email }
  });
}

export async function getTelemetryLogs(sessionId: string) {
  return prisma.telemetryLog.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" }
  });
}

export async function getLogRequest(email: string) {
  return prisma.logRequest.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" }
  });
}

export async function getAlerts(employeeId: string) {
  return prisma.employeeAlert.findMany({
    where: { employeeId },
    orderBy: { createdAt: "desc" }
  });
}

export async function getIncidents(employeeId: string) {
  return prisma.incidentReport.findMany({
    where: { employeeId },
    orderBy: { createdAt: "desc" }
  });
}
