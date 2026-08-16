"""Vercel Serverless Function - CJP Backend API.

Vercel's Python runtime executes this as a serverless function.
We import the FastAPI app from the backend package.
"""

import sys
import os

# Fix path - add backend directory to Python path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
sys.path.insert(0, backend_dir)

# Force environment variable loading
from dotenv import load_dotenv
env_path = os.path.join(backend_dir, ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

# Create a minimal app for health check in case full app fails
app = FastAPI(title="CJP - Civic Journey Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    # Import the full app routes
    from src.api.routes import router
    from src.api.memory import memory_router
    app.include_router(router)
    app.include_router(memory_router)
except Exception as e:
    # If full import fails, provide a diagnostic endpoint
    @app.get("/api/health")
    async def health():
        return {"status": "partial", "error": str(e), "note": "Backend module import failed"}

    @app.get("/api/diagnostic")
    async def diagnostic():
        return {
            "backend_dir": backend_dir,
            "sys_path": sys.path[:5],
            "env_vars": {
                "COCKROACHDB_URL": "set" if os.environ.get("COCKROACHDB_URL") else "missing",
                "AWS_REGION": os.environ.get("AWS_REGION", "missing"),
                "BEDROCK_MODEL_ID": os.environ.get("BEDROCK_MODEL_ID", "missing"),
            },
            "error": str(e),
        }

# Mangum wraps ASGI app for serverless
handler = Mangum(app, lifespan="off")
