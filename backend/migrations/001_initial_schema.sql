-- CJP: Civic Journey Platform - Initial Schema
-- CockroachDB with Vector Indexing support

-- Enable vector extension (CockroachDB supports pgvector-compatible vectors)
-- Vectors are stored as FLOAT arrays with vector indexing

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email STRING NOT NULL UNIQUE,
    username STRING NOT NULL UNIQUE,
    password_hash STRING NOT NULL,
    full_name STRING,
    location STRING,
    skills STRING[],
    experience_level STRING,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Issues table - consolidated civic issues
CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title STRING NOT NULL,
    description STRING NOT NULL,
    category STRING NOT NULL,
    location STRING,
    status STRING NOT NULL DEFAULT 'open',
    priority STRING NOT NULL DEFAULT 'medium',
    confidence FLOAT NOT NULL DEFAULT 0.5,
    report_count INT NOT NULL DEFAULT 1,
    embedding VECTOR(1024),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    INDEX idx_issues_category (category),
    INDEX idx_issues_status (status),
    INDEX idx_issues_location (location)
);

-- Reports table - individual citizen reports
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    issue_id UUID REFERENCES issues(id),
    content STRING NOT NULL,
    embedding VECTOR(1024),
    source STRING NOT NULL DEFAULT 'web',
    verification_status STRING NOT NULL DEFAULT 'unverified',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    INDEX idx_reports_user (user_id),
    INDEX idx_reports_issue (issue_id),
    INDEX idx_reports_status (verification_status)
);

-- Evidence table - supporting evidence for issues
CREATE TABLE IF NOT EXISTS evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id),
    description STRING NOT NULL,
    source STRING NOT NULL,
    source_url STRING,
    evidence_type STRING NOT NULL DEFAULT 'report',
    verification_status STRING NOT NULL DEFAULT 'unverified',
    embedding VECTOR(1024),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    INDEX idx_evidence_issue (issue_id),
    INDEX idx_evidence_type (evidence_type)
);

-- Issue-Reports junction (many-to-many)
CREATE TABLE IF NOT EXISTS issue_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id),
    report_id UUID NOT NULL REFERENCES reports(id),
    relevance_score FLOAT NOT NULL DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (issue_id, report_id)
);

-- Issue Timeline - accountability tracking
CREATE TABLE IF NOT EXISTS issue_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id),
    event_type STRING NOT NULL,
    description STRING NOT NULL,
    actor STRING,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    INDEX idx_timeline_issue (issue_id),
    INDEX idx_timeline_type (event_type)
);

-- Actions table - things done about issues
CREATE TABLE IF NOT EXISTS actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id),
    action_type STRING NOT NULL,
    description STRING NOT NULL,
    status STRING NOT NULL DEFAULT 'pending',
    assigned_to STRING,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    INDEX idx_actions_issue (issue_id),
    INDEX idx_actions_status (status)
);

-- Responses table - official/community responses to issues
CREATE TABLE IF NOT EXISTS responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id),
    source STRING NOT NULL,
    content STRING NOT NULL,
    response_type STRING NOT NULL DEFAULT 'community',
    verification_status STRING NOT NULL DEFAULT 'unverified',
    embedding VECTOR(1024),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    INDEX idx_responses_issue (issue_id),
    INDEX idx_responses_type (response_type)
);

-- Agent Actions - audit log of what the AI agent does
CREATE TABLE IF NOT EXISTS agent_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID,
    issue_id UUID REFERENCES issues(id),
    tool_name STRING NOT NULL,
    action STRING NOT NULL,
    input_params JSONB,
    result JSONB,
    status STRING NOT NULL DEFAULT 'completed',
    duration_ms INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    INDEX idx_agent_actions_conversation (conversation_id),
    INDEX idx_agent_actions_issue (issue_id),
    INDEX idx_agent_actions_tool (tool_name)
);

-- Conversations table - chat sessions
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title STRING,
    context JSONB,
    issue_id UUID REFERENCES issues(id),
    status STRING NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    INDEX idx_conversations_user (user_id),
    INDEX idx_conversations_issue (issue_id)
);

-- Messages table - individual messages in conversations
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    role STRING NOT NULL,
    content STRING NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    INDEX idx_messages_conversation (conversation_id)
);

-- Job Opportunities table
CREATE TABLE IF NOT EXISTS job_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title STRING NOT NULL,
    company STRING NOT NULL,
    description STRING NOT NULL,
    location STRING,
    work_type STRING NOT NULL DEFAULT 'onsite',
    employment_type STRING NOT NULL DEFAULT 'full-time',
    skills STRING[],
    experience_level STRING,
    salary_range STRING,
    source STRING NOT NULL,
    source_url STRING NOT NULL,
    apply_url STRING NOT NULL,
    posted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    verification_status STRING NOT NULL DEFAULT 'verified',
    embedding VECTOR(1024),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    INDEX idx_jobs_location (location),
    INDEX idx_jobs_work_type (work_type),
    INDEX idx_jobs_experience (experience_level),
    INDEX idx_jobs_status (verification_status)
);

-- Job Matches table - connecting users/issues to opportunities
CREATE TABLE IF NOT EXISTS job_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    issue_id UUID REFERENCES issues(id),
    job_id UUID NOT NULL REFERENCES job_opportunities(id),
    match_score FLOAT NOT NULL,
    match_reason STRING NOT NULL,
    status STRING NOT NULL DEFAULT 'suggested',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    INDEX idx_matches_user (user_id),
    INDEX idx_matches_issue (issue_id),
    INDEX idx_matches_job (job_id),
    INDEX idx_matches_score (match_score DESC)
);
