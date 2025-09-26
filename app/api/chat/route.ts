import { NextRequest, NextResponse } from 'next/server';

// The URL where your FastAPI backend is running
const API_URL = 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Frontend sending to backend:", body);
    
    // Forward the request to the Python backend
    console.log(`Sending request to ${API_URL}/api/chat`);
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend returned error ${response.status}:`, errorText);
      throw new Error(`Backend error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Response from backend:", JSON.stringify(data, null, 2));
    
    // Ensure the response has the expected structure
    if (!data.message || !data.message.content) {
      console.error("Backend response missing message.content:", data);
      throw new Error("Invalid response format from backend");
    }
    
    return NextResponse.json(data);
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
