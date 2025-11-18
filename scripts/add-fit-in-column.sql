-- Adicionar coluna is_fit_in na tabela appointments
-- Esta coluna identifica agendamentos feitos como "encaixe"

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS is_fit_in BOOLEAN DEFAULT FALSE;

-- Adicionar comentário explicativo
COMMENT ON COLUMN appointments.is_fit_in IS 'Indica se o agendamento foi feito como encaixe (sem validação de conflitos de horário)';

-- Criar índice para melhorar performance de queries que filtram por encaixe
CREATE INDEX IF NOT EXISTS idx_appointments_is_fit_in ON appointments(is_fit_in);
