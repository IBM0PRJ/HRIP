import asyncio
from hrip_shared.db.base import Base
from hrip_shared.db.models import *
from hrip_shared.db.session import engine

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
if __name__ == "__main__":
    asyncio.run(init_db())
