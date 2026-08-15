# CJP Demo Flow (3 Minutes)

## Setup

Ensure:
- Backend running (`python -m src.main`)
- Frontend running (`npm run dev`)
- CockroachDB Cloud connected
- Some seed data loaded (jobs, optional existing issues)

---

## 0:00 — 0:30 | Citizen Reports a Concern

Open the **Civic Agent** page.

Type:
> "There aren't enough technology jobs for graduates in my area."

**What happens**:
- Agent receives the message
- Agent Activity panel shows: "Strands Agent — Understanding request"
- Agent calls `search_civic_memory` — vector search in CockroachDB
- Agent Activity shows: "CockroachDB Vector Search — Searching civic memory"

**Key demo point**: The agent autonomously decides to search memory first.

---

## 0:30 — 1:00 | Agent Identifies Issue and Searches Memory

**Agent Activity shows**:
```
Strands Agent — Understanding request
CockroachDB MCP — Searching civic memory
Distributed Vector Index — 23 related reports found
Existing issue identified (or new issue created)
CockroachDB MCP — Retrieving issue timeline
State persisted
```

**Agent response** explains:
- Whether this matches an existing issue
- How many related reports exist
- Current issue status and timeline

**Key demo point**: Vector search finds semantically related reports even with different wording.

---

## 1:00 — 1:30 | Civic Issue Journey

Navigate to **Issues** page.

Click the employment issue to see:
- **Timeline** tab: Full accountability history
- **Reports** tab: All citizen reports linked
- **Evidence** tab: Supporting data
- **Actions** tab: What's being done

**Key demo point**: Everything persists in CockroachDB with full accountability tracking.

---

## 1:30 — 2:15 | Job Opportunity Resolution

Back in the **Civic Agent**, ask:
> "Can you help find opportunities for someone with Python and AWS skills?"

**Agent Activity shows**:
```
Strands Agent — Processing request
Job Semantic Search — Searching opportunities
Distributed Vector Index — 8 relevant opportunities found
CockroachDB MCP — Recording job matches
```

**Agent returns**: Real job listings with:
- Title and company
- Match score
- Source URL
- Application link

Click through to the **Jobs** page to show the full catalog.

**Key demo point**: Practical resolution, not just problem identification.

---

## 2:15 — 2:40 | New Session Memory

**Close the chat** (or open a new conversation).

Type:
> "Continue where we left off."

**Agent Activity shows**:
```
Strands Agent — Recovering context
CockroachDB MCP — Retrieving persistent memory
Issue context loaded
Timeline retrieved
Job matches retrieved
```

**Agent response** recalls:
- The employment issue
- Related reports
- Timeline events
- Job matches found
- Previous actions taken

**Key demo point**: Persistent memory across sessions — CockroachDB IS the agent's memory.

---

## 2:40 — 3:00 | Architecture Explanation

Show the **Agent Activity** page with full tool interaction history.

Explain:
> "Strands is the brain — it decides what to do.
> MCP is the bridge — it connects the agent to CockroachDB.
> CockroachDB provides persistent civic memory, transactional state, and semantic retrieval through distributed vector indexing.
> The agent uses CockroachDB Agent Skills for reusable database operations.
> All managed through ccloud CLI."

---

## Demo Checklist

- [ ] Agent processes natural language report
- [ ] Vector search finds related issues
- [ ] Issue created/updated in CockroachDB
- [ ] Timeline shows accountability history
- [ ] Job search returns verified opportunities
- [ ] New session retrieves persistent memory
- [ ] Agent Activity shows real tool usage
- [ ] No chain-of-thought exposed — only operations and results
