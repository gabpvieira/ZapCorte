-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_appointment', 'cancelled', 'confirmed', 'reminder')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_barbershop ON notifications(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver apenas notificações da sua barbearia
CREATE POLICY "Users can view their barbershop notifications"
  ON notifications FOR SELECT
  USING (
    barbershop_id IN (
      SELECT id FROM barbershops WHERE user_id = auth.uid()
    )
  );

-- Policy: Usuários podem atualizar notificações da sua barbearia
CREATE POLICY "Users can update their barbershop notifications"
  ON notifications FOR UPDATE
  USING (
    barbershop_id IN (
      SELECT id FROM barbershops WHERE user_id = auth.uid()
    )
  );

-- Policy: Sistema pode inserir notificações
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Policy: Usuários podem deletar notificações da sua barbearia
CREATE POLICY "Users can delete their barbershop notifications"
  ON notifications FOR DELETE
  USING (
    barbershop_id IN (
      SELECT id FROM barbershops WHERE user_id = auth.uid()
    )
  );

-- Função para criar notificação automaticamente
CREATE OR REPLACE FUNCTION create_appointment_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_type TEXT;
  notification_title TEXT;
  notification_message TEXT;
  service_name TEXT;
BEGIN
  -- Buscar nome do serviço
  SELECT name INTO service_name FROM services WHERE id = NEW.service_id;
  
  -- Determinar tipo de notificação baseado na operação
  IF TG_OP = 'INSERT' THEN
    notification_type := 'new_appointment';
    notification_title := 'Novo Agendamento';
    notification_message := NEW.customer_name || ' agendou ' || service_name || ' para ' || 
                           TO_CHAR(NEW.scheduled_at, 'DD/MM/YYYY "às" HH24:MI');
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      IF NEW.status = 'cancelled' THEN
        notification_type := 'cancelled';
        notification_title := 'Agendamento Cancelado';
        notification_message := NEW.customer_name || ' cancelou o agendamento de ' || 
                               TO_CHAR(NEW.scheduled_at, 'DD/MM/YYYY "às" HH24:MI');
      ELSIF NEW.status = 'confirmed' THEN
        notification_type := 'confirmed';
        notification_title := 'Agendamento Confirmado';
        notification_message := NEW.customer_name || ' confirmou o agendamento de ' || 
                               TO_CHAR(NEW.scheduled_at, 'DD/MM/YYYY "às" HH24:MI');
      ELSE
        RETURN NEW;
      END IF;
    ELSE
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;
  
  -- Inserir notificação
  INSERT INTO notifications (
    barbershop_id,
    type,
    title,
    message,
    appointment_id
  ) VALUES (
    NEW.barbershop_id,
    notification_type,
    notification_title,
    notification_message,
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar notificações automaticamente
DROP TRIGGER IF EXISTS appointment_notification_trigger ON appointments;
CREATE TRIGGER appointment_notification_trigger
  AFTER INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION create_appointment_notification();

-- Função para limpar notificações antigas (mais de 30 dias)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
