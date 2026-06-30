# HRIP — Project Progress & Handoff Document

> **For the team:** This document tells you exactly what we built, what the original plan said, how much is done, and — most importantly — how YOUR team can continue building it from here. Read it top to bottom before touching any code.

---

## 🗺️ Quick Summary

The original Blueprint planned an 8-week build across 5 backend microservices, 1 AI engine, 1 frontend dashboard, and 1 telemetry agent.

**Overall Progress: ~60% of the full Blueprint MVP is complete.**

| Area | Status | Notes |
|---|---|---|
| Frontend Dashboard (Analyst) | ✅ Done | Far exceeds Blueprint spec |
| Frontend Dashboard (Employee Portal) | ✅ Done | Not in Blueprint — bonus feature |
| Authentication System (OTP, JWT, Zero-Trust) | ✅ Done | Fully working |
| Native Endpoint Agent (Windows) | ✅ Done | Not in Blueprint — bonus feature |
| Gateway Service (Backend) | ✅ Done (basic) | Email, SMS & Voice ingest working |
| Preprocessing Service (Backend) | ✅ Done (basic) | Text cleaning & Whisper STT working |
| Detection Service – Rules Engine | ✅ Done (basic) | Rules logic implemented |
| Detection Service – LightGBM ML Model | ❌ Not Done | Needs training & wiring |
| Detection Service – RoBERTa AI Model | ❌ Not Done | Needs Colab fine-tuning |
| Detection Service – SHAP Explanations | ❌ Not Done | Blocked on AI models |
| Risk Engine (Backend) | ✅ Done (basic) | Basic formula implemented |
| Database Schema | ⚠️ Partial | Two separate databases exist (see below) |
| Kafka Message Queue | ❌ Not Done | Redis Streams used instead |
| Threat Intelligence (OpenPhish, PhishTank) | ❌ Not Done | Not yet wired in |
| GitHub Actions CI/CD Pipeline | ❌ Not Done | No CI yet |
| Oracle Cloud Deployment | ❌ Not Done | Running locally only |

---

## ✅ What Is Fully Built and Working

### 1. The Analyst Dashboard (Frontend)

**What it is:** A web application that a security analyst uses to monitor employees, review alerts, and investigate suspicious activity.

**What is built:**
- A complete dark-themed Analyst Dashboard at `/analyst`
- **Alert Queue** (`/analyst/alerts`) — lists every detected threat with severity badges (Critical/High/Medium/Low)
- **Investigation Console** (`/analyst/alerts/[id]`) — the flagship screen: shows the full message, risk breakdown, and lets the analyst change alert status
- **Employee Risk Profiles** (`/analyst/users` and `/analyst/users/[id]`) — shows every monitored employee, their risk score, device telemetry, and containment tools
- **Live Telemetry Stream** (`/analyst/stream`) — a real-time feed of OS-level events from employee laptops
- **Permissions & MDM Deployment** (`/analyst/permissions`) — lets the analyst push a monitoring request to an employee device
- **Access Requests Queue** (`/analyst/access-requests`) — review and approve/deny user onboarding requests
- **Pending Signups** (`/analyst/pending-signups`) — approve or deny new analyst accounts
- **Incidents** (`/analyst/incidents`) — track escalated incidents

**Blueprint says:** 5 screens. We built all 5 AND added 5 more.

---

### 2. The Employee Portal (Frontend)

> **Note:** The Blueprint did not include an Employee Portal. This was built as a major bonus feature.

**What is built:**
- Employee personal dashboard with their own risk score
- Personal alerts page — employees can see threats directed at them
- Training modules page — employees can view and complete assigned training
- Activity feed — shows recent security events on their account
- Zero-Trust onboarding — the employee must submit a selfie and GPS location before getting access

---

### 3. The Authentication System

**What is built:**
- **OTP Email Verification** — employees receive a 6-digit code by email to verify their account
- **Analyst Approval Gate** — new analyst accounts must be approved by an existing analyst
- **Zero-Trust Onboarding** — selfie + GPS location submission before employee access is granted
- **JWT Session Cookies** — secure cookie-based sessions (30 min for employees, 24h for analysts)
- **Role-Based Access** — app knows whether you are an analyst or employee and shows different pages
- **Route Middleware** — unauthenticated users are automatically redirected to login

---

### 4. The Native Endpoint Agent (Windows)

> **Note:** This entire system was NOT in the original Blueprint. It is a major bonus feature.

**What it is:** A Python program that runs invisibly in the background on a Windows laptop and sends security telemetry data to the dashboard.

**What is built:**
- `agent/agent.py` — the main agent with 5 monitoring modules:
  - **Foreground App Tracker** — detects which app the employee is actively using
  - **USB Monitor** — detects when a USB drive is plugged in (with debounce to prevent spam)
  - **Clipboard Monitor** — detects when sensitive data (credit card numbers, API keys) is copied
  - **File Scanner** — scans Documents folder for files with sensitive names ("salary", "passwords")
  - **Network Monitor** — detects changes in active network adapters
- `agent/deploy_mdm.ps1` — PowerShell script that compiles `agent.py` into a silent `.exe` and places it in the Windows Startup folder
- `agent/agent.exe` — the pre-compiled, ready-to-deploy executable
- `agent/requirements.txt` — Python dependencies

**Data flow:** Agent runs on laptop → sends events to `POST /api/agent` on Next.js → saved to database → analyst sees in real-time on Live Stream

---

### 5. The Backend Microservices (Foundation)

| Service | What it does | Status |
|---|---|---|
| `services/gateway` | Receives emails, SMS, voice files; validates; stores in DB | ✅ Working |
| `services/preprocessing` | Cleans text, strips HTML, extracts URLs, runs Whisper voice-to-text | ✅ Working |
| `services/detection` | Runs rules engine to score messages | ⚠️ Partial — LightGBM & RoBERTa NOT connected |
| `services/risk` | Calculates the final 0–100 risk score | ✅ Working — formula implemented |
| `services/api` | Provides REST API endpoints for the dashboard | ⚠️ Partial — not all endpoints built |

---

### 6. Database

**What is built:**
- **Frontend Database (Prisma + SQLite)** — Used by the Next.js app. Has tables for: Employee, Analyst, Session, AccessRequest, OTPCode, TelemetryLog, Alert, Incident, TrainingModule, PermissionRequest, LogRequest
- **Backend Database (PostgreSQL via Docker)** — Used by the 5 microservices

> ⚠️ **Important:** These two databases are NOT connected to each other. This is the most critical technical gap to close.

---

## ❌ What Is NOT Built Yet (Remaining Work)

Work through these from top to bottom. Red = do first, Yellow = do second, Green = do last.

---

### 🔴 Priority 1: Connect the AI Detection Pipeline

**Why this matters:** HRIP's entire purpose is to detect attacks using AI. Right now messages are stored, but not scored by any AI model.

#### Task 1A — Train the LightGBM Model

LightGBM is a fast ML model. You train it on thousands of emails so it learns to detect phishing, BEC, CEO fraud, etc.

**Steps:**
1. Download free datasets:
   - Enron Email Corpus: https://www.cs.cmu.edu/~enron/ (500k normal emails)
   - Nazario Phishing Corpus: search GitHub for "nazario-phishing" (~1500 phishing)
   - SpamAssassin: https://spamassassin.apache.org/old/publiccorpus/ (~6000 spam)
2. Look at `services/detection/app/engine/rules.py` — feature extraction is partly there
3. Create `models/training/train_lgbm.py`
4. In that file: load emails, label them (0=benign, 1=phishing, 2=BEC, 3=CEO_fraud), extract features (urgency words, authority words, URL count — Blueprint Section 6 has the full list), train LightGBM, target F1 > 82%, save model to `models/saved/lgbm_model.txt`
5. Add a `POST /predict` endpoint in `services/detection/app/main.py` to serve the model

#### Task 1B — Fine-Tune RoBERTa (Google Colab GPU)

RoBERTa is a powerful AI that reads full message context. It needs a free GPU from Google Colab.

**Steps:**
1. Go to https://colab.research.google.com/ and log in with Google
2. Create a new notebook
3. Run: `!pip install transformers datasets torch`
4. Load the same labelled dataset as LightGBM
5. Fine-tune `roberta-base` from HuggingFace — target F1 > 90%
6. Download model weights to `models/saved/roberta_model/`
7. Wire it into detection service as a second stage

#### Task 1C — Add SHAP Explanations

SHAP explains WHY the model gave a score (e.g., "urgency language added +28 points"). This is what makes HRIP unique.

**Steps:**
1. `pip install shap`
2. After LightGBM predicts, run: `explainer = shap.TreeExplainer(model)` and `shap_values = explainer.shap_values(features)`
3. Extract top 3 features by SHAP value
4. Save them to a `DetectionFeature` table in the database
5. Update `GET /api/v1/alerts/:id` to include these in its response
6. The Investigation Console UI already has a panel for this — just needs the data

---

### 🔴 Priority 2: Wire Up Threat Intelligence Feeds

Free online databases of known malicious URLs and IPs. Every incoming message should have its links checked against these.

**Steps:**
1. **OpenPhish** (no key needed) — download daily feed from https://openphish.com/feed.txt and store each URL in a `threat_indicators` table. Add a cron job to refresh every 6 hours.
2. **PhishTank** (free key) — sign up at https://www.phishtank.com/, then after preprocessing extracts URLs from a message, check each one via their API. If flagged, add 30 pts to the risk score.
3. **AbuseIPDB** (free, 1000/day) — sign up at https://www.abuseipdb.com/, store key in `.env` as `ABUSEIPDB_KEY`, check the sender IP address on every incoming message.

---

### 🟡 Priority 3: Connect Frontend to Backend Microservices

**The gap:** The Next.js frontend talks to its own SQLite database. The backend FastAPI services talk to PostgreSQL. They need to share data.

**Recommended fix (simpler option):**
Make the Next.js `POST /api/demo/ingest` route call the FastAPI Gateway:
```
// frontend/app/api/demo/ingest/route.ts
const res = await fetch("http://localhost:8001/api/v1/ingest/email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ sender, receiver, subject, body, received_at: new Date().toISOString() })
});
```
Then poll for the resulting alert and save it back to Prisma.

**Alternative (bigger change):** Move the frontend Prisma database from SQLite to PostgreSQL so both systems share one database.

---

### 🟡 Priority 4: Add Kafka Message Queue

The Blueprint requires Kafka so the 5 microservices can talk to each other reliably. Currently they work in isolation.

**Steps:**
1. Add Kafka to `docker-compose.yml` (use the config in Blueprint Section 10)
2. In `services/gateway/app/routes/ingest.py` — after storing a message, publish to Kafka topic `raw.message`
3. In `services/preprocessing/app/main.py` — consume from `raw.message`, clean text, publish to `message.cleaned`
4. In `services/detection/app/main.py` — consume from `message.cleaned`, detect threats, publish to `threat.detected`
5. In `services/risk/app/main.py` — consume from `threat.detected`, calculate score, save to DB, publish to `risk.generated`

Install Kafka client: `pip install kafka-python`

---

### 🟡 Priority 5: GitHub Actions CI/CD Pipeline

Automatically runs all tests every time someone pushes code to GitHub.

**Steps:**
1. Create folder `.github/workflows/` in the repo root
2. Create file `.github/workflows/ci.yml` with this content:
```yaml
name: CI Pipeline
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: pip install -e .[dev]
      - run: ruff check .
      - run: pytest tests/
```
3. Push to GitHub — it will run automatically on every future push

---

### 🟡 Priority 6: Deploy to Oracle Cloud (Free Hosting Forever)

Oracle Cloud gives you 4 CPU + 24GB RAM + 200GB storage for free, forever.

**Steps:**
1. Sign up at https://cloud.oracle.com/ (needs credit card but you will NOT be charged)
2. Create an Always Free VM (Ubuntu 22.04, ARM shape)
3. SSH in: `ssh ubuntu@<your-server-ip>`
4. Install Docker: `curl -fsSL https://get.docker.com | sh`
5. Clone the repo: `git clone https://github.com/IBM0PRJ/HRIP.git && cd HRIP`
6. Fill in your `.env` file on the server
7. Start everything: `docker compose up -d --build`
8. Point a free Cloudflare domain at your server IP and set up HTTPS with Certbot

---

### 🟢 Priority 7: Generate Synthetic Training Data

Your AI models need more labelled emails. Use Ollama (free local AI) to generate them.

**Steps:**
1. Install Ollama from https://ollama.com/
2. Run: `ollama pull llama3`
3. Prompt it: "Generate 20 realistic BEC emails from a spoofed CFO requesting urgent wire transfers. Vary the amount, urgency, and tone."
4. Save and label outputs as `BEC`
5. Repeat for: CEO fraud, vendor fraud, smishing, pretexting, vishing transcripts
6. Target: ~500 samples per attack type

---

### 🟢 Priority 8: Expand the Demo Seed Script

The database needs 50 fake employees and 30 days of realistic alert history for demos.

**Steps:**
1. Open `scripts/bootstrap_demo.py` — some basic seeding already exists
2. Add 50 fake employees across multiple departments
3. Add 30 days of alerts (varied attack types, varied risk scores)
4. Run with: `python scripts/bootstrap_demo.py` from the HRIP root folder

---

### 🟢 Priority 9: Prepare 8 Demo Test Files

Create these files in a `demo/` folder so you can upload them during live presentations:

1. `ceo_fraud_email.txt` — urgent wire transfer from spoofed CEO
2. `vendor_fraud_email.txt` — fake bank account change from "vendor"
3. `phishing_email.txt` — fake Office 365 account suspended email with malicious link
4. `pretexting_email.txt` — fake IT support asking for login credentials
5. `smishing.txt` — fake TRAI SIM block SMS with bit.ly link
6. `vishing_audio.wav` — 60-second fake bank customer care call asking for OTP (record on phone)
7. `benign_email1.txt` — normal internal meeting invite (must NOT get flagged)
8. `benign_email2.txt` — normal HR policy update (must NOT get flagged)

---

## 🏗️ Architecture — How Everything Connects

```
[Employee's Windows Laptop]
        |
    agent.exe  (runs silently in background)
        |  sends telemetry events
        ↓
[Next.js Frontend — localhost:3000]
    Prisma ORM → SQLite (dev) or PostgreSQL (production)
    REST API Routes (/api/...)
        ├── Analyst Dashboard  (/analyst/...)
        └── Employee Portal    (/dashboard/...)

[FastAPI Backend — Docker Compose]
    ┌─── Gateway      (port 8001) ← Email / SMS / Voice in
    ├─── Preprocessing            ← cleans text, runs Whisper
    ├─── Detection               ← rules + LightGBM + RoBERTa
    ├─── Risk Engine             ← calculates 0–100 score
    └─── API          (port 8000) ← serves data to dashboard

[PostgreSQL — Docker] ← all 5 services read/write here
[Redis — Docker]      ← session store + event streaming
```

---

## 🗂️ File Structure Guide

```
HRIP/
├── frontend/                     The Next.js web application
│   ├── app/
│   │   ├── analyst/              All Analyst Dashboard pages
│   │   ├── (employee)/           All Employee Portal pages
│   │   ├── (auth)/               Login, Signup, Onboarding
│   │   └── api/                  All Next.js backend API routes
│   ├── lib/
│   │   ├── db.ts                 Database connection (Prisma)
│   │   ├── auth.ts               Password hashing, OTP generation
│   │   └── email.ts              Email sender (Nodemailer)
│   └── prisma/schema.prisma      Database table definitions
│
├── services/                     Python FastAPI microservices (Docker)
│   ├── gateway/                  Email/SMS/Voice ingestion
│   ├── preprocessing/            Text cleaning, Whisper STT
│   ├── detection/                Rules engine (AI models go here)
│   ├── risk/                     Risk score calculator
│   └── api/                      REST API for the dashboard
│
├── agent/                        Windows Endpoint Agent
│   ├── agent.py                  Main agent — run this for testing
│   ├── deploy_mdm.ps1            Compiles and installs silently
│   ├── agent.exe                 Pre-compiled executable
│   └── requirements.txt          Python dependencies
│
├── models/                       AI models (currently empty — train them)
│   ├── training/                 Put train_lgbm.py here
│   └── saved/                    Trained model files go here
│
├── tests/                        Backend Python tests
├── scripts/                      Utility scripts (seeding, smoke tests)
├── docker-compose.yml            Starts all 5 backend services
├── .env.example                  Copy this to .env and fill it in
├── README.md                     Setup instructions
└── PROGRESS.md                   This file
```

---

## 🔧 How to Run the Project Today

### Option A — Just the Frontend (No Docker needed)
```bash
cd HRIP/frontend
npm install          # install packages (first time only)
npx prisma db push   # set up the local database (first time only)
npm run dev          # start the dev server
```
Open browser at: http://localhost:3000

### Option B — The Full Backend Stack (Docker Desktop required)
```bash
cd HRIP
cp .env.example .env          # fill in the .env file first
python scripts/bootstrap_demo.py
docker compose up --build
```
Open browser at: http://localhost:3001

### Option C — The Windows Agent (for testing telemetry)
```bash
cd HRIP/agent
pip install -r requirements.txt   # first time only
python agent.py                   # run temporarily
# OR
.\deploy_mdm.ps1                  # install permanently on startup
```

---

## 🔑 Demo Login Accounts

| Role | Email | Password |
|---|---|---|
| Analyst | analyst@example.com | Analyst123! |
| Employee | cfo@example.com | Employee123! |
| Admin | admin@example.com | ChangeMe123! |

---

## 📋 Environment Variables

Open the `.env` file and fill in these values:

```
# Database
DATABASE_URL=          PostgreSQL connection (for Docker backend)
FRONTEND_DATABASE_URL= SQLite path (for Next.js frontend)

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=         Your Gmail address
SMTP_PASSWORD=         Gmail App Password (NOT your normal password)
SMTP_ENABLED=true      Set to "false" to skip real emails in dev

# Security
JWT_SECRET=            Any long random string
SESSION_SECRET=        Any other long random string

# Threat Intelligence (optional — needed for Priority 2)
PHISHTANK_API_KEY=     Free key from phishtank.com
ABUSEIPDB_KEY=         Free key from abuseipdb.com
VIRUSTOTAL_KEY=        Free key from virustotal.com

# Voice (optional)
VOICE_INGEST_ENABLED=true
WHISPER_ENABLED=false  Set true only after pip install faster-whisper
```

> How to get a Gmail App Password: Google Account → Security → 2-Step Verification → App Passwords → create one for "Mail / Windows Computer"

---

## 📊 Blueprint 8-Week Plan — Where We Are

| Week | Blueprint Goal | Reality |
|---|---|---|
| 1 | Docker runs, DB schema, frontend loads | ✅ Done |
| 2 | Email stored in DB, JWT login | ✅ Done |
| 3 | Rules engine, smishing, alerts in DB | ✅ Done |
| 4 | LightGBM model + Executive Dashboard | ⚠️ UI built, model NOT trained |
| 5 | RoBERTa + Voice transcript + Investigation Console | ⚠️ UI built, Whisper exists, RoBERTa NOT trained |
| 6 | Human Risk Score + Employee Profile | ✅ Done |
| 7 | Testing + Polish + Oracle Cloud deploy | ❌ Not done |
| 8 | Demo data + 8 demo files + 5-min pitch | ❌ Not done |

### Bonus Features Built Beyond the Blueprint

1. Employee Portal — a full second web app (Blueprint only had Analyst view)
2. Native Windows Endpoint Agent — real-time OS-level telemetry
3. MDM Silent Deployment — automated .exe compilation and startup install
4. Live Telemetry Stream — real-time OS event feed on the analyst dashboard
5. Zero-Trust Onboarding — selfie + GPS verification before access
6. Containment Tools — analyst can lock down a device from the dashboard

---

## 🎯 Recommended Team Split for Remaining Work

**Person 1 (AI/ML):**
- Week 1–2: Train LightGBM (Priority 1A) + generate synthetic data (Priority 7)
- Week 2–3: Fine-tune RoBERTa on Google Colab (Priority 1B)

**Person 2 (Backend Integration):**
- Week 1: Wire up OpenPhish, PhishTank, AbuseIPDB (Priority 2)
- Week 2–3: Add Kafka to docker-compose (Priority 4)
- Week 3–4: Connect Next.js frontend to FastAPI backend (Priority 3)

**Person 3 (Frontend + SHAP):**
- Week 1: Expand demo seed script (Priority 8)
- Week 2–3: Wire SHAP into Investigation Console (Priority 1C — after Person 1 has models)
- Week 4: Prepare 8 demo test files (Priority 9)

**Person 4 (DevOps + Demo):**
- Week 1: Set up GitHub Actions CI/CD (Priority 5)
- Week 2–3: Deploy to Oracle Cloud (Priority 6)
- Week 4: Record 2-min Loom demo video, rehearse 5-min pitch

---

## 📚 Helpful Resources

| Topic | Link |
|---|---|
| LightGBM training guide | https://lightgbm.readthedocs.io/en/latest/ |
| HuggingFace RoBERTa fine-tuning | https://huggingface.co/docs/transformers/training |
| SHAP docs | https://shap.readthedocs.io/en/latest/ |
| Kafka Python client | https://kafka-python.readthedocs.io/en/master/ |
| Prisma ORM docs | https://www.prisma.io/docs/ |
| Oracle Cloud Free Tier setup | https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm |
| Ollama (local AI for data generation) | https://ollama.com/ |
| OpenPhish threat feed | https://openphish.com/ |
| PhishTank API | https://www.phishtank.com/ |
