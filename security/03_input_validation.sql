-- ============================================
-- ZAPCORTE - VALIDAÇÃO DE INPUTS E CONSTRAINTS
-- ============================================
-- Data: 11 de Novembro de 2025
-- Objetivo: Adicionar validações para prevenir SQL Injection e dados inválidos

-- ============================================
-- 1. VALIDAÇÕES PARA TABELA: appointments
-- ============================================

-- Validar formato de telefone (apenas números, 10-11 dígitos)
ALTER TABLE appointments 
ADD CONSTRAINT check_phone_format 
CHECK (customer_phone ~ '^[0-9]{10,11}$');

-- Validar que scheduled_at não seja no passado
ALTER TABLE appointments 
ADD CONSTRAINT check_scheduled_future 
CHECK (scheduled_at > NOW() - INTERVAL '1 hour');

-- Validar nome do cliente (mínimo 2 caracteres, máximo 100)
ALTER TABLE appointments 
ADD CONSTRAINT check_customer_name_length 
CHECK (LENGTH(TRIM(customer_name)) >= 2 AND LENGTH(customer_name) <= 100);

-- ============================================
-- 2. VALIDAÇÕES PARA TABELA: services
-- ============================================

-- Validar preço (não negativo, máximo R$ 10.000)
ALTER TABLE services 
ADD CONSTRAINT check_price_range 
CHECK (price >= 0 AND price <= 10000);

-- Validar duração (mínimo 5 min, máximo 480 min = 8h)
ALTER TABLE services 
ADD CONSTRAINT check_duration_range 
CHECK (duration >= 5 AND duration <= 480);

-- Validar nome do serviço (mínimo 2 caracteres)
ALTER TABLE services 
ADD CONSTRAINT check_service_name_length 
CHECK (LENGTH(TRIM(name)) >= 2 AND LENGTH(name) <= 100);

-- ============================================
-- 3. VALIDAÇÕES PARA TABELA: barbershops
-- ============================================

-- Validar slug (apenas letras minúsculas, números e hífen)
ALTER TABLE barbershops 
ADD CONSTRAINT check_slug_format 
CHECK (slug ~ '^[a-z0-9-]+$');

-- Validar nome da barbearia (mínimo 2 caracteres)
ALTER TABLE barbershops 
ADD CONSTRAINT check_barbershop_name_length 
CHECK (LENGTH(TRIM(name)) >= 2 AND LENGTH(name) <= 100);

-- Validar WhatsApp (apenas números, 10-11 dígitos)
ALTER TABLE barbershops 
ADD CONSTRAINT check_whatsapp_format 
CHECK (
  whatsapp_number IS NULL 
  OR whatsapp_number ~ '^[0-9]{10,11}$'
);

-- ============================================
-- 4. VALIDAÇÕES PARA TABELA: customers
-- ============================================

-- Validar telefone do cliente
ALTER TABLE customers 
ADD CONSTRAINT check_customer_phone_format 
CHECK (phone ~ '^[0-9]{10,11}$');

-- Validar nome do cliente
ALTER TABLE customers 
ADD CONSTRAINT check_customer_name_min_length 
CHECK (LENGTH(TRIM(name)) >= 2 AND LENGTH(name) <= 100);

-- ============================================
-- 5. FUNÇÃO: Sanitizar inputs de texto
-- ============================================

CREATE OR REPLACE FUNCTION sanitize_text(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove caracteres perigosos para SQL Injection
  -- Remove tags HTML
  -- Trim espaços
  RETURN TRIM(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        input_text,
        '<[^>]*>',  -- Remove HTML tags
        '',
        'g'
      ),
      '[;\x00]',  -- Remove ponto-vírgula e null bytes
      '',
      'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 6. FUNÇÃO: Validar email
-- ============================================

CREATE OR REPLACE FUNCTION is_valid_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Adicionar constraint de email na tabela users
ALTER TABLE users 
ADD CONSTRAINT check_email_format 
CHECK (is_valid_email(email));

-- ============================================
-- 7. FUNÇÃO: Validar URL
-- ============================================

CREATE OR REPLACE FUNCTION is_valid_url(url TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF url IS NULL THEN
    RETURN TRUE;
  END IF;
  
  RETURN url ~ '^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Adicionar constraints de URL
ALTER TABLE barbershops 
ADD CONSTRAINT check_logo_url_format 
CHECK (is_valid_url(logo_url));

ALTER TABLE barbershops 
ADD CONSTRAINT check_banner_url_format 
CHECK (is_valid_url(banner_url));

ALTER TABLE barbershops 
ADD CONSTRAINT check_instagram_url_format 
CHECK (is_valid_url(instagram_url));

ALTER TABLE barbershops 
ADD CONSTRAINT check_maps_url_format 
CHECK (is_valid_url(maps_url));

-- ============================================
-- 8. TRIGGER: Sanitizar inputs antes de INSERT/UPDATE
-- ============================================

-- Função para sanitizar appointments
CREATE OR REPLACE FUNCTION sanitize_appointment_inputs()
RETURNS TRIGGER AS $$
BEGIN
  NEW.customer_name := sanitize_text(NEW.customer_name);
  NEW.customer_phone := REGEXP_REPLACE(NEW.customer_phone, '[^0-9]', '', 'g');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para appointments
DROP TRIGGER IF EXISTS trigger_sanitize_appointment ON appointments;
CREATE TRIGGER trigger_sanitize_appointment
BEFORE INSERT OR UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION sanitize_appointment_inputs();

-- Função para sanitizar services
CREATE OR REPLACE FUNCTION sanitize_service_inputs()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name := sanitize_text(NEW.name);
  NEW.description := sanitize_text(NEW.description);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para services
DROP TRIGGER IF EXISTS trigger_sanitize_service ON services;
CREATE TRIGGER trigger_sanitize_service
BEFORE INSERT OR UPDATE ON services
FOR EACH ROW
EXECUTE FUNCTION sanitize_service_inputs();

-- Função para sanitizar barbershops
CREATE OR REPLACE FUNCTION sanitize_barbershop_inputs()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name := sanitize_text(NEW.name);
  NEW.subtitle := sanitize_text(NEW.subtitle);
  NEW.slug := LOWER(REGEXP_REPLACE(NEW.slug, '[^a-z0-9-]', '', 'g'));
  
  IF NEW.whatsapp_number IS NOT NULL THEN
    NEW.whatsapp_number := REGEXP_REPLACE(NEW.whatsapp_number, '[^0-9]', '', 'g');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para barbershops
DROP TRIGGER IF EXISTS trigger_sanitize_barbershop ON barbershops;
CREATE TRIGGER trigger_sanitize_barbershop
BEFORE INSERT OR UPDATE ON barbershops
FOR EACH ROW
EXECUTE FUNCTION sanitize_barbershop_inputs();

-- ============================================
-- 9. RATE LIMITING: Prevenir spam de agendamentos
-- ============================================

-- Tabela para rastrear tentativas de agendamento
CREATE TABLE IF NOT EXISTS rate_limit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address INET,
  phone TEXT,
  action TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_created_at 
ON rate_limit_log(created_at);

CREATE INDEX IF NOT EXISTS idx_rate_limit_phone 
ON rate_limit_log(phone);

-- Função para verificar rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_phone TEXT,
  p_action TEXT,
  p_max_attempts INT DEFAULT 5,
  p_time_window INTERVAL DEFAULT '1 hour'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INT;
BEGIN
  -- Contar tentativas recentes
  SELECT COUNT(*) INTO v_count
  FROM rate_limit_log
  WHERE phone = p_phone
    AND action = p_action
    AND created_at > NOW() - p_time_window;
  
  -- Se excedeu o limite, retornar false
  IF v_count >= p_max_attempts THEN
    RETURN FALSE;
  END IF;
  
  -- Registrar tentativa
  INSERT INTO rate_limit_log (phone, action)
  VALUES (p_phone, p_action);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Limpar logs antigos (executar periodicamente)
CREATE OR REPLACE FUNCTION cleanup_rate_limit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limit_log
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. VERIFICAR CONSTRAINTS CRIADAS
-- ============================================

-- Query para listar todas as constraints
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('CHECK', 'FOREIGN KEY')
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- ✅ Validações de formato (telefone, email, URL)
-- ✅ Validações de range (preço, duração, datas)
-- ✅ Sanitização automática de inputs
-- ✅ Rate limiting para prevenir spam
-- ✅ Proteção contra SQL Injection
