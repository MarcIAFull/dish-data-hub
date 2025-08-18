-- Verificar se o bucket existe e recriar se necessário
DELETE FROM storage.buckets WHERE id = 'restaurant-images';

-- Recriar o bucket com configurações corretas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'restaurant-images', 
  'restaurant-images', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);