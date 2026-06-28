from fastapi.testclient import TestClient

from services.gateway.app.main import app
from services.gateway.app.routes import ingest


def test_email_ingest_validation() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/ingest/email",
            json={"sender": "bad", "receiver": "user@example.com", "body": "hello"},
        )
    assert response.status_code == 422


def test_voice_ingest_disabled() -> None:
    original = ingest.settings.voice_ingest_enabled
    ingest.settings.voice_ingest_enabled = False
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/v1/ingest/voice",
                files={"file": ("urgent-otp-call.wav", b"fake-wave-data", "audio/wav")},
            )
    finally:
        ingest.settings.voice_ingest_enabled = original
    assert response.status_code == 503


def test_voice_ingest_rejects_unsupported_mime() -> None:
    original = ingest.settings.voice_ingest_enabled
    ingest.settings.voice_ingest_enabled = True
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/v1/ingest/voice",
                files={"file": ("note.txt", b"not-audio", "text/plain")},
            )
    finally:
        ingest.settings.voice_ingest_enabled = original
    assert response.status_code == 415


def test_voice_ingest_rejects_oversized_payload() -> None:
    original_enabled = ingest.settings.voice_ingest_enabled
    original_limit = ingest.settings.max_voice_bytes
    ingest.settings.voice_ingest_enabled = True
    ingest.settings.max_voice_bytes = 4
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/v1/ingest/voice",
                files={"file": ("urgent-otp-call.wav", b"12345", "audio/wav")},
            )
    finally:
        ingest.settings.voice_ingest_enabled = original_enabled
        ingest.settings.max_voice_bytes = original_limit
    assert response.status_code == 413
