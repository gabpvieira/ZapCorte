-- Migration: Adicionar coluna slug para serviços
-- Data: 2025-11-19
-- Descrição: Adiciona slug único GLOBAL para cada serviço (nome + código de 3 caracteres)

-- 1. Adicionar coluna slug
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Criar função para gerar código aleatório de 3 caracteres
CREATE OR REPLACE FUNCTION generate_random_code(length INTEGER DEFAULT 3)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar função para gerar slug único GLOBAL (não por barbearia)
CREATE OR REPLACE FUNCTION generate_service_slug(service_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  random_code TEXT;
  max_attempts INTEGER := 100;
  attempt INTEGER := 0;
BEGIN
  -- Converter nome para slug (lowercase, remover acentos, substituir espaços por hífen)
  base_slug := lower(trim(service_name));
  base_slug := translate(base_slug, 
    'áàâãäéèêëíìîïóòôõöúùûüçñ', 
    'aaaaaeeeeiiiiooooouuuucn'
  );
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
  
  -- Limitar tamanho do slug base
  IF length(base_slug) > 50 THEN
    base_slug := substr(base_slug, 1, 50);
  END IF;
  
  -- Gerar slug com código aleatório até encontrar um único
  WHILE attempt < max_attempts LOOP
    random_code := generate_random_code(3);
    final_slug := base_slug || '-' || random_code;
    
    -- Verificar se slug já existe GLOBALMENTE
    IF NOT EXISTS (SELECT 1 FROM services WHERE slug = final_slug) THEN
      RETURN final_slug;
    END IF;
    
    attempt := attempt + 1;
  END LOOP;
  
  -- Se não conseguiu gerar slug único, usar UUID
  RETURN base_slug || '-' || substr(md5(random()::text), 1, 6);
END;
$$ LANGUAGE plpgsql;

-- 4. Gerar slugs para serviços existentes
UPDATE services
SET slug = generate_service_slug(name)
WHERE slug IS NULL;

-- 5. Tornar slug obrigatório
ALTER TABLE services 
ALTER COLUMN slug SET NOT NULL;

-- 6. Criar índice único GLOBAL para slug
DROP INDEX IF EXISTS services_slug_barbershop_unique;
CREATE UNIQUE INDEX IF NOT EXISTS services_slug_unique 
ON services(slug);

-- 7. Criar trigger para gerar slug automaticamente em novos serviços
CREATE OR REPLACE FUNCTION auto_generate_service_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_service_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_service_slug ON services;
CREATE TRIGGER trigger_auto_generate_service_slug
  BEFORE INSERT OR UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_service_slug();

-- 8. Comentários para documentação
COMMENT ON COLUMN services.slug IS 'Slug único GLOBAL para URL amigável (formato: nome-servico-xyz)';
COMMENT ON FUNCTION generate_service_slug IS 'Gera slug único global: nome + código de 3 caracteres';
COMMENT ON FUNCTION generate_random_code IS 'Gera código aleatório de N caracteres (a-z, 0-9)';
COMMENT ON TRIGGER trigger_auto_generate_service_slug ON services IS 'Gera slug automaticamente ao criar/atualizar serviço';

-- 9. Exemplos de slugs gerados:
-- "Corte Masculino" -> "corte-masculino-a7k"
-- "Barba" -> "barba-x3m"
-- "Corte + Barba" -> "corte-barba-p9w"
