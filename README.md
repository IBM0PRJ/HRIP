# HRIP (Human Risk Intelligence Platform)

Human Risk Intelligence Platform monorepo for multi-channel social engineering detection and active endpoint telemetry.

## Core Architecture Stack

- **FastAPI Microservices**: Backend ingestion, detection, and risk scoring.
- **PostgreSQL**: System-of-record storage.
- **Redis Streams**: Event backbone for asynchronous processing.
- **Next.js (App Router)**: Analyst dashboard and Employee portal shell.
- **Python Endpoint Agent**: Native OS telemetry collector for zero-trust visibility.

---

## 🎯 NEW: Native Telemetry Agent (Windows Endpoint)

HRIP now includes a fully native Python agent deployed directly to employee endpoints to monitor physical and digital behavior in real time. 

### Key Agent Capabilities
1. **Foreground Application Tracking**: Uses `win32gui` to detect precisely what application the user is actively focused on (e.g., *WhatsApp*, *Chrome*), filtering out system background noise.
2. **Hardware Intercepts (WMI)**: Directly hooks into Windows Management Instrumentation to instantly detect when unauthorized USB storage devices are plugged in, utilizing native debounce to prevent event spam.
3. **Clipboard Monitoring**: Hooks into the OS clipboard buffer. Safely ignores general text, but aggressively flags and intercepts sensitive patterns like 16-digit credit card numbers or AWS API keys (`sk-...`).
4. **Local File Scanning**: Natively walks user directories (e.g., `~/Documents`) to proactively detect files containing sensitive naming conventions (*"salary"*, *"passwords"*).
5. **Network Fingerprinting**: Monitors active connection adapters and flags suspicious routing changes (like unauthorized VPN usage).

### Enterprise MDM Deployment
The agent is designed for silent enterprise deployment. The included `deploy_mdm.ps1` script fully automates the process by:
- Using `pyinstaller` to compile the Python agent into a standalone, windowless executable (`agent.exe`).
- Enforcing `--noconsole` so the agent runs completely invisibly with no taskbar footprint.
- Programmatically injecting a shortcut into the native Windows `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup` folder for permanent, silent boot persistence.

---

## 💻 Analyst Live Stream Dashboard

The Next.js frontend has been upgraded with a **Live Telemetry Stream**.
- Security analysts can monitor raw OS-level events flowing from employee laptops in real-time.
- Features category-specific pill filters (All, Process, USB, Network, Files, Clipboard) for rapid triage.
- Bi-directional sync with the database ensures immediate visibility as soon as the background `.exe` captures an OS event.

---

## 🚀 Beginner-Friendly Quick Start

This project is split into two parts: the Web Dashboard (Next.js) and the Telemetry Agent (Python). You can run them both easily on your local machine to test the platform.

### Step 1: Start the Web Dashboard
Open your terminal and run the following commands to start the Analyst Dashboard:

```bash
# Navigate to the frontend directory
cd frontend

# Install the necessary Node packages
npm install

# Initialize the local SQLite testing database
npx prisma db push

# Start the local development server
npm run dev
```
Once it says "Ready", open your browser and go to **`http://localhost:3000`**.

### Step 2: Start the Native Telemetry Agent
Open a *second* new terminal window to start the background telemetry agent:

```bash
# Navigate to the agent directory
cd agent

# Install the required Python libraries
pip install -r requirements.txt
```

**To run it temporarily:** Simply type `python agent.py`.
**To install it permanently (Enterprise MDM Simulation):** Run `.\deploy_mdm.ps1`. This will compile the agent to a silent executable and place it in your Windows Startup folder so it runs invisibly in the background.

### Step 3: Test the Platform!
1. Go to **`http://localhost:3000`** and log in with the demo Analyst account:
   - **Email:** `analyst@example.com`
   - **Password:** `Analyst123!`
2. Navigate to **Permissions**, click **Deploy via MDM**, and request tracking access for a demo employee.
3. Open a new tab, navigate to the **Employee Portal** (using the employee's email), and click **Approve Access**.
4. Go back to the Analyst Dashboard and open the **Live Stream** to watch your actual computer's OS telemetry flow in real-time!

---

## Demo accounts

- `admin@example.com` / `ChangeMe123!`
- `analyst@example.com` / `Analyst123!`
- `cfo@example.com` / `Employee123!`

## Utility commands

- `make bootstrap`: create tables and seed demo data
- `make smoke`: login, ingest a phishing sample, and fetch alert visibility
- `pytest`: run the current automated test suite

## Voice demo mode

- Set `VOICE_INGEST_ENABLED=true` to enable `POST /api/v1/ingest/voice`.
- The first implementation stores audio safely under `VOICE_UPLOAD_DIR`, validates MIME and size limits, and derives a local transcript from the uploaded filename when Whisper is not wired in yet.
- For a deterministic local demo, use filenames that contain threat words such as `urgent-otp-call.wav` or `wire-transfer-request.wav`.
- The dashboard home page now includes demo launch controls for email, SMS, and voice scenarios so you can generate analyst traffic without running separate scripts.

## Services Map

- `agent`: Native Windows Telemetry Collector
- `gateway`: Ingestion and Auth
- `preprocessing`: Text cleanup and URL extraction worker
- `detection`: Rule-based and baseline ML detection worker
- `risk`: Alerting and risk scoring worker
- `api`: Analyst-facing read APIs
- `frontend`: Dashboard shell
