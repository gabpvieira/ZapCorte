-- =====================================================
-- SINCRONIZAÇÃO DE HORÁRIOS: barbershops.opening_hours → availability
-- =====================================================
-- 
-- Problema: Horários configurados em "Personalizar Barbearia" não
-- estavam sendo usados nos agendamentos
--
-- Solução: Trigger que sincroniza opening_hours (JSONB) para a
-- tabela availability automaticamente
--
-- Data: 10/11/2025
-- =====================================================

-- 1. Criar função para sincronizar horários
CREATE OR REPLACE FUNCTION sync_opening_hours_to_availability()
RETURNS TRIGGER AS $$
DECLARE
  day_key TEXT;
  day_num INTEGER;
  day_hours JSONB;
  start_time TIME;
  end_time TIME;
BEGIN
  -- Se opening_hours foi modificado
  IF NEW.opening_hours IS DISTINCT FROM OLD.opening_hours OR TG_OP = 'INSERT' THEN
    
    -- Deletar horários antigos
    DELETE FROM availability WHERE barbershop_id = NEW.id;
    
    -- Se opening_hours não é nulo, processar cada dia
    IF NEW.opening_hours IS NOT NULL THEN
      -- Iterar sobre cada dia da semana (0-6)
      FOR day_num IN 0..6 LOOP
        day_key := day_num::TEXT;
        day_hours := NEW.opening_hours->day_key;
        
        -- Se o dia não é null (está aberto)
        IF day_hours IS NOT NULL AND day_hours != 'null'::jsonb THEN
          -- Extrair horários
          start_time := (day_hours->>'start')::TIME;
          end_time := (day_hours->>'end')::TIME;
          
          -- Inserir na tabela availability
          INSERT INTO availability (
            barbershop_id,
            day_of_week,
            start_time,
            end_time,
            is_active,
            created_at
          ) VALUES (
            NEW.id,
            day_num,
            start_time,
            end_time,
            true,
            NOW()
          );
          
          RAISE NOTICE 'Horário sincronizado: Dia % de % às %', day_num, start_time, end_time;
        ELSE
          RAISE NOTICE 'Dia % está fechado', day_num;
        END IF;
      END LOOP;
    END IF;
    
    RAISE NOTICE 'Sincronização de horários concluída para barbearia %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar trigger AFTER UPDATE/INSERT
DROP TRIGGER IF EXISTS trigger_sync_opening_hours ON barbershops;
CREATE TRIGGER trigger_sync_opening_hours
  AFTER INSERT OR UPDATE OF opening_hours ON barbershops
  FOR EACH ROW
  EXECUTE FUNCTION sync_opening_hours_to_availability();

-- 3. Comentários para documentação
COMMENT ON FUNCTION sync_opening_hours_to_availability() IS 
  'Sincroniza opening_hours (JSONB) da tabela barbershops para a tabela availability automaticamente';

COMMENT ON TRIGGER trigger_sync_opening_hours ON barbershops IS 
  'Sincroniza horários quando opening_hours é modificado';

-- =====================================================
-- SINCRONIZAÇÃO MANUAL DOS DADOS EXISTENTES
-- =====================================================

-- Forçar sincronização para todas as barbearias existentes
UPDATE barbershops 
SET opening_hours = opening_hours 
WHERE opening_hours IS NOT NULL;

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
WHERE trigger_name = 'trigger_sync_opening_hours';

-- Teste 2: Verificar horários sincronizados
SELECT 
  b.name,
  b.opening_hours,
  a.day_of_week,
  a.start_time,
  a.end_time,
  a.is_active
FROM barbershops b
LEFT JOIN availability a ON a.barbershop_id = b.id
WHERE b.opening_hours IS NOT NULL
ORDER BY b.name, a.day_of_week;

-- =====================================================
-- ROLLBACK (se necessário)
-- =====================================================

-- Para remover a sincronização:
-- DROP TRIGGER IF EXISTS trigger_sync_opening_hours ON barbershops;
-- DROP FUNCTION IF EXISTS sync_opening_hours_to_availability();
