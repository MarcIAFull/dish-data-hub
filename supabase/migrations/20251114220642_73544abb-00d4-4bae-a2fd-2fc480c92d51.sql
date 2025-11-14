-- Passo 1: Atualizar mensagens de chats que JÁ têm session_id
UPDATE messages m
SET session_id = c.session_id
FROM chats c
WHERE m.chat_id = c.id 
  AND m.session_id IS NULL
  AND c.session_id IS NOT NULL;

-- Passo 2: Para chats SEM session_id, gerar um legacy
-- Primeiro, criar session_id para chats antigos
UPDATE chats
SET 
  session_id = 'legacy_' || id || '_' || substr(md5(random()::text), 1, 8),
  session_created_at = created_at,
  session_status = 'completed'
WHERE session_id IS NULL;

-- Depois, atualizar mensagens com o novo session_id
UPDATE messages m
SET session_id = c.session_id
FROM chats c
WHERE m.chat_id = c.id 
  AND m.session_id IS NULL
  AND c.session_id IS NOT NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_messages_session_chat 
ON messages(session_id, chat_id);