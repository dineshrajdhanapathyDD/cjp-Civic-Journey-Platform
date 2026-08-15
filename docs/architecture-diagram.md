# CJP Architecture Diagram

## System Architecture (Draw.io Compatible)

The following diagram can be imported directly into [draw.io](https://app.diagrams.net/) using the XML below, or viewed as Mermaid diagrams.

### High-Level Architecture

```mermaid
flowchart TB
    subgraph USER_LAYER["User Layer"]
        USER[("Citizen / User")]
        BROWSER["Web Browser"]
    end

    subgraph FRONTEND["Frontend - React + TypeScript"]
        DASHBOARD["Dashboard"]
        AGENT_UI["Civic Agent Chat"]
        ISSUES_UI["Issues Explorer"]
        JOBS_UI["Jobs Browser"]
        ACTIVITY_UI["Agent Activity Monitor"]
    end

    subgraph BACKEND["Backend - Python FastAPI"]
        API["REST API Gateway<br/>FastAPI"]
        STRANDS["Strands Agent<br/>Orchestration Layer"]
        TOOLS["Agent Tools<br/>11 Civic Skills"]
        EMBED["Embedding Service<br/>Titan V2 - 1024dim"]
    end

    subgraph AWS["Amazon Web Services"]
        BEDROCK_LLM["Amazon Bedrock<br/>Nova Pro v1"]
        BEDROCK_EMB["Amazon Bedrock<br/>Titan Embed V2"]
        S3["Amazon S3<br/>Evidence Storage"]
        CW["CloudWatch<br/>Monitoring"]
    end

    subgraph COCKROACHDB["CockroachDB Cloud"]
        MCP_SERVER["CockroachDB Cloud<br/>MCP Server"]
        CRDB[("CockroachDB<br/>Distributed Database")]
        VECTOR_IDX["C-SPANN Vector Indexes<br/>Distributed ANN Search"]
        SKILLS["CockroachDB<br/>Agent Skills"]
    end

    subgraph CCLOUD["Operations"]
        CLI["ccloud CLI<br/>Environment Management"]
    end

    USER --> BROWSER
    BROWSER --> FRONTEND
    FRONTEND --> API

    API --> STRANDS
    STRANDS --> BEDROCK_LLM
    STRANDS --> TOOLS
    TOOLS --> EMBED
    EMBED --> BEDROCK_EMB
    TOOLS --> MCP_SERVER
    TOOLS --> SKILLS

    MCP_SERVER --> CRDB
    SKILLS --> CRDB
    CRDB --> VECTOR_IDX

    STRANDS --> S3
    API --> CW
    CLI -.-> CRDB
```

### Data Flow Architecture

```mermaid
flowchart LR
    subgraph INPUT["Citizen Input"]
        REPORT["Civic Report"]
        QUERY["Question / Follow-up"]
        JOB_REQ["Job Search Request"]
    end

    subgraph AGENT["Strands Agent Processing"]
        REASON["Reasoning<br/>Nova Pro"]
        TOOL_SELECT["Dynamic Tool Selection"]
    end

    subgraph TOOLS["Agent Tools"]
        T1["search_civic_memory"]
        T2["find_related_issues"]
        T3["create_civic_issue"]
        T4["update_issue"]
        T5["get_issue_context"]
        T6["record_evidence"]
        T7["record_action"]
        T8["find_job_opportunities"]
        T9["record_job_match"]
        T10["get_issue_timeline"]
        T11["add_timeline_event"]
    end

    subgraph DB["CockroachDB Cloud"]
        ISSUES[("Issues")]
        REPORTS[("Reports")]
        EVIDENCE[("Evidence")]
        TIMELINE[("Timeline")]
        JOBS[("Job Opportunities")]
        MATCHES[("Job Matches")]
        VECTORS[/"Vector Indexes"/]
    end

    INPUT --> AGENT
    REASON --> TOOL_SELECT
    TOOL_SELECT --> TOOLS

    T1 --> VECTORS
    T2 --> VECTORS
    T3 --> ISSUES
    T4 --> ISSUES
    T5 --> ISSUES
    T6 --> EVIDENCE
    T7 --> TIMELINE
    T8 --> VECTORS
    T9 --> MATCHES
    T10 --> TIMELINE
    T11 --> TIMELINE

    VECTORS --> ISSUES
    VECTORS --> REPORTS
    VECTORS --> JOBS
```

### MCP Integration Architecture

```mermaid
sequenceDiagram
    participant U as Citizen
    participant A as Strands Agent
    participant M as MCP Client
    participant S as CockroachDB MCP Server
    participant D as CockroachDB Cloud
    participant V as Vector Index

    U->>A: "There aren't enough tech jobs for graduates"
    A->>A: Reasoning (Nova Pro)
    A->>M: search_civic_memory(query)
    M->>S: run_sql (vector search)
    S->>D: SELECT ... embedding <=> query
    D->>V: C-SPANN ANN Search
    V-->>D: Top-K results
    D-->>S: Related issues + reports
    S-->>M: MCP response
    M-->>A: Context retrieved

    A->>A: Decision: Create new issue
    A->>M: create_civic_issue(...)
    M->>S: INSERT INTO issues (...)
    S->>D: Write with embedding
    D-->>S: Created
    S-->>M: Confirmed
    M-->>A: Issue created

    A->>M: find_job_opportunities(skills)
    M->>S: run_sql (vector search jobs)
    S->>D: SELECT ... FROM job_opportunities
    D->>V: Semantic job matching
    V-->>D: Ranked results
    D-->>S: Job listings
    S-->>M: Jobs found
    M-->>A: 6 opportunities matched

    A-->>U: Issue created + jobs recommended
```

### Database Schema Diagram

```mermaid
erDiagram
    USERS ||--o{ REPORTS : submits
    USERS ||--o{ CONVERSATIONS : participates
    USERS ||--o{ JOB_MATCHES : receives

    ISSUES ||--o{ REPORTS : contains
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
        string priority
        float confidence
        vector embedding
    }

    REPORTS {
        uuid id PK
        uuid user_id FK
        uuid issue_id FK
        string content
        vector embedding
    }

    JOB_OPPORTUNITIES {
        uuid id PK
        string title
        string company
        string description
        string apply_url
        vector embedding
    }

    ISSUE_TIMELINE {
        uuid id PK
        uuid issue_id FK
        string event_type
        string description
        string actor
    }

    AGENT_ACTIONS {
        uuid id PK
        uuid conversation_id
        string tool_name
        string action
        string status
        int duration_ms
    }
```

---

## Draw.io XML Export

To import into draw.io, use **File > Import from > Text** and paste this XML:

```xml
<mxfile>
  <diagram name="CJP Architecture">
    <mxGraphModel>
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <!-- User -->
        <mxCell id="2" value="Citizen" style="shape=actor;whiteSpace=wrap;" vertex="1" parent="1">
          <mxGeometry x="380" y="20" width="40" height="60" as="geometry"/>
        </mxCell>
        <!-- Frontend -->
        <mxCell id="3" value="CJP Web App&#xa;React + TypeScript + Tailwind" style="rounded=1;whiteSpace=wrap;fillColor=#dae8fc;" vertex="1" parent="1">
          <mxGeometry x="300" y="120" width="200" height="50" as="geometry"/>
        </mxCell>
        <!-- API -->
        <mxCell id="4" value="FastAPI Gateway" style="rounded=1;whiteSpace=wrap;fillColor=#d5e8d4;" vertex="1" parent="1">
          <mxGeometry x="300" y="210" width="200" height="40" as="geometry"/>
        </mxCell>
        <!-- Agent -->
        <mxCell id="5" value="Strands Agent&#xa;Amazon Bedrock Nova Pro" style="rounded=1;whiteSpace=wrap;fillColor=#e1d5e7;" vertex="1" parent="1">
          <mxGeometry x="300" y="290" width="200" height="50" as="geometry"/>
        </mxCell>
        <!-- MCP -->
        <mxCell id="6" value="CockroachDB Cloud&#xa;MCP Server" style="rounded=1;whiteSpace=wrap;fillColor=#fff2cc;" vertex="1" parent="1">
          <mxGeometry x="180" y="390" width="150" height="50" as="geometry"/>
        </mxCell>
        <!-- CockroachDB -->
        <mxCell id="7" value="CockroachDB Cloud&#xa;Persistent Civic Memory" style="shape=cylinder3;whiteSpace=wrap;fillColor=#f8cecc;" vertex="1" parent="1">
          <mxGeometry x="300" y="490" width="200" height="70" as="geometry"/>
        </mxCell>
        <!-- Vector -->
        <mxCell id="8" value="C-SPANN&#xa;Distributed Vector Indexes" style="rounded=1;whiteSpace=wrap;fillColor=#ffe6cc;" vertex="1" parent="1">
          <mxGeometry x="470" y="390" width="150" height="50" as="geometry"/>
        </mxCell>
        <!-- Agent Skills -->
        <mxCell id="9" value="CockroachDB&#xa;Agent Skills" style="rounded=1;whiteSpace=wrap;fillColor=#fff2cc;" vertex="1" parent="1">
          <mxGeometry x="550" y="290" width="120" height="50" as="geometry"/>
        </mxCell>
        <!-- ccloud -->
        <mxCell id="10" value="ccloud CLI" style="rounded=1;whiteSpace=wrap;fillColor=#f5f5f5;" vertex="1" parent="1">
          <mxGeometry x="80" y="490" width="100" height="40" as="geometry"/>
        </mxCell>
        <!-- Bedrock -->
        <mxCell id="11" value="Amazon Bedrock&#xa;Titan Embed V2" style="rounded=1;whiteSpace=wrap;fillColor=#dae8fc;" vertex="1" parent="1">
          <mxGeometry x="80" y="290" width="140" height="50" as="geometry"/>
        </mxCell>
        <!-- Edges -->
        <mxCell id="e1" edge="1" source="2" target="3" parent="1"/>
        <mxCell id="e2" edge="1" source="3" target="4" parent="1"/>
        <mxCell id="e3" edge="1" source="4" target="5" parent="1"/>
        <mxCell id="e4" edge="1" source="5" target="6" parent="1"/>
        <mxCell id="e5" edge="1" source="5" target="8" parent="1"/>
        <mxCell id="e6" edge="1" source="5" target="9" parent="1"/>
        <mxCell id="e7" edge="1" source="6" target="7" parent="1"/>
        <mxCell id="e8" edge="1" source="8" target="7" parent="1"/>
        <mxCell id="e9" edge="1" source="9" target="7" parent="1"/>
        <mxCell id="e10" edge="1" source="5" target="11" parent="1"/>
        <mxCell id="e11" edge="1" source="10" target="7" style="dashed=1;" parent="1"/>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

---

## Technology Summary

| Component | Technology | Role |
|-----------|-----------|------|
| Frontend | React 18 + TypeScript + Tailwind CSS | User interface |
| Backend | Python 3.11 + FastAPI | API server |
| Agent | Strands Agents SDK 0.1.5 | Orchestration |
| LLM | Amazon Bedrock Nova Pro v1 | Reasoning |
| Embeddings | Amazon Bedrock Titan Embed V2 | 1024-dim vectors |
| Database | CockroachDB Cloud v26.2 | Persistent memory |
| Vector Index | C-SPANN (distributed ANN) | Semantic search |
| MCP | CockroachDB Cloud MCP Server | Agent-DB bridge |
| Skills | CockroachDB Agent Skills | Reusable DB ops |
| CLI | ccloud CLI | Cluster management |
