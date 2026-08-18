"""CJP API Routes - FastAPI endpoints."""

import json
import uuid
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime

from src.api.models import (
    ChatRequest,
    ChatResponse,
    CreateUserRequest,
    LoginRequest,
    CreateReportRequest,
    CreateJobRequest,
    CareerSearchRequest,
    CareerSearchResponse,
    IssueResponse,
    AgentActionResponse,
    TimelineEventResponse,
)
from src.agent.civic_agent import get_civic_agent
from src.db.connection import get_cursor
from src.vector.embeddings import get_embedding_service

logger = logging.getLogger(__name__)

router = APIRouter()


# --- Chat / Agent Endpoints ---

@router.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Send a message to the CJP Civic Agent.

    The agent dynamically decides what tools to use based on the message.
    """
    agent = get_civic_agent()

    # Create or retrieve conversation
    conversation_id = request.conversation_id
    if not conversation_id:
        conversation_id = str(uuid.uuid4())
        try:
            with get_cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO conversations (id, user_id, title, status)
                    VALUES (%s, %s, %s, 'active')
                    """,
                    (conversation_id, request.user_id, request.message[:100]),
                )
        except Exception as e:
            logger.error(f"Error creating conversation: {e}")

    # Store user message
    try:
        with get_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO messages (conversation_id, role, content)
                VALUES (%s, 'user', %s)
                """,
                (conversation_id, request.message),
            )
    except Exception as e:
        logger.error(f"Error storing message: {e}")

    # Process through agent
    result = agent.process_message(
        message=request.message,
        user_id=request.user_id,
        conversation_id=conversation_id,
    )

    # Store agent response
    try:
        with get_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO messages (conversation_id, role, content, metadata)
                VALUES (%s, 'assistant', %s, %s)
                """,
                (
                    conversation_id,
                    result["response"],
                    json.dumps({"duration_ms": result["duration_ms"]}),
                ),
            )
    except Exception as e:
        logger.error(f"Error storing response: {e}")

    return ChatResponse(
        response=result["response"],
        conversation_id=conversation_id,
        agent_actions=result.get("agent_actions", []),
        duration_ms=result.get("duration_ms", 0),
    )


@router.get("/api/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str):
    """Get messages for a conversation."""
    try:
        with get_cursor() as cursor:
            cursor.execute(
                """
                SELECT id, role, content, metadata, created_at
                FROM messages WHERE conversation_id = %s
                ORDER BY created_at ASC
                """,
                (conversation_id,),
            )
            messages = [dict(row) for row in cursor.fetchall()]
        return {"messages": messages, "conversation_id": conversation_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/conversations")
async def list_conversations(user_id: Optional[str] = None, limit: int = 20):
    """List recent conversations."""
    try:
        with get_cursor() as cursor:
            if user_id:
                cursor.execute(
                    """
                    SELECT id, user_id, title, issue_id, status, created_at, updated_at
                    FROM conversations WHERE user_id = %s
                    ORDER BY updated_at DESC LIMIT %s
                    """,
                    (user_id, limit),
                )
            else:
                cursor.execute(
                    """
                    SELECT id, user_id, title, issue_id, status, created_at, updated_at
                    FROM conversations ORDER BY updated_at DESC LIMIT %s
                    """,
                    (limit,),
                )
            conversations = [dict(row) for row in cursor.fetchall()]
        return {"conversations": conversations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Issues Endpoints ---

@router.get("/api/issues")
async def list_issues(
    status: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 50,
):
    """List civic issues."""
    try:
        conditions = []
        params = []

        if status:
            conditions.append("status = %s")
            params.append(status)
        if category:
            conditions.append("category = %s")
            params.append(category)

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        params.append(limit)

        with get_cursor() as cursor:
            cursor.execute(
                f"""
                SELECT id, title, description, category, location, status,
                       priority, confidence, report_count, created_at, updated_at
                FROM issues {where_clause}
                ORDER BY updated_at DESC LIMIT %s
                """,
                params,
            )
            issues = [dict(row) for row in cursor.fetchall()]
        return {"issues": issues, "total": len(issues)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/issues/{issue_id}")
async def get_issue(issue_id: str):
    """Get full issue details with context."""
    try:
        with get_cursor() as cursor:
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
                raise HTTPException(status_code=404, detail="Issue not found")

            # Get related data
            cursor.execute(
                "SELECT count(*) as cnt FROM reports WHERE issue_id = %s",
                (issue_id,),
            )
            report_count = cursor.fetchone()["cnt"]

            cursor.execute(
                "SELECT count(*) as cnt FROM evidence WHERE issue_id = %s",
                (issue_id,),
            )
            evidence_count = cursor.fetchone()["cnt"]

            cursor.execute(
                "SELECT count(*) as cnt FROM actions WHERE issue_id = %s",
                (issue_id,),
            )
            action_count = cursor.fetchone()["cnt"]

        return {
            "issue": dict(issue),
            "counts": {
                "reports": report_count,
                "evidence": evidence_count,
                "actions": action_count,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/issues/{issue_id}/timeline")
async def get_timeline(issue_id: str, limit: int = 50):
    """Get issue timeline."""
    try:
        with get_cursor() as cursor:
            cursor.execute(
                """
                SELECT id, event_type, description, actor, created_at
                FROM issue_timeline WHERE issue_id = %s
                ORDER BY created_at ASC LIMIT %s
                """,
                (issue_id, limit),
            )
            events = [dict(row) for row in cursor.fetchall()]
        return {"timeline": events, "issue_id": issue_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/issues/{issue_id}/reports")
async def get_issue_reports(issue_id: str):
    """Get reports linked to an issue."""
    try:
        with get_cursor() as cursor:
            cursor.execute(
                """
                SELECT id, content, source, verification_status, created_at
                FROM reports WHERE issue_id = %s
                ORDER BY created_at DESC
                """,
                (issue_id,),
            )
            reports = [dict(row) for row in cursor.fetchall()]
        return {"reports": reports}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/issues/{issue_id}/evidence")
async def get_issue_evidence(issue_id: str):
    """Get evidence for an issue."""
    try:
        with get_cursor() as cursor:
            cursor.execute(
                """
                SELECT id, description, source, source_url, evidence_type,
                       verification_status, created_at
                FROM evidence WHERE issue_id = %s
                ORDER BY created_at DESC
                """,
                (issue_id,),
            )
            evidence = [dict(row) for row in cursor.fetchall()]
        return {"evidence": evidence}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/issues/{issue_id}/actions")
async def get_issue_actions(issue_id: str):
    """Get actions for an issue."""
    try:
        with get_cursor() as cursor:
            cursor.execute(
                """
                SELECT id, action_type, description, status, assigned_to,
                       created_at, completed_at
                FROM actions WHERE issue_id = %s
                ORDER BY created_at DESC
                """,
                (issue_id,),
            )
            actions = [dict(row) for row in cursor.fetchall()]
        return {"actions": actions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/issues/{issue_id}/jobs")
async def get_issue_jobs(issue_id: str):
    """Get job matches for an issue."""
    try:
        with get_cursor() as cursor:
            cursor.execute(
                """
                SELECT jm.id, jm.match_score, jm.match_reason, jm.status,
                       jo.id as job_id, jo.title, jo.company, jo.description,
                       jo.location, jo.work_type, jo.employment_type, jo.skills,
                       jo.experience_level, jo.salary_range, jo.source,
                       jo.source_url, jo.apply_url, jo.posted_at
                FROM job_matches jm
                JOIN job_opportunities jo ON jm.job_id = jo.id
                WHERE jm.issue_id = %s
                ORDER BY jm.match_score DESC
                """,
                (issue_id,),
            )
            matches = [dict(row) for row in cursor.fetchall()]
        return {"job_matches": matches}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Reports Endpoints ---

@router.post("/api/reports")
async def create_report(request: CreateReportRequest):
    """Submit a citizen report. Agent will process and link to issues."""
    try:
        embedding_service = get_embedding_service()
        embedding = embedding_service.generate_embedding(request.content)
        embedding_str = f"[{','.join(str(x) for x in embedding)}]"

        with get_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO reports (user_id, content, source, embedding)
                VALUES (%s, %s, %s, %s::VECTOR)
                RETURNING id, created_at
                """,
                (request.user_id, request.content, request.source, embedding_str),
            )
            result = dict(cursor.fetchone())

        return {
            "success": True,
            "report_id": str(result["id"]),
            "message": "Report submitted. The agent will analyze and link to relevant issues.",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Jobs Endpoints ---

@router.get("/api/jobs")
async def list_jobs(
    location: Optional[str] = None,
    work_type: Optional[str] = None,
    experience_level: Optional[str] = None,
    limit: int = 50,
):
    """List job opportunities."""
    try:
        conditions = ["verification_status = 'verified'"]
        params = []

        if location:
            conditions.append("location ILIKE %s")
            params.append(f"%{location}%")
        if work_type:
            conditions.append("work_type = %s")
            params.append(work_type)
        if experience_level:
            conditions.append("experience_level = %s")
            params.append(experience_level)

        params.append(limit)
        where_clause = " AND ".join(conditions)

        with get_cursor() as cursor:
            cursor.execute(
                f"""
                SELECT id, title, company, description, location, work_type,
                       employment_type, skills, experience_level, salary_range,
                       source, source_url, apply_url, posted_at, created_at
                FROM job_opportunities
                WHERE {where_clause}
                ORDER BY posted_at DESC NULLS LAST
                LIMIT %s
                """,
                params,
            )
            jobs = [dict(row) for row in cursor.fetchall()]
        return {"jobs": jobs, "total": len(jobs)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/jobs")
async def create_job(request: CreateJobRequest):
    """Add a job opportunity (admin/system use)."""
    try:
        embedding_service = get_embedding_service()
        embed_text = (
            f"{request.title} at {request.company}. {request.description}. "
            f"Skills: {', '.join(request.skills or [])}. "
            f"Location: {request.location}. Level: {request.experience_level}"
        )
        embedding = embedding_service.generate_embedding(embed_text)
        embedding_str = f"[{','.join(str(x) for x in embedding)}]"

        with get_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO job_opportunities
                    (title, company, description, location, work_type,
                     employment_type, skills, experience_level, salary_range,
                     source, source_url, apply_url, posted_at, expires_at, embedding)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::VECTOR)
                RETURNING id
                """,
                (
                    request.title, request.company, request.description,
                    request.location, request.work_type, request.employment_type,
                    request.skills, request.experience_level, request.salary_range,
                    request.source, request.source_url, request.apply_url,
                    request.posted_at, request.expires_at, embedding_str,
                ),
            )
            result = cursor.fetchone()

        return {"success": True, "job_id": str(result["id"])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- AWS Career Agent Endpoints ---

@router.post("/api/career/search", response_model=CareerSearchResponse)
async def career_search(request: CareerSearchRequest):
    """AWS Career Agent: Search jobs with skill matching and gap analysis.

    Uses CockroachDB vector search to find real job opportunities,
    extracts skills from the query, and performs skill comparison.
    All data comes from the real job_opportunities table.
    """
    from src.agent.tools.career_search import career_search as do_career_search

    try:
        result = do_career_search(
            query=request.query,
            user_skills=request.skills,
            location=request.location,
            experience_level=request.experience_level,
            limit=request.limit,
        )

        # Log agent activity for this career search
        try:
            with get_cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO agent_actions
                        (tool_name, action, status, duration_ms, result)
                    VALUES ('aws_career_search', %s, 'completed', %s, %s)
                    """,
                    (
                        f"Career search: {request.query[:80]}",
                        result.get("duration_ms", 0),
                        json.dumps({
                            "query": request.query,
                            "skills": request.skills,
                            "total_found": result.get("total_found", 0),
                        }),
                    ),
                )
        except Exception as e:
            logger.error(f"Error logging career search activity: {e}")

        return CareerSearchResponse(**result)

    except Exception as e:
        logger.error(f"Career search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- Agent Activity Endpoints ---

@router.get("/api/agent/actions")
async def get_agent_actions(
    conversation_id: Optional[str] = None,
    limit: int = 50,
):
    """Get agent activity log for the Agent Activity UI."""
    try:
        with get_cursor() as cursor:
            if conversation_id:
                cursor.execute(
                    """
                    SELECT id, conversation_id, issue_id, tool_name, action,
                           input_params, result, status, duration_ms, created_at
                    FROM agent_actions
                    WHERE conversation_id = %s
                    ORDER BY created_at DESC LIMIT %s
                    """,
                    (conversation_id, limit),
                )
            else:
                cursor.execute(
                    """
                    SELECT id, conversation_id, issue_id, tool_name, action,
                           input_params, result, status, duration_ms, created_at
                    FROM agent_actions
                    ORDER BY created_at DESC LIMIT %s
                    """,
                    (limit,),
                )
            actions = [dict(row) for row in cursor.fetchall()]
        return {"agent_actions": actions, "total": len(actions)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Auth Endpoints ---

@router.post("/api/auth/register")
async def register(request: CreateUserRequest):
    """Register a new user."""
    from passlib.hash import bcrypt

    try:
        password_hash = bcrypt.hash(request.password)

        with get_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO users (email, username, password_hash, full_name,
                                  location, skills, experience_level)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id, username, email, created_at
                """,
                (
                    request.email, request.username, password_hash,
                    request.full_name, request.location, request.skills,
                    request.experience_level,
                ),
            )
            user = dict(cursor.fetchone())

        return {"success": True, "user": user}
    except Exception as e:
        if "duplicate key" in str(e).lower():
            raise HTTPException(status_code=409, detail="User already exists")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/auth/login")
async def login(request: LoginRequest):
    """Login user."""
    from passlib.hash import bcrypt

    try:
        with get_cursor() as cursor:
            cursor.execute(
                """
                SELECT id, username, email, password_hash, location, skills
                FROM users WHERE username = %s
                """,
                (request.username,),
            )
            user = cursor.fetchone()

        if not user or not bcrypt.verify(request.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        user_dict = dict(user)
        del user_dict["password_hash"]
        return {"success": True, "user": user_dict}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Dashboard Stats ---

@router.get("/api/dashboard/stats")
async def dashboard_stats():
    """Get dashboard statistics."""
    try:
        with get_cursor() as cursor:
            stats = {}

            cursor.execute("SELECT count(*) as cnt FROM issues")
            stats["total_issues"] = cursor.fetchone()["cnt"]

            cursor.execute("SELECT count(*) as cnt FROM issues WHERE status = 'open'")
            stats["open_issues"] = cursor.fetchone()["cnt"]

            cursor.execute("SELECT count(*) as cnt FROM reports")
            stats["total_reports"] = cursor.fetchone()["cnt"]

            cursor.execute("SELECT count(*) as cnt FROM job_opportunities")
            stats["total_jobs"] = cursor.fetchone()["cnt"]

            cursor.execute("SELECT count(*) as cnt FROM agent_actions")
            stats["total_agent_actions"] = cursor.fetchone()["cnt"]

            cursor.execute("SELECT count(*) as cnt FROM job_matches")
            stats["total_job_matches"] = cursor.fetchone()["cnt"]

            cursor.execute("SELECT count(*) as cnt FROM evidence")
            stats["total_evidence"] = cursor.fetchone()["cnt"]

            cursor.execute(
                """
                SELECT category, count(*) as cnt
                FROM issues GROUP BY category ORDER BY cnt DESC LIMIT 10
                """
            )
            stats["issues_by_category"] = [dict(row) for row in cursor.fetchall()]

            cursor.execute(
                """
                SELECT status, count(*) as cnt
                FROM issues GROUP BY status
                """
            )
            stats["issues_by_status"] = [dict(row) for row in cursor.fetchall()]

        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Health ---

@router.get("/api/health")
async def health():
    """Health check endpoint."""
    try:
        with get_cursor() as cursor:
            cursor.execute("SELECT 1")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}
