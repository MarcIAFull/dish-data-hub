-- FASE 5: Criar tabela product_modifiers
CREATE TABLE product_modifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  modifier_type text NOT NULL CHECK (modifier_type IN ('borda', 'adicional', 'tamanho', 'remocao')),
  price numeric NOT NULL DEFAULT 0,
  applicable_categories text[],
  applicable_products uuid[],
  is_active boolean DEFAULT true,
  max_quantity integer DEFAULT 1,
  display_order integer DEFAULT 0,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_modifiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all product modifiers"
  ON product_modifiers FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage modifiers of own restaurants"
  ON product_modifiers FOR ALL
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active modifiers"
  ON product_modifiers FOR SELECT
  USING (is_active = true);

CREATE INDEX idx_product_modifiers_restaurant ON product_modifiers(restaurant_id);
CREATE INDEX idx_product_modifiers_type ON product_modifiers(modifier_type);
CREATE INDEX idx_product_modifiers_categories ON product_modifiers USING GIN(applicable_categories);
CREATE INDEX idx_product_modifiers_products ON product_modifiers USING GIN(applicable_products);

-- FASE 6: Adicionar metadata à tabela chats
ALTER TABLE chats ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_chats_metadata ON chats USING GIN(metadata);