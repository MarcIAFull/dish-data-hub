-- Migration: Associar conversas órfãs aos restaurantes corretos via agent_id
UPDATE chats c
SET restaurant_id = a.restaurant_id
FROM agents a
WHERE c.agent_id = a.id
  AND c.restaurant_id IS NULL
  AND a.restaurant_id IS NOT NULL;