"""Civic Memory Search - Agent Tool.

Searches CockroachDB persistent civic memory using distributed vector indexing
to find semantically related reports, issues, and evidence.
"""

import json
import logging
from typing import Any
from strands import tool

from src.db.connection import get_cursor
from src.vector.search import get_vector_search

logger = logging.getLogger(__name__)


@tool
def search_civic_memory(query: str, memory_type: str = "all", limit: int = 10) -> str:
    """Search the persistent civic memory in CockroachDB using semantic vector search.

    This tool searches across citizen reports, consolidated issues, and evidence
    using distributed vector indexing to find semantically related civic data.

    Args:
        query: Natural language search query describing the civic concern.
        memory_type: Type of memory to search - 'issues', 'reports', 'evidence', or 'all'.
        limit: Maximum number of results to return.

    Returns:
        JSON string with search results including similarity scores.
    """
    vector_search = get_vector_search()
    results = {"query": query, "memory_type": memory_type, "results": []}

    try:
        if memory_type in ("issues", "all"):
            issues = vector_search.search_similar_issues(query, limit=limit)
            for issue in issues:
                results["results"].append({
                    "type": "issue",
                    "id": str(issue["id"]),
                    "title": issue["title"],
                    "description": issue["description"],
                    "category": issue["category"],
                    "status": issue["status"],
                    "priority": issue["priority"],
                    "report_count": issue["report_count"],
                    "similarity": round(issue["similarity"], 3),
                    "created_at": str(issue["created_at"]),
                })

        if memory_type in ("reports", "all"):
            reports = vector_search.search_similar_reports(query, limit=limit)
            for report in reports:
                results["results"].append({
                    "type": "report",
                    "id": str(report["id"]),
                    "content": report["content"][:200],
                    "source": report["source"],
                    "verification_status": report["verification_status"],
                    "issue_id": str(report["issue_id"]) if report["issue_id"] else None,
                    "similarity": round(report["similarity"], 3),
                    "created_at": str(report["created_at"]),
                })

        if memory_type in ("evidence", "all"):
            with get_cursor() as cursor:
                # Search evidence with embedding
                from src.vector.embeddings import get_embedding_service
                embedding_service = get_embedding_service()
                embedding = embedding_service.generate_embedding(query)
                embedding_str = f"[{','.join(str(x) for x in embedding)}]"

                cursor.execute(
                    """
                    SELECT id, issue_id, description, source, source_url,
                           verification_status, created_at,
                           1 - (embedding <=> %s::VECTOR) as similarity
                    FROM evidence
                    WHERE embedding IS NOT NULL
                    ORDER BY embedding <=> %s::VECTOR
                    LIMIT %s
                    """,
                    (embedding_str, embedding_str, limit),
                )
                evidence_rows = cursor.fetchall()
                for ev in evidence_rows:
                    if ev["similarity"] >= 0.6:
                        results["results"].append({
                            "type": "evidence",
                            "id": str(ev["id"]),
                            "issue_id": str(ev["issue_id"]),
                            "description": ev["description"][:200],
                            "source": ev["source"],
                            "verification_status": ev["verification_status"],
                            "similarity": round(ev["similarity"], 3),
                        })

        # Sort all results by similarity
        results["results"].sort(key=lambda x: x.get("similarity", 0), reverse=True)
        results["total_found"] = len(results["results"])

    except Exception as e:
        logger.error(f"Error searching civic memory: {e}")
        results["error"] = str(e)
        results["total_found"] = 0

    return json.dumps(results, default=str)
