import asyncio
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from uuid import UUID, uuid4

from fastapi import FastAPI
from sqlalchemy.ext.asyncio import AsyncSession

from hrip_shared.broker import RedisStreamBroker
from hrip_shared.contracts.events import CleanedMessageEvent, DetectionEvent
from hrip_shared.db import Detection, DetectionFeature, session_factory, wait_for_db
from hrip_shared.services.idempotency import already_processed, mark_processed
from hrip_shared.settings import get_settings
from hrip_shared.utils.streams import CLEANED_MESSAGE_STREAM, DETECTION_STREAM

from .engine.rules import baseline_lgbm_confidence, classify_threat, intel_matches, optional_roberta_confidence, rules_score

broker = RedisStreamBroker()
settings = get_settings()


async def process_cleaned_message(entry_id: str, payload: dict) -> None:
    event = CleanedMessageEvent.model_validate(payload)
    async with session_factory() as session:
        if await already_processed(session, "detection", entry_id):
            return
        score, psychology = rules_score(event.cleaned_text)
        intel_hit = intel_matches(event.extracted_urls)
        lgbm_conf = baseline_lgbm_confidence(event.cleaned_text, event.url_count, score)
        roberta_conf = optional_roberta_confidence(lgbm_conf, settings.roberta_enabled)
        confidence = max(lgbm_conf, roberta_conf)
        threat_type = classify_threat(event.cleaned_text, event.channel, intel_hit)
        model_used = "roberta" if roberta_conf > lgbm_conf else "lgbm"
        detection_id = str(uuid4())
        detection_row = Detection(
            id=detection_id,
            message_id=str(event.message_id),
            threat_type=threat_type,
            confidence=confidence,
            model_used=model_used,
            rules_score=score,
            lgbm_confidence=lgbm_conf,
            roberta_confidence=roberta_conf,
            intel_hit=intel_hit,
            psychology_scores=psychology,
        )
        session.add(detection_row)
        features = [
            ("urgency_language", psychology["urgency"], round(score / 100, 3)),
            ("url_count", float(event.url_count), round(event.url_count * 0.1, 3)),
            ("intel_hit", 1.0 if intel_hit else 0.0, 0.25 if intel_hit else 0.0),
        ]
        for name, value, contrib in features:
            session.add(
                DetectionFeature(
                    detection_id=detection_id,
                    feature_name=name,
                    feature_value=value,
                    shap_contribution=contrib,
                )
            )
        await session.commit()
        outbound = DetectionEvent(
            message_id=event.message_id,
            detection_id=UUID(detection_id),
            threat_type=threat_type,
            confidence=confidence,
            model_used=model_used,
            rules_score=score,
            lgbm_confidence=lgbm_conf,
            roberta_confidence=roberta_conf,
            intel_hit=intel_hit,
            shap_features=[
                {"feature": name, "value": value, "contribution": contrib} for name, value, contrib in features
            ],
            psychology_scores=psychology,
        )
        await broker.publish(DETECTION_STREAM, outbound.model_dump(mode="json"), event_id=entry_id)
        await mark_processed(session, "detection", entry_id)


@asynccontextmanager
async def lifespan(_: FastAPI):
    await wait_for_db()
    task = asyncio.create_task(
        broker.consume_forever(CLEANED_MESSAGE_STREAM, "detection", "det-1", process_cleaned_message)
    )
    yield
    task.cancel()


app = FastAPI(title="hrip-detection", lifespan=lifespan)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "detection", "time": datetime.now(UTC).isoformat()}
