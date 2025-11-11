-- ============================================
-- ZAPCORTE - POLÍTICAS DE SEGURANÇA (RLS)
-- ============================================
-- Data: 11 de Novembro de 2025
-- Objetivo: Criar políticas restritivas para cada tabela

-- ============================================
-- FUNÇÃO AUXILIAR: Obter user_id do usuário autenticado
-- ============================================

-- Criar função para obter user_id (se não existir)
CREATE OR REPLACE FUNCTION uid()
RETURNS UUID AS $$
  SELECT COALESCE(
    auth.uid(),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid
  )
$$ LANGUAGE SQL STABLE;

-- ============================================
-- 1. POLÍTICAS PARA TABELA: users
-- ============================================

-- Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Usuários veem apenas próprio registro" ON users;
DROP POLICY IF EXISTS "Usuários atualizam apenas próprio registro" ON users;

-- SELECT: Usuário vê apenas seu próprio registro
CREATE POLICY "Usuários veem apenas próprio registro"
ON users
FOR SELECT
USING (id = uid());

-- UPDATE: Usuário atualiza apenas seu próprio registro
CREATE POLICY "Usuários atualizam apenas próprio registro"
ON users
FOR UPDATE
USING (id = uid())
WITH CHECK (id = uid());

-- ============================================
-- 2. POLÍTICAS PARA TABELA: barbershops
-- ============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Barbeiro vê sua barbearia" ON barbershops;
DROP POLICY IF EXISTS "Barbeiro atualiza sua barbearia" ON barbershops;
DROP POLICY IF EXISTS "Barbeiro cria sua barbearia" ON barbershops;
DROP POLICY IF EXISTS "Público vê barbearias ativas" ON barbershops;

-- SELECT: Barbeiro vê sua própria barbearia
CREATE POLICY "Barbeiro vê sua barbearia"
ON barbershops
FOR SELECT
USING (user_id = uid());

-- SELECT: Público vê barbearias ativas (para página de agendamento)
CREATE POLICY "Público vê barbearias ativas"
ON barbershops
FOR SELECT
USING (is_active = true);

-- INSERT: Barbeiro cria sua barbearia
CREATE POLICY "Barbeiro cria sua barbearia"
ON barbershops
FOR INSERT
WITH CHECK (user_id = uid());

-- UPDATE: Barbeiro atualiza sua barbearia
CREATE POLICY "Barbeiro atualiza sua barbearia"
ON barbershops
FOR UPDATE
USING (user_id = uid())
WITH CHECK (user_id = uid());

-- DELETE: Barbeiro deleta sua barbearia
CREATE POLICY "Barbeiro deleta sua barbearia"
ON barbershops
FOR DELETE
USING (user_id = uid());

-- ============================================
-- 3. POLÍTICAS PARA TABELA: services
-- ============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Barbeiro gerencia seus serviços" ON services;
DROP POLICY IF EXISTS "Público vê serviços ativos" ON services;

-- SELECT: Público vê serviços ativos
CREATE POLICY "Público vê serviços ativos"
ON services
FOR SELECT
USING (
  is_active = true 
  AND barbershop_id IN (
    SELECT id FROM barbershops WHERE is_active = true
  )
);

-- INSERT/UPDATE/DELETE: Barbeiro gerencia seus serviços
CREATE POLICY "Barbeiro gerencia seus serviços"
ON services
FOR ALL
USING (
  barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = uid()
  )
)
WITH CHECK (
  barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = uid()
  )
);

-- ============================================
-- 4. POLÍTICAS PARA TABELA: appointments
-- ============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Barbeiro vê agendamentos de sua barbearia" ON appointments;
DROP POLICY IF EXISTS "Barbeiro gerencia agendamentos" ON appointments;
DROP POLICY IF EXISTS "Cliente cria agendamento" ON appointments;

-- SELECT: Barbeiro vê agendamentos de sua barbearia
CREATE POLICY "Barbeiro vê agendamentos de sua barbearia"
ON appointments
FOR SELECT
USING (
  barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = uid()
  )
);

-- INSERT: Cliente pode criar agendamento (público)
CREATE POLICY "Cliente cria agendamento"
ON appointments
FOR INSERT
WITH CHECK (true); -- Qualquer um pode criar agendamento

-- UPDATE: Barbeiro atualiza agendamentos de sua barbearia
CREATE POLICY "Barbeiro atualiza agendamentos"
ON appointments
FOR UPDATE
USING (
  barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = uid()
  )
)
WITH CHECK (
  barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = uid()
  )
);

-- DELETE: Barbeiro deleta agendamentos de sua barbearia
CREATE POLICY "Barbeiro deleta agendamentos"
ON appointments
FOR DELETE
USING (
  barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = uid()
  )
);

-- ============================================
-- 5. POLÍTICAS PARA TABELA: availability
-- ============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Barbeiro gerencia disponibilidade" ON availability;
DROP POLICY IF EXISTS "Público vê disponibilidade" ON availability;

-- SELECT: Público vê disponibilidade
CREATE POLICY "Público vê disponibilidade"
ON availability
FOR SELECT
USING (
  is_active = true
  AND barbershop_id IN (
    SELECT id FROM barbershops WHERE is_active = true
  )
);

-- INSERT/UPDATE/DELETE: Barbeiro gerencia disponibilidade
CREATE POLICY "Barbeiro gerencia disponibilidade"
ON availability
FOR ALL
USING (
  barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = uid()
  )
)
WITH CHECK (
  barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = uid()
  )
);

-- ============================================
-- 6. POLÍTICAS PARA TABELA: reminder_jobs
-- ============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Barbeiro vê lembretes de sua barbearia" ON reminder_jobs;
DROP POLICY IF EXISTS "Sistema gerencia lembretes" ON reminder_jobs;

-- SELECT: Barbeiro vê lembretes de sua barbearia
CREATE POLICY "Barbeiro vê lembretes de sua barbearia"
ON reminder_jobs
FOR SELECT
USING (
  barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = uid()
  )
);

-- ALL: Service role gerencia lembretes (para sistema automatizado)
CREATE POLICY "Sistema gerencia lembretes"
ON reminder_jobs
FOR ALL
USING (
  auth.role() = 'service_role'
  OR barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = uid()
  )
)
WITH CHECK (
  auth.role() = 'service_role'
  OR barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = uid()
  )
);

-- ============================================
-- 7. POLÍTICAS PARA TABELA: webhook_logs
-- ============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Apenas service_role acessa webhook_logs" ON webhook_logs;

-- ALL: Apenas service_role (servidor backend)
CREATE POLICY "Apenas service_role acessa webhook_logs"
ON webhook_logs
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- 8. VERIFICAR POLÍTICAS CRIADAS
-- ============================================

-- Query para listar todas as políticas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- Todas as tabelas agora têm políticas restritivas
-- Barbeiros só veem/editam seus próprios dados
-- Público só vê dados necessários para agendamento
-- Service role tem acesso total (para webhooks e automações)
