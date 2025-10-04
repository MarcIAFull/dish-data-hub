-- Habilitar RLS nas tabelas existentes que estão sem proteção

-- Habilitar RLS em chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS em chats
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS em customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS em dados_cliente
ALTER TABLE public.dados_cliente ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS em documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS em pedidos
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS em pedidos_history
ALTER TABLE public.pedidos_history ENABLE ROW LEVEL SECURITY;

-- Corrigir search_path das funções existentes
CREATE OR REPLACE FUNCTION public.match_documents(query_embedding vector, match_count integer, filter jsonb)
RETURNS TABLE(id bigint, content text, metadata jsonb, similarity double precision)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE documents.metadata @> filter
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.match_documents(query_embedding vector, match_threshold double precision DEFAULT 0.5, match_count integer DEFAULT 5)
RETURNS TABLE(id bigint, content text, metadata jsonb, similarity double precision)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_chat_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    IF TG_OP = 'UPDATE' AND COALESCE(OLD.status, '') = COALESCE(NEW.status, '') THEN
        RETURN NEW;
    END IF;

    INSERT INTO pedidos (chat_id, status, status_from, status_to, payload, created_by)
    VALUES (
        COALESCE(NEW.id::text, ''),
        COALESCE(NEW.status, ''),
        COALESCE(OLD.status, NULL),
        COALESCE(NEW.status, NULL),
        to_jsonb(NEW.*),
        NULL
    );

    INSERT INTO pedidos_history (chat_id, status_from, status_to, payload, changed_by)
    VALUES (
        COALESCE(NEW.id::text, ''),
        COALESCE(OLD.status, NULL),
        COALESCE(NEW.status, NULL),
        to_jsonb(NEW.*),
        NULL
    );

    RETURN NEW;
END;
$function$;