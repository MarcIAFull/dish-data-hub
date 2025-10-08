-- Drop and recreate the conversations view with correct data
DROP VIEW IF EXISTS public.conversations;

CREATE OR REPLACE VIEW public.conversations AS
SELECT 
  chats.conversation_id::uuid AS id,
  chats.created_at,
  chats.updated_at,
  chats.agent_id,
  chats.customer_id,
  chats.restaurant_id,
  chats.app,
  chats.phone,
  chats.status
FROM chats
WHERE chats.conversation_id IS NOT NULL;