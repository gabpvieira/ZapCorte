-- Adicionar coluna para armazenar subscription de push notifications
ALTER TABLE barbershops 
ADD COLUMN IF NOT EXISTS push_subscription JSONB;

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_barbershops_push_subscription 
ON barbershops USING GIN (push_subscription);

-- Comentário
COMMENT ON COLUMN barbershops.push_subscription IS 'Web Push API subscription object (VAPID)';
