-- Primeiro, deletar agentes duplicados, mantendo apenas o mais recente por restaurante
DELETE FROM agents a1
USING agents a2
WHERE a1.restaurant_id = a2.restaurant_id
  AND a1.created_at < a2.created_at;

-- Adicionar constraint UNIQUE para garantir 1 agente por restaurante
ALTER TABLE agents
ADD CONSTRAINT agents_restaurant_id_unique UNIQUE (restaurant_id);

-- Comentário para documentação
COMMENT ON CONSTRAINT agents_restaurant_id_unique ON agents IS 'Garante que cada restaurante tenha apenas um agente IA';