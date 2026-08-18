# CJP — Civic Journey Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Deploy](https://img.shields.io/badge/Live-cjp--fawn.vercel.app-brightgreen.svg)](https://cjp-fawn.vercel.app)
[![CockroachDB](https://img.shields.io/badge/CockroachDB-Cloud_v26.2-green.svg)](https://cockroachlabs.cloud)
[![AWS Bedrock](https://img.shields.io/badge/AWS-Bedrock_Nova_Pro-orange.svg)](https://aws.amazon.com/bedrock/)
[![Strands](https://img.shields.io/badge/Strands-Agents_SDK_0.1.5-purple.svg)](https://github.com/strands-agents/sdk-python)

> **From Citizen Voice to Accountable Action**

CJP is an **agentic civic intelligence platform** that transforms fragmented citizen reports into persistent civic issues with full accountability tracking, semantic search, and practical job resolutions.

The AI agent uses **CockroachDB as its persistent memory and state layer** — not a chatbot with a database, but a real agentic system where the agent autonomously decides what tools to use.

## Live Demo

**https://cjp-fawn.vercel.app**

| Page | URL |
|------|-----|
| Dashboard | https://cjp-fawn.vercel.app |
| Civic Agent Chat | https://cjp-fawn.vercel.app/agent |
| Issues | https://cjp-fawn.vercel.app/issues |
| Jobs | https://cjp-fawn.vercel.app/jobs |
| Agent Activity | https://cjp-fawn.vercel.app/activity |
| API Health | https://cjp-fawn.vercel.app/api/health |

---

## Hackathon: CockroachDB x AWS

Built for the **CockroachDB x AWS Hackathon**.

### Required Tools — All Implemented

| Requirement | Implementation | Evidence |
|-------------|---------------|----------|
| **CockroachDB Cloud MCP Server** | Configured as the database access layer; MCP client defined for agent-DB bridge | Agent Activity panel, MCP client code |
| **Distributed Vector Indexing** | C-SPANN indexes on 5 tables (1024-dim) | Semantic search results |
| **ccloud CLI** | Cluster creation, schema deploy, API keys | [docs/ccloud-setup.md](docs/ccloud-setup.md) |
| **CockroachDB Agent Skills** | Transactional upsert, vector search, multi-table txn | [docs/cockroachdb-agent-skills.md](docs/cockroachdb-agent-skills.md) |
| **Strands Agents SDK** | Dynamic tool selection with 13 agent tools | Agent reasoning visible |
| **Amazon Bedrock** | Nova Pro (reasoning) + Titan Embed V2 (vectors) | Agent responses + search |

### CockroachDB Memory Layer — Proven Working

Agent tool interactions are logged to CockroachDB and visible at `/activity`:

```
tool_name              | action
-----------------------|------------------------------------------------
search_civic_memory    | Searching civic memory: not enough cloud jobs...
create_civic_issue     | Creating issue: Lack of cloud computing jobs...
find_job_opportunities | Searching jobs: cloud computing jobs for graduates
record_job_match       | Recording job match (x6)
get_issue_context      | Retrieving issue context (cross-session memory)
civic_agent            | process_message
```

**Persistent memory verified end-to-end:**
1. Report: "Engineering graduates in Thanjavur cannot find cloud/DevOps jobs"
2. Agent creates issue + finds jobs → stored in CockroachDB
3. Follow-up: "Continue with the employment issue about Thanjavur"
4. Agent calls `get_issue_context` → retrieves full state from CockroachDB
5. Response correctly shows title, location, category, status — all from persistent memory

### India-Focused Civic Intelligence

- India location selector with 28 states + 8 Union Territories + 200+ cities
- Tamil Nadu default with city-level filtering (Chennai, Coimbatore, Madurai, Thanjavur...)
- Civic categories: Employment, Education, Infrastructure, Healthcare, Digital Access, etc.
- Responsive mobile-first design with collapsible navigation

---

## Architecture

```
Citizen → React Dashboard → FastAPI → Strands Agent → CockroachDB Cloud
                                          ↕                    ↑
                                    Amazon Bedrock        MCP Server
                                  (Nova Pro + Titan)    (Agent Bridge)
```

```mermaid
flowchart TB
    USER[Citizen] --> UI[React + TypeScript + Tailwind]
    UI --> API[FastAPI Gateway - 20 endpoints]
    API --> AGENT[Strands Agent - Amazon Bedrock Nova Pro]
    AGENT --> MCP[CockroachDB Cloud MCP Server]
    AGENT --> SKILLS[CockroachDB Agent Skills]
    AGENT --> EMBED[Titan Embed V2 - 1024 dim]
    MCP --> DB[(CockroachDB Cloud v26.2)]
    SKILLS --> DB
    DB --> VECTOR[C-SPANN Distributed Vector Indexes]
    CCLOUD[ccloud CLI] -.-> DB
```

See [docs/architecture-diagram.md](docs/architecture-diagram.md) for full diagrams including draw.io XML.


---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + TypeScript + Tailwind CSS + Vite | 18.3 / 5.6 / 3.4 / 6.0 |
| Backend | Python + FastAPI + Uvicorn | 3.11 / 0.115 / 0.34 |
| Agent | Strands Agents SDK | 0.1.5 |
| LLM | Amazon Bedrock Nova Pro | v1 |
| Embeddings | Amazon Bedrock Titan Embed V2 | 1024-dim |
| Database | CockroachDB Cloud | v26.2.5 |
| Vector Index | CockroachDB C-SPANN (Distributed ANN) | HNSW |
| MCP | CockroachDB Cloud MCP Server | Official |
| Deployment | Vercel (Serverless) | Production |

---

## Features

### Civic Agent (AI-Powered)
- Natural language civic issue reporting with category and location context
- Autonomous tool selection (not hardcoded flows) with 13 agent tools
- Persistent memory across sessions via CockroachDB
- Semantic search for related issues and reports
- Job opportunity matching for employment issues
- Real-time execution timeline showing agent steps
- Professional confirmation screen after report submission
- Persistent memory demonstration (submit → retrieve from different session)

### Frontend Experience
- Back button navigation across all pages (no full page reloads)
- Execution visibility: see what the agent is doing in real time
- Error handling with retry on every backend operation
- Expandable technology cards explaining each CockroachDB component
- Responsive design with mobile navigation
- Strong visual hierarchy with solid backgrounds and high contrast

### Distributed Vector Indexing
- 5 C-SPANN vector indexes across tables
- 1024-dimensional embeddings (Titan V2)
- Finds related issues even when worded differently
- Semantic job matching by skills, location, experience

### Accountability Timeline
- Every agent action recorded
- Full issue history: created → investigated → resolved
- Evidence tracking with verification status
- Job match recording with source links

### Job Resolution
- Verified job listings only (source + apply URL required)
- Semantic matching by skills and experience
- Never fabricates listings or auto-applies



---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- AWS account with Bedrock access (Nova Pro + Titan Embed V2)
- CockroachDB Cloud account (free tier)

### 1. Clone

```bash
git clone https://github.com/dineshrajdhanapathyDD/cjp-Civic-Journey-Platform.git
cd cjp-Civic-Journey-Platform
```

### 2. Backend

```bash
cd backend
python -m venv venv
# Windows: .\venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your CockroachDB + AWS credentials
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000
```

### 3. Seed Data

```bash
python seed.py
# Creates demo user + 8 verified job opportunities with embeddings
```

### 4. Frontend

```bash
cd ../frontend
npm install
npm run dev
```

### 5. Open

- Dashboard: http://localhost:5173
- API Docs: http://localhost:8000/docs

---

## Environment Variables

```env
# CockroachDB Cloud
COCKROACHDB_URL=postgresql://user:pass@cluster.cockroachlabs.cloud:26257/cjp?sslmode=require

# AWS Bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
BEDROCK_MODEL_ID=amazon.nova-pro-v1:0
EMBEDDING_MODEL_ID=amazon.titan-embed-text-v2:0
EMBEDDING_DIMENSIONS=1024

# Application
APP_SECRET_KEY=your-secret-key
FRONTEND_URL=http://localhost:5173
```

---

## Project Structure

```
cjp/
├── api/                        # Vercel serverless function
│   └── index.py               # FastAPI → Mangum adapter
├── backend/                    # Python backend
│   ├── src/
│   │   ├── agent/             # Strands agent + 13 tools
│   │   │   ├── civic_agent.py # Agent definition (Nova Pro)
│   │   │   └── tools/        # All agent tools
│   │   ├── api/               # FastAPI routes (20 endpoints)
│   │   ├── db/                # CockroachDB connection
│   │   ├── mcp/               # CockroachDB MCP client
│   │   ├── skills/            # CockroachDB Agent Skills
│   │   └── vector/            # Titan embeddings + search
│   ├── migrations/            # SQL schema (13 tables + indexes)
│   └── seed.py                # Demo data seeder
├── frontend/                   # React TypeScript app
│   └── src/
│       ├── pages/             # Dashboard, Agent, Issues, Jobs, Activity
│       ├── components/        # Layout, BackButton, AgentActivityPanel, IndiaLocationSelector
│       └── services/          # API client
├── docs/                       # Full documentation
├── vercel.json                # Deployment config
├── CONTRIBUTING.md
├── LICENSE                     # MIT
└── README.md
```

---

## Agent Tools (13)

The Strands agent dynamically selects from these tools based on the user's message:

| Tool | Category | Purpose |
|------|----------|---------|
| `search_civic_memory` | Vector Search | Semantic search across all civic data |
| `find_related_issues` | Vector Search | Detect duplicate/related issues |
| `create_civic_issue` | CockroachDB MCP | Create issue with embedding |
| `update_issue` | CockroachDB MCP | Change status/priority |
| `get_issue_context` | CockroachDB MCP | Full state for cross-session memory |
| `record_evidence` | CockroachDB MCP | Store supporting evidence |
| `record_action` | CockroachDB MCP | Track accountability actions |
| `find_job_opportunities` | Vector Search | Semantic job matching |
| `record_job_match` | CockroachDB MCP | Persist job matches |
| `get_issue_timeline` | CockroachDB MCP | Retrieve accountability history |
| `add_timeline_event` | CockroachDB MCP | Record significant events |
| `consult_cockroachdb_skill` | Agent Skills | Query CockroachDB expertise library |
| `list_cockroachdb_skills` | Agent Skills | Discover available DB skills |

---

## API Endpoints (20)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat` | Send message to Civic Agent |
| GET | `/api/conversations` | List conversations |
| GET | `/api/conversations/:id/messages` | Get messages |
| GET | `/api/issues` | List civic issues |
| GET | `/api/issues/:id` | Issue details + counts |
| GET | `/api/issues/:id/timeline` | Accountability timeline |
| GET | `/api/issues/:id/reports` | Linked reports |
| GET | `/api/issues/:id/evidence` | Supporting evidence |
| GET | `/api/issues/:id/actions` | Actions taken |
| GET | `/api/issues/:id/jobs` | Matched jobs |
| POST | `/api/reports` | Submit citizen report |
| GET | `/api/jobs` | Browse job opportunities |
| POST | `/api/jobs` | Add job (admin) |
| GET | `/api/agent/actions` | Agent activity log |
| GET | `/api/memory/recent-issues` | Cross-session memory |
| GET | `/api/memory/search` | Semantic memory search |
| GET | `/api/memory/conversation-context/:id` | Full conversation context |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/health` | Health check |

---

## Database (13 Tables + 5 Vector Indexes)

```sql
-- Tables
users, issues, reports, evidence, issue_reports,
issue_timeline, actions, responses, agent_actions,
conversations, messages, job_opportunities, job_matches

-- C-SPANN Distributed Vector Indexes (1024-dim)
idx_issues_embedding, idx_reports_embedding,
idx_evidence_embedding, idx_responses_embedding,
idx_jobs_embedding
```

See [docs/database.md](docs/database.md) for full schema.

---

## Documentation

| Document | Content |
|----------|---------|
| [Architecture Diagram](docs/architecture-diagram.md) | Mermaid + draw.io XML |
| [draw.io File](docs/cjp-architecture.drawio) | Open in app.diagrams.net |
| [MCP Integration](docs/mcp-integration.md) | How MCP bridges agent to DB |
| [Vector Memory](docs/vector-memory.md) | C-SPANN indexing details |
| [Agent Skills](docs/cockroachdb-agent-skills.md) | CockroachDB Agent Skills |
| [ccloud Setup](docs/ccloud-setup.md) | CLI cluster management |
| [Database Schema](docs/database.md) | All 13 tables |
| [Job Resolution](docs/job-resolution.md) | Employment → job flow |
| [AWS Architecture](docs/aws-architecture.md) | Bedrock + services |
| [Setup Steps](docs/setup-steps.md) | Detailed installation |
| [User Guide](docs/user-guide.md) | End-user docs |
| [Demo Story](docs/demo-video-story.md) | 3-min video script |
| [Demo Flow](docs/demo-flow.md) | Quick demo checklist |
| [Deployment](docs/deployment.md) | Vercel + alternatives |
| [Hackathon Evidence](docs/hackathon-evidence.md) | Evidence matrix |
| [Hackathon Submission](docs/hackathon-submission.md) | Full submission text |

---

## Testing Credentials

| Field | Value |
|-------|-------|
| Demo Username | `demo` |
| Demo Password | `demo123` |

> Authentication is optional — all features work without login. The agent, issues, jobs, and activity pages are publicly accessible.

---

## Deployment

**Live**: https://cjp-fawn.vercel.app

Deployed on **Vercel** with:
- Frontend: Vite build → static hosting
- Backend: Python serverless function (FastAPI + Mangum)
- Database: CockroachDB Cloud (us-east-1)
- AI: Amazon Bedrock (us-east-1)

See [docs/deployment.md](docs/deployment.md) for deployment guide.

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
git checkout -b feature/your-feature
# Make changes
git commit -m "feat: your feature"
git push origin feature/your-feature
# Open a Pull Request
```

---

## License

This project is open source under the **[MIT License](LICENSE)**.

---

## The Story

> **CJP doesn't just collect civic complaints.**
>
> It creates **persistent civic memory**, connects fragmented citizen voices, tracks issue history and accountability, and helps people discover **practical next actions**.

```
Strands Agent     = Brain (dynamic reasoning)
MCP Server        = Bridge (agent ↔ CockroachDB)
CockroachDB       = Memory (persistent civic state)
Vector Indexes    = Understanding (semantic connections)
Agent Skills      = Capabilities (reusable DB operations)
ccloud CLI        = Operations (environment lifecycle)
Amazon Bedrock    = Intelligence (Nova Pro + Titan)
```

---

## Acknowledgments

- [CockroachDB](https://www.cockroachlabs.com/) — Distributed database with native vector support
- [Amazon Bedrock](https://aws.amazon.com/bedrock/) — Nova Pro + Titan Embed V2
- [Strands Agents SDK](https://github.com/strands-agents/sdk-python) — Agent orchestration
- [Vercel](https://vercel.com/) — Deployment platform

Built with persistence for the **CockroachDB x AWS Hackathon**.
