# CockroachDB Agent Skills

## Overview

CJP integrates CockroachDB Agent Skills — reusable database capabilities that compose with the application-specific CJP tools to create the full agent capability set.

Reference: https://github.com/cockroachdb/agent-skills

## Architecture

```
Strands Agent
      |
      +---> CJP Application Skills (civic_memory, issues, jobs, etc.)
      |           |
      |           v
      +---> CockroachDB Agent Skills
                  |
                  v
            CockroachDB Cloud
```

## CockroachDB Agent Skills Used

### 1. Transactional Upsert

CockroachDB's serializable transactions ensure consistency when the agent creates or updates civic data:

```python
def transactional_upsert(self, table, data, conflict_columns, returning=None):
    """Perform an upsert with CockroachDB's serializable transactions."""
    # Uses CockroachDB UPSERT with ON CONFLICT for idempotent writes
```

**Use in CJP**: When linking a report to an existing issue, prevents duplicate links even under concurrent access.

### 2. Vector Similarity Search

Leverages CockroachDB's distributed HNSW indexes for semantic retrieval:

```python
def vector_similarity_search(self, table, query_text, embedding_column,
                            select_columns, filters, limit, threshold):
    """Distributed vector search using CockroachDB indexes."""
    # Generates embedding, queries with cosine distance operator
```

**Use in CJP**: Powers `search_civic_memory`, `find_related_issues`, and `find_job_opportunities`.

### 3. Multi-Table Transaction

Executes multiple operations atomically with CockroachDB's serializable isolation:

```python
def multi_table_transaction(self, operations):
    """Execute multiple operations in a single serializable transaction."""
    # All operations succeed or all fail — no partial state
```

**Use in CJP**: When creating an issue, simultaneously inserting the issue record, initial timeline event, and linking the triggering report.

### 4. Store with Embedding

Combines data storage with automatic embedding generation:

```python
def store_with_embedding(self, table, data, text_for_embedding, embedding_column):
    """Store a record with auto-generated vector embedding."""
    # Generates embedding from text, stores alongside relational data
```

**Use in CJP**: When recording evidence or new reports, automatically generates and stores the vector embedding.

### 5. Table Stats

Provides schema awareness for agent decision-making:

```python
def get_table_stats(self, table):
    """Get statistics about a table for agent decision-making."""
    # Returns row counts and column definitions
```

**Use in CJP**: Helps the agent understand current data state (e.g., how many issues exist, whether to create new ones vs consolidate).

## CJP Application Skills (built on CockroachDB Agent Skills)

These application-specific skills compose with the CockroachDB skills:

| CJP Skill | CockroachDB Skills Used | Purpose |
|-----------|------------------------|---------|
| `search_civic_memory` | vector_similarity_search | Find related civic data semantically |
| `find_related_issues` | vector_similarity_search | Detect duplicate issues |
| `create_civic_issue` | store_with_embedding, multi_table_transaction | Create issue with embedding + timeline |
| `update_issue` | transactional_upsert | Update issue state atomically |
| `get_issue_context` | (direct queries) | Full issue state retrieval for memory |
| `record_evidence` | store_with_embedding | Store evidence with semantic index |
| `record_action` | multi_table_transaction | Action + timeline in one transaction |
| `find_job_opportunities` | vector_similarity_search | Semantic job matching |
| `record_job_match` | multi_table_transaction | Match + timeline atomically |

## How Skills Connect to the Agent

The Strands agent has access to all CJP application skills as tools. It dynamically decides which to invoke based on the user's message:

```python
AGENT_TOOLS = [
    search_civic_memory,
    create_civic_issue,
    update_issue,
    get_issue_context,
    find_related_issues,
    record_evidence,
    record_action,
    find_job_opportunities,
    record_job_match,
    get_issue_timeline,
    add_timeline_event,
]

agent = Agent(
    model=BedrockModel(model_id="anthropic.claude-3-5-sonnet-20241022-v2:0"),
    system_prompt=SYSTEM_PROMPT,
    tools=AGENT_TOOLS,
)
```

The agent's system prompt instructs it on when to use each skill, but the actual decision is made dynamically through reasoning, not hardcoded sequences.

## Why CockroachDB Agent Skills Matter

1. **Reusability**: The same vector search skill works across issues, reports, jobs
2. **Consistency**: Serializable transactions prevent data corruption under concurrent agent access
3. **Composability**: Application skills build on database skills without reimplementing primitives
4. **Distributed**: Skills automatically leverage CockroachDB's distributed architecture
