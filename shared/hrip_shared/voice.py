import hashlib
import re
from pathlib import Path
from uuid import UUID

from .settings import Settings, get_settings


def sanitize_filename(filename: str | None) -> str:
    raw_name = Path(filename or "voice-upload.wav").name
    stem = re.sub(r"[^a-zA-Z0-9._-]+", "-", Path(raw_name).stem).strip("-._") or "voice-upload"
    suffix = re.sub(r"[^a-zA-Z0-9.]+", "", Path(raw_name).suffix.lower()) or ".wav"
    return f"{stem}{suffix}"


def validate_voice_upload(content_type: str | None, size_bytes: int, settings: Settings | None = None) -> str:
    cfg = settings or get_settings()
    mime_type = (content_type or "").split(";", 1)[0].strip().lower()
    if mime_type not in cfg.parsed_voice_allowed_mime_types:
        raise ValueError(f"Unsupported voice MIME type: {content_type or 'unknown'}")
    if size_bytes <= 0:
        raise ValueError("Voice upload is empty")
    if size_bytes > cfg.max_voice_bytes:
        raise ValueError("Voice upload exceeds maximum size")
    return mime_type


def persist_voice_upload(
    message_id: UUID,
    filename: str | None,
    contents: bytes,
    content_type: str | None,
    settings: Settings | None = None,
) -> dict[str, str | int]:
    cfg = settings or get_settings()
    safe_name = sanitize_filename(filename)
    mime_type = validate_voice_upload(content_type, len(contents), cfg)
    storage_dir = Path(cfg.voice_upload_dir)
    storage_dir.mkdir(parents=True, exist_ok=True)
    stored_path = storage_dir / f"{message_id}-{safe_name}"
    stored_path.write_bytes(contents)
    return {
        "audio_path": str(stored_path),
        "mime_type": mime_type,
        "original_filename": filename or safe_name,
        "stored_filename": stored_path.name,
        "sha256": hashlib.sha256(contents).hexdigest(),
        "size_bytes": len(contents),
        "transcription_status": "pending",
    }


def derive_transcript_from_filename(channel_meta: dict) -> str:
    candidates = [
        channel_meta.get("original_filename"),
        channel_meta.get("stored_filename"),
        Path(str(channel_meta.get("audio_path", ""))).name,
    ]
    for candidate in candidates:
        if not candidate:
            continue
        stem = Path(str(candidate)).stem
        words = [word for word in re.split(r"[^a-zA-Z0-9]+", stem) if word]
        filtered = [word.lower() for word in words if word.lower() not in {"voice", "upload", "audio", "call"}]
        if filtered:
            return " ".join(filtered)
    return "voice message transcription unavailable"
