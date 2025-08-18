-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create restaurants table
CREATE TABLE public.restaurants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  address TEXT,
  phone TEXT,
  whatsapp TEXT,
  instagram TEXT,
  logo_url TEXT,
  cover_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on restaurants
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name');
  RETURN new;
END;
$$;

-- Create trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for restaurants
CREATE POLICY "Users can view their own restaurants" 
  ON public.restaurants 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own restaurants" 
  ON public.restaurants 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own restaurants" 
  ON public.restaurants 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own restaurants" 
  ON public.restaurants 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Public read access for restaurants (for public pages)
CREATE POLICY "Public can view active restaurants" 
  ON public.restaurants 
  FOR SELECT 
  USING (is_active = true);

-- RLS Policies for categories
CREATE POLICY "Users can manage categories of their restaurants" 
  ON public.categories 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants 
      WHERE id = categories.restaurant_id 
      AND user_id = auth.uid()
    )
  );

-- Public read access for categories
CREATE POLICY "Public can view categories of active restaurants" 
  ON public.categories 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants 
      WHERE id = categories.restaurant_id 
      AND is_active = true
    )
  );

-- RLS Policies for products
CREATE POLICY "Users can manage products of their restaurants" 
  ON public.products 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.categories c
      JOIN public.restaurants r ON r.id = c.restaurant_id
      WHERE c.id = products.category_id 
      AND r.user_id = auth.uid()
    )
  );

-- Public read access for products
CREATE POLICY "Public can view available products of active restaurants" 
  ON public.products 
  FOR SELECT 
  USING (
    is_available = true AND
    EXISTS (
      SELECT 1 FROM public.categories c
      JOIN public.restaurants r ON r.id = c.restaurant_id
      WHERE c.id = products.category_id 
      AND r.is_active = true
    )
  );

-- Create storage bucket for restaurant images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('restaurant-images', 'restaurant-images', true);

-- Storage policies for restaurant images
CREATE POLICY "Users can upload images to their folder" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'restaurant-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view images in their folder" 
  ON storage.objects 
  FOR SELECT 
  USING (
    bucket_id = 'restaurant-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update images in their folder" 
  ON storage.objects 
  FOR UPDATE 
  USING (
    bucket_id = 'restaurant-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete images in their folder" 
  ON storage.objects 
  FOR DELETE 
  USING (
    bucket_id = 'restaurant-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public read access for restaurant images
CREATE POLICY "Public can view restaurant images" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'restaurant-images');

-- Add indexes for better performance
CREATE INDEX idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX idx_restaurants_user_id ON public.restaurants(user_id);
CREATE INDEX idx_categories_restaurant_id ON public.categories(restaurant_id);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_available ON public.products(is_available);