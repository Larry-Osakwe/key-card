# Customer Support Query System

A full-stack application for answering customer support queries using AI. This project includes a Next.js frontend and a Python FastAPI backend with LangGraph and MCP servers for intelligent data retrieval and response generation. The system is optimized to handle various query types efficiently, from simple conversational exchanges to complex product-specific inquiries.

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

- **Intelligent Query Classification**: System analyzes and classifies user queries into conversational, general knowledge, or product-specific categories
- **Optimized Response Paths**: Different processing paths for different query types to minimize latency
- **Query Rewriting**: Complex queries are broken down into sub-queries for better data retrieval
- **Dual MCP Servers**: Separate servers for internal documentation and web data
- **Source Verification**: Responses include verified sources with relevance scores
- **Response Evaluation**: System evaluates response quality and can refine answers if needed
- **Conversation Memory**: The AI remembers context from previous messages in the conversation
- **Markdown Rendering**: Beautiful rendering of markdown content including code blocks and tables

## System Architecture

### Query Processing Flow

The system uses a LangGraph-based architecture to process queries through different paths based on their classification:

1. **Query Classification**: All queries are first classified into one of three categories:
   - Conversational: Simple greetings, acknowledgments, or casual conversation
   - General Knowledge: Questions about general facts that don't require product documentation
   - Product-specific: Questions that require searching product documentation or databases

2. **Processing Paths**:
   - **Simple Path**: Conversational and general knowledge queries bypass data retrieval and go directly to response generation
   - **Complex Path**: Product-specific queries go through query rewriting, data retrieval from both MCP servers, source selection, response generation, and evaluation

3. **Response Generation**: Responses are generated using appropriate prompts based on query type, with sources included for product-specific queries

### MCP Integration

The system uses two Model Context Protocol (MCP) servers:

1. **Internal Documentation Server**: Contains company-specific documentation, product guides, and technical information
2. **Web Data Server**: Contains publicly available information from the web

Both servers are queried in parallel for complex queries, and the most relevant sources are selected for response generation.

## Optimization Techniques

The system has been optimized for both performance and accuracy:

1. **Intelligent Query Routing**: By classifying queries early in the process, we avoid unnecessary data retrieval and LLM calls for simple queries

2. **Parallel Data Retrieval**: Internal documentation and web data are retrieved simultaneously to reduce latency

3. **Response Quality Evaluation**: Responses are evaluated for quality and can be refined if necessary

4. **Contextual Response Generation**: Different prompts are used based on query type to generate more appropriate responses

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

## Challenges and Solutions

### Challenges Faced

1. **Query Classification Accuracy**: Initially, the system struggled to accurately classify simple conversational queries, often sending them through the full retrieval pipeline unnecessarily.
   - **Solution**: Implemented a more sophisticated classification system using LLM with clear category definitions and examples.

2. **Performance with Simple Queries**: Simple queries like greetings or general knowledge questions were taking too long to process.
   - **Solution**: Created dedicated processing paths for different query types, allowing simple queries to bypass expensive retrieval operations.

3. **Balancing Accuracy and Speed**: Finding the right balance between thorough data retrieval and quick response times.
   - **Solution**: Implemented parallel data retrieval and intelligent source selection to maintain accuracy while improving speed.

4. **Handling Out-of-Domain Questions**: The system initially struggled with questions outside the product domain.
   - **Solution**: Added a "general knowledge" category to handle these queries appropriately without searching documentation.

### How MCP Improved Modularity

The Model Context Protocol (MCP) significantly improved the system's modularity in several ways:

1. **Separation of Concerns**: By using separate MCP servers for internal documentation and web data, we achieved clear separation of concerns. Each server can be maintained, updated, or replaced independently without affecting the others.

2. **Standardized Interface**: MCP provides a standardized interface for retrieving information, making it easy to add new data sources or replace existing ones without changing the core application logic.

3. **Parallel Processing**: The modular design allowed us to implement parallel data retrieval from multiple sources, improving performance without increasing complexity.

4. **Scalability**: Each MCP server can be scaled independently based on its specific load and requirements, allowing for more efficient resource allocation.

5. **Enhanced Testing**: The modular architecture makes it easier to test individual components in isolation, improving code quality and reliability.

The MCP-based architecture proved to be particularly valuable when optimizing the system for different query types, as it allowed us to selectively engage specific data sources based on the query classification.

## Deployment

This application can be deployed as two separate services:

1. **Frontend**: Deploy the Next.js app on [Vercel](https://vercel.com)
2. **Backend**: Deploy the FastAPI app on services like [Render](https://render.com), [Railway](https://railway.app), or [AWS Lambda](https://aws.amazon.com/lambda/)

Make sure to update environment variables on your deployment platforms.
