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

// Configuration for retry logic
const MAX_RETRIES = 2; // Maximum 3 attempts total (initial + 2 retries)
const INITIAL_RETRY_DELAY = 8000; // 8 seconds for first retry

/**
 * Fetches from the backend with retry logic to handle cold starts
 */
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  retryCount = 0
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    // If successful, return the response
    if (response.ok) return response;
    
    // If we've reached max retries or if it's not a timeout/server error, don't retry
    if (retryCount >= MAX_RETRIES || (response.status !== 503 && response.status !== 504 && response.status !== 500)) {
      return response;
    }
    
    // Exponential backoff
    const delay = INITIAL_RETRY_DELAY * Math.pow(1.5, retryCount);
    
    console.log(`Backend service not ready, retrying in ${delay/1000} seconds... (Attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Retry with incremented counter
    return fetchWithRetry(url, options, retryCount + 1);
  } catch (error) {
    // For network errors (like service unavailable), retry if we haven't hit the limit
    if (retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(1.5, retryCount);
      console.log(`Network error, retrying in ${delay/1000} seconds... (Attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retryCount + 1);
    }
    
    // If we've used all retries, re-throw the error
    throw error;
  }
}

/**
 * Analyze a PR using the Python backend
 */
export async function analyzePR(request: PythonServiceRequest): Promise<PythonServiceResponse> {
  try {
    const response = await fetchWithRetry(
      `${process.env.BACKEND_URL || 'http://localhost:8000'}/analyze-pr`, 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );

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
    const response = await fetchWithRetry(
      `${process.env.BACKEND_URL || 'http://localhost:8000'}/generate-response`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );

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