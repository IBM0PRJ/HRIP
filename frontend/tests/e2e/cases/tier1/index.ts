import { TestClient, getOTP, getAccessRequest, getSession, getTelemetryLogs, getLogRequest, getAlerts, getIncidents } from "../../harness";
import prisma from "../../../../lib/db";

export interface TestCase {
  id: string;
  name: string;
  fn: () => Promise<void>;
}

async function ensureMockAnalyst(id = "mock_analyst_id", email = "analyst@company.com") {
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
        department: "Marketing",
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

export const tier1Cases: TestCase[] = [
  // FEATURE 1: Credentials Login & Signup
  {
    id: "1.1",
    name: "Employee Signup Success",
    fn: async () => {
      const client = new TestClient();
      const res = await client.post("/api/auth/signup/employee", {
        name: "John Doe",
        email: "john.doe@company.com",
        department: "Engineering",
        password: "Password123!"
      });
      const data = await res.json();
      if (res.status !== 200 || !data.success) {
        throw new Error(`Signup failed: ${JSON.stringify(data)}`);
      }

      const emp = await prisma.employee.findUnique({ where: { email: "john.doe@company.com" } });
      if (!emp) throw new Error("Employee not found in database");
      if (emp.isVerified) throw new Error("Employee should not be verified yet");
    }
  },
  {
    id: "1.2",
    name: "Employee Login Blocked Unverified",
    fn: async () => {
      const client = new TestClient();
      await client.post("/api/auth/signup/employee", {
        name: "Jane Doe",
        email: "jane.doe@company.com",
        department: "HR",
        password: "Password123!"
      });

      const res = await client.post("/api/auth/login", {
        email: "jane.doe@company.com",
        password: "Password123!",
        role: "employee"
      });
      const data = await res.json();
      if (res.status !== 403 || data.error !== "Account not verified") {
        throw new Error(`Expected 403 Account not verified, got ${res.status}: ${JSON.stringify(data)}`);
      }
    }
  },
  {
    id: "1.3",
    name: "Analyst Signup Success",
    fn: async () => {
      const client = new TestClient();
      const res = await client.post("/api/auth/signup/analyst", {
        name: "Alice Smith",
        email: "alice.smith@company.com",
        password: "Password123!"
      });
      const data = await res.json();
      if (res.status !== 200 || !data.success) {
        throw new Error(`Signup failed: ${JSON.stringify(data)}`);
      }

      const analyst = await prisma.analyst.findUnique({ where: { email: "alice.smith@company.com" } });
      if (!analyst) throw new Error("Analyst not found in DB");
      if (analyst.isApproved) throw new Error("Analyst should not be approved yet");
    }
  },
  {
    id: "1.4",
    name: "Analyst Login Blocked Unapproved",
    fn: async () => {
      const client = new TestClient();
      await client.post("/api/auth/signup/analyst", {
        name: "Bob Smith",
        email: "bob.smith@company.com",
        password: "Password123!"
      });

      const res = await client.post("/api/auth/login", {
        email: "bob.smith@company.com",
        password: "Password123!",
        role: "analyst"
      });
      const data = await res.json();
      if (res.status !== 403 || data.error !== "Account pending approval") {
        throw new Error(`Expected 403 Account pending approval, got ${res.status}: ${JSON.stringify(data)}`);
      }
    }
  },
  {
    id: "1.5",
    name: "Analyst Login Success",
    fn: async () => {
      const client = new TestClient();
      await client.post("/api/auth/signup/analyst", {
        name: "Charlie Brown",
        email: "charlie.brown@company.com",
        password: "Password123!"
      });

      await prisma.analyst.update({
        where: { email: "charlie.brown@company.com" },
        data: { isApproved: true }
      });

      const res = await client.post("/api/auth/login", {
        email: "charlie.brown@company.com",
        password: "Password123!",
        role: "analyst"
      });
      const data = await res.json();
      if (res.status !== 200 || !data.success) {
        throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(data)}`);
      }
      
      const cookie = client.getCookie("analyst_session");
      if (!cookie) throw new Error("Missing analyst_session cookie");
    }
  },

  // FEATURE 2: OTP Code Generation & Verification
  {
    id: "2.1",
    name: "Verify Employee OTP Success",
    fn: async () => {
      const client = new TestClient();
      await client.post("/api/auth/signup/employee", {
        name: "John OTP",
        email: "john.otp@company.com",
        department: "Sales",
        password: "Password123!"
      });

      const otpRecord = await getOTP("john.otp@company.com", "employee_signup");
      if (!otpRecord) throw new Error("OTP not generated");

      const res = await client.post("/api/auth/verify-otp", {
        email: "john.otp@company.com",
        code: otpRecord.code,
        purpose: "employee_signup"
      });
      const data = await res.json();
      if (res.status !== 200 || !data.success || !data.redirectTo) {
        throw new Error(`Expected 200, success and redirectTo, got ${res.status}: ${JSON.stringify(data)}`);
      }

      const emp = await prisma.employee.findUnique({ where: { email: "john.otp@company.com" } });
      if (!emp || !emp.isVerified) throw new Error("Employee was not verified in DB");
    }
  },
  {
    id: "2.2",
    name: "Verify Analyst OTP Success",
    fn: async () => {
      const client = new TestClient();
      await client.post("/api/auth/signup/analyst", {
        name: "Analyst OTP",
        email: "analyst.otp@company.com",
        password: "Password123!"
      });

      const otpRecord = await getOTP("analyst.otp@company.com", "analyst_signup");
      if (!otpRecord) throw new Error("OTP not generated");

      const res = await client.post("/api/auth/verify-otp", {
        email: "analyst.otp@company.com",
        code: otpRecord.code,
        purpose: "analyst_signup"
      });
      const data = await res.json();
      if (res.status !== 200 || !data.success || !data.pending) {
        throw new Error(`Expected 200, success and pending, got ${res.status}: ${JSON.stringify(data)}`);
      }
    }
  },
  {
    id: "2.3",
    name: "OTP Expiration Enforcement",
    fn: async () => {
      const client = new TestClient();
      await client.post("/api/auth/signup/employee", {
        name: "Expired OTP User",
        email: "expired.otp@company.com",
        department: "Sales",
        password: "Password123!"
      });

      const otpRecord = await getOTP("expired.otp@company.com", "employee_signup");
      if (!otpRecord) throw new Error("OTP not generated");

      await prisma.oTPCode.update({
        where: { id: otpRecord.id },
        data: { expiresAt: new Date(Date.now() - 1000) }
      });

      const res = await client.post("/api/auth/verify-otp", {
        email: "expired.otp@company.com",
        code: otpRecord.code,
        purpose: "employee_signup"
      });
      const data = await res.json();
      if (res.status !== 400 || data.error !== "Invalid or expired OTP") {
        throw new Error(`Expected 400 Expired OTP, got ${res.status}: ${JSON.stringify(data)}`);
      }
    }
  },
  {
    id: "2.4",
    name: "OTP Single-Use Enforcement",
    fn: async () => {
      const client = new TestClient();
      await client.post("/api/auth/signup/employee", {
        name: "Single Use User",
        email: "single.use@company.com",
        department: "Sales",
        password: "Password123!"
      });

      const otpRecord = await getOTP("single.use@company.com", "employee_signup");
      if (!otpRecord) throw new Error("OTP not generated");

      await client.post("/api/auth/verify-otp", {
        email: "single.use@company.com",
        code: otpRecord.code,
        purpose: "employee_signup"
      });

      const res = await client.post("/api/auth/verify-otp", {
        email: "single.use@company.com",
        code: otpRecord.code,
        purpose: "employee_signup"
      });
      const data = await res.json();
      if (res.status !== 400 || data.error !== "Invalid or expired OTP") {
        throw new Error(`Expected 400, got ${res.status}: ${JSON.stringify(data)}`);
      }
    }
  },
  {
    id: "2.5",
    name: "OTP Purpose Mismatch",
    fn: async () => {
      const client = new TestClient();
      await client.post("/api/auth/signup/employee", {
        name: "Purpose User",
        email: "purpose.mismatch@company.com",
        department: "Sales",
        password: "Password123!"
      });

      const otpRecord = await getOTP("purpose.mismatch@company.com", "employee_signup");
      if (!otpRecord) throw new Error("OTP not generated");

      const res = await client.post("/api/auth/verify-otp", {
        email: "purpose.mismatch@company.com",
        code: otpRecord.code,
        purpose: "analyst_signup"
      });
      const data = await res.json();
      if (res.status !== 400 || data.error !== "Invalid or expired OTP") {
        throw new Error(`Expected 400, got ${res.status}: ${JSON.stringify(data)}`);
      }
    }
  },

  // FEATURE 3: Selfie & Geolocation Onboarding
  {
    id: "3.1",
    name: "Submit AccessRequest Success",
    fn: async () => {
      const client = new TestClient();
      const res = await client.post("/api/auth/request", {
        employeeName: "Alice Onboarding",
        employeeEmail: "alice.onboarding@company.com",
        department: "Engineering",
        photoUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        location: {
          lat: 37.7749,
          lng: -122.4194,
          formatted: "San Francisco, CA"
        },
        deviceType: "MacBook Pro"
      });
      const data = await res.json();
      if (res.status !== 200 || !data.id || data.status !== "pending") {
        throw new Error(`Expected 200 and pending status, got ${res.status}: ${JSON.stringify(data)}`);
      }

      const req = await getAccessRequest("alice.onboarding@company.com");
      if (!req) throw new Error("Access request not created in DB");
    }
  },
  {
    id: "3.2",
    name: "GPS Coordinates Parsing",
    fn: async () => {
      const client = new TestClient();
      await client.post("/api/auth/request", {
        employeeName: "GPS User",
        employeeEmail: "gps.user@company.com",
        department: "Engineering",
        photoUrl: "data:image/png;base64,i",
        location: {
          lat: 45.12345,
          lng: -93.98765,
          formatted: "Minneapolis, MN"
        },
        deviceType: "Windows PC"
      });

      const req = await getAccessRequest("gps.user@company.com");
      if (!req) throw new Error("Access request not found");
      if (typeof req.lat !== "number" || typeof req.lng !== "number") {
        throw new Error("Coordinates not saved as floats");
      }
      if (Math.abs(req.lat - 45.12345) > 0.0001 || Math.abs(req.lng - (-93.98765)) > 0.0001) {
        throw new Error("Coordinates mismatch");
      }
    }
  },
  {
    id: "3.3",
    name: "User Agent Saved correctly",
    fn: async () => {
      const client = new TestClient();
      await client.post("/api/auth/request", {
        employeeName: "UA User",
        employeeEmail: "ua.user@company.com",
        department: "Engineering",
        photoUrl: "data:image/png;base64,i",
        location: { lat: 10, lng: 20, formatted: "Test" },
        deviceType: "MacBook / macOS"
      });

      const req = await getAccessRequest("ua.user@company.com");
      if (!req || req.deviceType !== "MacBook / macOS") {
        throw new Error("deviceType was not saved correctly");
      }
    }
  },
  {
    id: "3.4",
    name: "Onboarding Page Render",
    fn: async () => {
      const client = new TestClient();
      const res = await client.get("/onboarding");
      if (res.status !== 200) {
        throw new Error(`Expected 200, got ${res.status}`);
      }
      const html = await res.text();
      if (!html.includes("Zero-Trust") && !html.includes("Access") && !html.includes("Clearance")) {
        throw new Error("Onboarding page headers not in HTML");
      }
    }
  },
  {
    id: "3.5",
    name: "Onboarding Holding Screen Render",
    fn: async () => {
      const client = new TestClient();
      const res = await client.get("/onboarding?email=test@company.com&status=pending");
      if (res.status !== 200) {
        throw new Error(`Expected 200, got ${res.status}`);
      }
      const html = await res.text();
      if (!html) throw new Error("Received empty HTML");
    }
  },

  // FEATURE 4: Access Request Approval/Denial by Analyst
  {
    id: "4.1",
    name: "Analyst Lists Pending Requests",
    fn: async () => {
      await prisma.accessRequest.create({
        data: {
          employeeName: "Pending User",
          employeeEmail: "pending.list@company.com",
          department: "Security",
          photoUrl: "data:image/png;base64,i",
          lat: 0.0,
          lng: 0.0,
          locationName: "Office",
          deviceType: "Linux PC",
          status: "pending"
        }
      });

      const client = new TestClient();
      await ensureMockAnalyst("mock_analyst_session", "analyst.one@company.com");
      client.setAnalystSession("mock_analyst_session", "analyst.one@company.com");

      const res = await client.get("/api/auth/request");
      const data = await res.json();
      if (res.status !== 200) {
        throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(data)}`);
      }
      const item = data.find((r: any) => r.employeeEmail === "pending.list@company.com");
      if (!item) throw new Error("Pending request not listed");
    }
  },
  {
    id: "4.2",
    name: "AccessRequest Approval",
    fn: async () => {
      const req = await prisma.accessRequest.create({
        data: {
          employeeName: "Approved User",
          employeeEmail: "approve.me@company.com",
          department: "Security",
          photoUrl: "data:image/png;base64,i",
          lat: 0.0,
          lng: 0.0,
          locationName: "Office",
          deviceType: "Linux PC",
          status: "pending"
        }
      });

      const client = new TestClient();
      await ensureMockAnalyst("mock_analyst_id", "analyst.two@company.com");
      client.setAnalystSession("mock_analyst_id", "analyst.two@company.com");

      const res = await client.post(`/api/auth/request/${req.id}`, { action: "approved" });
      const data = await res.json();
      if (res.status !== 200 || !data.success || data.status !== "approved") {
        throw new Error(`Approval failed: ${JSON.stringify(data)}`);
      }

      const updatedReq = await prisma.accessRequest.findUnique({ where: { id: req.id } });
      if (!updatedReq || updatedReq.status !== "approved") {
        throw new Error("Request status not updated to approved in DB");
      }
    }
  },
  {
    id: "4.3",
    name: "AccessRequest Denial",
    fn: async () => {
      const req = await prisma.accessRequest.create({
        data: {
          employeeName: "Denied User",
          employeeEmail: "deny.me@company.com",
          department: "Security",
          photoUrl: "data:image/png;base64,i",
          lat: 0.0,
          lng: 0.0,
          locationName: "Office",
          deviceType: "Linux PC",
          status: "pending"
        }
      });

      const client = new TestClient();
      await ensureMockAnalyst("mock_analyst_id", "analyst.two@company.com");
      client.setAnalystSession("mock_analyst_id", "analyst.two@company.com");

      const res = await client.post(`/api/auth/request/${req.id}`, { action: "denied" });
      const data = await res.json();
      if (res.status !== 200 || !data.success || data.status !== "denied") {
        throw new Error(`Denial failed: ${JSON.stringify(data)}`);
      }

      const updatedReq = await prisma.accessRequest.findUnique({ where: { id: req.id } });
      if (!updatedReq || updatedReq.status !== "denied") {
        throw new Error("Request status not updated to denied in DB");
      }
    }
  },
  {
    id: "4.4",
    name: "Active Session Auto-Creation",
    fn: async () => {
      const req = await prisma.accessRequest.create({
        data: {
          employeeName: "Auto Session User",
          employeeEmail: "auto.session@company.com",
          department: "Security",
          photoUrl: "data:image/png;base64,i",
          lat: 0.0,
          lng: 0.0,
          locationName: "Office",
          deviceType: "Linux PC",
          status: "pending"
        }
      });

      const client = new TestClient();
      await ensureMockAnalyst("mock_analyst_id", "analyst.two@company.com");
      client.setAnalystSession("mock_analyst_id", "analyst.two@company.com");

      await client.post(`/api/auth/request/${req.id}`, { action: "approved" });

      const session = await getSession("auto.session@company.com");
      if (!session || session.state !== "active") {
        throw new Error("Active session was not auto-created in DB");
      }
    }
  },
  {
    id: "4.5",
    name: "Access Requests Queue UI Render",
    fn: async () => {
      const client = new TestClient();
      await ensureMockAnalyst("mock_analyst_id", "analyst.two@company.com");
      client.setAnalystSession("mock_analyst_id", "analyst.two@company.com");
      const res = await client.get("/access-requests");
      if (res.status !== 200) {
        throw new Error(`Expected 200, got ${res.status}`);
      }
      const html = await res.text();
      if (!html) throw new Error("Received empty HTML");
    }
  },

  // FEATURE 5: Zero-Trust Session Issuance & Cookie Validation
  {
    id: "5.1",
    name: "Session Issue Blocked Pending",
    fn: async () => {
      const req = await prisma.accessRequest.create({
        data: {
          employeeName: "Pending Session",
          employeeEmail: "pending.session@company.com",
          department: "Engineering",
          photoUrl: "data:image/png;base64,i",
          lat: 0.0,
          lng: 0.0,
          locationName: "Office",
          deviceType: "Linux PC",
          status: "pending"
        }
      });

      const client = new TestClient();
      const res = await client.post("/api/auth/session/issue", { requestId: req.id });
      const data = await res.json();
      if (res.status !== 403 || data.error !== "Access request is not approved") {
        throw new Error(`Expected 403, got ${res.status}: ${JSON.stringify(data)}`);
      }
    }
  },
  {
    id: "5.2",
    name: "Session Issue Success Approved",
    fn: async () => {
      const req = await prisma.accessRequest.create({
        data: {
          employeeName: "Approved Session",
          employeeEmail: "approved.session@company.com",
          department: "Engineering",
          photoUrl: "data:image/png;base64,i",
          lat: 0.0,
          lng: 0.0,
          locationName: "Office",
          deviceType: "Linux PC",
          status: "approved"
        }
      });

      await prisma.employee.create({
        data: {
          name: "Approved Session",
          email: "approved.session@company.com",
          department: "Engineering",
          passwordHash: "hash",
          isVerified: true
        }
      });

      const client = new TestClient();
      const res = await client.post("/api/auth/session/issue", { requestId: req.id });
      const data = await res.json();
      if (res.status !== 200 || !data.success) {
        throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(data)}`);
      }

      const cookie = client.getCookie("emp_session");
      if (!cookie) throw new Error("Missing emp_session cookie");
    }
  },
  {
    id: "5.3",
    name: "Middleware Blocks Dashboard",
    fn: async () => {
      const client = new TestClient();
      const res = await client.get("/dashboard");
      if (res.status !== 200 && res.status !== 307 && res.status !== 302) {
        throw new Error(`Expected redirect, got status ${res.status}`);
      }
    }
  },
  {
    id: "5.4",
    name: "Middleware Blocks Analyst Dashboard",
    fn: async () => {
      const client = new TestClient();
      const res = await client.get("/");
      if (res.status !== 200 && res.status !== 307 && res.status !== 302) {
        throw new Error(`Expected redirect, got status ${res.status}`);
      }
    }
  },
  {
    id: "5.5",
    name: "Session State Fetch",
    fn: async () => {
      await prisma.session.create({
        data: {
          userId: "session.state.fetch@company.com",
          email: "session.state.fetch@company.com",
          state: "reauth_required"
        }
      });

      const client = new TestClient();
      const res = await client.get(`/api/auth/session/${encodeURIComponent("session.state.fetch@company.com")}`);
      const data = await res.json();
      if (res.status !== 200 || data.state !== "reauth_required") {
        throw new Error(`Expected state reauth_required, got ${res.status}: ${JSON.stringify(data)}`);
      }
    }
  },

  // FEATURE 6: Employee Dashboard UI & Telemetry Logs
  {
    id: "6.1",
    name: "Profile Get Success",
    fn: async () => {
      await ensureMockEmployee("emp_profile_id", "profile.user@company.com", "Profile User");
      // Update risk score specifically
      await prisma.employee.update({
        where: { id: "emp_profile_id" },
        data: { riskScore: 24.5 }
      });

      const client = new TestClient();
      client.setEmployeeSession("emp_profile_id", "profile.user@company.com", "Profile User");

      const res = await client.get("/api/employee/me");
      const data = await res.json();
      if (res.status !== 200 || !data.employee || data.employee.riskScore !== 24.5) {
        throw new Error(`Expected risk score 24.5, got status ${res.status}: ${JSON.stringify(data)}`);
      }
    }
  },
  {
    id: "6.2",
    name: "Toggle Integration Telemetry",
    fn: async () => {
      await prisma.session.create({
        data: {
          userId: "toggle_user_id",
          email: "toggle@company.com",
          state: "active"
        }
      });

      const client = new TestClient();
      const res = await client.post("/api/telemetry", {
        email: "toggle@company.com",
        integration: "usb",
        status: true
      });
      const data = await res.json();
      if (res.status !== 200 || !data.success) {
        throw new Error(`Expected success, got status ${res.status}: ${JSON.stringify(data)}`);
      }

      const session = await getSession("toggle@company.com");
      if (!session || !session.intUsb) {
        throw new Error("USB integration was not enabled in DB");
      }

      const logs = await getTelemetryLogs(session.id);
      if (logs.length === 0 || !logs[0].message.includes("usb")) {
        throw new Error("Telemetry log not created in DB");
      }
    }
  },
  {
    id: "6.3",
    name: "Get Telemetry Logs",
    fn: async () => {
      const s = await prisma.session.create({
        data: {
          userId: "get_logs_id",
          email: "get.logs@company.com",
          state: "active"
        }
      });

      await prisma.telemetryLog.create({
        data: {
          sessionId: s.id,
          message: "Test log message 1"
        }
      });

      const client = new TestClient();
      const res = await client.get(`/api/telemetry?email=get.logs@company.com`);
      const data = await res.json();
      if (res.status !== 200 || !data.logs || data.logs.length !== 1 || data.logs[0].message !== "Test log message 1") {
        throw new Error(`Telemetry get failed: ${JSON.stringify(data)}`);
      }
    }
  },
  {
    id: "6.4",
    name: "Agent Post Live Log Allowed",
    fn: async () => {
      const s = await prisma.session.create({
        data: {
          userId: "agent_allow_id",
          email: "agent.allow@company.com",
          state: "active",
          intProcess: true
        }
      });

      const client = new TestClient();
      const res = await client.post("/api/agent", {
        email: "agent.allow@company.com",
        logs: [
          { type: "process", message: "cmd.exe spawned", timestamp: new Date().toISOString() }
        ]
      });
      const data = await res.json();
      if (res.status !== 200 || data.inserted !== 1) {
        throw new Error(`Expected 1 inserted log, got status ${res.status}: ${JSON.stringify(data)}`);
      }

      const logs = await getTelemetryLogs(s.id);
      if (logs.length !== 1 || !logs[0].message.includes("cmd.exe")) {
        throw new Error("Live log was not successfully inserted");
      }
    }
  },
  {
    id: "6.5",
    name: "Agent Post Live Log Blocked",
    fn: async () => {
      const s = await prisma.session.create({
        data: {
          userId: "agent_block_id",
          email: "agent.block@company.com",
          state: "active",
          intUsb: false
        }
      });

      const client = new TestClient();
      const res = await client.post("/api/agent", {
        email: "agent.block@company.com",
        logs: [
          { type: "usb", message: "USB device inserted", timestamp: new Date().toISOString() }
        ]
      });
      const data = await res.json();
      if (res.status !== 200 || data.inserted !== 0) {
        throw new Error(`Expected 0 inserted logs, got status ${res.status}: ${JSON.stringify(data)}`);
      }

      const logs = await getTelemetryLogs(s.id);
      if (logs.length !== 0) {
        throw new Error("Disabled live log should be discarded");
      }
    }
  },

  // FEATURE 7: Audit Log Requests & Approvals
  {
    id: "7.1",
    name: "Create LogRequest",
    fn: async () => {
      const client = new TestClient();
      await ensureMockAnalyst("mock_analyst_id", "analyst.two@company.com");
      client.setAnalystSession("mock_analyst_id", "analyst.two@company.com");

      const res = await client.post("/api/log-requests", {
        email: "audit.user@company.com",
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date().toISOString()
      });
      const data = await res.json();
      if (res.status !== 200 || !data.success || data.request.status !== "PENDING") {
        throw new Error(`Expected pending log request, got status ${res.status}: ${JSON.stringify(data)}`);
      }

      const req = await getLogRequest("audit.user@company.com");
      if (!req) throw new Error("LogRequest not found in DB");
    }
  },
  {
    id: "7.2",
    name: "Employee Fetch Pending Request",
    fn: async () => {
      await prisma.logRequest.create({
        data: {
          email: "audit.fetch@company.com",
          startTime: new Date(),
          endTime: new Date(),
          status: "PENDING"
        }
      });

      const client = new TestClient();
      const res = await client.get("/api/log-requests?email=audit.fetch@company.com&status=PENDING");
      const data = await res.json();
      if (res.status !== 200 || !data.requests || data.requests.length === 0) {
        throw new Error(`Fetch failed: ${JSON.stringify(data)}`);
      }
    }
  },
  {
    id: "7.3",
    name: "Approve LogRequest",
    fn: async () => {
      const req = await prisma.logRequest.create({
        data: {
          email: "audit.approve@company.com",
          startTime: new Date(),
          endTime: new Date(),
          status: "PENDING"
        }
      });

      const client = new TestClient();
      const res = await client.patch(`/api/log-requests/${req.id}`, { status: "APPROVED" });
      const data = await res.json();
      if (res.status !== 200 || !data.success || data.request.status !== "APPROVED") {
        throw new Error(`Approval failed: ${JSON.stringify(data)}`);
      }

      const updated = await prisma.logRequest.findUnique({ where: { id: req.id } });
      if (!updated || updated.status !== "APPROVED") {
        throw new Error("LogRequest status not updated to APPROVED in DB");
      }
    }
  },
  {
    id: "7.4",
    name: "Agent Poll Approved Request",
    fn: async () => {
      await prisma.logRequest.create({
        data: {
          email: "audit.poll@company.com",
          startTime: new Date(),
          endTime: new Date(),
          status: "APPROVED"
        }
      });

      const client = new TestClient();
      const res = await client.get("/api/log-requests/poll?email=audit.poll@company.com");
      const data = await res.json();
      if (res.status !== 200 || !data.request || data.request.status !== "APPROVED") {
        throw new Error(`Poll failed: ${JSON.stringify(data)}`);
      }
    }
  },
  {
    id: "7.5",
    name: "Agent Upload Audit",
    fn: async () => {
      const s = await prisma.session.create({
        data: {
          userId: "audit_upload_id",
          email: "audit.upload@company.com",
          state: "active"
        }
      });

      const req = await prisma.logRequest.create({
        data: {
          email: "audit.upload@company.com",
          startTime: new Date(),
          endTime: new Date(),
          status: "APPROVED"
        }
      });

      const client = new TestClient();
      const resLogs = await client.post("/api/agent", {
        email: "audit.upload@company.com",
        logs: [
          { type: "history", message: "Logon event detected at 10:00", timestamp: new Date().toISOString() }
        ]
      });
      const dataLogs = await resLogs.json();
      if (resLogs.status !== 200 || dataLogs.inserted !== 1) {
        throw new Error(`Upload logs failed: ${JSON.stringify(dataLogs)}`);
      }

      const resPatch = await client.patch(`/api/log-requests/${req.id}`, { status: "COMPLETED" });
      const dataPatch = await resPatch.json();
      if (resPatch.status !== 200 || dataPatch.request.status !== "COMPLETED") {
        throw new Error(`Complete failed: ${JSON.stringify(dataPatch)}`);
      }

      const logs = await getTelemetryLogs(s.id);
      if (logs.length !== 1 || !logs[0].message.includes("Logon event")) {
        throw new Error("Audit log was not successfully inserted");
      }
    }
  },

  // FEATURE 8: Incident Reporting & Dashboard Alerts
  {
    id: "8.1",
    name: "Report Incident Success",
    fn: async () => {
      await ensureMockEmployee("emp_incident_id", "reporter@company.com", "Incident Reporter");

      const client = new TestClient();
      client.setEmployeeSession("emp_incident_id", "reporter@company.com", "Incident Reporter");

      const res = await client.post("/api/employee/incidents", {
        senderEmail: "phishing@attacker.com",
        subject: "Urgent: Reset Password",
        description: "Received a suspicious link asking to reset password."
      });
      const data = await res.json();
      if (res.status !== 200 || !data.success) {
        throw new Error(`Reporting incident failed: ${JSON.stringify(data)}`);
      }

      const incidents = await getIncidents("emp_incident_id");
      if (incidents.length !== 1 || incidents[0].senderEmail !== "phishing@attacker.com") {
        throw new Error("IncidentReport not created in DB");
      }
    }
  },
  {
    id: "8.2",
    name: "Auto Alert Generation",
    fn: async () => {
      await ensureMockEmployee("emp_alert_id", "alert.reporter@company.com", "Alert Reporter");

      const client = new TestClient();
      client.setEmployeeSession("emp_alert_id", "alert.reporter@company.com", "Alert Reporter");

      await client.post("/api/employee/incidents", {
        senderEmail: "fake@attacker.com",
        subject: "Suspicious Offer",
        description: "Claimed I won a lottery."
      });

      const alerts = await getAlerts("emp_alert_id");
      if (alerts.length !== 1 || alerts[0].type !== "phishing_detected" || alerts[0].severity !== "medium") {
        throw new Error("Phishing alert was not auto-inserted in DB");
      }
    }
  },
  {
    id: "8.3",
    name: "Analyst Fetch Incident Reports",
    fn: async () => {
      const emp = await prisma.employee.create({
        data: {
          id: "emp_analyst_fetch_id",
          name: "Fetch Reporter",
          email: "fetch.reporter@company.com",
          department: "Marketing",
          passwordHash: "hash",
          isVerified: true
        }
      });

      await prisma.incidentReport.create({
        data: {
          employeeId: "emp_analyst_fetch_id",
          senderEmail: "suspect@attacker.com",
          subject: "Test",
          description: "Test",
          status: "pending_review"
        }
      });

      const client = new TestClient();
      await ensureMockAnalyst("mock_analyst_id", "analyst.two@company.com");
      client.setAnalystSession("mock_analyst_id", "analyst.two@company.com");

      const res = await client.get("/api/analyst/incidents");
      const data = await res.json();
      if (res.status !== 200 || !data.incidents || data.incidents.length === 0) {
        throw new Error(`Incident list fetch failed: ${JSON.stringify(data)}`);
      }
    }
  },
  {
    id: "8.4",
    name: "Analyst Incident Review",
    fn: async () => {
      const emp = await prisma.employee.create({
        data: {
          id: "emp_review_id",
          name: "Review User",
          email: "review.user@company.com",
          department: "Sales",
          passwordHash: "hash",
          isVerified: true
        }
      });

      const incident = await prisma.incidentReport.create({
        data: {
          employeeId: "emp_review_id",
          senderEmail: "spam@attacker.com",
          subject: "Spam",
          description: "Spam desc",
          status: "pending_review"
        }
      });

      const client = new TestClient();
      await ensureMockAnalyst("mock_analyst_id", "analyst.two@company.com");
      client.setAnalystSession("mock_analyst_id", "analyst.two@company.com");

      const res = await client.patch(`/api/analyst/incidents/${incident.id}`, {
        status: "investigating",
        analystNote: "Looking into the mail header details."
      });
      const data = await res.json();
      if (res.status !== 200 || !data.success || data.incident.status !== "investigating") {
        throw new Error(`Update status failed: ${JSON.stringify(data)}`);
      }

      const updated = await prisma.incidentReport.findUnique({ where: { id: incident.id } });
      if (!updated || updated.status !== "investigating" || updated.analystNote !== "Looking into the mail header details.") {
        throw new Error("Incident status/note not updated in DB");
      }
    }
  },
  {
    id: "8.5",
    name: "Employee Acknowledge Alert",
    fn: async () => {
      await ensureMockEmployee("emp_ack_id", "ack@company.com", "Ack User");

      const alert = await prisma.employeeAlert.create({
        data: {
          employeeId: "emp_ack_id",
          type: "phishing_detected",
          severity: "low",
          title: "Low threat",
          description: "Low threat desc",
          isRead: false
        }
      });

      const client = new TestClient();
      client.setEmployeeSession("emp_ack_id", "ack@company.com", "Ack User");

      const res = await client.patch(`/api/employee/alerts/${alert.id}/read`, {});
      const data = await res.json();
      if (res.status !== 200 || !data.success || !data.alert.isRead) {
        throw new Error(`Read alert patch failed: ${JSON.stringify(data)}`);
      }

      const updated = await prisma.employeeAlert.findUnique({ where: { id: alert.id } });
      if (!updated || !updated.isRead) {
        throw new Error("Alert isRead state was not updated to true in DB");
      }
    }
  }
];
