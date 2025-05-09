from typing import TypedDict, List, Dict, Any, Annotated, Optional, Literal
import uuid
from datetime import datetime
import httpx
import json
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
import asyncio

# Define the state for our LangGraph
class QueryState(TypedDict):
    # Chat and query state
    messages: Annotated[List[Dict[str, Any]], "add_messages"]  # Chat history
    current_query: str                       # Raw user query
    sub_queries: List[str]                   # Decomposed queries
    query_type: str                          # Classification of query
    
    # MCP and data state
    internal_docs_results: List[Dict]        # Results from internal docs
    web_data_results: List[Dict]            # Results from web data
    selected_sources: List[Dict]             # Selected sources for response
    
    # Evaluation state
    response_score: Optional[float]          # Overall score
    keyword_score: Optional[float]           # Keyword match score
    llm_score: Optional[float]               # LLM evaluation score
    refinement_count: int                    # Number of refinements
    needs_refinement: bool                   # Whether query needs refinement
    
    # Response state
    response_content: Optional[str]          # Generated response content
    
    # Session state
    session_id: str                          # Unique chat session ID
    created_at: str                          # Session start time
    updated_at: str                          # Last update time

class SupportQueryGraph:
    """LangGraph implementation for customer support queries"""
    
    def __init__(self):
        """Initialize the support query graph"""
        # Initialize LLM
        self.llm = ChatOpenAI(model="gpt-4o", temperature=0.7)
        
        # Create the graph
        self.graph = self._build_graph()
    
    def _build_graph(self) -> StateGraph:
        """Build the LangGraph for query processing"""
        # Create the graph
        graph = StateGraph(QueryState)
        
        # Add nodes
        graph.add_node("analyze_query", self.analyze_query)
        graph.add_node("rewrite_query", self.rewrite_query)
        graph.add_node("retrieve_data_from_both_sources", self.retrieve_data_from_both_sources)
        graph.add_node("generate_response", self.generate_response)
        graph.add_node("evaluate_response", self.evaluate_response)
        
        # Add conditional edge after analysis to handle different query types
        graph.add_conditional_edges(
            "analyze_query",
            self.route_by_query_type,
            {
                "greeting": "generate_response",  # Skip data retrieval for greetings
                "complex": "rewrite_query"        # Full processing for complex queries
            }
        )
        
        # Add edges
        graph.add_edge("rewrite_query", "retrieve_data_from_both_sources")
        graph.add_edge("retrieve_data_from_both_sources", "generate_response")
        graph.add_edge("generate_response", "evaluate_response")
        
        # Add conditional edge for refinement
        graph.add_conditional_edges(
            "evaluate_response",
            self.should_refine,
            {
                "refine": "rewrite_query",
                "complete": END
            }
        )
        
        # Set entry point
        graph.set_entry_point("analyze_query")
        
        return graph.compile()
    
    async def analyze_query(self, state: QueryState) -> QueryState:
        """Analyze the user query to determine its type and characteristics"""
        # Get the current query
        query = state["current_query"]
        
        # Simple pattern matching for greetings and casual messages
        # This is faster than an LLM call for very simple cases
        query_lower = query.lower().strip()
        
        # Check for greeting patterns
        greeting_patterns = ["hi", "hello", "hey", "greetings", "howdy"]
        is_simple_greeting = False
        
        # Check if it's a simple greeting (allowing for repeated characters like "hiii")
        for pattern in greeting_patterns:
            # Basic pattern: starts with greeting pattern
            if query_lower.startswith(pattern):
                remaining = query_lower[len(pattern):]
                # Check if the rest is just repeated characters or punctuation
                if not remaining or all(c in "!.?i " for c in remaining):
                    is_simple_greeting = True
                    break
        
        if is_simple_greeting:
            state["query_type"] = "greeting"
            return state
            
        # For slightly more complex queries, use the LLM to classify
        if len(query.split()) <= 5:
            # Use a simpler prompt for short queries to improve performance
            classify_prompt = ChatPromptTemplate.from_messages([
                ("system", "Classify this query as one of: greeting, question, command, statement, or other."),
                ("user", "{query}")
            ])
            
            response = self.llm.invoke(classify_prompt.format(query=query))
            response_text = response.content.lower()
            
            # Extract query type from response
            if "greeting" in response_text:
                state["query_type"] = "greeting"
            elif "question" in response_text:
                state["query_type"] = "question"
            elif "command" in response_text:
                state["query_type"] = "command"
            elif "statement" in response_text:
                state["query_type"] = "statement"
            else:
                state["query_type"] = "other"
                
            return state
            
        # For more complex queries, perform a more detailed analysis
        analyze_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an AI assistant that analyzes customer support queries. "
                      "Classify the query type and determine key aspects of the query."),
            ("user", "{query}")
        ])
        
        response = self.llm.invoke(analyze_prompt.format(query=query))
        
        # Extract query type from response (simplified for example)
        query_type = "general_inquiry"  # Default
        if "reset" in query.lower() or "restart" in query.lower():
            query_type = "troubleshooting"
        elif "account" in query.lower() or "password" in query.lower():
            query_type = "account_issue"
        elif "billing" in query.lower() or "payment" in query.lower():
            query_type = "billing_inquiry"
            
        # Update state
        state["query_type"] = query_type
        state["updated_at"] = datetime.now().isoformat()
        
        return state
    
    async def rewrite_query(self, state: QueryState) -> QueryState:
        """Rewrite the query into multiple sub-queries if needed"""
        # Get the current query and type
        query = state["current_query"]
        query_type = state["query_type"]
        
        # Use LLM to rewrite the query
        rewrite_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an AI assistant that rewrites customer support queries into "
                        "specific sub-queries to help retrieve relevant information. "
                        "For complex queries, break them down into 2-3 specific sub-queries. "
                        "For simple queries, you can keep just one query but make it more specific."),
            ("user", "Query: {query}\nQuery Type: {query_type}")
        ])
        
        response = self.llm.invoke(rewrite_prompt.format(query=query, query_type=query_type))
        
        # Extract sub-queries (simplified for example)
        # In a real implementation, you'd parse the LLM response more carefully
        sub_queries = [query]  # Default to original query
        
        # Simple parsing logic (would be more sophisticated in production)
        if "1." in response.content and "2." in response.content:
            parts = response.content.split("\n")
            sub_queries = [p.split(". ", 1)[1] for p in parts if p.strip().startswith("1.") or p.strip().startswith("2.")]
        
        # Update state
        state["sub_queries"] = sub_queries
        state["refinement_count"] = state.get("refinement_count", 0) + 1
        state["updated_at"] = datetime.now().isoformat()
        
        return state
    
    async def retrieve_data_from_both_sources(self, state: QueryState) -> QueryState:
        """Retrieve data from both internal docs and web data in parallel"""
        # Get sub-queries
        sub_queries = state["sub_queries"]
        
        # Create tasks for both data sources to run in parallel
        async def fetch_internal_docs():
            results = []
            for query in sub_queries:
                try:
                    async with httpx.AsyncClient() as client:
                        response = await client.get(
                            "http://localhost:8000/internal-docs/search",
                            params={"query": query}
                        )
                        
                        if response.status_code == 200:
                            # Parse the nested JSON structure
                            outer_json = response.json()
                            if outer_json and isinstance(outer_json, list) and len(outer_json) > 0:
                                # Extract the text field which contains the actual results
                                text_content = outer_json[0].get("text", "[]")
                                # Parse the inner JSON
                                try:
                                    docs_results = json.loads(text_content)
                                    # Add source type to each result if not already present
                                    for result in docs_results:
                                        if "source_type" not in result:
                                            result["source_type"] = "internal"
                                    results.extend(docs_results)
                                except json.JSONDecodeError as je:
                                    print(f"Error parsing internal docs JSON: {je}")
                            else:
                                print(f"Unexpected internal docs response format: {outer_json}")
                        else:
                            print(f"Error searching internal docs: {response.text}")
                except Exception as e:
                    print(f"Exception searching internal docs: {str(e)}")
            return results
            
        async def fetch_web_data():
            results = []
            for query in sub_queries:
                try:
                    async with httpx.AsyncClient() as client:
                        response = await client.get(
                            "http://localhost:8000/web-data/search",
                            params={"query": query}
                        )
                        
                        if response.status_code == 200:
                            # Parse the nested JSON structure
                            outer_json = response.json()
                            if outer_json and isinstance(outer_json, list) and len(outer_json) > 0:
                                # Extract the text field which contains the actual results
                                text_content = outer_json[0].get("text", "[]")
                                # Parse the inner JSON
                                try:
                                    web_results = json.loads(text_content)
                                    # Add source type to each result if not already present
                                    for result in web_results:
                                        if "source_type" not in result:
                                            result["source_type"] = "web"
                                    results.extend(web_results)
                                except json.JSONDecodeError as je:
                                    print(f"Error parsing web data JSON: {je}")
                            else:
                                print(f"Unexpected web data response format: {outer_json}")
                        else:
                            print(f"Error searching web data: {response.text}")
                except Exception as e:
                    print(f"Exception searching web data: {str(e)}")
            return results
        
        # Run both tasks in parallel
        internal_docs_task = asyncio.create_task(fetch_internal_docs())
        web_data_task = asyncio.create_task(fetch_web_data())
        
        # Wait for both tasks to complete
        internal_docs_results, web_data_results = await asyncio.gather(
            internal_docs_task, 
            web_data_task
        )
        
        # Update state with results from both sources
        state["internal_docs_results"] = internal_docs_results
        state["web_data_results"] = web_data_results
        state["updated_at"] = datetime.now().isoformat()
        
        return state
    
    async def generate_response(self, state: QueryState) -> QueryState:
        """Generate a response using the retrieved data"""
        # Get query and retrieved data
        query = state["current_query"]
        query_type = state.get("query_type", "")
        
        # For greetings, we already set the response content in route_by_query_type
        if query_type == "greeting" and state.get("response_content"):
            # Set empty selected sources since we didn't retrieve any
            state["selected_sources"] = []
            return state
            
        # For other query types, proceed with normal response generation
        internal_results = state.get("internal_docs_results", [])
        web_results = state.get("web_data_results", [])
        
        # Select the most relevant sources
        # In a real implementation, you'd have more sophisticated selection logic
        all_sources = internal_results + web_results
        all_sources.sort(key=lambda x: x.get("relevance", 0), reverse=True)
        selected_sources = all_sources[:5]  # Top 5 most relevant sources
        
        # Format sources for the prompt
        sources_text = ""
        for i, source in enumerate(selected_sources, 1):
            title = source.get("title", "Untitled")
            content = source.get("content") or source.get("snippet", "")
            sources_text += f"Source {i}: {title}\n{content}\n\n"
        
        # Use LLM to generate response
        response_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a helpful customer support assistant. "
                        "Use the provided sources to answer the user's question accurately. "
                        "If the sources don't contain relevant information, say so honestly. "
                        "Cite sources when appropriate."),
            ("user", "Question: {query}\n\nSources:\n{sources}")
        ])
        
        response = self.llm.invoke(response_prompt.format(query=query, sources=sources_text))
        
        # Update state
        state["response_content"] = response.content
        state["selected_sources"] = selected_sources
        state["updated_at"] = datetime.now().isoformat()
        
        return state
    
    async def evaluate_response(self, state: QueryState) -> QueryState:
        """Evaluate the generated response for relevance and accuracy"""
        # Get query, response, and sources
        query = state["current_query"]
        response_content = state["response_content"]
        selected_sources = state["selected_sources"]
        
        # Simple keyword matching score
        query_keywords = set(query.lower().split())
        response_keywords = set(response_content.lower().split())
        keyword_overlap = len(query_keywords.intersection(response_keywords))
        keyword_score = min(1.0, keyword_overlap / max(1, len(query_keywords)))
        
        # Use LLM to evaluate response quality
        eval_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an AI assistant that evaluates the quality of customer support responses. "
                        "Rate the response on a scale of 0.0 to 1.0 based on how well it answers the query "
                        "using the provided sources."),
            ("user", "Query: {query}\n\nResponse: {response}\n\nPlease provide a score between 0.0 and 1.0.")
        ])
        
        eval_response = self.llm.invoke(eval_prompt.format(query=query, response=response_content))
        
        # Extract LLM score (simplified for example)
        # In a real implementation, you'd parse the LLM response more carefully
        llm_score = 0.8  # Default
        for line in eval_response.content.split("\n"):
            if "score" in line.lower() and ": " in line:
                try:
                    score_text = line.split(": ")[1].strip()
                    llm_score = float(score_text)
                    break
                except (ValueError, IndexError):
                    pass
        
        # Calculate overall score
        overall_score = (keyword_score * 0.3) + (llm_score * 0.7)
        
        # Determine if refinement is needed
        needs_refinement = overall_score < 0.8 and state.get("refinement_count", 0) < 3
        
        # Update state
        state["keyword_score"] = keyword_score
        state["llm_score"] = llm_score
        state["response_score"] = overall_score
        state["needs_refinement"] = needs_refinement
        state["updated_at"] = datetime.now().isoformat()
        
        return state
    
    def should_refine(self, state: QueryState) -> Literal["refine", "complete"]:
        """Determine if the query should be refined based on evaluation"""
        if state.get("needs_refinement", False):
            return "refine"
        return "complete"
    
    def route_by_query_type(self, state: QueryState) -> Literal["greeting", "complex"]:
        """Route the query based on its type"""
        query_type = state.get("query_type", "")
        
        if query_type == "greeting":
            # For greetings, generate a standard response without data retrieval
            state["response_content"] = "Hello! How can I assist you today? If you have a question, feel free to ask, and I'll do my best to help."
            return "greeting"
            
        return "complex"
    
    async def process(self, query: str, conversation_history: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """Process a customer support query"""
        # Initialize state
        state: QueryState = {
            "messages": conversation_history or [],
            "current_query": query,
            "sub_queries": [query],
            "query_type": "",
            "internal_docs_results": [],
            "web_data_results": [],
            "selected_sources": [],
            "response_score": None,
            "keyword_score": None,
            "llm_score": None,
            "refinement_count": 0,
            "needs_refinement": False,
            "response_content": None,
            "session_id": str(uuid.uuid4()),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # For very simple queries (1-2 words), bypass the graph and use a simplified flow
        if len(query.strip().split()) <= 2 and not any(char in query for char in "?!.,:;"):
            # Analyze query type
            if query.lower() in ["hi", "hello", "hey", "greetings"]:
                state["query_type"] = "greeting"
                state["response_content"] = "Hello! How can I assist you today? If you have a question, feel free to ask, and I'll do my best to help."
                return {
                    "content": state["response_content"],
                    "sources": [],
                    "scores": {
                        "overall": 0.9,
                        "keyword": 0.9,
                        "llm": 0.9
                    },
                    "refinements": 0,
                    "success": True
                }
        
        # Run the graph
        final_state = await self.graph.ainvoke(state)
        
        # Return the results
        return {
            "content": final_state["response_content"],
            "sources": final_state["selected_sources"],
            "scores": {
                "overall": final_state["response_score"],
                "keyword": final_state["keyword_score"],
                "llm": final_state["llm_score"]
            },
            "refinements": final_state["refinement_count"],
            "success": True
        }