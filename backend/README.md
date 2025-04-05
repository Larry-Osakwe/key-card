# GitHub PR Analyzer: Backend Service

This service provides the backend AI capabilities for the GitHub PR Analyzer project. It's built with FastAPI and uses LangGraph for PR analysis workflows.

## Project Structure

```
backend/
├── app/
│   ├── main.py          # FastAPI application entry point
│   ├── routers/         # API route modules 
│   ├── models/          # Data models
│   ├── services/        # Business logic services
│   │   ├── langgrapher/ # LangGraph implementation
│   │   └── github/      # GitHub API client
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
   - Add your GitHub API token (optional but recommended)
     - GitHub API token can be generated at https://github.com/settings/tokens
     - Note: Without a token, the service will be rate-limited and won't be able to access private repositories
   - Add your OpenAI API key (required for LangGraph LLM integration)
     - OpenAI API key can be obtained at https://platform.openai.com/api-keys

4. Run the service:
```bash
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000

## GitHub API Integration

The service integrates with the GitHub API to fetch data about pull requests:

- PR metadata (title, description, author, etc.)
- Files changed in the PR
- PR comments
- Full diff content (for PRs with ≤100 files changed)

### Benefits of Using a GitHub API Token

- Higher rate limits (5,000 requests/hour vs 60 for unauthenticated requests)
- Access to private repositories
- More complete data access

### Rate Limiting

The service handles GitHub API rate limits gracefully, informing the user when limits are reached.

## LangGraph Integration

The service uses LangGraph to analyze pull requests with LLMs:

- Takes PR metadata from GitHub API
- Processes it through a simple LangGraph workflow
- Generates insightful analysis using OpenAI's models

The LangGraph workflow currently includes:

1. State management with messages, PR metadata, and analysis results
2. A simple graph with one node for PR analysis
3. LLM integration using langchain_openai

### LLM Features

- Provides concise summaries of PR changes
- Identifies potential issues or concerns
- Suggests improvements
- Returns well-formatted markdown responses

## API Endpoints

- `POST /analyze-pr`: Analyze a GitHub Pull Request using GitHub API and LangGraph
- `POST /generate-response`: Generate a response to a user message using the LLM

## Integration with Next.js Frontend

This service is consumed by the tRPC router in the Next.js frontend. The backend service handles:

1. GitHub API integration
2. LLM processing with LangGraph
3. Response generation for user queries about PRs 