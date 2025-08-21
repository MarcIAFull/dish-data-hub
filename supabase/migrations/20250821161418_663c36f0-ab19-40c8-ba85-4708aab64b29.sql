-- Add superagentes_iframe column to agents table and remove old WhatsApp fields
ALTER TABLE agents 
ADD COLUMN superagentes_iframe TEXT,
DROP COLUMN IF EXISTS whatsapp_number,
DROP COLUMN IF EXISTS evolution_api_instance,
DROP COLUMN IF EXISTS evolution_api_token;