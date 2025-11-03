-- Add RLS policy for restaurant owners to update chats
CREATE POLICY "Restaurant owners can update their chats"
ON chats
FOR UPDATE
USING (
  restaurant_id IN (
    SELECT id FROM restaurants 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  restaurant_id IN (
    SELECT id FROM restaurants 
    WHERE user_id = auth.uid()
  )
);