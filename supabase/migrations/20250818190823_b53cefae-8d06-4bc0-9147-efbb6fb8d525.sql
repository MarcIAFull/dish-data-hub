-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload images to their folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view images in their folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update images in their folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete images in their folder" ON storage.objects;

-- Create corrected storage policies for restaurant images
-- Users can upload images to restaurants they own
CREATE POLICY "Users can upload images to their restaurants" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'restaurant-images' AND 
    EXISTS (
      SELECT 1 FROM public.restaurants 
      WHERE id::text = (storage.foldername(name))[1] 
      AND user_id = auth.uid()
    )
  );

-- Users can view images of restaurants they own
CREATE POLICY "Users can view images of their restaurants" 
  ON storage.objects 
  FOR SELECT 
  USING (
    bucket_id = 'restaurant-images' AND 
    EXISTS (
      SELECT 1 FROM public.restaurants 
      WHERE id::text = (storage.foldername(name))[1] 
      AND user_id = auth.uid()
    )
  );

-- Users can update images of restaurants they own
CREATE POLICY "Users can update images of their restaurants" 
  ON storage.objects 
  FOR UPDATE 
  USING (
    bucket_id = 'restaurant-images' AND 
    EXISTS (
      SELECT 1 FROM public.restaurants 
      WHERE id::text = (storage.foldername(name))[1] 
      AND user_id = auth.uid()
    )
  );

-- Users can delete images of restaurants they own
CREATE POLICY "Users can delete images of their restaurants" 
  ON storage.objects 
  FOR DELETE 
  USING (
    bucket_id = 'restaurant-images' AND 
    EXISTS (
      SELECT 1 FROM public.restaurants 
      WHERE id::text = (storage.foldername(name))[1] 
      AND user_id = auth.uid()
    )
  );

-- Keep public read access for restaurant images
-- (This policy should already exist, but adding it to be sure)
CREATE POLICY IF NOT EXISTS "Public can view restaurant images" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'restaurant-images');