# CJP Demo Video Story

## Video Title
**CJP: From Citizen Voice to Accountable Action**

## Duration: 3 Minutes

---

## Script & Storyboard

### Scene 1: Opening (0:00 - 0:15)

**Visual**: CJP Dashboard with stats visible

**Narration**:
> "Meet CJP — the Civic Journey Platform. It doesn't just collect complaints. It creates persistent civic memory, connects citizen voices, tracks accountability, and helps people discover real solutions."

**On Screen**:
- Dashboard showing system architecture
- Stats: Issues, Reports, Jobs, Agent Actions

---

### Scene 2: Citizen Reports a Concern (0:15 - 0:45)

**Visual**: Civic Agent chat page

**Action**: Type the message:
> "There aren't enough technology jobs for graduates in my area."

**Narration**:
> "A citizen reports a concern through natural language. The Strands agent — powered by Amazon Bedrock — decides what to do. Watch the Agent Activity panel."

**Agent Activity Panel Shows**:
```
Strands Agent — Understanding request
CockroachDB MCP — Searching civic memory
Distributed Vector Index — Searching related issues
CockroachDB MCP — Creating civic issue
Timeline Event — Issue recorded
```

**Key Point**: The agent autonomously searches memory first, then creates an issue with a vector embedding for future semantic matching.

---

### Scene 3: Vector Search in Action (0:45 - 1:15)

**Visual**: Agent response showing the created issue

**Narration**:
> "CockroachDB's distributed vector indexing lets the agent find semantically related reports — even when worded differently. 'No software careers', 'IT opportunities lacking', 'engineers leaving' — all connect to the same underlying issue."

**Action**: Navigate to Issues page, click the issue

**On Screen**:
- Issue detail page with Timeline tab
- Events: created, evidence_added, action_recorded
- Category: employment, Status: open, Priority: high

---

### Scene 4: Job Resolution (1:15 - 2:00)

**Visual**: Back to Civic Agent chat

**Action**: Type:
> "Can you find job opportunities for someone with Python and AWS skills?"

**Agent Activity Panel Shows**:
```
Strands Agent — Processing request
Job Semantic Search — Querying vector index
Distributed Vector Index — 6 matches found
CockroachDB MCP — Persisting results
```

**Narration**:
> "CJP goes beyond identifying problems. For employment issues, the agent performs semantic job matching using CockroachDB's vector indexes. Every job has a verified source and real application link."

**On Screen**: Agent returns formatted job listings with:
- Junior Cloud Engineer — Remote — Apply link
- Software Development Intern — New York — Apply link
- DevOps Engineer — San Francisco — Apply link

---

### Scene 5: Persistent Memory Demo (2:00 - 2:30)

**Visual**: Start a new conversation (or new browser session)

**Action**: Type:
> "Continue with the employment issue we discussed."

**Agent Activity Panel Shows**:
```
Strands Agent — Recovering context
CockroachDB MCP — Retrieving persistent memory
Issue context loaded from CockroachDB
Timeline retrieved
Job matches retrieved
```

**Narration**:
> "This is the key — persistent agentic memory. The agent retrieves full context from CockroachDB across sessions. It remembers the issue, the timeline, the jobs found, and all previous actions."

**On Screen**: Agent responds with full context from the previous session

---

### Scene 6: Architecture Closing (2:30 - 3:00)

**Visual**: Agent Activity page showing all operations, then Dashboard

**Narration**:
> "Strands is the brain — it decides what tools to use dynamically.
> The CockroachDB MCP Server is the bridge — connecting the agent to persistent memory.
> CockroachDB provides distributed civic memory with semantic retrieval through vector indexing.
> Agent Skills give us reusable database capabilities.
> And ccloud CLI manages the cloud environment.
> 
> CJP: From Citizen Voice to Accountable Action."

**Final Screen**: Dashboard with the tagline

---

## Key Demo Beats to Hit

| Time | What to Show | Hackathon Requirement |
|------|-------------|----------------------|
| 0:15 | Agent processes report | Strands + Bedrock |
| 0:30 | Agent Activity panel | MCP operations visible |
| 0:45 | Vector search finds related | Distributed Vector Indexing |
| 1:15 | Issue with timeline | CockroachDB persistent state |
| 1:30 | Job semantic matching | Vector search + Agent Skills |
| 2:00 | Real job links | Practical resolution |
| 2:15 | New session memory | Persistent memory proof |
| 2:45 | Agent Activity log | All tools documented |
| 2:55 | Architecture summary | All 4 CockroachDB tools used |

---

## Recording Tips

1. **Use a clean browser** — no bookmarks bar, no extensions visible
2. **Pre-seed some data** — have a few issues already so vector search shows results
3. **Zoom to 125%** — better readability in video
4. **Use a dark terminal** — if showing ccloud commands
5. **Keep the Agent Activity panel visible** — this is the proof of tool usage
6. **Don't fast-forward** — let viewers see the agent thinking (but cut dead time)

---

## Backup Demo Script

If the live system has issues, show:
1. The CockroachDB Cloud console with tables and data
2. The API docs at `/docs` showing all endpoints
3. The Agent Activity page with logged operations
4. Screenshot of successful agent interaction from earlier
