-- Create analytics events table for tracking user interactions
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'message_sent', 'order_created', 'conversation_started', etc.
  event_data JSONB NOT NULL DEFAULT '{}',
  user_phone TEXT,
  conversation_id UUID REFERENCES conversations(id),
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversation insights table for AI analysis
CREATE TABLE public.conversation_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  sentiment_score NUMERIC(3,2), -- -1.0 to 1.0
  key_topics TEXT[],
  intent_detected TEXT,
  satisfaction_score NUMERIC(3,2), -- 0.0 to 1.0
  fallback_count INTEGER DEFAULT 0,
  resolution_time_minutes INTEGER,
  converted_to_order BOOLEAN DEFAULT false,
  analysis_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analytics_events
CREATE POLICY "Users can manage analytics events of their restaurants" 
ON public.analytics_events 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM restaurants 
  WHERE restaurants.id = analytics_events.restaurant_id 
  AND restaurants.user_id = auth.uid()
));

-- RLS Policies for conversation_insights
CREATE POLICY "Users can manage conversation insights of their restaurants" 
ON public.conversation_insights 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM restaurants 
  WHERE restaurants.id = conversation_insights.restaurant_id 
  AND restaurants.user_id = auth.uid()
));

-- Create indexes for performance
CREATE INDEX idx_analytics_events_restaurant_id ON analytics_events(restaurant_id);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_conversation_insights_restaurant_id ON conversation_insights(restaurant_id);
CREATE INDEX idx_conversation_insights_conversation_id ON conversation_insights(conversation_id);

-- Create materialized views for analytics performance
CREATE MATERIALIZED VIEW public.daily_analytics AS
SELECT 
  restaurant_id,
  DATE(created_at) as date,
  event_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_phone) as unique_users
FROM analytics_events 
GROUP BY restaurant_id, DATE(created_at), event_type;

CREATE UNIQUE INDEX idx_daily_analytics_unique ON daily_analytics(restaurant_id, date, event_type);

-- Create materialized view for conversion metrics
CREATE MATERIALIZED VIEW public.conversion_metrics AS
SELECT 
  r.id as restaurant_id,
  r.name as restaurant_name,
  COUNT(DISTINCT c.id) as total_conversations,
  COUNT(DISTINCT o.id) as total_orders,
  CASE 
    WHEN COUNT(DISTINCT c.id) > 0 
    THEN ROUND((COUNT(DISTINCT o.id)::NUMERIC / COUNT(DISTINCT c.id)::NUMERIC) * 100, 2)
    ELSE 0 
  END as conversion_rate,
  AVG(o.total) as avg_order_value,
  SUM(o.total) as total_revenue
FROM restaurants r
LEFT JOIN conversations c ON c.agent_id IN (
  SELECT id FROM agents WHERE restaurant_id = r.id
)
LEFT JOIN orders o ON o.conversation_id = c.id
WHERE r.is_active = true
GROUP BY r.id, r.name;

-- Create triggers for updated_at
CREATE TRIGGER update_conversation_insights_updated_at
  BEFORE UPDATE ON public.conversation_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_analytics;
  REFRESH MATERIALIZED VIEW conversion_metrics;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for analytics tables
ALTER TABLE public.analytics_events REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_insights REPLICA IDENTITY FULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE analytics_events;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_insights;