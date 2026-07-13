import time
import uuid
import json
import logging
from datetime import datetime, UTC
import redis
import os
import getpass
try:
    import wmi
except ImportError:
    wmi = None

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("usb_monitor")

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
try:
    redis_client = redis.from_url(REDIS_URL)
except Exception as e:
    logger.error(f"Failed to connect to Redis: {e}")
    redis_client = None

def publish_event(action: str, device_name: str, vid_pid: str):
    event = {
        "event_id": str(uuid.uuid4()),
        "username": getpass.getuser(),
        "device_name": device_name,
        "vid_pid": vid_pid,
        "action": action,
        "file_size_bytes": None,
        "timestamp": datetime.now(UTC).isoformat()
    }
    if redis_client:
        try:
            redis_client.xadd("hrip.events.usb", {"payload": json.dumps(event)})
            logger.info(f"Published USB event: {event}")
        except Exception as e:
            logger.error(f"Failed to publish to redis: {e}")
    else:
        logger.info(f"Mock publish USB event: {event}")

def monitor_usb():
    logger.info("Starting USB Monitor (WMI)...")
    if not wmi:
        logger.error("wmi python package not installed. Run `pip install wmi`")
        logger.info("Falling back to mock mode for testing...")
        while True:
            time.sleep(60)
            
    try:
        c = wmi.WMI()
        watcher = c.Win32_PnPEntity.watch_for("creation")
        while True:
            device = watcher()
            if device.PNPClass == "USB":
                logger.info(f"New USB Device Connected: {device.Caption}")
                publish_event("connected", device.Caption or "Unknown USB", device.DeviceID or "Unknown ID")
    except Exception as e:
        logger.error(f"WMI Monitoring failed: {e}")
        logger.info("Falling back to mock mode for testing...")
        while True:
            time.sleep(60)

if __name__ == "__main__":
    monitor_usb()
