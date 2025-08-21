-- Create agents table for restaurant-specific AI agents
CREATE TABLE public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  personality TEXT NOT NULL DEFAULT 'Você é um assistente virtual prestativo e amigável.',
  instructions TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  fallback_enabled BOOLEAN NOT NULL DEFAULT true,
  fallback_timeout_minutes INTEGER NOT NULL DEFAULT 5,
  whatsapp_number TEXT,
  evolution_api_instance TEXT,
  evolution_api_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversations table for tracking chats
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended', 'human_handoff')),
  assigned_human_id UUID,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table for conversation history
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'agent', 'human')),
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'document')),
  media_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  whatsapp_message_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agents
CREATE POLICY "Users can manage agents of their restaurants" 
ON public.agents 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM restaurants 
  WHERE restaurants.id = agents.restaurant_id 
  AND restaurants.user_id = auth.uid()
));

CREATE POLICY "Public can view active agents" 
ON public.agents 
FOR SELECT 
USING (is_active = true);

-- RLS Policies for conversations
CREATE POLICY "Users can view conversations of their restaurant agents" 
ON public.conversations 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM agents 
  JOIN restaurants ON restaurants.id = agents.restaurant_id
  WHERE agents.id = conversations.agent_id 
  AND restaurants.user_id = auth.uid()
));

-- RLS Policies for messages
CREATE POLICY "Users can view messages of their restaurant conversations" 
ON public.messages 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM conversations 
  JOIN agents ON agents.id = conversations.agent_id
  JOIN restaurants ON restaurants.id = agents.restaurant_id
  WHERE conversations.id = messages.conversation_id 
  AND restaurants.user_id = auth.uid()
));

-- Create indexes for performance
CREATE INDEX idx_agents_restaurant_id ON agents(restaurant_id);
CREATE INDEX idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Create triggers for updated_at
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live chat
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;