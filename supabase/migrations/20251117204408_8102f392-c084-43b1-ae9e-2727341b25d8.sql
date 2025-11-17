-- FASE 1: Adicionar coluna enriched_context para persistir contexto enriquecido
-- Esta coluna armazena dados sobre cliente, restaurante, agente e sessão

COMMENT ON TABLE ai_processing_logs IS 'Logs de processamento de AI com contexto enriquecido (FASE 1)';

-- Adicionar comentário explicando o novo campo no metadata_snapshot
COMMENT ON COLUMN ai_processing_logs.metadata_snapshot IS 'Snapshot dos metadados incluindo enriched_context (customer, restaurant, agent, session)';
