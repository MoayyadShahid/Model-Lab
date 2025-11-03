# Model Lab

Model Lab is an all-in-one AI model hub that provides a unified interface to interact with various LLM models including OpenAI, Anthropic, and DeepSeek through OpenRouter. This application features user authentication, persistent chat histories, and a clean, modern UI.

## Features

- **User Authentication** - Email and Google OAuth sign-in via Supabase
- **Multiple Model Support** - Access to GPT-4o, Claude 3.5, DeepSeek, and more
- **Persistent Chat History** - All conversations are stored in your Supabase database
- **Modern UI** - Clean, responsive interface built with Next.js and Tailwind CSS
- **OpenRouter Integration** - Single API to access multiple AI providers

## Tech Stack

- **Frontend**: Next.js 14, React 19, Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI Integration**: OpenRouter

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm/pnpm
- Python 3.9+
- Supabase account
- OpenRouter API key

### Step 1: Environment Configuration

1. Create a `.env.local` file in the project root with the following:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
BACKEND_API_URL=http://localhost:8000
```

2. Create a `.env` file in the `backend` directory:

```
OPENROUTER_API_KEY=your_openrouter_api_key_here
APP_URL=http://localhost:3000
APP_TITLE=Model Lab
```

### Step 2: Database Setup

1. Log in to your Supabase dashboard
2. Create a new project
3. Execute the SQL script found in `supabase/schema.sql` in the SQL editor

### Step 3: Authentication Setup

1. In your Supabase dashboard, go to Authentication > Providers
2. Enable Email provider
3. To enable Google OAuth:
   - Go to Google Cloud Console and create OAuth credentials
   - Add the redirect URL from your Supabase Auth settings
   - Add your Google Client ID and Secret to Supabase Auth settings

### Step 4: Frontend Setup

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

### Step 5: Backend Setup

```bash
cd backend

# Using Poetry (recommended)
poetry install
poetry shell
uvicorn app.main:app --reload

# OR using pip/venv
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Usage

1. Visit `http://localhost:3000` to access the landing page
2. Sign up or log in with email or Google
3. Create a new chat or continue existing conversations
4. Select your preferred AI model from the dropdown
5. Start chatting!

## Folder Structure

```
model-lab/
├── app/ - Next.js application routes
│   ├── (app)/ - Protected application routes
│   └── (auth)/ - Authentication routes
├── backend/ - FastAPI backend
│   └── app/ - Backend application code
├── components/ - React components
├── lib/ - Utility functions
├── public/ - Static assets
└── styles/ - CSS styles
```

## License

MIT
