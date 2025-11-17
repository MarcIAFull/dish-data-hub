-- ============================================
-- CORREÇÃO COMPLETA DO SISTEMA DE CHATS
-- (Versão 2 - Removendo dependências primeiro)
-- ============================================

-- 1. Remover trigger que depende da coluna status
DROP TRIGGER IF EXISTS trg_handle_chat_status_change ON chats;

-- 2. Atualizar valores existentes para padrão correto
UPDATE chats SET status = 'archived' WHERE status = 'indefinido' OR status IS NULL;
UPDATE chats SET status = 'archived' WHERE archived_at IS NOT NULL AND status NOT IN ('active', 'archived');
UPDATE chats SET status = 'active' WHERE status NOT IN ('active', 'archived', 'ended', 'human_handoff');

-- 3. Criar índice único parcial para garantir apenas 1 chat ativo por telefone
CREATE UNIQUE INDEX IF NOT EXISTS idx_chats_active_unique 
  ON chats(phone) 
  WHERE status = 'active';

-- 4. Criar índice composto para queries de busca rápida
CREATE INDEX IF NOT EXISTS idx_chats_phone_status 
  ON chats(phone, status);

-- 5. Criar índice para chats arquivados recentes (reabertura)
CREATE INDEX IF NOT EXISTS idx_chats_archived_recent 
  ON chats(phone, archived_at DESC) 
  WHERE status = 'archived';

-- 6. Trigger para garantir apenas 1 chat ativo por telefone
CREATE OR REPLACE FUNCTION ensure_single_active_chat()
RETURNS TRIGGER AS $$
BEGIN
  -- Se está criando/ativando um chat
  IF NEW.status = 'active' THEN
    -- Arquivar outros chats ativos do mesmo telefone
    UPDATE chats 
    SET 
      status = 'archived',
      archived_at = NOW(),
      session_status = 'completed',
      metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{archived_reason}',
        '"auto_archived_new_chat"'::jsonb
      )
    WHERE phone = NEW.phone 
      AND status = 'active'
      AND id != NEW.id;
      
    RAISE NOTICE 'Chat % ativado, outros chats arquivados para %', NEW.id, NEW.phone;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_single_active_chat ON chats;
CREATE TRIGGER enforce_single_active_chat
  BEFORE INSERT OR UPDATE ON chats
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_active_chat();

-- 7. Comentários de documentação
COMMENT ON COLUMN chats.status IS 'Status do chat: active (atendimento IA), human_handoff (transferido), ended (encerrado manual), archived (pedido completo)';
COMMENT ON INDEX idx_chats_active_unique IS 'Garante apenas 1 chat ativo por telefone';
COMMENT ON FUNCTION ensure_single_active_chat() IS 'Auto-arquiva chats antigos quando novo chat se torna ativo';