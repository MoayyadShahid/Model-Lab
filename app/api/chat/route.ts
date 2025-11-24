import { NextRequest, NextResponse } from 'next/server';

// The URL where your FastAPI backend is running
const API_URL = 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stream } = body;
    
    // Forward the request to the Python backend
    const backendResponse = await fetch(`${API_URL}/api/chat`, {
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
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        message: { role: "assistant", content: "Sorry, there was an error processing your request. Please try again." }
      },
      { status: 500 }
    );
  }
}
