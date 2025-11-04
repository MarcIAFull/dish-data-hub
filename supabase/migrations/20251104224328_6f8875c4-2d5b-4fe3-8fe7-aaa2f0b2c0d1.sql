-- Migration: Fix existing chats with null restaurant_id
-- Updates chats to have the correct restaurant_id based on their agent_id

UPDATE chats c
SET restaurant_id = a.restaurant_id,
    updated_at = NOW()
FROM agents a
WHERE c.agent_id = a.id
  AND c.restaurant_id IS NULL
  AND a.restaurant_id IS NOT NULL;

-- Log the results
DO $$ 
DECLARE 
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % chats with correct restaurant_id', updated_count;
END $$;