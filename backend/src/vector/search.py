"""Semantic vector search using CockroachDB Distributed Vector Indexing."""

from typing import List, Dict, Any, Optional
from src.db.connection import get_cursor
from src.vector.embeddings import get_embedding_service


class VectorSearch:
    """Semantic search using CockroachDB vector indexes."""

    def __init__(self):
        self.embedding_service = get_embedding_service()

    def search_similar_issues(
        self, query: str, limit: int = 10, threshold: float = 0.15
    ) -> List[Dict[str, Any]]:
        """Find issues semantically similar to a query."""
        embedding = self.embedding_service.generate_embedding(query)
        embedding_str = f"[{','.join(str(x) for x in embedding)}]"

        with get_cursor() as cursor:
            cursor.execute(
                """
                SELECT id, title, description, category, location, status,
                       priority, confidence, report_count, created_at,
                       1 - (embedding <=> %s::VECTOR) as similarity
                FROM issues
                WHERE embedding IS NOT NULL
                ORDER BY embedding <=> %s::VECTOR
                LIMIT %s
                """,
                (embedding_str, embedding_str, limit),
            )
            results = cursor.fetchall()

        return [
            dict(row) for row in results
            if row.get("similarity", 0) >= threshold
        ]

    def search_similar_reports(
        self, query: str, limit: int = 20, threshold: float = 0.15
    ) -> List[Dict[str, Any]]:
        """Find citizen reports semantically similar to a query."""
        embedding = self.embedding_service.generate_embedding(query)
        embedding_str = f"[{','.join(str(x) for x in embedding)}]"

        with get_cursor() as cursor:
            cursor.execute(
                """
                SELECT r.id, r.content, r.source, r.verification_status,
                       r.issue_id, r.created_at,
                       1 - (r.embedding <=> %s::VECTOR) as similarity
                FROM reports r
                WHERE r.embedding IS NOT NULL
                ORDER BY r.embedding <=> %s::VECTOR
                LIMIT %s
                """,
                (embedding_str, embedding_str, limit),
            )
            results = cursor.fetchall()

        return [dict(row) for row in results if row.get("similarity", 0) >= threshold]

    def search_job_opportunities(
        self,
        query: str,
        skills: Optional[List[str]] = None,
        location: Optional[str] = None,
        experience_level: Optional[str] = None,
        limit: int = 10,
        threshold: float = 0.15,
    ) -> List[Dict[str, Any]]:
        """Semantic search for job opportunities."""
        # Build enriched query with user context
        search_text = query
        if skills:
            search_text += f" Skills: {', '.join(skills)}"
        if location:
            search_text += f" Location: {location}"
        if experience_level:
            search_text += f" Experience: {experience_level}"

        embedding = self.embedding_service.generate_embedding(search_text)
        embedding_str = f"[{','.join(str(x) for x in embedding)}]"

        with get_cursor() as cursor:
            # Build dynamic filter conditions
            conditions = ["embedding IS NOT NULL", "verification_status = 'verified'"]
            filter_params: List[Any] = []

            if location:
                conditions.append("location ILIKE %s")
                filter_params.append(f"%{location}%")
            if experience_level:
                conditions.append("experience_level = %s")
                filter_params.append(experience_level)

            where_clause = " AND ".join(conditions)

            # Parameters in order: similarity_vector, filter_params, order_vector, limit
            params = [embedding_str] + filter_params + [embedding_str, limit]

            cursor.execute(
                f"""
                SELECT id, title, company, description, location, work_type,
                       employment_type, skills, experience_level, salary_range,
                       source, source_url, apply_url, posted_at, expires_at,
                       1 - (embedding <=> %s::VECTOR) as similarity
                FROM job_opportunities
                WHERE {where_clause}
                ORDER BY embedding <=> %s::VECTOR
                LIMIT %s
                """,
                params,
            )
            results = cursor.fetchall()

        return [dict(row) for row in results if row.get("similarity", 0) >= threshold]

    def find_related_issues_for_report(
        self, report_content: str, limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Find existing issues that a new report might belong to."""
        return self.search_similar_issues(report_content, limit=limit, threshold=0.2)


# Singleton
_vector_search: Optional[VectorSearch] = None


def get_vector_search() -> VectorSearch:
    global _vector_search
    if _vector_search is None:
        _vector_search = VectorSearch()
    return _vector_search
