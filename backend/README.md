# GitHub PR Analyzer: Backend Service

This service provides the backend AI capabilities for the GitHub PR Analyzer project. It's built with FastAPI and will use LangGraph for PR analysis workflows.

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

## API Endpoints

- `POST /analyze-pr`: Analyze a GitHub Pull Request
- `POST /generate-response`: Generate a response to a user message

## Integration with Next.js Frontend

This service is consumed by the tRPC router in the Next.js frontend. The backend service handles:

1. GitHub API integration
2. LLM processing with LangGraph (coming in Phase 3.2)
3. Response generation for user queries about PRs (coming in Phase 3.3) 