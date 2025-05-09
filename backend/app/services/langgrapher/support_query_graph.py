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
    query_type: str                          # Classification of query (simple/complex)
    query_category: str                      # Detailed category (conversational/general_knowledge/product_specific)
    
    # MCP and data state
    query_internal_docs: bool                # Whether to query internal docs
    query_web_data: bool                     # Whether to query web data
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
        
        # Add nodes for the different steps in our workflow
        graph.add_node("classify_query", self.classify_query)  # Dedicated classification node
        graph.add_node("handle_simple_query", self.handle_simple_query)  # Node for simple queries
        graph.add_node("rewrite_query", self.rewrite_query)  # Rewrite complex queries
        graph.add_node("determine_data_sources", self.determine_data_sources)  # New node to select data sources
        graph.add_node("retrieve_data_from_both_sources", self.retrieve_data_from_both_sources)  # Retrieve from selected sources
        graph.add_node("generate_response", self.generate_response)
        graph.add_node("evaluate_response", self.evaluate_response)
        
        # Add conditional edge after classification to route based on query type
        graph.add_conditional_edges(
            "classify_query",
            self.route_by_query_type,
            {
                "simple": "handle_simple_query",    # Simple queries get fast responses
                "complex": "rewrite_query"          # Complex queries go through full pipeline
            }
        )
        
        # Add edges for the complex query path with dynamic source selection
        graph.add_edge("rewrite_query", "determine_data_sources")  # First determine which sources to query
        graph.add_edge("determine_data_sources", "retrieve_data_from_both_sources")  # Then retrieve from selected sources
        graph.add_edge("retrieve_data_from_both_sources", "generate_response")
        graph.add_edge("generate_response", "evaluate_response")
        
        # Simple queries skip evaluation and data retrieval
        graph.add_edge("handle_simple_query", END)
        
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
        graph.set_entry_point("classify_query")
        
        return graph.compile()
    
    async def classify_query(self, state: QueryState) -> QueryState:
        """Classify the user query to determine its type and appropriate handling path"""
        # Get the current query
        query = state["current_query"]
        query_lower = query.lower().strip()
        
        # Use LLM to classify the query into more specific categories
        classify_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an AI assistant that classifies customer support queries. " +
                      "Your task is to determine the query type. Classify as ONE of these categories:\n\n" +
                      "1. 'conversational': Simple greetings, acknowledgments, or casual conversation\n" +
                      "   Examples: 'hello', 'thanks', 'how are you', 'goodbye'\n\n" +
                      "2. 'general_knowledge': Questions about general facts that don't require product documentation\n" +
                      "   Examples: 'what's the capital of California', 'who invented the telephone', 'what's 15 * 7'\n\n" +
                      "3. 'product_specific': Questions that require searching product documentation or databases\n" +
                      "   Examples: 'how do I reset my password', 'what are the billing options', 'troubleshoot login issues'\n\n" +
                      "Respond with EXACTLY ONE word: 'conversational', 'general_knowledge', or 'product_specific'."),
            ("user", "{query}")
        ])
        
        response = self.llm.invoke(classify_prompt.format(query=query))
        response_text = response.content.lower().strip()
        
        # Map the detailed classification to our routing categories
        if "conversational" in response_text:
            state["query_type"] = "simple"
            state["query_category"] = "conversational"
        elif "general_knowledge" in response_text:
            state["query_type"] = "simple"
            state["query_category"] = "general_knowledge"
        else:
            state["query_type"] = "complex"
            state["query_category"] = "product_specific"
        
        # Update state timestamp
        state["updated_at"] = datetime.now().isoformat()
        
        return state
        
    async def handle_simple_query(self, state: QueryState) -> QueryState:
        """Generate a response for a simple query without data retrieval"""
        # Get the current query and category
        query = state["current_query"]
        query_category = state.get("query_category", "conversational")
        
        # Different prompts based on query category
        if query_category == "general_knowledge":
            # For general knowledge questions, instruct the LLM to answer directly
            prompt = ChatPromptTemplate.from_messages([
                ("system", "You are a helpful customer support assistant. " +
                          "This question is asking for general knowledge that doesn't require product documentation. " +
                          "Answer directly and concisely using your own knowledge. " +
                          "If you're not sure, be honest about limitations."),
                ("user", "{query}")
            ])
        else:  # conversational
            # For conversational queries, keep it friendly and simple
            prompt = ChatPromptTemplate.from_messages([
                ("system", "You are a helpful customer support assistant responding to a conversational message. " +
                          "This is a casual conversation that doesn't require technical information. " +
                          "Keep your response friendly, concise, and natural."),
                ("user", "{query}")
            ])
        
        # Generate the response
        response = self.llm.invoke(prompt.format(query=query))
        
        # Update state with response and empty sources
        state["response_content"] = response.content
        state["selected_sources"] = []
        
        # Set scores for simple queries
        state["keyword_score"] = 0.95
        state["llm_score"] = 0.95
        state["response_score"] = 0.95
        state["needs_refinement"] = False
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
    
    async def determine_data_sources(self, state: QueryState) -> QueryState:
        """Determine which data sources to query based on the query type and content"""
        query = state["current_query"]
        query_category = state.get("query_category", "")
        
        # Use LLM to analyze if this query likely needs internal docs, web data, or both
        source_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an AI assistant that determines the appropriate data source for a query.\n\n"
                      "For queries about product-specific features, technical details, company policies, "
                      "or internal procedures, choose 'internal_docs'.\n\n"
                      "For queries about industry trends, third-party comparisons, general knowledge, "
                      "or information likely found on the web, choose 'web_data'.\n\n"
                      "If the query might need both sources, choose 'both'.\n\n"
                      "Respond with ONLY one of: 'internal_docs', 'web_data', or 'both'."),
            ("user", "{query}")
        ])
        
        response = self.llm.invoke(source_prompt.format(query=query))
        source_decision = response.content.lower().strip()
        
        # Set the data sources to query
        if "internal_docs" in source_decision or "both" in source_decision:
            state["query_internal_docs"] = True
        else:
            state["query_internal_docs"] = False
            
        if "web_data" in source_decision or "both" in source_decision:
            state["query_web_data"] = True
        else:
            state["query_web_data"] = False
        
        # Log the decision for debugging
        print(f"Data source decision for query '{query[:50]}...': {source_decision}")
        print(f"Will query internal docs: {state['query_internal_docs']}")
        print(f"Will query web data: {state['query_web_data']}")
        
        return state
    
    async def retrieve_data_from_both_sources(self, state: QueryState) -> QueryState:
        """Retrieve data from the selected sources based on query analysis"""
        # Get sub-queries and source decisions
        sub_queries = state["sub_queries"]
        query_internal = state.get("query_internal_docs", True)  # Default to True for backward compatibility
        query_web = state.get("query_web_data", True)  # Default to True for backward compatibility
        
        # Helper functions for data retrieval
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
        
        # Create tasks only for the selected sources
        tasks = []
        task_names = []
        
        if query_internal:
            tasks.append(asyncio.create_task(fetch_internal_docs()))
            task_names.append("internal_docs")
        else:
            # Empty results if not querying this source
            state["internal_docs_results"] = []
        
        if query_web:
            tasks.append(asyncio.create_task(fetch_web_data()))
            task_names.append("web_data")
        else:
            # Empty results if not querying this source
            state["web_data_results"] = []
        
        # Run tasks in parallel (if any)
        if tasks:
            results = await asyncio.gather(*tasks)
            
            # Update state with results based on which tasks were run
            for i, task_name in enumerate(task_names):
                if task_name == "internal_docs":
                    state["internal_docs_results"] = results[i]
                elif task_name == "web_data":
                    state["web_data_results"] = results[i]
        
        # Log the results
        print(f"Retrieved {len(state.get('internal_docs_results', []))} internal docs results")
        print(f"Retrieved {len(state.get('web_data_results', []))} web data results")
        
        state["updated_at"] = datetime.now().isoformat()
        return state
    
    async def generate_response(self, state: QueryState) -> QueryState:
        """Generate a response using the retrieved data"""
        # Get query and retrieved data
        query = state["current_query"]
        query_type = state.get("query_type", "")
        
        # For greetings and simple queries, we already set the response content in route_by_query_type
        if (query_type == "greeting" or query_type == "simple") and state.get("response_content"):
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
    
    def route_by_query_type(self, state: QueryState) -> Literal["simple", "complex"]:
        """Route the query based on its classification"""
        query_type = state.get("query_type", "")
        
        # Simple routing based on query classification
        if query_type == "simple":
            return "simple"
        else:
            return "complex"
    
    async def process(self, query: str, conversation_history: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """Process a customer support query"""
        # Initialize state
        state: QueryState = {
            "messages": conversation_history or [],
            "current_query": query,
            "sub_queries": [query],
            "query_type": "",
            "query_category": "",
            "query_internal_docs": True,  # Default to True, will be updated by determine_data_sources
            "query_web_data": True,      # Default to True, will be updated by determine_data_sources
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
        
        # Run the graph - our new flow handles all query types through the graph
        final_state = await self.graph.ainvoke(state)
        
        # Return the results
        return {
            "content": final_state["response_content"],
            "sources": final_state["selected_sources"],
            "scores": {
                "overall": final_state["response_score"] or 0.95,  # Default for simple queries
                "keyword": final_state["keyword_score"] or 0.95,  # Default for simple queries
                "llm": final_state["llm_score"] or 0.95  # Default for simple queries
            },
            "refinements": final_state["refinement_count"],
            "success": True
        }