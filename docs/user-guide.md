# CJP User Guide

## What is CJP?

CJP (Civic Journey Platform) transforms fragmented citizen reports into persistent civic issues with accountability tracking and practical resolutions. It uses AI to understand your concerns, find related issues, and connect you to opportunities.

---

## Getting Started

### Access the Platform

Open your browser and navigate to:
- **Frontend**: `http://localhost:5173`
- **API Docs**: `http://localhost:8000/docs`

### Login (Optional)

Default demo credentials:
- Username: `demo`
- Password: `demo123`

---

## Features

### 1. Dashboard

The dashboard provides an overview of:
- **Active Issues** — Open civic issues being tracked
- **Citizen Reports** — Total reports submitted
- **Job Opportunities** — Verified job listings available
- **Agent Actions** — Total AI agent operations performed
- **Issues by Category** — Distribution across employment, infrastructure, etc.
- **System Architecture** — Visual overview of the platform components

### 2. Civic Agent (Chat)

The AI-powered civic agent is your primary interface.

**What you can do:**
- Report civic concerns in natural language
- Ask about existing issues
- Request job opportunities
- Resume previous conversations
- Get status updates on issues

**Example prompts:**

| What you want | What to type |
|--------------|-------------|
| Report an issue | "There aren't enough technology jobs for graduates in my area." |
| Find jobs | "Help me find entry-level Python jobs with AWS skills." |
| Resume context | "Continue with the issue we discussed yesterday." |
| Check status | "What's the status of the employment issue?" |
| Get timeline | "Show me the history of actions taken on this issue." |

**Agent Activity Panel:**
The right sidebar shows what the agent is doing in real-time:
- Which tools it's using
- What database operations it performs
- The status of each operation

### 3. Issues

Browse all civic issues tracked by the platform.

**Filters:**
- Status: Open, Investigating, In Progress, Resolved, Closed
- Category: Employment, Infrastructure, Education, Healthcare, etc.

**Issue Detail Page tabs:**
- **Timeline** — Full accountability history of the issue
- **Reports** — All citizen reports linked to this issue
- **Evidence** — Supporting evidence and data
- **Actions** — What's being done about it
- **Jobs** — Matched job opportunities (for employment issues)

### 4. Jobs

Browse verified job opportunities.

**Filters:**
- Work Type: Remote, Onsite, Hybrid
- Experience Level: Entry, Mid, Senior, Lead
- Location: Search by city/region

**Each listing shows:**
- Job title and company
- Description and required skills
- Salary range (when available)
- Source and application link
- Posted date

**Important**: CJP never fabricates job listings. Every job has a verified source and real application URL. CJP does not apply for jobs on your behalf.

### 5. Agent Activity

View the complete log of AI agent operations.

**Categories shown:**
- **Strands Agent** — Reasoning and orchestration
- **CockroachDB MCP** — Database read/write operations
- **Vector Search** — Semantic search operations

Each entry shows the tool used, operation performed, status, and execution time.

---

## How the Agent Works

When you send a message, the agent follows this process:

```
Your Message
    ↓
Strands Agent receives it
    ↓
Agent DECIDES what tools to use (not hardcoded)
    ↓
Possible actions:
  • Search civic memory for related issues
  • Create a new issue if none exists
  • Update an existing issue
  • Search for job opportunities
  • Record evidence or actions
  • Retrieve timeline history
    ↓
All state saved to CockroachDB
    ↓
Response returned to you
```

The key difference from a chatbot: **CJP remembers everything across sessions**. When you come back tomorrow, the agent retrieves your full context from its persistent memory.

---

## Trust & Verification

CJP distinguishes between different verification levels:

| Status | Meaning |
|--------|---------|
| Unverified | Citizen-reported, not independently confirmed |
| Verified | Confirmed through multiple reports or evidence |
| Official | Response from an official source |

The platform never presents unverified citizen claims as established facts.

---

## Privacy & Security

- Your data is stored in CockroachDB Cloud with encryption at rest and in transit
- Passwords are hashed with bcrypt
- No data is shared with third parties
- The agent does not scrape private data
- All agent actions are logged for transparency

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Agent not responding | Check if backend is running on port 8000 |
| "unhealthy" status | CockroachDB connection issue — check .env |
| No jobs found | Seed data may not be loaded — run `python seed.py` |
| Slow responses | Normal — AI reasoning takes 10-30 seconds |
| Vector search returns no results | Ensure embeddings exist — check migration status |

---

## FAQ

**Q: Does CJP apply for jobs automatically?**
A: No. CJP finds and recommends opportunities but never applies on your behalf.

**Q: Can the agent remember previous conversations?**
A: Yes. All state is persisted in CockroachDB. Say "continue where we left off" to resume.

**Q: How does it find related issues?**
A: CJP uses semantic vector search. Even if worded differently, related concerns are connected through AI embeddings.

**Q: Is my data safe?**
A: Yes. Data is encrypted, passwords are hashed, and all agent actions are audited.
