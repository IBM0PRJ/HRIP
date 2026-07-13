import asyncio
import traceback
from redis.asyncio import Redis
from hrip_shared.broker import RedisStreamBroker
from hrip_shared.utils.streams import USB_EVENT_STREAM
from services.triage.app.main import handle_usb

async def run():
    print("Testing consume_forever...")
    b = RedisStreamBroker()
    try:
        await b.consume_forever(USB_EVENT_STREAM, "triage_usb_debug_2", "test-1", handle_usb)
    except Exception as e:
        traceback.print_exc()
        print(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(run())
