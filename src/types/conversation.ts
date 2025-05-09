/**
 * Core type definitions for the Customer Support Query System
 * @author @Larry-Osakwe
 */

/**
 * Represents a source of information for a response
 */
export interface Source {
  title: string;
  url: string;
  relevance: number;
}

/**
 * Represents evaluation scores for a response
 */
export interface Score {
  overall: number;
  keyword: number;
  llm: number;
}

/**
 * Represents a single message in the conversation
 */
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  sources?: Source[];
  scores?: Score;
}

/**
 * Response from the support service
 */
export interface SupportResponse {
  content: string;
  sources?: Source[];
  scores?: Score;
  success: boolean;
  session_id?: string;
  refinements?: number;
} 