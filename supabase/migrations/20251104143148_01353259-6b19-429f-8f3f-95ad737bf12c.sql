-- FASE 7: Create payment_methods table
CREATE TABLE payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  method_name text NOT NULL,
  display_name text NOT NULL,
  is_active boolean DEFAULT true,
  requires_data boolean DEFAULT false,
  data_type text,
  data_value text,
  instructions text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(restaurant_id, method_name)
);

-- RLS Policies for payment_methods
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all payment methods"
  ON payment_methods FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage payment methods of own restaurants"
  ON payment_methods FOR ALL
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active payment methods"
  ON payment_methods FOR SELECT
  USING (is_active = true);

-- Create index
CREATE INDEX idx_payment_methods_restaurant ON payment_methods(restaurant_id);

-- FASE 4: Add emoji column to categories (optional enhancement)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS emoji text DEFAULT '📋';

-- Update existing categories with appropriate emojis
UPDATE categories SET emoji = '🍕' WHERE name ILIKE '%pizza%';
UPDATE categories SET emoji = '🍔' WHERE name ILIKE '%hamburguer%' OR name ILIKE '%burger%';
UPDATE categories SET emoji = '🥤' WHERE name ILIKE '%bebida%' OR name ILIKE '%drink%';
UPDATE categories SET emoji = '🍰' WHERE name ILIKE '%sobremesa%' OR name ILIKE '%doce%';
UPDATE categories SET emoji = '🥘' WHERE name ILIKE '%prato%' OR name ILIKE '%refeição%';
UPDATE categories SET emoji = '🌮' WHERE name ILIKE '%lanche%' OR name ILIKE '%salgad%';
UPDATE categories SET emoji = '🍨' WHERE name ILIKE '%açaí%' OR name ILIKE '%sorvete%';