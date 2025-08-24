-- A/B Testing System Tables
CREATE TABLE IF NOT EXISTS public.ab_test_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  test_name TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  response_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  traffic_percentage INTEGER DEFAULT 50, -- percentage of traffic for this variant
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE
);

-- A/B Test Results tracking
CREATE TABLE IF NOT EXISTS public.ab_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  variant_id UUID NOT NULL,
  conversation_id UUID NOT NULL,
  customer_phone TEXT NOT NULL,
  response_used TEXT NOT NULL,
  user_satisfaction DECIMAL(3,2), -- 1-5 rating
  conversion_achieved BOOLEAN DEFAULT false,
  interaction_duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES public.ab_test_variants(id) ON DELETE CASCADE,
  FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE
);

-- Agent Performance Metrics
CREATE TABLE IF NOT EXISTS public.agent_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  date DATE NOT NULL,
  total_conversations INTEGER DEFAULT 0,
  successful_conversations INTEGER DEFAULT 0,
  avg_response_time_seconds DECIMAL(8,2) DEFAULT 0,
  avg_satisfaction_score DECIMAL(3,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  escalation_rate DECIMAL(5,2) DEFAULT 0,
  total_orders_generated INTEGER DEFAULT 0,
  total_revenue_generated DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE,
  UNIQUE(agent_id, date)
);

-- Response Effectiveness Tracking
CREATE TABLE IF NOT EXISTS public.response_effectiveness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  response_type TEXT NOT NULL, -- greeting, product_info, order_assistance, etc
  response_text TEXT NOT NULL,
  usage_count INTEGER DEFAULT 1,
  success_rate DECIMAL(5,2) DEFAULT 0,
  avg_user_satisfaction DECIMAL(3,2) DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT now(),
  effectiveness_score DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE
);

-- Enable RLS for all new tables
ALTER TABLE public.ab_test_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.response_effectiveness ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage A/B test variants of their restaurants" ON public.ab_test_variants
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE restaurants.id = ab_test_variants.restaurant_id 
    AND restaurants.user_id = auth.uid()
  ));

CREATE POLICY "Users can view A/B test results of their restaurants" ON public.ab_test_results
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE restaurants.id = ab_test_results.restaurant_id 
    AND restaurants.user_id = auth.uid()
  ));

CREATE POLICY "Users can view agent performance metrics of their restaurants" ON public.agent_performance_metrics
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE restaurants.id = agent_performance_metrics.restaurant_id 
    AND restaurants.user_id = auth.uid()
  ));

CREATE POLICY "Users can view response effectiveness of their restaurants" ON public.response_effectiveness
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE restaurants.id = response_effectiveness.restaurant_id 
    AND restaurants.user_id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX idx_ab_test_variants_restaurant_agent ON public.ab_test_variants(restaurant_id, agent_id);
CREATE INDEX idx_ab_test_results_variant_conversation ON public.ab_test_results(variant_id, conversation_id);
CREATE INDEX idx_agent_performance_metrics_agent_date ON public.agent_performance_metrics(agent_id, date);
CREATE INDEX idx_response_effectiveness_agent_type ON public.response_effectiveness(agent_id, response_type);