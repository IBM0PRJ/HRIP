import time
import uuid
import json
import logging
from datetime import datetime, UTC
import redis
import os
import getpass
try:
    import win32evtlog
except ImportError:
    win32evtlog = None

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("login_monitor")

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
try:
    redis_client = redis.from_url(REDIS_URL)
except Exception as e:
    logger.error(f"Failed to connect to Redis: {e}")
    redis_client = None

def publish_event(status: str, reason: str = None):
    event = {
        "event_id": str(uuid.uuid4()),
        "username": getpass.getuser(),
        "ip_address": "127.0.0.1",
        "status": status,
        "reason": reason,
        "timestamp": datetime.now(UTC).isoformat()
    }
    if redis_client:
        try:
            redis_client.xadd("hrip.events.login", {"payload": json.dumps(event)})
            logger.info(f"Published Login event: {event}")
        except Exception as e:
            logger.error(f"Failed to publish to redis: {e}")
    else:
        logger.info(f"Mock publish Login event: {event}")

def monitor_logins():
    logger.info("Starting Login Monitor (Event Logs)...")
    if not win32evtlog:
        logger.error("pywin32 package not installed. Run `pip install pywin32`")
        logger.info("Falling back to mock mode for testing...")
        while True:
            time.sleep(60)
            
    server = 'localhost'
    log_type = 'Security'
    
    try:
        hand = win32evtlog.OpenEventLog(server, log_type)
        flags = win32evtlog.EVENTLOG_BACKWARDS_READ | win32evtlog.EVENTLOG_SEQUENTIAL_READ
        while True:
            events = win32evtlog.ReadEventLog(hand, flags, 0)
            if events:
                for event in events:
                    if event.EventID == 4625:
                        logger.info("Failed Login detected")
                        publish_event("failed", "Event 4625")
                    elif event.EventID == 4624:
                        current_hour = datetime.now().hour
                        if current_hour < 7 or current_hour > 22:
                            logger.info("Off-hours Login detected")
                            publish_event("success", "off_hours")
            time.sleep(10)
    except Exception as e:
        logger.error(f"Event Log Monitoring failed (requires Admin?): {e}")
        logger.info("Falling back to mock mode for testing...")
        while True:
            time.sleep(60)

if __name__ == "__main__":
    monitor_logins()
