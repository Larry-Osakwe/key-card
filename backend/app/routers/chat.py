from fastapi import APIRouter, HTTPException, Depends
import uuid
from datetime import datetime

from ..services.langgrapher.support_query_graph import SupportQueryGraph
from ..models.support import ChatMessage, ChatResponse, SearchResult as Source, Score

router = APIRouter()

# Create a dependency for the SupportQueryGraph
def get_support_query_graph():
    try:
        return SupportQueryGraph()
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat", response_model=ChatResponse)
async def chat(
    message: ChatMessage,
    support_query_graph: SupportQueryGraph = Depends(get_support_query_graph)
):
    """Process a customer support query and return a response with sources and scores"""
    try:
        # Process the query through the SupportQueryGraph
        result = await support_query_graph.process(
            query=message.message,
            conversation_history=None if not message.previous_content else [
                {"role": "user", "content": message.previous_content}
            ]
        )
        
        # Convert sources to the expected format
        sources = []
        for source in result.get("sources", []):
            sources.append(Source(
                title=source.get("title", "Untitled"),
                url=source.get("url", ""),
                relevance=source.get("relevance", 0.0),
                content=source.get("content"),
                snippet=source.get("snippet"),
                source_type=source.get("source_type", "unknown")
            ))
        
        # Create the scores object
        scores = Score(
            overall=result.get("scores", {}).get("overall", 0.0),
            keyword=result.get("scores", {}).get("keyword", 0.0),
            llm=result.get("scores", {}).get("llm", 0.0)
        )
        
        # Return the formatted response
        return ChatResponse(
            content=result.get("content", ""),
            sources=sources,
            scores=scores,
            refinements=result.get("refinements", 0),
            success=result.get("success", True),
            session_id=message.session_id or str(uuid.uuid4())
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
