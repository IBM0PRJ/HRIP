import asyncio
import uuid
from datetime import UTC, datetime
from hrip_shared.ai.multi_source_analyzer import run_qwen_for_source
from hrip_shared.db import session_factory, User
from sqlalchemy import select

async def main():
    async with session_factory() as session:
        user_res = await session.execute(select(User).where(User.email == "analyst@example.com"))
        user = user_res.scalar_one_or_none()
        
        context = {
            "user_id": user.id,
            "risk_score": user.risk_score,
            "risk_tier": user.risk_tier,
            "department": user.department,
            "privilege": user.privilege,
            "recent_flags": []
        }
        
        usb_event = {
            "event_id": str(uuid.uuid4()),
            "username": "analyst@example.com",
            "device_name": "SanDisk Cruzer Force",
            "vid_pid": "0781:557d",
            "action": "file_copied",
            "file_size_bytes": 105000000,
            "timestamp": datetime.now(UTC).isoformat()
        }
        
        print("Running Gemini analysis...")
        res = run_qwen_for_source("usb", usb_event, context)
        print("Result:", res)

if __name__ == "__main__":
    asyncio.run(main())
