"""Check Strands Agent internals for tool call tracking."""
import strands
from strands import Agent

# Find callback handler
for name in dir(strands):
    if "callback" in name.lower() or "handler" in name.lower():
        print(f"strands.{name}")

print()

# Check Agent attributes related to tools/messages
agent_attrs = [a for a in dir(Agent) if "tool" in a.lower() or "message" in a.lower() or "event" in a.lower()]
print("Agent tool/message attrs:", agent_attrs)

# Check if there's a way to get the conversation messages
print("\nAgent.__call__ signature:")
import inspect
print(inspect.signature(Agent.__call__))
