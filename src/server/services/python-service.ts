/**
 * Service to connect to the Python backend service
 */

interface PythonServiceRequest {
  content: string;
  pr_url?: string;
  previous_content?: string;
}

interface PythonServiceResponse {
  content: string;
  success: boolean;
}

/**
 * Analyze a PR using the Python backend
 */
export async function analyzePR(request: PythonServiceRequest): Promise<PythonServiceResponse> {
  try {
    const response = await fetch(`${process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'}/analyze-pr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to analyze PR: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error analyzing PR:', error);
    return {
      content: 'Failed to analyze the PR. Please try again later.',
      success: false,
    };
  }
}

/**
 * Generate a response to a message using the Python backend
 */
export async function generateResponse(request: PythonServiceRequest): Promise<PythonServiceResponse> {
  try {
    const response = await fetch(`${process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'}/generate-response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate response: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating response:', error);
    return {
      content: 'Failed to generate a response. Please try again later.',
      success: false,
    };
  }
} 