-- Criar tabela para armazenar logs estruturados de processamento AI
CREATE TABLE IF NOT EXISTS public.ai_processing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id BIGINT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  session_id TEXT,
  request_id TEXT NOT NULL,
  
  -- Input
  user_messages JSONB,
  current_state TEXT,
  metadata_snapshot JSONB,
  
  -- Orchestrator
  detected_intents JSONB,
  execution_plan JSONB,
  
  -- Execution
  agents_called JSONB,
  tools_executed JSONB,
  
  -- Context
  loaded_history JSONB,
  loaded_summaries JSONB,
  
  -- Output
  final_response TEXT,
  new_state TEXT,
  updated_metadata JSONB,
  
  -- Timing
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_logs_chat ON public.ai_processing_logs(chat_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_session ON public.ai_processing_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_request ON public.ai_processing_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created ON public.ai_processing_logs(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.ai_processing_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins podem ver tudo
CREATE POLICY "Admins can view all AI logs"
ON public.ai_processing_logs
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Policy: Users podem ver logs de seus restaurantes
CREATE POLICY "Users can view own restaurant AI logs"
ON public.ai_processing_logs
FOR SELECT
TO authenticated
USING (
  chat_id IN (
    SELECT c.id
    FROM chats c
    WHERE c.restaurant_id IN (
      SELECT restaurants.id
      FROM restaurants
      WHERE restaurants.user_id = auth.uid()
    )
  )
);

-- Policy: Sistema pode inserir logs
CREATE POLICY "System can insert AI logs"
ON public.ai_processing_logs
FOR INSERT
TO authenticated
WITH CHECK (true);