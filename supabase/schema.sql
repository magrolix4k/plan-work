-- Supabase SQL Schema for AI Agent Task Workspace

-- 1. Create Task Sets Table
CREATE TABLE IF NOT EXISTS public.task_sets (
    id TEXT PRIMARY KEY DEFAULT ('set-' || extract(epoch from now())::bigint),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'plan' CHECK (status IN ('backlog', 'plan', 'in_progress', 'in_review', 'done')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assignee TEXT DEFAULT 'Antigravity AI',
    task_set TEXT DEFAULT 'Default',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Task Logs Table
CREATE TABLE IF NOT EXISTS public.task_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    task_id TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    author TEXT DEFAULT 'AI Agent',
    action TEXT DEFAULT 'LOG',
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_task_set ON public.tasks(task_set);
CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON public.task_logs(task_id);

-- 5. Enable Row Level Security (RLS) & Add Permissive Access Policies
ALTER TABLE public.task_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for task_sets" ON public.task_sets
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for tasks" ON public.tasks
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for task_logs" ON public.task_logs
    FOR ALL USING (true) WITH CHECK (true);

-- 6. Enable Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_sets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_logs;
