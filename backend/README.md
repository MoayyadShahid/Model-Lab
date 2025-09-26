# Model Lab Backend

This is the Python backend for Model Lab, providing API endpoints for multiple LLM providers.

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
OPENAI_API_KEY=your_openai_api_key
# Add other API keys as needed
```

## API Endpoints

- `POST /api/chat`: Send a chat request to the selected LLM model
- `POST /api/chat/stream`: Stream a chat response from the selected LLM model

## Adding New Models

To add support for a new LLM provider:

1. Add the API key to your `.env` file
2. Install the provider's Python SDK if needed
3. Create a new module in `app/services/` for the provider
4. Update the router to support the new model

## Testing

```bash
poetry run pytest
```



