import asyncio

from hrip_shared.db import init_db, seed_demo_data, session_factory


async def main() -> None:
    await init_db()
    async with session_factory() as session:
        await seed_demo_data(session)
    print("Database initialized and demo data seeded.")


if __name__ == "__main__":
    asyncio.run(main())
