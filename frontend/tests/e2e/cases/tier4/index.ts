import { TestClient, getOTP, getAccessRequest, getSession, getTelemetryLogs, getLogRequest, getAlerts, getIncidents } from "../../harness";
import prisma from "../../../../lib/db";

export interface TestCase {
  id: string;
  name: string;
  fn: () => Promise<void>;
}

async function ensureMockAnalyst(id = "mock_analyst", email = "analyst@company.com") {
  const existing = await prisma.analyst.findUnique({ where: { id } });
  if (!existing) {
    await prisma.analyst.create({
      data: {
        id,
        name: "Mock Analyst",
        email,
        passwordHash: "hash",
        isApproved: true
      }
    });
  }
}

export const tier4Cases: TestCase[] = [
  {
    id: "4.1",
    name: "Standard Employee Onboarding and Device Setup Scenario",
    fn: async () => {
      const employeeClient = new TestClient();

      // 1. Employee signs up via /signup/employee (status: unverified)
      const resSignup = await employeeClient.post("/api/auth/signup/employee", {
        name: "Scenario Employee",
        email: "scenario.emp@company.com",
        department: "Sales",
        password: "Password123!"
      });
      if (resSignup.status !== 200) throw new Error("Signup failed");

      // 2. Gets OTP, verifies it via /api/auth/verify-otp (status: verified)
      const otp = await getOTP("scenario.emp@company.com", "employee_signup");
      if (!otp) throw new Error("OTP not generated");
      const resVerify = await employeeClient.post("/api/auth/verify-otp", {
        email: "scenario.emp@company.com",
        code: otp.code,
        purpose: "employee_signup"
      });
      if (resVerify.status !== 200) throw new Error("OTP verification failed");

      // 3. Submits access request (GPS location, selfie camera photo)
      const resReq = await employeeClient.post("/api/auth/request", {
        employeeName: "Scenario Employee",
        employeeEmail: "scenario.emp@company.com",
        department: "Sales",
        photoUrl: "data:image/png;base64,i",
        location: { lat: 37.7749, lng: -122.4194, formatted: "HQ" },
        deviceType: "Windows PC"
      });
      const dataReq = await resReq.json();
      if (resReq.status !== 200 || !dataReq.id) throw new Error("Access request creation failed");

      // 4. Analyst logs in, visits queue, approves request
      const analystClient = new TestClient();
      await ensureMockAnalyst("mock_analyst", "analyst@company.com");
      analystClient.setAnalystSession("mock_analyst", "analyst@company.com");

      const resApprove = await analystClient.post(`/api/auth/request/${dataReq.id}`, { action: "approved" });
      if (resApprove.status !== 200) throw new Error("Analyst approval failed");

      // 5. Employee calls session/issue and receives emp_session cookie
      const resIssue = await employeeClient.post("/api/auth/session/issue", { requestId: dataReq.id });
      const dataIssue = await resIssue.json();
      if (resIssue.status !== 200 || !dataIssue.success) throw new Error("Session issuance failed");

      // 6. Employee enables integrations, telemetry logs generated in SQLite
      const resTelemetry = await employeeClient.post("/api/telemetry", {
        email: "scenario.emp@company.com",
        integration: "usb",
        status: true
      });
      if (resTelemetry.status !== 200) throw new Error("Enabling USB integration failed");

      // 7. Employee accesses dashboard successfully
      const resMe = await employeeClient.get("/api/employee/me");
      const dataMe = await resMe.json();
      if (resMe.status !== 200) throw new Error("Dashboard profile fetch failed");
      if (!dataMe.session.integrations.usb) throw new Error("USB integration should be active");
    }
  },
  {
    id: "4.2",
    name: "Incident Investigation and Device Containment Scenario",
    fn: async () => {
      // 1. Employee is logged in
      const emp = await prisma.employee.create({
        data: {
          id: "scenario_emp_id",
          name: "Scenario Employee",
          email: "scenario.contain@company.com",
          department: "Finance",
          passwordHash: "hash",
          isVerified: true,
          riskScore: 5.0
        }
      });

      const s = await prisma.session.create({
        data: {
          userId: "scenario_emp_id",
          email: "scenario.contain@company.com",
          state: "active"
        }
      });

      const employeeClient = new TestClient();
      employeeClient.setEmployeeSession("scenario_emp_id", "scenario.contain@company.com", "Scenario Employee");

      // 2. Employee reports a suspicious email
      const resReport = await employeeClient.post("/api/employee/incidents", {
        senderEmail: "phish@scam.com",
        subject: "Urgent Wire Transfer",
        description: "Requesting wire transfer."
      });
      const dataReport = await resReport.json();
      if (resReport.status !== 200) throw new Error("Incident report failed");
      const incidentId = dataReport.incident.id;

      // 3. Analyst logs in, reviews incident, sets to investigating
      const analystClient = new TestClient();
      await ensureMockAnalyst("mock_analyst", "analyst@company.com");
      analystClient.setAnalystSession("mock_analyst", "analyst@company.com");

      const resInvestigate = await analystClient.patch(`/api/analyst/incidents/${incidentId}`, {
        status: "investigating",
        analystNote: "High probability of phishing attempt. Investigating wire request."
      });
      if (resInvestigate.status !== 200) throw new Error("Incident update failed");

      // 4. Due to risk, Analyst isolates the device
      const resIsolate = await analystClient.post(`/api/auth/session/${encodeURIComponent("scenario.contain@company.com")}`, {
        state: "isolated"
      });
      if (resIsolate.status !== 200) throw new Error("Containment isolation failed");

      // 5. Employee dashboard polling detects isolated state
      const resSession = await employeeClient.get(`/api/auth/session/${encodeURIComponent("scenario.contain@company.com")}`);
      const dataSession = await resSession.json();
      if (dataSession.state !== "isolated") {
        throw new Error("Employee session state should be isolated");
      }
    }
  },
  {
    id: "4.3",
    name: "Consent-Driven Forensic Investigation Scenario",
    fn: async () => {
      // Setup active employee session
      const emp = await prisma.employee.create({
        data: {
          id: "scenario_forensic_id",
          name: "Scenario Forensic Employee",
          email: "forensic@company.com",
          department: "HR",
          passwordHash: "hash",
          isVerified: true
        }
      });

      const s = await prisma.session.create({
        data: {
          userId: "scenario_forensic_id",
          email: "forensic@company.com",
          state: "active"
        }
      });

      const analystClient = new TestClient();
      await ensureMockAnalyst("mock_analyst", "analyst@company.com");
      analystClient.setAnalystSession("mock_analyst", "analyst@company.com");

      // 1. Analyst requests logs
      const resReq = await analystClient.post("/api/log-requests", {
        email: "forensic@company.com",
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date().toISOString()
      });
      const dataReq = await resReq.json();
      if (resReq.status !== 200 || !dataReq.success) throw new Error("Failed to request logs");
      const reqId = dataReq.request.id;

      // 2. Employee detects request, grants access
      const employeeClient = new TestClient();
      employeeClient.setEmployeeSession("scenario_forensic_id", "forensic@company.com", "Scenario Forensic Employee");
      const resApprove = await employeeClient.patch(`/api/log-requests/${reqId}`, { status: "APPROVED" });
      if (resApprove.status !== 200) throw new Error("Failed to grant consent");

      // 3. PowerShell agent polls, receives approved timeframe
      const agentClient = new TestClient();
      const resPoll = await agentClient.get("/api/log-requests/poll?email=forensic@company.com");
      const dataPoll = await resPoll.json();
      if (resPoll.status !== 200 || !dataPoll.request || dataPoll.request.id !== reqId) {
        throw new Error("Agent poll did not retrieve approved request");
      }

      // 4. Agent uploads interactive logon logs, patches request to COMPLETED
      const resUpload = await agentClient.post("/api/agent", {
        email: "forensic@company.com",
        logs: [
          { type: "history", message: "User interactive logon at 08:30 AM", timestamp: new Date().toISOString() }
        ]
      });
      if (resUpload.status !== 200) throw new Error("Agent upload failed");

      const resComplete = await agentClient.patch(`/api/log-requests/${reqId}`, { status: "COMPLETED" });
      if (resComplete.status !== 200) throw new Error("Agent completion PATCH failed");

      // 5. Analyst checks employee device logs in DB
      const logs = await getTelemetryLogs(s.id);
      if (logs.length !== 1 || !logs[0].message.includes("logon")) {
        throw new Error("Forensic logon log not found in database");
      }
    }
  }
];
