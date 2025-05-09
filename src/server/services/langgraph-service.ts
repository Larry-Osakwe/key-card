/**
 * Service to connect to the LangGraph backend service for customer support
 */

import { SupportResponse } from '@/types/conversation';

/**
 * Generate a support response using the backend API
 */
export async function generateResponse(message: string, previousContent?: string): Promise<SupportResponse> {
  try {
    const response = await fetch(
      `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message,
          previous_content: previousContent || null,
          session_id: null 
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to generate support response: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.content,
      sources: data.sources,
      scores: data.scores,
      success: true,
      session_id: data.session_id
    };
  } catch (error) {
    console.error('Error generating support response:', error);
    return {
      content: 'Failed to generate a support response. Please try again later.',
      success: false,
    };
  }
}