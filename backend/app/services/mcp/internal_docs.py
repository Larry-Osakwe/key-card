import json
import os
from typing import List, Dict, Any
from fastmcp import FastMCP, Context
from ...models.support import Document, SearchResult

# Create MCP server for internal documentation
internal_docs_mcp = FastMCP(name="InternalDocsServer")

# Load documents from a JSON file (simulating internal documentation)
def load_docs():
    # Default documents if JSON file is not found
    default_docs = [
        Document(
            title="Device Reset Guide",
            content="Step 1: Power off device. Step 2: Hold the power button for 10 seconds. Step 3: Release and press power again to restart.",
            url="/docs/device-reset"
        ),
        Document(
            title="Account Management",
            content="To reset your password, visit the account settings page and select 'Reset Password'.",
            url="/docs/account-management"
        ),
        Document(
            title="Troubleshooting Connection Issues",
            content="If your device won't connect, try: 1) Restart your router, 2) Check WiFi settings, 3) Reset network settings.",
            url="/docs/connectivity"
        )
    ]
    
    # Try to get path from environment variable
    json_path = os.environ.get('INTERNAL_DOCS_PATH')
    
    # If not set, try different relative paths that might work
    if not json_path:
        # Try relative to the current file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
        possible_paths = [
            'data/internal_docs.json',  # Relative to working directory
            os.path.join(project_root, 'data', 'internal_docs.json'),  # Absolute from project root
            os.path.join(project_root, 'backend', 'data', 'internal_docs.json')  # Another possible location
        ]
        
        # Try each path
        for path in possible_paths:
            if os.path.exists(path):
                json_path = path
                print(f"Found internal docs at: {json_path}")
                break
        
        # If still not found, use the first path for error reporting
        if not json_path:
            json_path = possible_paths[0]
    
    # Try to load the file
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r') as f:
                docs_data = json.load(f)
                loaded_docs = [Document(**doc) for doc in docs_data]
                print(f"Successfully loaded {len(loaded_docs)} documents from {json_path}")
                return loaded_docs
        except Exception as e:
            print(f"Error loading documents from JSON at {json_path}: {e}")
            print("Using default documents instead.")
    else:
        print(f"Warning: JSON file not found at {json_path}.")
        print("To specify a custom path, set the INTERNAL_DOCS_PATH environment variable.")
        print("Using default documents instead.")
    
    return default_docs

# Initialize documents
docs = load_docs()

@internal_docs_mcp.resource("docs://{doc_id}")
def get_document(doc_id: str) -> Dict[str, Any]:
    """Retrieve a specific document by ID"""
    for doc in docs:
        if doc.url.split('/')[-1] == doc_id:
            return doc.dict()
    return {"error": "Document not found"}

@internal_docs_mcp.tool()
async def search_docs(query: str, ctx: Context) -> List[SearchResult]:
    """Search internal documentation based on a query"""
    await ctx.info(f"Searching internal docs for: {query}")
    
    # Simple keyword matching (sufficient for simulation)
    query_terms = query.lower().split()
    results = []
    
    for i, doc in enumerate(docs):
        # Check if any query terms are in the document
        doc_text = (doc.title + " " + doc.content).lower()
        matches = sum(term in doc_text for term in query_terms)
        
        # If there are matches, include in results with a relevance score
        if matches > 0:
            # Simple relevance calculation based on number of matching terms
            relevance = min(0.95, 0.5 + (matches / len(query_terms) * 0.45))
            
            results.append(
                SearchResult(
                    title=doc.title,
                    url=doc.url,
                    content=doc.content[:100] + "..." if len(doc.content) > 100 else doc.content,
                    relevance=relevance,
                    source_type="internal"
                )
            )
    
    # Sort by relevance
    results.sort(key=lambda x: x.relevance, reverse=True)
    return results