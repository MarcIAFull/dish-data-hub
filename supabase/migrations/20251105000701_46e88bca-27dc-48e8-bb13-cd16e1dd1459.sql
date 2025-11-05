-- Add missing columns to agents table for AI configuration
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS enable_order_creation BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_automatic_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_product_search BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS order_confirmation_required BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN agents.enable_order_creation IS 'Allow AI to create orders automatically';
COMMENT ON COLUMN agents.enable_automatic_notifications IS 'Send automatic notifications to customers';
COMMENT ON COLUMN agents.enable_product_search IS 'Enable AI product search and recommendations';
COMMENT ON COLUMN agents.order_confirmation_required IS 'Require explicit customer confirmation before creating order';