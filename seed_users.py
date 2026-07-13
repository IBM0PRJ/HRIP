import asyncio
from hrip_shared.db import session_factory, User
from hrip_shared.auth.passwords import hash_password
from sqlalchemy import select

async def main():
    async with session_factory() as session:
        for username in ["cfo@example.com", "ops.manager@example.com", "analyst@example.com"]:
            email = username
            if "@" not in username:
                email = f"{username}@example.com"
            result = await session.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()
            if not user:
                user = User(
                    email=email,
                    full_name=username.split('@')[0].replace('.', ' ').title(),
                    role="employee",
                    department="unknown",
                    privilege="standard",
                    password_hash=hash_password("TempPassword123!")
                )
                session.add(user)
        await session.commit()
        print("Users seeded!")

if __name__ == "__main__":
    asyncio.run(main())
