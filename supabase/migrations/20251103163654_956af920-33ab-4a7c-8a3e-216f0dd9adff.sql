-- Limpeza completa do sistema n8n e criação do novo sistema de mensagens

-- 1. Remover trigger e function do n8n
DROP TRIGGER IF EXISTS sync_orders_trigger ON public.pedidos;
DROP FUNCTION IF EXISTS public.sync_orders_from_pedidos();

-- 2. Remover tabela do n8n
DROP TABLE IF EXISTS public.n8n_chat_histories CASCADE;

-- 3. Criar tabela messages para o novo sistema (substitui chat_messages)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id BIGINT REFERENCES chats(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'agent', 'system')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  whatsapp_message_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON messages(sender_type);

-- 5. Habilitar RLS na tabela messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para messages
CREATE POLICY "Admins see all messages"
ON messages FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Users see own restaurant messages"  
ON messages FOR SELECT
TO authenticated
USING (
  chat_id IN (
    SELECT id FROM chats 
    WHERE restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  )
);

-- 7. Adicionar last_message_at na tabela chats se não existir
ALTER TABLE chats ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;