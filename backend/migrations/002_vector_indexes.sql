-- CJP: Distributed Vector Indexing
-- CockroachDB vector indexes for semantic search

-- Vector index on issues for semantic issue matching
CREATE INDEX idx_issues_embedding ON issues
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Vector index on reports for finding similar citizen reports
CREATE INDEX idx_reports_embedding ON reports
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Vector index on evidence for semantic evidence retrieval
CREATE INDEX idx_evidence_embedding ON evidence
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Vector index on responses for finding related responses
CREATE INDEX idx_responses_embedding ON responses
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Vector index on job opportunities for semantic job matching
CREATE INDEX idx_jobs_embedding ON job_opportunities
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
