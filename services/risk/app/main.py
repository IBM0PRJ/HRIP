import asyncio
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from uuid import UUID, uuid4
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from sqlalchemy import select
import logging

from hrip_shared.auth.passwords import hash_password
from hrip_shared.broker import RedisStreamBroker
from hrip_shared.contracts.events import DetectionEvent, RiskEvent as RiskEventContract, USBEvent, LoginEvent, FileAccessEvent
from hrip_shared.db import Alert, Message, User, RiskEvent, session_factory, wait_for_db
from hrip_shared.services.idempotency import already_processed, mark_processed
from hrip_shared.utils.streams import (
    DETECTION_STREAM, RISK_STREAM, USB_EVENT_STREAM, LOGIN_EVENT_STREAM, FILE_ACCESS_STREAM
)

from .engine.calculator import SEVERITY_DELTAS, apply_time_decay, calculate_new_score, score_to_severity, score_to_access_level

broker = RedisStreamBroker()
logger = logging.getLogger(__name__)

async def _ensure_user_by_email(session, receiver: str) -> User:
    result = await session.execute(select(User).where(User.email == receiver))
    user = result.scalar_one_or_none()
    if user is not None:
        return user
    user = User(
        email=receiver,
        full_name=receiver.split("@")[0].replace(".", " ").title(),
        role="employee",
        department="unknown",
        privilege="standard",
        password_hash=hash_password("TempPassword123!"),
    )
    session.add(user)
    await session.flush()
    return user

async def _ensure_user_by_name(session, username: str) -> User:
    result = await session.execute(select(User).where(User.email.ilike(f"{username}%")))
    user = result.scalar_one_or_none()
    if user is not None:
        return user
    user = User(
        email=f"{username}@hrip.local",
        full_name=username.replace(".", " ").title(),
        role="employee",
        department="unknown",
        privilege="standard",
        password_hash=hash_password("TempPassword123!"),
    )
    session.add(user)
    await session.flush()
    return user

async def update_user_score(session, user: User, delta: float, source: str, reason: str = None):
    days_clean = 0
    if user.created_at:
        last_event = await session.execute(
            select(RiskEvent).where(RiskEvent.user_id == user.id).order_by(RiskEvent.created_at.desc()).limit(1)
        )
        last = last_event.scalar_one_or_none()
        if last:
            # We don't decay based on timezone unaware datetime if db returns naive.
            # Convert to aware if naive
            last_created = last.created_at
            if last_created.tzinfo is None:
                last_created = last_created.replace(tzinfo=UTC)
            days_clean = (datetime.now(UTC) - last_created).days
        else:
            user_created = user.created_at
            if user_created.tzinfo is None:
                user_created = user_created.replace(tzinfo=UTC)
            days_clean = (datetime.now(UTC) - user_created).days
    
    decayed = apply_time_decay(user.risk_score, max(days_clean, 0))
    new_score = calculate_new_score(decayed, delta)
    
    event = RiskEvent(
        user_id=user.id,
        source=source,
        old_score=user.risk_score,
        new_score=new_score,
        delta=new_score - user.risk_score,
        reason=reason
    )
    session.add(event)
    
    user.risk_score = new_score
    user.risk_tier = score_to_severity(new_score)
    user.data_access_level = score_to_access_level(new_score)
    
    return new_score

async def process_detection(entry_id: str, payload: dict) -> None:
    event = DetectionEvent.model_validate(payload)
    async with session_factory() as session:
        if await already_processed(session, "risk_detection", entry_id):
            return
        message = await session.get(Message, str(event.message_id))
        if message is None:
            return
            
        user = await _ensure_user_by_email(session, message.receiver)
        
        delta = 0
        if event.threat_type == "credential_theft" or event.threat_type == "phishing":
            if event.confidence >= 0.8:
                delta = SEVERITY_DELTAS["phishing_confirmed"]
        elif event.threat_type == "financial_fraud" or event.threat_type == "bec_fraud":
            if event.confidence >= 0.8:
                delta = SEVERITY_DELTAS["bec_fraud"]
        elif event.threat_type != "benign":
            delta = SEVERITY_DELTAS["suspicious_link_clicked"]
            
        if delta > 0:
            score = await update_user_score(session, user, delta, "detection", f"Detected threat: {event.threat_type}")
            
            if score >= 40:
                session.add(
                    Alert(
                        message_id=str(event.message_id),
                        detection_id=str(event.detection_id),
                        user_id=user.id,
                        severity=user.risk_tier,
                        status="open",
                    )
                )
            
            risk_out = RiskEventContract(
                message_id=event.message_id,
                user_id=UUID(user.id),
                alert_id=UUID(int=0), 
                risk_score=score,
                severity=user.risk_tier,
                threat_type=event.threat_type,
                created_at=datetime.now(UTC),
            )
            await broker.publish(RISK_STREAM, risk_out.model_dump(mode="json"), event_id=entry_id)
            
        await session.commit()
        await mark_processed(session, "risk_detection", entry_id)


async def process_usb(entry_id: str, payload: dict) -> None:
    event = USBEvent.model_validate(payload)
    async with session_factory() as session:
        if await already_processed(session, "risk_usb", entry_id):
            return
        user = await _ensure_user_by_name(session, event.username)
        
        delta = 0
        if event.action == "connected":
            delta = SEVERITY_DELTAS["usb_unknown_device"]
        elif event.action == "file_copied":
            if event.file_size_bytes and event.file_size_bytes > 50 * 1024 * 1024:
                delta = SEVERITY_DELTAS["usb_mass_copy"]
                
        if delta > 0:
            await update_user_score(session, user, delta, "usb", f"USB Action: {event.action}")
            await session.commit()
            
        await mark_processed(session, "risk_usb", entry_id)

async def process_login(entry_id: str, payload: dict) -> None:
    event = LoginEvent.model_validate(payload)
    async with session_factory() as session:
        if await already_processed(session, "risk_login", entry_id):
            return
        user = await _ensure_user_by_name(session, event.username)
        
        delta = 0
        if event.status == "failed":
            delta = SEVERITY_DELTAS["failed_logins"]
        elif event.status == "success" and event.reason == "off_hours":
            delta = SEVERITY_DELTAS["unusual_login"]
            
        if delta > 0:
            await update_user_score(session, user, delta, "login", f"Login Action: {event.status}")
            await session.commit()
            
        await mark_processed(session, "risk_login", entry_id)

async def process_file_access(entry_id: str, payload: dict) -> None:
    event = FileAccessEvent.model_validate(payload)
    async with session_factory() as session:
        if await already_processed(session, "risk_file", entry_id):
            return
        user = await _ensure_user_by_name(session, event.username)
        
        delta = 0
        if event.action == "mass_download":
            delta = SEVERITY_DELTAS["file_mass_download"]
            
        if delta > 0:
            await update_user_score(session, user, delta, "file_access", f"File Access: {event.action}")
            await session.commit()
            
        await mark_processed(session, "risk_file", entry_id)


_bg_tasks = set()

@asynccontextmanager
async def lifespan(_: FastAPI):
    await wait_for_db()
    task1 = asyncio.create_task(broker.consume_forever(DETECTION_STREAM, "risk", "risk-1", process_detection))
    task2 = asyncio.create_task(broker.consume_forever(USB_EVENT_STREAM, "risk_usb", "risk-usb-1", process_usb))
    task3 = asyncio.create_task(broker.consume_forever(LOGIN_EVENT_STREAM, "risk_login", "risk-login-1", process_login))
    task4 = asyncio.create_task(broker.consume_forever(FILE_ACCESS_STREAM, "risk_file", "risk-file-1", process_file_access))
    _bg_tasks.update([task1, task2, task3, task4])
    yield
    task1.cancel()
    task2.cancel()
    task3.cancel()
    task4.cancel()


app = FastAPI(title="hrip-risk", lifespan=lifespan)

@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "risk", "time": datetime.now(UTC).isoformat()}

class OverrideRequest(BaseModel):
    user_id: str
    new_score: float
    reason: str
    analyst_id: str

@app.post("/api/v1/risk/override")
async def override_score(req: OverrideRequest):
    async with session_factory() as session:
        user = await session.get(User, req.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        event = RiskEvent(
            user_id=user.id,
            source="analyst_override",
            old_score=user.risk_score,
            new_score=req.new_score,
            delta=req.new_score - user.risk_score,
            analyst_id=req.analyst_id,
            reason=req.reason
        )
        session.add(event)
        
        user.risk_score = req.new_score
        user.risk_tier = score_to_severity(req.new_score)
        user.data_access_level = score_to_access_level(req.new_score)
        user.score_manually_set = True
        user.score_override_by = req.analyst_id
        user.score_override_at = datetime.now(UTC)
        user.score_override_note = req.reason
        
        await session.commit()
        return {"status": "success", "new_score": req.new_score}
