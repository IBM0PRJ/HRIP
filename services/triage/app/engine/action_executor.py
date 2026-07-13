import logging
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from hrip_shared.db import AnalystAction, TrainingAssignment, TrainingModule, User

logger = logging.getLogger(__name__)

async def execute_analyst_action(
    session: AsyncSession,
    flag_id: str,
    action_type: str,
    payload: dict,
    analyst_id: str
) -> AnalystAction:
    """
    Executes a real-time response action chosen by the analyst and logs it.
    """
    logger.info(f"Executing action {action_type} for flag {flag_id}")
    
    # 1. Record the action
    action_record = AnalystAction(
        flag_id=flag_id,
        action_type=action_type,
        payload=payload,
        executed_by=analyst_id,
        executed_at=datetime.now(UTC)
    )
    session.add(action_record)
    
    # 2. Execute side effects based on action type
    # For now, we stub out external calls but implement database updates
    
    if action_type == "session_suspend":
        # We assume there's a user ID in the payload to suspend
        user_id = payload.get("user_id")
        if user_id:
            user = await session.get(User, user_id)
            if user:
                # Mark as suspended in data_access_level
                user.data_access_level = "suspended"
                logger.info(f"Suspended user {user_id}")
                
    elif action_type == "usb_block":
        # In a real app, this would call an MDM / endpoint agent API
        device_id = payload.get("device_id")
        logger.info(f"Blocked USB device {device_id}")
        
    elif action_type == "network_disconnect":
        # In a real app, this would call a firewall / VPN API
        ip = payload.get("destination_ip")
        logger.info(f"Disconnected network to {ip}")
        
    elif action_type == "file_quarantine":
        # In a real app, this would call DLP API
        file_path = payload.get("file_path")
        logger.info(f"Quarantined file {file_path}")
        
    elif action_type == "notify":
        # Send an in-app notification (could use a dedicated NOTIFICATION_STREAM)
        message = payload.get("message")
        logger.info(f"Sent notification: {message}")
        
    elif action_type == "training":
        # Assign a training module
        user_id = payload.get("user_id")
        threat_type = payload.get("threat_type", "phishing")
        if user_id:
            result = await session.execute(
                select(TrainingModule).where(TrainingModule.threat_type == threat_type)
            )
            module = result.scalar_one_or_none()
            if module:
                assignment = TrainingAssignment(
                    user_id=user_id,
                    module_id=module.id
                )
                session.add(assignment)
                logger.info(f"Assigned training module {module.id} to {user_id}")
            else:
                logger.warning(f"No training module found for {threat_type}")

    return action_record
