import asyncio
from uuid import uuid4
from hrip_shared.db.session import session_factory
from hrip_shared.db.models import TrainingModule

async def run_seed():
    async with session_factory() as session:
        training_modules = [
            TrainingModule(
                id=str(uuid4()),
                title="Defeating CEO Fraud & Business Email Compromise",
                threat_type="CEO_fraud",
                video_url="https://example.com/training/ceo_fraud.mp4",
                reading_material_url="https://example.com/docs/ceo_fraud.pdf",
                quiz_json={
                    "questions": [
                        {"q": "What should you do if the CEO urgently requests a wire transfer via email?", "options": ["Process it immediately", "Call them to verify", "Forward to a friend"], "answer": 1}
                    ]
                }
            ),
            TrainingModule(
                id=str(uuid4()),
                title="Smishing and Mobile Security",
                threat_type="smishing",
                video_url="https://example.com/training/smishing.mp4",
                reading_material_url="https://example.com/docs/smishing.pdf",
                quiz_json={
                    "questions": [
                        {"q": "Is it safe to click a password reset link in an unexpected SMS?", "options": ["Yes", "No, never"], "answer": 1}
                    ]
                }
            ),
            TrainingModule(
                id=str(uuid4()),
                title="General Phishing Hygiene",
                threat_type="phishing",
                video_url="https://example.com/training/phishing.mp4",
                reading_material_url="https://example.com/docs/phishing.pdf",
                quiz_json={
                    "questions": [
                        {"q": "Which of these is a red flag in an email?", "options": ["Generic greeting", "Urgent language", "Both"], "answer": 2}
                    ]
                }
            )
        ]
        session.add_all(training_modules)
        await session.commit()

if __name__ == "__main__":
    asyncio.run(run_seed())
