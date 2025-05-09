# Customer Support Query System

A full-stack application for answering customer support queries using AI. This project includes a Next.js frontend and a Python FastAPI backend with LangGraph and MCP servers for intelligent data retrieval and response generation.

## Project Overview

This application enables users to:
- Submit customer support queries through a chat interface
- Receive accurate responses with verified sources
- View confidence scores and source references for each response
- Experience an intelligent system that can handle various query types

## Project Structure

The project is organized as a monorepo with two main components:

```
/
├── src/                 # Next.js frontend
│   ├── app/             # Next.js app router
│   ├── components/      # React components
│   ├── server/          # tRPC server and API routes
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
│
├── backend/             # Python FastAPI backend
│   ├── app/             # FastAPI application
│   │   ├── models/      # Data models
│   │   ├── routers/     # API route modules
│   │   ├── services/    # Service modules
│   │   │   ├── mcp/     # MCP server implementations
│   │   │   └── langgrapher/ # LangGraph implementation
│   │   └── main.py      # FastAPI entrypoint
│   ├── requirements.txt # Python dependencies
│   └── .env             # Backend environment variables
│
└── .env.local           # Frontend environment variables
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Python 3.9+
- OpenAI API key (required)

### Setup Environment Variables

1. Create or update `.env.local` in the root directory:
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
PYTHON_SERVICE_URL=http://localhost:8000
```

2. Create or update `backend/.env`:
```
OPENAI_API_KEY=your_openai_key
INTERNAL_DOCS_PATH=path/to/internal_docs.json  # Optional
WEB_SOURCES_PATH=path/to/web_sources.json     # Optional
```

### Install Dependencies

1. Frontend (Next.js):
```bash
npm install
```

2. Backend (Python):
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Run the Application

1. Start the Python backend:
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

2. In a new terminal, start the Next.js frontend:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Features

- **Intelligent Query Analysis**: System analyzes and classifies user queries to determine the best approach
- **Query Rewriting**: Complex queries are broken down into sub-queries for better data retrieval
- **Dual MCP Servers**: Separate servers for internal documentation and web data
- **Source Verification**: Responses include verified sources with relevance scores
- **Response Evaluation**: System evaluates response quality and can refine answers if needed
- **Conversation Memory**: The AI remembers context from previous messages in the conversation
- **Markdown Rendering**: Beautiful rendering of markdown content including code blocks and tables

## Tech Stack

### Frontend
- [Next.js](https://nextjs.org) - React framework
- [TypeScript](https://www.typescriptlang.org) - Type-safe JavaScript
- [tRPC](https://trpc.io) - End-to-end typesafe APIs
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [React Markdown](https://github.com/remarkjs/react-markdown) - Markdown rendering

### Backend
- [FastAPI](https://fastapi.tiangolo.com) - Modern Python web framework
- [LangGraph](https://github.com/langchain-ai/langgraph) - Framework for building stateful LLM applications
- [FastMCP](https://github.com/anthropics/FastMCP) - Model Context Protocol server implementation
- [LangChain](https://langchain.com) - Building applications with LLMs
- [OpenAI](https://openai.com) - GPT-4o API for text generation

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [LangGraph Documentation](https://python.langchain.com/docs/langgraph)
- [FastMCP Documentation](https://github.com/jlowin/fastmcp)

## Deployment

This application can be deployed as two separate services:

1. **Frontend**: Deploy the Next.js app on [Vercel](https://vercel.com)
2. **Backend**: Deploy the FastAPI app on services like [Render](https://render.com), [Railway](https://railway.app), or [AWS Lambda](https://aws.amazon.com/lambda/)

Make sure to update environment variables on your deployment platforms.
