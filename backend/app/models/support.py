from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class Document(BaseModel):
    """Model for internal documentation"""
    title: str
    content: str
    url: str

class WebSource(BaseModel):
    """Model for web data sources"""
    title: str
    url: str
    snippet: str

class SearchResult(BaseModel):
    """Model for search results from any source"""
    title: str
    url: str
    content: Optional[str] = None
    snippet: Optional[str] = None
    relevance: float = Field(..., description="Relevance score between 0 and 1")
    source_type: str = Field(..., description="Type of source: 'internal' or 'web'")

class QueryRequest(BaseModel):
    """Model for customer support query requests"""
    query: str
    previous_messages: Optional[List[Dict[str, Any]]] = None

class QueryResponse(BaseModel):
    """Model for customer support query responses"""
    content: str
    sources: List[SearchResult] = []
    scores: Dict[str, float] = {}
    success: bool = True