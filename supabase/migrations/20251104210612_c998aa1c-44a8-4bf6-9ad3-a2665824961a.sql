-- Add country column to restaurants table
ALTER TABLE restaurants 
ADD COLUMN country VARCHAR(2) DEFAULT 'PT' CHECK (country IN ('PT', 'BR', 'ES', 'FR', 'DE', 'US'));

-- Add comment for documentation
COMMENT ON COLUMN restaurants.country IS 'ISO 3166-1 alpha-2 country code (PT=Portugal, BR=Brazil, etc.)';

-- Create index for performance
CREATE INDEX idx_restaurants_country ON restaurants(country);