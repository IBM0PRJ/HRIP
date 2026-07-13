import asyncio
from hrip_shared.db.session import session_factory
from hrip_shared.db.bootstrap import seed_demo_data

async def run_seed():
    async with session_factory() as session:
        await seed_demo_data(session)

if __name__ == "__main__":
    asyncio.run(run_seed())
