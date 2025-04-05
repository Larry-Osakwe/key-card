"""
PR Analyzer using LangGraph.

This module implements a LangGraph-based PR analyzer that processes GitHub PR data
and generates insights using large language models.
"""

import os
import logging
from typing import Dict, Any, List, Optional, cast

from langgraph.graph import StateGraph, START, END
from langchain_openai import ChatOpenAI
from langchain.schema import AIMessage

from .pr_state import State, PRMetadata, AnalysisResult

# Configure logging
logger = logging.getLogger(__name__)

def create_pr_analysis_prompt(pr_metadata: PRMetadata) -> str:
    """
    Create a prompt for the LLM to analyze the PR.
    
    Args:
        pr_metadata: PR metadata including diff, title, description, etc.
        
    Returns:
        A formatted prompt for the LLM
    """
    prompt = f"""
You are a code review assistant analyzing a GitHub Pull Request. Please analyze the following PR:

Title: {pr_metadata['pr_title']}
Author: {pr_metadata['pr_author']}
Repository: {pr_metadata['pr_repository']['name']}
Description:
{pr_metadata['pr_description']}

The PR modifies {len(pr_metadata['pr_files'])} files:
"""
    
    # Add information about modified files
    for file in pr_metadata['pr_files'][:10]:  # Limit to 10 files to avoid token limit
        prompt += f"- {file['filename']} ({file['additions']} additions, {file['deletions']} deletions)\n"
    
    if len(pr_metadata['pr_files']) > 10:
        prompt += f"- ... and {len(pr_metadata['pr_files']) - 10} more files\n"
    
    # Add diff if it's not too large
    if len(pr_metadata['pr_diff']) < 6000:  # Limit diff size to avoid token limits
        prompt += f"\nChanges (diff):\n```\n{pr_metadata['pr_diff']}\n```\n"
    else:
        prompt += "\nThe diff is too large to include in full.\n"
    
    prompt += """
Based on the code changes, please provide an analysis following this EXACT format:

```markdown
## Code Review for PR: [title]

### Summary of Key Changes
The pull request updates the [describe what files/components were changed]. [Provide a one-sentence overview of the changes].

### Most Important Changes
- [List the most important changes, one per line]

### Potential Issues or Concerns
- **[Issue Category]**: [Description of the potential issue and its impact]
- **[Issue Category]**: [Description of another potential issue]

### Suggestions for Improvements
- **[Suggestion Category]**: [Description of suggested improvement]
- **[Suggestion Category]**: [Description of another suggestion]
```

You MUST follow this exact format with the headings exactly as shown. Use markdown formatting for emphasis and code blocks where appropriate, but maintain this structure.
"""
    
    return prompt

class PRAnalysisGraph:
    """LangGraph implementation for PR analysis."""
    
    def __init__(self):
        """Initialize the PR analysis graph."""
        # Get OpenAI API key from environment variable
        openai_api_key = os.environ.get("OPENAI_API_KEY")
        if not openai_api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        # Initialize LLM
        self.llm = ChatOpenAI(
            model="gpt-4o",  # Using GPT-4 for better analysis capability
            temperature=0,  # Low temperature for more deterministic responses
            api_key=openai_api_key
        )
        
        # Create graph
        self.graph = self._build_graph()
    
    def _analyze_pr(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process the PR data and generate an analysis using the LLM.
        
        Args:
            state: Current state containing PR metadata
            
        Returns:
            Updated state with analysis results
        """
        try:
            logger.info("Starting PR analysis")
            
            if not state.get("pr_metadata"):
                logger.warning("No PR metadata available in state")
                return {
                    "messages": [{
                        "role": "assistant", 
                        "content": "Error: No PR metadata available for analysis."
                    }]
                }
            
            pr_metadata = state.get("pr_metadata", {})
            logger.info(f"Analyzing PR: {pr_metadata.get('pr_title', 'Unknown PR')}")
            
            # Create prompt for LLM
            prompt = create_pr_analysis_prompt(pr_metadata)
            logger.info(f"Created prompt of length {len(prompt)}")
            
            # Query LLM
            logger.info("Sending request to LLM")
            llm_response = self.llm.invoke([
                {"role": "system", "content": "You are a skilled software engineer experienced in code review. Respond with clean markdown that can be easily parsed and displayed."},
                {"role": "user", "content": prompt}
            ])
            logger.info(f"Received response from LLM: {type(llm_response)}")
            
            # Extract response content - handle AIMessage object correctly
            if isinstance(llm_response, AIMessage):
                analysis_content = llm_response.content
            else:
                analysis_content = str(llm_response)
            
            logger.info(f"Extracted analysis content of length {len(analysis_content)}")
            
            # Strip any markdown code block delimiters if they exist at the beginning and end
            analysis_content = analysis_content.strip()
            if analysis_content.startswith("```markdown"):
                analysis_content = analysis_content[len("```markdown"):].strip()
            elif analysis_content.startswith("```"):
                analysis_content = analysis_content[3:].strip()
                
            if analysis_content.endswith("```"):
                analysis_content = analysis_content[:-3].strip()
            
            # Create response message
            response_message = {
                "role": "assistant",
                "content": analysis_content
            }
            
            # Create analysis result
            analysis_result = {
                "summary": analysis_content,
                "key_changes": [],  # Could be parsed from the content in future
                "potential_issues": [],
                "suggested_improvements": []
            }
            
            logger.info("PR analysis completed successfully")
            
            # Return updated state
            return {
                "messages": [response_message],
                "analysis_result": analysis_result
            }
            
        except Exception as e:
            logger.error(f"Error in PR analysis: {str(e)}", exc_info=True)
            return {
                "messages": [{
                    "role": "assistant", 
                    "content": f"Error analyzing PR: {str(e)}"
                }]
            }
    
    def _build_graph(self) -> StateGraph:
        """
        Build the LangGraph for PR analysis.
        
        Returns:
            Compiled StateGraph
        """
        # Initialize graph builder
        graph_builder = StateGraph(Dict)
        
        # Add the PR analysis node
        graph_builder.add_node("analyze_pr", self._analyze_pr)
        
        # Define the flow: START -> analyze_pr -> END
        graph_builder.add_edge(START, "analyze_pr")
        graph_builder.add_edge("analyze_pr", END)
        
        # Compile the graph
        return graph_builder.compile()
    
    def analyze(self, pr_metadata: PRMetadata) -> Dict[str, Any]:
        """
        Run the graph to analyze a PR.
        
        Args:
            pr_metadata: PR metadata to analyze
            
        Returns:
            Analysis results
        """
        try:
            logger.info("Starting LangGraph PR analysis workflow")
            
            # Initial state with PR metadata
            initial_state = {
                "messages": [],
                "pr_metadata": pr_metadata,
                "analysis_result": None
            }
            
            # Run the graph
            logger.info("Invoking LangGraph")
            result = self.graph.invoke(initial_state)
            logger.info(f"LangGraph analysis completed, result type: {type(result)}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error in LangGraph workflow: {str(e)}", exc_info=True)
            # Return a minimal valid state structure in case of error
            return {
                "messages": [{
                    "role": "assistant", 
                    "content": f"Error in LangGraph analysis workflow: {str(e)}"
                }],
                "analysis_result": {
                    "summary": f"Error: {str(e)}"
                }
            } 