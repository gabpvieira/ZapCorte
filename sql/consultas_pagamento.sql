-- =====================================================
-- CONSULTAS ÚTEIS PARA MONITORAR PAGAMENTOS
-- =====================================================

-- 1. VER ÚLTIMOS WEBHOOKS RECEBIDOS
-- =====================================================
SELECT 
  id,
  event_type,
  status,
  error_message,
  created_at,
  payload->>'data' as dados
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 20;

-- 2. VER WEBHOOKS COM ERRO
-- =====================================================
SELECT 
  id,
  event_type,
  error_message,
  created_at,
  payload
FROM webhook_logs
WHERE status = 'failed'
ORDER BY created_at DESC;

-- 3. VER HISTÓRICO COMPLETO DE PAGAMENTOS
-- =====================================================
SELECT 
  p.email,
  p.full_name,
  ph.transaction_id,
  ph.amount,
  ph.status,
  ph.payment_method,
  ph.plan_type,
  ph.created_at,
  ph.cakto_data->>'paymentMethod' as metodo_original
FROM payment_history ph
JOIN profiles p ON p.id = ph.user_id
ORDER BY ph.created_at DESC;

-- 4. VER PAGAMENTOS POR MÉTODO
-- =====================================================
SELECT 
  payment_method,
  COUNT(*) as total,
  SUM(amount) as valor_total,
  AVG(amount) as valor_medio
FROM payment_history
WHERE status = 'completed'
GROUP BY payment_method
ORDER BY total DESC;

-- 5. VER PAGAMENTOS POR STATUS
-- =====================================================
SELECT 
  status,
  COUNT(*) as total,
  SUM(amount) as valor_total
FROM payment_history
GROUP BY status
ORDER BY total DESC;

-- 6. VER USUÁRIOS PREMIUM ATIVOS
-- =====================================================
SELECT 
  email,
  full_name,
  plan_type,
  subscription_status,
  payment_method,
  last_payment_date,
  expires_at,
  CASE 
    WHEN expires_at > NOW() THEN 'Ativo'
    WHEN expires_at < NOW() THEN 'Expirado'
    ELSE 'Sem expiração'
  END as status_plano
FROM profiles
WHERE plan_type IN ('starter', 'pro')
ORDER BY last_payment_date DESC;

-- 7. VER PAGAMENTOS PENDENTES (PIX/Boleto gerados)
-- =====================================================
SELECT 
  p.email,
  ph.transaction_id,
  ph.amount,
  ph.payment_method,
  ph.plan_type,
  ph.created_at,
  EXTRACT(HOUR FROM (NOW() - ph.created_at)) as horas_pendente
FROM payment_history ph
JOIN profiles p ON p.id = ph.user_id
WHERE ph.status = 'pending'
ORDER BY ph.created_at DESC;

-- 8. VER RECEITA TOTAL POR PLANO
-- =====================================================
SELECT 
  plan_type,
  COUNT(*) as total_vendas,
  SUM(amount) as receita_total,
  AVG(amount) as ticket_medio
FROM payment_history
WHERE status = 'completed'
GROUP BY plan_type
ORDER BY receita_total DESC;

-- 9. VER ÚLTIMAS TRANSAÇÕES DE UM USUÁRIO
-- =====================================================
-- Substitua 'email@usuario.com' pelo email desejado
SELECT 
  ph.transaction_id,
  ph.amount,
  ph.status,
  ph.payment_method,
  ph.plan_type,
  ph.created_at
FROM payment_history ph
JOIN profiles p ON p.id = ph.user_id
WHERE p.email = 'email@usuario.com'
ORDER BY ph.created_at DESC;

-- 10. VER CONVERSÃO DE PAGAMENTOS PENDENTES
-- =====================================================
WITH pagamentos_pendentes AS (
  SELECT 
    transaction_id,
    created_at as data_geracao
  FROM payment_history
  WHERE status = 'pending'
),
pagamentos_aprovados AS (
  SELECT 
    transaction_id,
    created_at as data_aprovacao
  FROM payment_history
  WHERE status = 'completed'
)
SELECT 
  pp.transaction_id,
  pp.data_geracao,
  pa.data_aprovacao,
  EXTRACT(HOUR FROM (pa.data_aprovacao - pp.data_geracao)) as horas_para_aprovar
FROM pagamentos_pendentes pp
LEFT JOIN pagamentos_aprovados pa ON pp.transaction_id = pa.transaction_id
ORDER BY pp.data_geracao DESC;

-- 11. VER REEMBOLSOS E CANCELAMENTOS
-- =====================================================
SELECT 
  p.email,
  ph.transaction_id,
  ph.amount,
  ph.status,
  ph.payment_method,
  ph.created_at
FROM payment_history ph
JOIN profiles p ON p.id = ph.user_id
WHERE ph.status IN ('refunded', 'cancelled')
ORDER BY ph.created_at DESC;

-- 12. VER ESTATÍSTICAS GERAIS
-- =====================================================
SELECT 
  COUNT(*) as total_transacoes,
  COUNT(DISTINCT user_id) as total_usuarios,
  SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as receita_total,
  SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as valor_pendente,
  SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END) as valor_reembolsado,
  AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as ticket_medio
FROM payment_history;

-- 13. VER PLANOS EXPIRANDO NOS PRÓXIMOS 7 DIAS
-- =====================================================
SELECT 
  email,
  full_name,
  plan_type,
  expires_at,
  EXTRACT(DAY FROM (expires_at - NOW())) as dias_restantes
FROM profiles
WHERE 
  plan_type IN ('starter', 'pro')
  AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY expires_at ASC;

-- 14. VER WEBHOOKS POR TIPO DE EVENTO
-- =====================================================
SELECT 
  event_type,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as sucesso,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as falhas,
  ROUND(COUNT(CASE WHEN status = 'success' THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as taxa_sucesso
FROM webhook_logs
GROUP BY event_type
ORDER BY total DESC;

-- 15. LIMPAR WEBHOOKS ANTIGOS (mais de 30 dias)
-- =====================================================
-- CUIDADO: Esta query DELETA dados!
-- DELETE FROM webhook_logs 
-- WHERE created_at < NOW() - INTERVAL '30 days';

-- 16. VER PERFORMANCE DO WEBHOOK (últimas 24h)
-- =====================================================
SELECT 
  event_type,
  status,
  COUNT(*) as total,
  MIN(created_at) as primeiro,
  MAX(created_at) as ultimo
FROM webhook_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY event_type, status
ORDER BY event_type, status;
