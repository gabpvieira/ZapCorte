-- Adicionar colunas para configurações do WhatsApp
ALTER TABLE barbershops 
ADD COLUMN IF NOT EXISTS whatsapp_reminders_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS whatsapp_reminder_interval VARCHAR(2) DEFAULT '30',
ADD COLUMN IF NOT EXISTS whatsapp_reminder_message TEXT DEFAULT 'Olá {nome}! Lembrete: você tem um agendamento marcado para {data} às {hora} para {servico}. Nos vemos em breve! 💈',
ADD COLUMN IF NOT EXISTS whatsapp_test_phone VARCHAR(20);