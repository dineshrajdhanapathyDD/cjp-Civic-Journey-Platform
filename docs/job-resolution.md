# Job Resolution System

## Overview

CJP goes beyond identifying problems. For employment-related civic issues, the agent proactively helps users discover relevant jobs and internships through semantic matching.

## Flow

```
Youth Employment Issue
        |
        v
47 related reports consolidated
        |
        v
Agent identifies employment gap
        |
        v
find_job_opportunities (vector search)
        |
        v
18 jobs found in CockroachDB
        |
        v
8 strong matches (similarity > 0.7)
        |
        v
Users view/apply via verified links
```

## Agent Skill: find_job_opportunities

The agent extracts from the user's message:
- Skills (e.g., AWS, Python, cloud)
- Location preference
- Experience level
- Employment type preference
- Work type (remote/onsite/hybrid)

Then constructs an enriched search query for semantic matching:

```python
@tool
def find_job_opportunities(query, skills, location, experience_level, work_type, limit):
    """Search for relevant job opportunities using semantic matching."""
    # Build enriched query
    search_text = query
    if skills:
        search_text += f" Skills: {', '.join(skills)}"
    if location:
        search_text += f" Location: {location}"

    # Generate embedding and search
    embedding = embedding_service.generate_embedding(search_text)

    # Vector search with filters
    cursor.execute("""
        SELECT *, 1 - (embedding <=> %s::VECTOR) as similarity
        FROM job_opportunities
        WHERE verification_status = 'verified'
        ORDER BY embedding <=> %s::VECTOR
        LIMIT %s
    """)
```

## Example Interaction

**User**: "I'm a recent engineering graduate with AWS and Python skills looking for an entry-level cloud role."

**Agent extracts**:
- Skills: AWS, Python
- Experience: Entry Level
- Domain: Cloud/Engineering

**Agent performs**:
1. `search_civic_memory` — checks if related employment issue exists
2. `find_job_opportunities` — semantic vector search
3. `record_job_match` — persists matches for the user/issue

**Result**: Returns verified job listings with source URLs, company names, and application links.

## Data Integrity Rules

Every job opportunity in CJP must have:

| Field | Requirement |
|-------|------------|
| source | Where the listing was found |
| source_url | Link to the original listing |
| apply_url | Direct application link |
| posted_at | When it was posted |
| verification_status | Must be 'verified' |

**CJP never**:
- Fabricates job listings
- Automatically applies for jobs on behalf of users
- Presents expired listings
- Shows unverified opportunities

## Civic Issue to Job Connection

When an employment-related issue accumulates reports, the agent:

1. Identifies the employment gap (skills, location, level)
2. Searches job_opportunities using vector similarity
3. Records matches with scores and reasons
4. Updates the issue timeline with the opportunity discovery
5. Returns real, actionable links to the user

This creates a measurable resolution path for civic employment issues.

## Job Match Recording

```python
@tool
def record_job_match(user_id, issue_id, job_id, match_score, match_reason):
    """Record a job match and update the issue timeline."""
    # Insert match record
    # Update issue timeline: "Job opportunity matched: {title} at {company}"
```

The timeline entry makes the resolution attempt visible in the accountability record.
