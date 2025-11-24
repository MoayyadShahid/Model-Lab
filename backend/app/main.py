from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
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
    
    # Cost per 1000 tokens in USD (OpenRouter pricing)
    default_pricing = {
        # OpenAI GPT-5 Series
        "openai/gpt-5.1": {"input": 0.00125, "output": 0.01},
        "openai/gpt-5.1-chat": {"input": 0.00125, "output": 0.01},
        "openai/gpt-5.1-codex": {"input": 0.00125, "output": 0.01},
        "openai/gpt-5.1-codex-mini": {"input": 0.00025, "output": 0.002},
        "openai/gpt-5-codex": {"input": 0.00125, "output": 0.01},
        "openai/gpt-5-chat": {"input": 0.00125, "output": 0.01},
        "openai/gpt-5": {"input": 0.00125, "output": 0.01},
        "openai/gpt-5-mini": {"input": 0.00025, "output": 0.002},
        "openai/gpt-5-nano": {"input": 0.00005, "output": 0.0004},
        
        # OpenAI GPT OSS Series
        "openai/gpt-oss-120b": {"input": 0.00004, "output": 0.0004},
        "openai/gpt-oss-20b:free": {"input": 0, "output": 0},
        "openai/gpt-oss-20b": {"input": 0.00003, "output": 0.00014},
        
        # OpenAI o-Series (Reasoning Models)
        "openai/o4-mini-deep-research": {"input": 0.002, "output": 0.008},
        "openai/o3": {"input": 0.002, "output": 0.008},
        "openai/o4-mini": {"input": 0.0011, "output": 0.0044},
        "openai/o3-mini-high": {"input": 0.0011, "output": 0.0044},
        "openai/o3-mini": {"input": 0.0011, "output": 0.0044},
        "openai/o1": {"input": 0.015, "output": 0.06},

        # OpenAI GPT-4.1 Series
        "openai/gpt-4.1": {"input": 0.002, "output": 0.008},
        "openai/gpt-4.1-mini": {"input": 0.0004, "output": 0.0016},
        "openai/gpt-4.1-nano": {"input": 0.0001, "output": 0.0004},
        
        # OpenAI GPT-4o Series
        "openai/gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
        "openai/gpt-4o": {"input": 0.0025, "output": 0.01},
        
        # OpenAI GPT-4 Series
        "openai/gpt-4": {"input": 0.03, "output": 0.06},
        
        # Anthropic Models
        "anthropic/claude-sonnet-4.5": {"input": 0.003, "output": 0.015},
        "anthropic/claude-sonnet-4": {"input": 0.003, "output": 0.015},
        "anthropic/claude-haiku-4.5": {"input": 0.001, "output": 0.005},
        "anthropic/claude-3.7-sonnet": {"input": 0.003, "output": 0.015},
        "anthropic/claude-3.5-haiku": {"input": 0.0008, "output": 0.004},
        "anthropic/claude-opus-4.1": {"input": 0.015, "output": 0.075},
        "anthropic/claude-3.5-sonnet": {"input": 0.003, "output": 0.015},
        "anthropic/claude-3.7-sonnet:thinking": {"input": 0.003, "output": 0.015},
        "anthropic/claude-opus-4": {"input": 0.015, "output": 0.075},
        "anthropic/claude-3-opus": {"input": 0.015, "output": 0.075},
        "anthropic/claude-3-haiku": {"input": 0.0025, "output": 0.0125},
        
        # DeepSeek Models
        "deepseek/deepseek-chat-v3-0324": {"input": 0.00024, "output": 0.00084},
        "deepseek/deepseek-chat-v3.1": {"input": 0.0002, "output": 0.0008},
        "tngtech/deepseek-r1t2-chimera:free": {"input": 0, "output": 0},
        "deepseek/deepseek-v3.2-exp": {"input": 0.00027, "output": 0.0004},
        "deepseek/deepseek-v3.1-terminus": {"input": 0.00023, "output": 0.0009},
        "deepseek/deepseek-r1-0528": {"input": 0.0002, "output": 0.0045},
        "tngtech/deepseek-r1t-chimera:free": {"input": 0, "output": 0},
        "deepseek/deepseek-chat": {"input": 0.0003, "output": 0.0012},
        "deepseek/deepseek-chat-v3-0324:free": {"input": 0, "output": 0},
        "tngtech/deepseek-r1t2-chimera": {"input": 0.0003, "output": 0.0012},
        "deepseek/deepseek-r1-0528:free": {"input": 0, "output": 0},
        "deepseek/deepseek-r1": {"input": 0.0003, "output": 0.0012},
        "deepseek/deepseek-r1:free": {"input": 0, "output": 0},

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
    model: Optional[str] = "openai/gpt-4o-mini"
    stream: Optional[bool] = False

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
        # OpenAI GPT-5 Series
        "openai/gpt-5.1": {"input": 0.00125, "output": 0.01},
        "openai/gpt-5.1-chat": {"input": 0.00125, "output": 0.01},
        "openai/gpt-5.1-codex": {"input": 0.00125, "output": 0.01},
        "openai/gpt-5.1-codex-mini": {"input": 0.00025, "output": 0.002},
        "openai/gpt-5-codex": {"input": 0.00125, "output": 0.01},
        "openai/gpt-5-chat": {"input": 0.00125, "output": 0.01},
        "openai/gpt-5": {"input": 0.00125, "output": 0.01},
        "openai/gpt-5-mini": {"input": 0.00025, "output": 0.002},
        "openai/gpt-5-nano": {"input": 0.00005, "output": 0.0004},
        
        # OpenAI GPT OSS Series
        "openai/gpt-oss-120b": {"input": 0.00004, "output": 0.0004},
        "openai/gpt-oss-20b:free": {"input": 0, "output": 0},
        "openai/gpt-oss-20b": {"input": 0.00003, "output": 0.00014},
        
        # OpenAI o-Series (Reasoning Models)
        "openai/o4-mini-deep-research": {"input": 0.002, "output": 0.008},
        "openai/o3": {"input": 0.002, "output": 0.008},
        "openai/o4-mini": {"input": 0.0011, "output": 0.0044},
        "openai/o3-mini-high": {"input": 0.0011, "output": 0.0044},
        "openai/o3-mini": {"input": 0.0011, "output": 0.0044},
        "openai/o1": {"input": 0.015, "output": 0.06},

        # OpenAI GPT-4.1 Series
        "openai/gpt-4.1": {"input": 0.002, "output": 0.008},
        "openai/gpt-4.1-mini": {"input": 0.0004, "output": 0.0016},
        "openai/gpt-4.1-nano": {"input": 0.0001, "output": 0.0004},
        
        # OpenAI GPT-4o Series
        "openai/gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
        "openai/gpt-4o": {"input": 0.0025, "output": 0.01},
        
        # OpenAI GPT-4 Series
        "openai/gpt-4": {"input": 0.03, "output": 0.06},
 
        # Anthropic Models
        "anthropic/claude-sonnet-4.5": {"input": 0.003, "output": 0.015},
        "anthropic/claude-sonnet-4": {"input": 0.003, "output": 0.015},
        "anthropic/claude-haiku-4.5": {"input": 0.001, "output": 0.005},
        "anthropic/claude-3.7-sonnet": {"input": 0.003, "output": 0.015},
        "anthropic/claude-3.5-haiku": {"input": 0.0008, "output": 0.004},
        "anthropic/claude-opus-4.1": {"input": 0.015, "output": 0.075},
        "anthropic/claude-3.5-sonnet": {"input": 0.003, "output": 0.015},
        "anthropic/claude-3.7-sonnet:thinking": {"input": 0.003, "output": 0.015},
        "anthropic/claude-opus-4": {"input": 0.015, "output": 0.075},
        "anthropic/claude-3-opus": {"input": 0.015, "output": 0.075},
        "anthropic/claude-3-haiku": {"input": 0.0025, "output": 0.0125},
        
        # DeepSeek Models
        "deepseek/deepseek-chat-v3-0324": {"input": 0.00024, "output": 0.00084},
        "deepseek/deepseek-chat-v3.1": {"input": 0.0002, "output": 0.0008},
        "tngtech/deepseek-r1t2-chimera:free": {"input": 0, "output": 0},
        "deepseek/deepseek-v3.2-exp": {"input": 0.00027, "output": 0.0004},
        "deepseek/deepseek-v3.1-terminus": {"input": 0.00023, "output": 0.0009},
        "deepseek/deepseek-r1-0528": {"input": 0.0002, "output": 0.0045},
        "tngtech/deepseek-r1t-chimera:free": {"input": 0, "output": 0},
        "deepseek/deepseek-chat": {"input": 0.0003, "output": 0.0012},
        "deepseek/deepseek-chat-v3-0324:free": {"input": 0, "output": 0},
        "tngtech/deepseek-r1t2-chimera": {"input": 0.0003, "output": 0.0012},
        "deepseek/deepseek-r1-0528:free": {"input": 0, "output": 0},
        "deepseek/deepseek-r1": {"input": 0.0003, "output": 0.0012},
        "deepseek/deepseek-r1:free": {"input": 0, "output": 0},
        # Legacy DeepSeek models
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

def normalize_model_name(model: str) -> str:
    """Normalize model name to OpenRouter format"""
    model_lower = model.lower()
    
    # Anthropic models
    if model_lower in ["claude-3.5-sonnet", "claude-3-5-sonnet", "claude-3.5", "claude3.5", "claude3.5-sonnet"]:
        return "anthropic/claude-3.5-sonnet"
    elif model_lower in ["claude-3-opus", "claude3-opus", "claude3opus", "claude-opus"]:
        return "anthropic/claude-3-opus"
    elif model_lower in ["claude-3-sonnet", "claude3-sonnet", "claude3sonnet", "claude-sonnet"]:
        return "anthropic/claude-3-sonnet"
    elif model_lower in ["claude-3-haiku", "claude3-haiku", "claude3haiku", "claude-haiku"]:
        return "anthropic/claude-3-haiku"
    
    # DeepSeek models
    elif model_lower in ["deepseek", "deepseek-chat", "deepseek-llm"]:
        return "deepseek/deepseek-v3.2-exp"
    elif model_lower in ["deepseek-coder", "deepseekcoder"]:
        return "deepseek/deepseek-chat-v3.1:free"
    
    # OpenAI models
    elif model_lower in ["gpt4o", "4o"]:
        return "openai/gpt-4o"
    elif model_lower in ["gpt4o-mini", "4o-mini"]:
        return "openai/gpt-4o-mini"
    elif model_lower in ["gpt-4-vision", "gpt4vision"]:
        return "openai/gpt-4-vision-preview"
    
    # Default case - if no special mapping and no provider prefix
    elif not ('/' in model):
        return f"openai/{model}"
    
    return model

async def stream_chat_generator(request: ChatRequest):
    """Generator function for streaming chat responses"""
    try:
        if not request.messages:
            yield f"data: {json.dumps({'error': 'No messages provided'})}\n\n"
            return
        
        # Convert messages to the format expected by OpenAI
        formatted_messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        # Normalize model name
        model = normalize_model_name(request.model)
        
        # Use direct API calls to OpenRouter
        api_key = os.getenv("OPENROUTER_API_KEY")
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": os.getenv("APP_URL", "https://modellab.com"),
            "X-Title": os.getenv("APP_TITLE", "Model Lab")
        }
        
        payload = {
            "model": model,
            "messages": formatted_messages,
            "stream": True
        }
        
        try:
            # Make streaming request to OpenRouter
            api_response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
                stream=True
            )
            
            if api_response.status_code != 200:
                error_text = api_response.text
                yield f"data: {json.dumps({'error': f'OpenRouter API returned status code {api_response.status_code}: {error_text}'})}\n\n"
                return
            
            # Track usage data
            usage_data = {}
            
            # Stream the response
            for line in api_response.iter_lines():
                if line:
                    line_text = line.decode('utf-8')
                    
                    # Skip non-data lines
                    if not line_text.startswith('data: '):
                        continue
                    
                    # Extract JSON data
                    data_str = line_text[6:]  # Remove 'data: ' prefix
                    
                    # Check for [DONE] marker
                    if data_str.strip() == '[DONE]':
                        # Send final usage message if available
                        if usage_data:
                            final_usage = {
                                "type": "usage",
                                "usage": {
                                    "prompt_tokens": usage_data.get("prompt_tokens", 0),
                                    "completion_tokens": usage_data.get("completion_tokens", 0),
                                    "total_tokens": usage_data.get("total_tokens", 0),
                                    "model": request.model,
                                    "cost": calculate_cost(request.model, usage_data.get("prompt_tokens", 0), usage_data.get("completion_tokens", 0))
                                }
                            }
                            yield f"data: {json.dumps(final_usage)}\n\n"
                        yield f"data: [DONE]\n\n"
                        break
                    
                    try:
                        chunk_data = json.loads(data_str)
                        choices = chunk_data.get("choices", [])
                        
                        if choices and len(choices) > 0:
                            delta = choices[0].get("delta", {})
                            content_delta = delta.get("content", "")
                            
                            if content_delta:
                                # Send content chunk
                                yield f"data: {json.dumps({'type': 'content', 'content': content_delta})}\n\n"
                            
                            # Check for usage data (usually in final chunk)
                            if "usage" in chunk_data:
                                usage_data = chunk_data["usage"]
                    
                    except json.JSONDecodeError:
                        # Skip invalid JSON
                        continue
        
        except Exception as e:
            error_msg = f"Error calling OpenRouter API: {str(e)}"
            print(error_msg)
            yield f"data: {json.dumps({'error': error_msg})}\n\n"
    
    except Exception as e:
        error_msg = f"Error processing request: {str(e)}"
        print(error_msg)
        yield f"data: {json.dumps({'error': error_msg})}\n\n"

@app.post("/api/chat")
async def chat(request: ChatRequest):
    # Handle streaming requests
    if request.stream:
        return StreamingResponse(
            stream_chat_generator(request),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
    
    # Non-streaming request (original logic)
    try:
        if not request.messages:
            raise HTTPException(status_code=400, detail="No messages provided")
        
        # Convert messages to the format expected by OpenAI
        formatted_messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        # Normalize model name
        model = normalize_model_name(request.model)
                
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
