-- Atualizar conversations antigas com restaurant_id baseado no agent_id
UPDATE conversations c
SET restaurant_id = a.restaurant_id
FROM agents a
WHERE c.agent_id = a.id
  AND c.restaurant_id IS NULL;