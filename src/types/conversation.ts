/**
 * Core type definitions for the GitHub PR Analyzer conversation system
 */

/**
 * Represents a single message in the conversation
 */
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  prMetadata?: {
    url?: string;
    summary?: string;
  };
}

/**
 * Represents the current state of a conversation
 */
export interface ConversationState {
  messages: Message[];
  isAnalyzing: boolean;
} 