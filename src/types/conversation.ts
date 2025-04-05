/**
 * Core type definitions for the GitHub PR Analyzer conversation system 
 * @author @Larry-Osakwe
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