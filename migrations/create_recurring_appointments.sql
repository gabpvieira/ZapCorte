-- Criar tabela de agendamentos recorrentes
CREATE TABLE IF NOT EXISTS recurring_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  
  -- Configuração de recorrência
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  time_of_day TIME NOT NULL,
  
  -- Informações do cliente (caso customer_id seja null)
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  
  -- Período de validade
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Status e controle
  is_active BOOLEAN DEFAULT true,
  last_generated_date DATE,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_period CHECK (end_date IS NULL OR end_date >= start_date),
  CONSTRAINT valid_day_for_frequency CHECK (
    (frequency IN ('weekly', 'biweekly') AND day_of_week IS NOT NULL) OR
    (frequency = 'monthly')
  )
);

-- Adicionar coluna recurring_appointment_id na tabela appointments
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS recurring_appointment_id UUID REFERENCES recurring_appointments(id) ON DELETE SET NULL;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_recurring_appointments_barbershop ON recurring_appointments(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_recurring_appointments_active ON recurring_appointments(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_recurring_appointments_day ON recurring_appointments(day_of_week);
CREATE INDEX IF NOT EXISTS idx_appointments_recurring ON appointments(recurring_appointment_id) WHERE recurring_appointment_id IS NOT NULL;

-- Habilitar RLS
ALTER TABLE recurring_appointments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Barbeiro vê apenas seus recorrentes
CREATE POLICY "Barbeiro vê agendamentos recorrentes"
  ON recurring_appointments FOR SELECT
  USING (barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = auth.uid()
  ));

-- Políticas RLS: Barbeiro gerencia apenas seus recorrentes
CREATE POLICY "Barbeiro gerencia agendamentos recorrentes"
  ON recurring_appointments FOR ALL
  USING (barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = auth.uid()
  ));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_recurring_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recurring_appointments_updated_at
  BEFORE UPDATE ON recurring_appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_recurring_appointments_updated_at();

-- Comentários para documentação
COMMENT ON TABLE recurring_appointments IS 'Armazena configurações de agendamentos recorrentes (semanais, quinzenais, mensais)';
COMMENT ON COLUMN recurring_appointments.frequency IS 'Frequência: weekly (semanal), biweekly (quinzenal), monthly (mensal)';
COMMENT ON COLUMN recurring_appointments.day_of_week IS 'Dia da semana (0=Domingo, 6=Sábado) - obrigatório para weekly e biweekly';
COMMENT ON COLUMN recurring_appointments.time_of_day IS 'Horário fixo do agendamento recorrente';
COMMENT ON COLUMN recurring_appointments.last_generated_date IS 'Última data em que um agendamento foi gerado automaticamente';
