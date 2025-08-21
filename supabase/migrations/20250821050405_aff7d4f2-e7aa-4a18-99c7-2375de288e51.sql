-- FASE 3: SEMANA 1 - ESTRUTURA DE DADOS EXPANDIDA

-- 1. DELIVERY ZONES - Zonas de entrega com taxas e tempos
CREATE TABLE public.delivery_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  polygon_coordinates JSONB NOT NULL, -- Array de coordenadas para definir a zona
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  min_order_value NUMERIC NOT NULL DEFAULT 0,
  max_order_value NUMERIC,
  estimated_delivery_time INTEGER NOT NULL DEFAULT 30, -- em minutos
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. PAYMENT METHODS - Métodos de pagamento aceitos
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 'cash', 'card', 'pix', 'stripe', etc
  display_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  requires_change BOOLEAN NOT NULL DEFAULT false, -- para dinheiro
  config JSONB NOT NULL DEFAULT '{}', -- configurações específicas
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ORDER STATUS HISTORY - Histórico completo de mudanças de status
CREATE TABLE public.order_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  previous_status TEXT,
  changed_by UUID, -- pode ser null para mudanças automáticas
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. CART SESSIONS - Carrinho persistente para usuários
CREATE TABLE public.cart_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL, -- pode ser user_id ou session_id anônimo
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]', -- array de items do carrinho
  delivery_zone_id UUID REFERENCES delivery_zones(id),
  payment_method_id UUID REFERENCES payment_methods(id),
  delivery_address TEXT,
  notes TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. DELIVERY INTEGRATIONS - Configuração para Glovo/Uber Eats
CREATE TABLE public.delivery_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'glovo', 'uber_eats', 'ifood', etc
  is_active BOOLEAN NOT NULL DEFAULT true,
  api_credentials JSONB NOT NULL DEFAULT '{}', -- chaves da API
  menu_sync_enabled BOOLEAN NOT NULL DEFAULT false,
  order_sync_enabled BOOLEAN NOT NULL DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending', -- 'pending', 'success', 'error'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. KITCHEN DISPLAY SETTINGS - Configurações da cozinha
CREATE TABLE public.kitchen_display_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  station_name TEXT NOT NULL, -- 'grill', 'salads', 'desserts', etc
  categories JSONB NOT NULL DEFAULT '[]', -- categorias que esta estação prepara
  auto_timer_minutes INTEGER DEFAULT 15,
  notification_sound BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. NOTIFICATION TEMPLATES - Templates de notificações
CREATE TABLE public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'order_confirmed', 'order_preparing', 'order_ready', etc
  channel TEXT NOT NULL, -- 'whatsapp', 'sms', 'email', 'push'
  template TEXT NOT NULL, -- template com variáveis {{order_number}}, {{customer_name}}, etc
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MELHORIAS NAS TABELAS EXISTENTES

-- Expandir tabela ORDERS
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_zone_id UUID REFERENCES delivery_zones(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_delivery_time TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS actual_delivery_time TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_coordinates JSONB; -- lat/lng do entregador
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source_channel TEXT DEFAULT 'manual'; -- 'website', 'whatsapp', 'phone', 'glovo', etc
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS special_instructions TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS kitchen_notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS preparation_started_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ;

-- Melhorar tabela CUSTOMERS
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'; -- preferências alimentares, etc
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS order_count INTEGER DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS total_spent NUMERIC DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS last_order_at TIMESTAMPTZ;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS delivery_addresses JSONB DEFAULT '[]'; -- endereços salvos
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS favorite_products JSONB DEFAULT '[]';

-- Melhorar tabela PRODUCTS
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS preparation_time INTEGER DEFAULT 15; -- tempo em minutos
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS calories INTEGER;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS allergens JSONB DEFAULT '[]';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ingredients JSONB DEFAULT '[]';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'; -- 'vegetarian', 'spicy', etc

-- ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_delivery_zones_restaurant ON delivery_zones(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_restaurant ON payment_methods(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_session ON cart_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_restaurant ON cart_sessions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_delivery_integrations_restaurant ON delivery_integrations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_display_restaurant ON kitchen_display_settings(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_restaurant ON notification_templates(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_source_channel ON orders(source_channel);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_code ON orders(tracking_code);

-- TRIGGERS PARA UPDATED_AT
CREATE TRIGGER update_delivery_zones_updated_at BEFORE UPDATE ON delivery_zones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_sessions_updated_at BEFORE UPDATE ON cart_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_delivery_integrations_updated_at BEFORE UPDATE ON delivery_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kitchen_display_updated_at BEFORE UPDATE ON kitchen_display_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- TRIGGER PARA ORDER STATUS HISTORY
CREATE OR REPLACE FUNCTION public.track_order_status_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (order_id, status, previous_status, notes)
    VALUES (NEW.id, NEW.status, OLD.status, 'Status updated automatically');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_status_change_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION track_order_status_changes();

-- FUNÇÃO PARA LIMPAR CARRINHOS EXPIRADOS
CREATE OR REPLACE FUNCTION public.cleanup_expired_carts()
RETURNS void AS $$
BEGIN
  DELETE FROM cart_sessions WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- RLS POLICIES

-- Delivery Zones
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active delivery zones" ON delivery_zones FOR SELECT USING (is_active = true);
CREATE POLICY "Users can manage delivery zones of their restaurants" ON delivery_zones FOR ALL USING (
  EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = delivery_zones.restaurant_id AND restaurants.user_id = auth.uid())
);

-- Payment Methods  
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active payment methods" ON payment_methods FOR SELECT USING (is_active = true);
CREATE POLICY "Users can manage payment methods of their restaurants" ON payment_methods FOR ALL USING (
  EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = payment_methods.restaurant_id AND restaurants.user_id = auth.uid())
);

-- Order Status History
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view order status history of their restaurants" ON order_status_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders JOIN restaurants ON restaurants.id = orders.restaurant_id 
          WHERE orders.id = order_status_history.order_id AND restaurants.user_id = auth.uid())
);

-- Cart Sessions
ALTER TABLE public.cart_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage their own cart session" ON cart_sessions FOR ALL USING (true);

-- Delivery Integrations
ALTER TABLE public.delivery_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage delivery integrations of their restaurants" ON delivery_integrations FOR ALL USING (
  EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = delivery_integrations.restaurant_id AND restaurants.user_id = auth.uid())
);

-- Kitchen Display Settings
ALTER TABLE public.kitchen_display_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage kitchen display settings of their restaurants" ON kitchen_display_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = kitchen_display_settings.restaurant_id AND restaurants.user_id = auth.uid())
);

-- Notification Templates
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage notification templates of their restaurants" ON notification_templates FOR ALL USING (
  EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = notification_templates.restaurant_id AND restaurants.user_id = auth.uid())
);