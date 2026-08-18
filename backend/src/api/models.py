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


class CareerSearchRequest(BaseModel):
    """AWS Career Agent search request."""
    query: str = Field(..., min_length=1, max_length=1000)
    skills: Optional[List[str]] = None
    location: Optional[str] = None
    experience_level: Optional[str] = None
    limit: int = Field(default=10, ge=1, le=50)


class CareerSearchJobResult(BaseModel):
    """A single job result with skill analysis."""
    id: str
    title: str
    company: str
    description: str
    location: Optional[str] = None
    work_type: Optional[str] = None
    employment_type: Optional[str] = None
    experience_level: Optional[str] = None
    salary_range: Optional[str] = None
    apply_url: Optional[str] = None
    source: Optional[str] = None
    source_url: Optional[str] = None
    posted_at: Optional[str] = None
    similarity_score: float
    required_skills: List[str] = []
    matching_skills: List[str] = []
    missing_skills: List[str] = []
    match_percentage: float


class CareerSearchResponse(BaseModel):
    """AWS Career Agent search response."""
    success: bool
    query: str
    user_skills: List[str] = []
    extracted_skills: List[str] = []
    jobs: List[CareerSearchJobResult] = []
    total_found: int = 0
    duration_ms: int = 0
    steps: List[Dict[str, Any]] = []


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
