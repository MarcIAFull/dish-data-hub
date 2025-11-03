-- ============= SECURITY TABLES =============

-- Security alerts table for monitoring suspicious behavior
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  patterns_detected TEXT[],
  message_content TEXT,
  request_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying by phone and date
CREATE INDEX IF NOT EXISTS idx_security_alerts_phone 
ON public.security_alerts(phone, created_at DESC);

-- Index for querying by agent
CREATE INDEX IF NOT EXISTS idx_security_alerts_agent 
ON public.security_alerts(agent_id, created_at DESC);

-- Blocked numbers table for auto-blocking after suspicious activity
CREATE TABLE IF NOT EXISTS public.blocked_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  reason TEXT,
  alert_count INTEGER,
  blocked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast phone lookup
CREATE INDEX IF NOT EXISTS idx_blocked_numbers_phone 
ON public.blocked_numbers(phone);

-- Index for rate limiting performance
CREATE INDEX IF NOT EXISTS idx_messages_chat_created 
ON public.messages(chat_id, created_at DESC);

-- Enable RLS on security tables
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_numbers ENABLE ROW LEVEL SECURITY;

-- RLS policies for security_alerts (admins only)
CREATE POLICY "Admins can view security alerts"
ON public.security_alerts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "System can insert security alerts"
ON public.security_alerts FOR INSERT
WITH CHECK (true);

-- RLS policies for blocked_numbers (admins only)
CREATE POLICY "Admins can view blocked numbers"
ON public.blocked_numbers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "System can insert blocked numbers"
ON public.blocked_numbers FOR INSERT
WITH CHECK (true);