-- ETAPA 1: Adicionar session_id à tabela messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Criar index para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_session ON messages(chat_id, session_id);

-- ETAPA 2: Criar tabela session_summaries
CREATE TABLE IF NOT EXISTS session_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id BIGINT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  order_total NUMERIC,
  items_ordered JSONB DEFAULT '[]'::jsonb,
  delivery_type TEXT,
  payment_method TEXT,
  customer_preferences JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar indexes para session_summaries
CREATE INDEX IF NOT EXISTS idx_session_summaries_chat ON session_summaries(chat_id);
CREATE INDEX IF NOT EXISTS idx_session_summaries_session ON session_summaries(session_id);
CREATE INDEX IF NOT EXISTS idx_session_summaries_completed ON session_summaries(completed_at DESC);

-- RLS policies para session_summaries
ALTER TABLE session_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins see all session summaries"
  ON session_summaries FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Users see own restaurant session summaries"
  ON session_summaries FOR SELECT
  USING (
    chat_id IN (
      SELECT chats.id FROM chats
      WHERE chats.restaurant_id IN (
        SELECT restaurants.id FROM restaurants
        WHERE restaurants.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can insert session summaries"
  ON session_summaries FOR INSERT
  WITH CHECK (true);