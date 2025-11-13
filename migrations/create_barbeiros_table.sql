-- ============================================
-- Tabela: barbeiros
-- Descrição: Armazena informações dos barbeiros/profissionais
-- Sistema de Confirmação de Email ZapCorte
-- ============================================

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS barbeiros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso')),
  plano TEXT DEFAULT 'freemium' CHECK (plano IN ('freemium', 'premium', 'enterprise')),
  foto_url TEXT,
  bio TEXT,
  especialidades TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários na tabela
COMMENT ON TABLE barbeiros IS 'Tabela de barbeiros/profissionais do sistema';
COMMENT ON COLUMN barbeiros.auth_id IS 'Referência ao usuário no auth.users';
COMMENT ON COLUMN barbeiros.status IS 'Status do barbeiro: ativo, inativo, suspenso';
COMMENT ON COLUMN barbeiros.plano IS 'Plano de assinatura: freemium, premium, enterprise';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_barbeiros_auth_id ON barbeiros(auth_id);
CREATE INDEX IF NOT EXISTS idx_barbeiros_email ON barbeiros(email);
CREATE INDEX IF NOT EXISTS idx_barbeiros_status ON barbeiros(status);
CREATE INDEX IF NOT EXISTS idx_barbeiros_plano ON barbeiros(plano);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_barbeiros_updated_at ON barbeiros;
CREATE TRIGGER update_barbeiros_updated_at
    BEFORE UPDATE ON barbeiros
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE barbeiros ENABLE ROW LEVEL SECURITY;

-- Policy: Barbeiros podem ver apenas seus próprios dados
DROP POLICY IF EXISTS "Barbeiros podem ver seus próprios dados" ON barbeiros;
CREATE POLICY "Barbeiros podem ver seus próprios dados"
    ON barbeiros FOR SELECT
    USING (auth.uid() = auth_id);

-- Policy: Barbeiros podem atualizar apenas seus próprios dados
DROP POLICY IF EXISTS "Barbeiros podem atualizar seus próprios dados" ON barbeiros;
CREATE POLICY "Barbeiros podem atualizar seus próprios dados"
    ON barbeiros FOR UPDATE
    USING (auth.uid() = auth_id)
    WITH CHECK (auth.uid() = auth_id);

-- Policy: Permitir inserção durante o cadastro (service role)
DROP POLICY IF EXISTS "Permitir inserção de barbeiros" ON barbeiros;
CREATE POLICY "Permitir inserção de barbeiros"
    ON barbeiros FOR INSERT
    WITH CHECK (true);

-- Policy: Apenas o próprio barbeiro pode deletar sua conta
DROP POLICY IF EXISTS "Barbeiros podem deletar sua própria conta" ON barbeiros;
CREATE POLICY "Barbeiros podem deletar sua própria conta"
    ON barbeiros FOR DELETE
    USING (auth.uid() = auth_id);

-- Verificar se a tabela foi criada corretamente
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'barbeiros') THEN
        RAISE NOTICE '✅ Tabela barbeiros criada/atualizada com sucesso!';
    ELSE
        RAISE EXCEPTION '❌ Erro ao criar tabela barbeiros';
    END IF;
END $$;
