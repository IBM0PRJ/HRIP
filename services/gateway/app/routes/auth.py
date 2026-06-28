import hashlib
from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from hrip_shared.auth.jwt import create_token_pair, decode_access_token
from hrip_shared.auth.passwords import verify_password
from hrip_shared.db import RefreshToken, User, get_db
from hrip_shared.settings import get_settings

from ..schemas import LoginRequest, RefreshRequest

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def _hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


@router.post("/login")
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    tokens = create_token_pair(UUID(user.id), user.email, user.role)
    settings = get_settings()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=_hash_refresh_token(tokens["refresh_token"]),
            expires_at=datetime.now(UTC) + timedelta(days=settings.jwt_refresh_ttl_days),
        )
    )
    await db.commit()
    return tokens


@router.post("/refresh")
async def refresh(payload: RefreshRequest, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    claims = decode_access_token(payload.refresh_token)
    if claims.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not a refresh token")
    token_hash = _hash_refresh_token(payload.refresh_token)
    result = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    record = result.scalar_one_or_none()
    if record is None or record.revoked or record.expires_at <= datetime.now(UTC):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired or revoked")
    record.revoked = True
    result = await db.execute(select(User).where(User.id == claims["sub"]))
    user = result.scalar_one()
    tokens = create_token_pair(UUID(user.id), user.email, user.role)
    settings = get_settings()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=_hash_refresh_token(tokens["refresh_token"]),
            expires_at=datetime.now(UTC) + timedelta(days=settings.jwt_refresh_ttl_days),
        )
    )
    await db.commit()
    return tokens
