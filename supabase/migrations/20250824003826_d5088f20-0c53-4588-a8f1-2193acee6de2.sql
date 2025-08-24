-- Remove SuperAgents iframe field from agents table and add new AI configuration fields
ALTER TABLE public.agents DROP COLUMN IF EXISTS superagentes_iframe;

-- Add new advanced AI configuration fields
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT 'gpt-5-2025-08-07';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS temperature DECIMAL(3,2) DEFAULT 0.7;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS max_tokens INTEGER DEFAULT 500;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS context_memory_turns INTEGER DEFAULT 10;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'pt-BR';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS response_style TEXT DEFAULT 'friendly';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS knowledge_cutoff DATE DEFAULT '2024-12-01';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS custom_tools JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS performance_metrics JSONB DEFAULT '{}'::jsonb;

-- Add WhatsApp integration fields
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS evolution_api_token TEXT;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS evolution_api_instance TEXT;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS webhook_url TEXT;

-- Add advanced AI behavior settings
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS enable_sentiment_analysis BOOLEAN DEFAULT true;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS enable_conversation_summary BOOLEAN DEFAULT true;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS enable_order_intent_detection BOOLEAN DEFAULT true;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS enable_proactive_suggestions BOOLEAN DEFAULT false;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS enable_multilingual_support BOOLEAN DEFAULT false;