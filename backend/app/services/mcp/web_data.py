import json
import os
import random
import asyncio
from typing import List, Dict, Any, Optional
from fastmcp import FastMCP, Context
from ...models.support import WebSource, SearchResult

# Create MCP server for web data
web_data_mcp = FastMCP(name="WebDataServer")

# Load web sources from a JSON file (simulating web data)
def load_web_sources():
    # Default web sources if JSON file is not found
    default_sources = [
        WebSource(
            title="Official Support: How to Reset Your Device",
            url="https://support.example.com/device-reset",
            snippet="Official guide for resetting your device. Learn how to perform soft resets, hard resets, and factory resets safely."
        ),
        WebSource(
            title="Community Forum: Account Management Tips",
            url="https://community.example.com/forums/thread/12345",
            snippet="Users share their experiences with account management. Includes tips for password security and account recovery."
        ),
        WebSource(
            title="Tech Blog: Solving Common Connectivity Issues",
            url="https://techblog.example.com/connectivity-solutions",
            snippet="A comprehensive guide to diagnosing and fixing the most common Wi-Fi and mobile data connectivity problems."
        )
    ]
    
    # Try to get path from environment variable
    json_path = os.environ.get('WEB_SOURCES_PATH')
    
    # If not set, try different relative paths that might work
    if not json_path:
        # Try relative to the current file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
        possible_paths = [
            'data/web_sources.json',  # Relative to working directory
            os.path.join(project_root, 'data', 'web_sources.json'),  # Absolute from project root
            os.path.join(project_root, 'backend', 'data', 'web_sources.json')  # Another possible location
        ]
        
        # Try each path
        for path in possible_paths:
            if os.path.exists(path):
                json_path = path
                print(f"Found web sources at: {json_path}")
                break
        
        # If still not found, use the first path for error reporting
        if not json_path:
            json_path = possible_paths[0]
    
    # Try to load the file
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r') as f:
                sources_data = json.load(f)
                loaded_sources = [WebSource(**source) for source in sources_data]
                print(f"Successfully loaded {len(loaded_sources)} web sources from {json_path}")
                return loaded_sources
        except Exception as e:
            print(f"Error loading web sources from JSON at {json_path}: {e}")
            print("Using default web sources instead.")
    else:
        print(f"Warning: JSON file not found at {json_path}.")
        print("To specify a custom path, set the WEB_SOURCES_PATH environment variable.")
        print("Using default web sources instead.")
    
    return default_sources

# Initialize web sources
web_sources = load_web_sources()

# Simulate a web API call with realistic behavior
async def mock_api_call(query: str, api_key: Optional[str] = None) -> Dict[str, Any]:
    """Simulate a call to a web search API with realistic behavior"""
    # Validate API key (simulating authentication)
    if not api_key:
        # Still works but with a warning
        print("Warning: No API key provided. Using limited access mode.")
    
    # Simulate network latency
    delay = random.uniform(0.5, 2.0)  # Random delay between 0.5 and 2 seconds
    await asyncio.sleep(delay)
    
    # Occasionally simulate an API error (1 in 10 chance)
    if random.random() < 0.1:
        if random.random() < 0.5:
            # Timeout error
            raise TimeoutError("API request timed out after 5 seconds")
        else:
            # Rate limit error
            return {
                "status": "error",
                "error_code": 429,
                "message": "Rate limit exceeded. Please try again later.",
                "results": []
            }
    
    # Find relevant sources based on query keywords
    query_terms = query.lower().split()
    matched_sources = []
    
    for source in web_sources:
        # Calculate relevance score based on keyword matches
        score = 0
        source_text = (source.title + " " + source.snippet).lower()
        
        for term in query_terms:
            if term in source_text:
                # More weight if term is in title
                if term in source.title.lower():
                    score += 2
                else:
                    score += 1
        
        # Add source if it has any relevance
        if score > 0:
            # Normalize score between 0 and 1
            relevance = min(score / (len(query_terms) * 2), 1.0)
            matched_sources.append({
                "title": source.title,
                "url": source.url,
                "snippet": source.snippet,
                "relevance": round(relevance, 2)
            })
    
    # Sort by relevance (highest first)
    matched_sources.sort(key=lambda x: x["relevance"], reverse=True)
    
    # Return API-like response
    return {
        "status": "success",
        "query": query,
        "total_results": len(matched_sources),
        "results": matched_sources,
        "metadata": {
            "response_time": round(delay, 3),
            "api_version": "1.0",
            "result_limit": 10,
            "rate_limit_remaining": 98 if api_key else 5
        }
    }

@web_data_mcp.resource("web-source://{source_id}")
def get_web_source(source_id: str) -> Dict[str, Any]:
    """Retrieve a specific web source by ID (using URL as ID)"""
    for source in web_sources:
        if source.url.split('/')[-1] == source_id:
            return source.dict()
    return {"error": "Web source not found"}

@web_data_mcp.tool()
async def search_web(query: str, ctx: Context) -> List[SearchResult]:
    """Search web data sources based on a query"""
    await ctx.info(f"Searching web data for: {query}")
    
    # Simulate API key (in a real app, this would be securely stored)
    api_key = "sim_api_key_12345"
    
    try:
        # Make the mock API call
        api_response = await mock_api_call(query, api_key)
        
        # Log the API response status
        await ctx.info(f"API response status: {api_response['status']}")
        
        # Check if the API call was successful
        if api_response['status'] != "success":
            await ctx.error(f"API error: {api_response.get('message', 'Unknown error')}")
            return []
        
        # Convert API results to SearchResult objects
        results = [
            SearchResult(
                title=item["title"],
                url=item["url"],
                snippet=item["snippet"],
                relevance=item["relevance"],
                source_type="web"
            ) for item in api_response["results"]
        ]
        
        return results
        
    except Exception as e:
        # Log error and return empty results
        await ctx.error(f"Error calling web search API: {str(e)}")
        return []