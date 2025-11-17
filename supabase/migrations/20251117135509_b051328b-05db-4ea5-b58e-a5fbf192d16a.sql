-- Criar tabela para capturar erros críticos
CREATE TABLE IF NOT EXISTS error_logs (
  id BIGSERIAL PRIMARY KEY,
  request_id TEXT NOT NULL,
  error_type TEXT NOT NULL,
  error_message TEXT,
  error_stack TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para busca rápida
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_request_id ON error_logs(request_id);

-- RLS: Apenas admins podem ver
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view error logs"
  ON error_logs FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "System can insert error logs"
  ON error_logs FOR INSERT
  WITH CHECK (true);