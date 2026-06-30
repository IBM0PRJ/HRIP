"use client";

import { useState, useEffect } from "react";

type AccessRequest = {
  id: string;
  employeeName: string;
  employeeEmail: string;
  department: string;
  photoUrl: string;
  location?: { lat: number; lng: number; formatted: string };
  deviceType: string;
  status: string;
  createdAt: string;
};

export default function AccessRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Poll for new requests every 3 seconds
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch("/api/auth/request");
        const data = await res.json();
        setRequests(data);
      } catch (e) {
        console.error("Failed to fetch requests", e);
      }
    };
    
    fetchRequests();
    const interval = setInterval(fetchRequests, 3000);
    return () => clearInterval(interval);
  }, []);

  const selectedReq = requests.find((r) => r.id === selectedId) || (requests.length > 0 ? requests[0] : null);

  const handleAction = async (id: string, action: "approved" | "denied") => {
    setLoadingAction(id);
    try {
      await fetch(`/api/auth/request/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      // Optimistically remove from list
      setRequests(prev => prev.filter(r => r.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="grid" style={{ gap: 20 }}>
      {/* Intro */}
      <section className="card pageIntro fadeIn delay0">
        <p className="eyebrow">Zero-Trust Authentication</p>
        <h2>Live Verifications</h2>
        <p className="heroCopy" style={{ marginTop: 8 }}>
          Review live biometric and location data for employees attempting to log into the portal.
          Approve verified identities to unlock device integration capabilities.
        </p>
      </section>

      <div className="queueSplit fadeIn delay1">
        
        {/* Left pane: The Queue */}
        <div className="card" style={{ padding: 16 }}>
          <div className="statLabel" style={{ marginBottom: 16 }}>Pending Requests ({requests.length})</div>
          
          {requests.length === 0 ? (
            <div className="emptyState" style={{ padding: "40px 10px" }}>
              <div className="emptyStateIcon">🛡️</div>
              <p className="muted" style={{ fontSize: "0.85rem" }}>Queue is empty. No employees are currently waiting for verification.</p>
            </div>
          ) : (
            <div className="queueList">
              {requests.map((req) => (
                <div 
                  key={req.id} 
                  className={`queueItem ${(selectedReq?.id === req.id) ? "active" : ""}`}
                  onClick={() => setSelectedId(req.id)}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{req.employeeName}</div>
                    <div className="muted" style={{ fontSize: "0.75rem", marginTop: 2 }}>{req.department}</div>
                  </div>
                  <div className="liveBadge">Live</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right pane: Verification Details */}
        <div className="verificationDetail">
          {!selectedReq ? (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p className="muted">Select a request from the queue to verify</p>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                  <h3 style={{ marginBottom: 4 }}>{selectedReq.employeeName}</h3>
                  <div className="muted">{selectedReq.employeeEmail}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="muted" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>Requested</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{new Date(selectedReq.createdAt).toLocaleTimeString()}</div>
                </div>
              </div>

              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div>
                  <div className="statLabel" style={{ marginBottom: 12 }}>Live Biometric Capture</div>
                  {selectedReq.photoUrl ? (
                    <img src={selectedReq.photoUrl} alt="Employee selfie" className="verificationPhoto" />
                  ) : (
                    <div className="verificationPhoto" style={{ display: "grid", placeItems: "center", background: "#111" }}>
                      No Photo Data
                    </div>
                  )}
                </div>

                <div>
                  <div className="statLabel" style={{ marginBottom: 12 }}>Location Data</div>
                  <div className="locationPanel" style={{ background: "rgba(0,0,0,0.2)", marginBottom: 16, flexDirection: "column", alignItems: "stretch", padding: 0, overflow: "hidden" }}>
                    <div style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
                      <div className="locPulse" />
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>GPS Locked</div>
                        <div className="muted" style={{ fontSize: "0.75rem" }}>{selectedReq.location?.formatted}</div>
                      </div>
                    </div>
                    {selectedReq.location && (
                      <iframe 
                        width="100%" 
                        height="180" 
                        frameBorder="0" 
                        scrolling="no" 
                        marginHeight={0} 
                        marginWidth={0} 
                        src={`https://maps.google.com/maps?q=${selectedReq.location.lat},${selectedReq.location.lng}&t=k&z=15&ie=UTF8&iwloc=&output=embed`}
                        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                      />
                    )}
                  </div>

                  <div className="statLabel" style={{ marginBottom: 12 }}>Device Info (Parsed)</div>
                  <dl className="detailList" style={{ fontSize: "0.8rem", background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 8 }}>
                    <div className="infoRow"><dt>IP Address</dt><dd>192.168.1.104</dd></div>
                    <div className="infoRow"><dt>Device Type</dt><dd>{selectedReq.deviceType}</dd></div>
                    <div className="infoRow"><dt>MDM Status</dt><dd style={{ color: "var(--success)" }}>Compliant</dd></div>
                  </dl>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
                <button 
                  className="buttonSecondary" 
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={() => handleAction(selectedReq.id, "denied")}
                  disabled={loadingAction === selectedReq.id}
                >
                  Deny Access
                </button>
                <button 
                  className="buttonPrimary" 
                  style={{ flex: 1, justifyContent: "center", background: "linear-gradient(to right, #d4b471, #e7b36b)", color: "#000", border: "none" }}
                  onClick={() => handleAction(selectedReq.id, "approved")}
                  disabled={loadingAction === selectedReq.id}
                >
                  {loadingAction === selectedReq.id ? "Processing..." : "Approve & Unlock Devices"}
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
