# Customer Support Query System: Backend Service

This service provides the backend AI capabilities for the Customer Support Query System. It's built with FastAPI and uses LangGraph for query processing and FastMCP for data retrieval.

## Project Structure

```
backend/
├── app/
│   ├── main.py          # FastAPI application entry point
│   ├── routers/         # API route modules 
│   ├── models/          # Data models
│   ├── services/        # Business logic services
│   │   ├── langgrapher/ # LangGraph implementation
│   │   └── mcp/         # MCP server implementations
├── requirements.txt     # Python dependencies
├── .env                 # Environment variables (not committed to version control)
├── README.md
```

## Setup

1. Create a virtual environment:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
   - Copy the `.env` file template
   - Add your OpenAI API key (required for LangGraph LLM integration)
     - OpenAI API key can be obtained at https://platform.openai.com/api-keys
   - Optionally set paths to custom data files:
     - `INTERNAL_DOCS_PATH`: Path to your internal documentation JSON file
     - `WEB_SOURCES_PATH`: Path to your web sources JSON file

4. Run the service:
```bash
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000

## MCP Server Integration

The service implements two Model Context Protocol (MCP) servers using FastMCP:

1. **Internal Documentation Server**: Provides access to internal documentation
   - Loads documents from a JSON file or uses default examples
   - Implements search functionality with relevance scoring
   - Exposes both resources and tools via the MCP protocol

2. **Web Data Server**: Simulates retrieving data from web sources
   - Loads web sources from a JSON file or uses default examples
   - Implements search with simulated API behavior (including latency and errors)
   - Provides realistic web search results with relevance scoring

### Benefits of Using MCP

- Clear separation of concerns between data sources
- Standardized protocol for data retrieval
- Improved modularity and maintainability
- Easy to extend with additional data sources

## LangGraph Integration

The service uses LangGraph to process customer support queries:

- Analyzes and classifies the query type
- Rewrites complex queries into sub-queries
- Retrieves relevant data from MCP servers
- Generates accurate responses using OpenAI's models
- Evaluates response quality and refines if needed

The LangGraph workflow includes:

1. **Query Analysis**: Classifies queries as greetings, questions, etc.
2. **Query Rewriting**: Breaks down complex queries into specific sub-queries
3. **Data Retrieval**: Fetches information from both MCP servers in parallel
4. **Response Generation**: Creates a comprehensive answer based on retrieved data
5. **Response Evaluation**: Scores the response and determines if refinement is needed

### LLM Features

- Intelligent query classification and rewriting
- Source-based response generation
- Response quality evaluation
- Refinement loop for low-quality responses
- Returns well-formatted markdown responses with source citations

## API Endpoints

- `POST /api/chat`: Process a customer support query and return a response with sources and scores
- `GET /internal-docs/search`: Search internal documentation (MCP server endpoint)
- `GET /web-data/search`: Search web data sources (MCP server endpoint)

## Integration with Next.js Frontend

This service is consumed by the tRPC router in the Next.js frontend. The backend service handles:

1. Query processing with LangGraph
2. Data retrieval from MCP servers
3. Response generation with sources and confidence scores 