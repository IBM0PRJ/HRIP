from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "hrip"
    database_url: str = Field(
        default="sqlite+aiosqlite:///./hrip.db",
        alias="DATABASE_URL",
    )
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")

    jwt_issuer: str = Field(default="hrip-gateway", alias="JWT_ISSUER")
    jwt_audience: str = Field(default="hrip-analyst", alias="JWT_AUDIENCE")
    jwt_access_ttl_minutes: int = Field(default=15, alias="JWT_ACCESS_TTL_MINUTES")
    jwt_refresh_ttl_days: int = Field(default=7, alias="JWT_REFRESH_TTL_DAYS")
    jwt_clock_skew_seconds: int = Field(default=60, alias="JWT_CLOCK_SKEW_SECONDS")
    jwt_private_key_path: str = Field(default="./keys/dev_rsa_private.pem", alias="JWT_PRIVATE_KEY_PATH")
    jwt_public_key_path: str = Field(default="./keys/dev_rsa_public.pem", alias="JWT_PUBLIC_KEY_PATH")

    default_admin_email: str = Field(default="admin@hrip.local", alias="DEFAULT_ADMIN_EMAIL")
    default_admin_password: str = Field(default="ChangeMe123!", alias="DEFAULT_ADMIN_PASSWORD")

    threat_intel_cache_only: bool = Field(default=True, alias="THREAT_INTEL_CACHE_ONLY")
    threat_intel_timeout_seconds: int = Field(default=2, alias="THREAT_INTEL_TIMEOUT_SECONDS")
    voice_ingest_enabled: bool = Field(default=False, alias="VOICE_INGEST_ENABLED")
    whisper_enabled: bool = Field(default=False, alias="WHISPER_ENABLED")
    roberta_enabled: bool = Field(default=False, alias="ROBERTA_ENABLED")
    roberta_timeout_ms: int = Field(default=500, alias="ROBERTA_TIMEOUT_MS")
    whisper_model_size: str = Field(default="base", alias="WHISPER_MODEL_SIZE")
    whisper_device: str = Field(default="cpu", alias="WHISPER_DEVICE")
    whisper_compute_type: str = Field(default="int8", alias="WHISPER_COMPUTE_TYPE")
    whisper_timeout_seconds: int = Field(default=8, alias="WHISPER_TIMEOUT_SECONDS")
    whisper_startup_strict: bool = Field(default=False, alias="WHISPER_STARTUP_STRICT")
    max_attachment_bytes: int = Field(default=5 * 1024 * 1024, alias="MAX_ATTACHMENT_BYTES")
    max_voice_bytes: int = Field(default=10 * 1024 * 1024, alias="MAX_VOICE_BYTES")
    voice_upload_dir: str = Field(default="data/uploads/voice", alias="VOICE_UPLOAD_DIR")
    voice_allowed_mime_types: str = Field(
        default="audio/wav,audio/x-wav,audio/mpeg,audio/mp3,audio/ogg,audio/webm,audio/mp4,audio/aac,audio/flac",
        alias="VOICE_ALLOWED_MIME_TYPES",
    )
    smtp_enabled: bool = Field(default=False, alias="SMTP_ENABLED")

    def ensure_key_paths(self) -> tuple[Path, Path]:
        return Path(self.jwt_private_key_path), Path(self.jwt_public_key_path)

    @property
    def parsed_voice_allowed_mime_types(self) -> set[str]:
        return {item.strip().lower() for item in self.voice_allowed_mime_types.split(",") if item.strip()}


@lru_cache
def get_settings() -> Settings:
    return Settings()
