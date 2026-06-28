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

export const tier3Cases: TestCase[] = [
  {
    id: "3.1",
    name: "Happy Path E2E pipeline Integration",
    fn: async () => {
      const client = new TestClient();

      // 1. Signup
      const resSignup = await client.post("/api/auth/signup/employee", {
        name: "E2E Happy",
        email: "happy@company.com",
        department: "Operations",
        password: "Password123!"
      });
      if (resSignup.status !== 200) throw new Error("Signup failed");

      // 2. Fetch OTP and verify
      const otp = await getOTP("happy@company.com", "employee_signup");
      if (!otp) throw new Error("OTP not generated");
      const resVerify = await client.post("/api/auth/verify-otp", {
        email: "happy@company.com",
        code: otp.code,
        purpose: "employee_signup"
      });
      if (resVerify.status !== 200) throw new Error("Verification failed");

      // 3. Submit Access Request
      const resReq = await client.post("/api/auth/request", {
        employeeName: "E2E Happy",
        employeeEmail: "happy@company.com",
        department: "Operations",
        photoUrl: "data:image/png;base64,i",
        location: { lat: 10.0, lng: 20.0, formatted: "Test Office" },
        deviceType: "Windows Laptop"
      });
      const dataReq = await resReq.json();
      if (resReq.status !== 200 || !dataReq.id) throw new Error("Access request creation failed");

      // 4. Analyst approve request
      const clientAnalyst = new TestClient();
      await ensureMockAnalyst("mock_analyst", "analyst@company.com");
      clientAnalyst.setAnalystSession("mock_analyst", "analyst@company.com");

      const resApprove = await clientAnalyst.post(`/api/auth/request/${dataReq.id}`, { action: "approved" });
      if (resApprove.status !== 200) throw new Error("Analyst approval failed");

      // 5. Issue session cookie
      const resSession = await client.post("/api/auth/session/issue", { requestId: dataReq.id });
      const dataSession = await resSession.json();
      if (resSession.status !== 200 || !dataSession.success) throw new Error("Session issuance failed");

      // 6. Fetch employee dashboard profile
      const resProfile = await client.get("/api/employee/me");
      const dataProfile = await resProfile.json();
      if (resProfile.status !== 200 || dataProfile.employee.email !== "happy@company.com") {
        throw new Error(`Profile fetch failed: ${JSON.stringify(dataProfile)}`);
      }
    }
  },
  {
    id: "3.2",
    name: "Containment Isolation Flow",
    fn: async () => {
      await prisma.session.create({
        data: {
          userId: "isolate_flow",
          email: "isolate.flow@company.com",
          state: "active"
        }
      });

      const clientAnalyst = new TestClient();
      const resUpdate = await clientAnalyst.post(`/api/auth/session/${encodeURIComponent("isolate.flow@company.com")}`, {
        state: "isolated"
      });
      if (resUpdate.status !== 200) throw new Error("Session state update failed");

      const clientEmp = new TestClient();
      const resSession = await clientEmp.get(`/api/auth/session/${encodeURIComponent("isolate.flow@company.com")}`);
      const dataSession = await resSession.json();
      if (dataSession.state !== "isolated") {
        throw new Error(`Expected state isolated, got: ${dataSession.state}`);
      }
    }
  },
  {
    id: "3.3",
    name: "Force Re-Authentication",
    fn: async () => {
      await prisma.session.create({
        data: {
          userId: "reauth_flow",
          email: "reauth.flow@company.com",
          state: "active"
        }
      });

      const clientAnalyst = new TestClient();
      const resUpdate = await clientAnalyst.post(`/api/auth/session/${encodeURIComponent("reauth.flow@company.com")}`, {
        state: "reauth_required"
      });
      if (resUpdate.status !== 200) throw new Error("Session state update failed");

      const clientEmp = new TestClient();
      const resSession = await clientEmp.get(`/api/auth/session/${encodeURIComponent("reauth.flow@company.com")}`);
      const dataSession = await resSession.json();
      if (dataSession.state !== "reauth_required") {
        throw new Error(`Expected state reauth_required, got: ${dataSession.state}`);
      }
    }
  },
  {
    id: "3.4",
    name: "Telemetry Suppression on Isolation",
    fn: async () => {
      const s = await prisma.session.create({
        data: {
          userId: "telemetry_sup",
          email: "telemetry.sup@company.com",
          state: "isolated",
          intProcess: true
        }
      });

      const client = new TestClient();
      const res = await client.post("/api/agent", {
        email: "telemetry.sup@company.com",
        logs: [
          { type: "process", message: "cmd.exe", timestamp: new Date() }
        ]
      });
      const data = await res.json();
      if (res.status !== 200 || data.inserted !== 0) {
        throw new Error(`Expected 0 inserted logs, got status ${res.status}: ${JSON.stringify(data)}`);
      }

      const resHistory = await client.post("/api/agent", {
        email: "telemetry.sup@company.com",
        logs: [
          { type: "history", message: "History event", timestamp: new Date() }
        ]
      });
      const dataHistory = await resHistory.json();
      if (resHistory.status !== 200 || dataHistory.inserted !== 1) {
        throw new Error(`Expected 1 inserted history log, got status ${resHistory.status}: ${JSON.stringify(dataHistory)}`);
      }
    }
  },
  {
    id: "3.5",
    name: "Full Forensic Audit Loop",
    fn: async () => {
      const s = await prisma.session.create({
        data: {
          userId: "audit_loop_id",
          email: "audit.loop@company.com",
          state: "active"
        }
      });

      const clientAnalyst = new TestClient();
      await ensureMockAnalyst("mock_analyst", "analyst@company.com");
      clientAnalyst.setAnalystSession("mock_analyst", "analyst@company.com");

      const resReq = await clientAnalyst.post("/api/log-requests", {
        email: "audit.loop@company.com",
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date().toISOString()
      });
      const dataReq = await resReq.json();
      if (resReq.status !== 200 || !dataReq.success) throw new Error("Failed to create log request");
      const reqId = dataReq.request.id;

      const clientEmp = new TestClient();
      const resApprove = await clientEmp.patch(`/api/log-requests/${reqId}`, { status: "APPROVED" });
      if (resApprove.status !== 200) throw new Error("Failed to approve log request");

      const clientAgent = new TestClient();
      const resPoll = await clientAgent.get("/api/log-requests/poll?email=audit.loop@company.com");
      const dataPoll = await resPoll.json();
      if (resPoll.status !== 200 || !dataPoll.request || dataPoll.request.id !== reqId) {
        throw new Error("Agent poll failed to receive approved request");
      }

      const resUpload = await clientAgent.post("/api/agent", {
        email: "audit.loop@company.com",
        logs: [
          { type: "history", message: "Process cmd.exe started", timestamp: new Date().toISOString() }
        ]
      });
      if (resUpload.status !== 200) throw new Error("Agent upload logs failed");

      const resComplete = await clientAgent.patch(`/api/log-requests/${reqId}`, { status: "COMPLETED" });
      if (resComplete.status !== 200) throw new Error("Agent patch complete failed");

      const dbReq = await prisma.logRequest.findUnique({ where: { id: reqId } });
      if (!dbReq || dbReq.status !== "COMPLETED") throw new Error("Request state is not COMPLETED");

      const logs = await getTelemetryLogs(s.id);
      if (logs.length !== 1 || !logs[0].message.includes("cmd.exe")) {
        throw new Error("Historical telemetry logs not found in database");
      }
    }
  },
  {
    id: "3.6",
    name: "Direct Token Issuance Bypassing",
    fn: async () => {
      const client = new TestClient();

      const reqDenied = await prisma.accessRequest.create({
        data: {
          employeeName: "Denied Bypasser",
          employeeEmail: "denied.bypass@company.com",
          department: "IT",
          photoUrl: "data:image/png;base64,i",
          lat: 0,
          lng: 0,
          locationName: "Test",
          deviceType: "PC",
          status: "denied"
        }
      });

      const res1 = await client.post("/api/auth/session/issue", { requestId: reqDenied.id });
      if (res1.status !== 403) {
        throw new Error(`Expected 403 for denied request session issuance, got ${res1.status}`);
      }

      const res2 = await client.post("/api/auth/session/issue", { requestId: "fake-request-id-123" });
      if (res2.status !== 404) {
        throw new Error(`Expected 404 for non-existent request ID, got ${res2.status}`);
      }
    }
  },
  {
    id: "3.7",
    name: "Risk Score Recalculation on Incident Resolution",
    fn: async () => {
      const emp = await prisma.employee.create({
        data: {
          id: "emp_recalc",
          name: "Recalc User",
          email: "recalc@company.com",
          department: "IT",
          passwordHash: "hash",
          isVerified: true,
          riskScore: 10.0
        }
      });

      const client = new TestClient();
      client.setEmployeeSession("emp_recalc", "recalc@company.com", "Recalc User");

      const resReport = await client.post("/api/employee/incidents", {
        senderEmail: "attacker@company.com",
        subject: "Suspicious",
        description: "Desc"
      });
      const dataReport = await resReport.json();
      if (resReport.status !== 200) throw new Error("Incident report failed");
      const incidentId = dataReport.incident.id;

      const empAfterReport = await prisma.employee.findUnique({ where: { id: "emp_recalc" } });
      if (!empAfterReport || empAfterReport.riskScore !== 25.0) {
        throw new Error(`Expected risk score to increase to 25, got ${empAfterReport?.riskScore}`);
      }

      const clientAnalyst = new TestClient();
      await ensureMockAnalyst("mock_analyst", "analyst@company.com");
      clientAnalyst.setAnalystSession("mock_analyst", "analyst@company.com");

      const resResolve = await clientAnalyst.patch(`/api/analyst/incidents/${incidentId}`, {
        status: "resolved",
        analystNote: "Resolved successfully."
      });
      if (resResolve.status !== 200) throw new Error("Incident resolution failed");

      const empAfterResolve = await prisma.employee.findUnique({ where: { id: "emp_recalc" } });
      if (!empAfterResolve || empAfterResolve.riskScore !== 10.0) {
        throw new Error(`Expected risk score to decrease to 10, got ${empAfterResolve?.riskScore}`);
      }
    }
  },
  {
    id: "3.8",
    name: "OTP Timeout and Signup Retry",
    fn: async () => {
      const client = new TestClient();

      await client.post("/api/auth/signup/employee", {
        name: "Timeout Retry",
        email: "timeout@company.com",
        department: "Sales",
        password: "Password123!"
      });

      const otp1 = await getOTP("timeout@company.com", "employee_signup");
      if (!otp1) throw new Error("OTP not generated");

      await prisma.oTPCode.update({
        where: { id: otp1.id },
        data: { expiresAt: new Date(Date.now() - 1000) }
      });

      const resVerifyFail = await client.post("/api/auth/verify-otp", {
        email: "timeout@company.com",
        code: otp1.code,
        purpose: "employee_signup"
      });
      if (resVerifyFail.status !== 400) throw new Error("Expired OTP verification should fail");

      const resSignup2 = await client.post("/api/auth/signup/employee", {
        name: "Timeout Retry New Name",
        email: "timeout@company.com",
        department: "Marketing",
        password: "NewPassword123!"
      });
      if (resSignup2.status !== 200) throw new Error("Signup retry failed");

      const otp2 = await getOTP("timeout@company.com", "employee_signup");
      if (!otp2 || otp2.id === otp1.id) throw new Error("New OTP was not generated");

      const resVerifySuccess = await client.post("/api/auth/verify-otp", {
        email: "timeout@company.com",
        code: otp2.code,
        purpose: "employee_signup"
      });
      if (resVerifySuccess.status !== 200) throw new Error("New OTP verification failed");

      const emp = await prisma.employee.findUnique({ where: { email: "timeout@company.com" } });
      if (!emp || !emp.isVerified || emp.name !== "Timeout Retry New Name") {
        throw new Error("Employee credentials were not updated correctly upon retry");
      }
    }
  },
  {
    id: "3.9",
    name: "Analyst Approval with Session Cleanup",
    fn: async () => {
      const req = await prisma.accessRequest.create({
        data: {
          employeeName: "Deleted Employee",
          employeeEmail: "delete.me@company.com",
          department: "IT",
          photoUrl: "data:image/png;base64,i",
          lat: 0,
          lng: 0,
          locationName: "Test",
          deviceType: "PC",
          status: "approved"
        }
      });

      const emp = await prisma.employee.create({
        data: {
          id: "deleted_emp_id",
          name: "Deleted Employee",
          email: "delete.me@company.com",
          department: "IT",
          passwordHash: "hash",
          isVerified: true
        }
      });

      await prisma.session.create({
        data: {
          userId: "deleted_emp_id",
          email: "delete.me@company.com",
          state: "active"
        }
      });

      const client = new TestClient();
      client.setEmployeeSession("deleted_emp_id", "delete.me@company.com", "Deleted Employee");

      const res1 = await client.get("/api/employee/me");
      if (res1.status !== 200) throw new Error("Initial profile fetch failed");

      await prisma.employee.delete({ where: { id: "deleted_emp_id" } });

      const res2 = await client.get("/api/employee/me");
      if (res2.status !== 401) {
        throw new Error(`Expected 401 for deleted employee profile fetch, got ${res2.status}`);
      }
    }
  },
  {
    id: "3.10",
    name: "Multi-User Parallel Onboarding",
    fn: async () => {
      const client = new TestClient();

      const reqsData = [
        { name: "Parallel A", email: "para.a@company.com" },
        { name: "Parallel B", email: "para.b@company.com" },
        { name: "Parallel C", email: "para.c@company.com" }
      ];

      for (const user of reqsData) {
        await client.post("/api/auth/request", {
          employeeName: user.name,
          employeeEmail: user.email,
          department: "Engineering",
          photoUrl: "data:image/png;base64,i",
          location: { lat: 0, lng: 0, formatted: "Office" }
        });
      }

      const clientAnalyst = new TestClient();
      await ensureMockAnalyst("mock_analyst", "analyst@company.com");
      clientAnalyst.setAnalystSession("mock_analyst", "analyst@company.com");

      const resList = await clientAnalyst.get("/api/auth/request");
      const dataList = await resList.json();
      if (!Array.isArray(dataList)) {
        throw new Error(`Expected array of pending requests, got: ${JSON.stringify(dataList)}`);
      }

      for (const user of reqsData) {
        const found = dataList.find((r: any) => r.employeeEmail === user.email);
        if (!found) throw new Error(`Pending request for ${user.email} not listed in queue`);
        
        await clientAnalyst.post(`/api/auth/request/${found.id}`, { action: "approved" });
        const session = await getSession(user.email);
        if (!session || session.state !== "active") {
          throw new Error(`Active session not created for parallel user ${user.email}`);
        }
      }
    }
  }
];
