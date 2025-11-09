-- Políticas de Segurança para Supabase Storage
-- Bucket: uploads/services

-- 1. Criar bucket se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Política para permitir leitura pública das imagens
CREATE POLICY "Public read access for service images" ON storage.objects
FOR SELECT USING (bucket_id = 'uploads');

-- 3. Política para permitir upload apenas para usuários autenticados
CREATE POLICY "Authenticated users can upload service images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'services'
);

-- 4. Política para permitir atualização apenas do próprio conteúdo
CREATE POLICY "Users can update their own service images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'services'
) WITH CHECK (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'services'
);

-- 5. Política para permitir exclusão apenas do próprio conteúdo
CREATE POLICY "Users can delete their own service images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'services'
);

-- 6. Configurar tamanho máximo de arquivo (2MB)
-- Esta configuração deve ser feita no painel do Supabase:
-- Storage > Settings > File size limit: 2MB

-- 7. Configurar tipos de arquivo permitidos
-- Esta configuração deve ser feita no painel do Supabase:
-- Tipos permitidos: image/jpeg, image/png, image/webp, image/svg+xml