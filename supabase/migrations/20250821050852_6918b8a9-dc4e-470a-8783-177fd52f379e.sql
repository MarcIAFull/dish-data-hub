-- Business Intelligence and Analytics Tables for Phase 4

-- Daily business snapshots for historical analysis
CREATE TABLE public.bi_daily_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  snapshot_date DATE NOT NULL,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  avg_order_value DECIMAL(10,2) DEFAULT 0,
  customer_count INTEGER DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  returning_customers INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  ai_interactions INTEGER DEFAULT 0,
  human_interactions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, snapshot_date)
);

-- Product performance analytics
CREATE TABLE public.product_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  product_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  units_sold INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  profit_margin DECIMAL(5,2) DEFAULT 0,
  customer_rating DECIMAL(3,2) DEFAULT 0,
  order_frequency DECIMAL(5,2) DEFAULT 0,
  seasonality_score DECIMAL(5,2) DEFAULT 0,
  trend_direction TEXT DEFAULT 'stable',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer segmentation and behavior
CREATE TABLE public.customer_segments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  segment_type TEXT NOT NULL, -- 'vip', 'regular', 'occasional', 'at_risk', 'new'
  ltv_score DECIMAL(10,2) DEFAULT 0, -- Lifetime Value
  frequency_score INTEGER DEFAULT 0,
  recency_days INTEGER DEFAULT 0,
  monetary_score DECIMAL(10,2) DEFAULT 0,
  churn_probability DECIMAL(5,2) DEFAULT 0,
  next_order_prediction DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, customer_id)
);

-- AI-generated insights cache
CREATE TABLE public.ai_insights_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  insight_type TEXT NOT NULL, -- 'pricing', 'menu', 'demand', 'customer'
  insight_data JSONB NOT NULL DEFAULT '{}',
  confidence_score DECIMAL(5,2) DEFAULT 0,
  impact_score DECIMAL(5,2) DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending', 'applied', 'rejected'
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price recommendations from AI
CREATE TABLE public.price_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  product_id UUID NOT NULL,
  current_price DECIMAL(10,2) NOT NULL,
  recommended_price DECIMAL(10,2) NOT NULL,
  reason TEXT,
  expected_impact JSONB DEFAULT '{}', -- revenue, demand changes
  confidence_level DECIMAL(5,2) DEFAULT 0,
  market_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending', -- 'pending', 'testing', 'applied', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business intelligence materialized views for performance
CREATE MATERIALIZED VIEW public.business_metrics AS
SELECT 
  r.id as restaurant_id,
  r.name as restaurant_name,
  COUNT(DISTINCT o.id) as total_orders,
  SUM(o.total) as total_revenue,
  AVG(o.total) as avg_order_value,
  COUNT(DISTINCT o.customer_id) as unique_customers,
  COUNT(DISTINCT c.id) as total_conversations,
  AVG(CASE WHEN ci.sentiment_score IS NOT NULL THEN ci.sentiment_score END) as avg_sentiment,
  DATE_TRUNC('month', o.created_at) as period
FROM restaurants r
LEFT JOIN orders o ON r.id = o.restaurant_id AND o.created_at >= NOW() - INTERVAL '12 months'
LEFT JOIN conversations c ON EXISTS (
  SELECT 1 FROM agents a WHERE a.restaurant_id = r.id AND a.id = c.agent_id
)
LEFT JOIN conversation_insights ci ON c.id = ci.conversation_id
WHERE r.is_active = true
GROUP BY r.id, r.name, DATE_TRUNC('month', o.created_at);

-- Enable RLS on new tables
ALTER TABLE public.bi_daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage BI snapshots of their restaurants" 
ON public.bi_daily_snapshots FOR ALL 
USING (EXISTS (
  SELECT 1 FROM restaurants 
  WHERE restaurants.id = bi_daily_snapshots.restaurant_id 
  AND restaurants.user_id = auth.uid()
));

CREATE POLICY "Users can manage product performance of their restaurants" 
ON public.product_performance FOR ALL 
USING (EXISTS (
  SELECT 1 FROM restaurants 
  WHERE restaurants.id = product_performance.restaurant_id 
  AND restaurants.user_id = auth.uid()
));

CREATE POLICY "Users can manage customer segments of their restaurants" 
ON public.customer_segments FOR ALL 
USING (EXISTS (
  SELECT 1 FROM restaurants 
  WHERE restaurants.id = customer_segments.restaurant_id 
  AND restaurants.user_id = auth.uid()
));

CREATE POLICY "Users can manage AI insights of their restaurants" 
ON public.ai_insights_cache FOR ALL 
USING (EXISTS (
  SELECT 1 FROM restaurants 
  WHERE restaurants.id = ai_insights_cache.restaurant_id 
  AND restaurants.user_id = auth.uid()
));

CREATE POLICY "Users can manage price recommendations of their restaurants" 
ON public.price_recommendations FOR ALL 
USING (EXISTS (
  SELECT 1 FROM restaurants 
  WHERE restaurants.id = price_recommendations.restaurant_id 
  AND restaurants.user_id = auth.uid()
));

-- Indexes for performance
CREATE INDEX idx_bi_snapshots_restaurant_date ON public.bi_daily_snapshots(restaurant_id, snapshot_date);
CREATE INDEX idx_product_performance_restaurant_period ON public.product_performance(restaurant_id, period_start, period_end);
CREATE INDEX idx_customer_segments_restaurant_segment ON public.customer_segments(restaurant_id, segment_type);
CREATE INDEX idx_ai_insights_restaurant_type ON public.ai_insights_cache(restaurant_id, insight_type);
CREATE INDEX idx_price_recommendations_restaurant_status ON public.price_recommendations(restaurant_id, status);

-- Triggers for updated_at
CREATE TRIGGER update_bi_snapshots_updated_at
  BEFORE UPDATE ON public.bi_daily_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_performance_updated_at
  BEFORE UPDATE ON public.product_performance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_segments_updated_at
  BEFORE UPDATE ON public.customer_segments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_insights_updated_at
  BEFORE UPDATE ON public.ai_insights_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_price_recommendations_updated_at
  BEFORE UPDATE ON public.price_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to refresh business metrics view
CREATE OR REPLACE FUNCTION public.refresh_business_metrics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.business_metrics;
END;
$$;