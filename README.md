# CJP — Civic Journey Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CockroachDB](https://img.shields.io/badge/CockroachDB-Cloud-green.svg)](https://cockroachlabs.cloud)
[![AWS](https://img.shields.io/badge/AWS-Bedrock-orange.svg)](https://aws.amazon.com/bedrock/)
[![Strands](https://img.shields.io/badge/Strands-Agents_SDK-purple.svg)](https://github.com/strands-agents/sdk-python)

**From Citizen Voice to Accountable Action**

CJP is an agentic civic intelligence platform that transforms fragmented citizen reports into persistent civic issues with full accountability tracking, semantic search, and practical job resolutions. The AI agent uses CockroachDB as its persistent memory and state layer.

---

## Hackathon

Built for the **CockroachDB x AWS Hackathon**.

| Requirement | Implementation |
|-------------|---------------|
| CockroachDB Cloud MCP Server | Agent queries/writes through official MCP server |
| Distributed Vector Indexing | C-SPANN indexes on 5 tables for semantic search |
| ccloud CLI | Cluster creation, schema deployment, connection config |
| CockroachDB Agent Skills | Transactional upsert, vector search, multi-table transactions |
| Strands Agents SDK | Dynamic tool selection with 11 agent tools |
| Amazon Bedrock | Nova Pro (reasoning) + Titan Embed V2 (1024-dim vectors) |

---



## Architecture

```
Citizen → React UI → FastAPI → Strands Agent → CockroachDB Cloud
                                    ↓                    ↑
                              Amazon Bedrock       MCP Server
                              (Nova Pro + Titan)   (Agent Bridge)
```

```mermaid
flowchart TB
    USER[Citizen] --> UI[React Dashboard]
    UI --> API[FastAPI]
    API --> AGENT[Strands Agent<br/>Amazon Bedrock Nova Pro]
    AGENT --> MCP[CockroachDB MCP Server]
    AGENT --> SKILLS[Agent Skills]
    MCP --> DB[(CockroachDB Cloud)]
    SKILLS --> DB
    DB --> VECTOR[C-SPANN Vector Indexes]
```

See [docs/architecture-diagram.md](docs/architecture-diagram.md) for full diagrams.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS + Vite |
| Backend | Python 3.11 + FastAPI + Uvicorn |
| Agent | Strands Agents SDK 0.1.5 |
| LLM | Amazon Bedrock — Nova Pro v1 |
| Embeddings | Amazon Bedrock — Titan Embed V2 (1024-dim) |
| Database | CockroachDB Cloud v26.2 |
| Vector Search | CockroachDB C-SPANN Distributed Indexes |
| MCP | CockroachDB Cloud MCP Server |
| CLI | ccloud CLI |

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- AWS account with Bedrock access (Nova Pro + Titan Embed V2)
- CockroachDB Cloud account (free tier works)

### 1. Clone

```bash
git clone https://github.com/YOUR_USERNAME/cjp.git
cd cjp
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `backend/.env`:
```env
COCKROACHDB_URL=postgresql://user:password@your-cluster.cockroachlabs.cloud:26257/cjp?sslmode=require
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=amazon.nova-pro-v1:0
EMBEDDING_MODEL_ID=amazon.titan-embed-text-v2:0
```

### 4. Initialize Database

The backend auto-runs migrations on startup. Just start it:

```bash
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000
```

### 5. Seed Demo Data

```bash
python seed.py
```

### 6. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

### 7. Open

- Dashboard: http://localhost:5173
- API Docs: http://localhost:8000/docs
- Health: http://localhost:8000/api/health

---

## Project Structure

```
cjp/
├── backend/                    # Python backend
│   ├── src/
│   │   ├── agent/             # Strands agent + 11 tools
│   │   │   ├── civic_agent.py # Main agent definition
│   │   │   └── tools/        # search_civic_memory, find_jobs, etc.
│   │   ├── api/               # FastAPI routes (20 endpoints)
│   │   ├── db/                # CockroachDB connection
│   │   ├── mcp/               # CockroachDB MCP client
│   │   ├── skills/            # CockroachDB Agent Skills
│   │   └── vector/            # Embedding + search
│   ├── migrations/            # SQL schema
│   ├── seed.py                # Demo data seeder
│   └── requirements.txt
├── frontend/                   # React TypeScript app
│   └── src/
│       ├── pages/             # Dashboard, Agent, Issues, Jobs, Activity
│       ├── components/        # Layout, AgentActivityPanel
│       └── services/          # API client
├── docs/                       # Documentation
│   ├── architecture-diagram.md
│   ├── mcp-integration.md
│   ├── vector-memory.md
│   ├── cockroachdb-agent-skills.md
│   ├── ccloud-setup.md
│   ├── database.md
│   ├── job-resolution.md
│   ├── setup-steps.md
│   ├── user-guide.md
│   └── hackathon-evidence.md
├── scripts/                    # Utility scripts
├── CONTRIBUTING.md
├── LICENSE                     # MIT
└── README.md
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat` | Send message to Civic Agent |
| GET | `/api/issues` | List civic issues |
| GET | `/api/issues/:id` | Issue details |
| GET | `/api/issues/:id/timeline` | Accountability timeline |
| GET | `/api/issues/:id/jobs` | Job matches for issue |
| GET | `/api/jobs` | Browse job opportunities |
| GET | `/api/agent/actions` | Agent activity log |
| GET | `/api/memory/search` | Semantic memory search |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/health` | Health check |

Full API documentation available at `/docs` when running.

---

## Agent Tools

The Strands agent has 11 tools it dynamically selects from:

| Tool | Purpose |
|------|---------|
| `search_civic_memory` | Vector search across all civic data |
| `find_related_issues` | Detect duplicate/related issues |
| `create_civic_issue` | Create new issue with embedding |
| `update_issue` | Change status/priority/confidence |
| `get_issue_context` | Full issue state (cross-session memory) |
| `record_evidence` | Store supporting evidence |
| `record_action` | Track accountability actions |
| `find_job_opportunities` | Semantic job matching |
| `record_job_match` | Persist job matches |
| `get_issue_timeline` | Retrieve accountability history |
| `add_timeline_event` | Record significant events |

---

## Documentation

| Document | Content |
|----------|---------|
| [Architecture Diagram](docs/architecture-diagram.md) | System diagrams (Mermaid + draw.io XML) |
| [MCP Integration](docs/mcp-integration.md) | How MCP connects agent to CockroachDB |
| [Vector Memory](docs/vector-memory.md) | Distributed vector indexing details |
| [Agent Skills](docs/cockroachdb-agent-skills.md) | CockroachDB Agent Skills usage |
| [ccloud Setup](docs/ccloud-setup.md) | CLI cluster management |
| [Database Schema](docs/database.md) | All 13 tables documented |
| [Job Resolution](docs/job-resolution.md) | Employment issue to job flow |
| [Setup Steps](docs/setup-steps.md) | Detailed installation guide |
| [User Guide](docs/user-guide.md) | End-user documentation |
| [Demo Story](docs/demo-video-story.md) | 3-minute demo script |
| [Hackathon Evidence](docs/hackathon-evidence.md) | Evidence matrix for judging |

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
# Fork, clone, branch
git checkout -b feature/your-feature

# Make changes, test
cd backend && python -m pytest
cd frontend && npx tsc --noEmit

# Commit and PR
git commit -m "feat: your feature"
git push origin feature/your-feature
```

---

## License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- [CockroachDB](https://www.cockroachlabs.com/) — Distributed database with vector support
- [AWS Bedrock](https://aws.amazon.com/bedrock/) — Foundation models (Nova Pro + Titan)
- [Strands Agents SDK](https://github.com/strands-agents/sdk-python) — Agent orchestration
- Built for the CockroachDB x AWS Hackathon

---

> **CJP doesn't just collect civic complaints. It creates persistent civic memory, connects fragmented citizen voices, tracks issue history and accountability, and helps people discover practical next actions.**
