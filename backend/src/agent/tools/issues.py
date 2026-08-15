"""Issue Management - Agent Tools.

Tools for creating, updating, and retrieving civic issues in CockroachDB.
"""

import json
import logging
from typing import Optional
from strands import tool

from src.db.connection import get_cursor
from src.vector.embeddings import get_embedding_service
from src.vector.search import get_vector_search

logger = logging.getLogger(__name__)


@tool
def create_civic_issue(
    title: str,
    description: str,
    category: str,
    location: str = "",
    priority: str = "medium",
) -> str:
    """Create a new consolidated civic issue in CockroachDB.

    Creates a persistent civic issue from one or more citizen reports.
    Generates an embedding for semantic search and initializes the timeline.

    Args:
        title: Clear title summarizing the civic issue.
        description: Detailed description of the issue.
        category: Category (e.g., 'employment', 'infrastructure', 'education', 'healthcare').
        location: Geographic location relevant to the issue.
        priority: Priority level - 'low', 'medium', 'high', 'critical'.

    Returns:
        JSON string with the created issue details.
    """
    try:
        embedding_service = get_embedding_service()
        embedding_text = f"{title}. {description}. Category: {category}. Location: {location}"
        embedding = embedding_service.generate_embedding(embedding_text)
        embedding_str = f"[{','.join(str(x) for x in embedding)}]"

        with get_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO issues (title, description, category, location, priority, embedding)
                VALUES (%s, %s, %s, %s, %s, %s::VECTOR)
                RETURNING id, title, description, category, location, status,
                          priority, confidence, report_count, created_at
                """,
                (title, description, category, location, priority, embedding_str),
            )
            issue = dict(cursor.fetchone())

            # Create initial timeline event
            cursor.execute(
                """
                INSERT INTO issue_timeline (issue_id, event_type, description, actor)
                VALUES (%s, 'created', %s, 'CJP Agent')
                """,
                (issue["id"], f"Issue created: {title}"),
            )

        return json.dumps({
            "success": True,
            "issue": {k: str(v) for k, v in issue.items()},
            "message": f"Civic issue '{title}' created and persisted to CockroachDB.",
        })

    except Exception as e:
        logger.error(f"Error creating issue: {e}")
        return json.dumps({"success": False, "error": str(e)})


@tool
def update_issue(
    issue_id: str,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    confidence: Optional[float] = None,
    description: Optional[str] = None,
) -> str:
    """Update an existing civic issue in CockroachDB.

    Args:
        issue_id: UUID of the issue to update.
        status: New status ('open', 'investigating', 'in_progress', 'resolved', 'closed').
        priority: New priority ('low', 'medium', 'high', 'critical').
        confidence: Updated confidence score (0.0 to 1.0).
        description: Updated description.

    Returns:
        JSON string with update result.
    """
    try:
        updates = []
        params = []

        if status:
            updates.append("status = %s")
            params.append(status)
        if priority:
            updates.append("priority = %s")
            params.append(priority)
        if confidence is not None:
            updates.append("confidence = %s")
            params.append(confidence)
        if description:
            updates.append("description = %s")
            params.append(description)

        if not updates:
            return json.dumps({"success": False, "error": "No fields to update"})

        updates.append("updated_at = now()")
        params.append(issue_id)

        with get_cursor() as cursor:
            cursor.execute(
                f"""
                UPDATE issues SET {', '.join(updates)}
                WHERE id = %s
                RETURNING id, title, status, priority, confidence, updated_at
                """,
                params,
            )
            result = cursor.fetchone()

            if not result:
                return json.dumps({"success": False, "error": "Issue not found"})

            # Record timeline event
            changes = []
            if status:
                changes.append(f"status -> {status}")
            if priority:
                changes.append(f"priority -> {priority}")
            if confidence is not None:
                changes.append(f"confidence -> {confidence}")

            cursor.execute(
                """
                INSERT INTO issue_timeline (issue_id, event_type, description, actor)
                VALUES (%s, 'updated', %s, 'CJP Agent')
                """,
                (issue_id, f"Issue updated: {', '.join(changes)}"),
            )

            # Re-generate embedding if description changed
            if description:
                embedding_service = get_embedding_service()
                issue_data = dict(result)
                emb_text = f"{issue_data['title']}. {description}"
                embedding = embedding_service.generate_embedding(emb_text)
                embedding_str = f"[{','.join(str(x) for x in embedding)}]"
                cursor.execute(
                    "UPDATE issues SET embedding = %s::VECTOR WHERE id = %s",
                    (embedding_str, issue_id),
                )

        return json.dumps({
            "success": True,
            "issue": {k: str(v) for k, v in dict(result).items()},
            "message": "Issue updated successfully.",
        })

    except Exception as e:
        logger.error(f"Error updating issue: {e}")
        return json.dumps({"success": False, "error": str(e)})


@tool
def get_issue_context(issue_id: str) -> str:
    """Retrieve full context for a civic issue including reports, timeline, and actions.

    This is the primary memory retrieval tool for persistent agent memory.
    It provides complete issue state across sessions.

    Args:
        issue_id: UUID of the issue.

    Returns:
        JSON string with complete issue context.
    """
    try:
        context = {}

        with get_cursor() as cursor:
            # Get issue
            cursor.execute(
                """
                SELECT id, title, description, category, location, status,
                       priority, confidence, report_count, created_at, updated_at
                FROM issues WHERE id = %s
                """,
                (issue_id,),
            )
            issue = cursor.fetchone()
            if not issue:
                return json.dumps({"success": False, "error": "Issue not found"})
            context["issue"] = dict(issue)

            # Get reports
            cursor.execute(
                """
                SELECT id, content, source, verification_status, created_at
                FROM reports WHERE issue_id = %s
                ORDER BY created_at DESC LIMIT 20
                """,
                (issue_id,),
            )
            context["reports"] = [dict(r) for r in cursor.fetchall()]

            # Get timeline
            cursor.execute(
                """
                SELECT id, event_type, description, actor, created_at
                FROM issue_timeline WHERE issue_id = %s
                ORDER BY created_at DESC LIMIT 30
                """,
                (issue_id,),
            )
            context["timeline"] = [dict(t) for t in cursor.fetchall()]

            # Get actions
            cursor.execute(
                """
                SELECT id, action_type, description, status, created_at, completed_at
                FROM actions WHERE issue_id = %s
                ORDER BY created_at DESC LIMIT 15
                """,
                (issue_id,),
            )
            context["actions"] = [dict(a) for a in cursor.fetchall()]

            # Get evidence
            cursor.execute(
                """
                SELECT id, description, source, source_url, verification_status, created_at
                FROM evidence WHERE issue_id = %s
                ORDER BY created_at DESC LIMIT 15
                """,
                (issue_id,),
            )
            context["evidence"] = [dict(e) for e in cursor.fetchall()]

            # Get responses
            cursor.execute(
                """
                SELECT id, source, content, response_type, verification_status, created_at
                FROM responses WHERE issue_id = %s
                ORDER BY created_at DESC LIMIT 10
                """,
                (issue_id,),
            )
            context["responses"] = [dict(r) for r in cursor.fetchall()]

            # Get job matches
            cursor.execute(
                """
                SELECT jm.id, jm.match_score, jm.match_reason, jm.status,
                       jo.title as job_title, jo.company, jo.apply_url
                FROM job_matches jm
                JOIN job_opportunities jo ON jm.job_id = jo.id
                WHERE jm.issue_id = %s
                ORDER BY jm.match_score DESC LIMIT 10
                """,
                (issue_id,),
            )
            context["job_matches"] = [dict(j) for j in cursor.fetchall()]

            # Get agent actions for this issue
            cursor.execute(
                """
                SELECT id, tool_name, action, status, created_at
                FROM agent_actions WHERE issue_id = %s
                ORDER BY created_at DESC LIMIT 20
                """,
                (issue_id,),
            )
            context["agent_actions"] = [dict(a) for a in cursor.fetchall()]

        context["success"] = True
        return json.dumps(context, default=str)

    except Exception as e:
        logger.error(f"Error getting issue context: {e}")
        return json.dumps({"success": False, "error": str(e)})


@tool
def find_related_issues(query: str, limit: int = 5) -> str:
    """Find existing civic issues semantically related to a query or report.

    Uses CockroachDB Distributed Vector Indexing to find issues that describe
    the same underlying problem, even if worded differently.

    Args:
        query: The text to find related issues for.
        limit: Maximum number of related issues to return.

    Returns:
        JSON string with related issues and similarity scores.
    """
    try:
        vector_search = get_vector_search()
        issues = vector_search.search_similar_issues(query, limit=limit, threshold=0.15)

        return json.dumps({
            "success": True,
            "related_issues": [
                {
                    "id": str(issue["id"]),
                    "title": issue["title"],
                    "description": issue["description"][:300],
                    "category": issue["category"],
                    "status": issue["status"],
                    "report_count": issue["report_count"],
                    "similarity": round(issue["similarity"], 3),
                }
                for issue in issues
            ],
            "total_found": len(issues),
        }, default=str)

    except Exception as e:
        logger.error(f"Error finding related issues: {e}")
        return json.dumps({"success": False, "error": str(e)})
