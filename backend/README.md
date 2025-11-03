# Model Lab Backend

This is the Python backend for Model Lab, providing API endpoints for multiple LLM providers through OpenRouter.

## Setup

### Using Poetry (Recommended)

1. Install Poetry if you don't have it:
   ```bash
   curl -sSL https://install.python-poetry.org | python3 -
   ```

2. Install dependencies:
   ```bash
   poetry install
   ```

3. Activate the virtual environment:
   ```bash
   poetry shell
   ```

4. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Using Pip and Venv

1. Create a virtual environment:
   ```bash
   python3 -m venv venv
   ```

2. Activate the virtual environment:
   ```bash
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
# OpenRouter API Key (primary)
OPENROUTER_API_KEY=your_openrouter_api_key

# Optional: Fallback to OpenAI direct API if needed
OPENAI_API_KEY=your_openai_api_key

# App information (for OpenRouter dashboard)
APP_URL=https://yourapplication.com
APP_TITLE=Model Lab
```

## API Endpoints

- `POST /api/chat`: Send a chat request to the selected LLM model
- `POST /api/chat/stream`: Stream a chat response from the selected LLM model

## Using OpenRouter Models

OpenRouter gives you access to hundreds of AI models through a unified API. To use different models:

1. Specify the model in the request using the provider/model format:
   - `openai/gpt-4o`
   - `anthropic/claude-3-opus`
   - `anthropic/claude-3-sonnet` 
   - etc.

2. For the full list of available models and their pricing, visit:
   - [OpenRouter Models](https://openrouter.ai/models)
   - [OpenRouter Pricing](https://openrouter.ai/pricing)

No additional configuration is needed to use different models through OpenRouter.

## Testing

```bash
poetry run pytest
```






