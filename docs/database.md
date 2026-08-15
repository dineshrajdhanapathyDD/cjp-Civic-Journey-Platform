# CJP Database Schema

## Overview

CockroachDB serves as the primary persistent state layer for CJP. All civic memory, issue tracking, agent state, and job opportunities are stored here.

## Why CockroachDB

CockroachDB is better suited to this architecture than using a separate database and vector store because:

1. **Unified Data Layer**: Relational data, vector embeddings, and JSON metadata in one system
2. **Transactional Consistency**: Issue creation + embedding + timeline happen atomically
3. **Distributed Scalability**: Horizontal scaling without application changes
4. **Serializable Isolation**: Agent actions never see partial state
5. **Operational Simplicity**: One system to manage, monitor, and back up
6. **Native Vector Support**: No external vector DB needed — pgvector-compatible

## Tables

### users
Citizen accounts for authentication and context.

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID (PK) | Unique identifier |
| email | STRING | Login email |
| username | STRING | Display name |
| password_hash | STRING | bcrypt hash |
| location | STRING | User's location (for job matching) |
| skills | STRING[] | User's skills (for job matching) |
| experience_level | STRING | Career level |

### issues
Consolidated civic issues — the core entity.

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID (PK) | Unique identifier |
| title | STRING | Issue summary |
| description | STRING | Full description |
| category | STRING | employment, infrastructure, etc. |
| location | STRING | Geographic area |
| status | STRING | open, investigating, in_progress, resolved, closed |
| priority | STRING | low, medium, high, critical |
| confidence | FLOAT | How confident the system is (0-1) |
| report_count | INT | Number of linked reports |
| embedding | VECTOR(1024) | Semantic embedding for search |

### reports
Individual citizen reports (many-to-one with issues).

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID (PK) | Unique identifier |
| user_id | UUID (FK) | Reporter |
| issue_id | UUID (FK) | Linked consolidated issue |
| content | STRING | Full report text |
| embedding | VECTOR(1024) | For semantic matching |
| source | STRING | web, api, mobile |
| verification_status | STRING | unverified, verified, official |

### evidence
Supporting evidence for issues.

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID (PK) | Unique identifier |
| issue_id | UUID (FK) | Related issue |
| description | STRING | Evidence description |
| source | STRING | Where it came from |
| source_url | STRING | Link to original |
| evidence_type | STRING | report, data, official, media |
| embedding | VECTOR(1024) | Semantic retrieval |

### issue_timeline
Accountability tracking — chronological history.

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID (PK) | Unique identifier |
| issue_id | UUID (FK) | Related issue |
| event_type | STRING | created, updated, evidence_added, etc. |
| description | STRING | Human-readable event |
| actor | STRING | Who/what triggered it |
| metadata | JSONB | Additional structured data |

### actions
Things being done about issues.

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID (PK) | Unique identifier |
| issue_id | UUID (FK) | Related issue |
| action_type | STRING | investigation, outreach, resolution, etc. |
| description | STRING | What's being done |
| status | STRING | pending, in_progress, completed, blocked |

### responses
Official/community responses to issues.

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID (PK) | Unique identifier |
| issue_id | UUID (FK) | Related issue |
| source | STRING | Who responded |
| content | STRING | Response content |
| response_type | STRING | community, official, media |
| embedding | VECTOR(1024) | Semantic search |

### agent_actions
Audit log of all agent operations.

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID (PK) | Unique identifier |
| conversation_id | UUID | Which conversation |
| issue_id | UUID (FK) | Related issue |
| tool_name | STRING | Which tool was used |
| action | STRING | What operation |
| input_params | JSONB | Tool inputs |
| result | JSONB | Tool output |
| status | STRING | completed, failed |
| duration_ms | INT | Execution time |

### conversations / messages
Chat session tracking for persistent memory.

### job_opportunities
Verified job listings for resolution matching.

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID (PK) | Unique identifier |
| title | STRING | Job title |
| company | STRING | Employer |
| description | STRING | Full job description |
| skills | STRING[] | Required skills |
| experience_level | STRING | entry, mid, senior |
| source / source_url / apply_url | STRING | Verified links |
| embedding | VECTOR(1024) | Semantic job matching |

### job_matches
Connects users/issues to job opportunities.

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID (PK) | Unique identifier |
| user_id | UUID (FK) | Matched user |
| issue_id | UUID (FK) | Related employment issue |
| job_id | UUID (FK) | Matched job |
| match_score | FLOAT | Semantic similarity |
| match_reason | STRING | Why it matches |

## Vector Indexes

All VECTOR columns have HNSW indexes for distributed approximate nearest neighbor search:

```sql
CREATE INDEX idx_issues_embedding ON issues
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
```

## Entity Relationships

```
users ──< reports >── issues ──< evidence
                        |
                        +──< issue_timeline
                        |
                        +──< actions
                        |
                        +──< responses
                        |
                        +──< job_matches >── job_opportunities

conversations ──< messages
agent_actions ──< (linked to conversations and issues)
```
