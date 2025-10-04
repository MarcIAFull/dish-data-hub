-- Fase 3: Integração com n8n

-- 3.1. Criar trigger para sincronização de pedidos
CREATE OR REPLACE FUNCTION public.sync_orders_from_pedidos()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log da sincronização
  RAISE NOTICE 'Syncing order from pedidos: chat_id=%, status=%', NEW.chat_id, NEW.status;
  
  -- Aqui você pode adicionar lógica customizada baseada no payload do n8n
  -- Por exemplo, atualizar outras tabelas, enviar notificações, etc.
  
  -- Retornar NEW para permitir que a operação continue
  RETURN NEW;
END;
$$;

-- Criar trigger para executar após INSERT ou UPDATE
CREATE TRIGGER sync_orders_trigger
AFTER INSERT OR UPDATE ON public.pedidos
FOR EACH ROW EXECUTE FUNCTION public.sync_orders_from_pedidos();

-- 3.2. Adicionar colunas para rastreamento de integração n8n
ALTER TABLE public.chats 
ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS customer_id BIGINT REFERENCES public.customers(id) ON DELETE SET NULL;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_chats_agent_id ON public.chats(agent_id);
CREATE INDEX IF NOT EXISTS idx_chats_customer_id ON public.chats(customer_id);