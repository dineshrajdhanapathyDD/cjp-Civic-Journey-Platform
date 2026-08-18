/**
 * CJP API client service.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || 'Request failed');
  }
  return res.json();
}

// Chat
export async function sendMessage(message: string, conversationId?: string, userId?: string) {
  return request<{
    response: string;
    conversation_id: string;
    agent_actions: any[];
    duration_ms: number;
  }>('/chat', {
    method: 'POST',
    body: JSON.stringify({ message, conversation_id: conversationId, user_id: userId }),
  });
}

export async function getConversations(userId?: string) {
  const params = userId ? `?user_id=${userId}` : '';
  return request<{ conversations: any[] }>(`/conversations${params}`);
}

export async function getMessages(conversationId: string) {
  return request<{ messages: any[] }>(`/conversations/${conversationId}/messages`);
}

// Issues
export async function getIssues(status?: string, category?: string) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (category) params.set('category', category);
  const query = params.toString() ? `?${params}` : '';
  return request<{ issues: any[]; total: number }>(`/issues${query}`);
}

export async function getIssue(issueId: string) {
  return request<{ issue: any; counts: any }>(`/issues/${issueId}`);
}

export async function getIssueTimeline(issueId: string) {
  return request<{ timeline: any[] }>(`/issues/${issueId}/timeline`);
}

export async function getIssueReports(issueId: string) {
  return request<{ reports: any[] }>(`/issues/${issueId}/reports`);
}

export async function getIssueEvidence(issueId: string) {
  return request<{ evidence: any[] }>(`/issues/${issueId}/evidence`);
}

export async function getIssueActions(issueId: string) {
  return request<{ actions: any[] }>(`/issues/${issueId}/actions`);
}

export async function getIssueJobs(issueId: string) {
  return request<{ job_matches: any[] }>(`/issues/${issueId}/jobs`);
}

// Jobs
export async function getJobs(filters?: { location?: string; work_type?: string; experience_level?: string }) {
  const params = new URLSearchParams();
  if (filters?.location) params.set('location', filters.location);
  if (filters?.work_type) params.set('work_type', filters.work_type);
  if (filters?.experience_level) params.set('experience_level', filters.experience_level);
  const query = params.toString() ? `?${params}` : '';
  return request<{ jobs: any[]; total: number }>(`/jobs${query}`);
}

// AWS Career Agent
export interface CareerSearchResult {
  success: boolean;
  query: string;
  user_skills: string[];
  extracted_skills: string[];
  jobs: CareerJobResult[];
  total_found: number;
  duration_ms: number;
  steps: { step: string; tool: string; status: string; result?: string }[];
}

export interface CareerJobResult {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string | null;
  work_type: string | null;
  employment_type: string | null;
  experience_level: string | null;
  salary_range: string | null;
  apply_url: string | null;
  source: string | null;
  source_url: string | null;
  posted_at: string | null;
  similarity_score: number;
  required_skills: string[];
  matching_skills: string[];
  missing_skills: string[];
  match_percentage: number;
}

export async function careerSearch(
  query: string,
  skills?: string[],
  location?: string,
  experienceLevel?: string,
  limit?: number,
): Promise<CareerSearchResult> {
  return request<CareerSearchResult>('/career/search', {
    method: 'POST',
    body: JSON.stringify({
      query,
      skills: skills?.length ? skills : undefined,
      location: location || undefined,
      experience_level: experienceLevel || undefined,
      limit: limit || 10,
    }),
  });
}

// Reports
export async function submitReport(content: string, userId?: string) {
  return request<{ success: boolean; report_id: string; message: string }>('/reports', {
    method: 'POST',
    body: JSON.stringify({ content, source: 'web', user_id: userId }),
  });
}

// Agent Activity
export async function getAgentActions(conversationId?: string) {
  const params = conversationId ? `?conversation_id=${conversationId}` : '';
  return request<{ agent_actions: any[] }>(`/agent/actions${params}`);
}

// Dashboard
export async function getDashboardStats() {
  return request<any>('/dashboard/stats');
}

// Auth
export async function login(username: string, password: string) {
  return request<{ success: boolean; user: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function register(data: {
  email: string; username: string; password: string;
  full_name?: string; location?: string; skills?: string[];
}) {
  return request<{ success: boolean; user: any }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Health
export async function healthCheck() {
  return request<{ status: string; database: string }>('/health');
}
