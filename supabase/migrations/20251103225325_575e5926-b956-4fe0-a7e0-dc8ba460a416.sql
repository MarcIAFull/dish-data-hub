-- ============= ORDERS MANAGEMENT SYSTEM =============

-- Create enum for order sources
CREATE TYPE public.order_source AS ENUM ('ai_agent', 'digital_menu', 'marketplace', 'manual');

-- Create enum for order statuses (Kanban columns)
CREATE TYPE public.order_status AS ENUM (
  'pending',      -- Pendente (novo pedido)
  'confirmed',    -- Confirmado (restaurante aceitou)
  'preparing',    -- Em preparo
  'ready',        -- Pronto para entrega/retirada
  'in_delivery',  -- Em entrega (só para delivery)
  'completed',    -- Concluído
  'cancelled'     -- Cancelado
);

-- Add new columns to pedidos table
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS order_source public.order_source DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS order_status public.order_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS delivery_type TEXT CHECK (delivery_type IN ('delivery', 'pickup')),
ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS estimated_time INTEGER, -- em minutos
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Create index for better kanban query performance
CREATE INDEX IF NOT EXISTS idx_pedidos_status_restaurant 
ON public.pedidos(order_status, restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pedidos_source 
ON public.pedidos(order_source);

-- Create table for order status history (audit trail)
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id BIGINT NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  previous_status public.order_status,
  new_status public.order_status NOT NULL,
  changed_by TEXT NOT NULL, -- 'system', 'ai_agent', ou user_id
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Index for history queries
CREATE INDEX IF NOT EXISTS idx_order_status_history_order 
ON public.order_status_history(order_id, changed_at DESC);

-- Enable RLS
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for order_status_history
CREATE POLICY "Admins can view all status history"
ON public.order_status_history FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Users can view own restaurant order history"
ON public.order_status_history FOR SELECT
USING (
  order_id IN (
    SELECT id FROM public.pedidos
    WHERE restaurant_id IN (
      SELECT id FROM public.restaurants
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "System can insert status history"
ON public.order_status_history FOR INSERT
WITH CHECK (true);

-- Function to automatically log status changes
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF (TG_OP = 'UPDATE' AND OLD.order_status IS DISTINCT FROM NEW.order_status) THEN
    INSERT INTO public.order_status_history (
      order_id,
      previous_status,
      new_status,
      changed_by,
      notes
    ) VALUES (
      NEW.id,
      OLD.order_status,
      NEW.order_status,
      COALESCE(current_setting('app.changed_by', true), 'system'),
      COALESCE(current_setting('app.change_notes', true), NULL)
    );
    
    -- Update completed_at when order is completed
    IF NEW.order_status = 'completed' THEN
      NEW.completed_at = NOW();
    END IF;
    
    -- Update cancelled_at when order is cancelled
    IF NEW.order_status = 'cancelled' THEN
      NEW.cancelled_at = NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic status logging
DROP TRIGGER IF EXISTS trigger_log_order_status_change ON public.pedidos;
CREATE TRIGGER trigger_log_order_status_change
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_status_change();

-- Add RLS policy to prevent AI from updating order status
CREATE POLICY "Only humans can update order status"
ON public.pedidos FOR UPDATE
USING (
  -- Admins can update
  is_admin(auth.uid()) OR
  -- Restaurant owners can update their orders
  (restaurant_id IN (
    SELECT id FROM public.restaurants
    WHERE user_id = auth.uid()
  ))
);

-- Add policy for AI to insert orders
CREATE POLICY "System can insert orders"
ON public.pedidos FOR INSERT
WITH CHECK (true);

-- Create view for Kanban board
CREATE OR REPLACE VIEW public.orders_kanban AS
SELECT 
  p.id,
  p.order_status,
  p.order_source,
  p.customer_name,
  p.customer_phone,
  p.delivery_type,
  p.total_amount,
  p.estimated_time,
  p.notes,
  p.created_at,
  p.updated_at,
  p.completed_at,
  p.cancelled_at,
  p.restaurant_id,
  r.name as restaurant_name,
  p.payload,
  (
    SELECT COUNT(*) 
    FROM jsonb_array_elements(p.payload->'items') 
    WHERE p.payload IS NOT NULL
  ) as items_count
FROM public.pedidos p
LEFT JOIN public.restaurants r ON r.id = p.restaurant_id
WHERE p.order_status IS NOT NULL
ORDER BY 
  CASE p.order_status
    WHEN 'pending' THEN 1
    WHEN 'confirmed' THEN 2
    WHEN 'preparing' THEN 3
    WHEN 'ready' THEN 4
    WHEN 'in_delivery' THEN 5
    WHEN 'completed' THEN 6
    WHEN 'cancelled' THEN 7
  END,
  p.created_at ASC;