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

3. Run the service:
```bash
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000

## API Endpoints

- `POST /analyze-pr`: Analyze a GitHub Pull Request
- `POST /generate-response`: Generate a response to a user message

## Integration with Next.js Frontend

This service is consumed by the tRPC router in the Next.js frontend. The backend service handles:

1. GitHub API integration
2. LLM processing with LangGraph
3. Response generation for user queries about PRs 