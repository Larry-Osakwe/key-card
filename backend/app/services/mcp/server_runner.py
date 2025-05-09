from fastapi import FastAPI
from .internal_docs import internal_docs_mcp
from .web_data import web_data_mcp

def setup_mcp_servers(app: FastAPI):
    """Set up MCP servers as FastAPI endpoints"""
    # Create a simple router for internal docs MCP server
    @app.post("/internal-docs/search")
    async def search_internal_docs(query: str):
        """Search internal documentation"""
        from fastmcp import Client
        client = Client(internal_docs_mcp)
        async with client:
            results = await client.call_tool("search_docs", {"query": query})
            return results
    
    # Create a simple router for web data MCP server
    @app.post("/web-data/search")
    async def search_web_data(query: str):
        """Search web data"""
        from fastmcp import Client
        client = Client(web_data_mcp)
        async with client:
            results = await client.call_tool("search_web", {"query": query})
            return results
    
    return app
