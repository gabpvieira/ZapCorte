-- =====================================================
-- VALIDAÇÃO DE LIMITE DE SERVIÇOS POR PLANO
-- =====================================================
-- 
-- Regra: Plano Freemium permite no máximo 4 serviços
-- Planos Starter e Pro: serviços ilimitados
--
-- Data: 10/11/2025
-- =====================================================

-- 1. Criar função para validar limite de serviços
CREATE OR REPLACE FUNCTION validate_service_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_barbershop_id UUID;
  v_plan_type TEXT;
  v_service_count INTEGER;
  v_max_services INTEGER;
BEGIN
  -- Buscar o barbershop_id do serviço
  v_barbershop_id := NEW.barbershop_id;
  
  -- Buscar o plano da barbearia
  SELECT plan_type INTO v_plan_type
  FROM barbershops
  WHERE id = v_barbershop_id;
  
  -- Se não encontrou a barbearia, permitir (será tratado por FK)
  IF v_plan_type IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Definir limite baseado no plano
  CASE v_plan_type
    WHEN 'freemium' THEN
      v_max_services := 4;
    WHEN 'starter' THEN
      v_max_services := 999999; -- Ilimitado
    WHEN 'pro' THEN
      v_max_services := 999999; -- Ilimitado
    ELSE
      v_max_services := 4; -- Default para freemium
  END CASE;
  
  -- Contar serviços ativos da barbearia (excluindo o atual se for UPDATE)
  IF TG_OP = 'INSERT' THEN
    SELECT COUNT(*) INTO v_service_count
    FROM services
    WHERE barbershop_id = v_barbershop_id
      AND is_active = true;
  ELSIF TG_OP = 'UPDATE' THEN
    SELECT COUNT(*) INTO v_service_count
    FROM services
    WHERE barbershop_id = v_barbershop_id
      AND is_active = true
      AND id != NEW.id;
  END IF;
  
  -- Validar limite
  IF v_service_count >= v_max_services THEN
    RAISE EXCEPTION 'LIMIT_EXCEEDED: Seu Plano % permite no máximo % serviços cadastrados. Você já possui % serviços ativos. Faça upgrade para o plano Starter ou Pro para adicionar serviços ilimitados.', 
      UPPER(v_plan_type), 
      v_max_services, 
      v_service_count
    USING ERRCODE = '23514'; -- check_violation
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar trigger BEFORE INSERT para validar ao criar serviço
DROP TRIGGER IF EXISTS trigger_validate_service_limit_insert ON services;
CREATE TRIGGER trigger_validate_service_limit_insert
  BEFORE INSERT ON services
  FOR EACH ROW
  EXECUTE FUNCTION validate_service_limit();

-- 3. Criar trigger BEFORE UPDATE para validar ao reativar serviço
DROP TRIGGER IF EXISTS trigger_validate_service_limit_update ON services;
CREATE TRIGGER trigger_validate_service_limit_update
  BEFORE UPDATE ON services
  FOR EACH ROW
  WHEN (OLD.is_active = false AND NEW.is_active = true)
  EXECUTE FUNCTION validate_service_limit();

-- 4. Comentários para documentação
COMMENT ON FUNCTION validate_service_limit() IS 
  'Valida o limite de serviços baseado no plano da barbearia. Freemium: 4 serviços, Starter/Pro: ilimitado';

COMMENT ON TRIGGER trigger_validate_service_limit_insert ON services IS 
  'Valida limite de serviços ao inserir novo serviço';

COMMENT ON TRIGGER trigger_validate_service_limit_update ON services IS 
  'Valida limite de serviços ao reativar serviço desativado';

-- =====================================================
-- TESTES
-- =====================================================

-- Teste 1: Verificar se a função foi criada
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'validate_service_limit';

-- Teste 2: Verificar se os triggers foram criados
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE 'trigger_validate_service_limit%';

-- =====================================================
-- ROLLBACK (se necessário)
-- =====================================================

-- Para remover a validação:
-- DROP TRIGGER IF EXISTS trigger_validate_service_limit_insert ON services;
-- DROP TRIGGER IF EXISTS trigger_validate_service_limit_update ON services;
-- DROP FUNCTION IF EXISTS validate_service_limit();
