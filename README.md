# HRIP

Human Risk Intelligence Platform monorepo for multi-channel social engineering detection.

## Stack

- FastAPI microservices
- PostgreSQL for system-of-record storage
- Redis Streams for the event backbone
- Next.js frontend shell
- Shared Python package for contracts, auth, models, and broker interfaces

## Quick start

1. Copy `.env.example` to `.env`.
2. Install backend dependencies with `python -m pip install -e .[dev]`.
3. Bootstrap the database and demo users with `make bootstrap`.
4. Start the stack with `docker compose up --build`.
5. Open the frontend at `http://localhost:3000`.
6. Use the gateway at `http://localhost:8001` and the analyst API at `http://localhost:8000`.
7. For the voice-enabled profile, use `docker compose --env-file .env.voice up --build`.
8. The frontend authenticates server-side with the seeded admin account through `FRONTEND_GATEWAY_URL`.

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
- Set `WHISPER_ENABLED=true` only when a Whisper backend such as `faster-whisper` is installed in the runtime image or environment.
- If Whisper is enabled but unavailable, too slow, or fails inference, preprocessing falls back to filename-derived transcripts and records the reason in `message_metadata.channel_meta`.
- The dashboard home page now includes demo launch controls for email, SMS, and voice scenarios so you can generate analyst traffic without running separate scripts.

## Manual Demo Flow

1. Start the full stack:
   `docker compose --env-file .env.voice up --build`
2. Wait until `frontend`, `gateway`, `api`, `preprocessing`, `detection`, and `risk` are all running.
3. Open `http://localhost:3000`.
4. If the dashboard was opened immediately during container warmup and shows an error once, refresh after 5-10 seconds.
5. On the home page, use the `Generate analyst traffic` panel:
   `Launch CEO fraud email`
   `Launch smishing SMS`
   `Launch vishing call`
6. Watch the `Recent processed messages` activity panel update first.
7. Open `View queue` to confirm the new alerts appear in `/alerts`.
8. Open any alert detail page and change the status from `open` to `investigating` or `resolved`.
9. Open the affected employee profile from the alert detail page to show linked risk history and associated alerts.
10. For a quick CLI validation during the demo, run:
   `python scripts/smoke_ingest.py`

## Services

- `gateway`: ingestion and auth
- `preprocessing`: text cleanup and URL extraction worker
- `detection`: rule-based and baseline ML detection worker
- `risk`: alerting and risk scoring worker
- `api`: analyst-facing read APIs
- `frontend`: dashboard shell
