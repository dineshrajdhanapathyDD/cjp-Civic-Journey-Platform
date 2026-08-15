"""CockroachDB Agent Skills Integration.

Integrates with the CockroachDB Agent Skills capability, providing reusable
database skills that compose with the application-specific CJP tools.

CockroachDB Agent Skills (from cockroachdb/agent-skills repository) provide:
- Database-native operations optimized for CockroachDB
- Transaction management
- Schema-aware query building
- Vector operations

These are composed with CJP application skills to create the full agent capability.

Reference: https://github.com/cockroachdb/agent-skills
"""

import json
import logging
from typing import Any, Dict, List, Optional

from src.db.connection import get_cursor, get_db
from src.vector.embeddings import get_embedding_service

logger = logging.getLogger(__name__)


class CockroachDBAgentSkills:
    """Reusable CockroachDB database skills for the CJP agent.

    These skills encapsulate CockroachDB-specific capabilities:
    - Transactional read/write with serializable isolation
    - Vector similarity search using distributed indexes
    - Schema-aware upsert operations
    - Multi-table transactional updates
    """

    def __init__(self):
        self.embedding_service = get_embedding_service()

    def transactional_upsert(
        self,
        table: str,
        data: Dict[str, Any],
        conflict_columns: List[str],
        returning: List[str] = None,
    ) -> Dict[str, Any]:
        """Perform an upsert with CockroachDB's serializable transactions.

        Uses CockroachDB's UPSERT capability for conflict resolution,
        wrapped in a serializable transaction for consistency.
        """
        columns = list(data.keys())
        placeholders = ["%s"] * len(columns)
        values = list(data.values())

        returning_clause = ""
        if returning:
            returning_clause = f"RETURNING {', '.join(returning)}"

        conflict_clause = ", ".join(conflict_columns)

        update_cols = [c for c in columns if c not in conflict_columns]
        update_set = ", ".join([f"{c} = EXCLUDED.{c}" for c in update_cols])

        query = f"""
            INSERT INTO {table} ({', '.join(columns)})
            VALUES ({', '.join(placeholders)})
            ON CONFLICT ({conflict_clause}) DO UPDATE SET {update_set}
            {returning_clause}
        """

        with get_cursor() as cursor:
            cursor.execute(query, values)
            if returning:
                return dict(cursor.fetchone())
            return {"success": True}

    def vector_similarity_search(
        self,
        table: str,
        query_text: str,
        embedding_column: str = "embedding",
        select_columns: List[str] = None,
        filters: Dict[str, Any] = None,
        limit: int = 10,
        threshold: float = 0.6,
    ) -> List[Dict[str, Any]]:
        """Perform vector similarity search using CockroachDB distributed vector indexes.

        This skill leverages CockroachDB's distributed HNSW indexes for
        efficient approximate nearest neighbor search across the cluster.
        """
        embedding = self.embedding_service.generate_embedding(query_text)
        embedding_str = f"[{','.join(str(x) for x in embedding)}]"

        if select_columns:
            select_clause = ", ".join(select_columns)
        else:
            select_clause = "*"

        where_conditions = [f"{embedding_column} IS NOT NULL"]
        params: List[Any] = [embedding_str, embedding_str]

        if filters:
            for col, val in filters.items():
                where_conditions.append(f"{col} = %s")
                params.append(val)

        params.append(limit)
        where_clause = " AND ".join(where_conditions)

        query = f"""
            SELECT {select_clause},
                   1 - ({embedding_column} <=> %s::VECTOR) as similarity
            FROM {table}
            WHERE {where_clause}
            ORDER BY {embedding_column} <=> %s::VECTOR
            LIMIT %s
        """

        with get_cursor() as cursor:
            cursor.execute(query, params)
            results = [dict(row) for row in cursor.fetchall()]

        return [r for r in results if r.get("similarity", 0) >= threshold]

    def multi_table_transaction(
        self, operations: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Execute multiple operations in a single CockroachDB transaction.

        CockroachDB provides serializable isolation by default, ensuring
        consistency across all operations in the transaction.

        Each operation is: {"query": "SQL", "params": [...]}
        """
        results = []
        with get_db() as conn:
            cursor = conn.cursor()
            try:
                for op in operations:
                    cursor.execute(op["query"], op.get("params", []))
                    if cursor.description:
                        results.append(cursor.fetchall())
                    else:
                        results.append({"rowcount": cursor.rowcount})
                return {"success": True, "results": results}
            finally:
                cursor.close()

    def store_with_embedding(
        self,
        table: str,
        data: Dict[str, Any],
        text_for_embedding: str,
        embedding_column: str = "embedding",
    ) -> Dict[str, Any]:
        """Store a record with an auto-generated vector embedding.

        Combines data insertion with embedding generation in a single operation.
        """
        embedding = self.embedding_service.generate_embedding(text_for_embedding)
        embedding_str = f"[{','.join(str(x) for x in embedding)}]"

        data[embedding_column] = f"{embedding_str}::VECTOR"

        columns = list(data.keys())
        values = []
        placeholders = []

        for col in columns:
            val = data[col]
            if isinstance(val, str) and val.endswith("::VECTOR"):
                placeholders.append(f"%s::VECTOR")
                values.append(val.replace("::VECTOR", ""))
            else:
                placeholders.append("%s")
                values.append(val)

        query = f"""
            INSERT INTO {table} ({', '.join(columns)})
            VALUES ({', '.join(placeholders)})
            RETURNING id
        """

        with get_cursor() as cursor:
            cursor.execute(query, values)
            result = cursor.fetchone()
            return {"success": True, "id": str(result["id"])}

    def get_table_stats(self, table: str) -> Dict[str, Any]:
        """Get statistics about a table for agent decision-making."""
        with get_cursor() as cursor:
            cursor.execute(f"SELECT count(*) as total FROM {table}")
            total = cursor.fetchone()["total"]

            cursor.execute(
                f"""
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_name = %s
                ORDER BY ordinal_position
                """,
                (table,),
            )
            columns = [dict(row) for row in cursor.fetchall()]

        return {"table": table, "total_rows": total, "columns": columns}


# Singleton
_skills: Optional[CockroachDBAgentSkills] = None


def get_cockroachdb_skills() -> CockroachDBAgentSkills:
    global _skills
    if _skills is None:
        _skills = CockroachDBAgentSkills()
    return _skills
