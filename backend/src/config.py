"""CJP Configuration - loads from environment variables."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment."""

    # CockroachDB
    cockroachdb_url: str = "postgresql://root@localhost:26257/cjp?sslmode=disable"
    cockroachdb_cluster_id: str = ""

    # AWS
    aws_region: str = "us-east-1"
    bedrock_model_id: str = "amazon.nova-pro-v1:0"

    # CockroachDB MCP Server
    cockroachdb_mcp_api_key: str = ""
    cockroachdb_mcp_cluster_name: str = "cjp-cluster"

    # Application
    app_secret_key: str = "dev-secret-key-change-in-production"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    frontend_url: str = "http://localhost:5173"

    # Vector Embeddings
    embedding_model_id: str = "amazon.titan-embed-text-v2:0"
    embedding_dimensions: int = 1024

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
