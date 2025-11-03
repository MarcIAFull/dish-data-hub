-- Adicionar campo ai_enabled na tabela chats
ALTER TABLE public.chats 
ADD COLUMN IF NOT EXISTS ai_enabled boolean DEFAULT true;

-- Migrar conversas com status human_handoff para usar ai_enabled
UPDATE public.chats 
SET ai_enabled = false, 
    status = 'active' 
WHERE status = 'human_handoff';

-- Adicionar índice para melhorar performance de busca por telefone
CREATE INDEX IF NOT EXISTS idx_chats_phone ON public.chats(phone);
CREATE INDEX IF NOT EXISTS idx_chats_restaurant_phone ON public.chats(restaurant_id, phone);