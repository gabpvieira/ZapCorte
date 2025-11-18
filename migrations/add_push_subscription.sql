-- Migration: Adicionar suporte a Web Push Notifications
-- Data: 2024-11-18
-- Descrição: Adiciona coluna para armazenar subscription de push notifications

-- Adicionar coluna push_subscription na tabela barbershops
ALTER TABLE barbershops 
ADD COLUMN IF NOT EXISTS push_subscription JSONB;

-- Adicionar comentário na coluna
COMMENT ON COLUMN barbershops.push_subscription IS 'Armazena a subscription do Web Push API para envio de notificações';

-- Criar índice para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_barbershops_push_subscription 
ON barbershops USING GIN (push_subscription) 
WHERE push_subscription IS NOT NULL;
