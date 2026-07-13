import time
import uuid
import json
import logging
from datetime import datetime, UTC
import redis
import os
import getpass
try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
except ImportError:
    Observer = None
    FileSystemEventHandler = object

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("file_access_monitor")

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
try:
    redis_client = redis.from_url(REDIS_URL)
except Exception as e:
    logger.error(f"Failed to connect to Redis: {e}")
    redis_client = None

class SensitiveFileHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if not event.is_directory:
            publish_event(event.src_path, "write")
            
    def on_created(self, event):
        if not event.is_directory:
            publish_event(event.src_path, "write")
            
    def on_moved(self, event):
        if not event.is_directory:
            publish_event(event.dest_path, "write")

def publish_event(file_path: str, action: str):
    event = {
        "event_id": str(uuid.uuid4()),
        "username": getpass.getuser(),
        "file_path": file_path,
        "action": action,
        "timestamp": datetime.now(UTC).isoformat()
    }
    if redis_client:
        try:
            redis_client.xadd("hrip.events.file_access", {"payload": json.dumps(event)})
            logger.info(f"Published File Access event: {event}")
        except Exception as e:
            logger.error(f"Failed to publish to redis: {e}")
    else:
        logger.info(f"Mock publish File Access event: {event}")

def monitor_files():
    path = os.environ.get("SENSITIVE_DIR", os.path.expanduser("~/Documents"))
    logger.info(f"Starting File Access Monitor on {path}...")
    
    if not Observer:
        logger.error("watchdog python package not installed. Run `pip install watchdog`")
        logger.info("Falling back to mock mode for testing...")
        while True:
            time.sleep(60)

    event_handler = SensitiveFileHandler()
    observer = Observer()
    observer.schedule(event_handler, path, recursive=True)
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

if __name__ == "__main__":
    monitor_files()
