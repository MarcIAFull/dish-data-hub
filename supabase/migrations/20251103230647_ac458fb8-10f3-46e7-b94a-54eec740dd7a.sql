-- ENTREGA 1: Adicionar coluna reopened_at e outras melhorias na tabela chats
ALTER TABLE chats ADD COLUMN IF NOT EXISTS reopened_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS reopened_count INTEGER DEFAULT 0;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- ENTREGA 3: Tabela de notas internas
CREATE TABLE IF NOT EXISTS conversation_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id BIGINT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para conversation_notes
ALTER TABLE conversation_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all notes"
  ON conversation_notes
  FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage notes for own restaurant chats"
  ON conversation_notes
  FOR ALL
  USING (
    chat_id IN (
      SELECT c.id FROM chats c
      WHERE c.restaurant_id IN (
        SELECT id FROM restaurants WHERE user_id = auth.uid()
      )
    )
  );

-- ENTREGA 3: Tabela de tags/categorias
CREATE TABLE IF NOT EXISTS conversation_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(restaurant_id, name)
);

-- Tabela de relacionamento many-to-many
CREATE TABLE IF NOT EXISTS chat_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id BIGINT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES conversation_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(chat_id, tag_id)
);

-- RLS para conversation_tags
ALTER TABLE conversation_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all tags"
  ON conversation_tags
  FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage tags for own restaurants"
  ON conversation_tags
  FOR ALL
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

-- RLS para chat_tags
ALTER TABLE chat_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all chat tags"
  ON chat_tags
  FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage chat tags for own restaurants"
  ON chat_tags
  FOR ALL
  USING (
    chat_id IN (
      SELECT c.id FROM chats c
      WHERE c.restaurant_id IN (
        SELECT id FROM restaurants WHERE user_id = auth.uid()
      )
    )
  );

-- ENTREGA 3: Tabela de respostas rápidas
CREATE TABLE IF NOT EXISTS quick_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  shortcut TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(restaurant_id, shortcut)
);

-- RLS para quick_replies
ALTER TABLE quick_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all quick replies"
  ON quick_replies
  FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage quick replies for own restaurants"
  ON quick_replies
  FOR ALL
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chats_archived_at ON chats(archived_at);
CREATE INDEX IF NOT EXISTS idx_chats_reopened_at ON chats(reopened_at);
CREATE INDEX IF NOT EXISTS idx_conversation_notes_chat_id ON conversation_notes(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_tags_chat_id ON chat_tags(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_tags_tag_id ON chat_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_messages_content_search ON messages USING gin(to_tsvector('portuguese', content));