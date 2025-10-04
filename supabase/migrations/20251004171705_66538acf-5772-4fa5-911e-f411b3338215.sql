-- Fase 2: Adaptar Tabelas Existentes

-- 2.1. Adicionar referência de restaurant_id em customers
ALTER TABLE public.customers 
ADD COLUMN restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL;

-- Criar índice para performance
CREATE INDEX idx_customers_restaurant ON public.customers(restaurant_id);

-- 2.2. Criar view de compatibilidade para orders
CREATE VIEW public.orders AS
SELECT 
  id::text as id,
  chat_id,
  (payload->>'restaurant_id')::uuid as restaurant_id,
  (payload->>'customer_id')::uuid as customer_id,
  status,
  (payload->>'total')::decimal as total,
  created_at,
  updated_at
FROM public.pedidos;

-- 2.3. Criar view de compatibilidade para conversations
CREATE VIEW public.conversations AS
SELECT 
  conversation_id::uuid as id,
  app,
  phone,
  status,
  created_at,
  updated_at,
  NULL::uuid as agent_id, -- Será preenchido na Fase 3
  NULL::uuid as customer_id -- Será preenchido na Fase 3
FROM public.chats;