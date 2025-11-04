-- FASE 1: Adicionar campo conversation_state em chats
ALTER TABLE public.chats 
ADD COLUMN conversation_state text DEFAULT 'greeting' 
CHECK (conversation_state IN ('greeting', 'discovery', 'presentation', 'upsell', 'logistics', 'address', 'payment', 'summary', 'confirmed'));

COMMENT ON COLUMN public.chats.conversation_state IS 'Estado atual da conversa no fluxo de atendimento (9 estados)';

-- FASE 2: Criar tabela delivery_zones para taxas de entrega dinâmicas
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  min_distance numeric NOT NULL CHECK (min_distance >= 0),
  max_distance numeric NOT NULL CHECK (max_distance > min_distance),
  fee numeric NOT NULL CHECK (fee >= 0),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT unique_restaurant_distance UNIQUE (restaurant_id, min_distance, max_distance)
);

COMMENT ON TABLE public.delivery_zones IS 'Zonas de entrega com taxas baseadas em distância';

-- Enable RLS
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para delivery_zones
CREATE POLICY "Admins can manage all delivery zones"
  ON public.delivery_zones
  FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage delivery zones of own restaurants"
  ON public.delivery_zones
  FOR ALL
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active delivery zones"
  ON public.delivery_zones
  FOR SELECT
  USING (is_active = true);

-- Índice para performance
CREATE INDEX idx_delivery_zones_restaurant ON public.delivery_zones(restaurant_id);
CREATE INDEX idx_delivery_zones_distance ON public.delivery_zones(min_distance, max_distance) WHERE is_active = true;

-- Inserir zonas padrão (exemplo)
-- Os usuários podem customizar depois
INSERT INTO public.delivery_zones (restaurant_id, min_distance, max_distance, fee)
SELECT 
  id,
  0, 3, 5.00
FROM public.restaurants
WHERE NOT EXISTS (
  SELECT 1 FROM public.delivery_zones WHERE delivery_zones.restaurant_id = restaurants.id
)
LIMIT 1;

INSERT INTO public.delivery_zones (restaurant_id, min_distance, max_distance, fee)
SELECT 
  id,
  3.01, 5, 8.00
FROM public.restaurants
WHERE NOT EXISTS (
  SELECT 1 FROM public.delivery_zones WHERE delivery_zones.restaurant_id = restaurants.id AND min_distance = 3.01
)
LIMIT 1;

INSERT INTO public.delivery_zones (restaurant_id, min_distance, max_distance, fee)
SELECT 
  id,
  5.01, 10, 12.00
FROM public.restaurants
WHERE NOT EXISTS (
  SELECT 1 FROM public.delivery_zones WHERE delivery_zones.restaurant_id = restaurants.id AND min_distance = 5.01
)
LIMIT 1;