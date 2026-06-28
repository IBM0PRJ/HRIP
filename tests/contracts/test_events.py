from datetime import UTC, datetime
from uuid import uuid4

from hrip_shared.contracts.events import MessageMetadataPayload, RawMessageEvent


def test_raw_message_event_schema() -> None:
    event = RawMessageEvent(
        message_id=uuid4(),
        channel="email",
        sender="ceo@example.com",
        receiver="analyst@example.com",
        subject="Urgent",
        body="Click here",
        received_at=datetime.now(UTC),
        metadata=MessageMetadataPayload(sender_ip="1.2.3.4"),
    )
    payload = event.model_dump(mode="json")
    assert payload["channel"] == "email"
    assert payload["metadata"]["sender_ip"] == "1.2.3.4"

