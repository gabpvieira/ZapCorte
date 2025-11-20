#!/bin/bash

echo "🚀 Iniciando build do ZapCorte..."

# Limpar cache e builds anteriores
echo "🧹 Limpando cache..."
rm -rf dist
rm -rf node_modules/.vite

# Instalar dependências
echo "📦 Instalando dependências..."
npm ci

# Build do projeto
echo "🔨 Executando build..."
npm run build

# Verificar se o build foi bem-sucedido
if [ -d "dist" ]; then
  echo "✅ Build concluído com sucesso!"
  echo "📁 Arquivos gerados:"
  ls -la dist/
  ls -la dist/assets/ || echo "⚠️ Pasta assets não encontrada"
else
  echo "❌ Erro: pasta dist não foi criada!"
  exit 1
fi

echo "🎉 Build finalizado!"
