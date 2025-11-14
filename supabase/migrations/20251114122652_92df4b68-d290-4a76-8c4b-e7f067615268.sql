-- Add session tracking to chats table
ALTER TABLE chats 
ADD COLUMN session_id TEXT,
ADD COLUMN session_status TEXT DEFAULT 'active',
ADD COLUMN session_created_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster session queries
CREATE INDEX idx_chats_session_id ON chats(session_id);
CREATE INDEX idx_chats_session_status ON chats(session_status);

-- Create function to generate unique session IDs
CREATE OR REPLACE FUNCTION generate_session_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'sess_' || to_char(NOW(), 'YYYYMMDD_HH24MISS') || '_' || substr(md5(random()::text), 1, 8);
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining session_status values
COMMENT ON COLUMN chats.session_status IS 'Session status: active, completed, abandoned';
COMMENT ON COLUMN chats.session_id IS 'Unique identifier for order session to group related messages';