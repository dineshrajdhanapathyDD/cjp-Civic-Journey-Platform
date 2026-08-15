# AWS Architecture

## Services Used

| Service | Purpose |
|---------|---------|
| Amazon Bedrock | AI reasoning — Claude model for agent intelligence |
| Amazon Bedrock (Titan) | Embedding generation — vector representations |
| AWS Lambda | Backend runtime (production deployment) |
| API Gateway | REST API management (production) |
| Amazon S3 | Evidence storage (documents, files) |
| Amazon EventBridge | Event-driven notifications |
| Amazon SNS | Issue escalation notifications |
| Amazon CloudWatch | Observability and monitoring |
| AWS IAM | Security and access control |

## Bedrock Integration

### Agent Reasoning (Claude)

```python
from strands.models.bedrock import BedrockModel

model = BedrockModel(
    model_id="anthropic.claude-3-5-sonnet-20241022-v2:0",
    region_name="us-east-1",
)
```

The Strands agent uses Claude for:
- Understanding citizen reports
- Deciding which tools to invoke
- Reasoning about issue relationships
- Generating meaningful responses

### Embedding Generation (Titan)

```python
response = bedrock_client.invoke_model(
    modelId="amazon.titan-embed-text-v2:0",
    body=json.dumps({
        "inputText": text,
        "dimensions": 1024,
        "normalize": True,
    }),
)
```

Titan Embed V2 generates 1024-dimensional vectors for semantic search.

## Strands Agent SDK

Strands provides the agent orchestration layer:

```python
from strands import Agent, tool

agent = Agent(
    model=model,
    system_prompt=SYSTEM_PROMPT,
    tools=AGENT_TOOLS,
)

# Agent dynamically decides tool usage
result = agent("There aren't enough tech jobs for graduates in my area.")
```

### How Strands Decides When to Call Tools

Strands uses the language model's native tool-calling capability. The system prompt provides guidance on tool usage strategy, but the actual decision is made by the model at inference time based on:

1. The user's message content
2. The available tools and their descriptions
3. The system prompt's strategic guidance
4. Previous tool results in the conversation

This is what makes CJP an **agentic** system — the flow is not hardcoded.

## Production Deployment (Lambda + API Gateway)

For production, the FastAPI application is deployed as a Lambda function behind API Gateway:

```
User -> CloudFront -> API Gateway -> Lambda (FastAPI)
                                        |
                                        v
                                  Strands Agent
                                        |
                                        v
                                  CockroachDB Cloud
```

## Observability

CloudWatch metrics tracked:
- Agent response latency
- Tool invocation counts
- Error rates by tool
- Embedding generation time
- Database query duration
