"""CockroachDB Cloud MCP Server Client.

Connects the Strands Agent to CockroachDB Cloud via the official MCP server.
The MCP server provides database query and management capabilities that the
agent uses for persistent civic memory operations.

Official docs: https://www.cockroachlabs.com/docs/cockroachcloud/connect-to-the-cockroachdb-cloud-mcp-server
"""

import json
import logging
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class MCPToolResult:
    """Result from an MCP tool invocation."""
    tool_name: str
    success: bool
    data: Any = None
    error: Optional[str] = None


@dataclass
class MCPServerConfig:
    """Configuration for the CockroachDB Cloud MCP Server."""
    api_key: str
    cluster_name: str
    # The MCP server is accessed via stdio transport
    command: str = "npx"
    args: List[str] = field(default_factory=lambda: [
        "-y", "@cockroachlabs/ccloud-mcp-server"
    ])


class CockroachDBMCPClient:
    """Client for CockroachDB Cloud MCP Server.

    The CockroachDB Cloud MCP Server provides these capabilities:
    - run_sql: Execute SQL queries against the cluster
    - get_clusters: List available clusters
    - get_databases: List databases in a cluster
    - get_tables: List tables in a database
    - get_table_schema: Get schema for a specific table
    - create_database: Create a new database
    - create_changefeed: Set up change data capture

    The Strands agent uses this client to interact with CockroachDB
    through the MCP protocol rather than direct database connections.
    """

    def __init__(self, config: MCPServerConfig):
        self.config = config
        self._session = None
        self._available_tools: List[str] = []

    async def connect(self):
        """Initialize connection to the MCP server."""
        from mcp import ClientSession, StdioServerParameters
        from mcp.client.stdio import stdio_client

        server_params = StdioServerParameters(
            command=self.config.command,
            args=self.config.args,
            env={
                "COCKROACHDB_API_KEY": self.config.api_key,
                "COCKROACHDB_CLUSTER_NAME": self.config.cluster_name,
            },
        )

        self._transport = await stdio_client(server_params).__aenter__()
        read_stream, write_stream = self._transport
        self._session = ClientSession(read_stream, write_stream)
        await self._session.__aenter__()
        await self._session.initialize()

        # Discover available tools
        tools_response = await self._session.list_tools()
        self._available_tools = [tool.name for tool in tools_response.tools]
        logger.info(f"MCP Server connected. Available tools: {self._available_tools}")

    async def disconnect(self):
        """Close MCP server connection."""
        if self._session:
            await self._session.__aexit__(None, None, None)
        if self._transport:
            await self._transport.__aexit__(None, None, None)

    @property
    def available_tools(self) -> List[str]:
        """List of tools available from the MCP server."""
        return self._available_tools

    async def run_sql(self, query: str, params: Optional[List[Any]] = None) -> MCPToolResult:
        """Execute SQL via the MCP server's run_sql tool."""
        try:
            arguments = {"query": query}
            if params:
                arguments["params"] = params

            result = await self._session.call_tool("run_sql", arguments=arguments)

            return MCPToolResult(
                tool_name="run_sql",
                success=True,
                data=result.content,
            )
        except Exception as e:
            logger.error(f"MCP run_sql error: {e}")
            return MCPToolResult(
                tool_name="run_sql",
                success=False,
                error=str(e),
            )

    async def get_clusters(self) -> MCPToolResult:
        """List available CockroachDB clusters."""
        try:
            result = await self._session.call_tool("get_clusters", arguments={})
            return MCPToolResult(
                tool_name="get_clusters",
                success=True,
                data=result.content,
            )
        except Exception as e:
            return MCPToolResult(tool_name="get_clusters", success=False, error=str(e))

    async def get_databases(self) -> MCPToolResult:
        """List databases in the cluster."""
        try:
            result = await self._session.call_tool("get_databases", arguments={})
            return MCPToolResult(
                tool_name="get_databases",
                success=True,
                data=result.content,
            )
        except Exception as e:
            return MCPToolResult(tool_name="get_databases", success=False, error=str(e))

    async def get_tables(self, database: str = "cjp") -> MCPToolResult:
        """List tables in a database."""
        try:
            result = await self._session.call_tool(
                "get_tables", arguments={"database": database}
            )
            return MCPToolResult(tool_name="get_tables", success=True, data=result.content)
        except Exception as e:
            return MCPToolResult(tool_name="get_tables", success=False, error=str(e))

    async def get_table_schema(self, table: str, database: str = "cjp") -> MCPToolResult:
        """Get schema for a specific table."""
        try:
            result = await self._session.call_tool(
                "get_table_schema",
                arguments={"table": table, "database": database},
            )
            return MCPToolResult(
                tool_name="get_table_schema", success=True, data=result.content
            )
        except Exception as e:
            return MCPToolResult(
                tool_name="get_table_schema", success=False, error=str(e)
            )

    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> MCPToolResult:
        """Generic tool invocation for any MCP tool."""
        try:
            result = await self._session.call_tool(tool_name, arguments=arguments)
            return MCPToolResult(tool_name=tool_name, success=True, data=result.content)
        except Exception as e:
            logger.error(f"MCP tool {tool_name} error: {e}")
            return MCPToolResult(tool_name=tool_name, success=False, error=str(e))
