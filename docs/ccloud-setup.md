# CockroachDB Cloud Setup (ccloud CLI)

## Overview

CJP uses the `ccloud` CLI for CockroachDB Cloud environment lifecycle management. This document covers the complete setup process.

Official documentation: https://www.cockroachlabs.com/docs/cockroachcloud/ccloud-get-started

## Installation

```bash
# macOS
brew install cockroachdb/tap/ccloud

# Linux
curl -sSL https://binaries.cockroachdb.com/ccloud/ccloud_linux-amd64_latest -o ccloud
chmod +x ccloud
sudo mv ccloud /usr/local/bin/

# Windows
# Download from https://www.cockroachlabs.com/docs/cockroachcloud/ccloud-get-started
```

## Authentication

```bash
# Login to CockroachDB Cloud
ccloud auth login

# Verify authentication
ccloud auth whoami
```

## Cluster Setup

### Create Cluster

```bash
# Create a Serverless cluster for CJP
ccloud cluster create cjp-cluster \
  --cloud-provider aws \
  --region us-east-1 \
  --plan serverless
```

### Verify Cluster

```bash
# List clusters
ccloud cluster list

# Get cluster details
ccloud cluster info cjp-cluster
```

## Database Setup

### Create Database

```bash
# Create the CJP database
ccloud cluster sql cjp-cluster --execute "CREATE DATABASE cjp;"
```

### Apply Schema

```bash
# Apply initial schema migration
ccloud cluster sql cjp-cluster --database cjp < backend/migrations/001_initial_schema.sql

# Apply vector indexes
ccloud cluster sql cjp-cluster --database cjp < backend/migrations/002_vector_indexes.sql
```

### Verify Schema

```bash
# List tables
ccloud cluster sql cjp-cluster --execute "
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_catalog = 'cjp';"

# Check vector indexes
ccloud cluster sql cjp-cluster --execute "
  SELECT indexname, indexdef FROM pg_indexes 
  WHERE tablename IN ('issues', 'reports', 'job_opportunities')
  AND indexdef LIKE '%hnsw%';"
```

## Connection Details

### Get Connection String

```bash
# Get connection URL for the application
ccloud cluster sql cjp-cluster --connection-url

# Output format:
# postgresql://username:password@host:26257/cjp?sslmode=verify-full&sslrootcert=...
```

### Configure Application

```bash
# Set in backend/.env
COCKROACHDB_URL=<connection-url-from-above>
COCKROACHDB_CLUSTER_ID=<cluster-id>
```

## API Key for MCP Server

```bash
# Create an API key for the MCP server
ccloud auth api-key create --description "CJP MCP Server"

# Store the key securely (do NOT commit)
# Set in backend/.env as COCKROACHDB_MCP_API_KEY
```

## Operational Commands

### Monitor

```bash
# Check cluster status
ccloud cluster info cjp-cluster

# View recent SQL activity (if available)
ccloud cluster sql cjp-cluster --execute "
  SELECT count(*) as total_issues FROM issues;
  SELECT count(*) as total_reports FROM reports;
  SELECT count(*) as total_jobs FROM job_opportunities;"
```

### Backup

```bash
# CockroachDB Cloud handles automated backups
# Manual verification:
ccloud cluster info cjp-cluster --json | jq '.backup_schedule'
```

## Summary of ccloud Usage in CJP

| Operation | Command | Purpose |
|-----------|---------|---------|
| Authentication | `ccloud auth login` | Access CockroachDB Cloud |
| Cluster creation | `ccloud cluster create` | Provision infrastructure |
| Schema deployment | `ccloud cluster sql < migration.sql` | Deploy schema |
| Connection config | `ccloud cluster sql --connection-url` | Get app connection |
| API key creation | `ccloud auth api-key create` | MCP server auth |
| Verification | `ccloud cluster sql --execute` | Confirm state |
| Monitoring | `ccloud cluster info` | Operational status |

## Security Notes

- Never commit API keys or connection strings
- Use environment variables for all credentials
- Rotate API keys periodically
- The `.env` file is in `.gitignore`
- CockroachDB Cloud encrypts data at rest and in transit
