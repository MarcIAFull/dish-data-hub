-- Create ai_configurations table for centralized AI settings
CREATE TABLE public.ai_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  ai_model TEXT NOT NULL DEFAULT 'gpt-5-2025-08-07',
  temperature NUMERIC DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 500,
  context_memory_turns INTEGER DEFAULT 10,
  language TEXT DEFAULT 'pt-BR',
  response_style TEXT DEFAULT 'friendly',
  knowledge_cutoff DATE DEFAULT '2024-12-01',
  custom_tools JSONB DEFAULT '[]'::jsonb,
  performance_metrics JSONB DEFAULT '{}'::jsonb,
  enable_sentiment_analysis BOOLEAN DEFAULT true,
  enable_conversation_summary BOOLEAN DEFAULT true,
  enable_order_intent_detection BOOLEAN DEFAULT true,
  enable_proactive_suggestions BOOLEAN DEFAULT false,
  enable_multilingual_support BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ai_configurations
ALTER TABLE public.ai_configurations ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing active AI configurations
CREATE POLICY "Public can view active AI configurations" 
ON public.ai_configurations 
FOR SELECT 
USING (is_active = true);

-- Create policy for system admins to manage AI configurations (for now, allow authenticated users)
CREATE POLICY "Authenticated users can manage AI configurations" 
ON public.ai_configurations 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Add AI-related fields to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN ai_enabled BOOLEAN DEFAULT false,
ADD COLUMN ai_configuration_id UUID REFERENCES public.ai_configurations(id);

-- Remove AI-specific fields from agents table (keeping personality and instructions)
ALTER TABLE public.agents 
DROP COLUMN IF EXISTS temperature,
DROP COLUMN IF EXISTS max_tokens,
DROP COLUMN IF EXISTS context_memory_turns,
DROP COLUMN IF EXISTS knowledge_cutoff,
DROP COLUMN IF EXISTS custom_tools,
DROP COLUMN IF EXISTS performance_metrics,
DROP COLUMN IF EXISTS enable_sentiment_analysis,
DROP COLUMN IF EXISTS language,
DROP COLUMN IF EXISTS response_style,
DROP COLUMN IF EXISTS ai_model,
DROP COLUMN IF EXISTS enable_multilingual_support,
DROP COLUMN IF EXISTS enable_proactive_suggestions,
DROP COLUMN IF EXISTS enable_order_intent_detection,
DROP COLUMN IF EXISTS enable_conversation_summary;

-- Create trigger for updating updated_at on ai_configurations
CREATE TRIGGER update_ai_configurations_updated_at
BEFORE UPDATE ON public.ai_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default AI configurations
INSERT INTO public.ai_configurations (name, description, ai_model, is_default, is_active) VALUES
('IA Básica', 'Configuração básica com funcionalidades essenciais de atendimento', 'gpt-5-mini-2025-08-07', true, true),
('IA Avançada', 'Configuração avançada com análise de sentimento e sugestões proativas', 'gpt-5-2025-08-07', false, true),
('IA Premium', 'Configuração premium com todas as funcionalidades habilitadas', 'gpt-5-2025-08-07', false, true);

-- Update premium configuration with advanced features
UPDATE public.ai_configurations 
SET enable_proactive_suggestions = true,
    enable_multilingual_support = true,
    max_tokens = 1000,
    context_memory_turns = 20
WHERE name = 'IA Premium';

-- Create index for performance
CREATE INDEX idx_ai_configurations_active ON public.ai_configurations(is_active);
CREATE INDEX idx_restaurants_ai_enabled ON public.restaurants(ai_enabled);
CREATE INDEX idx_restaurants_ai_config ON public.restaurants(ai_configuration_id);