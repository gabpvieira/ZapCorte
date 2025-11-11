-- Script para sincronizar planos entre profiles e barbershops
-- Atualiza o plan_type da barbershop para corresponder ao plan_type do profile

-- Verificar planos desincronizados
SELECT 
  b.id as barbershop_id,
  b.name as barbershop_name,
  b.plan_type as barbershop_plan,
  p.email,
  p.plan_type as profile_plan,
  p.subscription_status
FROM barbershops b
LEFT JOIN profiles p ON b.user_id = p.user_id
WHERE b.plan_type != p.plan_type
  AND p.subscription_status = 'active';

-- Atualizar barbershops para ter o mesmo plano do profile
UPDATE barbershops b
SET plan_type = p.plan_type
FROM profiles p
WHERE b.user_id = p.user_id
  AND b.plan_type != p.plan_type
  AND p.subscription_status = 'active';

-- Verificar resultado
SELECT 
  b.id as barbershop_id,
  b.name as barbershop_name,
  b.plan_type as barbershop_plan,
  p.email,
  p.plan_type as profile_plan,
  p.subscription_status
FROM barbershops b
LEFT JOIN profiles p ON b.user_id = p.user_id
WHERE p.subscription_status = 'active';
