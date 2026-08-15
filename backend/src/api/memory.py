"""Persistent Memory Endpoints.

Demonstrates CockroachDB as persistent agentic memory across sessions.
The agent can retrieve full issue context from a previous session.
"""

import json
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException

from src.db.connection import get_cursor

logger = logging.getLogger(__name__)

memory_router = APIRouter(prefix="/api/memory", tags=["memory"])


@memory_router.get("/recent-issues")
async def get_recent_issues_for_user(user_id: Optional[str] = None, limit: int = 5):
    """Retrieve recent issues the user was involved with.

    This is the key endpoint for cross-session memory retrieval.
    When a user says 'continue where we left off', the agent uses this
    to recover full state from CockroachDB.
    """
    try:
        with get_cursor() as cursor:
            if user_id:
                # Find issues from user's conversations
                cursor.execute(
                    """
                    SELECT DISTINCT i.id, i.title, i.description, i.category,
                           i.status, i.priority, i.report_count,
                           i.created_at, i.updated_at,
                           c.updated_at as last_conversation_at
                    FROM issues i
                    JOIN conversations c ON c.issue_id = i.id
                    WHERE c.user_id = %s
                    ORDER BY c.updated_at DESC
                    LIMIT %s
                    """,
                    (user_id, limit),
                )
            else:
                # Get most recent active issues
                cursor.execute(
                    """
                    SELECT id, title, description, category, status, priority,
                           report_count, created_at, updated_at
                    FROM issues
                    WHERE status != 'closed'
                    ORDER BY updated_at DESC
                    LIMIT %s
                    """,
                    (limit,),
                )
            issues = [dict(row) for row in cursor.fetchall()]

        return {"issues": issues, "total": len(issues)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@memory_router.get("/conversation-context/{conversation_id}")
async def get_conversation_context(conversation_id: str):
    """Retrieve full context for a previous conversation.

    Returns the conversation, linked issue, and all associated data
    so the agent can resume exactly where it left off.
    """
    try:
        context = {}

        with get_cursor() as cursor:
            # Get conversation
            cursor.execute(
                """
                SELECT id, user_id, title, issue_id, context, status,
                       created_at, updated_at
                FROM conversations WHERE id = %s
                """,
                (conversation_id,),
            )
            conversation = cursor.fetchone()
            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")
            context["conversation"] = dict(conversation)

            # Get messages
            cursor.execute(
                """
                SELECT role, content, created_at
                FROM messages WHERE conversation_id = %s
                ORDER BY created_at ASC
                """,
                (conversation_id,),
            )
            context["messages"] = [dict(row) for row in cursor.fetchall()]

            # If linked to an issue, get full issue context
            if conversation["issue_id"]:
                issue_id = conversation["issue_id"]

                cursor.execute(
                    """
                    SELECT id, title, description, category, location, status,
                           priority, confidence, report_count, created_at, updated_at
                    FROM issues WHERE id = %s
                    """,
                    (issue_id,),
                )
                issue = cursor.fetchone()
                if issue:
                    context["issue"] = dict(issue)

                    # Timeline
                    cursor.execute(
                        """
                        SELECT event_type, description, actor, created_at
                        FROM issue_timeline WHERE issue_id = %s
                        ORDER BY created_at DESC LIMIT 10
                        """,
                        (issue_id,),
                    )
                    context["recent_timeline"] = [dict(r) for r in cursor.fetchall()]

                    # Recent actions
                    cursor.execute(
                        """
                        SELECT action_type, description, status, created_at
                        FROM actions WHERE issue_id = %s
                        ORDER BY created_at DESC LIMIT 5
                        """,
                        (issue_id,),
                    )
                    context["recent_actions"] = [dict(r) for r in cursor.fetchall()]

                    # Job matches
                    cursor.execute(
                        """
                        SELECT jm.match_score, jm.match_reason, jm.status,
                               jo.title as job_title, jo.company, jo.apply_url
                        FROM job_matches jm
                        JOIN job_opportunities jo ON jm.job_id = jo.id
                        WHERE jm.issue_id = %s
                        ORDER BY jm.match_score DESC LIMIT 5
                        """,
                        (issue_id,),
                    )
                    context["job_matches"] = [dict(r) for r in cursor.fetchall()]

            # Get agent actions for this conversation
            cursor.execute(
                """
                SELECT tool_name, action, status, created_at
                FROM agent_actions WHERE conversation_id = %s
                ORDER BY created_at DESC LIMIT 10
                """,
                (conversation_id,),
            )
            context["agent_history"] = [dict(r) for r in cursor.fetchall()]

        return context
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@memory_router.get("/search")
async def search_memory(query: str, limit: int = 10):
    """Search persistent civic memory using semantic search.

    This endpoint allows direct semantic search across all civic memory
    for demo purposes and agent memory recovery.
    """
    try:
        from src.vector.search import get_vector_search

        vector_search = get_vector_search()

        # Search issues
        issues = vector_search.search_similar_issues(query, limit=limit, threshold=0.6)

        # Search reports
        reports = vector_search.search_similar_reports(query, limit=limit, threshold=0.6)

        return {
            "query": query,
            "related_issues": [
                {
                    "id": str(i["id"]),
                    "title": i["title"],
                    "description": i["description"][:200],
                    "status": i["status"],
                    "similarity": round(i["similarity"], 3),
                }
                for i in issues
            ],
            "related_reports": [
                {
                    "id": str(r["id"]),
                    "content": r["content"][:200],
                    "similarity": round(r["similarity"], 3),
                }
                for r in reports
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
