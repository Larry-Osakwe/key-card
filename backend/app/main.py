from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any

app = FastAPI(title="GitHub PR Analyzer API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    content: str
    pr_url: Optional[str] = None
    previous_content: Optional[str] = None

@app.post("/analyze-pr")
async def analyze_pr(message: Message):
    """
    Analyze a GitHub Pull Request using LangGraph and LLM
    """
    try:
        # This will be implemented with LangGraph in Phase 3
        return {
            "content": f"Mock analysis of PR: {message.pr_url}",
            "success": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-response")
async def generate_response(message: Message):
    """
    Generate a response to a user message
    """
    try:
        # This will be implemented with LLM in Phase 3
        return {
            "content": f"Mock response to: {message.content}",
            "success": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 