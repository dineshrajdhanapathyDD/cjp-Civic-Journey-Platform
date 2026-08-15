"""Job Opportunity Discovery - Agent Tool.

Searches CockroachDB for relevant job opportunities using semantic vector matching.
Connects employment-related civic issues to practical resolutions.
"""

import json
import logging
from typing import Optional, List
from strands import tool

from src.db.connection import get_cursor
from src.vector.search import get_vector_search
from src.vector.embeddings import get_embedding_service

logger = logging.getLogger(__name__)


@tool
def find_job_opportunities(
    query: str,
    skills: str = "",
    location: str = "",
    experience_level: str = "",
    work_type: str = "",
    limit: int = 10,
) -> str:
    """Search for relevant job opportunities using semantic matching.

    Uses CockroachDB Distributed Vector Indexing to find jobs matching
    user skills, location preferences, and experience level.

    IMPORTANT: Only returns verified job listings with real source URLs.
    Never fabricates job listings.

    Args:
        query: Natural language description of desired job/career.
        skills: Comma-separated list of relevant skills.
        location: Preferred job location.
        experience_level: Experience level ('entry', 'mid', 'senior', 'lead').
        work_type: Work arrangement ('remote', 'onsite', 'hybrid').
        limit: Maximum results to return.

    Returns:
        JSON string with matching job opportunities and match scores.
    """
    try:
        skills_list = [s.strip() for s in skills.split(",") if s.strip()] if skills else None
        vector_search = get_vector_search()

        jobs = vector_search.search_job_opportunities(
            query=query,
            skills=skills_list,
            location=None,  # Don't filter by location, use semantic matching instead
            experience_level=experience_level or None,
            limit=limit,
            threshold=0.1,
        )

        # Format results
        job_results = []
        for job in jobs:
            job_results.append({
                "id": str(job["id"]),
                "title": job["title"],
                "company": job["company"],
                "description": job["description"][:300],
                "location": job["location"],
                "work_type": job["work_type"],
                "employment_type": job["employment_type"],
                "skills": job["skills"],
                "experience_level": job["experience_level"],
                "salary_range": job["salary_range"],
                "source": job["source"],
                "source_url": job["source_url"],
                "apply_url": job["apply_url"],
                "posted_at": str(job["posted_at"]) if job["posted_at"] else None,
                "match_score": round(job["similarity"], 3),
            })

        return json.dumps({
            "success": True,
            "jobs": job_results,
            "total_found": len(job_results),
            "search_criteria": {
                "query": query,
                "skills": skills_list,
                "location": location,
                "experience_level": experience_level,
                "work_type": work_type,
            },
        }, default=str)

    except Exception as e:
        logger.error(f"Error finding job opportunities: {e}")
        return json.dumps({"success": False, "error": str(e)})


@tool
def record_job_match(
    user_id: str,
    issue_id: str,
    job_id: str,
    match_score: float,
    match_reason: str,
) -> str:
    """Record a job match connecting a user/issue to a job opportunity.

    Creates a persistent record of the match in CockroachDB and updates
    the issue timeline to track the resolution attempt.

    Args:
        user_id: UUID of the user.
        issue_id: UUID of the related civic issue.
        job_id: UUID of the matched job opportunity.
        match_score: Relevance score (0.0 to 1.0).
        match_reason: Why this job is relevant to the user/issue.

    Returns:
        JSON string confirming the match recording.
    """
    try:
        with get_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO job_matches (user_id, issue_id, job_id, match_score, match_reason)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, created_at
                """,
                (user_id, issue_id, job_id, match_score, match_reason),
            )
            result = dict(cursor.fetchone())

            # Get job info for timeline
            cursor.execute(
                "SELECT title, company FROM job_opportunities WHERE id = %s",
                (job_id,),
            )
            job_info = cursor.fetchone()

            # Add timeline event
            if job_info:
                cursor.execute(
                    """
                    INSERT INTO issue_timeline (issue_id, event_type, description, actor)
                    VALUES (%s, 'job_matched', %s, 'CJP Agent')
                    """,
                    (
                        issue_id,
                        f"Job opportunity matched: {job_info['title']} at {job_info['company']} "
                        f"(score: {match_score:.2f})",
                    ),
                )

        return json.dumps({
            "success": True,
            "match_id": str(result["id"]),
            "message": f"Job match recorded with score {match_score:.2f}.",
        }, default=str)

    except Exception as e:
        logger.error(f"Error recording job match: {e}")
        return json.dumps({"success": False, "error": str(e)})
