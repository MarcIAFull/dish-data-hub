-- Fase 1: Criação das Tabelas Essenciais

-- 1.1. Criar tabela restaurants
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  address TEXT,
  phone TEXT,
  whatsapp TEXT,
  instagram TEXT,
  is_active BOOLEAN DEFAULT true,
  ai_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies para restaurants
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own restaurants" ON public.restaurants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own restaurants" ON public.restaurants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own restaurants" ON public.restaurants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own restaurants" ON public.restaurants
  FOR DELETE USING (auth.uid() = user_id);

-- 1.2. Criar tabela agents
CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  personality TEXT NOT NULL,
  instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  fallback_enabled BOOLEAN DEFAULT true,
  fallback_timeout_minutes INTEGER DEFAULT 5,
  whatsapp_number TEXT,
  evolution_api_token TEXT,
  evolution_api_instance TEXT,
  webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies para agents
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage agents of own restaurants" ON public.agents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.restaurants 
      WHERE restaurants.id = agents.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

-- 1.3. Criar tabela categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies para categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage categories of own restaurants" ON public.categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.restaurants 
      WHERE restaurants.id = categories.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

-- 1.4. Criar tabela products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies para products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage products of own restaurants" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.categories
      JOIN public.restaurants ON restaurants.id = categories.restaurant_id
      WHERE categories.id = products.category_id
      AND restaurants.user_id = auth.uid()
    )
  );

-- Criar índices para melhor performance
CREATE INDEX idx_restaurants_user_id ON public.restaurants(user_id);
CREATE INDEX idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX idx_agents_restaurant_id ON public.agents(restaurant_id);
CREATE INDEX idx_categories_restaurant_id ON public.categories(restaurant_id);
CREATE INDEX idx_products_category_id ON public.products(category_id);