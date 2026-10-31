-- ============================================================
-- NOVA AI: Supabase Production Schema with Row Level Security (RLS)
-- ============================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  color TEXT DEFAULT '#CC5A36',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'New Chat',
  model TEXT NOT NULL DEFAULT 'claude-3-7-sonnet-20250219',
  system_prompt TEXT,
  response_style TEXT DEFAULT 'normal',
  is_pinned BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  thinking TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  citations JSONB DEFAULT '[]'::jsonb,
  tool_executions JSONB DEFAULT '[]'::jsonb,
  artifact_ids JSONB DEFAULT '[]'::jsonb,
  feedback TEXT CHECK (feedback IN ('positive', 'negative')),
  token_usage JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Artifacts Table
CREATE TABLE IF NOT EXISTS public.artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  language TEXT,
  content TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Artifact Versions Table
CREATE TABLE IF NOT EXISTS public.artifact_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artifact_id UUID NOT NULL REFERENCES public.artifacts(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. User Memories Table
CREATE TABLE IF NOT EXISTS public.user_memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'preference' CHECK (category IN ('preference', 'fact', 'instruction', 'project')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Uploaded Files Table
CREATE TABLE IF NOT EXISTS public.uploaded_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT,
  extracted_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. User Preferences Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'system',
  default_model TEXT DEFAULT 'claude-3-7-sonnet-20250219',
  response_style TEXT DEFAULT 'normal',
  enable_thinking BOOLEAN DEFAULT TRUE,
  thinking_budget INTEGER DEFAULT 2048,
  enable_web_search BOOLEAN DEFAULT TRUE,
  enable_code_execution BOOLEAN DEFAULT TRUE,
  stream_responses BOOLEAN DEFAULT TRUE,
  font_size TEXT DEFAULT 'md',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Usage Records Table
CREATE TABLE IF NOT EXISTS public.usage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  model TEXT NOT NULL,
  prompt_tokens BIGINT DEFAULT 0,
  completion_tokens BIGINT DEFAULT 0,
  total_tokens BIGINT DEFAULT 0,
  estimated_cost NUMERIC(10, 6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Shared Conversations Table
CREATE TABLE IF NOT EXISTS public.shared_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  share_key TEXT UNIQUE NOT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Personal Tasks Table
CREATE TABLE IF NOT EXISTS public.personal_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  category TEXT DEFAULT 'work' CHECK (category IN ('work', 'personal', 'research', 'finance', 'health', 'learning')),
  deadline TIMESTAMPTZ,
  scheduled_date DATE,
  scheduled_time_slot TEXT,
  estimated_duration_mins INTEGER DEFAULT 45,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Personal Reminders Table
CREATE TABLE IF NOT EXISTS public.personal_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_time TIMESTAMPTZ NOT NULL,
  recurrence TEXT DEFAULT 'none' CHECK (recurrence IN ('none', 'daily', 'weekly', 'custom')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'snoozed', 'dismissed')),
  priority TEXT DEFAULT 'medium',
  snoozed_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Calendar Events Table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  is_all_day BOOLEAN DEFAULT FALSE,
  attendees TEXT[] DEFAULT ARRAY[]::TEXT[],
  source TEXT DEFAULT 'local',
  requires_approval_for_modification BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Email Messages Table
CREATE TABLE IF NOT EXISTS public.email_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  subject TEXT NOT NULL,
  snippet TEXT,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_important BOOLEAN DEFAULT FALSE,
  drafted_reply TEXT,
  requires_approval_to_send BOOLEAN DEFAULT TRUE,
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Monitored Topics Table
CREATE TABLE IF NOT EXISTS public.monitored_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  category TEXT,
  interval_hours INTEGER DEFAULT 4,
  last_checked_at TIMESTAMPTZ,
  citations JSONB DEFAULT '[]'::jsonb,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Background Jobs Table
CREATE TABLE IF NOT EXISTS public.background_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  schedule_cron_or_interval TEXT NOT NULL,
  next_run_at TIMESTAMPTZ NOT NULL,
  last_run_at TIMESTAMPTZ,
  last_status TEXT DEFAULT 'idle',
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  is_recurring BOOLEAN DEFAULT TRUE,
  enabled BOOLEAN DEFAULT TRUE,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifact_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitored_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.background_jobs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Projects: Users can manage own projects
CREATE POLICY "Users can manage own projects" ON public.projects
  FOR ALL USING (auth.uid() = user_id);

-- Conversations: Users can manage own conversations
CREATE POLICY "Users can manage own conversations" ON public.conversations
  FOR ALL USING (auth.uid() = user_id);

-- Messages: Users can manage messages in their conversations
CREATE POLICY "Users can manage own messages" ON public.messages
  FOR ALL USING (auth.uid() = user_id);

-- Artifacts: Users can manage own artifacts
CREATE POLICY "Users can manage own artifacts" ON public.artifacts
  FOR ALL USING (auth.uid() = user_id);

-- User Memories: Users can manage own memories
CREATE POLICY "Users can manage own memories" ON public.user_memories
  FOR ALL USING (auth.uid() = user_id);

-- User Preferences: Users can manage own preferences
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Personal Tasks: Users can manage own tasks
CREATE POLICY "Users can manage own tasks" ON public.personal_tasks
  FOR ALL USING (auth.uid() = user_id);

-- Personal Reminders: Users can manage own reminders
CREATE POLICY "Users can manage own reminders" ON public.personal_reminders
  FOR ALL USING (auth.uid() = user_id);

-- Calendar Events: Users can manage own calendar events
CREATE POLICY "Users can manage own calendar events" ON public.calendar_events
  FOR ALL USING (auth.uid() = user_id);

-- Email Messages: Users can manage own emails
CREATE POLICY "Users can manage own emails" ON public.email_messages
  FOR ALL USING (auth.uid() = user_id);

-- Monitored Topics: Users can manage own monitored topics
CREATE POLICY "Users can manage own monitored topics" ON public.monitored_topics
  FOR ALL USING (auth.uid() = user_id);

-- Background Jobs: Users can manage own background jobs
CREATE POLICY "Users can manage own background jobs" ON public.background_jobs
  FOR ALL USING (auth.uid() = user_id);

-- Usage Records: Users can view own usage records
CREATE POLICY "Users can view own usage" ON public.usage_records
  FOR SELECT USING (auth.uid() = user_id);

-- Shared Conversations: Public can view shared conversations
CREATE POLICY "Public can view shared conversations" ON public.shared_conversations
  FOR SELECT USING (is_public = TRUE);

-- ============================================================
-- Indexes for Fast Query Performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_artifacts_conversation ON public.artifacts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_memories_user ON public.user_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON public.personal_tasks(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_reminders_user ON public.personal_reminders(user_id, due_time);
CREATE INDEX IF NOT EXISTS idx_calendar_user ON public.calendar_events(user_id, start_time);
