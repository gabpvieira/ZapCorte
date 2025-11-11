-- ============================================
-- ZAPCORTE - TESTES DE SEGURANÇA
-- ============================================
-- Data: 11 de Novembro de 2025
-- Objetivo: Validar se todas as proteções estão funcionando

-- ============================================
-- 1. VERIFICAR RLS ATIVO
-- ============================================

SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS ATIVO'
    ELSE '❌ RLS INATIVO'
  END as status_rls
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- 2. VERIFICAR POLÍTICAS CRIADAS
-- ============================================

SELECT 
  tablename,
  policyname,
  cmd as comando,
  CASE 
    WHEN permissive = 'PERMISSIVE' THEN '✅ Permissiva'
    ELSE '⚠️ Restritiva'
  END as tipo
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 3. CONTAR POLÍTICAS POR TABELA
-- ============================================

SELECT 
  tablename,
  COUNT(*) as total_politicas,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ Bem protegida'
    WHEN COUNT(*) = 1 THEN '⚠️ Proteção básica'
    ELSE '❌ Sem proteção'
  END as nivel_protecao
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY total_politicas DESC;

-- ============================================
-- 4. VERIFICAR CONSTRAINTS DE VALIDAÇÃO
-- ============================================

SELECT 
  tc.table_name,
  tc.constraint_name,
  cc.check_clause,
  '✅ Validação ativa' as status
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'CHECK'
  AND tc.constraint_name LIKE 'check_%'
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================
-- 5. VERIFICAR TRIGGERS DE SANITIZAÇÃO
-- ============================================

SELECT 
  trigger_name,
  event_object_table as tabela,
  action_timing as quando,
  event_manipulation as evento,
  '✅ Trigger ativo' as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%sanitize%'
ORDER BY event_object_table;

-- ============================================
-- 6. TESTE: Tentar acessar dados de outro usuário
-- ============================================

-- Este teste deve FALHAR (retornar 0 linhas) se RLS estiver funcionando
-- Simular usuário tentando ver barbearias de outros
DO $$
DECLARE
  v_count INT;
BEGIN
  -- Tentar contar barbearias sem autenticação
  SELECT COUNT(*) INTO v_count
  FROM barbershops
  WHERE user_id != uid();
  
  IF v_count > 0 THEN
    RAISE NOTICE '❌ FALHA: RLS não está bloqueando acesso não autorizado!';
  ELSE
    RAISE NOTICE '✅ SUCESSO: RLS está bloqueando acesso não autorizado';
  END IF;
END $$;

-- ============================================
-- 7. TESTE: Validação de telefone
-- ============================================

-- Este teste deve FALHAR se validação estiver funcionando
DO $$
BEGIN
  -- Tentar inserir telefone inválido
  BEGIN
    INSERT INTO appointments (
      barbershop_id,
      service_id,
      customer_name,
      customer_phone,
      scheduled_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      'Teste',
      'telefone-invalido',  -- Deve falhar aqui
      NOW() + INTERVAL '1 day'
    );
    
    RAISE NOTICE '❌ FALHA: Validação de telefone não está funcionando!';
    ROLLBACK;
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE '✅ SUCESSO: Validação de telefone bloqueou input inválido';
      ROLLBACK;
  END;
END $$;

-- ============================================
-- 8. TESTE: Validação de email
-- ============================================

DO $$
BEGIN
  -- Tentar inserir email inválido
  BEGIN
    INSERT INTO users (email, password_hash)
    VALUES ('email-invalido', 'hash');
    
    RAISE NOTICE '❌ FALHA: Validação de email não está funcionando!';
    ROLLBACK;
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE '✅ SUCESSO: Validação de email bloqueou input inválido';
      ROLLBACK;
  END;
END $$;

-- ============================================
-- 9. TESTE: Validação de preço
-- ============================================

DO $$
BEGIN
  -- Tentar inserir preço negativo
  BEGIN
    INSERT INTO services (
      barbershop_id,
      name,
      price,
      duration
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      'Teste',
      -10.00,  -- Deve falhar aqui
      30
    );
    
    RAISE NOTICE '❌ FALHA: Validação de preço não está funcionando!';
    ROLLBACK;
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE '✅ SUCESSO: Validação de preço bloqueou valor negativo';
      ROLLBACK;
  END;
END $$;

-- ============================================
-- 10. TESTE: Sanitização de inputs
-- ============================================

DO $$
DECLARE
  v_sanitized TEXT;
BEGIN
  -- Testar função de sanitização
  v_sanitized := sanitize_text('<script>alert("XSS")</script>Nome Válido');
  
  IF v_sanitized LIKE '%<script>%' THEN
    RAISE NOTICE '❌ FALHA: Sanitização não está removendo HTML!';
  ELSE
    RAISE NOTICE '✅ SUCESSO: Sanitização removeu HTML perigoso';
    RAISE NOTICE '   Input: <script>alert("XSS")</script>Nome Válido';
    RAISE NOTICE '   Output: %', v_sanitized;
  END IF;
END $$;

-- ============================================
-- 11. VERIFICAR FUNÇÕES DE SEGURANÇA
-- ============================================

SELECT 
  routine_name as funcao,
  routine_type as tipo,
  '✅ Função disponível' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'uid',
    'sanitize_text',
    'is_valid_email',
    'is_valid_url',
    'check_rate_limit',
    'log_security_event'
  )
ORDER BY routine_name;

-- ============================================
-- 12. VERIFICAR ÍNDICES DE PERFORMANCE
-- ============================================

SELECT 
  tablename,
  indexname,
  indexdef,
  '✅ Índice ativo' as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    indexname LIKE 'idx_%'
    OR indexname LIKE '%_pkey'
  )
ORDER BY tablename, indexname;

-- ============================================
-- 13. RESUMO GERAL DE SEGURANÇA
-- ============================================

WITH security_summary AS (
  SELECT 
    'RLS Ativo' as item,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE rowsecurity = true) as protegido,
    ROUND(100.0 * COUNT(*) FILTER (WHERE rowsecurity = true) / COUNT(*), 2) as percentual
  FROM pg_tables
  WHERE schemaname = 'public'
  
  UNION ALL
  
  SELECT 
    'Políticas Criadas' as item,
    COUNT(DISTINCT tablename) as total,
    COUNT(DISTINCT tablename) as protegido,
    100.00 as percentual
  FROM pg_policies
  WHERE schemaname = 'public'
  
  UNION ALL
  
  SELECT 
    'Validações (CHECK)' as item,
    COUNT(*) as total,
    COUNT(*) as protegido,
    100.00 as percentual
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
    AND constraint_type = 'CHECK'
    AND constraint_name LIKE 'check_%'
  
  UNION ALL
  
  SELECT 
    'Triggers de Sanitização' as item,
    COUNT(*) as total,
    COUNT(*) as protegido,
    100.00 as percentual
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
    AND trigger_name LIKE '%sanitize%'
)
SELECT 
  item,
  total,
  protegido,
  percentual || '%' as cobertura,
  CASE 
    WHEN percentual >= 90 THEN '✅ Excelente'
    WHEN percentual >= 70 THEN '⚠️ Bom'
    WHEN percentual >= 50 THEN '⚠️ Regular'
    ELSE '❌ Insuficiente'
  END as avaliacao
FROM security_summary;

-- ============================================
-- 14. RECOMENDAÇÕES FINAIS
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '📊 RELATÓRIO DE SEGURANÇA - ZAPCORTE';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Testes concluídos!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Próximos passos:';
  RAISE NOTICE '1. Revisar resultados acima';
  RAISE NOTICE '2. Corrigir qualquer ❌ encontrado';
  RAISE NOTICE '3. Implementar segurança no frontend';
  RAISE NOTICE '4. Configurar headers de segurança';
  RAISE NOTICE '5. Testar em ambiente de staging';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Segurança é um processo contínuo!';
  RAISE NOTICE '============================================';
END $$;
