import asyncio
from contextlib import asynccontextmanager
from datetime import UTC, datetime

from fastapi import FastAPI
from pydantic import BaseModel

from hrip_shared.broker import RedisStreamBroker
from hrip_shared.contracts.events import ClipboardEvent, FileAccessEvent, LoginEvent, USBEvent
from hrip_shared.db import session_factory, wait_for_db, AIFlag, User
from sqlalchemy import select
from hrip_shared.utils.streams import (
    CLIPBOARD_EVENT_STREAM,
    FILE_ACCESS_STREAM,
    LOGIN_EVENT_STREAM,
    NETWORK_EVENT_STREAM,
    USB_EVENT_STREAM,
)

from .engine.action_executor import execute_analyst_action
from .engine.triage_engine import process_triage_event

broker = RedisStreamBroker()

async def handle_usb(entry_id: str, payload: dict) -> None:
    event = USBEvent.model_validate(payload)
    await process_triage_event(broker, "usb", entry_id, payload, event.username)

async def handle_login(entry_id: str, payload: dict) -> None:
    event = LoginEvent.model_validate(payload)
    await process_triage_event(broker, "login", entry_id, payload, event.username)

async def handle_file_access(entry_id: str, payload: dict) -> None:
    event = FileAccessEvent.model_validate(payload)
    await process_triage_event(broker, "file_access", entry_id, payload, event.username)

async def handle_clipboard(entry_id: str, payload: dict) -> None:
    event = ClipboardEvent.model_validate(payload)
    await process_triage_event(broker, "clipboard", entry_id, payload, event.username)

async def handle_network(entry_id: str, payload: dict) -> None:
    # Network events use LoginEvent schema (has ip_address, status, reason)
    event = LoginEvent.model_validate(payload)
    await process_triage_event(broker, "network", entry_id, payload, event.username)

import traceback
import logging
logger = logging.getLogger(__name__)

_bg_tasks = set()

async def safe_consume(*args, **kwargs):
    print(f"SAFE CONSUME STARTED for args {args}", flush=True)
    try:
        await broker.consume_forever(*args, **kwargs)
    except Exception as e:
        logger.error(f"Consumer crashed: {e}")
        traceback.print_exc()

@asynccontextmanager
async def lifespan(_: FastAPI):
    await wait_for_db()
    task1 = asyncio.create_task(safe_consume(USB_EVENT_STREAM, "triage_usb", "triage-usb-1", handle_usb))
    task2 = asyncio.create_task(safe_consume(LOGIN_EVENT_STREAM, "triage_login", "triage-login-1", handle_login))
    task3 = asyncio.create_task(safe_consume(FILE_ACCESS_STREAM, "triage_file", "triage-file-1", handle_file_access))
    task4 = asyncio.create_task(safe_consume(CLIPBOARD_EVENT_STREAM, "triage_clip", "triage-clip-1", handle_clipboard))
    task5 = asyncio.create_task(safe_consume(NETWORK_EVENT_STREAM, "triage_net", "triage-net-1", handle_network))
    _bg_tasks.update([task1, task2, task3, task4, task5])
    yield
    task1.cancel()
    task2.cancel()
    task3.cancel()
    task4.cancel()
    task5.cancel()

app = FastAPI(title="hrip-triage", lifespan=lifespan)

@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "triage", "time": datetime.now(UTC).isoformat()}

class ActionRequest(BaseModel):
    analyst_id: str
    action_type: str
    payload: dict

@app.post("/api/v1/flags/{flag_id}/action")
async def execute_action(flag_id: str, req: ActionRequest):
    async with session_factory() as session:
        action_record = await execute_analyst_action(
            session, flag_id, req.action_type, req.payload, req.analyst_id
        )
        await session.commit()
        return {"status": "success", "action_id": action_record.id}

@app.get("/api/v1/flags")
async def get_all_flags():
    async with session_factory() as session:
        result = await session.execute(
            select(AIFlag).order_by(AIFlag.created_at.desc())
        )
        flags = result.scalars().all()
        # Join with user to get names
        flag_data = []
        for f in flags:
            user = await session.get(User, f.user_id)
            d = {
                "id": f.id,
                "user_id": f.user_id,
                "user_name": user.full_name if user else "Unknown",
                "source": f.source,
                "suspicion_score": f.suspicion_score,
                "threat_category": f.threat_category,
                "status": f.status,
                "created_at": f.created_at.isoformat() if f.created_at else None,
                "qwen_reasoning": f.qwen_reasoning,
                "evidence_items": f.evidence_items,
                "employee_context": f.employee_context,
                "recommended_action": f.recommended_action
            }
            flag_data.append(d)
        return flag_data

@app.get("/api/v1/flags/user/{user_id}")
async def get_user_flags(user_id: str):
    async with session_factory() as session:
        result = await session.execute(
            select(AIFlag).where(AIFlag.user_id == user_id).order_by(AIFlag.created_at.desc())
        )
        return result.scalars().all()

class FlagReviewRequest(BaseModel):
    analyst_id: str

@app.post("/api/v1/flags/{flag_id}/confirm")
async def confirm_flag(flag_id: str, req: FlagReviewRequest):
    async with session_factory() as session:
        flag = await session.get(AIFlag, flag_id)
        if not flag:
            return {"status": "error", "message": "Flag not found"}
        
        flag.status = "confirmed"
        flag.reviewed_by = req.analyst_id
        flag.reviewed_at = datetime.now(UTC)
        
        # Simple manual bump here, in real life we could call Risk engine
        user = await session.get(User, flag.user_id)
        if user:
            user.risk_score = min(100.0, user.risk_score + (flag.suspicion_score * 20))
            
        await session.commit()
        return {"status": "success"}

@app.post("/api/v1/flags/{flag_id}/dismiss")
async def dismiss_flag(flag_id: str, req: FlagReviewRequest):
    async with session_factory() as session:
        flag = await session.get(AIFlag, flag_id)
        if not flag:
            return {"status": "error", "message": "Flag not found"}
            
        flag.status = "dismissed"
        flag.reviewed_by = req.analyst_id
        flag.reviewed_at = datetime.now(UTC)
        await session.commit()
        return {"status": "success"}

