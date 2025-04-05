from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, Optional
import os
import json
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Use relative import to work with uvicorn correctly
from .models.message import Message
from .services.github import PRAnalyzer, GitHubServiceError
from .services.langgrapher import PRAnalysisGraph

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

# Create dependency for LangGraph PR Analyzer
def get_langgraph_analyzer():
    try:
        return PRAnalysisGraph()
    except ValueError as e:
        # This will be caught when the endpoint is called
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-pr")
async def analyze_pr(
    message: Message, 
    pr_analyzer: PRAnalyzer = Depends(get_pr_analyzer),
    langgraph_analyzer: PRAnalysisGraph = Depends(get_langgraph_analyzer)
):
    """
    Analyze a GitHub Pull Request using GitHub API and LangGraph.
    """
    try:
        if not message.pr_url:
            raise HTTPException(status_code=400, detail="PR URL is required")
        
        logger.info(f"Analyzing PR: {message.pr_url}")
        
        # Analyze the PR using GitHub service to get metadata
        github_result = pr_analyzer.analyze_pr(message.pr_url)
        
        if not github_result["success"]:
            logger.error(f"GitHub API error: {github_result['error']}")
            return {
                "content": f"Error analyzing PR: {github_result['error']}",
                "success": False
            }
            
        # Extract PR metadata
        pr_metadata = github_result["data"]
        logger.info(f"Successfully fetched PR metadata: {pr_metadata['pr_title']}")
        
        try:
            # Run the PR analysis through the LangGraph
            langgraph_result = langgraph_analyzer.analyze(pr_metadata)
            
            logger.info(f"LangGraph analysis completed: {type(langgraph_result)}")
            logger.info(f"LangGraph result structure: {json.dumps(langgraph_result, default=str)[:200]}...")
            
            # Extract the assistant message from the result
            if langgraph_result.get("messages") and len(langgraph_result["messages"]) > 0:
                analysis_content = langgraph_result["messages"][0]["content"]
                return {
                    "content": analysis_content,
                    "success": True
                }
            else:
                logger.warning("No messages found in LangGraph result")
                # Fallback to GitHub service data if LangGraph analysis fails
                return generate_fallback_response(pr_metadata)
                
        except Exception as lang_error:
            logger.error(f"Error in LangGraph analysis: {str(lang_error)}", exc_info=True)
            # Fallback to GitHub service data if LangGraph analysis fails
            return generate_fallback_response(pr_metadata)
            
    except GitHubServiceError as e:
        # Handle GitHub service errors
        logger.error(f"GitHub service error: {str(e)}")
        return {
            "content": f"GitHub API error: {str(e)}",
            "success": False
        }
    except Exception as e:
        # Generic error handling
        logger.error(f"Unexpected error analyzing PR: {str(e)}", exc_info=True)
        error_message = f"Failed to analyze PR: {str(e)}"
        return {
            "content": error_message,
            "success": False
        }

def generate_fallback_response(pr_metadata):
    """Generate a fallback response using PR metadata when LangGraph fails."""
    logger.info("Generating fallback response from PR metadata")
    summary = f"# Analysis of PR: {pr_metadata['pr_title']}\n\n"
    summary += f"**Repository:** {pr_metadata['pr_repository']['name']}\n"
    summary += f"**Author:** {pr_metadata['pr_author']}\n"
    summary += f"**Created:** {pr_metadata['pr_created_at']}\n\n"
    
    summary += f"## Description\n{pr_metadata['pr_description']}\n\n"
    
    summary += f"## Changes\n"
    summary += f"- {len(pr_metadata['pr_files'])} files changed\n"
    
    # List the files changed (limit to 10 for brevity)
    if pr_metadata['pr_files']:
        summary += "### Files modified:\n"
        for file in pr_metadata['pr_files'][:10]:
            summary += f"- {file['filename']} ({file['additions']} additions, {file['deletions']} deletions)\n"
        
        if len(pr_metadata['pr_files']) > 10:
            summary += f"- ... and {len(pr_metadata['pr_files']) - 10} more files\n"
    
    return {
        "content": summary,
        "success": True
    }

@app.post("/generate-response")
async def generate_response(
    message: Message,
    langgraph_analyzer: PRAnalysisGraph = Depends(get_langgraph_analyzer)
):
    """
    Generate a response to a user message
    """
    try:
        logger.info(f"Generating response for message: {message.content[:50]}...")
        
        # Create system prompt with conversation memory if available
        system_prompt = "You are a helpful assistant specialized in software development and GitHub pull requests."
        user_prompt = message.content
        
        # Add conversation history if available
        if message.previous_content:
            logger.info("Including conversation history in the prompt")
            system_prompt += " You have a memory of previous messages in the conversation. Be consistent with information previously shared by the user."
            user_prompt = f"Previous conversation:\n{message.previous_content}\n\nCurrent message: {message.content}\n\nPlease respond to my current message."
        
        # Use the LLM directly for simple message responses
        llm_response = langgraph_analyzer.llm.invoke([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ])
        
        # Extract content from AIMessage response
        response_content = llm_response.content if hasattr(llm_response, 'content') else str(llm_response)
        
        logger.info("Successfully generated response")
        return {
            "content": response_content,
            "success": True
        }
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 