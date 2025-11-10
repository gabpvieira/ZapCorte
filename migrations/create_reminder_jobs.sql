-- Criar tabela para jobs de lembretes
CREATE TABLE IF NOT EXISTS reminder_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  message TEXT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_reminder_jobs_status_scheduled ON reminder_jobs(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_reminder_jobs_appointment ON reminder_jobs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_reminder_jobs_barbershop ON reminder_jobs(barbershop_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_reminder_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reminder_jobs_updated_at
  BEFORE UPDATE ON reminder_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_reminder_jobs_updated_at();