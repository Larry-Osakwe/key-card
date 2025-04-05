import os
import re
from typing import Dict, List, Optional, Tuple, Union
import requests
from urllib.parse import urlparse

class GitHubServiceError(Exception):
    """Base exception class for GitHub Service errors."""
    pass

class RateLimitError(GitHubServiceError):
    """Exception raised when GitHub API rate limit is exceeded."""
    pass

class AuthenticationError(GitHubServiceError):
    """Exception raised when GitHub API authentication fails."""
    pass

class NotFoundError(GitHubServiceError):
    """Exception raised when a GitHub resource is not found."""
    pass

class GitHubService:
    """Service for interacting with the GitHub API."""
    
    def __init__(self, api_token: Optional[str] = None):
        """
        Initialize the GitHub service.
        
        Args:
            api_token: GitHub API token for authentication (optional)
        """
        self.api_token = api_token or os.environ.get("GITHUB_API_TOKEN")
        self.base_url = "https://api.github.com"
        
    @property
    def headers(self) -> Dict[str, str]:
        """Get the headers for GitHub API requests."""
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "GH-PR-Analyzer-App",
        }
        
        if self.api_token:
            headers["Authorization"] = f"token {self.api_token}"
            
        return headers
    
    def extract_pr_info(self, pr_url: str) -> Tuple[str, str, str]:
        """
        Extract owner, repo, and PR number from a GitHub PR URL.
        
        Args:
            pr_url: GitHub pull request URL
            
        Returns:
            A tuple of (owner, repo, pr_number)
            
        Raises:
            ValueError: If the URL is not a valid GitHub PR URL
        """
        # Check for valid GitHub URL
        parsed_url = urlparse(pr_url)
        if parsed_url.netloc not in ("github.com", "www.github.com"):
            raise ValueError(f"Not a GitHub URL: {pr_url}")
        
        # Match paths like /owner/repo/pull/number
        pattern = r"/([^/]+)/([^/]+)/pull/(\d+)"
        match = re.search(pattern, parsed_url.path)
        
        if not match:
            raise ValueError(f"Not a valid GitHub PR URL: {pr_url}")
        
        return match.groups()
    
    def get_pr_data(self, pr_url: str) -> Dict:
        """
        Get pull request data from GitHub.
        
        Args:
            pr_url: GitHub pull request URL
            
        Returns:
            Dictionary containing PR data
            
        Raises:
            Various GitHubServiceError subclasses
        """
        try:
            owner, repo, pr_number = self.extract_pr_info(pr_url)
            endpoint = f"/repos/{owner}/{repo}/pulls/{pr_number}"
            
            response = requests.get(
                f"{self.base_url}{endpoint}",
                headers=self.headers
            )
            
            self._handle_response_errors(response)
            
            return response.json()
        except ValueError as e:
            raise ValueError(str(e))
        except requests.RequestException as e:
            raise GitHubServiceError(f"Request error: {str(e)}")
    
    def get_pr_files(self, pr_url: str) -> List[Dict]:
        """
        Get files changed in a pull request.
        
        Args:
            pr_url: GitHub pull request URL
            
        Returns:
            List of files with their changes
            
        Raises:
            Various GitHubServiceError subclasses
        """
        try:
            owner, repo, pr_number = self.extract_pr_info(pr_url)
            endpoint = f"/repos/{owner}/{repo}/pulls/{pr_number}/files"
            
            response = requests.get(
                f"{self.base_url}{endpoint}",
                headers=self.headers
            )
            
            self._handle_response_errors(response)
            
            return response.json()
        except ValueError as e:
            raise ValueError(str(e))
        except requests.RequestException as e:
            raise GitHubServiceError(f"Request error: {str(e)}")
    
    def get_pr_diff(self, pr_url: str) -> str:
        """
        Get the raw diff of a pull request.
        
        Args:
            pr_url: GitHub pull request URL
            
        Returns:
            Raw diff content as a string
            
        Raises:
            Various GitHubServiceError subclasses
        """
        try:
            owner, repo, pr_number = self.extract_pr_info(pr_url)
            
            # GitHub's undocumented diff endpoint
            diff_url = f"https://github.com/{owner}/{repo}/pull/{pr_number}.diff"
            
            # We don't use the API endpoint here, so we only add auth if available
            headers = {"User-Agent": "GH-PR-Analyzer-App"}
            if self.api_token:
                headers["Authorization"] = f"token {self.api_token}"
            
            response = requests.get(diff_url, headers=headers)
            
            self._handle_response_errors(response)
            
            return response.text
        except ValueError as e:
            raise ValueError(str(e))
        except requests.RequestException as e:
            raise GitHubServiceError(f"Request error: {str(e)}")
    
    def get_pr_comments(self, pr_url: str) -> List[Dict]:
        """
        Get comments on a pull request.
        
        Args:
            pr_url: GitHub pull request URL
            
        Returns:
            List of comments
            
        Raises:
            Various GitHubServiceError subclasses
        """
        try:
            owner, repo, pr_number = self.extract_pr_info(pr_url)
            endpoint = f"/repos/{owner}/{repo}/issues/{pr_number}/comments"
            
            response = requests.get(
                f"{self.base_url}{endpoint}",
                headers=self.headers
            )
            
            self._handle_response_errors(response)
            
            return response.json()
        except ValueError as e:
            raise ValueError(str(e))
        except requests.RequestException as e:
            raise GitHubServiceError(f"Request error: {str(e)}")
    
    def _handle_response_errors(self, response: requests.Response) -> None:
        """
        Handle HTTP errors from GitHub API responses.
        
        Args:
            response: Requests response object
            
        Raises:
            RateLimitError: When rate limit is exceeded
            AuthenticationError: When authentication fails
            NotFoundError: When resource is not found
            GitHubServiceError: For other errors
        """
        if response.status_code == 200:
            return
            
        if response.status_code == 403 and 'X-RateLimit-Remaining' in response.headers:
            if int(response.headers['X-RateLimit-Remaining']) == 0:
                reset_time = int(response.headers.get('X-RateLimit-Reset', 0))
                raise RateLimitError(
                    f"GitHub API rate limit exceeded. Resets at timestamp {reset_time}"
                )
        
        if response.status_code == 401:
            raise AuthenticationError("GitHub API authentication failed.")
            
        if response.status_code == 404:
            raise NotFoundError("GitHub resource not found. This may be a private repository or non-existent PR.")
            
        # Generic error with response details
        error_msg = f"GitHub API error: {response.status_code}"
        try:
            error_data = response.json()
            if "message" in error_data:
                error_msg += f" - {error_data['message']}"
        except ValueError:
            pass
            
        raise GitHubServiceError(error_msg) 