-- Add evolution_api_base_url field to agents table
ALTER TABLE agents 
ADD COLUMN evolution_api_base_url text DEFAULT 'https://evolution.fullbpo.com';

-- Add comment to document the field
COMMENT ON COLUMN agents.evolution_api_base_url IS 'Base URL for Evolution API instance (e.g., https://evolution.fullbpo.com or https://api.evolutionapi.com)';