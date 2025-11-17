-- Atualizar constraint para incluir todos os estados do ConversationState enum
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_conversation_state_check;

ALTER TABLE chats ADD CONSTRAINT chats_conversation_state_check 
CHECK (conversation_state = ANY (ARRAY[
  'greeting',
  'discovery',
  'browsing_menu',
  'selecting_products',
  'building_order',
  'ready_to_checkout',
  'collecting_address',
  'collecting_payment',
  'confirming_order',
  'order_placed',
  'abandoned',
  'asking_support',
  -- Estados legados para compatibilidade
  'presentation',
  'upsell',
  'logistics',
  'address',
  'payment',
  'summary',
  'confirmed'
]::text[]));

-- Criar índice para melhor performance em queries por estado
CREATE INDEX IF NOT EXISTS idx_chats_conversation_state 
ON chats(conversation_state) 
WHERE conversation_state IS NOT NULL;