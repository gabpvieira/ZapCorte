-- =====================================================
-- MIGRAÇÃO: Sistema de Web Push Nativo
-- Data: 2025-11-11
-- Descrição: Remove OneSignal e implementa Web Push API nativo
-- =====================================================

-- 1. REMOVE COLUNA ANTIGA DO ONESIGNAL
-- =====================================================
ALTER TABLE barbershops DROP COLUMN IF EXISTS player_id;

-- 2. ADICIONA NOVAS COLUNAS PARA WEB PUSH NATIVO
-- =====================================================
ALTER TABLE barbershops 
  ADD COLUMN IF NOT EXISTS push_subscription jsonb,
  ADD COLUMN IF NOT EXISTS push_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS push_last_updated timestamp with time zone;

-- 3. ADICIONA ÍNDICE PARA OTIMIZAÇÃO
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_barbershops_push_enabled 
ON barbershops(push_enabled) 
WHERE push_enabled = true;

-- 4. ADICIONA COMENTÁRIOS NAS COLUNAS
-- =====================================================
COMMENT ON COLUMN barbershops.push_subscription IS 'Subscription object do Web Push API (endpoint, keys)';
COMMENT ON COLUMN barbershops.push_enabled IS 'Indica se as notificações push estão habilitadas';
COMMENT ON COLUMN barbershops.push_last_updated IS 'Data da última atualização da subscription';

-- 5. CRIA TABELA PARA HISTÓRICO DE NOTIFICAÇÕES
-- =====================================================
CREATE TABLE IF NOT EXISTS push_notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbershop_id uuid NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text NOT NULL,
  icon text,
  badge text,
  data jsonb,
  status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'clicked')),
  sent_at timestamp with time zone,
  clicked_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

-- 6. CRIA ÍNDICES PARA PUSH_NOTIFICATIONS
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_push_notifications_barbershop 
ON push_notifications(barbershop_id);

CREATE INDEX IF NOT EXISTS idx_push_notifications_appointment 
ON push_notifications(appointment_id);

CREATE INDEX IF NOT EXISTS idx_push_notifications_status 
ON push_notifications(status);

CREATE INDEX IF NOT EXISTS idx_push_notifications_created_at 
ON push_notifications(created_at DESC);

-- 7. ADICIONA COMENTÁRIOS NA TABELA
-- =====================================================
COMMENT ON TABLE push_notifications IS 'Histórico de notificações push enviadas';
COMMENT ON COLUMN push_notifications.data IS 'Dados adicionais da notificação (JSON)';
COMMENT ON COLUMN push_notifications.status IS 'Status da notificação: pending, sent, failed, clicked';

-- 8. HABILITA RLS
-- =====================================================
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;

-- 9. CRIA POLÍTICAS RLS
-- =====================================================

-- Política para barbeiros verem notificações de sua barbearia
CREATE POLICY "Barbeiro vê notificações de sua barbearia"
ON push_notifications
FOR SELECT
TO public
USING (
  barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = auth.uid()
  )
);

-- Política para sistema inserir notificações
CREATE POLICY "Sistema insere notificações"
ON push_notifications
FOR INSERT
TO public
WITH CHECK (true);

-- Política para sistema atualizar notificações
CREATE POLICY "Sistema atualiza notificações"
ON push_notifications
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================

-- ESTRUTURA FINAL:
-- 
-- barbershops:
--   - push_subscription (jsonb): Objeto de subscription do Web Push API
--   - push_enabled (boolean): Flag indicando se push está habilitado
--   - push_last_updated (timestamp): Data da última atualização
--
-- push_notifications (nova tabela):
--   - id, barbershop_id, appointment_id
--   - title, body, icon, badge, data
--   - status, sent_at, clicked_at, error_message
--   - created_at
