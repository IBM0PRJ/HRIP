import asyncio
import importlib
import logging
from pathlib import Path
from typing import Any

from hrip_shared.settings import Settings, get_settings
from hrip_shared.voice import derive_transcript_from_filename

logger = logging.getLogger(__name__)


class OptionalWhisperTranscriber:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._backend_ready = False
        self._backend_error: str | None = None
        self._model: Any | None = None

    @property
    def backend_status(self) -> str:
        if not self.settings.whisper_enabled:
            return "disabled"
        if self._backend_ready:
            return "ready"
        return self._backend_error or "unavailable"

    async def startup_check(self) -> None:
        if not self.settings.whisper_enabled:
            self._backend_error = "disabled"
            return
        try:
            await asyncio.to_thread(self._ensure_model_loaded)
        except Exception as exc:
            self._backend_error = str(exc)
            logger.warning("Whisper startup check failed: %s", exc)
            if self.settings.whisper_startup_strict:
                raise

    async def transcribe(self, channel_meta: dict) -> tuple[str, dict[str, Any]]:
        fallback = derive_transcript_from_filename(channel_meta)
        base_meta = {
            "transcription_backend": "filename-fallback",
            "transcription_status": "completed",
            "transcription_error": None,
        }
        if not self.settings.whisper_enabled:
            return fallback, base_meta | {"transcription_reason": "whisper_disabled"}
        audio_path = channel_meta.get("audio_path")
        if not audio_path:
            return fallback, base_meta | {"transcription_reason": "missing_audio_path"}
        try:
            transcript = await asyncio.wait_for(
                asyncio.to_thread(self._transcribe_sync, str(audio_path)),
                timeout=self.settings.whisper_timeout_seconds,
            )
            if not transcript:
                return fallback, base_meta | {"transcription_reason": "empty_transcript"}
            return transcript, {
                "transcription_backend": "whisper",
                "transcription_status": "completed",
                "transcription_error": None,
                "transcription_reason": "whisper_success",
            }
        except TimeoutError:
            logger.warning("Whisper transcription timed out for %s", audio_path)
            return fallback, base_meta | {
                "transcription_reason": "whisper_timeout",
                "transcription_error": "whisper_timeout",
            }
        except Exception as exc:
            logger.warning("Whisper transcription failed for %s: %s", audio_path, exc)
            self._backend_error = str(exc)
            return fallback, base_meta | {
                "transcription_reason": "whisper_failed",
                "transcription_error": str(exc),
            }

    def _ensure_model_loaded(self) -> Any:
        if self._model is not None:
            self._backend_ready = True
            return self._model
        module = importlib.import_module("faster_whisper")
        model_cls = getattr(module, "WhisperModel")
        self._model = model_cls(
            self.settings.whisper_model_size,
            device=self.settings.whisper_device,
            compute_type=self.settings.whisper_compute_type,
        )
        self._backend_ready = True
        self._backend_error = None
        return self._model

    def _transcribe_sync(self, audio_path: str) -> str:
        model = self._ensure_model_loaded()
        path = Path(audio_path)
        if not path.exists():
            raise FileNotFoundError(audio_path)
        segments, _info = model.transcribe(str(path), beam_size=1, vad_filter=True)
        parts = [segment.text.strip() for segment in segments if getattr(segment, "text", "").strip()]
        return " ".join(parts).strip()
