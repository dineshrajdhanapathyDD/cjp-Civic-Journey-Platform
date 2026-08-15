"""Evidence Recording - Agent Tool.

Records supporting evidence for civic issues in CockroachDB.
"""

import json
import logging
from strands import tool

from src.db.connection import get_cursor
from src.vector.embeddings import get_embedding_service

logger = logging.getLogger(__name__)


@tool
def record_evidence(
    issue_id: str,
    description: str,
    source: str,
    source_url: str = "",
    evidence_type: str = "report",
) -> str:
    """Record evidence supporting a civic issue.

    Stores evidence with vector embedding for semantic retrieval.

    Args:
        issue_id: UUID of the issue this evidence supports.
        description: Description of the evidence.
        source: Source of the evidence (e.g., 'government_data', 'news', 'citizen_report').
        source_url: URL to the evidence source if available.
        evidence_type: Type - 'report', 'data', 'official', 'media', 'academic'.

    Returns:
        JSON string confirming evidence recording.
    """
    try:
        embedding_service = get_embedding_service()
        embedding = embedding_service.generate_embedding(description)
        embedding_str = f"[{','.join(str(x) for x in embedding)}]"

        with get_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO evidence (issue_id, description, source, source_url,
                                     evidence_type, embedding)
                VALUES (%s, %s, %s, %s, %s, %s::VECTOR)
                RETURNING id, created_at
                """,
                (issue_id, description, source, source_url, evidence_type, embedding_str),
            )
            result = dict(cursor.fetchone())

            # Add timeline event
            cursor.execute(
                """
                INSERT INTO issue_timeline (issue_id, event_type, description, actor)
                VALUES (%s, 'evidence_added', %s, 'CJP Agent')
                """,
                (issue_id, f"Evidence recorded from {source}: {description[:100]}"),
            )

            # Update issue confidence based on evidence count
            cursor.execute(
                """
                UPDATE issues SET
                    confidence = LEAST(1.0, confidence + 0.05),
                    updated_at = now()
                WHERE id = %s
                """,
                (issue_id,),
            )

        return json.dumps({
            "success": True,
            "evidence_id": str(result["id"]),
            "message": f"Evidence recorded for issue {issue_id}.",
        }, default=str)

    except Exception as e:
        logger.error(f"Error recording evidence: {e}")
        return json.dumps({"success": False, "error": str(e)})
