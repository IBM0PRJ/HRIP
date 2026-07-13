from datetime import datetime, timezone
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from hrip_shared.auth.jwt import require_token
from hrip_shared.db import TrainingModule, TrainingAssignment, User, get_db

router = APIRouter(prefix="/api/v1/training", tags=["training"], dependencies=[Depends(require_token)])

class AssignmentCreate(BaseModel):
    user_id: str
    module_id: str

class AssignmentComplete(BaseModel):
    quiz_score: int
    passed: bool

@router.get("/modules")
async def list_modules(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TrainingModule))
    return result.scalars().all()

@router.get("/modules/{module_id}")
async def get_module(module_id: str, db: AsyncSession = Depends(get_db)):
    module = await db.get(TrainingModule, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    return module

@router.get("/assignments/{user_id}")
async def get_user_assignments(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TrainingAssignment, TrainingModule)
        .join(TrainingModule, TrainingModule.id == TrainingAssignment.module_id)
        .where(TrainingAssignment.user_id == user_id)
    )
    rows = result.all()
    return [
        {
            "id": assignment.id,
            "assigned_at": assignment.assigned_at,
            "completed_at": assignment.completed_at,
            "quiz_score": assignment.quiz_score,
            "passed": assignment.passed,
            "module": {
                "id": module.id,
                "title": module.title,
                "threat_type": module.threat_type,
                "video_url": module.video_url,
                "reading_material_url": module.reading_material_url,
                "quiz_json": module.quiz_json,
            }
        }
        for assignment, module in rows
    ]

@router.post("/assignments")
async def create_assignment(payload: AssignmentCreate, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    user = await db.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check if module exists
    module = await db.get(TrainingModule, payload.module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
        
    assignment = TrainingAssignment(
        user_id=payload.user_id,
        module_id=payload.module_id,
    )
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)
    return assignment

@router.post("/assignments/{assignment_id}/complete")
async def complete_assignment(assignment_id: str, payload: AssignmentComplete, db: AsyncSession = Depends(get_db)):
    assignment = await db.get(TrainingAssignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    assignment.completed_at = datetime.now(timezone.utc)
    assignment.quiz_score = payload.quiz_score
    assignment.passed = payload.passed
    
    # Optional: We could also trigger an event on redis to lower the user's risk score
    # But that logic belongs to a separate pipeline or the risk service
    
    await db.commit()
    await db.refresh(assignment)
    return assignment
