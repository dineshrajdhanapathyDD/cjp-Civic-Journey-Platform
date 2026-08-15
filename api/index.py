"""Vercel Serverless Function - CJP Backend API.

This file serves the entire FastAPI application as a Vercel serverless function.
All /api/* routes are handled here.
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from src.main import app

# Vercel expects a handler - FastAPI app is ASGI compatible
# The mangum adapter converts ASGI to AWS Lambda/Vercel handler format
try:
    from mangum import Mangum
    handler = Mangum(app, lifespan="off")
except ImportError:
    # Fallback: Vercel's Python runtime can handle ASGI directly
    # Export the app for Vercel's built-in ASGI support
    app = app
