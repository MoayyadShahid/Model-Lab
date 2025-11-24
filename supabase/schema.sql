-- ===============================================
-- Model Lab - Clean Production Schema
-- ===============================================
-- This schema includes all fixes for message persistence,
-- proper RLS policies, and robust error handling.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===============================================
-- TABLES
-- ===============================================

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chats table  
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table with TEXT id for custom IDs (fixes persistence issues)
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage JSONB
);

-- ===============================================
-- ROW LEVEL SECURITY
-- ===============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- SECURITY POLICIES  
-- ===============================================

-- Drop existing policies to avoid conflicts (for fresh deployments)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can insert their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can delete their own chats" ON public.chats;

DROP POLICY IF EXISTS "Users can view messages from their own chats" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages to their own chats" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their own chats" ON public.messages;

-- Users policies
CREATE POLICY "Users can view their own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Chats policies with proper WITH CHECK clauses
CREATE POLICY "Users can view their own chats"
  ON public.chats
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chats"
  ON public.chats
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chats"
  ON public.chats
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chats"
  ON public.chats
  FOR DELETE
  USING (auth.uid() = user_id);

-- Messages policies (critical for message persistence)
CREATE POLICY "Users can view messages from their own chats"
  ON public.messages
  FOR SELECT
  USING (
    chat_id IN (
      SELECT id FROM public.chats WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their own chats"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    chat_id IN (
      SELECT id FROM public.chats WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in their own chats"
  ON public.messages
  FOR UPDATE
  USING (
    chat_id IN (
      SELECT id FROM public.chats WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    chat_id IN (
      SELECT id FROM public.chats WHERE user_id = auth.uid()
    )
  );

-- ===============================================
-- PERMISSIONS
-- ===============================================

-- Grant necessary permissions for authenticated users
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.chats TO authenticated;
GRANT ALL ON public.messages TO authenticated;

-- ===============================================
-- TRIGGERS AND FUNCTIONS
-- ===============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
CREATE OR REPLACE TRIGGER users_updated_at_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE OR REPLACE TRIGGER chats_updated_at_trigger
  BEFORE UPDATE ON public.chats
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- Robust user profile creation with error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, COALESCE(NEW.email, ''), NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail user creation
    RAISE LOG 'Error creating user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic user profile creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ===============================================
-- INDEXES (for performance)
-- ===============================================

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON public.chats(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- ===============================================
-- CLEANUP (remove any test data)
-- ===============================================

-- Remove any test messages that might exist
DELETE FROM public.messages WHERE content = 'Test message for schema validation';
DELETE FROM public.messages WHERE id LIKE 'test_%';

-- ===============================================
-- VERIFICATION
-- ===============================================

-- Verify the schema is properly set up
DO $$
BEGIN
  RAISE NOTICE 'Model Lab schema deployed successfully';
  RAISE NOTICE 'Tables: % users, % chats, % messages', 
    (SELECT COUNT(*) FROM public.users),
    (SELECT COUNT(*) FROM public.chats), 
    (SELECT COUNT(*) FROM public.messages);
END $$;
