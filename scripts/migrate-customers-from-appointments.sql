-- ============================================================================
-- Script de Migração: Importar Clientes dos Agendamentos Históricos
-- ============================================================================
-- Descrição: Importa clientes únicos da tabela appointments para customers
-- Data: 11/11/2025
-- Autor: Sistema ZapCorte
-- ============================================================================

-- IMPORTANTE: Este script é idempotente (pode ser executado múltiplas vezes)
-- Ele verifica duplicatas antes de inserir, então é seguro re-executar

-- ============================================================================
-- PASSO 1: Verificar dados antes da migração
-- ============================================================================

-- Ver quantos clientes únicos existem nos agendamentos
SELECT 
  'Clientes únicos nos agendamentos' as info,
  COUNT(DISTINCT (barbershop_id, customer_phone)) as total
FROM appointments;

-- Ver quantos clientes já existem na tabela customers
SELECT 
  'Clientes já cadastrados' as info,
  COUNT(*) as total
FROM customers;

-- Ver clientes por barbearia nos agendamentos
SELECT 
  b.name as barbearia,
  COUNT(DISTINCT a.customer_phone) as clientes_unicos,
  COUNT(*) as total_agendamentos
FROM appointments a
JOIN barbershops b ON b.id = a.barbershop_id
GROUP BY b.id, b.name
ORDER BY clientes_unicos DESC;

-- ============================================================================
-- PASSO 2: Executar a migração
-- ============================================================================

-- Inserir clientes únicos dos agendamentos
INSERT INTO customers (barbershop_id, name, phone, notes, created_at)
SELECT DISTINCT ON (a.barbershop_id, a.customer_phone)
  a.barbershop_id,
  a.customer_name as name,
  a.customer_phone as phone,
  'Cliente importado automaticamente dos agendamentos existentes em ' || 
    TO_CHAR(NOW(), 'DD/MM/YYYY') as notes,
  MIN(a.created_at) as created_at
FROM appointments a
WHERE NOT EXISTS (
  -- Não inserir se já existe um cliente com mesmo telefone e barbearia
  SELECT 1 FROM customers c
  WHERE c.barbershop_id = a.barbershop_id
  AND c.phone = a.customer_phone
)
GROUP BY a.barbershop_id, a.customer_name, a.customer_phone
ORDER BY a.barbershop_id, a.customer_phone, MIN(a.created_at);

-- ============================================================================
-- PASSO 3: Verificar resultados da migração
-- ============================================================================

-- Ver quantos clientes foram importados
SELECT 
  'Clientes importados nesta execução' as info,
  COUNT(*) as total
FROM customers
WHERE notes LIKE '%importado automaticamente dos agendamentos%'
AND created_at >= NOW() - INTERVAL '1 minute';

-- Ver total de clientes após migração
SELECT 
  'Total de clientes após migração' as info,
  COUNT(*) as total
FROM customers;

-- Ver clientes importados por barbearia
SELECT 
  b.name as barbearia,
  COUNT(c.id) as clientes_importados
FROM customers c
JOIN barbershops b ON b.id = c.barbershop_id
WHERE c.notes LIKE '%importado automaticamente dos agendamentos%'
GROUP BY b.id, b.name
ORDER BY clientes_importados DESC;

-- ============================================================================
-- PASSO 4: Validações de integridade
-- ============================================================================

-- Verificar se há duplicatas (deve retornar 0 linhas)
SELECT 
  barbershop_id, 
  phone, 
  COUNT(*) as duplicatas
FROM customers 
GROUP BY barbershop_id, phone 
HAVING COUNT(*) > 1;

-- Verificar se todos os clientes têm dados válidos
SELECT 
  'Clientes sem nome' as problema,
  COUNT(*) as total
FROM customers
WHERE name IS NULL OR name = ''

UNION ALL

SELECT 
  'Clientes sem telefone' as problema,
  COUNT(*) as total
FROM customers
WHERE phone IS NULL OR phone = ''

UNION ALL

SELECT 
  'Clientes sem barbearia' as problema,
  COUNT(*) as total
FROM customers
WHERE barbershop_id IS NULL;

-- ============================================================================
-- PASSO 5: Relatório detalhado
-- ============================================================================

-- Relatório completo por barbearia
SELECT 
  b.name as barbearia,
  b.slug,
  COUNT(DISTINCT c.id) as clientes_cadastrados,
  COUNT(DISTINCT a.id) as total_agendamentos,
  COUNT(DISTINCT a.customer_phone) as clientes_unicos_agendamentos,
  ROUND(
    (COUNT(DISTINCT c.id)::numeric / 
     NULLIF(COUNT(DISTINCT a.customer_phone), 0) * 100), 
    2
  ) as percentual_importado
FROM barbershops b
LEFT JOIN customers c ON c.barbershop_id = b.id
LEFT JOIN appointments a ON a.barbershop_id = b.id
WHERE b.is_active = true
GROUP BY b.id, b.name, b.slug
ORDER BY clientes_cadastrados DESC;

-- Ver detalhes dos clientes importados
SELECT 
  c.name as cliente,
  c.phone,
  b.name as barbearia,
  c.created_at as primeiro_agendamento,
  (SELECT COUNT(*) 
   FROM appointments a 
   WHERE a.barbershop_id = c.barbershop_id 
   AND a.customer_phone = c.phone) as total_agendamentos,
  c.notes
FROM customers c
JOIN barbershops b ON b.id = c.barbershop_id
WHERE c.notes LIKE '%importado automaticamente dos agendamentos%'
ORDER BY total_agendamentos DESC, c.created_at DESC;

-- ============================================================================
-- PASSO 6: Limpeza (OPCIONAL - use com cuidado!)
-- ============================================================================

-- ATENÇÃO: Descomente apenas se precisar reverter a migração
-- Este comando remove TODOS os clientes importados automaticamente

/*
DELETE FROM customers
WHERE notes LIKE '%importado automaticamente dos agendamentos%';
*/

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

/*
1. Este script é IDEMPOTENTE:
   - Pode ser executado múltiplas vezes sem criar duplicatas
   - Verifica existência antes de inserir

2. SEGURANÇA:
   - Não remove dados existentes
   - Não modifica agendamentos
   - Apenas adiciona novos clientes

3. PERFORMANCE:
   - Usa DISTINCT ON para eficiência
   - Índices existentes são utilizados
   - Execução rápida mesmo com muitos dados

4. AUDITORIA:
   - Todos os clientes importados são marcados
   - Data de importação registrada
   - Rastreabilidade completa

5. REVERSÃO:
   - Comando de limpeza disponível (comentado)
   - Use apenas se necessário
   - Faça backup antes de reverter

6. PRÓXIMOS PASSOS:
   - Barbeiros devem revisar clientes importados
   - Adicionar observações personalizadas
   - Usar em novos agendamentos
*/

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
