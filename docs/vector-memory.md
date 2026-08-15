# Distributed Vector Indexing

## Overview

CJP uses CockroachDB's Distributed Vector Indexing to enable semantic search across civic memory. This allows the agent to detect that different reports describe the same underlying problem, even when worded differently.

## What Data is Indexed

| Table | Embedding Column | Purpose |
|-------|-----------------|---------|
| `issues` | `embedding VECTOR(1024)` | Semantic issue matching and deduplication |
| `reports` | `embedding VECTOR(1024)` | Finding similar citizen reports |
| `evidence` | `embedding VECTOR(1024)` | Semantic evidence retrieval |
| `responses` | `embedding VECTOR(1024)` | Finding related official responses |
| `job_opportunities` | `embedding VECTOR(1024)` | Semantic job matching |

## Vector Index Configuration

CockroachDB uses HNSW (Hierarchical Navigable Small World) indexes for approximate nearest neighbor search:

```sql
CREATE INDEX idx_issues_embedding ON issues
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
```

Parameters:
- **m = 16**: Number of connections per layer (balances recall vs speed)
- **ef_construction = 64**: Construction-time quality (higher = better index, slower build)
- **vector_cosine_ops**: Cosine similarity distance metric

## Embedding Generation

Embeddings are generated using Amazon Bedrock Titan Embed V2:

```python
class EmbeddingService:
    def generate_embedding(self, text: str) -> List[float]:
        body = json.dumps({
            "inputText": text[:8000],
            "dimensions": 1024,
            "normalize": True,
        })
        response = self.client.invoke_model(
            modelId="amazon.titan-embed-text-v2:0",
            body=body,
        )
        return result["embedding"]  # 1024-dimensional vector
```

## Semantic Matching Examples

The system detects that these reports describe the same issue:

```
"Graduates cannot find software jobs."
"Engineering students have no local IT opportunities."
"Young developers are leaving because of limited tech jobs."
```

A query like "Why are young engineers leaving?" retrieves all three with high similarity scores.

## Search Implementation

```python
class VectorSearch:
    def search_similar_issues(self, query: str, limit: int = 10, threshold: float = 0.7):
        embedding = self.embedding_service.generate_embedding(query)
        embedding_str = f"[{','.join(str(x) for x in embedding)}]"

        with get_cursor() as cursor:
            cursor.execute("""
                SELECT id, title, description, category,
                       1 - (embedding <=> %s::VECTOR) as similarity
                FROM issues
                WHERE embedding IS NOT NULL
                ORDER BY embedding <=> %s::VECTOR
                LIMIT %s
            """, (embedding_str, embedding_str, limit))
```

The `<=>` operator computes cosine distance. CockroachDB's distributed vector index makes this efficient across the cluster.

## Why CockroachDB for Vectors

1. **Co-located with relational data**: No separate vector database needed. Issues, reports, and embeddings live together with transactional consistency.

2. **Distributed execution**: Vector index scans are distributed across CockroachDB nodes for horizontal scalability.

3. **Transactional guarantees**: Embedding writes and relational updates happen in the same serializable transaction.

4. **Operational simplicity**: One database for all data types — relational, JSON, and vector.

## Performance Considerations

- Embeddings are 1024 dimensions (Titan V2 default) — good balance of precision and performance
- HNSW indexes provide sub-linear search time
- Threshold filtering (e.g., similarity >= 0.7) reduces false positives
- Batch embedding generation for bulk ingestion
