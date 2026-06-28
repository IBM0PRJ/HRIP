import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import UTC, datetime

from sqlalchemy import select

from fastapi import FastAPI

from hrip_shared.broker import RedisStreamBroker
from hrip_shared.contracts.events import CleanedMessageEvent, RawMessageEvent
from hrip_shared.db import Message, MessageMetadata, session_factory, wait_for_db
from hrip_shared.services.idempotency import already_processed, mark_processed
from hrip_shared.settings import get_settings
from hrip_shared.utils.streams import CLEANED_MESSAGE_STREAM, RAW_MESSAGE_STREAM

from .processors.cleaner import clean_text, detect_language, extract_urls, sender_domain
from .processors.transcriber import OptionalWhisperTranscriber

broker = RedisStreamBroker()
settings = get_settings()
transcriber = OptionalWhisperTranscriber(settings)
logger = logging.getLogger(__name__)


async def process_raw_message(entry_id: str, payload: dict) -> None:
    event = RawMessageEvent.model_validate(payload)
    async with session_factory() as session:
        if await already_processed(session, "preprocessing", entry_id):
            return
        body = event.body
        transcription_meta = {}
        if event.channel == "voice":
            body, transcription_meta = await transcriber.transcribe(event.metadata.channel_specific)
        urls = extract_urls(body)
        cleaned = CleanedMessageEvent(
            message_id=event.message_id,
            channel=event.channel,
            cleaned_text=clean_text(body),
            extracted_urls=urls,
            language=detect_language(body),
            url_count=len(urls),
            attachment_count=len(event.metadata.attachments),
            attachment_scan={"dangerous_ext": False, "mime_mismatch": False},
            sender_domain=sender_domain(event.sender),
            domain_age_days=0,
            original_metadata=event.metadata.model_dump(mode="json"),
        )
        result = await session.execute(select(MessageMetadata).where(MessageMetadata.message_id == str(event.message_id)))
        metadata = result.scalar_one_or_none()
        if metadata:
            metadata.url_count = len(urls)
            metadata.attachment_count = len(event.metadata.attachments)
            metadata.sender_domain = cleaned.sender_domain
            metadata.language = cleaned.language
            metadata.channel_meta = {
                **metadata.channel_meta,
                **transcription_meta,
                "transcript_preview": body[:160],
            }
        message = await session.get(Message, str(event.message_id))
        if message:
            message.body = body
        await session.commit()
        await broker.publish(CLEANED_MESSAGE_STREAM, cleaned.model_dump(mode="json"), event_id=entry_id)
        await mark_processed(session, "preprocessing", entry_id)


@asynccontextmanager
async def lifespan(_: FastAPI):
    await wait_for_db()
    await transcriber.startup_check()
    logger.info("Preprocessing transcriber backend status: %s", transcriber.backend_status)
    task = asyncio.create_task(
        broker.consume_forever(RAW_MESSAGE_STREAM, "preprocessing", "pre-1", process_raw_message)
    )
    yield
    task.cancel()


app = FastAPI(title="hrip-preprocessing", lifespan=lifespan)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "preprocessing", "time": datetime.now(UTC).isoformat()}
