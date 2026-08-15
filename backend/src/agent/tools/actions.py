"""Action Recording - Agent Tool.

Records actions taken on civic issues in CockroachDB.
"""

import json
import logging
from strands import tool

from src.db.connection import get_cursor

logger = logging.getLogger(__name__)


@tool
def record_action(
    issue_id: str,
    action_type: str,
    description: str,
    status: str = "pending",
    assigned_to: str = "",
) -> str:
    """Record an action being taken on a civic issue.

    Tracks accountability by recording what actions are being taken,
    by whom, and their current status.

    Args:
        issue_id: UUID of the issue.
        action_type: Type of action ('investigation', 'outreach', 'resolution',
                     'escalation', 'job_search', 'referral', 'policy_proposal').
        description: Description of the action.
        status: Current status ('pending', 'in_progress', 'completed', 'blocked').
        assigned_to: Who is responsible for this action.

    Returns:
        JSON string confirming the action recording.
    """
    try:
        with get_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO actions (issue_id, action_type, description, status, assigned_to)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, created_at
                """,
                (issue_id, action_type, description, status, assigned_to),
            )
            result = dict(cursor.fetchone())

            # Add timeline event
            cursor.execute(
                """
                INSERT INTO issue_timeline (issue_id, event_type, description, actor)
                VALUES (%s, 'action_recorded', %s, %s)
                """,
                (
                    issue_id,
                    f"Action ({action_type}): {description[:150]}",
                    assigned_to or "CJP Agent",
                ),
            )

        return json.dumps({
            "success": True,
            "action_id": str(result["id"]),
            "message": f"Action recorded: {action_type} - {description[:100]}",
        }, default=str)

    except Exception as e:
        logger.error(f"Error recording action: {e}")
        return json.dumps({"success": False, "error": str(e)})
