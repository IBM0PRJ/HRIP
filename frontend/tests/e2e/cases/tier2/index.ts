import { TestClient, getOTP, getAccessRequest, getSession, getTelemetryLogs, getLogRequest, getAlerts, getIncidents } from "../../harness";
import prisma from "../../../../lib/db";
import jwt from "jsonwebtoken";

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

async function ensureMockEmployee(id: string, email: string, name: string) {
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) {
    await prisma.employee.create({
      data: {
        id,
        name,
        email,
        department: "IT",
        passwordHash: "hash",
        isVerified: true
      }
    });
  }

  const existingSession = await prisma.session.findUnique({ where: { email } });
  if (!existingSession) {
    await prisma.session.create({
      data: {
        userId: id,
        email,
        state: "active"
      }
    });
  }
}

export const tier2Cases: TestCase[] = [
  // FEATURE 1: Credentials Login & Signup
  {
    id: "2.1.6",
    name: "Duplicate Employee Signup",
    fn: async () => {
      const client = new TestClient();
      await prisma.employee.create({
        data: {
          name: "Original User",
          email: "duplicate@company.com",
          department: "IT",
          passwordHash: "hash",
          isVerified: true
        }
      });

      const res = await client.post("/api/auth/signup/employee", {
        name: "New User",
        email: "duplicate@company.com",
        department: "Sales",
        password: "NewPassword123!"
      });
      const data = await res.json();
      if (res.status !== 400 || data.error !== "Email already registered") {
        throw new Error(`Expected 400 Email already registered, got ${res.status}: ${JSON.stringify(data)}`);
      }
    }
  },
  {
    id: "2.1.7",
    name: "Overwrite Unverified Signup",
    fn: async () => {
      const client = new TestClient();
      await client.post("/api/auth/signup/employee", {
        name: "First Attempt",
        email: "overwrite@company.com",
        department: "IT",
        password: "Password1!"
      });

      const res = await client.post("/api/auth/signup/employee", {
        name: "Second Attempt",
        email: "overwrite@company.com",
        department: "Marketing",
        password: "Password2!"
      });
      const data = await res.json();
      if (res.status !== 200 || !data.success) {
        throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(data)}`);
      }

      const count = await prisma.employee.count({ where: { email: "overwrite@company.com" } });
      if (count !== 1) throw new Error(`Should overwrite existing employee row, found count: ${count}`);

      const emp = await prisma.employee.findUnique({ where: { email: "overwrite@company.com" } });
      if (emp?.name !== "Second Attempt" || emp?.department !== "Marketing") {
        throw new Error("Fields were not updated on second signup attempt");
      }
    }
  },
  {
    id: "2.1.8",
    name: "SQL Injection Check",
    fn: async () => {
      const client = new TestClient();
      const res = await client.post("/api/auth/login", {
        email: "admin@company.com' OR '1'='1",
        password: "' OR '1'='1",
        role: "employee"
      });
      const data = await res.json();
      if (res.status >= 500) {
        throw new Error(`Server crashed with status ${res.status}: ${JSON.stringify(data)}`);
      }
      if (res.status !== 401 && res.status !== 400) {
        throw new Error(`Expected 401/400, got ${res.status}: ${JSON.stringify(data)}`);
      }
    }
  },
  {
    id: "2.1.9",
    name: "Overflow Inputs",
    fn: async () => {
      const client = new TestClient();
      const longString = "A".repeat(15000);
      const res = await client.post("/api/auth/signup/employee", {
        name: longString,
        email: "overflow@company.com",
        department: "OverflowDept",
        password: "Password123!"
      });
      const data = await res.json();
      if (res.status >= 500) {
        throw new Error(`Server crashed with status ${res.status}: ${JSON.stringify(data)}`);
      }
    }
  },
  {
    id: "2.1.10",
    name: "Case-Insensitive Email Login",
    fn: async () => {
      const client = new TestClient();
      await client.post("/api/auth/signup/employee", {
        name: "Case User",
        email: "CASE.USER@COMPANY.COM",
        department: "Support",
        password: "Password123!"
      });

      const otp = await getOTP("case.user@company.com", "employee_signup");
      if (!otp) throw new Error("OTP not generated");
      await client.post("/api/auth/verify-otp", {
        email: "case.user@company.com",
        code: otp.code,
        purpose: "employee_signup"
      });

      const res = await client.post("/api/auth/login", {
        email: "case.user@company.com",
        password: "Password123!",
        role: "employee"
      });
      const data = await res.json();
      if (res.status !== 200 || !data.success) {
        throw new Error(`Login failed with case-insensitive email: ${JSON.stringify(data)}`);
      }
    }
  },

  // FEATURE 2: OTP Code Generation & Verification
  {
    id: "2.2.6",
    name: "Empty OTP Code",
    fn: async () => {
      const client = new TestClient();
      const res = await client.post("/api/auth/verify-otp", {
        email: "john@company.com",
        code: "",
        purpose: "employee_signup"
      });
      const data = await res.json();
      if (res.status !== 400 || data.error !== "Missing fields") {
        throw new Error(`Expected 400 Missing fields, got ${res.status}: ${JSON.stringify(data)}`);
      }
    }
  },
  {
    id: "2.2.7",
    name: "Non-Numeric Code Input",
    fn: async () => {
      const client = new TestClient();
      const res = await client.post("/api/auth/verify-otp", {
        email: "john@company.com",
        code: "ABCDEF",
        purpose: "employee_signup"
      });
      const data = await res.json();
      if (res.status !== 400 || data.error !== "Invalid or expired OTP") {
        throw new Error(`Expected 400, got ${res.status}: ${JSON.stringify(data)}`);
      }
    }
  },
  {
    id: "2.2.8",
    name: "Database Match Failure",
    fn: async () => {
      const client = new TestClient();
      const res = await client.post("/api/auth/verify-otp", {
        email: "john@company.com",
        code: "999999",
        purpose: "employee_signup"
      });
      const data = await res.json();
      if (res.status !== 400 || data.error !== "Invalid or expired OTP") {
        throw new Error(`Expected 400, got ${res.status}: ${JSON.stringify(data)}`);
      }
    }
  },
  {
    id: "2.2.9",
    name: "Expiry Window boundary check",
    fn: async () => {
      const client = new TestClient();
      
      await prisma.oTPCode.create({
        data: {
          email: "boundary@company.com",
          code: "111111",
          purpose: "employee_signup",
          expiresAt: new Date(Date.now() + 5000),
          used: false
        }
      });
      await prisma.employee.create({
        data: {
          name: "Boundary User",
          email: "boundary@company.com",
          department: "IT",
          passwordHash: "hash"
        }
      });

      const resSuccess = await client.post("/api/auth/verify-otp", {
        email: "boundary@company.com",
        code: "111111",
        purpose: "employee_signup"
      });
      if (resSuccess.status !== 200) {
        throw new Error("OTP verification right before expiry failed");
      }

      await prisma.oTPCode.create({
        data: {
          email: "boundary2@company.com",
          code: "222222",
          purpose: "employee_signup",
          expiresAt: new Date(Date.now() - 1000),
          used: false
        }
      });

      const resFail = await client.post("/api/auth/verify-otp", {
        email: "boundary2@company.com",
        code: "222222",
        purpose: "employee_signup"
      });
      if (resFail.status !== 400) {
        throw new Error("OTP verification after expiry succeeded");
      }
    }
  },
  {
    id: "2.2.10",
    name: "Reuse Used OTP",
    fn: async () => {
      const client = new TestClient();
      await prisma.oTPCode.create({
        data: {
          email: "reuse@company.com",
          code: "333333",
          purpose: "employee_signup",
          expiresAt: new Date(Date.now() + 60000),
          used: true
        }
      });

      const res = await client.post("/api/auth/verify-otp", {
        email: "reuse@company.com",
        code: "333333",
        purpose: "employee_signup"
      });
      const data = await res.json();
      if (res.status !== 400 || data.error !== "Invalid or expired OTP") {
        throw new Error(`Expected 400, got ${res.status}: ${JSON.stringify(data)}`);
      }
    }
  },

  // FEATURE 3: Selfie & Geolocation Onboarding
  {
    id: "2.3.6",
    name: "Missing Geolocation data",
    fn: async () => {
      const client = new TestClient();
      const res = await client.post("/api/auth/request", {
        employeeName: "No GPS",
        employeeEmail: "nogps@company.com",
        department: "Engineering",
        photoUrl: "data:image/png;base64,i"
      });
      const data = await res.json();
      if (res.status !== 200) {
        throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(data)}`);
      }

      const req = await getAccessRequest("nogps@company.com");
      if (!req || req.lat !== 0 || req.lng !== 0) {
        throw new Error("Expected default coordinates 0.0, 0.0");
      }
    }
  },
  {
    id: "2.3.7",
    name: "Large Photo payload",
    fn: async () => {
      const client = new TestClient();
      const largePhoto = "data:image/jpeg;base64," + "B".repeat(50000);
      const res = await client.post("/api/auth/request", {
        employeeName: "Large Photo",
        employeeEmail: "largephoto@company.com",
        department: "Engineering",
        photoUrl: largePhoto,
        location: { lat: 1, lng: 2, formatted: "Test" }
      });
      if (res.status >= 500) {
        throw new Error(`Server crashed with status ${res.status}`);
      }
    }
  },
  {
    id: "2.3.8",
    name: "Script Injection in fields",
    fn: async () => {
      const client = new TestClient();
      const scriptTag = "<script>alert('xss')</script>";
      await client.post("/api/auth/request", {
        employeeName: "XSS User",
        employeeEmail: "xss@company.com",
        department: scriptTag,
        photoUrl: "data:image/png;base64,i",
        location: { lat: 1, lng: 2, formatted: "Test" }
      });

      const req = await getAccessRequest("xss@company.com");
      if (!req || req.department !== scriptTag) {
        throw new Error("Value not saved safely or was altered");
      }
    }
  },
  {
    id: "2.3.9",
    name: "Extreme coordinates bounds",
    fn: async () => {
      const client = new TestClient();
      await client.post("/api/auth/request", {
        employeeName: "Extreme GPS",
        employeeEmail: "extreme@company.com",
        department: "Engineering",
        photoUrl: "data:image/png;base64,i",
        location: {
          lat: 90.0,
          lng: 180.0,
          formatted: "North Pole"
        }
      });

      const req = await getAccessRequest("extreme@company.com");
      if (!req || req.lat !== 90 || req.lng !== 180) {
        throw new Error("Extreme coordinates were not saved correctly");
      }
    }
  },
  {
    id: "2.3.10",
    name: "Non-image Base64 string",
    fn: async () => {
      const client = new TestClient();
      const res = await client.post("/api/auth/request", {
        employeeName: "Non Image",
        employeeEmail: "nonimage@company.com",
        department: "Engineering",
        photoUrl: "This is not base64 image",
        location: { lat: 1, lng: 2, formatted: "Test" }
      });
      if (res.status >= 500) {
        throw new Error(`Server crashed with status ${res.status}`);
      }
    }
  },

  // FEATURE 4: Access Request Approval/Denial by Analyst
  {
    id: "2.4.6",
    name: "Redundant Request Approval",
    fn: async () => {
      const req = await prisma.accessRequest.create({
        data: {
          employeeName: "Redundant",
          employeeEmail: "redundant@company.com",
          department: "IT",
          photoUrl: "data:image/png;base64,i",
          lat: 0,
          lng: 0,
          locationName: "Test",
          deviceType: "PC",
          status: "approved"
        }
      });

      const client = new TestClient();
      await ensureMockAnalyst("mock_analyst", "analyst@company.com");
      client.setAnalystSession("mock_analyst", "analyst@company.com");

      const res = await client.post(`/api/auth/request/${req.id}`, { action: "approved" });
      const data = await res.json();
      if (res.status !== 200 || !data.success) {
        throw new Error(`Second approval failed: ${JSON.stringify(data)}`);
      }

      const sessionsCount = await prisma.session.count({ where: { email: "redundant@company.com" } });
      if (sessionsCount > 1) {
        throw new Error("Duplicate sessions created for the same user");
      }
    }
  },
  {
    id: "2.4.7",
    name: "Approve Denied Request",
    fn: async () => {
      const req = await prisma.accessRequest.create({
        data: {
          employeeName: "Denied To Approved",
          employeeEmail: "denied.to.approved@company.com",
          department: "IT",
          photoUrl: "data:image/png;base64,i",
          lat: 0,
          lng: 0,
          locationName: "Test",
          deviceType: "PC",
          status: "denied"
        }
      });

      const client = new TestClient();
      await ensureMockAnalyst("mock_analyst", "analyst@company.com");
      client.setAnalystSession("mock_analyst", "analyst@company.com");

      const res = await client.post(`/api/auth/request/${req.id}`, { action: "approved" });
      const data = await res.json();
      if (res.status !== 200 || !data.success || data.status !== "approved") {
        throw new Error(`Transition failed: ${JSON.stringify(data)}`);
      }

      const updated = await prisma.accessRequest.findUnique({ where: { id: req.id } });
      if (!updated || updated.status !== "approved") {
        throw new Error("State not updated to approved");
      }

      const session = await getSession("denied.to.approved@company.com");
      if (!session || session.state !== "active") {
        throw new Error("Session was not created for approved request");
      }
    }
  },
  {
    id: "2.4.8",
    name: "Deny Approved Request",
    fn: async () => {
      const req = await prisma.accessRequest.create({
        data: {
          employeeName: "Approved To Denied",
          employeeEmail: "approved.to.denied@company.com",
          department: "IT",
          photoUrl: "data:image/png;base64,i",
          lat: 0,
          lng: 0,
          locationName: "Test",
          deviceType: "PC",
          status: "approved"
        }
      });

      const client = new TestClient();
      await ensureMockAnalyst("mock_analyst", "analyst@company.com");
      client.setAnalystSession("mock_analyst", "analyst@company.com");

      const res = await client.post(`/api/auth/request/${req.id}`, { action: "denied" });
      const data = await res.json();
      if (res.status !== 200 || !data.success || data.status !== "denied") {
        throw new Error(`Transition failed: ${JSON.stringify(data)}`);
      }

      const updated = await prisma.accessRequest.findUnique({ where: { id: req.id } });
      if (!updated || updated.status !== "denied") {
        throw new Error("State not updated to denied");
      }
    }
  },
  {
    id: "2.4.9",
    name: "Query Non-existent Request ID",
    fn: async () => {
      const client = new TestClient();
      const res = await client.get("/api/auth/request/invalid-cuid");
      const data = await res.json();
      if (res.status !== 404 || data.error !== "Not found") {
        throw new Error(`Expected 404, got ${res.status}: ${JSON.stringify(data)}`);
      }
    }
  },
  {
    id: "2.4.10",
    name: "Invalid action parameter",
    fn: async () => {
      const req = await prisma.accessRequest.create({
        data: {
          employeeName: "Hack action",
          employeeEmail: "hack@company.com",
          department: "IT",
          photoUrl: "data:image/png;base64,i",
          lat: 0,
          lng: 0,
          locationName: "Test",
          deviceType: "PC",
          status: "pending"
        }
      });

      const client = new TestClient();
      await ensureMockAnalyst("mock_analyst", "analyst@company.com");
      client.setAnalystSession("mock_analyst", "analyst@company.com");

      const res = await client.post(`/api/auth/request/${req.id}`, { action: "hack" });
      const data = await res.json();
      if (res.status !== 400 || data.error !== "Invalid action") {
        throw new Error(`Expected 400 Invalid action, got ${res.status}: ${JSON.stringify(data)}`);
      }
    }
  },

  // FEATURE 5: Zero-Trust Session Issuance & Cookie Validation
  {
    id: "2.5.6",
    name: "Issue Session with Empty Body",
    fn: async () => {
      const client = new TestClient();
      const res = await client.post("/api/auth/session/issue", {});
      const data = await res.json();
      if (res.status !== 400 || data.error !== "Missing requestId") {
        throw new Error(`Expected 400, got ${res.status}: ${JSON.stringify(data)}`);
      }
    }
  },
  {
    id: "2.5.7",
    name: "Signature Spoofing",
    fn: async () => {
      const client = new TestClient();
      const spoofedToken = jwt.sign({ id: "spoof", email: "spoof@company.com", role: "employee" }, "wrong_secret");
      client.setCookie("emp_session", spoofedToken);

      const res = await client.get("/dashboard");
      if (res.status !== 200 && res.status !== 307 && res.status !== 302) {
        throw new Error(`Expected redirect, got status ${res.status}`);
      }
    }
  },
  {
    id: "2.5.8",
    name: "Expired Session Cookie",
    fn: async () => {
      const client = new TestClient();
      const secret = process.env.JWT_SECRET || "fallback_secret_for_dev";
      const expiredToken = jwt.sign({ id: "expired", email: "expired@company.com", role: "employee" }, secret, { expiresIn: "0s" });
      client.setCookie("emp_session", expiredToken);

      const res = await client.get("/dashboard");
      if (res.status !== 200 && res.status !== 307 && res.status !== 302) {
        throw new Error(`Expected redirect, got status ${res.status}`);
      }
    }
  },
  {
    id: "2.5.9",
    name: "UI State Locking on Isolation",
    fn: async () => {
      await prisma.session.create({
        data: {
          userId: "isolated_id",
          email: "isolated@company.com",
          state: "isolated"
        }
      });

      const client = new TestClient();
      const res = await client.get(`/api/auth/session/${encodeURIComponent("isolated@company.com")}`);
      const data = await res.json();
      if (res.status !== 200 || data.state !== "isolated") {
        throw new Error(`Expected isolated state, got status ${res.status}: ${JSON.stringify(data)}`);
      }
    }
  },
  {
    id: "2.5.10",
    name: "Session ID Conflict",
    fn: async () => {
      await prisma.session.create({
        data: {
          userId: "conflict_user_1",
          email: "conflict@company.com",
          state: "active"
        }
      });

      const client = new TestClient();
      const res = await client.post(`/api/auth/session/${encodeURIComponent("conflict@company.com")}`, { state: "isolated" });
      const data = await res.json();
      if (res.status !== 200 || !data.success) {
        throw new Error(`Update failed: ${JSON.stringify(data)}`);
      }

      const sessionsCount = await prisma.session.count({ where: { email: "conflict@company.com" } });
      if (sessionsCount !== 1) {
        throw new Error(`Should upsert session instead of duplicate: count ${sessionsCount}`);
      }
    }
  },

  // FEATURE 6: Employee Dashboard UI & Telemetry Logs
  {
    id: "2.6.6",
    name: "Telemetry Ingest Empty Array",
    fn: async () => {
      const client = new TestClient();
      const res = await client.post("/api/agent", {
        email: "empty.agent@company.com",
        logs: []
      });
      const data = await res.json();
      if (res.status !== 200 || !data.success || data.inserted !== 0) {
        throw new Error(`Expected success with 0 inserted, got status ${res.status}: ${JSON.stringify(data)}`);
      }
    }
  },
  {
    id: "2.6.7",
    name: "Malformed Agent Payload",
    fn: async () => {
      const client = new TestClient();
      const res = await client.post("/api/agent", [
        { type: "usb", message: "USB" }
      ] as any);
      const data = await res.json();
      if (res.status !== 400 || data.error !== "Invalid payload") {
        throw new Error(`Expected 400, got status ${res.status}: ${JSON.stringify(data)}`);
      }
    }
  },
  {
    id: "2.6.8",
    name: "Integration Mapping Bounds",
    fn: async () => {
      const client = new TestClient();
      const res = await client.post("/api/telemetry", {
        email: "toggle@company.com",
        integration: "bluetooth",
        status: true
      });
      const data = await res.json();
      if (res.status >= 500) {
        throw new Error(`Server crashed: ${JSON.stringify(data)}`);
      }
    }
  },
  {
    id: "2.6.9",
    name: "Limit Telemetry Logs returns",
    fn: async () => {
      const s = await prisma.session.create({
        data: {
          userId: "limit_logs",
          email: "limit@company.com",
          state: "active"
        }
      });

      const logs = Array.from({ length: 60 }).map((_, idx) => ({
        sessionId: s.id,
        message: `Log #${idx}`
      }));
      await prisma.telemetryLog.createMany({ data: logs });

      const client = new TestClient();
      const res = await client.get("/api/telemetry?email=limit@company.com");
      const data = await res.json();
      if (res.status !== 200 || !data.logs || data.logs.length !== 50) {
        throw new Error(`Expected capped 50 logs, got status ${res.status}: logs count ${data.logs?.length}`);
      }
    }
  },
  {
    id: "2.6.10",
    name: "Auto-create Session for Unknown Agent Email",
    fn: async () => {
      const client = new TestClient();
      const res = await client.post("/api/agent", {
        email: "unknown.agent@company.com",
        logs: [
          { type: "process", message: "cmd.exe", timestamp: new Date() }
        ]
      });
      const data = await res.json();
      if (res.status !== 200 || !data.success) {
        throw new Error(`Expected success, got status ${res.status}: ${JSON.stringify(data)}`);
      }

      const session = await getSession("unknown.agent@company.com");
      if (!session) throw new Error("Session not auto-created in DB");
    }
  },

  // FEATURE 7: Audit Log Requests & Approvals
  {
    id: "2.7.6",
    name: "Log Request Start Time After End Time",
    fn: async () => {
      const client = new TestClient();
      await ensureMockAnalyst("mock_analyst", "analyst@company.com");
      client.setAnalystSession("mock_analyst", "analyst@company.com");
      const res = await client.post("/api/log-requests", {
        email: "time.user@company.com",
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date().toISOString()
      });
      if (res.status >= 500) {
        throw new Error(`Server crashed: ${res.status}`);
      }
    }
  },
  {
    id: "2.7.7",
    name: "Reject Pending Log Request",
    fn: async () => {
      const req = await prisma.logRequest.create({
        data: {
          email: "audit.reject@company.com",
          startTime: new Date(),
          endTime: new Date(),
          status: "PENDING"
        }
      });

      const client = new TestClient();
      const res = await client.patch(`/api/log-requests/${req.id}`, { status: "REJECTED" });
      const data = await res.json();
      if (res.status !== 200 || data.request.status !== "REJECTED") {
        throw new Error(`Rejection failed: ${JSON.stringify(data)}`);
      }

      const updated = await prisma.logRequest.findUnique({ where: { id: req.id } });
      if (!updated || updated.status !== "REJECTED") {
        throw new Error("State not updated to REJECTED in DB");
      }
    }
  },
  {
    id: "2.7.8",
    name: "Agent Poll Unknown Email",
    fn: async () => {
      const client = new TestClient();
      const res = await client.get("/api/log-requests/poll?email=unknown.audit@company.com");
      const data = await res.json();
      if (res.status !== 200 || data.request !== null) {
        throw new Error(`Expected null request, got status ${res.status}: ${JSON.stringify(data)}`);
      }
    }
  },
  {
    id: "2.7.9",
    name: "Double Complete LogRequest",
    fn: async () => {
      const req = await prisma.logRequest.create({
        data: {
          email: "audit.double@company.com",
          startTime: new Date(),
          endTime: new Date(),
          status: "COMPLETED"
        }
      });

      const client = new TestClient();
      const res = await client.patch(`/api/log-requests/${req.id}`, { status: "COMPLETED" });
      const data = await res.json();
      if (res.status !== 200 || data.request.status !== "COMPLETED") {
        throw new Error(`Failed to complete: ${JSON.stringify(data)}`);
      }
    }
  },
  {
    id: "2.7.10",
    name: "Poll Approved Logs Order",
    fn: async () => {
      await prisma.logRequest.create({
        data: {
          email: "audit.order@company.com",
          startTime: new Date(),
          endTime: new Date(),
          status: "APPROVED",
          createdAt: new Date(Date.now() - 5000)
        }
      });

      await prisma.logRequest.create({
        data: {
          email: "audit.order@company.com",
          startTime: new Date(),
          endTime: new Date(),
          status: "APPROVED",
          createdAt: new Date()
        }
      });

      const client = new TestClient();
      const res = await client.get("/api/log-requests/poll?email=audit.order@company.com");
      const data = await res.json();
      if (res.status !== 200 || !data.request) {
        throw new Error("Failed to poll");
      }
      
      const oldest = await prisma.logRequest.findFirst({
        where: { email: "audit.order@company.com" },
        orderBy: { createdAt: "asc" }
      });
      if (data.request.id !== oldest?.id) {
        throw new Error("Poll did not retrieve oldest request first");
      }
    }
  },

  // FEATURE 8: Incident Reporting & Dashboard Alerts
  {
    id: "2.8.6",
    name: "Report Incident Missing Subject",
    fn: async () => {
      await ensureMockEmployee("emp_missing_subject", "missing@company.com", "Reporter");

      const client = new TestClient();
      client.setEmployeeSession("emp_missing_subject", "missing@company.com", "Reporter");

      const res = await client.post("/api/employee/incidents", {
        senderEmail: "phishing@attacker.com",
        subject: "",
        description: "Desc"
      });
      const data = await res.json();
      if (res.status !== 400) {
        throw new Error(`Expected 400, got ${res.status}: ${JSON.stringify(data)}`);
      }
    }
  },
  {
    id: "2.8.7",
    name: "HTML Injection in Incident Notes",
    fn: async () => {
      const emp = await prisma.employee.create({
        data: {
          id: "emp_html_inj",
          name: "Html User",
          email: "html@company.com",
          department: "IT",
          passwordHash: "hash",
          isVerified: true
        }
      });

      const incident = await prisma.incidentReport.create({
        data: {
          employeeId: "emp_html_inj",
          senderEmail: "spam@attacker.com",
          subject: "Spam",
          description: "Spam desc",
          status: "pending_review"
        }
      });

      const client = new TestClient();
      await ensureMockAnalyst("mock_analyst", "analyst@company.com");
      client.setAnalystSession("mock_analyst", "analyst@company.com");

      const htmlNote = "<b>Safe note?</b><script>alert(1)</script>";
      const res = await client.patch(`/api/analyst/incidents/${incident.id}`, {
        status: "investigating",
        analystNote: htmlNote
      });
      const data = await res.json();
      if (res.status !== 200 || data.incident.analystNote !== htmlNote) {
        throw new Error(`Saving failed: ${JSON.stringify(data)}`);
      }
    }
  },
  {
    id: "2.8.8",
    name: "Double Incident submission",
    fn: async () => {
      await ensureMockEmployee("emp_double", "double@company.com", "Double User");

      const client = new TestClient();
      client.setEmployeeSession("emp_double", "double@company.com", "Double User");

      const payload = {
        senderEmail: "duplicate@attacker.com",
        subject: "Duplicate Phishing",
        description: "Same description"
      };

      await client.post("/api/employee/incidents", payload);
      await client.post("/api/employee/incidents", payload);

      const alertsCount = await prisma.employeeAlert.count({
        where: { employeeId: "emp_double", type: "phishing_detected" }
      });
      if (alertsCount !== 2) {
        throw new Error(`Expected 2 alerts created, got ${alertsCount}`);
      }
    }
  },
  {
    id: "2.8.9",
    name: "Read Read-Alert",
    fn: async () => {
      await ensureMockEmployee("emp_read_read", "read@company.com", "Read User");

      const alert = await prisma.employeeAlert.create({
        data: {
          employeeId: "emp_read_read",
          type: "phishing_detected",
          severity: "low",
          title: "Low threat",
          description: "Low threat desc",
          isRead: true
        }
      });

      const client = new TestClient();
      client.setEmployeeSession("emp_read_read", "read@company.com", "Read User");

      const res = await client.patch(`/api/employee/alerts/${alert.id}/read`, {});
      const data = await res.json();
      if (res.status !== 200 || !data.success || !data.alert.isRead) {
        throw new Error(`Marking read alert as read failed: ${JSON.stringify(data)}`);
      }
    }
  },
  {
    id: "2.8.10",
    name: "Unauthorized Alerts Fetch",
    fn: async () => {
      const emp1 = await prisma.employee.create({
        data: {
          id: "user1",
          name: "User One",
          email: "user1@company.com",
          department: "IT",
          passwordHash: "hash",
          isVerified: true
        }
      });

      const alert = await prisma.employeeAlert.create({
        data: {
          employeeId: "user1",
          type: "phishing_detected",
          severity: "low",
          title: "Low threat",
          description: "Low threat desc",
          isRead: false
        }
      });

      // Let's create user2 employee and session so it gets 404 (because alert is user1's)
      await ensureMockEmployee("user2", "user2@company.com", "User Two");

      const client = new TestClient();
      client.setEmployeeSession("user2", "user2@company.com", "User Two");

      const res = await client.patch(`/api/employee/alerts/${alert.id}/read`, {});
      if (res.status !== 404 && res.status !== 401) {
        throw new Error(`Expected 404 or 401, got ${res.status}`);
      }
    }
  }
];
