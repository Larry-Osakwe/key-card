from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, Optional
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Use relative import to work with uvicorn correctly
from .models.message import Message
from .services.github import PRAnalyzer, GitHubServiceError

app = FastAPI(title="GitHub PR Analyzer API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create dependency for PR Analyzer with API key
def get_pr_analyzer():
    # Get GitHub API token from environment variable
    github_api_token = os.environ.get("GITHUB_API_TOKEN")
    return PRAnalyzer(github_api_token=github_api_token)

@app.post("/analyze-pr")
async def analyze_pr(message: Message, pr_analyzer: PRAnalyzer = Depends(get_pr_analyzer)):
    """
    Analyze a GitHub Pull Request using GitHub API.
    """
    try:
        if not message.pr_url:
            raise HTTPException(status_code=400, detail="PR URL is required")
        
        # Analyze the PR using our new service
        result = pr_analyzer.analyze_pr(message.pr_url)
        
        if result["success"]:
            # For now, just return a formatted summary
            # In Phase 3.2, we'll integrate this with LangGraph and LLM
            pr_data = result["data"]
            summary = f"# Analysis of PR: {pr_data['pr_title']}\n\n"
            summary += f"**Repository:** {pr_data['pr_repository']['name']}\n"
            summary += f"**Author:** {pr_data['pr_author']}\n"
            summary += f"**Created:** {pr_data['pr_created_at']}\n\n"
            
            summary += f"## Description\n{pr_data['pr_description']}\n\n"
            
            summary += f"## Changes\n"
            summary += f"- {len(pr_data['pr_files'])} files changed\n"
            
            # List the files changed (limit to 10 for brevity)
            if pr_data['pr_files']:
                summary += "### Files modified:\n"
                for file in pr_data['pr_files'][:10]:
                    summary += f"- {file['filename']} ({file['additions']} additions, {file['deletions']} deletions)\n"
                
                if len(pr_data['pr_files']) > 10:
                    summary += f"- ... and {len(pr_data['pr_files']) - 10} more files\n"
            
            return {
                "content": summary,
                "success": True
            }
        else:
            # Return error from GitHub service
            return {
                "content": f"Error analyzing PR: {result['error']}",
                "success": False
            }
    except GitHubServiceError as e:
        # Handle GitHub service errors
        return {
            "content": f"GitHub API error: {str(e)}",
            "success": False
        }
    except Exception as e:
        # Generic error handling
        error_message = f"Failed to analyze PR: {str(e)}"
        return {
            "content": error_message,
            "success": False
        }

@app.post("/generate-response")
async def generate_response(message: Message):
    """
    Generate a response to a user message
    """
    try:
        # This will be implemented with LLM in Phase 3.3
        return {
            "content": f"Mock response to: {message.content}",
            "success": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 