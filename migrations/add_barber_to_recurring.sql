-- Migration: Adicionar suporte a barbeiros em agendamentos recorrentes
-- Data: 2025-11-19
-- Descrição: Permite atribuir barbeiro específico a agendamentos recorrentes (Plano PRO)

-- 1. Adicionar coluna barber_id
ALTER TABLE recurring_appointments 
ADD COLUMN IF NOT EXISTS barber_id UUID REFERENCES barbers(id) ON DELETE SET NULL;

-- 2. Criar índice para busca por barbeiro
CREATE INDEX IF NOT EXISTS recurring_appointments_barber_id_idx 
ON recurring_appointments(barber_id);

-- 3. Comentário para documentação
COMMENT ON COLUMN recurring_appointments.barber_id IS 'Barbeiro atribuído ao agendamento recorrente (Plano PRO)';
