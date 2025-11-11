-- =====================================================
-- MIGRAÇÃO: Personalização de Mensagens WhatsApp
-- Data: 2024-11-11
-- Descrição: Adiciona colunas para mensagens personalizadas
-- =====================================================

-- Adicionar colunas de mensagens personalizadas na tabela barbershops
ALTER TABLE barbershops
ADD COLUMN IF NOT EXISTS confirmation_message TEXT DEFAULT 'Olá {{primeiro_nome}}! ✅

Seu agendamento foi confirmado com sucesso!

📅 Data: {{data}}
🕐 Horário: {{hora}}
✂️ Serviço: {{servico}}
🏪 Local: {{barbearia}}

Nos vemos em breve! 😊',

ADD COLUMN IF NOT EXISTS reschedule_message TEXT DEFAULT 'Olá {{primeiro_nome}}! 🔄

Seu agendamento foi reagendado:

📅 Nova Data: {{data}}
🕐 Novo Horário: {{hora}}
✂️ Serviço: {{servico}}

Qualquer dúvida, estamos à disposição!',

ADD COLUMN IF NOT EXISTS reminder_message TEXT DEFAULT 'Olá {{primeiro_nome}}! ⏰

Lembrete: você tem um agendamento hoje!

🕐 Horário: {{hora}}
✂️ Serviço: {{servico}}
🏪 Local: {{barbearia}}

Nos vemos em breve! ✂️';

-- Comentários nas colunas
COMMENT ON COLUMN barbershops.confirmation_message IS 'Mensagem personalizada de confirmação de agendamento';
COMMENT ON COLUMN barbershops.reschedule_message IS 'Mensagem personalizada de reagendamento';
COMMENT ON COLUMN barbershops.reminder_message IS 'Mensagem personalizada de lembrete';

-- =====================================================
-- VARIÁVEIS DISPONÍVEIS:
-- =====================================================
-- {{primeiro_nome}} - Primeiro nome do cliente
-- {{servico}} - Nome do serviço agendado
-- {{data}} - Data do agendamento (formato: DD/MM/YYYY)
-- {{hora}} - Horário do agendamento (formato: HH:MM)
-- {{barbearia}} - Nome da barbearia
-- =====================================================

-- Verificar se as colunas foram criadas
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    column_default
FROM information_schema.columns
WHERE table_name = 'barbershops'
AND column_name IN ('confirmation_message', 'reschedule_message', 'reminder_message');
