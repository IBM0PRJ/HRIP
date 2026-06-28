/**
 * In-memory store for MVP state management.
 * 
 * Tracks:
 * 1. Live Access Requests (from Employee trying to login)
 * 2. Employee Active Session State (for real-time Analyst lockouts)
 * 
 * Note: In a production environment, this would be a Postgres DB + WebSockets/Redis PubSub.
 * For this MVP, this in-memory object combined with client short-polling delivers the same UX instantly.
 */

export type RequestStatus = "pending" | "approved" | "denied";
export type SessionState = "active" | "isolated" | "reauth_required";

export interface AccessRequest {
  id: string;
  employeeName: string;
  employeeEmail: string;
  department: string;
  photoUrl: string; // Base64 data URL from webcam
  location: {
    lat: number;
    lng: number;
    formatted: string;
  };
  deviceType: string;
  status: RequestStatus;
  createdAt: number;
}

export interface EmployeeSession {
  userId: string;
  state: SessionState;
}

class Store {
  private requests: Map<string, AccessRequest> = new Map();
  private sessions: Map<string, EmployeeSession> = new Map();

  // --- Access Requests (Verification Flow) ---

  createRequest(req: Omit<AccessRequest, "id" | "status" | "createdAt">): AccessRequest {
    const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newReq: AccessRequest = {
      ...req,
      id,
      status: "pending",
      createdAt: Date.now(),
    };
    this.requests.set(id, newReq);
    return newReq;
  }

  getPendingRequests(): AccessRequest[] {
    return Array.from(this.requests.values())
      .filter((r) => r.status === "pending")
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  getRequest(id: string): AccessRequest | undefined {
    return this.requests.get(id);
  }

  updateRequestStatus(id: string, status: RequestStatus) {
    const req = this.requests.get(id);
    if (req) {
      req.status = status;
      this.requests.set(id, req);
    }
  }

  // --- Active Sessions (Zero-Trust Containment Flow) ---

  createSession(userId: string) {
    this.sessions.set(userId, { userId, state: "active" });
  }

  getSessionState(userId: string): SessionState {
    const session = this.sessions.get(userId);
    return session ? session.state : "active"; // Default active if not found
  }

  setSessionState(userId: string, state: SessionState) {
    this.sessions.set(userId, { userId, state });
  }
}

// Global singleton for Next.js dev environment to preserve state across HMR
const globalForStore = global as unknown as { store: Store };
export const store = globalForStore.store || new Store();
if (process.env.NODE_ENV !== "production") globalForStore.store = store;
