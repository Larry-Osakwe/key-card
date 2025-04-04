# GitHub PR Analyzer: Product Requirements Document

## Overview
GitHub PR Analyzer is an AI-powered tool designed to simplify code review by automatically analyzing GitHub pull requests. The application provides concise, insightful summaries of code changes to help developers and reviewers understand the impact of PRs without manually examining each line of code.

## Target Users
- Software developers seeking quick understanding of PRs
- Code reviewers needing to prioritize and understand changes
- Engineering managers reviewing team contributions
- Hiring managers evaluating technical capabilities

## Problem Statement
GitHub pull requests often contain numerous changes across multiple files, making it difficult and time-consuming to:
1. Understand the overall purpose and impact of changes
2. Identify potential issues or areas requiring closer review
3. Maintain context across large changesets

## MVP Features

### Core Functionality
1. **Chat Interface**
   - Single-page Next.js application with minimalist design
   - Text input for messages and PR URL submission
   - Message history displayed in chronological order
   - Support for markdown rendering in responses

2. **PR Analysis**
   - Accept GitHub PR URLs as input
   - Extract PR diff content from GitHub
   - Process the diff using LLM to summarize changes
   - Return structured analysis highlighting key modifications

3. **Conversation Persistence**
   - Store chat messages and metadata in Supabase
   - Maintain ephemeral sessions (cleared on page refresh)
   - Future consideration: Basic authentication for persistent chats across sessions

### Technical Architecture

#### Frontend
- **Framework**: Next.js with TypeScript
- **UI Components**: React with Tailwind CSS
- **State Management**: React Context for conversation state
- **API Communication**: tRPC for type-safe API calls
- **Types**:
  ```typescript
  interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
    prMetadata?: {
      url?: string;
      summary?: string;
    };
  }
  ```

#### Backend
- **Framework**: Python-based API service
- **AI Orchestration**: LangGraph for managing LLM workflow
- **Language Model**: Integration with GPT-4 or equivalent LLM
- **API Layer**: FastAPI or similar for exposing endpoints

#### Data Storage
- **MVP Approach**: Client-side state management only
  - Ephemeral conversations stored in React Context
  - No persistence across page refreshes
  - Simple in-memory message history
- **Future Considerations**:
  - Supabase (PostgreSQL) integration when adding user authentication
  - Drizzle ORM for type-safe database operations
  - Schema for persistent storage:
    - Conversations (id, user_id, created_at, updated_at)
    - Messages (id, conversation_id, content, role, created_at)
    - PR Metadata (id, conversation_id, pr_url, summary, created_at)

## User Flow
1. User opens the application
2. System creates a new ephemeral session
3. User sends a message with a GitHub PR URL
4. System extracts PR diff from GitHub
5. Backend processes diff through LangGraph/LLM pipeline
6. System returns PR summary to user
7. Conversation continues with follow-up questions/responses
8. Session data persists until page refresh

## Technical Implementation Details

### GitHub PR Processing
1. Extract PR URL from user message
2. Fetch PR data using GitHub API
3. Extract diff content
4. Process through LLM with appropriate prompt engineering
5. Structure response for readability

### LangGraph Flow
1. **Input Node**: Receive PR diff content
2. **Analysis Node**: LLM summarizes key changes
3. **Context Node**: Maintain conversation context
4. **Response Node**: Format and return PR analysis

### Data Persistence
- Client-side state management using React Context
- No database integration in MVP phase
- Message history maintained only during active session
- Clean slate on page refresh
- Future database integration planned with user authentication implementation

## Non-Functional Requirements
1. **Performance**: 
   - Response time under 5 seconds for PR analysis
   - Smooth UI interactions with appropriate loading states

2. **Security**:
   - No storage of GitHub credentials
   - Public PR access only in MVP

3. **Scalability**:
   - Stateless design to support horizontal scaling
   - Efficient database queries

4. **Accessibility**:
   - Meet WCAG 2.1 AA standards
   - Support keyboard navigation

## Future Considerations
1. User authentication and persistent chat history
2. Support for private repositories
3. Integration with GitHub API for PR comments
4. File-specific analysis and deeper technical insights
5. Team collaboration features

## Success Metrics
1. Accuracy of PR summaries
2. Time saved in PR review process
3. User satisfaction and engagement
4. Technical demonstration quality for hiring managers

## Implementation Phases
1. **MVP Development** (Current)
   - Basic chat interface
   - PR URL processing
   - LangGraph integration
   - Ephemeral sessions

2. **Enhanced Features** (Future)
   - User authentication
   - Persistent chat history
   - Improved PR analysis

## Technical Demonstration Highlights
- LangGraph orchestration approach
- tRPC implementation for type safety
- Next.js and Supabase integration with Drizzle ORM
- AI prompt engineering techniques
- Clean architecture and separation of concerns 