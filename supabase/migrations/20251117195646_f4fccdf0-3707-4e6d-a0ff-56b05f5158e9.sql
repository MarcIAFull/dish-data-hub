-- ================================================
-- FASE 4: SQL Functions Atômicas para Robustez
-- ================================================

-- 1️⃣ Função atômica para adicionar item ao carrinho
-- Previne race conditions e garante consistência
CREATE OR REPLACE FUNCTION public.atomic_add_item_to_cart(
  p_chat_id BIGINT,
  p_product_name TEXT,
  p_product_id TEXT,
  p_quantity INTEGER,
  p_unit_price NUMERIC,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_metadata JSONB;
  v_order_items JSONB;
  v_existing_item JSONB;
  v_new_item JSONB;
  v_updated_items JSONB;
  v_item_exists BOOLEAN := FALSE;
BEGIN
  -- Obter metadata atual com lock
  SELECT metadata INTO v_metadata
  FROM chats
  WHERE id = p_chat_id
  FOR UPDATE;

  -- Inicializar order_items se não existir
  v_order_items := COALESCE(v_metadata->'order_items', '[]'::jsonb);

  -- Verificar se produto já existe (idempotência)
  FOR v_existing_item IN SELECT * FROM jsonb_array_elements(v_order_items)
  LOOP
    IF (v_existing_item->>'product_id' = p_product_id) THEN
      v_item_exists := TRUE;
      -- Incrementar quantidade do item existente
      v_new_item := jsonb_set(
        v_existing_item,
        '{quantity}',
        to_jsonb((v_existing_item->>'quantity')::INTEGER + p_quantity)
      );
      EXIT;
    END IF;
  END LOOP;

  -- Se não existe, criar novo item
  IF NOT v_item_exists THEN
    v_new_item := jsonb_build_object(
      'product_id', p_product_id,
      'product_name', p_product_name,
      'quantity', p_quantity,
      'unit_price', p_unit_price,
      'notes', p_notes,
      'added_at', NOW()
    );
  END IF;

  -- Atualizar array de items
  IF v_item_exists THEN
    -- Substituir item existente
    v_updated_items := '[]'::jsonb;
    FOR v_existing_item IN SELECT * FROM jsonb_array_elements(v_order_items)
    LOOP
      IF (v_existing_item->>'product_id' = p_product_id) THEN
        v_updated_items := v_updated_items || jsonb_build_array(v_new_item);
      ELSE
        v_updated_items := v_updated_items || jsonb_build_array(v_existing_item);
      END IF;
    END LOOP;
  ELSE
    -- Adicionar novo item
    v_updated_items := v_order_items || jsonb_build_array(v_new_item);
  END IF;

  -- Calcular total
  v_metadata := jsonb_set(
    COALESCE(v_metadata, '{}'::jsonb),
    '{order_items}',
    v_updated_items
  );

  v_metadata := jsonb_set(
    v_metadata,
    '{order_total}',
    to_jsonb((
      SELECT SUM((item->>'quantity')::INTEGER * (item->>'unit_price')::NUMERIC)
      FROM jsonb_array_elements(v_updated_items) item
    ))
  );

  -- Atualizar chat
  UPDATE chats
  SET 
    metadata = v_metadata,
    updated_at = NOW()
  WHERE id = p_chat_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'item_added', v_new_item,
    'cart_total', v_metadata->'order_total',
    'cart_item_count', jsonb_array_length(v_updated_items),
    'was_updated', v_item_exists
  );
END;
$$;

-- 2️⃣ Função atômica para atualizar estado da conversa
-- Previne race conditions em transições de estado
CREATE OR REPLACE FUNCTION public.atomic_update_conversation_state(
  p_chat_id BIGINT,
  p_new_state TEXT,
  p_metadata_updates JSONB DEFAULT '{}'::jsonb,
  p_agent_name TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_state TEXT;
  v_metadata JSONB;
  v_updated_metadata JSONB;
BEGIN
  -- Obter estado atual com lock
  SELECT conversation_state, metadata 
  INTO v_old_state, v_metadata
  FROM chats
  WHERE id = p_chat_id
  FOR UPDATE;

  -- Merge metadata updates
  v_updated_metadata := COALESCE(v_metadata, '{}'::jsonb) || p_metadata_updates;

  -- Adicionar histórico de transições
  v_updated_metadata := jsonb_set(
    v_updated_metadata,
    '{state_history}',
    COALESCE(v_updated_metadata->'state_history', '[]'::jsonb) || 
    jsonb_build_array(
      jsonb_build_object(
        'from', v_old_state,
        'to', p_new_state,
        'changed_at', NOW(),
        'changed_by', p_agent_name
      )
    ),
    TRUE
  );

  -- Atualizar chat
  UPDATE chats
  SET 
    conversation_state = p_new_state,
    metadata = v_updated_metadata,
    updated_at = NOW()
  WHERE id = p_chat_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'old_state', v_old_state,
    'new_state', p_new_state,
    'metadata', v_updated_metadata
  );
END;
$$;

-- 3️⃣ Índices para performance
CREATE INDEX IF NOT EXISTS idx_chats_conversation_state ON chats(conversation_state);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_chat_id ON ai_processing_logs(chat_id);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_created_at ON ai_processing_logs(created_at DESC);

-- 4️⃣ Comentários para documentação
COMMENT ON FUNCTION atomic_add_item_to_cart IS 'Adiciona item ao carrinho de forma atômica, prevenindo race conditions e garantindo idempotência';
COMMENT ON FUNCTION atomic_update_conversation_state IS 'Atualiza estado da conversa de forma atômica com histórico de transições';