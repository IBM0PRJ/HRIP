import types
from pathlib import Path

import pytest

from hrip_shared.settings import Settings
from services.preprocessing.app.processors.transcriber import OptionalWhisperTranscriber


@pytest.mark.asyncio
async def test_transcriber_falls_back_when_whisper_disabled(tmp_path: Path) -> None:
    audio = tmp_path / "urgent-otp-call.wav"
    audio.write_bytes(b"fake")
    settings = Settings(
        VOICE_INGEST_ENABLED=True,
        WHISPER_ENABLED=False,
        DATABASE_URL="sqlite+aiosqlite:///./hrip_test.db",
        REDIS_URL="redis://localhost:6379/15",
    )
    transcriber = OptionalWhisperTranscriber(settings)

    transcript, meta = await transcriber.transcribe(
        {"audio_path": str(audio), "original_filename": audio.name, "stored_filename": audio.name}
    )

    assert transcript == "urgent otp"
    assert meta["transcription_backend"] == "filename-fallback"
    assert meta["transcription_reason"] == "whisper_disabled"


@pytest.mark.asyncio
async def test_transcriber_uses_whisper_backend_when_available(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    audio = tmp_path / "voice.wav"
    audio.write_bytes(b"fake")
    settings = Settings(
        VOICE_INGEST_ENABLED=True,
        WHISPER_ENABLED=True,
        DATABASE_URL="sqlite+aiosqlite:///./hrip_test.db",
        REDIS_URL="redis://localhost:6379/15",
    )

    class FakeSegment:
        def __init__(self, text: str) -> None:
            self.text = text

    class FakeModel:
        def __init__(self, *_args, **_kwargs) -> None:
            pass

        def transcribe(self, _audio_path: str, **_kwargs):
            return [FakeSegment("hello"), FakeSegment("world")], {"language": "en"}

    fake_module = types.SimpleNamespace(WhisperModel=FakeModel)
    monkeypatch.setattr(
        "services.preprocessing.app.processors.transcriber.importlib.import_module",
        lambda _name: fake_module,
    )
    transcriber = OptionalWhisperTranscriber(settings)

    transcript, meta = await transcriber.transcribe(
        {"audio_path": str(audio), "original_filename": audio.name, "stored_filename": audio.name}
    )

    assert transcript == "hello world"
    assert meta["transcription_backend"] == "whisper"
    assert meta["transcription_reason"] == "whisper_success"
