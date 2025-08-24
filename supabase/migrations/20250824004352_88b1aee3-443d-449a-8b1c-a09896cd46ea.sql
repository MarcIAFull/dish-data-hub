-- Create dynamic context system tables
CREATE TABLE IF NOT EXISTS public.product_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  product_id UUID NOT NULL,
  current_stock INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  auto_disable_when_empty BOOLEAN DEFAULT true,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.dynamic_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  discount_type TEXT DEFAULT 'percentage', -- percentage, fixed_amount, bogo
  discount_value DECIMAL(10,2) NOT NULL,
  applicable_products JSONB DEFAULT '[]'::jsonb,
  applicable_categories JSONB DEFAULT '[]'::jsonb,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  auto_announce BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  max_usage INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE
);

-- Learning system tables
CREATE TABLE IF NOT EXISTS public.ai_learning_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  conversation_id UUID NOT NULL,
  customer_phone TEXT NOT NULL,
  interaction_type TEXT NOT NULL, -- question, complaint, compliment, order, etc
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  user_feedback_score DECIMAL(3,2), -- 1-5 rating
  context_data JSONB DEFAULT '{}'::jsonb,
  sentiment_score DECIMAL(3,2),
  intent_detected TEXT,
  successful_outcome BOOLEAN,
  learning_tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE,
  FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE
);

-- Sentiment analysis tracking
CREATE TABLE IF NOT EXISTS public.sentiment_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  conversation_id UUID NOT NULL,
  customer_phone TEXT NOT NULL,
  message_id UUID NOT NULL,
  sentiment_score DECIMAL(3,2) NOT NULL, -- -1 to 1
  sentiment_label TEXT NOT NULL, -- negative, neutral, positive
  confidence_score DECIMAL(3,2) NOT NULL,
  emotional_indicators JSONB DEFAULT '{}'::jsonb,
  response_strategy TEXT, -- empathetic, promotional, informational
  escalation_triggered BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE
);

-- Intelligent fallback system
CREATE TABLE IF NOT EXISTS public.fallback_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  scenario_name TEXT NOT NULL,
  trigger_conditions JSONB NOT NULL, -- sentiment_threshold, keywords, etc
  fallback_type TEXT NOT NULL, -- human_handoff, escalation, specialist_bot
  priority_level INTEGER DEFAULT 1, -- 1-5, higher = more urgent
  auto_trigger BOOLEAN DEFAULT true,
  custom_message TEXT,
  notification_channels JSONB DEFAULT '["email"]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE
);

-- Learning patterns and insights
CREATE TABLE IF NOT EXISTS public.ai_learning_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  pattern_type TEXT NOT NULL, -- frequent_question, common_complaint, popular_combo
  pattern_data JSONB NOT NULL,
  frequency_count INTEGER DEFAULT 1,
  success_rate DECIMAL(3,2),
  last_occurrence TIMESTAMP WITH TIME ZONE DEFAULT now(),
  confidence_level DECIMAL(3,2),
  auto_response_enabled BOOLEAN DEFAULT false,
  suggested_improvement TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE
);

-- Enable RLS for all new tables
ALTER TABLE public.product_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_learning_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fallback_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_learning_patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage inventory of their restaurants" ON public.product_inventory
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE restaurants.id = product_inventory.restaurant_id 
    AND restaurants.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage promotions of their restaurants" ON public.dynamic_promotions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE restaurants.id = dynamic_promotions.restaurant_id 
    AND restaurants.user_id = auth.uid()
  ));

CREATE POLICY "Users can view learning data of their restaurants" ON public.ai_learning_interactions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE restaurants.id = ai_learning_interactions.restaurant_id 
    AND restaurants.user_id = auth.uid()
  ));

CREATE POLICY "Users can view sentiment analytics of their restaurants" ON public.sentiment_analytics
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE restaurants.id = sentiment_analytics.restaurant_id 
    AND restaurants.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage fallback scenarios of their restaurants" ON public.fallback_scenarios
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE restaurants.id = fallback_scenarios.restaurant_id 
    AND restaurants.user_id = auth.uid()
  ));

CREATE POLICY "Users can view learning patterns of their restaurants" ON public.ai_learning_patterns
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE restaurants.id = ai_learning_patterns.restaurant_id 
    AND restaurants.user_id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX idx_product_inventory_restaurant_id ON public.product_inventory(restaurant_id);
CREATE INDEX idx_dynamic_promotions_restaurant_id_active ON public.dynamic_promotions(restaurant_id, is_active);
CREATE INDEX idx_ai_learning_interactions_restaurant_date ON public.ai_learning_interactions(restaurant_id, created_at);
CREATE INDEX idx_sentiment_analytics_restaurant_sentiment ON public.sentiment_analytics(restaurant_id, sentiment_label);
CREATE INDEX idx_fallback_scenarios_restaurant_priority ON public.fallback_scenarios(restaurant_id, priority_level);
CREATE INDEX idx_ai_learning_patterns_restaurant_type ON public.ai_learning_patterns(restaurant_id, pattern_type);