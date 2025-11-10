-- =====================================================
-- VALIDAÇÃO: Lembretes só podem ser ativados com dias de funcionamento
-- =====================================================
-- 
-- Problema: Usuários podem ativar lembretes mesmo sem ter
-- configurado nenhum dia de funcionamento
--
-- Solução: Trigger que valida se há pelo menos um dia ativo
-- antes de permitir ativar whatsapp_reminders_enabled
--
-- Data: 10/11/2025
-- =====================================================

-- 1. Criar função de validação
CREATE OR REPLACE FUNCTION validate_reminders_opening_hours()
RETURNS TRIGGER AS $$
DECLARE
  has_active_days BOOLEAN;
  day_key TEXT;
  day_value JSONB;
BEGIN
  -- Se está tentando ativar lembretes
  IF NEW.whatsapp_reminders_enabled = true AND 
     (OLD.whatsapp_reminders_enabled IS NULL OR OLD.whatsapp_reminders_enabled = false) THEN
    
    -- Verificar se opening_hours existe e não é nulo
    IF NEW.opening_hours IS NULL OR NEW.opening_hours = '{}'::jsonb THEN
      RAISE EXCEPTION 'Configure pelo menos um dia de funcionamento antes de ativar os lembretes';
    END IF;
    
    -- Verificar se há pelo menos um dia ativo (não null)
    has_active_days := false;
    
    FOR day_key IN SELECT jsonb_object_keys(NEW.opening_hours) LOOP
      day_value := NEW.opening_hours->day_key;
      
      -- Se o dia não é null, há pelo menos um dia ativo
      IF day_value IS NOT NULL AND day_value != 'null'::jsonb THEN
        has_active_days := true;
        EXIT; -- Sair do loop, já encontramos um dia ativo
      END IF;
    END LOOP;
    
    -- Se não há dias ativos, bloquear
    IF NOT has_active_days THEN
      RAISE EXCEPTION 'Configure pelo menos um dia de funcionamento antes de ativar os lembretes';
    END IF;
    
    RAISE NOTICE 'Validação OK: Barbearia % tem dias ativos configurados', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar trigger BEFORE UPDATE
DROP TRIGGER IF EXISTS trigger_validate_reminders_opening_hours ON barbershops;
CREATE TRIGGER trigger_validate_reminders_opening_hours
  BEFORE UPDATE OF whatsapp_reminders_enabled ON barbershops
  FOR EACH ROW
  EXECUTE FUNCTION validate_reminders_opening_hours();

-- 3. Comentários para documentação
COMMENT ON FUNCTION validate_reminders_opening_hours() IS 
  'Valida se há pelo menos um dia de funcionamento ativo antes de permitir ativar lembretes do WhatsApp';

COMMENT ON TRIGGER trigger_validate_reminders_opening_hours ON barbershops IS 
  'Impede ativar lembretes sem ter dias de funcionamento configurados';

-- =====================================================
-- TESTES
-- =====================================================

-- Teste 1: Verificar se o trigger foi criado
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trigger_validate_reminders_opening_hours';

-- Teste 2: Verificar barbearias com lembretes ativos mas sem dias configurados
SELECT 
  b.id,
  b.name,
  b.whatsapp_reminders_enabled,
  b.opening_hours,
  COUNT(a.id) as dias_ativos
FROM barbershops b
LEFT JOIN availability a ON a.barbershop_id = b.id AND a.is_active = true
WHERE b.whatsapp_reminders_enabled = true
GROUP BY b.id, b.name, b.whatsapp_reminders_enabled, b.opening_hours
HAVING COUNT(a.id) = 0;

-- =====================================================
-- ROLLBACK (se necessário)
-- =====================================================

-- Para remover a validação:
-- DROP TRIGGER IF EXISTS trigger_validate_reminders_opening_hours ON barbershops;
-- DROP FUNCTION IF EXISTS validate_reminders_opening_hours();
