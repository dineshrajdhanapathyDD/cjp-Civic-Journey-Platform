"""API request/response models."""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# --- Request Models ---

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)
    conversation_id: Optional[str] = None
    user_id: Optional[str] = None


class CreateUserRequest(BaseModel):
    email: str
    username: str
    password: str
    full_name: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[List[str]] = None
    experience_level: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class CreateReportRequest(BaseModel):
    content: str = Field(..., min_length=10, max_length=10000)
    source: str = "web"
    user_id: Optional[str] = None


class CreateJobRequest(BaseModel):
    title: str
    company: str
    description: str
    location: Optional[str] = None
    work_type: str = "onsite"
    employment_type: str = "full-time"
    skills: Optional[List[str]] = None
    experience_level: Optional[str] = None
    salary_range: Optional[str] = None
    source: str
    source_url: str
    apply_url: str
    posted_at: Optional[str] = None
    expires_at: Optional[str] = None


# --- Response Models ---

class ChatResponse(BaseModel):
    response: str
    conversation_id: Optional[str] = None
    agent_actions: List[Dict[str, Any]] = []
    duration_ms: int = 0


class IssueResponse(BaseModel):
    id: str
    title: str
    description: str
    category: str
    location: Optional[str] = None
    status: str
    priority: str
    confidence: float
    report_count: int
    created_at: str
    updated_at: str


class AgentActionResponse(BaseModel):
    id: str
    conversation_id: Optional[str] = None
    issue_id: Optional[str] = None
    tool_name: str
    action: str
    status: str
    duration_ms: Optional[int] = None
    created_at: str


class TimelineEventResponse(BaseModel):
    id: str
    issue_id: str
    event_type: str
    description: str
    actor: Optional[str] = None
    created_at: str
