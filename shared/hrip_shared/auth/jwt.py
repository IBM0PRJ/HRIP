from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import UUID, uuid4

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from hrip_shared.settings import get_settings

bearer = HTTPBearer(auto_error=False)


def _generate_dev_keys(private_path: Path, public_path: Path) -> None:
    private_path.parent.mkdir(parents=True, exist_ok=True)
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_path.write_bytes(
        key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )
    )
    public_path.write_bytes(
        key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
    )


def _load_keys() -> tuple[str, str]:
    settings = get_settings()
    private_path, public_path = settings.ensure_key_paths()
    if not private_path.exists() or not public_path.exists():
        _generate_dev_keys(private_path, public_path)
    return private_path.read_text(), public_path.read_text()


def create_token_pair(user_id: UUID, email: str, role: str) -> dict[str, str]:
    settings = get_settings()
    private_key, _ = _load_keys()
    now = datetime.now(UTC)
    access_jti = str(uuid4())
    refresh_jti = str(uuid4())
    access_payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "jti": access_jti,
        "iat": int(now.timestamp()),
        "nbf": int((now - timedelta(seconds=settings.jwt_clock_skew_seconds)).timestamp()),
        "exp": int((now + timedelta(minutes=settings.jwt_access_ttl_minutes)).timestamp()),
        "type": "access",
    }
    refresh_payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "jti": refresh_jti,
        "iat": int(now.timestamp()),
        "nbf": int((now - timedelta(seconds=settings.jwt_clock_skew_seconds)).timestamp()),
        "exp": int((now + timedelta(days=settings.jwt_refresh_ttl_days)).timestamp()),
        "type": "refresh",
    }
    return {
        "access_token": jwt.encode(access_payload, private_key, algorithm="RS256"),
        "refresh_token": jwt.encode(refresh_payload, private_key, algorithm="RS256"),
        "token_type": "bearer",
    }


def decode_access_token(token: str) -> dict:
    settings = get_settings()
    _, public_key = _load_keys()
    try:
        return jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience=settings.jwt_audience,
            issuer=settings.jwt_issuer,
            leeway=settings.jwt_clock_skew_seconds,
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc


async def require_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> dict:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    return decode_access_token(credentials.credentials)
