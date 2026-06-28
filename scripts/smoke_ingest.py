import asyncio
import os

import httpx


async def main() -> None:
    gateway_url = os.getenv("HRIP_GATEWAY_URL", "http://localhost:8001")
    api_url = os.getenv("HRIP_API_URL", "http://localhost:8000")

    async with httpx.AsyncClient(timeout=10.0) as client:
        login = await client.post(
            f"{gateway_url}/api/v1/auth/login",
            json={"email": "admin@example.com", "password": "ChangeMe123!"},
        )
        login.raise_for_status()
        tokens = login.json()

        ingest = await client.post(
            f"{gateway_url}/api/v1/ingest/email",
            json={
                "sender": "ceo@example.com",
                "receiver": "cfo@example.com",
                "subject": "Urgent wire transfer",
                "body": "Urgent wire transfer required. Click here to review the banking change.",
            },
        )
        ingest.raise_for_status()

        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        alerts = None
        for _ in range(15):
            alerts = await client.get(f"{api_url}/api/v1/alerts", headers=headers)
            alerts.raise_for_status()
            if alerts.json():
                break
            await asyncio.sleep(1)
        print(f"Ingested message: {ingest.json()['message_id']}")
        print(f"Visible alerts: {len(alerts.json())}")


if __name__ == "__main__":
    asyncio.run(main())
