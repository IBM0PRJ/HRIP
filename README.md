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

## Quick start (Full Stack)

1. Copy `.env.example` to `.env`.
2. Install backend dependencies with `python -m pip install -e .[dev]`.
3. Bootstrap the database and demo users with `make bootstrap`.
4. Start the stack with `docker compose up --build`.
5. Open the frontend at `http://localhost:3000`.
6. Use the gateway at `http://localhost:8001` and the analyst API at `http://localhost:8000`.

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
