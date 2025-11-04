-- FASE 2: Add operation settings to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS estimated_prep_time INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS estimated_delivery_time INTEGER DEFAULT 40,
ADD COLUMN IF NOT EXISTS max_delivery_distance NUMERIC(10,2) DEFAULT 15.0,
ADD COLUMN IF NOT EXISTS packaging_fee NUMERIC(10,2) DEFAULT 0.34,
ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{"monday": {"open": "10:00", "close": "22:00", "enabled": true}, "tuesday": {"open": "10:00", "close": "22:00", "enabled": true}, "wednesday": {"open": "10:00", "close": "22:00", "enabled": true}, "thursday": {"open": "10:00", "close": "22:00", "enabled": true}, "friday": {"open": "10:00", "close": "22:00", "enabled": true}, "saturday": {"open": "10:00", "close": "22:00", "enabled": true}, "sunday": {"open": "10:00", "close": "22:00", "enabled": true}}'::jsonb;

-- Add comment to explain the structure
COMMENT ON COLUMN restaurants.working_hours IS 'Store working hours in format: {"monday": {"open": "10:00", "close": "22:00", "enabled": true}, ...}';

-- FASE 3: Create custom_messages table for personalized AI messages
CREATE TABLE IF NOT EXISTS custom_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('greeting', 'order_confirmation', 'thank_you', 'closed', 'unavailable')),
  message_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(restaurant_id, message_type)
);

-- Enable RLS on custom_messages
ALTER TABLE custom_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_messages
CREATE POLICY "Admins can manage all custom messages"
  ON custom_messages
  FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage custom messages of own restaurants"
  ON custom_messages
  FOR ALL
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active custom messages"
  ON custom_messages
  FOR SELECT
  USING (is_active = true);

-- Create index for faster lookups
CREATE INDEX idx_custom_messages_restaurant_type ON custom_messages(restaurant_id, message_type) WHERE is_active = true;