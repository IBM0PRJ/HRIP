from datetime import UTC, datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from hrip_shared.broker import RedisStreamBroker
from hrip_shared.contracts.api import IdResponse
from hrip_shared.contracts.events import MessageMetadataPayload, RawMessageEvent
from hrip_shared.db import Message, MessageMetadata, OutboxEvent, get_db
from hrip_shared.services.outbox import flush_outbox
from hrip_shared.settings import get_settings
from hrip_shared.utils.streams import RAW_MESSAGE_STREAM
from hrip_shared.voice import persist_voice_upload

from ..schemas import EmailIngestRequest, SmsIngestRequest

router = APIRouter(prefix="/api/v1/ingest", tags=["ingest"])
settings = get_settings()
broker = RedisStreamBroker()


def _sender_domain(sender: str) -> str | None:
    return sender.split("@", 1)[1] if "@" in sender else None


@router.post("/email", response_model=IdResponse)
async def ingest_email(payload: EmailIngestRequest, db: AsyncSession = Depends(get_db)) -> IdResponse:
    message_id = uuid4()
    correlation_id = uuid4()
    event = RawMessageEvent(
        message_id=message_id,
        channel="email",
        sender=str(payload.sender),
        receiver=str(payload.receiver),
        subject=payload.subject,
        body=payload.body,
        received_at=payload.received_at,
        metadata=MessageMetadataPayload(
            sender_ip=payload.sender_ip,
            reply_to=payload.reply_to,
        ),
    )
    db.add(
        Message(
            id=str(message_id),
            sender=event.sender,
            receiver=event.receiver,
            subject=event.subject,
            body=event.body,
            channel=event.channel,
            received_at=event.received_at,
        )
    )
    db.add(
        MessageMetadata(
            message_id=str(message_id),
            sender_domain=_sender_domain(event.sender),
            reply_to=str(payload.reply_to) if payload.reply_to else None,
            attachment_count=0,
            url_count=0,
            channel_meta={"sender_ip": payload.sender_ip},
        )
    )
    db.add(
        OutboxEvent(
            aggregate_id=str(message_id),
            stream_name=RAW_MESSAGE_STREAM,
            payload=event.model_dump(mode="json"),
        )
    )
    await db.commit()
    await flush_outbox(db, broker)
    return IdResponse(message_id=message_id, status="queued", correlation_id=correlation_id)


@router.post("/sms", response_model=IdResponse)
async def ingest_sms(payload: SmsIngestRequest, db: AsyncSession = Depends(get_db)) -> IdResponse:
    message_id = uuid4()
    correlation_id = uuid4()
    event = RawMessageEvent(
        message_id=message_id,
        channel="sms",
        sender=payload.sender,
        receiver=payload.receiver,
        subject=None,
        body=payload.body,
        received_at=payload.received_at,
        metadata=MessageMetadataPayload(channel_specific={"sender_number": payload.sender}),
    )
    db.add(
        Message(
            id=str(message_id),
            sender=event.sender,
            receiver=event.receiver,
            subject=event.subject,
            body=event.body,
            channel=event.channel,
            received_at=event.received_at,
        )
    )
    db.add(
        MessageMetadata(
            message_id=str(message_id),
            attachment_count=0,
            url_count=0,
            channel_meta={"sender_number": payload.sender},
        )
    )
    db.add(
        OutboxEvent(
            aggregate_id=str(message_id),
            stream_name=RAW_MESSAGE_STREAM,
            payload=event.model_dump(mode="json"),
        )
    )
    await db.commit()
    await flush_outbox(db, broker)
    return IdResponse(message_id=message_id, status="queued", correlation_id=correlation_id)


@router.post("/voice", response_model=IdResponse)
async def ingest_voice(
    file: UploadFile = File(...),
    sender: str = Form(default="voice-upload@example.com"),
    receiver: str = Form(default="analyst@example.com"),
    received_at: str | None = Form(default=None),
    db: AsyncSession = Depends(get_db),
) -> IdResponse:
    if not settings.voice_ingest_enabled:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Voice ingestion disabled")
    contents = await file.read()
    message_id = uuid4()
    correlation_id = uuid4()
    try:
        channel_meta = persist_voice_upload(message_id, file.filename, contents, file.content_type, settings)
    except ValueError as exc:
        detail = str(exc)
        if "maximum size" in detail:
            raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail=detail) from exc
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=detail) from exc
    try:
        resolved_received_at = datetime.fromisoformat(received_at) if received_at else datetime.now(UTC)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid received_at timestamp") from exc
    event = RawMessageEvent(
        message_id=message_id,
        channel="voice",
        sender=sender,
        receiver=receiver,
        subject=file.filename,
        body="",
        received_at=resolved_received_at,
        metadata=MessageMetadataPayload(
            channel_specific=channel_meta
        ),
    )
    db.add(
        Message(
            id=str(message_id),
            sender=event.sender,
            receiver=event.receiver,
            subject=event.subject,
            body=event.body,
            channel=event.channel,
            received_at=event.received_at,
        )
    )
    db.add(
        MessageMetadata(
            message_id=str(message_id),
            attachment_count=1,
            url_count=0,
            sender_domain=_sender_domain(event.sender),
            channel_meta=event.metadata.model_dump(mode="json"),
        )
    )
    db.add(
        OutboxEvent(
            aggregate_id=str(message_id),
            stream_name=RAW_MESSAGE_STREAM,
            payload=event.model_dump(mode="json"),
        )
    )
    await db.commit()
    await flush_outbox(db, broker)
    return IdResponse(message_id=message_id, status="queued", correlation_id=correlation_id)
