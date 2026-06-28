import asyncio
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from uuid import UUID, uuid4

from fastapi import FastAPI
from sqlalchemy import select

from hrip_shared.auth.passwords import hash_password
from hrip_shared.broker import RedisStreamBroker
from hrip_shared.contracts.events import DetectionEvent, RiskEvent
from hrip_shared.db import Alert, Message, RiskScore, User, session_factory, wait_for_db
from hrip_shared.services.idempotency import already_processed, mark_processed
from hrip_shared.utils.streams import DETECTION_STREAM, RISK_STREAM

from .engine.calculator import calculate_risk, score_to_severity

broker = RedisStreamBroker()


async def _ensure_user(session, receiver: str) -> User:
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


async def process_detection(entry_id: str, payload: dict) -> None:
    event = DetectionEvent.model_validate(payload)
    async with session_factory() as session:
        if await already_processed(session, "risk", entry_id):
            return
        message = await session.get(Message, str(event.message_id))
        if message is None:
            return
        user = await _ensure_user(session, message.receiver)
        score = calculate_risk(event.confidence, event.rules_score, event.intel_hit)
        severity = score_to_severity(score)
        alert_id = str(uuid4())
        session.add(RiskScore(user_id=user.id, score=score, severity=severity))
        user.risk_score = score
        if event.threat_type != "benign" and score >= 40:
            session.add(
                Alert(
                    id=alert_id,
                    message_id=str(event.message_id),
                    detection_id=str(event.detection_id),
                    user_id=user.id,
                    severity=severity,
                    status="open",
                )
            )
        await session.commit()
        risk_event = RiskEvent(
            message_id=event.message_id,
            user_id=UUID(user.id),
            alert_id=UUID(alert_id) if alert_id else UUID(int=0),
            risk_score=score,
            severity=severity,
            threat_type=event.threat_type,
            created_at=datetime.now(UTC),
        )
        await broker.publish(RISK_STREAM, risk_event.model_dump(mode="json"), event_id=entry_id)
        await mark_processed(session, "risk", entry_id)


@asynccontextmanager
async def lifespan(_: FastAPI):
    await wait_for_db()
    task = asyncio.create_task(broker.consume_forever(DETECTION_STREAM, "risk", "risk-1", process_detection))
    yield
    task.cancel()


app = FastAPI(title="hrip-risk", lifespan=lifespan)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "risk", "time": datetime.now(UTC).isoformat()}
