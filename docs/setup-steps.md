# CJP Setup Steps

Complete guide to get CJP running from scratch.

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.11+ | Backend runtime |
| Node.js | 18+ | Frontend tooling |
| npm | 9+ | Package manager |
| AWS CLI | 2.x | AWS credential config |
| Git | 2.x | Version control |

### Required Accounts

- **CockroachDB Cloud** — Free tier at https://cockroachlabs.cloud
- **AWS Account** — With Bedrock access (Nova Pro + Titan Embed V2)

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/cjp.git
cd cjp
```

---

## Step 2: CockroachDB Cloud Setup

### 2.1 Create a Cluster

1. Go to https://cockroachlabs.cloud
2. Click **Create Cluster**
3. Choose **Serverless** (free tier)
4. Cloud Provider: **AWS**
5. Region: **us-east-1** (or your preferred region)
6. Name: **cjp-cluster**
7. Click **Create**

### 2.2 Create a SQL User

1. In your cluster, go to **SQL Users**
2. Click **Add User**
3. Username: `cjpuser`
4. Generate or set a password
5. Save the password securely

### 2.3 Get Connection String

1. Click **Connect** on your cluster
2. Select **General connection string**
3. Copy the full URL — it looks like:
   ```
   postgresql://cjpuser:PASSWORD@cluster-name-12345.region.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full
   ```

### 2.4 Create the Database

Using the CockroachDB Cloud SQL shell or `ccloud` CLI:

```sql
CREATE DATABASE cjp;
```

---

## Step 3: AWS Configuration

### 3.1 Configure AWS CLI

```bash
aws configure
# Enter your Access Key ID
# Enter your Secret Access Key
# Region: us-east-1
# Output: json
```

### 3.2 Enable Bedrock Models

1. Go to AWS Console > Amazon Bedrock > Model Access
2. Enable:
   - **Amazon Nova Pro** (`amazon.nova-pro-v1:0`)
   - **Amazon Titan Text Embeddings V2** (`amazon.titan-embed-text-v2:0`)
3. Wait for access to be granted (usually instant)

### 3.3 Verify Access

```bash
aws bedrock list-foundation-models --query "modelSummaries[?modelId=='amazon.nova-pro-v1:0'].modelId" --output text
# Should output: amazon.nova-pro-v1:0
```

---

## Step 4: Backend Setup

### 4.1 Create Virtual Environment

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 4.2 Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4.3 Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# CockroachDB Cloud - use your connection string, change database to 'cjp'
COCKROACHDB_URL=postgresql://cjpuser:PASSWORD@cluster-12345.region.cockroachlabs.cloud:26257/cjp?sslmode=require

# AWS
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=amazon.nova-pro-v1:0

# Embeddings
EMBEDDING_MODEL_ID=amazon.titan-embed-text-v2:0
EMBEDDING_DIMENSIONS=1024
```

### 4.4 Run Database Migrations

```bash
python -c "
from src.db.connection import init_db
init_db()
print('Migrations complete!')
"
```

### 4.5 Create Vector Indexes

```bash
python -c "
from src.db.connection import get_db

tables = ['issues', 'reports', 'evidence', 'responses', 'job_opportunities']
with get_db() as conn:
    cur = conn.cursor()
    for table in tables:
        cur.execute(f'''
            CREATE INDEX IF NOT EXISTS idx_{table}_embedding 
            ON {table} USING hnsw (embedding vector_cosine_ops)
        ''')
        print(f'  Vector index on {table}: OK')
    cur.close()
print('Vector indexes created!')
"
```

### 4.6 Seed Demo Data

```bash
python seed.py
```

This creates:
- 1 demo user (username: `demo`, password: `demo123`)
- 8 verified job opportunities with vector embeddings

### 4.7 Start Backend Server

```bash
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000
```

Verify: http://localhost:8000/api/health should return `{"status": "healthy", "database": "connected"}`

---

## Step 5: Frontend Setup

### 5.1 Install Dependencies

```bash
cd ../frontend
npm install
```

### 5.2 Start Development Server

```bash
npm run dev
```

The frontend will be available at http://localhost:5173

---

## Step 6: Verify Everything Works

### Health Check

```bash
curl http://localhost:8000/api/health
# {"status":"healthy","database":"connected"}
```

### Dashboard Stats

```bash
curl http://localhost:8000/api/dashboard/stats
# Should show total_jobs: 8
```

### Test Agent

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, what can you help with?"}'
```

### Open Frontend

Navigate to http://localhost:5173 — you should see the CJP Dashboard with live data.

---

## Optional: ccloud CLI Setup

```bash
# Install ccloud
# macOS
brew install cockroachdb/tap/ccloud

# Login
ccloud auth login

# Verify cluster
ccloud cluster list
```

---

## Common Issues

| Issue | Fix |
|-------|-----|
| `sslrootcert does not exist` | Change `sslmode=verify-full` to `sslmode=require` in .env |
| `connection refused port 26257` | Check COCKROACHDB_URL is correct |
| `ModuleNotFoundError` | Ensure virtual environment is activated |
| `Bedrock access denied` | Enable model access in AWS Console |
| `numpy build fails` | Use `numpy>=1.26.0` (prebuilt wheel) |
| `bcrypt version error` | Use `import bcrypt` directly instead of passlib |

---

## Production Deployment

For production, consider:
1. Use `sslmode=verify-full` with proper CA certificates
2. Set strong `APP_SECRET_KEY`
3. Use AWS IAM roles instead of access keys
4. Run `npm run build` for production frontend
5. Deploy behind a reverse proxy (nginx/CloudFront)
6. Enable CloudWatch logging
