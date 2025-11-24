import { NextRequest, NextResponse } from 'next/server';

// The URL where your FastAPI backend is running
const API_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';

// Retry helper function
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });
      
      if (response.ok) {
        return response;
      }
      
      // Don't retry on 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status} ${response.statusText}`);
      }
      
      // Retry on 5xx errors (server errors)
      lastError = new Error(`Server error: ${response.status} ${response.statusText}`);
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Don't retry on AbortError (timeout)
      if (lastError.name === 'AbortError') {
        throw lastError;
      }
    }
    
    if (attempt < maxRetries) {
      // Exponential backoff: wait 1s, then 2s, then 4s
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
    }
  }
  
  throw lastError!;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stream } = body;
    
    // Validate API URL
    if (!API_URL || API_URL === 'undefined') {
      throw new Error('Backend API URL not configured');
    }
    
    // Forward the request to the Python backend with retry logic
    const backendResponse = await fetchWithRetry(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`Backend returned error ${backendResponse.status}:`, errorText);
      throw new Error(`Backend error: ${backendResponse.status} ${errorText}`);
    }
    
    // Check if streaming response
    const contentType = backendResponse.headers.get('content-type');
    if (stream === true && contentType?.includes('text/event-stream')) {
      // Forward the stream
      const stream = new ReadableStream({
        async start(controller) {
          const reader = backendResponse.body?.getReader();
          const decoder = new TextDecoder();
          
          if (!reader) {
            controller.close();
            return;
          }
          
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                controller.close();
                break;
              }
              
              controller.enqueue(value);
            }
          } catch (error) {
            console.error('Error reading stream:', error);
            controller.error(error);
          }
        },
      });
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    } else {
      // Non-streaming response
      const data = await backendResponse.json();
      
      // Ensure the response has the expected structure
      if (!data.message || !data.message.content) {
        console.error("Backend response missing message.content:", data);
        throw new Error("Invalid response format from backend");
      }
      
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error calling backend:', error);
    
    // Determine appropriate error message based on error type
    let errorMessage = "Sorry, there was an error processing your request. Please try again.";
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = "Request timed out. Please try again.";
        statusCode = 408;
      } else if (error.message.includes('Backend API URL not configured')) {
        errorMessage = "Service configuration error. Please contact support.";
        statusCode = 503;
      } else if (error.message.includes('Client error: 4')) {
        errorMessage = "Invalid request. Please check your input and try again.";
        statusCode = 400;
      } else if (error.message.includes('Server error: 5')) {
        errorMessage = "Backend service temporarily unavailable. Please try again in a moment.";
        statusCode = 503;
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        message: { role: "assistant", content: errorMessage }
      },
      { status: statusCode }
    );
  }
}
