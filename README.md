<div align="center">

<img src="https://img.shields.io/badge/HRIP-Human%20Risk%20Intelligence%20Platform-00d4ff?style=for-the-badge&labelColor=0a0f1e" alt="HRIP"/>

# HRIP — Human Risk Intelligence Platform

**Real-time insider threat detection through multi-channel social engineering analysis and zero-trust endpoint telemetry.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python)](https://python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis)](https://redis.io/)
[![LightGBM](https://img.shields.io/badge/LightGBM-ML%20Model-green?style=flat-square)](https://lightgbm.readthedocs.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)](https://docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

<br/>

> **HRIP** is a cybersecurity platform that watches both the *messages employees receive* — phishing emails, smishing texts, vishing calls — and the *physical activity on their workstations* — USB insertions, clipboard copies, file access — and produces a continuously updated **Risk Score (0–100)** for every employee, visible to a security analyst on a live dashboard.

</div>

---

## Table of Contents

- [Why HRIP](#-why-hrip)
- [Architecture](#-architecture)
- [Detection Pipeline](#-detection-pipeline)
- [Endpoint Telemetry Pipeline](#-endpoint-telemetry-pipeline)
- [Risk Score System](#-risk-score-system)
- [Tech Stack](#-tech-stack)
- [Services](#-services)
- [Quick Start — Docker (Full Stack)](#-quick-start--docker-full-stack)
- [Quick Start — Local Development](#-quick-start--local-development)
- [The PC Agent](#-the-pc-agent)
- [Demo Accounts](#-demo-accounts)
- [Project Structure](#-project-structure)
- [Utility Commands](#-utility-commands)

---

## 🎯 Why HRIP

Most security tools only guard the network perimeter — firewalls, email scanners. HRIP is different because it **correlates two threat vectors** that are usually handled separately:

| Vector | What HRIP Watches |
|--------|------------------|
| **Social Engineering** | Phishing emails, smishing SMS, vishing voice calls targeting your employees |
| **Insider Threat** | USB devices, clipboard data, process activity, file access on employee workstations |

A person who receives a phishing email **and** plugs in a USB drive the same day gets a much higher risk score than someone who did only one. That correlation is what makes HRIP intelligent.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                    HRIP System Architecture                          │
├─────────────────────────────┬────────────────────────────────────────┤
│   MESSAGE DETECTION PATH    │       ENDPOINT TELEMETRY PATH          │
│                             │                                        │
│  [Email / SMS / Voice]      │      [Windows Workstation]             │
│          │                  │              │                         │
│          ▼                  │              ▼                         │
│    ┌──────────┐             │     ┌────────────────┐                │
│    │ Gateway  │             │     │  Python Agent  │                │
│    │ :8001    │             │     │  (7 threads)   │                │
│    └──────────┘             │     └────────────────┘                │
│          │ Redis Stream     │              │ HTTP POST /10s          │
│          ▼                  │              ▼                         │
│    ┌──────────────┐         │     ┌────────────────┐                │
│    │ Preprocessing│         │     │  Next.js API   │                │
│    │ (Clean+URLs) │         │     │  (Risk Rules)  │                │
│    └──────────────┘         │     └────────────────┘                │
│          │ Redis Stream     │              │ Redis Streams           │
│          ▼                  │              ▼                         │
│    ┌──────────────┐         │     ┌────────────────┐                │
│    │  Detection   │         │     │    Triage      │                │
│    │  LightGBM    │         │     │  Qwen 2.5 AI   │                │
│    │  + Qwen 2.5  │         │     └────────────────┘                │
│    └──────────────┘         │              │                         │
│          │                  │              │                         │
└──────────┼──────────────────┴──────────────┼───────────────────────┘
           │            BOTH MERGE           │
           └────────────────┬────────────────┘
                            ▼
                   ┌─────────────────┐
                   │  Risk Service   │
                   │  score: 0–100   │
                   │  decay: −5/day  │
                   └─────────────────┘
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
         PostgreSQL                   SQLite
        (backend store)            (frontend store)
               │                         │
               └────────────┬────────────┘
                            ▼
            ┌───────────────────────────────┐
            │       Next.js 14 Frontend     │
            │  Analyst Dashboard  │  Employee Portal  │
            └───────────────────────────────┘
```

---

## 🔍 Detection Pipeline

A phishing email's journey from arrival to the analyst's screen:

```
① POST /api/v1/ingest/email  →  Gateway Service
   └─ Saves to PostgreSQL + publishes to Redis Stream: raw.message

② Preprocessing Service consumes raw.message
   └─ Cleans text, extracts URLs, detects language, transcribes voice (Whisper)
   └─ Publishes → message.cleaned

③ Detection Service consumes message.cleaned
   ├─ Layer 1: Rules Engine  (urgent=18pts, wire transfer=30pts, OTP=20pts…)
   ├─ Layer 2: LightGBM ML  (TF-IDF + 8 psychology features → P(phishing) 0–1)
   └─ Layer 3: Qwen 2.5 LLM  (only escalated if LightGBM confidence ≥ 0.15)
              └─ Returns: threat_probability, detected_intent, reasoning narrative
   └─ SHAP explainability: top 3 contributing features stored per detection
   └─ Publishes → threat.detected

④ Risk Service consumes threat.detected
   └─ Applies delta (+35 phishing, +30 BEC, etc.)
   └─ Time decay: −5 pts per clean day
   └─ Score clamped to [0, 100]
   └─ Updates User.risk_score, risk_tier, data_access_level
```

**Threat Categories:** `phishing` · `smishing` · `vishing` · `CEO_fraud` · `benign`

---

## 🖥️ Endpoint Telemetry Pipeline

An employee plugging in a USB drive — every system event that fires:

```
① WMI Win32_DeviceChangeEvent fires in Agent's monitor_usb() thread
   └─ 10-second debounce (Windows fires 5–10 events per physical plug-in)
   └─ Adds USB event to internal events_queue

② flush_events() thread (runs every 10s)
   └─ POST /api/agent/telemetry  { events: [...] }
   └─ Bearer token authentication via AgentToken table

③ Next.js Telemetry API Route
   ├─ Hardcoded risk rules: USB→+5pts, VPN→+10pts, credit card clipboard→+12pts
   ├─ Deduplication: same alert type skipped if already fired within 60 minutes
   ├─ Score update: Math.min(100, current + delta)   ← capped at 100
   └─ Publishes to Redis Stream: hrip.events.usb

④ Triage Service consumes hrip.events.usb
   └─ Sends event to Qwen 2.5: "Rate suspiciousness 0–1, explain reasoning"
   └─ Creates AIFlag: suspicion_score, threat_category, reasoning, recommended_action
   └─ Publishes → hrip.flags.ai

⑤ Risk Service consumes hrip.flags.ai
   └─ delta = suspicion_score × 25  (Qwen score 0.8 → +20 risk points)
   └─ Updates user risk score
```

---

## 📊 Risk Score System

Every employee has a risk score between **0** and **100**.

### Score Tiers

| Score | Tier | Access Level |
|-------|------|-------------|
| **86 – 100** | 🔴 Critical | Suspended |
| **61 – 85** | 🟠 High Risk | Blocked |
| **31 – 60** | 🟡 Caution | Read Only |
| **0 – 30** | 🟢 Safe | Full Access |

### Event Deltas

| Event | Points |
|-------|--------|
| Phishing confirmed | **+35** |
| BEC / CEO Fraud | **+30** |
| USB mass copy | **+25** |
| File mass download | **+20** |
| Unknown USB device | **+20** |
| Unusual login | **+15** |
| Suspicious network (VPN) | **+10** |
| Clipboard — credential pattern | **+12** |
| Security training completed | **−20** |

### Time Decay
Every clean day (no events), the score drops by **5 points**. A score of 50 returns to 0 in 10 clean days — rewarding good behaviour.

### Formula
```
decayed  = current_score − (days_clean × 5.0)
new_score = clamp(decayed + event_delta, 0, 100)
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 (App Router) | Analyst Dashboard + Employee Portal |
| **UI** | Vanilla CSS + CSS custom properties | Dark glassmorphism design system |
| **Frontend DB** | SQLite via Prisma ORM | Sessions, training, telemetry logs |
| **Backend Services** | Python 3.11 + FastAPI | 6 async microservices |
| **Backend DB** | PostgreSQL 16 | Messages, detections, alerts, risk events |
| **Event Backbone** | Redis 7 Streams | Async communication between all services |
| **ML Model** | LightGBM + TF-IDF | Phishing probability classifier |
| **LLM** | Qwen 2.5 (local) | Deep threat analysis + endpoint behaviour |
| **Explainability** | SHAP TreeExplainer | Per-detection feature contributions |
| **Voice** | OpenAI Whisper | Vishing audio transcription |
| **Agent** | Python (win32, psutil, WMI) | Windows endpoint monitoring |
| **Deployment** | Docker Compose | One-command full-stack startup |
| **Auth** | bcrypt + HTTP-only cookies | Password hashing + session management |

---

## ⚙️ Services

| Service | Port | Description |
|---------|------|-------------|
| `gateway` | **8001** | Ingests email, SMS, voice — entry point for all messages |
| `preprocessing` | — | Cleans text, extracts URLs, transcribes audio |
| `detection` | — | Runs LightGBM → Qwen 2.5 → SHAP analysis pipeline |
| `risk` | — | Calculates and updates employee risk scores |
| `triage` | — | AI analysis of endpoint events (USB, file, clipboard) |
| `api` | **8000** | Read-only analyst data API |
| `frontend` | **3001** | Next.js — Analyst Dashboard + Employee Portal |
| `postgres` | 5432 | PostgreSQL database |
| `redis` | 6380 | Redis Streams event backbone |

---

## 🚀 Quick Start — Docker (Full Stack)

> Runs the complete enterprise stack: 6 Python services + PostgreSQL + Redis + Next.js frontend.

**Prerequisites:** Docker Desktop, Python 3.10+

```bash
# 1. Clone the repository
git clone https://github.com/IBM0PRJ/HRIP.git
cd HRIP

# 2. Configure environment
cp .env.example .env

# 3. Bootstrap database (creates tables + seeds demo data)
make bootstrap

# 4. Start the entire stack
docker compose up --build
```

**Access Points:**

| Service | URL |
|---------|-----|
| Analyst Dashboard | http://localhost:3001 |
| Employee Portal | http://localhost:3001/dashboard |
| Ingestion Gateway (API) | http://localhost:8001 |
| Analyst Read API | http://localhost:8000 |
| API Documentation | http://localhost:8001/docs |

---

## 💻 Quick Start — Local Development

> Runs only the Next.js frontend with SQLite — no Docker needed. Best for testing the dashboard quickly.

**Prerequisites:** Node.js 18+, Python 3.10+

```bash
# ── Terminal 1: Start the Web Dashboard ──────────────────────────
cd frontend
npm install
npx prisma db push        # creates SQLite tables
npm run dev               # → http://localhost:3000

# ── Terminal 2: Start the PC Agent ───────────────────────────────
cd agent
pip install -r requirements.txt
python agent.py           # starts all monitoring threads
```

**Agent Deployment (MDM Simulation — Windows only):**
```powershell
# Compiles to silent .exe and installs in Windows Startup folder
cd agent
.\deploy_mdm.ps1
```

---

## 🤖 The PC Agent

A silent Python agent deployed to Windows workstations via MDM. Runs 7 concurrent monitoring threads:

| Thread | Interval | What It Monitors |
|--------|---------|-----------------|
| `poll_config` | 30s | Syncs permission settings from server |
| `flush_events` | 10s | Batches and sends all queued events |
| `monitor_clipboard` | 2s | Detects credit cards, API keys (`sk-...`), credentials |
| `monitor_processes` | 10s | Top processes, active window, after-hours activity |
| `monitor_network` | 60s | Local IP, VPN detection (10.x / 172.x ranges) |
| `monitor_usb` | Event-driven | WMI hook — USB device insertions (10s debounce) |
| `scan_files` | Once/session | Scans `~/Documents` for sensitive filenames |

The analyst controls which monitoring modules are active, per employee, from the Permissions page.

---

## 👤 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| **Analyst** | `analyst@example.com` | `Analyst123!` |
| **Employee (CFO)** | `cfo@example.com` | `Employee123!` |
| **Admin** | `admin@example.com` | `ChangeMe123!` |

---

## 📁 Project Structure

```
HRIP/
├── agent/                          # Windows endpoint monitoring agent
│   ├── agent.py                    # Main agent — 7 monitoring threads
│   ├── config.json                 # API URL + Bearer token (per deployment)
│   └── deploy_mdm.ps1              # Compile to .exe + install to Startup
│
├── services/                       # Python FastAPI microservices
│   ├── gateway/                    # Email/SMS/Voice ingestion endpoint
│   ├── preprocessing/              # Text cleaning + URL extraction
│   ├── detection/                  # LightGBM + Qwen 2.5 + SHAP
│   │   └── app/engine/
│   │       ├── rules.py            # Keyword scoring rules engine
│   │       └── qwen_analyzer.py    # Qwen 2.5 LLM integration
│   ├── risk/                       # Risk score calculator
│   │   └── app/engine/calculator.py  # Score formula + time decay
│   ├── triage/                     # Endpoint event AI analysis
│   └── api/                        # Read-only analyst data API
│
├── shared/hrip_shared/             # Shared Python library (all services)
│   ├── contracts/events.py         # Pydantic event schemas
│   ├── utils/streams.py            # Redis stream name constants
│   ├── db/                         # SQLAlchemy models (PostgreSQL)
│   └── services/idempotency.py     # Duplicate event prevention
│
├── frontend/                       # Next.js 14 App Router application
│   ├── app/
│   │   ├── analyst/                # Analyst portal pages
│   │   ├── (employee)/dashboard/   # Employee portal pages
│   │   └── api/                    # Next.js API routes
│   │       └── agent/telemetry/    # Agent data ingestion + risk rules
│   ├── lib/
│   │   ├── db.ts                   # Prisma client (SQLite)
│   │   ├── redis.ts                # Redis client
│   │   └── session.ts              # Auth session helpers
│   ├── middleware.ts                # Route protection middleware
│   ├── prisma/schema.prisma        # SQLite table definitions
│   └── app/globals.css             # Full design system (64KB CSS)
│
├── models/saved/                   # Trained ML model artifacts
│   ├── lgbm_model.pkl              # LightGBM phishing classifier
│   └── tfidf_vectorizer.pkl        # TF-IDF text vectorizer
│
├── docker-compose.yml              # Full stack orchestration
├── .env.example                    # Environment variable template
└── Makefile                        # bootstrap / smoke / test / lint
```

---

## 🔧 Utility Commands

Run from the project root:

```bash
make bootstrap    # Create DB tables and seed demo users/data
make smoke        # End-to-end test: login → ingest phishing → check alerts
make test         # Run pytest suite
make lint         # Lint Python code with ruff
```

---

## 🎙️ Voice Ingestion (Vishing Detection)

HRIP supports audio file ingestion for deepfake/vishing call analysis.

```bash
# In .env — enable voice ingestion
VOICE_INGEST_ENABLED=true

# Optional: enable Whisper transcription (requires faster-whisper installed)
WHISPER_ENABLED=true
```

```bash
# Ingest a vishing audio file
curl -X POST http://localhost:8001/api/v1/ingest/voice \
  -F "file=@urgent-otp-call.wav" \
  -F "sender=attacker@external.com" \
  -F "receiver=cfo@yourcompany.com"
```

> Without Whisper installed, HRIP safely falls back to filename-derived mock transcripts (`urgent-otp-call.wav` → text containing "urgent" + "otp").

---

## 🔐 Security Design

| Concern | Implementation |
|---------|---------------|
| **Password storage** | bcrypt hashing (via `hrip_shared.auth.passwords`) |
| **Session auth** | HTTP-only cookies (`analyst_session` / `emp_session`) |
| **Route protection** | Next.js Middleware — checks cookie on every request |
| **Agent authentication** | Bearer token per-device, validated against `AgentToken` table |
| **Duplicate event prevention** | Idempotency table: `(service_name, redis_entry_id)` pairs |
| **Score overflow prevention** | All score math uses `min(max(value, 0), 100)` — hard capped |
| **Alert spam prevention** | Same alert type suppressed if fired within 60 minutes |

---

<div align="center">

**Built with Python · FastAPI · LightGBM · Qwen 2.5 · Redis Streams · Next.js 14 · Prisma · PostgreSQL · Docker**

</div>
