-- Adicionar campo last_read_at na tabela chats (base da view conversations)
ALTER TABLE chats 
ADD COLUMN IF NOT EXISTS last_read_at timestamp with time zone;

-- Criar índice para melhor performance nas queries de não lidas
CREATE INDEX IF NOT EXISTS idx_chats_last_read_at 
ON chats(last_read_at);

-- Habilitar realtime para a tabela de mensagens (se ainda não estiver)
ALTER TABLE chat_messages REPLICA IDENTITY FULL;

-- Adicionar tabela à publicação realtime se ainda não estiver
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  END IF;
END $$;