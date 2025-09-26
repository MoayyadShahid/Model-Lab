from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import openai
from dotenv import load_dotenv


def calculate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> Dict[str, Any]:
    """
    Calculate the cost of an API call based on token usage.
    Rates are as of 2025 and subject to change. Check OpenAI's pricing page for updates.
    
    Returns a dictionary with cost information.
    """
    # Load pricing from environment variables if available, otherwise use defaults
    # Format for env vars: OPENAI_PRICE_GPT4O_INPUT=0.005
    
    # Cost per 1000 tokens in USD (as of 2025, approximate values)
    default_pricing = {
        "gpt-4o": {"input": 0.005, "output": 0.015},
        "gpt-4-turbo": {"input": 0.01, "output": 0.03},
        "gpt-4": {"input": 0.03, "output": 0.06},
        "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015}
    }
    
    # Initialize model_pricing with defaults
    model_pricing = default_pricing.copy()
    
    # Try to get pricing from environment variables
    for model_key in default_pricing:
        normalized_model = model_key.replace("-", "").replace(".", "").upper()
        input_env_key = f"OPENAI_PRICE_{normalized_model}_INPUT"
        output_env_key = f"OPENAI_PRICE_{normalized_model}_OUTPUT"
        
        input_price_str = os.getenv(input_env_key)
        output_price_str = os.getenv(output_env_key)
        
        if input_price_str:
            try:
                model_pricing[model_key]["input"] = float(input_price_str)
            except ValueError:
                print(f"Warning: Invalid price format for {input_env_key}: {input_price_str}")
                
        if output_price_str:
            try:
                model_pricing[model_key]["output"] = float(output_price_str)
            except ValueError:
                print(f"Warning: Invalid price format for {output_env_key}: {output_price_str}")
    
    # Default to gpt-3.5-turbo pricing if model not found
    pricing = model_pricing.get(model, model_pricing["gpt-3.5-turbo"])
    
    input_cost = (prompt_tokens / 1000) * pricing["input"]
    output_cost = (completion_tokens / 1000) * pricing["output"]
    total_cost = input_cost + output_cost
    
    return {
        "input_cost_usd": round(input_cost, 6),
        "output_cost_usd": round(output_cost, 6),
        "total_cost_usd": round(total_cost, 6),
        "pricing_rate": pricing
    }

# Load environment variables
load_dotenv()

# Set up OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: Optional[str] = "gpt-3.5-turbo"

class ChatResponse(BaseModel):
    role: str
    content: str

@app.get("/")
async def root():
    return {"message": "Welcome to the Model Lab API"}

@app.get("/api/pricing")
async def get_pricing():
    """Return the current pricing information for all models"""
    # Re-use the logic from calculate_cost to get current pricing
    default_pricing = {
        "gpt-4o": {"input": 0.005, "output": 0.015},
        "gpt-4-turbo": {"input": 0.01, "output": 0.03},
        "gpt-4": {"input": 0.03, "output": 0.06},
        "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015}
    }
    
    # Initialize model_pricing with defaults
    model_pricing = default_pricing.copy()
    
    # Try to get pricing from environment variables
    for model_key in default_pricing:
        normalized_model = model_key.replace("-", "").replace(".", "").upper()
        input_env_key = f"OPENAI_PRICE_{normalized_model}_INPUT"
        output_env_key = f"OPENAI_PRICE_{normalized_model}_OUTPUT"
        
        input_price_str = os.getenv(input_env_key)
        output_price_str = os.getenv(output_env_key)
        
        if input_price_str:
            try:
                model_pricing[model_key]["input"] = float(input_price_str)
            except ValueError:
                pass
                
        if output_price_str:
            try:
                model_pricing[model_key]["output"] = float(output_price_str)
            except ValueError:
                pass
    
    return {
        "pricing": model_pricing,
        "note": "Costs are in USD per 1000 tokens",
        "source": "These rates are based on default values or environment variables. Check OpenAI's pricing page for the most up-to-date rates: https://openai.com/pricing"
    }

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        if not request.messages:
            raise HTTPException(status_code=400, detail="No messages provided")
        
        # Convert messages to the format expected by OpenAI
        formatted_messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        # Call OpenAI API
        try:
            response = openai.chat.completions.create(
                model=request.model,
                messages=formatted_messages
            )
            
            # Extract the response content
            response_content = response.choices[0].message.content
            
            # Extract usage statistics
            usage = response.usage
            prompt_tokens = usage.prompt_tokens
            completion_tokens = usage.completion_tokens
            total_tokens = usage.total_tokens
            
            # Calculate cost (rates as of 2025, subject to change)
            cost_info = calculate_cost(request.model, prompt_tokens, completion_tokens)
            
            # Return in the format expected by the frontend with additional metadata
            return {
                "message": {
                    "role": "assistant",
                    "content": response_content
                },
                "usage": {
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "total_tokens": total_tokens,
                    "model": request.model,
                    "cost": cost_info
                }
            }
        except Exception as e:
            # If OpenAI API fails, provide a fallback response
            print(f"Error calling OpenAI API: {str(e)}")
            return {
                "message": {
                    "role": "assistant",
                    "content": f"Sorry, there was an error processing your request: {str(e)}"
                },
                "usage": {
                    "prompt_tokens": 0,
                    "completion_tokens": 0,
                    "total_tokens": 0,
                    "model": request.model,
                    "cost": {
                        "input_cost_usd": 0,
                        "output_cost_usd": 0,
                        "total_cost_usd": 0,
                        "pricing_rate": {"input": 0, "output": 0}
                    },
                    "error": str(e)
                }
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
