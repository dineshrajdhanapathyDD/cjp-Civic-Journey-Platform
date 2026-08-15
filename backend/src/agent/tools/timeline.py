"""Timeline Management - Agent Tools.

Manages the accountability timeline for civic issues in CockroachDB.
"""

import json
import logging
from strands import tool

from src.db.connection import get_cursor

logger = logging.getLogger(__name__)


@tool
def get_issue_timeline(issue_id: str, limit: int = 30) -> str:
    """Retrieve the accountability timeline for a civic issue.

    Returns the chronological history of events, actions, and changes
    for persistent issue tracking across sessions.

    Args:
        issue_id: UUID of the issue.
        limit: Maximum timeline events to return.

    Returns:
        JSON string with timeline events in chronological order.
    """
    try:
        with get_cursor() as cursor:
            cursor.execute(
                """
                SELECT id, event_type, description, actor, metadata, created_at
                FROM issue_timeline
                WHERE issue_id = %s
                ORDER BY created_at ASC
                LIMIT %s
                """,
                (issue_id, limit),
            )
            events = [dict(row) for row in cursor.fetchall()]

        return json.dumps({
            "success": True,
            "issue_id": issue_id,
            "timeline": [
                {
                    "id": str(e["id"]),
                    "event_type": e["event_type"],
                    "description": e["description"],
                    "actor": e["actor"],
                    "created_at": str(e["created_at"]),
                }
                for e in events
            ],
            "total_events": len(events),
        }, default=str)

    except Exception as e:
        logger.error(f"Error getting timeline: {e}")
        return json.dumps({"success": False, "error": str(e)})


@tool
def add_timeline_event(
    issue_id: str,
    event_type: str,
    description: str,
    actor: str = "CJP Agent",
) -> str:
    """Add an event to the civic issue accountability timeline.

    Args:
        issue_id: UUID of the issue.
        event_type: Type of event ('created', 'updated', 'report_added', 'evidence_added',
                   'action_recorded', 'job_matched', 'status_changed', 'response_received',
                   'escalated', 'resolved').
        description: Human-readable description of the event.
        actor: Who/what triggered this event.

    Returns:
        JSON string confirming the timeline event.
    """
    try:
        with get_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO issue_timeline (issue_id, event_type, description, actor)
                VALUES (%s, %s, %s, %s)
                RETURNING id, created_at
                """,
                (issue_id, event_type, description, actor),
            )
            result = dict(cursor.fetchone())

        return json.dumps({
            "success": True,
            "event_id": str(result["id"]),
            "message": f"Timeline event recorded: {event_type}",
        }, default=str)

    except Exception as e:
        logger.error(f"Error adding timeline event: {e}")
        return json.dumps({"success": False, "error": str(e)})
