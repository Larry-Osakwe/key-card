"""
PR Analysis State definition for LangGraph.

This module defines the State and related types for the PR analysis graph.
"""

from typing import Dict, List, Any, TypedDict, Annotated, Optional
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages

class PRMetadata(TypedDict, total=False):
    """PR metadata used in the state."""
    pr_url: str
    pr_title: str
    pr_number: str
    pr_description: str
    pr_author: str
    pr_state: str
    pr_created_at: str
    pr_updated_at: str
    pr_repository: Dict[str, str]
    pr_branch: Dict[str, str]
    pr_files: List[Dict[str, Any]]
    pr_comments: List[Dict[str, Any]]
    pr_diff: str

class AnalysisResult(TypedDict, total=False):
    """Analysis result for the PR."""
    summary: str
    key_changes: List[str]
    potential_issues: List[str]
    suggested_improvements: List[str]
    
class State(TypedDict, total=False):
    """
    State definition for the PR analysis graph.
    
    Attributes:
        messages: List of chat messages
        pr_metadata: GitHub PR metadata
        analysis_result: Result of the PR analysis
    """
    # Messages will be appended rather than overwritten
    messages: Annotated[List[Dict[str, Any]], add_messages]
    # PR metadata will be overwritten on each update
    pr_metadata: Optional[PRMetadata]
    # Analysis results will be overwritten on each update
    analysis_result: Optional[AnalysisResult] 