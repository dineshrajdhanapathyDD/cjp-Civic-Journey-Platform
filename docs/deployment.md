# CJP Deployment Guide

## Deployment Options

| Option | Frontend | Backend | Best For |
|--------|----------|---------|----------|
| **Option A** | Vercel | Vercel Python Functions | Simple, single platform |
| **Option B** | Vercel | Railway/Render | Long-running agent calls (recommended) |
| **Option C** | Vercel | AWS Lambda + API Gateway | Production scale |

---

## Option A: Full Vercel Deployment

### Prerequisites
- Vercel account (https://vercel.com)
- Vercel CLI installed: `npm i -g vercel`

### Steps

#### 1. Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/cjp.git
git branch -M main
git push -u origin main
```

#### 2. Import to Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Vercel auto-detects the `vercel.json` configuration

#### 3. Set Environment Variables

In Vercel Dashboard > Project Settings > Environment Variables, add:

| Variable | Value |
|----------|-------|
| `COCKROACHDB_URL` | `postgresql://user:pass@cluster.cockroachlabs.cloud:26257/cjp?sslmode=require` |
| `AWS_REGION` | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | Your AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key |
| `BEDROCK_MODEL_ID` | `amazon.nova-pro-v1:0` |
| `EMBEDDING_MODEL_ID` | `amazon.titan-embed-text-v2:0` |
| `EMBEDDING_DIMENSIONS` | `1024` |
| `APP_SECRET_KEY` | A strong random string |

#### 4. Deploy
```bash
vercel --prod
```

#### Limitations
- Vercel serverless functions have a **60-second timeout** (agent calls may take 30-50s)
- Cold starts add 2-5 seconds
- No persistent server state (but CockroachDB handles all persistence)

---

## Option B: Vercel + Railway (Recommended for Hackathon)

### Frontend on Vercel

#### 1. Create `frontend/vercel.json`

Already handled by root `vercel.json`. Alternatively deploy just the frontend:

```bash
cd frontend
vercel --prod
```

Set environment variable:
- `VITE_API_URL` = your Railway backend URL (e.g., `https://cjp-backend.up.railway.app/api`)

### Backend on Railway

#### 1. Create `Procfile` in backend/

```
web: uvicorn src.main:app --host 0.0.0.0 --port $PORT
```

#### 2. Deploy to Railway
1. Go to https://railway.app
2. New Project > Deploy from GitHub
3. Select the `backend/` directory
4. Set environment variables (same as above)
5. Railway auto-detects Python and uses `requirements.txt`

#### 3. Update Frontend API URL
In Vercel, set `VITE_API_URL` to the Railway backend URL.

---

## Option C: Vercel + AWS Lambda

For production-grade deployment:

### Frontend on Vercel
Same as Option B frontend.

### Backend on AWS Lambda

#### 1. Package with SAM/CDK

```yaml
# template.yaml (AWS SAM)
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  CJPFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: mangum_handler.handler
      Runtime: python3.11
      Timeout: 120
      MemorySize: 1024
      Environment:
        Variables:
          COCKROACHDB_URL: !Ref CockroachDBURL
      Events:
        Api:
          Type: Api
          Properties:
            Path: /{proxy+}
            Method: ANY
```

---

## Vercel-Specific Files Added

| File | Purpose |
|------|---------|
| `vercel.json` | Vercel build config, rewrites, and function settings |
| `api/index.py` | Serverless function entry point (wraps FastAPI) |
| `api/requirements.txt` | Python dependencies for the serverless function |

---

## Environment Variables Checklist

Before deploying, ensure these are set:

- [ ] `COCKROACHDB_URL` — Full connection string to CockroachDB Cloud
- [ ] `AWS_REGION` — AWS region (us-east-1)
- [ ] `AWS_ACCESS_KEY_ID` — AWS IAM access key
- [ ] `AWS_SECRET_ACCESS_KEY` — AWS IAM secret key
- [ ] `BEDROCK_MODEL_ID` — `amazon.nova-pro-v1:0`
- [ ] `EMBEDDING_MODEL_ID` — `amazon.titan-embed-text-v2:0`
- [ ] `EMBEDDING_DIMENSIONS` — `1024`
- [ ] `APP_SECRET_KEY` — Random secret for session/JWT
- [ ] `FRONTEND_URL` — Your Vercel deployment URL (for CORS)

---

## Post-Deployment Verification

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Dashboard stats
curl https://your-app.vercel.app/api/dashboard/stats

# Test chat
curl -X POST https://your-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 504 Gateway Timeout | Agent calls too slow — increase `maxDuration` in vercel.json or use Option B |
| CORS errors | Add Vercel URL to `FRONTEND_URL` env var |
| Module not found | Check `api/requirements.txt` has all deps |
| DB connection fails | Verify `COCKROACHDB_URL` is correct and uses `sslmode=require` |
| Cold start slow | First request takes 5-10s — normal for serverless |
