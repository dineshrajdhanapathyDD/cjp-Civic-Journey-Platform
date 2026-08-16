# CJP — Civic Journey Platform: Hackathon Submission

---

## Inspiration

Citizen complaints are everywhere — social media, government portals, community boards — but they're fragmented and forgotten. Someone reports "no tech jobs for graduates." Another says "engineers are leaving the city." A third mentions "limited IT opportunities." Same problem, but no system connects them.

We were inspired by a simple question: **What if an AI agent could genuinely remember civic concerns, connect them across time, and help people find real solutions?**

Not a chatbot that forgets everything between sessions. Not a database with a search bar. A truly agentic system where CockroachDB IS the agent's persistent memory — the civic brain that never forgets.

The CockroachDB x AWS Hackathon gave us the perfect tools: distributed vector indexing for semantic understanding, the MCP server for agent-database communication, and Amazon Bedrock for intelligent reasoning.

---

## What it does

CJP transforms fragmented citizen voices into accountable civic action through an AI agent with persistent memory.

**A citizen says:** "There aren't enough technology jobs for graduates in my area."

**CJP's agent autonomously:**
1. Searches CockroachDB's vector indexes for semantically related issues and reports
2. Detects if this matches an existing civic issue (even if worded differently)
3. Creates or updates a consolidated issue with an accountability timeline
4. Finds relevant job opportunities through semantic matching against 1024-dimensional embeddings
5. Returns 6+ verified job listings with real application links
6. Persists everything in CockroachDB for future sessions

**Next day, the citizen returns:** "Continue where we left off."

**The agent retrieves from CockroachDB:** The full issue context, timeline, related reports, job matches, and all previous actions — proving persistent cross-session memory.

**Live proof — Agent Activity log shows every CockroachDB interaction:**

```
tool_name              | action
-----------------------|------------------------------------------------
search_civic_memory    | Searching civic memory: not enough cloud jobs...
create_civic_issue     | Creating issue: Lack of cloud computing jobs...
find_job_opportunities | Searching jobs: cloud computing jobs for graduates
record_job_match       | Recording job match (×6)
civic_agent            | process_message
```

Visible at: https://cjp-fawn.vercel.app/activity

**Key features:**
- 11 agent tools dynamically selected (not hardcoded sequences)
- Semantic search across issues, reports, evidence, and jobs via CockroachDB C-SPANN vector indexes
- Full accountability timeline for every civic issue
- Job resolution for employment-related issues with verified listings
- Agent Activity panel showing every MCP operation and vector search in real-time
- Persistent cross-session memory proven working

---

## How we built it

**Architecture:** React frontend + Python FastAPI backend + Strands Agent + CockroachDB Cloud

**Agent Layer:**
- Strands Agents SDK orchestrates the agent with Amazon Bedrock Nova Pro for reasoning
- 11 tools (`search_civic_memory`, `create_civic_issue`, `find_job_opportunities`, etc.) registered as Strands tools
- The agent's system prompt guides strategy but doesn't force sequences — Nova Pro decides dynamically

**Database Layer:**
- CockroachDB Cloud (v26.2) with 13 tables and 5 C-SPANN distributed vector indexes
- Amazon Bedrock Titan Embed V2 generates 1024-dimensional embeddings stored directly in CockroachDB
- The `<=>` cosine distance operator queries distributed vector indexes for semantic search
- CockroachDB Agent Skills provide reusable capabilities: transactional upsert, vector similarity search, multi-table transactions

**MCP Integration:**
- CockroachDB Cloud MCP Server bridges the Strands agent to the database
- Agent discovers available tools through MCP protocol
- All CRUD and search operations flow through MCP

**Frontend:**
- React 18 + TypeScript + Tailwind CSS
- Dashboard, Civic Agent chat, Issues explorer, Jobs browser, Agent Activity monitor
- Real-time Agent Activity sidebar shows MCP operations as they happen

**Deployment:**
- Vercel (frontend static + Python serverless function via Mangum)
- CockroachDB Cloud (us-east-1)
- Amazon Bedrock (us-east-1)

---

## Challenges we ran into

**1. CockroachDB v26.2 Vector Index Syntax**
Standard HNSW parameters (`WITH m=16`) don't work — CockroachDB uses its own C-SPANN implementation. Took multiple attempts to discover the correct syntax is just `USING hnsw (col vector_cosine_ops)` without WITH parameters.

**2. Titan Embed V2 Similarity Scores**
Titan V2 produces lower cosine similarities (0.15-0.35) compared to OpenAI embeddings (0.7-0.9). Our thresholds of 0.6-0.7 returned zero results. Had to empirically calibrate to 0.10-0.15 for job search and 0.15 for issue matching.

**3. Vector Parameter Ordering in Dynamic SQL**
When building SQL with conditional WHERE clauses, the `%s` placeholder positions shifted, causing embedding strings to land in wrong positions. Error message "malformed vector literal" was cryptic — took debugging to realize it was a parameter ordering issue, not a format issue.

**4. Vercel Serverless Environment Variables**
The `-e` flag during `vercel --prod` only sets build-time variables, not runtime. Our deployed function connected to `localhost:26257` instead of CockroachDB Cloud. Fixed by using `vercel env add` for persistent production variables.

**5. SSL on Windows**
`sslmode=verify-full` requires a root certificate file that doesn't exist on Windows by default. Switching to `sslmode=require` (still encrypted, just doesn't verify the specific cert) solved it.

**6. Agent Response Time**
Nova Pro + vector search + database operations = 30-50 seconds per interaction. Vercel's 60-second timeout is tight. Optimized by reducing unnecessary tool calls in the system prompt.

---

## Accomplishments that we're proud of

**1. True Persistent Agentic Memory**
Not a chatbot with a database. The agent retrieves full context from CockroachDB across sessions — issues, timeline, reports, job matches, and previous actions. This is genuine agentic memory.

**2. All Four CockroachDB Tools Used Meaningfully**
- MCP Server for all agent-database communication
- Distributed Vector Indexing (5 C-SPANN indexes) for semantic search
- ccloud CLI for cluster lifecycle management
- Agent Skills for reusable database operations

**3. CockroachDB Memory Layer Fully Visible**
Every single tool call the agent makes is logged to CockroachDB and displayed in the Agent Activity UI. You can see `search_civic_memory`, `create_civic_issue`, `find_job_opportunities`, and `record_job_match` all appear with descriptions showing what CockroachDB operation was performed.

**4. Semantic Issue Deduplication**
"No software careers", "IT opportunities lacking", "engineers leaving" — all connect to the same underlying issue through vector similarity, even though they share zero keywords.

**5. End-to-End Job Resolution**
The platform doesn't just identify problems — it helps solve them. Employment issues trigger semantic job matching with verified listings, real companies, and actual application links. In testing, the agent found 6 relevant jobs from our seeded data.

**6. Agent Activity Transparency**
Every MCP operation, every vector search, every database write is visible in the Agent Activity panel. No black box — citizens can see exactly what the AI is doing with their data.

**7. Live Production Deployment**
Not a demo on localhost. The full system runs at https://cjp-fawn.vercel.app with real CockroachDB Cloud connectivity, real Bedrock inference, and real vector search — verified working with `/api/health` returning `{"status": "healthy", "database": "connected"}`.

---

## What we learned

**1. CockroachDB is Ideal for Agentic Applications**
Combining relational data + vector embeddings + serializable transactions in one system eliminates the "separate vector DB" complexity. One connection, one transaction, one source of truth.

**2. Vector Similarity Thresholds Vary by Model**
Different embedding models produce different similarity score ranges. Always test empirically rather than assuming 0.7 is "good" — Titan V2 operates in a lower range than OpenAI embeddings.

**3. Agentic Systems Need Audit Trails**
Logging every tool invocation, every database operation, and every decision the agent makes is essential — both for debugging and for user trust.

**4. MCP Protocol Has Real Value**
The MCP server abstraction means the agent doesn't need direct database credentials or SQL knowledge. It communicates through a protocol, which is cleaner for security and maintainability.

**5. Strands SDK + Bedrock = Clean Agent Architecture**
The `@tool` decorator pattern with Bedrock's native tool-calling makes it natural to build agentic systems without wrestling with prompt engineering for function calls.

**6. Serverless Has Limits for AI Agents**
30-50 second agent interactions push against Vercel's 60s timeout. For production, a persistent server (Railway, EC2) would be better than serverless for agentic workloads.

---

## What's next for CJP Civic Journey Platform

**Short-term:**
- Real-time job data integration (LinkedIn API, Indeed API) instead of seeded listings
- Multi-city deployment with location-specific vector partitioning
- Email/SMS notifications when issue status changes (via Amazon SNS)
- Evidence upload to S3 with automatic summarization

**Medium-term:**
- CockroachDB Change Data Capture (CDC) for real-time dashboards
- Amazon EventBridge for event-driven issue escalation
- Community voting on issue priority
- Official response tracking (government agencies, companies)
- Multi-agent collaboration (specialist agents for different issue categories)

**Long-term:**
- Federated deployment across regions using CockroachDB's multi-region capabilities
- Policy recommendation engine based on aggregated civic data
- Integration with government open data portals
- Mobile app for citizen reporting
- Public API for civic tech organizations

**The vision:** Every civic concern, from pothole to policy, becomes a persistent, tracked, accountable journey from citizen voice to resolved outcome — powered by CockroachDB's distributed memory and AWS intelligence.

---

## Links

| Resource | URL |
|----------|-----|
| Live Demo | https://cjp-fawn.vercel.app |
| GitHub Repository | https://github.com/dineshrajdhanapathyDD/cjp-Civic-Journey-Platform |
| API Health Check | https://cjp-fawn.vercel.app/api/health |
