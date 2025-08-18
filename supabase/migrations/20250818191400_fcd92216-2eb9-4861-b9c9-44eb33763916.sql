-- Primeiro, vamos ver quais políticas existem e removê-las
DROP POLICY IF EXISTS "Users can upload images to their restaurants" ON storage.objects;
DROP POLICY IF EXISTS "Users can view images of their restaurants" ON storage.objects;
DROP POLICY IF EXISTS "Users can update images of their restaurants" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete images of their restaurants" ON storage.objects;
DROP POLICY IF EXISTS "Public can view restaurant images" ON storage.objects;

-- Política mais simples: usuários autenticados podem fazer upload no bucket restaurant-images
CREATE POLICY "Authenticated users can upload to restaurant-images" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'restaurant-images' AND 
    auth.role() = 'authenticated'
  );

-- Usuários autenticados podem ver suas próprias imagens
CREATE POLICY "Authenticated users can view restaurant-images" 
  ON storage.objects 
  FOR SELECT 
  USING (
    bucket_id = 'restaurant-images'
  );

-- Usuários autenticados podem atualizar imagens
CREATE POLICY "Authenticated users can update restaurant-images" 
  ON storage.objects 
  FOR UPDATE 
  USING (
    bucket_id = 'restaurant-images' AND 
    auth.role() = 'authenticated'
  );

-- Usuários autenticados podem deletar imagens
CREATE POLICY "Authenticated users can delete restaurant-images" 
  ON storage.objects 
  FOR DELETE 
  USING (
    bucket_id = 'restaurant-images' AND 
    auth.role() = 'authenticated'
  );