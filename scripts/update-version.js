#!/usr/bin/env node

/**
 * Script para atualizar a versão do app em todos os arquivos necessários
 * 
 * Uso: node scripts/update-version.js <nova-versao>
 * Exemplo: node scripts/update-version.js 2.4.0
 */

const fs = require('fs');
const path = require('path');

const newVersion = process.argv[2];

if (!newVersion || !/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error('❌ Versão inválida! Use o formato: X.Y.Z (ex: 2.4.0)');
  process.exit(1);
}

console.log(`🚀 Atualizando versão para ${newVersion}...\n`);

// Arquivos a serem atualizados
const files = [
  {
    path: 'src/config/version.ts',
    pattern: /export const APP_VERSION = '[^']+'/,
    replacement: `export const APP_VERSION = '${newVersion}'`
  },
  {
    path: 'public/update-manager.js',
    pattern: /const APP_VERSION = '[^']+'/,
    replacement: `const APP_VERSION = '${newVersion}'`
  },
  {
    path: 'public/sw.js',
    patterns: [
      {
        pattern: /const CACHE_NAME = 'zapcorte-v[^']+'/,
        replacement: `const CACHE_NAME = 'zapcorte-v${newVersion}'`
      },
      {
        pattern: /const CACHE_VERSION = '[^']+'/,
        replacement: `const CACHE_VERSION = '${newVersion}'`
      }
    ]
  },
  {
    path: 'public/cache-buster.js',
    pattern: /const CACHE_VERSION = 'v[^']+'/,
    replacement: `const CACHE_VERSION = 'v${newVersion}'`
  },
  {
    path: 'package.json',
    pattern: /"version": "[^"]+"/,
    replacement: `"version": "${newVersion}"`
  }
];

let updatedCount = 0;
let errorCount = 0;

files.forEach(file => {
  const filePath = path.join(process.cwd(), file.path);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Arquivo não encontrado: ${file.path}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    if (file.patterns) {
      // Múltiplos padrões
      file.patterns.forEach(({ pattern, replacement }) => {
        if (pattern.test(content)) {
          content = content.replace(pattern, replacement);
          modified = true;
        }
      });
    } else {
      // Padrão único
      if (file.pattern.test(content)) {
        content = content.replace(file.pattern, file.replacement);
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${file.path}`);
      updatedCount++;
    } else {
      console.log(`⚠️  ${file.path} - Padrão não encontrado`);
    }
  } catch (error) {
    console.error(`❌ Erro ao atualizar ${file.path}:`, error.message);
    errorCount++;
  }
});

console.log(`\n📊 Resumo:`);
console.log(`   ✅ ${updatedCount} arquivos atualizados`);
if (errorCount > 0) {
  console.log(`   ❌ ${errorCount} erros`);
}

console.log(`\n🎉 Versão atualizada para ${newVersion}!`);
console.log(`\n📝 Próximos passos:`);
console.log(`   1. Revisar as mudanças: git diff`);
console.log(`   2. Atualizar CHANGELOG em src/config/version.ts`);
console.log(`   3. Commit: git commit -am "chore: bump version to ${newVersion}"`);
console.log(`   4. Push: git push`);
