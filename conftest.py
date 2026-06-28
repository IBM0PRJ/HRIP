import os
import sys
from pathlib import Path

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./hrip_test.db"
os.environ["REDIS_URL"] = "redis://localhost:6379/15"
os.environ["DEFAULT_ADMIN_EMAIL"] = "admin@example.com"

ROOT = Path(__file__).resolve().parent
SHARED_ROOT = ROOT / "shared"

for path in (ROOT, SHARED_ROOT):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))
