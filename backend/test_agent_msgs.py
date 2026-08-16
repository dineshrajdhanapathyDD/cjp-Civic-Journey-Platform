"""Test what messages the agent produces."""
import sys
import json
sys.path.insert(0, ".")

from src.config import get_settings
from strands import Agent
from strands.models.bedrock import BedrockModel
from src.agent.tools.civic_memory import search_civic_memory
from src.agent.tools.issues import find_related_issues

settings = get_settings()
model = BedrockModel(model_id=settings.bedrock_model_id, region_name=settings.aws_region)

agent = Agent(
    model=model,
    system_prompt="You are a civic agent. Search memory for any report.",
    tools=[search_civic_memory, find_related_issues],
)

result = agent("Are there any issues about employment?")

print("=== Result type:", type(result))
print("=== Result fields:", [f for f in dir(result) if not f.startswith('_')])
print()

# Check message
msg = getattr(result, 'message', None)
print("=== result.message type:", type(msg))
if msg:
    if isinstance(msg, dict):
        print("  keys:", msg.keys())
        content = msg.get("content", [])
        print("  content type:", type(content))
        if isinstance(content, list):
            for i, block in enumerate(content):
                print(f"  block[{i}]: type={type(block)}, value={str(block)[:200]}")
    else:
        print("  value:", str(msg)[:500])

print()

# Check agent messages
messages = getattr(agent, 'messages', None)
print("=== agent.messages type:", type(messages))
if messages:
    print(f"  count: {len(messages)}")
    for i, m in enumerate(messages):
        if isinstance(m, dict):
            role = m.get("role", "?")
            content = m.get("content", [])
            tool_uses = []
            if isinstance(content, list):
                for block in content:
                    if isinstance(block, dict):
                        btype = block.get("type", "none")
                        if "tool" in btype.lower() or "toolUse" in block:
                            tool_uses.append(f"{btype}:{block.get('name', block.get('toolUseId', '?'))}")
                        # Print all block types for debugging
                        print(f"    block type='{btype}' keys={list(block.keys())[:6]}")
            if tool_uses:
                print(f"  msg[{i}] role={role} TOOL_USE: {tool_uses}")
            else:
                print(f"  msg[{i}] role={role} content_len={len(content) if isinstance(content, list) else len(str(content))}")
