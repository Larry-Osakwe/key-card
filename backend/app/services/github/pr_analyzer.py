"""
GitHub PR Analyzer service.

This module provides functionality to analyze GitHub PRs by extracting data
from the GitHub API and preparing it for LLM analysis.
"""

from typing import Dict, Any, List, Optional, Tuple
from .github_service import GitHubService, GitHubServiceError

class PRAnalyzer:
    """Service for analyzing GitHub Pull Requests."""
    
    def __init__(self, github_api_token: Optional[str] = None):
        """
        Initialize the PR Analyzer service.
        
        Args:
            github_api_token: GitHub API token for authentication (optional)
        """
        self.github_service = GitHubService(api_token=github_api_token)
    
    def analyze_pr(self, pr_url: str) -> Dict[str, Any]:
        """
        Analyze a GitHub Pull Request.
        
        Args:
            pr_url: GitHub pull request URL
            
        Returns:
            Dictionary with PR analysis data
            
        Raises:
            GitHubServiceError: When GitHub API errors occur
        """
        try:
            # Get PR data
            pr_data = self.github_service.get_pr_data(pr_url)
            
            # Get files changed
            pr_files = self.github_service.get_pr_files(pr_url)
            
            # Get PR comments
            pr_comments = self.github_service.get_pr_comments(pr_url)
            
            # Get raw diff (only if PR isn't too large)
            diff = ""
            if len(pr_files) <= 100:  # Limit to avoid huge diffs
                diff = self.github_service.get_pr_diff(pr_url)
            else:
                diff = "PR too large, diff not included. See files changed list."
            
            # Prepare analysis data
            analysis_data = {
                "pr_url": pr_url,
                "pr_title": pr_data.get("title", ""),
                "pr_number": pr_data.get("number", ""),
                "pr_description": pr_data.get("body", ""),
                "pr_author": pr_data.get("user", {}).get("login", ""),
                "pr_state": pr_data.get("state", ""),
                "pr_created_at": pr_data.get("created_at", ""),
                "pr_updated_at": pr_data.get("updated_at", ""),
                "pr_repository": self._extract_repo_info(pr_data),
                "pr_branch": self._extract_branch_info(pr_data),
                "pr_files": self._summarize_files(pr_files),
                "pr_comments": self._summarize_comments(pr_comments),
                "pr_diff": diff
            }
            
            return {
                "success": True,
                "data": analysis_data,
                "error": None
            }
            
        except GitHubServiceError as e:
            return {
                "success": False,
                "data": None,
                "error": str(e)
            }
        except Exception as e:
            return {
                "success": False,
                "data": None,
                "error": f"Unexpected error analyzing PR: {str(e)}"
            }
    
    def _extract_repo_info(self, pr_data: Dict[str, Any]) -> Dict[str, str]:
        """Extract repository information from PR data."""
        repo = pr_data.get("base", {}).get("repo", {})
        return {
            "name": repo.get("full_name", ""),
            "description": repo.get("description", ""),
            "language": repo.get("language", ""),
            "visibility": "private" if repo.get("private", False) else "public"
        }
    
    def _extract_branch_info(self, pr_data: Dict[str, Any]) -> Dict[str, str]:
        """Extract branch information from PR data."""
        return {
            "base": pr_data.get("base", {}).get("ref", ""),
            "head": pr_data.get("head", {}).get("ref", "")
        }
    
    def _summarize_files(self, files: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Summarize files changed in the PR."""
        return [
            {
                "filename": file.get("filename", ""),
                "status": file.get("status", ""),
                "additions": file.get("additions", 0),
                "deletions": file.get("deletions", 0),
                "changes": file.get("changes", 0)
            }
            for file in files
        ]
    
    def _summarize_comments(self, comments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Summarize comments on the PR."""
        return [
            {
                "author": comment.get("user", {}).get("login", ""),
                "body": comment.get("body", ""),
                "created_at": comment.get("created_at", "")
            }
            for comment in comments
        ] 