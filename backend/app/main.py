from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import openai
import requests
import json
from dotenv import load_dotenv


def calculate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> Dict[str, Any]:
    """
    Calculate the cost of an API call based on token usage.
    Rates are as of 2025 and subject to change. Check OpenAI's pricing page for updates.
    
    Returns a dictionary with cost information.
    """
    # Load pricing from environment variables if available, otherwise use defaults
    # Format for env vars: OPENAI_PRICE_GPT4O_INPUT=0.005
    
    # Cost per 1000 tokens in USD (approximate values based on OpenRouter pricing)
    default_pricing = {
        # OpenAI Models
        "openai/gpt-4o": {"input": 0.005, "output": 0.015},
        "openai/gpt-4o-mini": {"input": 0.0015, "output": 0.006},
        "openai/gpt-4-turbo": {"input": 0.01, "output": 0.03},
        "openai/gpt-4": {"input": 0.03, "output": 0.06},
        "openai/gpt-4-vision-preview": {"input": 0.01, "output": 0.03},
        "openai/gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
        
        # Anthropic Models
        "anthropic/claude-3-5-sonnet": {"input": 0.003, "output": 0.015},
        "anthropic/claude-3-opus": {"input": 0.015, "output": 0.075},
        "anthropic/claude-3-sonnet": {"input": 0.003, "output": 0.015},
        "anthropic/claude-3-haiku": {"input": 0.0025, "output": 0.0125},
        
        # DeepSeek Models
        "deepseek-ai/deepseek-chat": {"input": 0.0025, "output": 0.0075},
        "deepseek-ai/deepseek-coder": {"input": 0.0015, "output": 0.005}
    }
    
    # Strip provider prefix if present (e.g., "openai/gpt-4o" -> "gpt-4o") for env var lookups
    model_base = model.split("/")[-1] if "/" in model else model
    
    # Initialize model_pricing with defaults
    model_pricing = default_pricing.copy()
    
    # Try to get pricing from environment variables
    for model_key in default_pricing:
        # Extract base model name without provider prefix for env var lookups
        base_model_key = model_key.split("/")[-1] if "/" in model_key else model_key
        normalized_model = base_model_key.replace("-", "").replace(".", "").upper()
        input_env_key = f"MODEL_PRICE_{normalized_model}_INPUT"
        output_env_key = f"MODEL_PRICE_{normalized_model}_OUTPUT"
        
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
    
    # Default to openai/gpt-3.5-turbo pricing if model not found
    default_model = "openai/gpt-3.5-turbo"
    pricing = model_pricing.get(model, model_pricing.get(default_model, {"input": 0.0005, "output": 0.0015}))
    
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

# Set up OpenRouter API key (fallback to OpenAI key for backward compatibility)
openai.api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
openai.base_url = "https://openrouter.ai/api/v1"

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
    model: Optional[str] = "openai/gpt-3.5-turbo"

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
        # OpenAI Models
        "openai/gpt-4o": {"input": 0.005, "output": 0.015},
        "openai/gpt-4o-mini": {"input": 0.0015, "output": 0.006},
        "openai/gpt-4-turbo": {"input": 0.01, "output": 0.03},
        "openai/gpt-4": {"input": 0.03, "output": 0.06},
        "openai/gpt-4-vision-preview": {"input": 0.01, "output": 0.03},
        "openai/gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
        
        # Anthropic Models
        "anthropic/claude-3-5-sonnet": {"input": 0.003, "output": 0.015},
        "anthropic/claude-3-opus": {"input": 0.015, "output": 0.075},
        "anthropic/claude-3-sonnet": {"input": 0.003, "output": 0.015},
        "anthropic/claude-3-haiku": {"input": 0.0025, "output": 0.0125},
        
        # DeepSeek Models
        "deepseek-ai/deepseek-chat": {"input": 0.0025, "output": 0.0075},
        "deepseek-ai/deepseek-coder": {"input": 0.0015, "output": 0.005}
    }
    
    # Initialize model_pricing with defaults
    model_pricing = default_pricing.copy()
    
    # Try to get pricing from environment variables
    for model_key in default_pricing:
        # Extract base model name without provider prefix for env var lookups
        base_model_key = model_key.split("/")[-1] if "/" in model_key else model_key
        normalized_model = base_model_key.replace("-", "").replace(".", "").upper()
        input_env_key = f"MODEL_PRICE_{normalized_model}_INPUT"
        output_env_key = f"MODEL_PRICE_{normalized_model}_OUTPUT"
        
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
        "source": "These rates are based on default values or environment variables. Check OpenRouter's pricing page for the most up-to-date rates: https://openrouter.ai/pricing"
    }

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        if not request.messages:
            raise HTTPException(status_code=400, detail="No messages provided")
        
        # Convert messages to the format expected by OpenAI
        formatted_messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        # Call OpenRouter API
        try:
            # Adjust model name format if needed
            model = request.model
            
            # Handle model name mapping for special cases
            # Anthropic models
            if model.lower() in ["claude-3.5-sonnet", "claude-3-5-sonnet", "claude-3.5", "claude3.5", "claude3.5-sonnet"]:
                model = "anthropic/claude-3.5-sonnet"  # Note: OpenRouter uses the dash format
            elif model.lower() in ["claude-3-opus", "claude3-opus", "claude3opus", "claude-opus"]:
                model = "anthropic/claude-3-opus"
            elif model.lower() in ["claude-3-sonnet", "claude3-sonnet", "claude3sonnet", "claude-sonnet"]:
                model = "anthropic/claude-3-sonnet"
            elif model.lower() in ["claude-3-haiku", "claude3-haiku", "claude3haiku", "claude-haiku"]:
                model = "anthropic/claude-3-haiku"
            
            # DeepSeek models
            elif model.lower() in ["deepseek", "deepseek-chat", "deepseek-llm"]:
                model = "deepseek/deepseek-v3.2-exp"
            elif model.lower() in ["deepseek-coder", "deepseekcoder"]:
                model = "deepseek/deepseek-chat-v3.1:free"
                
            # OpenAI models - these usually don't need special mapping as they follow the standard naming,
            # but add convenience aliases
            elif model.lower() in ["gpt4o", "4o"]:
                model = "openai/gpt-4o"
            elif model.lower() in ["gpt4o-mini", "4o-mini", "gpt-4o-mini"]:
                model = "openai/gpt-4o-mini"
            elif model.lower() in ["gpt-4-vision", "gpt4vision"]:
                model = "openai/gpt-4-vision-preview"
            # Add other special cases as needed
            
            # Default case - if no special mapping and no provider prefix
            elif not ('/' in model):
                # Default to OpenAI for models without a provider prefix
                model = f"openai/{model}"
                
            # Use direct API calls to OpenRouter instead of OpenAI SDK
            api_key = os.getenv("OPENROUTER_API_KEY")
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
                "HTTP-Referer": os.getenv("APP_URL", "https://modellab.com"),
                "X-Title": os.getenv("APP_TITLE", "Model Lab")
            }
            
            payload = {
                "model": model,
                "messages": formatted_messages
            }
            
            api_response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                data=json.dumps(payload)
            )
            
            if api_response.status_code != 200:
                raise ValueError(f"OpenRouter API returned status code {api_response.status_code}: {api_response.text}")
            
            # Parse the JSON response
            response_json = api_response.json()
            
            # Extract the response content
            choices = response_json.get("choices", [])
            if not choices or len(choices) == 0:
                raise ValueError("No choices in OpenRouter response")
                
            message = choices[0].get("message", {})
            response_content = message.get("content", "No content received")
            
            # Extract usage statistics
            usage_data = response_json.get("usage", {})
            prompt_tokens = usage_data.get("prompt_tokens", 0)
            completion_tokens = usage_data.get("completion_tokens", 0)
            total_tokens = usage_data.get("total_tokens", 0)
            
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
            # If OpenRouter API fails, provide a fallback response
            print(f"Error calling OpenRouter API: {str(e)}")
            print(f"Response type: {type(e).__name__}")
            print(f"Response: {str(e)}")
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
