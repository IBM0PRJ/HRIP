import logging
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from hrip_shared.ai.multi_source_analyzer import run_qwen_for_source
from hrip_shared.broker import RedisStreamBroker
from hrip_shared.contracts.events import AIFlagEvent
from hrip_shared.db import AIFlag, RiskEvent, User, session_factory
from hrip_shared.services.idempotency import already_processed, mark_processed
from hrip_shared.utils.streams import AI_FLAG_STREAM

logger = logging.getLogger(__name__)


async def _get_employee_context(session: AsyncSession, username: str) -> dict:
    # Handle email vs username formatting
    search_term = username if "@" in username else f"{username}@"
    
    result = await session.execute(
        select(User).where(User.email.ilike(f"{search_term}%"))
    )
    user = result.scalar_one_or_none()
    
    if not user:
        return {
            "risk_score": 0.0,
            "risk_tier": "safe",
            "department": "unknown",
            "privilege": "standard",
            "recent_flags": []
        }
        
    flags_result = await session.execute(
        select(AIFlag).where(AIFlag.user_id == user.id).order_by(AIFlag.created_at.desc()).limit(5)
    )
    flags = flags_result.scalars().all()
    
    recent_flags = []
    for f in flags:
        recent_flags.append({
            "source": f.source,
            "threat_category": f.threat_category,
            "suspicion_score": f.suspicion_score,
            "created_at": f.created_at.isoformat() if f.created_at else "Unknown"
        })
        
    return {
        "user_id": user.id,
        "risk_score": user.risk_score,
        "risk_tier": user.risk_tier,
        "department": user.department,
        "privilege": user.privilege,
        "recent_flags": recent_flags
    }


async def process_triage_event(
    broker: RedisStreamBroker,
    source: str,
    entry_id: str,
    payload: dict,
    username: str
) -> None:
    async with session_factory() as session:
        idem_key = f"triage_{source}"
        if await already_processed(session, idem_key, entry_id):
            return
            
        context = await _get_employee_context(session, username)
        
        # If we couldn't resolve the user, we skip creating an AI flag.
        # Alternatively, we could create the user, but the Risk service already does this.
        user_id = context.get("user_id")
        if not user_id:
            logger.warning(f"User {username} not found, skipping triage analysis.")
            await mark_processed(session, idem_key, entry_id)
            return

        print(f"[{source}] User resolved: {user_id}", flush=True)

        analysis = run_qwen_for_source(source, payload, context)
        print(f"[{source}] Analysis result: {analysis}", flush=True)
        
        if analysis:
            suspicion_score = analysis.get("suspicion_score", 0.0)
            print(f"[{source}] Score: {suspicion_score}", flush=True)
            
            if suspicion_score >= 0.60:
                # Create AIFlag
                flag = AIFlag(
                    user_id=user_id,
                    source=source,
                    event_data=payload,
                    suspicion_score=suspicion_score,
                    threat_category=analysis.get("threat_category", "unknown"),
                    evidence_items=analysis.get("evidence_items", []),
                    employee_context=context,
                    recommended_action=analysis.get("recommended_action"),
                    qwen_reasoning=analysis.get("reasoning"),
                    status="pending"
                )
                session.add(flag)
                print(f"[{source}] Committing flag to DB...", flush=True)
                await session.commit()
                print(f"[{source}] Committed flag {flag.id} to DB!", flush=True)
                
                # Publish to AI_FLAG_STREAM
                flag_event = AIFlagEvent(
                    flag_id=UUID(flag.id),
                    user_id=UUID(user_id),
                    source=source,
                    suspicion_score=suspicion_score,
                    threat_category=flag.threat_category,
                    evidence_items=flag.evidence_items,
                    recommended_action=flag.recommended_action,
                    created_at=datetime.now(UTC)
                )
                await broker.publish(AI_FLAG_STREAM, flag_event.model_dump(mode="json"), event_id=flag.id)
            else:
                logger.info(f"{source} event {entry_id} score {suspicion_score} < 0.60. Ignoring.")
        
        await mark_processed(session, idem_key, entry_id)
