-- Atualizar restaurant_id nos chats existentes baseado no agent_id
UPDATE chats 
SET restaurant_id = agents.restaurant_id
FROM agents
WHERE chats.agent_id = agents.id
  AND chats.restaurant_id IS NULL;

-- Criar índice para melhorar performance das queries
CREATE INDEX IF NOT EXISTS idx_chats_restaurant_id ON chats(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_chats_agent_id ON chats(agent_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);