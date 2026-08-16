# CJP Architecture Diagrams

> Open [cjp-architecture.drawio](cjp-architecture.drawio) in https://app.diagrams.net for the interactive diagram.

---

## System Architecture

```mermaid
flowchart TB
    subgraph USERS["👤 Users"]
        CITIZEN[Citizen / User]
    end

    subgraph VERCEL["☁️ Vercel (Production)"]
        subgraph FE["Frontend"]
            REACT[React 18 + TypeScript + Tailwind]
        end
        subgraph BE["Backend (Serverless)"]
            FASTAPI[FastAPI + Mangum]
        end
    end

    subgraph AGENT_LAYER["🧠 Agent Layer"]
        STRANDS[Strands Agent SDK 0.1.5]
        TOOLS[11 Agent Tools]
    end

    subgraph AWS["🟠 Amazon Web Services"]
        NOVA[Bedrock Nova Pro v1<br/>Reasoning]
        TITAN[Bedrock Titan Embed V2<br/>1024-dim Vectors]
    end

    subgraph CRDB["🪳 CockroachDB Cloud"]
        MCP[MCP Server<br/>Agent-DB Bridge]
        SKILLS[Agent Skills<br/>Vector Search • Upsert • Multi-Table Txn]
        DB[(CockroachDB v26.2<br/>13 Tables)]
        VECTOR[C-SPANN Vector Indexes<br/>5 Distributed HNSW Indexes]
    end

    subgraph OPS["⚙️ Operations"]
        CCLOUD[ccloud CLI]
    end

    CITIZEN --> REACT
    REACT --> FASTAPI
    FASTAPI --> STRANDS
    STRANDS --> TOOLS
    STRANDS --> NOVA
    TOOLS --> TITAN
    TOOLS --> MCP
    TOOLS --> SKILLS
    MCP --> DB
    SKILLS --> DB
    DB --> VECTOR
    CCLOUD -.->|Environment Mgmt| DB
```

---

## Agent Decision Flow

```mermaid
flowchart TD
    A[Citizen Message] --> B[Strands Agent<br/>Nova Pro]

    B --> C{Search Memory?}
    C -->|Yes| D[search_civic_memory<br/>Vector Search]
    D --> E[C-SPANN Index Scan]
    E --> F[Related Issues/Reports]

    F --> G{Related Issue Exists?}
    G -->|Yes, similarity > 0.75| H[Link to Existing Issue]
    G -->|No| I[create_civic_issue<br/>+ Generate Embedding]

    B --> J{Employment Related?}
    J -->|Yes| K[find_job_opportunities<br/>Semantic Matching]
    K --> L[C-SPANN Job Index]
    L --> M[Ranked Job Results]
    M --> N[record_job_match]

    I --> O[add_timeline_event]
    H --> O
    N --> O

    O --> P[CockroachDB<br/>State Persisted]
    P --> Q[Response to Citizen]
```

---

## Cross-Session Memory Flow

```mermaid
sequenceDiagram
    participant U as Citizen
    participant A as Strands Agent
    participant DB as CockroachDB Cloud

    Note over U,DB: Session 1
    U->>A: "No tech jobs for graduates"
    A->>DB: search_civic_memory (vector)
    DB-->>A: No matches
    A->>DB: create_civic_issue + embedding
    A->>DB: find_job_opportunities (vector)
    DB-->>A: 6 jobs matched
    A->>DB: record_job_match × 6
    A->>DB: add_timeline_event
    A-->>U: Issue created + jobs found

    Note over U,DB: NEW SESSION (next day)
    U->>A: "Continue where we left off"
    A->>DB: get_issue_context
    DB-->>A: Issue + timeline + reports + jobs
    A->>DB: get_issue_timeline
    DB-->>A: Full accountability history
    A-->>U: "Here's your issue status..."

    Note over DB: All state persists in CockroachDB
```

---

## Data Model

```mermaid
erDiagram
    USERS ||--o{ REPORTS : submits
    USERS ||--o{ JOB_MATCHES : receives
    ISSUES ||--o{ REPORTS : consolidates
    ISSUES ||--o{ EVIDENCE : supported_by
    ISSUES ||--o{ ISSUE_TIMELINE : tracked_by
    ISSUES ||--o{ ACTIONS : addresses
    ISSUES ||--o{ RESPONSES : receives
    ISSUES ||--o{ JOB_MATCHES : resolves
    JOB_OPPORTUNITIES ||--o{ JOB_MATCHES : matched_to
    CONVERSATIONS ||--o{ MESSAGES : contains

    ISSUES {
        uuid id PK
        string title
        string description
        string category
        string status
        float confidence
        vector_1024 embedding
    }

    JOB_OPPORTUNITIES {
        uuid id PK
        string title
        string company
        string apply_url
        string verification_status
        vector_1024 embedding
    }

    AGENT_ACTIONS {
        uuid id PK
        string tool_name
        string action
        int duration_ms
    }
```

---

## Deployment Architecture

```mermaid
flowchart LR
    subgraph INTERNET["Internet"]
        USER[User Browser]
    end

    subgraph VERCEL["Vercel Edge Network"]
        CDN[CDN / Static Assets]
        FN[Python Serverless Function<br/>FastAPI + Mangum]
    end

    subgraph AWS_REGION["AWS us-east-1"]
        BEDROCK[Amazon Bedrock<br/>Nova Pro + Titan]
    end

    subgraph CRDB_CLOUD["CockroachDB Cloud us-east-1"]
        CLUSTER[(cjpaws Cluster<br/>13 Tables + 5 Vector Indexes)]
    end

    USER --> CDN
    USER --> FN
    FN --> BEDROCK
    FN --> CLUSTER
```

---

## How to Open the draw.io File

1. Go to https://app.diagrams.net
2. Click **File → Open From → Device**
3. Select `docs/cjp-architecture.drawio`
4. The file contains 2 pages:
   - **Page 1**: Full system architecture with all components
   - **Page 2**: Agent data flow decision tree

Or view it directly on GitHub — `.drawio` files render as clickable diagrams.
