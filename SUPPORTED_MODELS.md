# Supported OpenAI Models

This document lists all OpenAI models from OpenRouter that are now supported in Model Lab.

## OpenAI GPT-5 Series

| Model ID | Display Name | Input ($/1M tokens) | Output ($/1M tokens) | Context (tokens) |
|----------|--------------|---------------------|----------------------|------------------|
| `openai/gpt-5.1` | GPT-5.1 | $1.25 | $10 | 400,000 |
| `openai/gpt-5.1-chat` | GPT-5.1 Chat | $1.25 | $10 | 128,000 |
| `openai/gpt-5.1-codex` | GPT-5.1 Codex | $1.25 | $10 | 400,000 |
| `openai/gpt-5.1-codex-mini` | GPT-5.1 Codex Mini | $0.25 | $2 | 400,000 |
| `openai/gpt-5-pro` | GPT-5 Pro | $15 | $120 | 400,000 |
| `openai/gpt-5-codex` | GPT-5 Codex | $1.25 | $10 | 400,000 |
| `openai/gpt-5-chat` | GPT-5 Chat | $1.25 | $10 | 128,000 |
| `openai/gpt-5` | GPT-5 | $1.25 | $10 | 400,000 |
| `openai/gpt-5-mini` | GPT-5 Mini | $0.25 | $2 | 400,000 |
| `openai/gpt-5-nano` | GPT-5 Nano | $0.05 | $0.40 | 400,000 |

## OpenAI o-Series (Reasoning Models)

| Model ID | Display Name | Input ($/1M tokens) | Output ($/1M tokens) | Context (tokens) |
|----------|--------------|---------------------|----------------------|------------------|
| `openai/o3-pro` | o3 Pro | $20 | $80 | 200,000 |
| `openai/o3-deep-research` | o3 Deep Research | $10 | $40 | 200,000 |
| `openai/o3` | o3 | $2 | $8 | 200,000 |
| `openai/o3-mini-high` | o3 Mini High | $1.10 | $4.40 | 200,000 |
| `openai/o3-mini` | o3 Mini | $1.10 | $4.40 | 200,000 |
| `openai/o4-mini-deep-research` | o4 Mini Deep Research | $2 | $8 | 200,000 |
| `openai/o4-mini` | o4 Mini | $1.10 | $4.40 | 200,000 |
| `openai/o1-pro` | o1 Pro | $150 | $600 | 200,000 |
| `openai/o1` | o1 | $15 | $60 | 200,000 |

## OpenAI Codex Series

| Model ID | Display Name | Input ($/1M tokens) | Output ($/1M tokens) | Context (tokens) |
|----------|--------------|---------------------|----------------------|------------------|
| `openai/codex-mini` | Codex Mini | $1.50 | $6 | 200,000 |

## OpenAI GPT-4.1 Series

| Model ID | Display Name | Input ($/1M tokens) | Output ($/1M tokens) | Context (tokens) |
|----------|--------------|---------------------|----------------------|------------------|
| `openai/gpt-4.1` | GPT-4.1 | $2 | $8 | 1,047,576 |
| `openai/gpt-4.1-mini` | GPT-4.1 Mini | $0.40 | $1.60 | 1,047,576 |
| `openai/gpt-4.1-nano` | GPT-4.1 Nano | $0.10 | $0.40 | 1,047,576 |

## OpenAI GPT-4o Series

| Model ID | Display Name | Input ($/1M tokens) | Output ($/1M tokens) | Context (tokens) |
|----------|--------------|---------------------|----------------------|------------------|
| `openai/gpt-4o` | GPT-4o | $2.50 | $10 | 128,000 |
| `openai/gpt-4o-mini` | GPT-4o Mini | $0.15 | $0.60 | 128,000 |

## OpenAI GPT-4 Series

| Model ID | Display Name | Input ($/1M tokens) | Output ($/1M tokens) | Context (tokens) |
|----------|--------------|---------------------|----------------------|------------------|
| `openai/gpt-4` | GPT-4 | $30 | $60 | 8,191 |

## OpenAI GPT OSS Series

| Model ID | Display Name | Input ($/1M tokens) | Output ($/1M tokens) | Context (tokens) |
|----------|--------------|---------------------|----------------------|------------------|
| `openai/gpt-oss-120b` | GPT OSS 120B | $0.04 | $0.40 | 131,072 |
| `openai/gpt-oss-20b` | GPT OSS 20B | $0.03 | $0.14 | 131,072 |
| `openai/gpt-oss-20b:free` | GPT OSS 20B (Free) | $0 | $0 | 131,072 |

## Usage

All models can be selected from the model selector dropdown in the chat interface. The model ID format follows OpenRouter's convention: `provider/model-name`.

### Backend Configuration

The pricing for all models is configured in `backend/app/main.py` in the `calculate_cost()` function and the `/api/pricing` endpoint.

### Frontend Configuration

Model display names and colors are configured in:
- `components/chat-interface.tsx` - Main chat interface model selector
- `components/app-sidebar.tsx` - Sidebar chat history display

### Color Coding

- **Green**: OpenAI models (GPT series, o-series)
- **Amber/Orange**: Anthropic models (Claude series)
- **Blue**: DeepSeek models

## Notes

- Pricing is based on OpenRouter rates as of the table provided
- All costs are calculated per 1 million tokens
- Context window sizes vary by model
- Some models like `openai/gpt-oss-20b:free` are available at no cost

