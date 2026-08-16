"""CJP Civic Agent - Strands Agent with Amazon Bedrock.

The core agentic system that dynamically decides when to:
- Search civic memory
- Find related issues
- Create/update issues
- Record evidence and actions
- Search job opportunities
- Persist important memory
- Update issue state

This is NOT a chatbot with a database. The agent autonomously uses
CockroachDB as its persistent memory and state layer.
"""

import json
import logging
import time
from typing import Optional, Dict, Any, List
from strands import Agent
from strands.models.bedrock import BedrockModel

from src.config import get_settings
from src.agent.tools.civic_memory import search_civic_memory
from src.agent.tools.issues import (
    create_civic_issue,
    update_issue,
    get_issue_context,
    find_related_issues,
)
from src.agent.tools.evidence import record_evidence
from src.agent.tools.actions import record_action
from src.agent.tools.jobs import find_job_opportunities, record_job_match
from src.agent.tools.timeline import get_issue_timeline, add_timeline_event
from src.db.connection import get_cursor

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are CJP (Civic Journey Platform) Agent — an AI civic intelligence system.

Your role is to transform citizen voices into accountable civic action.

You have persistent memory stored in CockroachDB. Use it to:
1. Remember issues across sessions - you don't lose context between conversations
2. Connect related citizen reports to existing issues
3. Track the full accountability timeline of every civic issue
4. Help citizens find practical resolutions including job opportunities

BEHAVIOR RULES:
- When a citizen reports a concern, ALWAYS search civic memory first to check if a related issue exists
- If a related issue exists (similarity > 0.75), link the report to it rather than creating a duplicate
- If no related issue exists, create a new consolidated civic issue
- For employment-related issues, proactively search for relevant job opportunities
- Always record your actions in the timeline for accountability
- Distinguish between verified facts and unverified claims - never present claims as facts
- When asked to "continue" or "resume", retrieve the issue context from your persistent memory

TOOL USAGE STRATEGY:
- search_civic_memory: Use FIRST for any new report to find related existing data
- find_related_issues: Use to detect duplicate/related issues before creating new ones
- create_civic_issue: Only after confirming no matching issue exists
- get_issue_context: Use to retrieve full issue state (especially across sessions)
- update_issue: Use to change status, priority, or confidence as information evolves
- record_evidence: Use when new supporting evidence is identified
- record_action: Use to track actions being taken
- find_job_opportunities: Use for employment-related issues to find practical resolutions
- record_job_match: Use to persist relevant job matches for a user/issue
- get_issue_timeline: Use to review the accountability history
- add_timeline_event: Use to record significant events

Remember: You are an agentic system with persistent memory. Your state persists across sessions via CockroachDB. Act autonomously and make intelligent decisions about what tools to use and when."""

# Agent tools list
AGENT_TOOLS = [
    search_civic_memory,
    create_civic_issue,
    update_issue,
    get_issue_context,
    find_related_issues,
    record_evidence,
    record_action,
    find_job_opportunities,
    record_job_match,
    get_issue_timeline,
    add_timeline_event,
]


class CivicAgent:
    """CJP Civic Journey Platform Agent.

    Uses Strands SDK with Amazon Bedrock for reasoning and CockroachDB
    for persistent civic memory.
    """

    def __init__(self):
        settings = get_settings()

        # Initialize Bedrock model
        self.model = BedrockModel(
            model_id=settings.bedrock_model_id,
            region_name=settings.aws_region,
        )

        # Initialize Strands Agent
        self.agent = Agent(
            model=self.model,
            system_prompt=SYSTEM_PROMPT,
            tools=AGENT_TOOLS,
        )

        self._conversation_id: Optional[str] = None
        self._agent_actions: List[Dict[str, Any]] = []

    @property
    def conversation_id(self) -> Optional[str]:
        return self._conversation_id

    @conversation_id.setter
    def conversation_id(self, value: str):
        self._conversation_id = value

    def process_message(
        self,
        message: str,
        user_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Process a citizen message through the agent.

        The agent dynamically decides what tools to use based on the message content.

        Args:
            message: The citizen's message.
            user_id: Optional user ID for context.
            conversation_id: Optional conversation ID for session continuity.

        Returns:
            Dict with response, agent actions taken, and metadata.
        """
        self._conversation_id = conversation_id
        self._agent_actions = []

        start_time = time.time()

        # Build context-enriched prompt
        context_parts = []
        if conversation_id:
            context_parts.append(f"Conversation ID: {conversation_id}")
        if user_id:
            context_parts.append(f"User ID: {user_id}")

            # Try to get user context
            try:
                with get_cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT username, location, skills, experience_level
                        FROM users WHERE id = %s
                        """,
                        (user_id,),
                    )
                    user = cursor.fetchone()
                    if user:
                        user_dict = dict(user)
                        context_parts.append(f"User: {user_dict.get('username')}")
                        if user_dict.get("location"):
                            context_parts.append(f"Location: {user_dict['location']}")
                        if user_dict.get("skills"):
                            context_parts.append(f"Skills: {', '.join(user_dict['skills'])}")
            except Exception:
                pass

            # Get recent conversation context
            if conversation_id:
                try:
                    with get_cursor() as cursor:
                        cursor.execute(
                            """
                            SELECT c.issue_id, c.context
                            FROM conversations c WHERE c.id = %s
                            """,
                            (conversation_id,),
                        )
                        conv = cursor.fetchone()
                        if conv and conv["issue_id"]:
                            context_parts.append(
                                f"Active Issue ID: {conv['issue_id']}"
                            )
                except Exception:
                    pass

        # Prepare full prompt
        full_prompt = message
        if context_parts:
            context_str = "\n".join(context_parts)
            full_prompt = f"[Context]\n{context_str}\n\n[Message]\n{message}"

        # Invoke the Strands agent
        try:
            result = self.agent(full_prompt)
            response_text = str(result)

            # Extract tool use events from the agent's result message
            self._extract_tool_actions_from_result(result, conversation_id)
        except Exception as e:
            logger.error(f"Agent error: {e}")
            response_text = (
                "I encountered an issue processing your request. "
                "Please try again or rephrase your concern."
            )

        duration_ms = int((time.time() - start_time) * 1000)

        # Record agent activity
        self._record_agent_activity(
            conversation_id=conversation_id,
            message=message,
            response=response_text,
            duration_ms=duration_ms,
        )

        return {
            "response": response_text,
            "conversation_id": conversation_id,
            "agent_actions": self._agent_actions,
            "duration_ms": duration_ms,
        }

    def _record_agent_activity(
        self,
        conversation_id: Optional[str],
        message: str,
        response: str,
        duration_ms: int,
    ):
        """Record the agent's activity for the Agent Activity UI."""
        try:
            with get_cursor() as cursor:
                # Store agent action log
                cursor.execute(
                    """
                    INSERT INTO agent_actions
                        (conversation_id, tool_name, action, status, duration_ms, result)
                    VALUES (%s, 'civic_agent', 'process_message', 'completed', %s, %s)
                    """,
                    (
                        conversation_id,
                        duration_ms,
                        json.dumps({
                            "input_length": len(message),
                            "output_length": len(response),
                        }),
                    ),
                )
        except Exception as e:
            logger.error(f"Error recording agent activity: {e}")

    def _extract_tool_actions_from_result(self, result, conversation_id: Optional[str]):
        """Extract and log individual tool calls from the agent's result."""
        try:
            # Get messages from the agent's conversation
            messages = getattr(self.agent, 'messages', None) or []

            found_tools = set()
            for msg in messages:
                if not isinstance(msg, dict):
                    continue
                content = msg.get("content", [])
                if not isinstance(content, list):
                    continue
                for block in content:
                    if not isinstance(block, dict):
                        continue
                    # Strands format: {"toolUse": {"name": "...", "input": {...}}}
                    tool_use = block.get("toolUse")
                    if tool_use and isinstance(tool_use, dict):
                        tool_name = tool_use.get("name", "unknown")
                        tool_input = tool_use.get("input", {})
                        call_key = f"{tool_name}:{json.dumps(tool_input, sort_keys=True)[:100]}"
                        if call_key not in found_tools:
                            found_tools.add(call_key)
                            self._log_tool_call(conversation_id, tool_name, tool_input)
        except Exception as e:
            logger.debug(f"Could not extract tool actions from result: {e}")

    def _extract_tool_actions(self, conversation_id: Optional[str]):
        """Extract and log individual tool calls from the agent's execution."""
        try:
            # Access the agent's messages to find tool_use and tool_result events
            messages = getattr(self.agent, 'messages', []) or []
            for msg in messages:
                if not isinstance(msg, dict):
                    continue
                content = msg.get("content", [])
                if not isinstance(content, list):
                    continue
                for block in content:
                    if not isinstance(block, dict):
                        continue
                    if block.get("type") == "tool_use":
                        tool_name = block.get("name", "unknown")
                        tool_input = block.get("input", {})
                        # Log this tool call
                        self._log_tool_call(conversation_id, tool_name, tool_input)
                    elif block.get("type") == "toolUse":
                        tool_name = block.get("name", "unknown")
                        tool_input = block.get("input", {})
                        self._log_tool_call(conversation_id, tool_name, tool_input)
        except Exception as e:
            logger.debug(f"Could not extract tool actions: {e}")

    def _log_tool_call(self, conversation_id: Optional[str], tool_name: str, tool_input: dict):
        """Log a single tool call to the agent_actions table."""
        try:
            # Create a short action description
            action_desc = tool_name
            if tool_name == "search_civic_memory":
                action_desc = f"Searching civic memory: {tool_input.get('query', '')[:80]}"
            elif tool_name == "find_related_issues":
                action_desc = f"Finding related issues: {tool_input.get('query', '')[:80]}"
            elif tool_name == "create_civic_issue":
                action_desc = f"Creating issue: {tool_input.get('title', '')[:80]}"
            elif tool_name == "update_issue":
                action_desc = f"Updating issue: {tool_input.get('issue_id', '')[:36]}"
            elif tool_name == "get_issue_context":
                action_desc = f"Retrieving issue context: {tool_input.get('issue_id', '')[:36]}"
            elif tool_name == "find_job_opportunities":
                action_desc = f"Searching jobs: {tool_input.get('query', '')[:80]}"
            elif tool_name == "record_job_match":
                action_desc = f"Recording job match"
            elif tool_name == "record_evidence":
                action_desc = f"Recording evidence: {tool_input.get('source', '')[:50]}"
            elif tool_name == "record_action":
                action_desc = f"Recording action: {tool_input.get('action_type', '')}"
            elif tool_name == "get_issue_timeline":
                action_desc = f"Getting timeline: {tool_input.get('issue_id', '')[:36]}"
            elif tool_name == "add_timeline_event":
                action_desc = f"Adding timeline event: {tool_input.get('event_type', '')}"

            with get_cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO agent_actions
                        (conversation_id, tool_name, action, status, duration_ms)
                    VALUES (%s, %s, %s, 'completed', 0)
                    """,
                    (conversation_id, tool_name, action_desc),
                )

            # Also track for the response
            self._agent_actions.append({
                "tool_name": tool_name,
                "action": action_desc,
                "status": "completed",
            })
        except Exception as e:
            logger.debug(f"Error logging tool call: {e}")

    def get_recent_actions(
        self, conversation_id: Optional[str] = None, limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Get recent agent actions for the Activity UI."""
        try:
            with get_cursor() as cursor:
                if conversation_id:
                    cursor.execute(
                        """
                        SELECT id, conversation_id, issue_id, tool_name, action,
                               status, duration_ms, created_at
                        FROM agent_actions
                        WHERE conversation_id = %s
                        ORDER BY created_at DESC
                        LIMIT %s
                        """,
                        (conversation_id, limit),
                    )
                else:
                    cursor.execute(
                        """
                        SELECT id, conversation_id, issue_id, tool_name, action,
                               status, duration_ms, created_at
                        FROM agent_actions
                        ORDER BY created_at DESC
                        LIMIT %s
                        """,
                        (limit,),
                    )
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            logger.error(f"Error getting agent actions: {e}")
            return []


# Singleton
_civic_agent: Optional[CivicAgent] = None


def get_civic_agent() -> CivicAgent:
    global _civic_agent
    if _civic_agent is None:
        _civic_agent = CivicAgent()
    return _civic_agent
