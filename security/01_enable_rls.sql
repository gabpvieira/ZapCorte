-- ============================================
-- ZAPCORTE - ATIVAR RLS EM TODAS AS TABELAS
-- ============================================
-- Data: 11 de Novembro de 2025
-- Objetivo: Ativar Row-Level Security em todas as tabelas sensíveis

-- ============================================
-- 1. ATIVAR RLS NAS TABELAS PRINCIPAIS
-- ============================================

-- Tabela: users (dados de autenticação)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Tabela: barbershops (dados das barbearias)
ALTER TABLE barbershops ENABLE ROW LEVEL SECURITY;

-- Tabela: services (serviços oferecidos)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Tabela: appointments (agendamentos)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Tabela: availability (disponibilidade de horários)
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- Tabela: reminder_jobs (lembretes agendados)
ALTER TABLE reminder_jobs ENABLE ROW LEVEL SECURITY;

-- Tabela: webhook_logs (logs de webhooks - apenas service_role)
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. VERIFICAR STATUS DO RLS
-- ============================================

-- Query para verificar quais tabelas têm RLS ativo
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- 3. COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================

COMMENT ON TABLE users IS 'Tabela de usuários - RLS ativo para proteger dados de autenticação';
COMMENT ON TABLE barbershops IS 'Tabela de barbearias - RLS ativo para isolar dados por proprietário';
COMMENT ON TABLE services IS 'Tabela de serviços - RLS ativo para proteger serviços por barbearia';
COMMENT ON TABLE appointments IS 'Tabela de agendamentos - RLS ativo para privacidade de clientes';
COMMENT ON TABLE availability IS 'Tabela de disponibilidade - RLS ativo para proteger horários';
COMMENT ON TABLE customers IS 'Tabela de clientes - RLS ativo para privacidade (já ativo)';
COMMENT ON TABLE profiles IS 'Tabela de perfis - RLS ativo para dados de usuários (já ativo)';
COMMENT ON TABLE payment_history IS 'Tabela de pagamentos - RLS ativo para dados financeiros (já ativo)';

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- Todas as tabelas sensíveis agora têm RLS ativo
-- Próximo passo: Criar políticas de acesso (02_create_policies.sql)
